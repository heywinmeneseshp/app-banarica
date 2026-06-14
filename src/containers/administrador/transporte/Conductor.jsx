import { useCallback, useEffect, useMemo, useState } from 'react';
import Tablas from '@components/shared/Tablas/Tablas';
import {
  actualizarConductor,
  agregarConductor,
  buscarConductor,
  listarConductores,
  paginarConductores,
} from '@services/api/conductores';
import { listarTransportadoras } from '@services/api/transportadoras';
import { getStoredTransporters, getStoredUser } from '@utils/session';

const Conductor = () => {
  const [transportadoras, setTransportadoras] = useState([]);

  const listarCatalogos = useCallback(async () => {
    const user = getStoredUser();
    const transportadorasAsignadas = getStoredTransporters();
    const transportadorasData = user?.id_rol === 'Super administrador'
      ? await listarTransportadoras()
      : transportadorasAsignadas;

    setTransportadoras((transportadorasData || []).map((item) => ({
      id: item?.id,
      nombre: item?.razon_social || item?.nombre || item?.consecutivo,
    })));
  }, []);

  useEffect(() => {
    listarCatalogos();
  }, [listarCatalogos]);

  const listas = useMemo(() => ({
    Transportadora: transportadoras,
  }), [transportadoras]);

  const mapConductor = useCallback((item) => ({
    ...item,
    activo: !item?.isBlock,
  }), []);

  const listarConductoresNormalizados = useCallback(async () => {
    const res = await listarConductores();
    return (res || []).map(mapConductor);
  }, [mapConductor]);

  const paginarConFiltros = useCallback((page, limit, nombre, filters = {}) => (
    paginarConductores(page, limit, nombre, filters.transportadoraId || '')
      .then((res) => ({
        ...res,
        data: (res?.data || []).map(mapConductor),
      }))
  ), [mapConductor]);

  const actualizarConductorNormalizado = useCallback((id, changes) => {
    const payload = { ...changes };
    if (Object.prototype.hasOwnProperty.call(payload, 'activo')) {
      payload.isBlock = !payload.activo;
      delete payload.activo;
    }
    return actualizarConductor(id, payload);
  }, []);

  const crearConductorNormalizado = useCallback((payload) => (
    agregarConductor({
      ...payload,
      conductor: String(payload?.conductor || '').trim().toUpperCase(),
      isBlock: false,
    })
  ), []);

  return (
    <Tablas
      titulo="Conductores"
      actualizar={actualizarConductorNormalizado}
      buscarItem={buscarConductor}
      listar={listarConductoresNormalizados}
      paginar={paginarConFiltros}
      crear={crearConductorNormalizado}
      encabezados={{
        ID: 'id',
        Codigo: 'consecutivo',
        Conductor: 'conductor',
        Identificacion: 'licencia',
        Transportadora: 'cons_transportadora',
        Correo: 'email',
        Telefono: 'tel',
        Editar: '',
        Activar: 'activo',
      }}
      listas={listas}
      optionalFields={['consecutivo', 'licencia', 'email', 'tel']}
      filtrosExtra={[
        {
          name: 'transportadoraId',
          label: 'Transportadora',
          options: transportadoras,
        },
      ]}
    />
  );
};

export default Conductor;
