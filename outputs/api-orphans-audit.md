# Auditoria de huerfanos y llaves foraneas reales

- Fecha: 2026-05-12T13:52:36.095Z
- Base evaluada: `joeyropa_prueba_banarica`

## Resumen

- Tablas detectadas: 53
- FKs reales en information_schema: 7
- Relaciones auditadas: 36
- Relaciones con huerfanos: 6
- Relaciones con tablas faltantes o no detectadas: 2

## Relaciones con huerfanos

- `historial_movimientos.cons_movimiento` -> `movimientos.consecutivo`: 3117 huerfanos de 34207 filas enlazadas (sin FK real)
- `serial_de_articulos.cons_movimiento` -> `movimientos.consecutivo`: 2118 huerfanos de 76513 filas enlazadas (sin FK real)
- `serial_de_articulos.id_motivo_de_uso` -> `MotivoDeUsos.id`: 2118 huerfanos de 83527 filas enlazadas (sin FK real)
- `serial_de_articulos.id_usuario` -> `usuarios.id`: 2118 huerfanos de 79335 filas enlazadas (sin FK real)
- `usuarios.id_rol` -> `categorias.id`: 27 huerfanos de 27 filas enlazadas (sin FK real)
- `productos.cons_proveedor` -> `proveedores.consecutivo`: 1 huerfanos de 14 filas enlazadas (sin FK real)

## Relaciones auditadas sin huerfanos

- `Listados.id_embarque` -> `Embarques.id`: 0 huerfanos sobre 6503 filas (FK real presente)
- `Listados.id_contenedor` -> `Contenedors.id`: 0 huerfanos sobre 6503 filas (FK real presente)
- `Listados.id_lugar_de_llenado` -> `almacenes.id`: 0 huerfanos sobre 6503 filas (sin FK real)
- `Listados.id_producto` -> `combos.id`: 0 huerfanos sobre 6503 filas (sin FK real)
- `Listados.id_sae` -> `SAEs.id`: 0 huerfanos sobre 0 filas (sin FK real)
- `Embarques.id_semana` -> `semanas.id`: 0 huerfanos sobre 600 filas (sin FK real)
- `Embarques.id_cliente` -> `clientes.id`: 0 huerfanos sobre 600 filas (sin FK real)
- `Embarques.id_destino` -> `Destinos.id`: 0 huerfanos sobre 600 filas (sin FK real)
- `Embarques.id_naviera` -> `Navieras.id`: 0 huerfanos sobre 600 filas (sin FK real)
- `Embarques.id_buque` -> `Buques.id`: 0 huerfanos sobre 600 filas (sin FK real)
- `Inspeccions.id_contenedor` -> `Contenedors.id`: 0 huerfanos sobre 2498 filas (sin FK real)
- `Inspeccions.cons_movimiento` -> `movimientos.consecutivo`: 0 huerfanos sobre 82 filas (sin FK real)
- `Transbordos.id_contenedor_viejo` -> `Contenedors.id`: 0 huerfanos sobre 5 filas (sin FK real)
- `Transbordos.id_contenedor_nuevo` -> `Contenedors.id`: 0 huerfanos sobre 6 filas (sin FK real)
- `serial_de_articulos.cons_almacen` -> `almacenes.consecutivo`: 0 huerfanos sobre 87222 filas (sin FK real)
- `serial_de_articulos.id_contenedor` -> `Contenedors.id`: 0 huerfanos sobre 83616 filas (sin FK real)
- `Rechazos.id_producto` -> `combos.id`: 0 huerfanos sobre 128 filas (sin FK real)
- `Rechazos.id_motivo_de_rechazo` -> `MotivoDeRechazos.id`: 0 huerfanos sobre 128 filas (sin FK real)
- `Rechazos.id_contenedor` -> `Contenedors.id`: 0 huerfanos sobre 128 filas (sin FK real)
- `Rechazos.id_usuario` -> `usuarios.id`: 0 huerfanos sobre 128 filas (sin FK real)
- `Rechazos.cod_productor` -> `almacenes.consecutivo`: 0 huerfanos sobre 128 filas (sin FK real)
- `pedidos.cons_pedido` -> `tabla_pedidos.consecutivo`: 0 huerfanos sobre 0 filas (sin FK real)
- `pedidos.cons_almacen_destino` -> `almacenes.consecutivo`: 0 huerfanos sobre 0 filas (sin FK real)
- `historial_movimientos.cons_producto` -> `productos.consecutivo`: 0 huerfanos sobre 34207 filas (sin FK real)
- `Buques.id_naviera` -> `Navieras.id`: 0 huerfanos sobre 73 filas (sin FK real)
- `SAEs.id_embarque` -> `Embarques.id`: 0 huerfanos sobre 0 filas (sin FK real)
- `tabla_combos.cons_combo` -> `combos.consecutivo`: 0 huerfanos sobre 1 filas (FK real presente)
- `productos.cons_categoria` -> `categorias.consecutivo`: 0 huerfanos sobre 13 filas (FK real presente)

## Tablas faltantes o nombres inconsistentes

- `stock.cons_producto` -> `productos.consecutivo`: sourceExists=false, targetExists=true
- `stock.cons_almacen` -> `almacenes.consecutivo`: sourceExists=false, targetExists=true

## Tablas sin registros aproximados

- `avisos`
- `Caidas`
- `categorias`
- `ComboClientes`
- `deudas`
- `etiqueta`
- `pedidos`
- `productos_viajes`
- `proveedores`
- `record_consumos`
- `SAEs`
- `tabla_combos`
- `tabla_pedidos`
- `tanqueos`
- `tmp_actualizacion`
- `transportadoras`

## Llaves foraneas reales detectadas

- `Listados.id_contenedor` -> `Contenedors.id`
- `Listados.id_embarque` -> `Embarques.id`
- `productos.cons_categoria` -> `categorias.consecutivo`
- `serial_de_articulos.cons_producto` -> `productos.consecutivo`
- `stocks.cons_almacen` -> `almacenes.consecutivo`
- `stocks.cons_producto` -> `productos.consecutivo`
- `tabla_combos.cons_combo` -> `combos.consecutivo`

## Conclusiones

- Si el dump falla al subir a otro MySQL, este reporte ayuda a separar dos problemas: datos huerfanos reales vs. ausencia de FKs en el esquema.
- Una base puede importar "bien" aun sin integridad referencial, y luego fallar cuando se intentan crear FKs o cuando otro servidor aplica validaciones distintas.
- Las relaciones con huerfanos deben limpiarse antes de agregar restricciones reales.

