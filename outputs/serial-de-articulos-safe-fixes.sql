-- Correcciones seguras para serial_de_articulos
-- Generado: 2026-05-12
-- Objetivo:
-- 1) convertir id_motivo_de_uso guardado como consecutivo (INSP01/INSP02) al ID numerico real
-- 2) convertir id_usuario guardado como username (por ejemplo admin) al ID numerico real
--
-- Uso recomendado:
-- - correr en una copia de la base, o
-- - correr en una sesion controlada y revisar los SELECT antes de hacer COMMIT

START TRANSACTION;

-- ============================================================
-- Pre-chequeo
-- ============================================================

SELECT 'before_motivo_fix' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
INNER JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`consecutivo`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> '';

SELECT 'before_user_fix' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
INNER JOIN `usuarios` u ON s.`id_usuario` = u.`username`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> '';

SELECT 'before_orphan_motivo_against_id' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
LEFT JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`id`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> ''
  AND m.`id` IS NULL;

SELECT 'before_orphan_user_against_id' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
LEFT JOIN `usuarios` u ON s.`id_usuario` = u.`id`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> ''
  AND u.`id` IS NULL;

SELECT s.`id`, s.`serial`, s.`id_motivo_de_uso`, m.`id` AS motivo_id_destino, m.`consecutivo`
FROM `serial_de_articulos` s
INNER JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`consecutivo`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> ''
ORDER BY s.`id`
LIMIT 25;

SELECT s.`id`, s.`serial`, s.`id_usuario`, u.`id` AS usuario_id_destino, u.`username`
FROM `serial_de_articulos` s
INNER JOIN `usuarios` u ON s.`id_usuario` = u.`username`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> ''
ORDER BY s.`id`
LIMIT 25;

-- ============================================================
-- Fix 1: motivo de uso
-- ============================================================

UPDATE `serial_de_articulos` s
INNER JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`consecutivo`
SET s.`id_motivo_de_uso` = m.`id`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> '';

SELECT ROW_COUNT() AS updated_motivo_rows;

-- ============================================================
-- Fix 2: usuario
-- ============================================================

UPDATE `serial_de_articulos` s
INNER JOIN `usuarios` u ON s.`id_usuario` = u.`username`
SET s.`id_usuario` = u.`id`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> '';

SELECT ROW_COUNT() AS updated_user_rows;

-- ============================================================
-- Post-chequeo
-- ============================================================

SELECT 'after_orphan_motivo_against_id' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
LEFT JOIN `MotivoDeUsos` m ON s.`id_motivo_de_uso` = m.`id`
WHERE s.`id_motivo_de_uso` IS NOT NULL
  AND s.`id_motivo_de_uso` <> ''
  AND m.`id` IS NULL;

SELECT 'after_orphan_user_against_id' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos` s
LEFT JOIN `usuarios` u ON s.`id_usuario` = u.`id`
WHERE s.`id_usuario` IS NOT NULL
  AND s.`id_usuario` <> ''
  AND u.`id` IS NULL;

SELECT 'remaining_ex_cons_movimiento' AS checkpoint, COUNT(*) AS total
FROM `serial_de_articulos`
WHERE `cons_movimiento` = 'EX';

SELECT s.`id`, s.`serial`, s.`cons_movimiento`, s.`id_motivo_de_uso`, s.`id_usuario`
FROM `serial_de_articulos` s
WHERE s.`cons_movimiento` = 'EX'
ORDER BY s.`id`
LIMIT 25;

-- Si todo se ve bien:
-- COMMIT;

-- Si algo no cuadra:
-- ROLLBACK;
