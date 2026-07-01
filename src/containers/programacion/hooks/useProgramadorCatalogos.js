import { useEffect, useState } from 'react';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import { listarVehiculo } from '@services/api/vehiculos';
import { listarTransportadoras } from '@services/api/transportadoras';
import { catalogoEmbarques } from '@services/api/embarques';
import { listarCombos } from '@services/api/combos';
import { listartipoMovimientoVehiculos } from '@services/api/tipoMovimientoVehiculos';
import { encontrarModulo } from '@services/api/configuracion';
import { filtrarProductos } from '@services/api/productos';
import { getStoredTransporters } from '@utils/session';
import {
  ROL_SUPER_ADMIN,
  INSUMOS_PROGRAMADOR_MODULE_PREFIX,
  EVIDENCIAS_DRIVE_MODULE,
  DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID,
  parseVehiculosSinCombustible,
  parseEvidenciasDriveFolderId,
  parseInsumosConfig,
} from '../programadorUtils';

export function useProgramadorCatalogos({ setAlert }) {
  const [catalogsReady, setCatalogsReady] = useState(false);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [embarques, setEmbarques] = useState([]);
  const [combos, setCombos] = useState([]);
  const [tiposMovimiento, setTiposMovimiento] = useState([]);
  const [vehiculosSinCombustible, setVehiculosSinCombustible] = useState([]);
  const [configuracionInsumos, setConfiguracionInsumos] = useState([]);
  const [evidenciasDriveFolderId, setEvidenciasDriveFolderId] = useState(DEFAULT_EVIDENCIAS_DRIVE_FOLDER_ID);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [canActualizarPendientes, setCanActualizarPendientes] = useState(false);
  const [canEditarProgramador, setCanEditarProgramador] = useState(false);
  const [transportadoras, setTransportadoras] = useState([]);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const usuario = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('usuario') || '{}') : {};
        setCurrentUsername(usuario?.username || '');
        const superAdmin = usuario?.id_rol === ROL_SUPER_ADMIN;
        setIsSuperAdmin(superAdmin);

        const transportadorasDisponibles = superAdmin
          ? (await listarTransportadoras()) || []
          : getStoredTransporters();
        setTransportadoras(transportadorasDisponibles);

        const requests = [
          listarUbicaciones(),
          listarConductores(),
          listarVehiculo(),
          catalogoEmbarques(),
          listarCombos(),
          listartipoMovimientoVehiculos(),
          encontrarModulo('Programador_combustible'),
          encontrarModulo(EVIDENCIAS_DRIVE_MODULE).catch(() => []),
          encontrarModulo(`${INSUMOS_PROGRAMADOR_MODULE_PREFIX}${usuario?.username || ''}`).catch(() => []),
        ];

        if (!superAdmin && usuario?.username) {
          requests.push(encontrarModulo(usuario.username));
        }

        const [
          newUbicaciones, newConductores, newVehiculos, newEmbarques,
          newCombos, newTiposMovimiento, configProgramador, driveConfig,
          insumosConfig, userConfig,
        ] = await Promise.all(requests);

        const insumosConsecutivos = parseInsumosConfig(insumosConfig);
        const insumos = insumosConsecutivos.length
          ? await filtrarProductos({ producto: { consecutivo: insumosConsecutivos } })
          : [];

        const transportadoraIdSet = new Set(transportadorasDisponibles.map((t) => String(t.id)));
        const filtrarPorTransportadora = !superAdmin && transportadoraIdSet.size > 0;

        const conductoresFiltrados = filtrarPorTransportadora
          ? (newConductores || []).filter((c) => transportadoraIdSet.has(String(c.cons_transportadora)))
          : (newConductores || []);

        const vehiculosFiltrados = filtrarPorTransportadora
          ? (newVehiculos || []).filter((v) => transportadoraIdSet.has(String(v.transportadoraId)))
          : (newVehiculos || []);

        setUbicaciones(newUbicaciones || []);
        setConductores(conductoresFiltrados.sort((a, b) => String(a.conductor).localeCompare(String(b.conductor))));
        setVehiculos(vehiculosFiltrados.sort((a, b) => String(a.placa).localeCompare(String(b.placa))));
        setEmbarques(newEmbarques || []);
        setCombos(newCombos || []);
        setTiposMovimiento(newTiposMovimiento || []);
        setConfiguracionInsumos(
          insumosConsecutivos
            .map((consecutivo) => (insumos || []).find((item) => String(item?.consecutivo) === String(consecutivo)))
            .filter(Boolean)
        );
        setVehiculosSinCombustible(parseVehiculosSinCombustible(configProgramador));
        setEvidenciasDriveFolderId(parseEvidenciasDriveFolderId(driveConfig));

        if (superAdmin) {
          setCanActualizarPendientes(true);
          setCanEditarProgramador(true);
        } else {
          let botones = [];
          try {
            const detalles = JSON.parse(userConfig?.[0]?.detalles || '{}');
            botones = Array.isArray(detalles?.botones) ? detalles.botones : [];
          } catch {
            botones = [];
          }
          setCanActualizarPendientes(botones.includes('programador_actualizar_pendientes'));
          setCanEditarProgramador(botones.includes('programador_edicion'));
        }

        setCatalogsReady(true);
      } catch (error) {
        setAlert({
          active: true,
          mensaje: error.message || 'No fue posible cargar los datos de configuración.',
          color: 'danger',
          autoClose: true,
        });
      }
    };

    cargarCatalogos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    catalogsReady,
    ubicaciones,
    conductores,
    vehiculos,
    embarques,
    combos,
    tiposMovimiento,
    vehiculosSinCombustible,
    configuracionInsumos,
    evidenciasDriveFolderId,
    isSuperAdmin,
    canActualizarPendientes,
    canEditarProgramador,
    transportadoras,
    currentUsername,
  };
}
