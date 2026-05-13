-- Remediacion sugerida para integridad de datos
-- Generado: 2026-05-12T19:30:00.000Z
-- Ejecuta primero los SELECT de validacion. No corras los UPDATE sin respaldo previo.

-- ============================================================
-- 1. historial_movimientos.cons_movimiento
-- ============================================================
-- Nota: los valores tipo TR-11 / TR-12 / TR-13 no son basura.
-- Estan referenciando consecutivos existentes en la tabla `traslados`, no en `movimientos`.
-- No limpiar esta relacion como huerfana. Si luego quieres una FK real, toca remodelar la referencia.

SELECT COUNT(*) AS rows_pointing_to_traslados
FROM `historial_movimientos` hm
INNER JOIN `traslados` t ON hm.`cons_movimiento` = t.`consecutivo`;

-- ============================================================
-- 2. serial_de_articulos.cons_movimiento = EX
-- ============================================================
-- Estos registros quedaron con el prefijo generico en vez del consecutivo real.
-- Si no se puede reconstruir el movimiento exacto, la correccion conservadora es dejar NULL.

SELECT COUNT(*) AS seriales_con_cons_movimiento_ex
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX';

SELECT `id`, `serial`, `bag_pack`, `id_contenedor`, `cons_movimiento`, `id_motivo_de_uso`, `id_usuario`
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX'
LIMIT 100;

-- UPDATE `serial_de_articulos`
-- SET `cons_movimiento` = NULL
-- WHERE `cons_movimiento` = 'EX';

-- ============================================================
-- 3. serial_de_articulos.id_motivo_de_uso guardado como consecutivo
-- ============================================================
-- Aqui si hay una correccion automatica segura: convertir INSP01/INSP02 al ID real.

SELECT s.`id`, s.`serial`, s.`id_motivo_de_uso`, m.`id` AS motivo_id, m.`consecutivo`
FROM `serial_de_articulos` s
INNER JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`consecutivo`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> ''
LIMIT 100;

UPDATE `serial_de_articulos` s
INNER JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`consecutivo`
SET s.`id_motivo_de_uso` = m.`id`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> '';

-- ============================================================
-- 4. serial_de_articulos.id_usuario guardado como username
-- ============================================================
-- Aqui tambien hay una correccion automatica segura: convertir admin -> usuarios.id.

SELECT s.`id`, s.`serial`, s.`id_usuario`, u.`id` AS usuario_id, u.`username`
FROM `serial_de_articulos` s
INNER JOIN `usuarios` u ON s.`id_usuario` = u.`username`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> ''
LIMIT 100;

UPDATE `serial_de_articulos` s
INNER JOIN `usuarios` u ON s.`id_usuario` = u.`username`
SET s.`id_usuario` = u.`id`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> '';

-- ============================================================
-- 5. usuarios.id_rol
-- ============================================================
-- No convertir esto en FK hacia `categorias.id`.
-- Los valores reales son nombres de rol (por ejemplo: Operador, Super administrador).
-- Aqui la correccion es de modelo/codigo, no de limpieza automatica.

SELECT DISTINCT `id_rol`
FROM `usuarios`
ORDER BY `id_rol`;

-- ============================================================
-- 6. productos.cons_proveedor = 000
-- ============================================================
-- Este caso es unico y requiere decision manual.

SELECT * FROM `productos` WHERE `cons_proveedor` = '000';

-- Siguientes pasos sugeridos:
-- 1) correr los dos UPDATE seguros de serial_de_articulos
-- 2) decidir si `cons_movimiento = EX` se nulifica o se reconstruye
-- 3) corregir el modelo de roles antes de agregar nuevas FKs
