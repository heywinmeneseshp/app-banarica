# Auditoria de relaciones API / MySQL

- Fecha: 2026-05-12T13:42:49.223Z
- API auditada: `C:\Users\onides\Documents\GitHub\api-rest-banarica`

## Resumen

- Modelos revisados: 52
- Migraciones revisadas: 61
- Asociaciones sospechosas: 25
- Columnas tipo FK/relacion sin `references` en migraciones: 67
- Tablas creadas sin ninguna referencia declarada: 47

## Asociaciones sospechosas en modelos

- `consumo_ruta_vehiculo.js`: `hasOne` hacia `vehiculo` con foreignKey=`id`, sourceKey=`vehiculo_id`, targetKey=`-`
- `consumo_ruta_vehiculo.js`: `hasOne` hacia `rutas` con foreignKey=`id`, sourceKey=`ruta_id`, targetKey=`-`
- `embarque.js`: `hasOne` hacia `Destino` con foreignKey=`id`, sourceKey=`id_destino`, targetKey=`-`
- `embarque.js`: `hasOne` hacia `Naviera` con foreignKey=`id`, sourceKey=`id_naviera`, targetKey=`-`
- `embarque.js`: `hasOne` hacia `clientes` con foreignKey=`id`, sourceKey=`id_cliente`, targetKey=`-`
- `embarque.js`: `hasOne` hacia `Buque` con foreignKey=`id`, sourceKey=`id_buque`, targetKey=`-`
- `galones_por_ruta.js`: `hasOne` hacia `rutas` con foreignKey=`id`, sourceKey=`ruta_id`, targetKey=`-`
- `galones_por_ruta.js`: `hasOne` hacia `categoria_vehiculos` con foreignKey=`id`, sourceKey=`categoria_id`, targetKey=`-`
- `listado.js`: `hasOne` hacia `Contenedor` con foreignKey=`id`, sourceKey=`id_contenedor`, targetKey=`-`
- `listado.js`: `hasOne` hacia `Embarque` con foreignKey=`id`, sourceKey=`id_embarque`, targetKey=`-`
- `listado.js`: `hasOne` hacia `almacenes` con foreignKey=`id`, sourceKey=`id_lugar_de_llenado`, targetKey=`-`, as=`almacen`
- `listado.js`: `hasOne` hacia `combos` con foreignKey=`id`, sourceKey=`id_producto`, targetKey=`-`
- `notificaciones.js`: `hasOne` hacia `vehiculo` con foreignKey=`id`, sourceKey=`id_vehiculo`, targetKey=`-`
- `productos.js`: `hasOne` hacia `categorias` con foreignKey=`consecutivo`, sourceKey=`cons_categoria`, targetKey=`-`, as=`categoria`
- `programacion.js`: `hasOne` hacia `conductores` con foreignKey=`id`, sourceKey=`conductor_id`, targetKey=`-`, as=`conductor`
- `programacion.js`: `hasOne` hacia `clientes` con foreignKey=`id`, sourceKey=`id_pagador_flete`, targetKey=`-`
- `programacion.js`: `hasOne` hacia `rutas` con foreignKey=`id`, sourceKey=`ruta_id`, targetKey=`-`
- `programacion.js`: `hasOne` hacia `vehiculo` con foreignKey=`id`, sourceKey=`vehiculo_id`, targetKey=`-`
- `record_consumo.js`: `hasOne` hacia `vehiculo` con foreignKey=`id`, sourceKey=`vehiculo_id`, targetKey=`-`
- `record_consumo.js`: `hasOne` hacia `conductores` con foreignKey=`id`, sourceKey=`conductor_id`, targetKey=`-`
- `serial_de_articulos.js`: `hasOne` hacia `Contenedor` con foreignKey=`id`, sourceKey=`id_contenedor`, targetKey=`-`, as=`contenedor`
- `serial_de_articulos.js`: `hasOne` hacia `Inspeccion` con foreignKey=`id_contenedor`, sourceKey=`id_contenedor`, targetKey=`-`
- `serial_de_articulos.js`: `hasOne` hacia `Rechazo` con foreignKey=`id_contenedor`, sourceKey=`id_contenedor`, targetKey=`-`
- `serial_de_articulos.js`: `hasOne` hacia `MotivoDeUso` con foreignKey=`id`, sourceKey=`id_motivo_de_uso`, targetKey=`-`
- `serial_de_articulos.js`: `hasOne` hacia `usuarios` con foreignKey=`id`, sourceKey=`id_usuario`, targetKey=`-`, as=`usuario`

