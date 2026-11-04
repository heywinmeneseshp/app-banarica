import React, { useCallback, useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { costosGet } from './costosApi';
import ListadoFacturas from './ListadoFacturas';
import { EstadosFacturaTab, ItemsTab, ProveedoresTab, TiposDocumentoTab } from './CatalogosCostos';
import TrmTab from './TrmTab';

const PESTANAS = [
  { clave: 'listado', etiqueta: 'Registro de facturas' },
  { clave: 'proveedores', etiqueta: 'Proveedores' },
  { clave: 'items', etiqueta: 'Maestro de ítems' },
  { clave: 'tipos', etiqueta: 'Tipos de documento' },
  { clave: 'estados', etiqueta: 'Estados de factura' },
  { clave: 'trm', etiqueta: 'TRM' },
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
    </div>
  );
}
