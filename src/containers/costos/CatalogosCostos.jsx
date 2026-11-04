import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button } from 'react-bootstrap';
import CatalogoCrud from './CatalogoCrud';
import { costosGet, formatoNumero } from './costosApi';

export function ProveedoresTab({ onCambio }) {
  return (
    <CatalogoCrud
      titulo="Proveedores"
      singular="proveedor"
      endpoint="/proveedores-local"
      claveFila="nit"
      vacio={{ nit: '', nombre: '', razon_social: '' }}
      filtrarTexto={(f) => [f.nit, f.nombre, f.razon_social]}
      columnas={[
        { etiqueta: 'NIT', campo: 'nit' },
        { etiqueta: 'Nombre', campo: 'nombre' },
        { etiqueta: 'Razón social', campo: 'razon_social' },
      ]}
      campos={[
        { clave: 'nit', etiqueta: 'NIT', requerido: true, soloAlCrear: true, placeholder: 'Ej. 900123456' },
        { clave: 'nombre', etiqueta: 'Nombre', requerido: true },
        { clave: 'razon_social', etiqueta: 'Razón social', ancho: 12, placeholder: 'Opcional' },
      ]}
      eliminar={(f) => ({ ruta: '/proveedores-local', cuerpo: { nit: f.nit } })}
      masivo={{
        apiUrl: '/proveedores-local',
        templateName: 'plantilla_proveedores',
        notas: ['NIT y Nombre son obligatorios.', 'Si el NIT ya existe, se actualizan su nombre y razón social; si no, se crea el proveedor.'],
        columns: [
          { key: 'nit', label: 'NIT', required: true, example: '900123456' },
          { key: 'nombre', label: 'Nombre', required: true, example: 'Proveedor Ejemplo' },
          { key: 'razon_social', label: 'Razon Social', required: false, example: 'Proveedor Ejemplo S.A.S' },
        ],
      }}
      onCambio={onCambio}
    />
  );
}

export function ItemsTab({ onCambio }) {
  const [tiposCosto, setTiposCosto] = useState([]);

  useEffect(() => {
    costosGet('/tipos-costo').then(setTiposCosto).catch(() => setTiposCosto([]));
  }, []);

  return (
    <CatalogoCrud
      titulo="Maestro de ítems"
      singular="ítem"
      endpoint="/items-catalog"
      vacio={{ codigo: '', nombre: '', descripcion: '', unidad: '', precio_ref: '', tipo_costo_default: '' }}
      filtrarTexto={(f) => [f.codigo, f.nombre, f.descripcion]}
      columnas={[
        { etiqueta: 'Código', campo: 'codigo' },
        { etiqueta: 'Nombre', campo: 'nombre' },
        { etiqueta: 'Descripción', campo: 'descripcion' },
        { etiqueta: 'Unidad', campo: 'unidad' },
        { etiqueta: 'Precio ref.', render: (f) => (f.precio_ref != null ? formatoNumero(f.precio_ref) : '—') },
        {
          etiqueta: 'Tipo de costo',
          render: (f) => (f.tipo_costo_default
            ? <Badge bg="secondary">{f.tipo_costo_default}</Badge>
            : <Badge bg="warning" text="dark">Sin tipo</Badge>),
        },
      ]}
      campos={[
        { clave: 'codigo', etiqueta: 'Código', placeholder: 'MOV-01' },
        { clave: 'nombre', etiqueta: 'Nombre', requerido: true },
        { clave: 'descripcion', etiqueta: 'Descripción', ancho: 12, placeholder: 'Opcional' },
        { clave: 'unidad', etiqueta: 'Unidad', ancho: 4, placeholder: 'Und' },
        { clave: 'precio_ref', etiqueta: 'Precio de referencia', tipo: 'number', ancho: 4 },
        {
          clave: 'tipo_costo_default',
          etiqueta: 'Tipo de costo',
          tipo: 'select',
          ancho: 4,
          sinOpcion: '— Sin tipo —',
          opciones: tiposCosto.map((t) => ({ valor: t.codigo, etiqueta: t.nombre })),
        },
      ]}
      filtrosExtra={[{
        clave: 'tipo',
        etiqueta: 'Todos los tipos',
        opciones: [{ valor: '__sin_tipo__', etiqueta: 'Sin tipo asignado' }, ...tiposCosto.map((t) => ({ valor: t.codigo, etiqueta: t.nombre }))],
        aplicar: (f, valor) => (valor === '__sin_tipo__' ? !f.tipo_costo_default : f.tipo_costo_default === valor),
      }]}
      renderAviso={({ filas, filtros, setFiltros }) => {
        const sinTipo = filas.filter((f) => !f.tipo_costo_default).length;
        if (!sinTipo) return null;
        return (
          <Alert variant="warning" className="py-2 small d-flex flex-wrap align-items-center gap-2">
            <span><strong>{sinTipo}</strong> ítem(s) sin tipo de costo asignado: el motor de distribución los ignorará.</span>
            {filtros.tipo === '__sin_tipo__'
              ? <Button size="sm" variant="outline-secondary" onClick={() => setFiltros((p) => ({ ...p, tipo: '' }))}>Mostrar todos</Button>
              : <Button size="sm" variant="warning" onClick={() => setFiltros((p) => ({ ...p, tipo: '__sin_tipo__' }))}>Ver solo estos</Button>}
          </Alert>
        );
      }}
      eliminar={(f) => ({ ruta: '/items-catalog', cuerpo: { id: f.id } })}
      masivo={{
        apiUrl: '/items-catalog',
        templateName: 'plantilla_items',
        notas: ['El Nombre es obligatorio.', 'Cada fila crea un ítem nuevo: este cargue no actualiza ítems existentes ni revisa duplicados.', 'Después de cargar, asigne el tipo de costo a cada ítem (el motor de distribución ignora los ítems sin tipo).'],
        columns: [
          { key: 'codigo', label: 'Codigo', required: false, example: 'MOV-01' },
          { key: 'nombre', label: 'Nombre', required: true, example: 'Movilización' },
          { key: 'descripcion', label: 'Descripcion', required: false, example: 'Movilización de contenedor' },
          { key: 'unidad', label: 'Unidad', required: false, example: 'Und' },
          { key: 'precio_ref', label: 'Precio Ref', required: false, example: '150000' },
        ],
      }}
      onCambio={onCambio}
    />
  );
}