## Columnas relacionales sin FK real en migraciones

- `almacenes_por_usuario.js` -> columna `id_almacen`
- `buque.js` -> columna `id_naviera`
- `caida.js` -> columna `id_contenedor`
- `caida.js` -> columna `id_producto`
- `caida.js` -> columna `id_motivo`
- `combocliente.js` -> columna `id_cliente`
- `combocliente.js` -> columna `id_combos`
- `combos.js` -> columna `id_cliente`
- `conductores.js` -> columna `cons_transportadora`
- `consumo_ruta_vehiculo.js` -> columna `vehiculo_id`
- `consumo_ruta_vehiculo.js` -> columna `ruta_id`
- `embarque.js` -> columna `id_semana`
- `embarque.js` -> columna `id_cliente`
- `embarque.js` -> columna `id_destino`
- `embarque.js` -> columna `id_naviera`
- `embarque.js` -> columna `id_buque`
- `galones_por_ruta.js` -> columna `ruta_id`
- `galones_por_ruta.js` -> columna `categoria_id`
- `historial_movimientos.js` -> columna `cons_movimiento`
- `historial_movimientos.js` -> columna `cons_almacen_gestor`
- `historial_movimientos.js` -> columna `cons_almacen_receptor`
- `historial_movimientos.js` -> columna `cons_lista_movimientos`
- `historial_movimientos.js` -> columna `cons_pedido`
- `inspeccion.js` -> columna `id_contenedor`
- `inspeccion.js` -> columna `cons_movimiento`
- `listado.js` -> columna `id_embarque`
- `listado.js` -> columna `id_contenedor`
- `listado.js` -> columna `id_lugar_de_llenado`
- `listado.js` -> columna `id_producto`
- `listado.js` -> columna `id_sae`
- `movimientos.js` -> columna `cons_semana`
- `notificaciones.js` -> columna `cons_movimiento`
- `notificaciones.js` -> columna `id_vehiculo`
- `pedidos.js` -> columna `cons_pedido`
- `pedidos.js` -> columna `cons_almacen_destino`
- `productos.js` -> columna `cons_categoria`
- `productos.js` -> columna `cons_proveedor`
- `productos_viaje.js` -> columna `programacion_id`
- `productos_viaje.js` -> columna `producto_id`
- `programacion.js` -> columna `ruta_id`
- `programacion.js` -> columna `id_pagador_flete`
- `programacion.js` -> columna `conductor_id`
- `programacion.js` -> columna `vehiculo_id`
- `rechazo.js` -> columna `id_producto`
- `rechazo.js` -> columna `id_motivo_de_rechazo`
- `rechazo.js` -> columna `id_contenedor`
- `rechazo.js` -> columna `id_usuario`
- `record_consumo.js` -> columna `vehiculo_id`
- `record_consumo.js` -> columna `conductor_id`
- `sae.js` -> columna `id_embarque`
- `serialarticuloporcontenedor.js` -> columna `id_serial_articulo`
- `serialarticuloporcontenedor.js` -> columna `id_contenedor`
- `serial_de_articulos.js` -> columna `cons_almacen`
- `serial_de_articulos.js` -> columna `cons_movimiento`
- `serial_de_articulos.js` -> columna `id_contenedor`
- `serial_de_articulos.js` -> columna `id_motivo_de_uso`
- `serial_de_articulos.js` -> columna `id_usuario`
- `stock.js` -> columna `cons_almacen`
- `tabla_combos.js` -> columna `cons_combo`
- `tabla_pedidos.js` -> columna `cons_semana`
- `tanqueos.js` -> columna `record_consumo_id`
- `tanqueos.js` -> columna `vehiculo_id`
- `transbordo.js` -> columna `id_contenedor_viejo`
- `transbordo.js` -> columna `id_contenedor_nuevo`
- `usuarios.js` -> columna `id_rol`
- `vehiculo.js` -> columna `conductor_id`
- `vehiculo.js` -> columna `categoria_id`

## Tablas creadas sin references

