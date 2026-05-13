const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'dotenv')).config({
  path: path.resolve(__dirname, '..', '..', 'api-rest-banarica', '.env'),
});

const mysql = require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'mysql2', 'promise'));

const outputPath = path.resolve(__dirname, '..', 'outputs', 'nullify-ex-execution.md');

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

  const beforeEx = await scalar(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
  `);

  const beforeNulls = await scalar(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento IS NULL
  `);

  await connection.beginTransaction();

  try {
    const [updateResult] = await connection.execute(`
      UPDATE serial_de_articulos
      SET cons_movimiento = NULL
      WHERE cons_movimiento = 'EX'
    `);

    await connection.commit();

    const afterEx = await scalar(connection, `
      SELECT COUNT(*) AS total
      FROM serial_de_articulos
      WHERE cons_movimiento = 'EX'
    `);

    const afterNulls = await scalar(connection, `
      SELECT COUNT(*) AS total
      FROM serial_de_articulos
      WHERE cons_movimiento IS NULL
    `);

    const report = [
      '# Ejecucion de nulificacion de EX',
      '',
      `- Fecha: ${new Date().toISOString()}`,
      `- Base afectada: \`${process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME}\``,
      '',
      '## Resultado',
      '',
      '```json',
      JSON.stringify({
        before_ex_rows: beforeEx,
        before_null_rows: beforeNulls,
        updated_ex_rows: updateResult.affectedRows,
        after_ex_rows: afterEx,
        after_null_rows: afterNulls,
      }, null, 2),
      '```',
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
