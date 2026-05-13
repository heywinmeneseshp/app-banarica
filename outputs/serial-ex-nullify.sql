-- Nulificacion conservadora de serial_de_articulos.cons_movimiento = 'EX'
-- Generado: 2026-05-12
--
-- Contexto:
-- - 2118 filas
-- - 2118 contenedores distintos
-- - 0 fechas_de_uso
-- - 0 inspecciones con cons_movimiento recuperable
--
-- Dado que no hay una regla confiable de reconstruccion automatica,
-- la salida mas segura es dejar cons_movimiento en NULL.

START TRANSACTION;

SELECT 'before_nullify_ex' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX';

SELECT `id`, `serial`, `id_contenedor`, `id_motivo_de_uso`, `id_usuario`, `createdAt`
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX'
ORDER BY `id`
LIMIT 25;

UPDATE `serial_de_articulos`
SET `cons_movimiento` = NULL
WHERE `cons_movimiento` = 'EX';

SELECT ROW_COUNT() AS updated_ex_rows;

SELECT 'after_nullify_ex' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX';

SELECT 'after_nullify_ex_nulls' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos`
WHERE `cons_movimiento` IS NULL;

-- Si todo luce bien:
-- COMMIT;

-- Si quieres revertir:
-- ROLLBACK;
