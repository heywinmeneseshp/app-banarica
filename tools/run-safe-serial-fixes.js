const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'dotenv')).config({
  path: path.resolve(__dirname, '..', '..', 'api-rest-banarica', '.env'),
});

const mysql = require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'mysql2', 'promise'));

const outputPath = path.resolve(__dirname, '..', 'outputs', 'safe-serial-fixes-execution.md');

async function scalar(connection, sql) {
  const [rows] = await connection.execute(sql);
  const firstRow = rows[0] || {};
  const firstKey = Object.keys(firstRow)[0];
  return Number(firstRow[firstKey] || 0);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || process.env.DATABASE_DEV_HOST,
    user: process.env.DATABASE_USERNAME || process.env.DATABASE_DEV_USERNAME,
    password: process.env.DATABASE_PASSWORD || process.env.DATABASE_DEV_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME,
    multipleStatements: false,
  });

  const beforeMotivoMapped = await scalar(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos s
    INNER JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.consecutivo
    WHERE s.id_motivo_de_uso IS NOT NULL
      AND s.id_motivo_de_uso <> ''
  `);

  const beforeUserMapped = await scalar(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos s
    INNER JOIN usuarios u ON s.id_usuario = u.username
    WHERE s.id_usuario IS NOT NULL
      AND s.id_usuario <> ''
  `);

  const beforeMotivoOrphans = await scalar(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos s
    LEFT JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.id
    WHERE s.id_motivo_de_uso IS NOT NULL
      AND s.id_motivo_de_uso <> ''
      AND m.id IS NULL
  `);

  const beforeUserOrphans = await scalar(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos s
    LEFT JOIN usuarios u ON s.id_usuario = u.id
    WHERE s.id_usuario IS NOT NULL
      AND s.id_usuario <> ''
      AND u.id IS NULL
  `);

  await connection.beginTransaction();

  try {
    const [motivoResult] = await connection.execute(`
      UPDATE serial_de_articulos s
      INNER JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.consecutivo
      SET s.id_motivo_de_uso = m.id
      WHERE s.id_motivo_de_uso IS NOT NULL
        AND s.id_motivo_de_uso <> ''
    `);

    const [userResult] = await connection.execute(`
      UPDATE serial_de_articulos s
      INNER JOIN usuarios u ON s.id_usuario = u.username
      SET s.id_usuario = u.id
      WHERE s.id_usuario IS NOT NULL
        AND s.id_usuario <> ''
    `);

    await connection.commit();

    const afterMotivoOrphans = await scalar(connection, `
      SELECT COUNT(*) AS total
      FROM serial_de_articulos s
      LEFT JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.id
      WHERE s.id_motivo_de_uso IS NOT NULL
        AND s.id_motivo_de_uso <> ''
        AND m.id IS NULL
    `);

    const afterUserOrphans = await scalar(connection, `
      SELECT COUNT(*) AS total
      FROM serial_de_articulos s
      LEFT JOIN usuarios u ON s.id_usuario = u.id
      WHERE s.id_usuario IS NOT NULL
        AND s.id_usuario <> ''
        AND u.id IS NULL
    `);

    const remainingEx = await scalar(connection, `
      SELECT COUNT(*) AS total
      FROM serial_de_articulos
      WHERE cons_movimiento = 'EX'
    `);

    const report = [
      '# Ejecucion de fixes seguros de serial_de_articulos',
      '',
      `- Fecha: ${new Date().toISOString()}`,
      `- Base afectada: \`${process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME}\``,
      '',
      '## Resultado',
      '',
      '```json',
      JSON.stringify({
        before_motivo_mapped_rows: beforeMotivoMapped,
        before_user_mapped_rows: beforeUserMapped,
        before_motivo_orphans: beforeMotivoOrphans,
        before_user_orphans: beforeUserOrphans,
        updated_motivo_rows: motivoResult.affectedRows,
        updated_user_rows: userResult.affectedRows,
        after_motivo_orphans: afterMotivoOrphans,
        after_user_orphans: afterUserOrphans,
        remaining_ex_rows: remainingEx,
      }, null, 2),
      '```',
      '',
      '## Nota',
      '',
      '- Este script solo aplico los dos fixes seguros.',
      '- No modifico `cons_movimiento = EX`.',
    ].join('\n');

    fs.writeFileSync(outputPath, `${report}\n`, 'utf8');
    console.log(outputPath);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
