import { useCallback, useEffect, useState } from 'react';
import { encontrarModulo, actualizarModulo } from '@services/api/configuracion';

const MODULO_GLOBALES = 'ProgramadorColumnasGlobales';
const MODULO_USUARIO_PREFIX = 'ProgramadorColumnasUsuario_';

const parsearPresets = (res) => {
  try {
    const detalles = typeof res?.[0]?.detalles === 'string'
      ? JSON.parse(res[0].detalles)
      : (res?.[0]?.detalles || {});
    return Array.isArray(detalles.presets)
      ? detalles.presets.filter((p) => p && p.id && p.nombre && p.columnas)
      : [];
  } catch {
    return [];
  }
};

// Configuraciones guardadas de columnas del Programador: las personales viven
// en un modulo por usuario y las globales en uno compartido (solo las escribe
// un Super administrador — el backend tambien lo valida). Cada usuario solo
// carga sus propias configuraciones y las globales.
export default function useProgramadorColumnPresets({ username, isSuperAdmin }) {
  const [presetsUsuario, setPresetsUsuario] = useState([]);
  const [presetsGlobales, setPresetsGlobales] = useState([]);

  const moduloUsuario = username ? `${MODULO_USUARIO_PREFIX}${username}` : '';

  useEffect(() => {
    if (!moduloUsuario) return undefined;
    let cancelado = false;
    (async () => {
      const [propias, globales] = await Promise.all([
        encontrarModulo(moduloUsuario, { syncWeeks: false }).catch(() => []),
        encontrarModulo(MODULO_GLOBALES, { syncWeeks: false }).catch(() => []),
      ]);
      if (cancelado) return;
      setPresetsUsuario(parsearPresets(propias));
      setPresetsGlobales(parsearPresets(globales));
    })();
    return () => { cancelado = true; };
  }, [moduloUsuario]);

  const persistir = useCallback(async (modulo, presets) => {
    await actualizarModulo({ modulo, detalles: JSON.stringify({ presets }) });
  }, []);

  // Guardar con un nombre que ya existe en el mismo ambito (personal o
  // global) la reemplaza.
  const guardarPreset = useCallback(async ({ nombre, columnas, global = false }) => {
    const limpio = String(nombre || '').trim();
    if (!limpio) throw new Error('Escriba un nombre para la configuracion.');
    if (global && !isSuperAdmin) throw new Error('Solo un Super administrador puede guardar configuraciones globales.');

    const actuales = global ? presetsGlobales : presetsUsuario;
    const existente = actuales.find((p) => p.nombre.toLowerCase() === limpio.toLowerCase());
    const nuevo = { id: existente?.id || `${Date.now()}`, nombre: limpio, columnas };
    const siguientes = existente
      ? actuales.map((p) => (p.id === existente.id ? nuevo : p))
      : [...actuales, nuevo];

    await persistir(global ? MODULO_GLOBALES : moduloUsuario, siguientes);
    if (global) setPresetsGlobales(siguientes);
    else setPresetsUsuario(siguientes);
    return nuevo;
  }, [isSuperAdmin, moduloUsuario, persistir, presetsGlobales, presetsUsuario]);

  const eliminarPreset = useCallback(async (preset, global = false) => {
    if (global && !isSuperAdmin) throw new Error('Solo un Super administrador puede eliminar configuraciones globales.');
    const actuales = global ? presetsGlobales : presetsUsuario;
    const siguientes = actuales.filter((p) => p.id !== preset.id);
    await persistir(global ? MODULO_GLOBALES : moduloUsuario, siguientes);
    if (global) setPresetsGlobales(siguientes);
    else setPresetsUsuario(siguientes);
  }, [isSuperAdmin, moduloUsuario, persistir, presetsGlobales, presetsUsuario]);

  return { presetsUsuario, presetsGlobales, guardarPreset, eliminarPreset };
}
