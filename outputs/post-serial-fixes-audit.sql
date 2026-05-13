-- Post-audit manual para serial_de_articulos
-- Corre esto despues de:
-- 1) serial-de-articulos-safe-fixes.sql
-- 2) opcionalmente serial-ex-nullify.sql

SELECT 'orphan_motivo_rows' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
LEFT JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`id`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> ''
  AND m.`id` IS NULL;

SELECT 'orphan_user_rows' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
LEFT JOIN `usuarios` u ON s.`id_usuario` = u.`id`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> ''
  AND u.`id` IS NULL;

SELECT 'remaining_ex_rows' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX';

SELECT 'null_cons_movimiento_rows' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos`
WHERE `cons_movimiento` IS NULL;

SELECT m.`consecutivo`, COUNT(*) AS total
FROM `serial_de_articulos` s
INNER JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`id`
WHERE m.`consecutivo` IN ('INSP01', 'INSP02')
GROUP BY m.`consecutivo`
ORDER BY total DESC;

SELECT u.`username`, COUNT(*) AS total
FROM `serial_de_articulos` s
INNER JOIN `usuarios` u ON s.`id_usuario` = u.`id`
GROUP BY u.`username`
ORDER BY total DESC
LIMIT 10;

SELECT s.`id`, s.`serial`, s.`id_motivo_de_uso`
FROM `serial_de_articulos` s
LEFT JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`id`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> ''
  AND m.`id` IS NULL
ORDER BY s.`id`
LIMIT 25;

SELECT s.`id`, s.`serial`, s.`id_usuario`
FROM `serial_de_articulos` s
LEFT JOIN `usuarios` u ON s.`id_usuario` = u.`id`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> ''
  AND u.`id` IS NULL
ORDER BY s.`id`
LIMIT 25;

SELECT `id`, `serial`, `id_contenedor`, `id_motivo_de_uso`, `id_usuario`, `cons_movimiento`
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX'
ORDER BY `id`
LIMIT 25;
