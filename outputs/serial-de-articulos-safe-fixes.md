# Correccion segura de `serial_de_articulos`

Archivo listo para ejecutar:

- [serial-de-articulos-safe-fixes.sql](/C:/Users/onides/Documents/GitHub/app-banarica/outputs/serial-de-articulos-safe-fixes.sql)

## Que hace

Corrige solo dos cosas seguras:

1. `serial_de_articulos.id_motivo_de_uso`
   - de valores como `INSP01` / `INSP02`
   - al `id` numerico real en `MotivoDeUsos`

2. `serial_de_articulos.id_usuario`
   - de valores como `admin`
   - al `id` numerico real en `usuarios`

## Que no toca

- No toca `serial_de_articulos.cons_movimiento = 'EX'`
- No toca `historial_movimientos.cons_movimiento`
- No toca `usuarios.id_rol`
- No toca `productos.cons_proveedor`

## Como usarlo

1. Abrir una sesion SQL sobre una copia de la base o una ventana controlada.
2. Ejecutar el archivo completo.
3. Revisar los `SELECT` del pre-chequeo y post-chequeo.
4. Si todo luce bien, ejecutar `COMMIT`.
5. Si algo no cuadra, ejecutar `ROLLBACK`.

## Resultado esperado

Despues del script:

- los huerfanos de `serial_de_articulos.id_motivo_de_uso -> MotivoDeUsos.id` deberian bajar a `0`
- los huerfanos de `serial_de_articulos.id_usuario -> usuarios.id` deberian bajar a `0`
- los registros con `cons_movimiento = 'EX'` seguiran igual, para revisarlos aparte