- `almacenes` (20220713020152-create-almacenes.js)
- `almacenes_por_usuarios` (20220717185822-create-almacenes-por-usuario.js)
- `avisos` (20220713021006-create-avisos.js)
- `Buques` (20240802205922-create-buque.js)
- `Caidas` (20240802210045-create-caida.js)
- `categoria_vehiculos` (20240303054647-create-categoria_vehiculos.js)
- `categorias` (20220713021025-create-categorias.js)
- `clientes` (20240303051612-create-clientes.js)
- `ComboClientes` (20240802211937-create-combo-cliente.js)
- `combos` (20220713021215-create-combos.js)
- `conductores` (20220713034838-create-conductores.js)
- `configuracions` (20221017150824-create-configuracion.js)
- `consumo_ruta_vehiculo` (20260419120000-create-consumo-ruta-vehiculo.js)
- `Contenedors` (20240802210151-create-contenedor.js)
- `Destinos` (20240802210312-create-destino.js)
- `deudas` (20220713145551-create-deudas.js)
- `Embarques` (20240802210405-create-embarque.js)
- `Empresas` (20240811140440-create-empresa.js)
- `etiqueta` (20230208005122-create-etiqueta.js)
- `galones_por_ruta` (20240303051414-create-galones-por-ruta.js)
- `historial_movimientos` (20220713190915-create-historial-movimientos.js)
- `Inspeccions` (20240802210503-create-inspeccion.js)
- `Listados` (20240802211131-create-listado.js)
- `MotivoDeRechazos` (20240802211213-create-motivo-de-rechazo.js)
- `MotivoDeUsos` (20240802211241-create-motivo-de-uso.js)
- `movimientos` (20220713200116-create-movimientos.js)
- `Navieras` (20240802211643-create-naviera.js)
- `notificaciones` (20220713202448-create-notificaciones.js)
- `pedidos` (20220713204933-create-pedidos.js)
- `productos_viajes` (20240303054647-create-productos_viajes.js)
- `programacions` (20240303052149-create-programacion copy.js)
- `proveedores` (20220714000954-create-proveedores.js)
- `Rechazos` (20240802212037-create-rechazo.js)
- `record_consumos` (20240303051817-create-record_consumos.js)
- `rutas` (20240303050639-create-rutas.js)
- `SAEs` (20240802212239-create-sae.js)
- `semanas` (20220714001142-create-semanas.js)
- `tabla_pedidos` (20220713214213-create-tabla-pedidos.js)
- `tanqueos` (20240310191712-create-tanqueos.js)
- `Termoregistros` (20260226203426-create-termoregistro.js)
- `tipo_movimiento_vehiculos` (20260423140000-create-tipo-movimiento-vehiculos.js)
- `Transbordos` (20240802212350-create-transbordo.js)
- `transportadoras` (20220714001148-create-transportadoras.js)
- `traslados` (20220714025235-create-traslados.js)
- `ubicaciones` (20240303051213-create-ubicaciones.js)
- `usuarios` (20220713020349-create-usuarios.js)
- `vehiculos` (20251104224043-create-vehiculos-table.js)

## Hallazgos clave

- El esquema depende mucho mas de asociaciones Sequelize que de llaves foraneas reales en MySQL.
- Varias relaciones de tipo padre-hijo estan modeladas como `hasOne` cuando por semantica de la columna local parecen `belongsTo`.
- Al migrar entre servidores MySQL, esto deja espacio para datos huerfanos, diferencias de orden de carga y errores al intentar recrear integridad referencial.

## Ejemplos de alto riesgo

- `Listado.id_embarque`, `Listado.id_contenedor`, `Listado.id_lugar_de_llenado`, `Listado.id_producto`: no tienen FK real en la migracion de `Listados`.
- `Embarques.id_semana`, `id_cliente`, `id_destino`, `id_naviera`, `id_buque`: tampoco tienen `references` en su migracion.
- `Inspeccions.id_contenedor` no tiene FK real en migracion.
- `Transbordos.id_contenedor_viejo` e `id_contenedor_nuevo` no tienen FK real.
- `serial_de_articulos` solo declara referencia para `cons_producto`; `id_contenedor`, `id_motivo_de_uso`, `id_usuario`, `cons_movimiento` quedaron sin FK.

## Recomendacion tecnica

1. Corregir asociaciones Sequelize para usar `belongsTo` donde la tabla actual guarda la FK.
2. Crear migraciones nuevas para agregar FKs reales en MySQL, con limpieza previa de datos huerfanos.
3. Auditar datos existentes antes de activar FKs para evitar que el alter falle.
4. Si el dump falla al importar, revisar tambien `DEFINER`, charset/collation y version del motor MySQL.

