import React, { useCallback, useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { costosEnviar, costosGet } from './costosApi';
import ListadoFacturas from './ListadoFacturas';
import { EstadosFacturaTab, ItemsTab, ProveedoresTab, TiposDocumentoTab } from './CatalogosCostos';
import TrmTab from './TrmTab';
import CostoPorClienteTab from './CostoPorClienteTab';

const PESTANAS = [
  { clave: 'listado', etiqueta: 'Registro de facturas' },
  { clave: 'proveedores', etiqueta: 'Proveedores' },
  { clave: 'items', etiqueta: 'Maestro de ítems' },
  { clave: 'tipos', etiqueta: 'Tipos de documento' },
  { clave: 'estados', etiqueta: 'Estados de factura' },
  { clave: 'trm', etiqueta: 'TRM' },
  { clave: 'clientes', etiqueta: 'Costo por cliente' },
];

// Costos logisticos > Facturas: registro de facturas y los catalogos que usa.
export default function FacturasView() {
  const [pestana, setPestana] = useState('listado');
  const [proveedores, setProveedores] = useState([]);
  const [tiposDocs, setTiposDocs] = useState([]);
  const [estadosDocs, setEstadosDocs] = useState([]);
  const [tiposCosto, setTiposCosto] = useState([]);

  // Los catalogos que alimentan el formulario y los filtros del registro se
  // recargan al volver a esa pestana y cada vez que se cambia uno de ellos.
  const cargarCatalogos = useCallback(() => {
    costosGet('/proveedores-local').then(setProveedores).catch(() => setProveedores([]));
    costosGet('/tipos-documento').then(setTiposDocs).catch(() => setTiposDocs([]));
    costosGet('/estados-factura').then(setEstadosDocs).catch(() => setEstadosDocs([]));
    costosGet('/tipos-costo').then(setTiposCosto).catch(() => setTiposCosto([]));
  }, []);

  useEffect(() => { cargarCatalogos(); }, [cargarCatalogos, pestana]);

  // Al abrir el modulo se actualiza la TRM oficial; el servidor lo hace solo la primera
  // vez de cada dia (las demas veces responde de inmediato sin consultar). Si falla,
  // no se interrumpe nada: se reintenta en el siguiente ingreso.
  useEffect(() => {
    costosEnviar('POST', '/trm/sincronizar-diaria')
      .then((r) => { if (r.ok && r.data && !r.data.omitida) cargarCatalogos(); })
      .catch(() => {});
  }, [cargarCatalogos]);

  return (
    <div className="container-fluid pt-3">
      <Nav variant="tabs" activeKey={pestana} onSelect={(k) => setPestana(k)} className="mb-3 flex-wrap">
        {PESTANAS.map((p) => (
          <Nav.Item key={p.clave}>
            <Nav.Link eventKey={p.clave}>{p.etiqueta}</Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {pestana === 'listado' && (
        <ListadoFacturas proveedores={proveedores} tiposDocs={tiposDocs} estadosDocs={estadosDocs} tiposCosto={tiposCosto} />
      )}
      {pestana === 'proveedores' && <ProveedoresTab onCambio={cargarCatalogos} />}
      {pestana === 'items' && <ItemsTab onCambio={cargarCatalogos} />}
      {pestana === 'tipos' && <TiposDocumentoTab onCambio={cargarCatalogos} />}
      {pestana === 'estados' && <EstadosFacturaTab onCambio={cargarCatalogos} />}
      {pestana === 'trm' && <TrmTab onCambio={cargarCatalogos} />}
      {pestana === 'clientes' && <CostoPorClienteTab />}
    </div>
  );
}
