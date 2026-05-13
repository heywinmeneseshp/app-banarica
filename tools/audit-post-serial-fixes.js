const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'dotenv')).config({
  path: path.resolve(__dirname, '..', '..', 'api-rest-banarica', '.env'),
});

const mysql = require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'mysql2', 'promise'));

const outputPath = path.resolve(__dirname, '..', 'outputs', 'post-serial-fixes-audit.md');

async function runQuery(connection, sql) {
  const [rows] = await connection.execute(sql);
  return rows;
}

function jsonBlock(value) {
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || process.env.DATABASE_DEV_HOST,
    user: process.env.DATABASE_USERNAME || process.env.DATABASE_DEV_USERNAME,
    password: process.env.DATABASE_PASSWORD || process.env.DATABASE_DEV_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME,
  });

  const motivoOrphans = await runQuery(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos s
    LEFT JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.id
    WHERE s.id_motivo_de_uso IS NOT NULL
      AND s.id_motivo_de_uso <> ''
      AND m.id IS NULL
  `);

  const userOrphans = await runQuery(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos s
    LEFT JOIN usuarios u ON s.id_usuario = u.id
    WHERE s.id_usuario IS NOT NULL
      AND s.id_usuario <> ''
      AND u.id IS NULL
  `);

  const exRemaining = await runQuery(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
  `);

  const nullMovementRows = await runQuery(connection, `
    SELECT COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento IS NULL
  `);

  const mappedMotivos = await runQuery(connection, `
    SELECT m.consecutivo, COUNT(*) AS total
    FROM serial_de_articulos s
    INNER JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.id
    WHERE m.consecutivo IN ('INSP01', 'INSP02')
    GROUP BY m.consecutivo
    ORDER BY total DESC
  `);

  const mappedUsers = await runQuery(connection, `
    SELECT u.username, COUNT(*) AS total
    FROM serial_de_articulos s
    INNER JOIN usuarios u ON s.id_usuario = u.id
    GROUP BY u.username
    ORDER BY total DESC
    LIMIT 10
  `);

  const invalidMotivoSamples = await runQuery(connection, `
    SELECT s.id, s.serial, s.id_motivo_de_uso
    FROM serial_de_articulos s
    LEFT JOIN MotivoDeUsos m ON s.id_motivo_de_uso = m.id
    WHERE s.id_motivo_de_uso IS NOT NULL
      AND s.id_motivo_de_uso <> ''
      AND m.id IS NULL
    ORDER BY s.id
    LIMIT 25
  `);

  const invalidUserSamples = await runQuery(connection, `
    SELECT s.id, s.serial, s.id_usuario
    FROM serial_de_articulos s
    LEFT JOIN usuarios u ON s.id_usuario = u.id
    WHERE s.id_usuario IS NOT NULL
      AND s.id_usuario <> ''
      AND u.id IS NULL
    ORDER BY s.id
    LIMIT 25
  `);

  const exSamples = await runQuery(connection, `
    SELECT id, serial, id_contenedor, id_motivo_de_uso, id_usuario, cons_movimiento
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
    ORDER BY id
    LIMIT 25
  `);

  const lines = [];
  lines.push('# Post-audit de serial_de_articulos');
  lines.push('');
  lines.push(`- Fecha: ${new Date().toISOString()}`);
  lines.push(`- Base evaluada: \`${process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME}\``);
  lines.push('');
  lines.push('## Resumen');
  lines.push('');
  lines.push(jsonBlock([{
    orphan_motivo_rows: Number(motivoOrphans[0]?.total || 0),
    orphan_user_rows: Number(userOrphans[0]?.total || 0),
    remaining_ex_rows: Number(exRemaining[0]?.total || 0),
    null_cons_movimiento_rows: Number(nullMovementRows[0]?.total || 0),
  }]));
  lines.push('');
  lines.push('## Motivos mapeados');
  lines.push('');
  lines.push(jsonBlock(mappedMotivos));
  lines.push('');
  lines.push('## Usuarios mas presentes por ID valido');
  lines.push('');
  lines.push(jsonBlock(mappedUsers));
  lines.push('');
  lines.push('## Muestras pendientes de motivo invalido');
  lines.push('');
  lines.push(jsonBlock(invalidMotivoSamples));
  lines.push('');
  lines.push('## Muestras pendientes de usuario invalido');
  lines.push('');
  lines.push(jsonBlock(invalidUserSamples));
  lines.push('');
  lines.push('## Muestras de registros aun con EX');
  lines.push('');
  lines.push(jsonBlock(exSamples));
  lines.push('');
  lines.push('## Lectura esperada');
  lines.push('');
  lines.push('- Si corriste solo `serial-de-articulos-safe-fixes.sql`, lo esperado es:');
  lines.push('  - `orphan_motivo_rows = 0`');
  lines.push('  - `orphan_user_rows = 0`');
  lines.push('  - `remaining_ex_rows = 2118`');
  lines.push('- Si ademas corriste `serial-ex-nullify.sql`, entonces tambien deberia quedar `remaining_ex_rows = 0`.');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  await connection.end();
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
