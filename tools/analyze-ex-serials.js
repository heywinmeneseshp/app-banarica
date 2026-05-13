const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'dotenv')).config({
  path: path.resolve(__dirname, '..', '..', 'api-rest-banarica', '.env'),
});

const mysql = require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'mysql2', 'promise'));

const outputPath = path.resolve(__dirname, '..', 'outputs', 'serial-ex-analysis.md');

async function query(connection, sql) {
  const [rows] = await connection.execute(sql);
  return rows;
}

function toJsonBlock(rows) {
  return `\`\`\`json\n${JSON.stringify(rows, null, 2)}\n\`\`\``;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || process.env.DATABASE_DEV_HOST,
    user: process.env.DATABASE_USERNAME || process.env.DATABASE_DEV_USERNAME,
    password: process.env.DATABASE_PASSWORD || process.env.DATABASE_DEV_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME,
  });

  const summary = await query(connection, `
    SELECT
      COUNT(*) AS total_rows,
      COUNT(DISTINCT id_contenedor) AS distinct_contenedores,
      COUNT(DISTINCT bag_pack) AS distinct_bag_pack,
      COUNT(DISTINCT fecha_de_uso) AS distinct_fechas,
      MIN(createdAt) AS first_created_at,
      MAX(createdAt) AS last_created_at
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
  `);

  const motivoBreakdown = await query(connection, `
    SELECT id_motivo_de_uso, COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
    GROUP BY id_motivo_de_uso
    ORDER BY total DESC
  `);

  const userBreakdown = await query(connection, `
    SELECT id_usuario, COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
    GROUP BY id_usuario
    ORDER BY total DESC
  `);

  const dateBreakdown = await query(connection, `
    SELECT fecha_de_uso, COUNT(*) AS total
    FROM serial_de_articulos
    WHERE cons_movimiento = 'EX'
    GROUP BY fecha_de_uso
    ORDER BY total DESC, fecha_de_uso DESC
    LIMIT 20
  `);

  const containerBreakdown = await query(connection, `
    SELECT
      s.id_contenedor,
      c.contenedor,
      COUNT(*) AS total_seriales,
      MIN(s.createdAt) AS first_created_at,
      MAX(s.createdAt) AS last_created_at
    FROM serial_de_articulos s
    LEFT JOIN Contenedors c ON s.id_contenedor = c.id
    WHERE s.cons_movimiento = 'EX'
    GROUP BY s.id_contenedor, c.contenedor
    ORDER BY total_seriales DESC, s.id_contenedor DESC
    LIMIT 25
  `);

  const containerInspectionMatch = await query(connection, `
    SELECT
      COUNT(DISTINCT s.id_contenedor) AS contenedores_ex,
      COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN s.id_contenedor END) AS contenedores_con_inspeccion,
      COUNT(DISTINCT CASE WHEN i.cons_movimiento IS NOT NULL AND i.cons_movimiento <> '' THEN s.id_contenedor END) AS contenedores_con_movimiento_en_inspeccion
    FROM serial_de_articulos s
    LEFT JOIN Inspeccions i ON i.id_contenedor = s.id_contenedor
    WHERE s.cons_movimiento = 'EX'
  `);

  const sampleRows = await query(connection, `
    SELECT
      s.id,
      s.serial,
      s.bag_pack,
      s.cons_producto,
      s.id_contenedor,
      c.contenedor,
      s.fecha_de_uso,
      s.id_motivo_de_uso,
      s.id_usuario,
      s.createdAt
    FROM serial_de_articulos s
    LEFT JOIN Contenedors c ON s.id_contenedor = c.id
    WHERE s.cons_movimiento = 'EX'
    ORDER BY s.id
    LIMIT 25
  `);

  const lines = [];
  lines.push('# Analisis de seriales con `cons_movimiento = EX`');
  lines.push('');
  lines.push(`- Fecha: ${new Date().toISOString()}`);
  lines.push(`- Base evaluada: \`${process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME}\``);
  lines.push('');
  lines.push('## Resumen');
  lines.push('');
  lines.push(toJsonBlock(summary));
  lines.push('');
  lines.push('## Motivos de uso');
  lines.push('');
  lines.push(toJsonBlock(motivoBreakdown));
  lines.push('');
  lines.push('## Usuarios');
  lines.push('');
  lines.push(toJsonBlock(userBreakdown));
  lines.push('');
  lines.push('## Fechas de uso mas frecuentes');
  lines.push('');
  lines.push(toJsonBlock(dateBreakdown));
  lines.push('');
  lines.push('## Contenedores mas afectados');
  lines.push('');
  lines.push(toJsonBlock(containerBreakdown));
  lines.push('');
  lines.push('## Cruce con inspecciones');
  lines.push('');
  lines.push(toJsonBlock(containerInspectionMatch));
  lines.push('');
  lines.push('## Muestra de filas');
  lines.push('');
  lines.push(toJsonBlock(sampleRows));
  lines.push('');
  lines.push('## Lectura sugerida');
  lines.push('');
  lines.push('- Si casi todos los `EX` pertenecen a inspecciones y no hay forma confiable de reconstruir el consecutivo real, la salida conservadora es dejarlos en `NULL`.');
  lines.push('- Si aparece un subconjunto pequeño con suficientes pistas de fecha/contenedor/inspeccion, ese grupo si podria reconstruirse con una regla puntual.');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  await connection.end();
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