export function TiposDocumentoTab({ onCambio }) {
  return (
    <CatalogoCrud
      titulo="Tipos de documento"
      singular="tipo de documento"
      endpoint="/tipos-documento"
      vacio={{ nombre: '', sentido: 'resta', descripcion: '' }}
      filtrarTexto={(f) => [f.nombre, f.descripcion]}
      columnas={[
        { etiqueta: 'Nombre', campo: 'nombre' },
        {
          etiqueta: 'Sentido',
          render: (f) => (f.sentido === 'suma'
            ? <Badge bg="success">↑ Entrada</Badge>
            : <Badge bg="danger">↓ Salida</Badge>),
        },
        { etiqueta: 'Descripción', campo: 'descripcion' },
      ]}
      campos={[
        { clave: 'nombre', etiqueta: 'Nombre', requerido: true, placeholder: 'Ej. Nota Crédito' },
        {
          clave: 'sentido',
          etiqueta: 'Sentido',
          tipo: 'select',
          requerido: true,
          opciones: [{ valor: 'resta', etiqueta: '↓ Salida (resta)' }, { valor: 'suma', etiqueta: '↑ Entrada (suma)' }],
        },
        { clave: 'descripcion', etiqueta: 'Descripción', ancho: 12, placeholder: 'Opcional' },
      ]}
      eliminar={(f) => ({ ruta: `/tipos-documento?id=${f.id}` })}
      onCambio={onCambio}
    />
  );
}

export function EstadosFacturaTab({ onCambio }) {
  return (
    <CatalogoCrud
      titulo="Estados de factura"
      singular="estado"
      endpoint="/estados-factura"
      vacio={{ nombre: '', color: '#6c757d', descripcion: '' }}
      filtrarTexto={(f) => [f.nombre, f.descripcion]}
      columnas={[
        { etiqueta: 'Estado', render: (f) => <span className="badge" style={{ background: f.color }}>{f.nombre}</span> },
        { etiqueta: 'Descripción', campo: 'descripcion' },
      ]}
      campos={[
        { clave: 'nombre', etiqueta: 'Nombre', requerido: true, ancho: 12, placeholder: 'Ej. Pendiente de revisión' },
        { clave: 'color', etiqueta: 'Color', tipo: 'color', ancho: 12 },
        { clave: 'descripcion', etiqueta: 'Descripción', ancho: 12, placeholder: 'Opcional' },
      ]}
      eliminar={(f) => ({ ruta: `/estados-factura?id=${f.id}` })}
      onCambio={onCambio}
    />
  );
}
