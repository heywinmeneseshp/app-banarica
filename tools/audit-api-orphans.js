const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'dotenv')).config({
  path: path.resolve(__dirname, '..', '..', 'api-rest-banarica', '.env'),
});

const mysql = require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'mysql2', 'promise'));

const outputPath = path.resolve(__dirname, '..', 'outputs', 'api-orphans-audit.md');

const checks = [
  ['Listados', 'id_embarque', 'Embarques', 'id'],
  ['Listados', 'id_contenedor', 'Contenedors', 'id'],
  ['Listados', 'id_lugar_de_llenado', 'almacenes', 'id'],
  ['Listados', 'id_producto', 'combos', 'id'],
  ['Listados', 'id_sae', 'SAEs', 'id'],
  ['Embarques', 'id_semana', 'semanas', 'id'],
  ['Embarques', 'id_cliente', 'clientes', 'id'],
  ['Embarques', 'id_destino', 'Destinos', 'id'],
  ['Embarques', 'id_naviera', 'Navieras', 'id'],
  ['Embarques', 'id_buque', 'Buques', 'id'],
  ['Inspeccions', 'id_contenedor', 'Contenedors', 'id'],
  ['Inspeccions', 'cons_movimiento', 'movimientos', 'consecutivo'],
  ['Transbordos', 'id_contenedor_viejo', 'Contenedors', 'id'],
  ['Transbordos', 'id_contenedor_nuevo', 'Contenedors', 'id'],
  ['serial_de_articulos', 'cons_almacen', 'almacenes', 'consecutivo'],
  ['serial_de_articulos', 'cons_movimiento', 'movimientos', 'consecutivo'],
  ['serial_de_articulos', 'id_contenedor', 'Contenedors', 'id'],
  ['serial_de_articulos', 'id_motivo_de_uso', 'MotivoDeUsos', 'id'],
  ['serial_de_articulos', 'id_usuario', 'usuarios', 'id'],
  ['Rechazos', 'id_producto', 'combos', 'id'],
  ['Rechazos', 'id_motivo_de_rechazo', 'MotivoDeRechazos', 'id'],
  ['Rechazos', 'id_contenedor', 'Contenedors', 'id'],
  ['Rechazos', 'id_usuario', 'usuarios', 'id'],
  ['Rechazos', 'cod_productor', 'almacenes', 'consecutivo'],
  ['pedidos', 'cons_pedido', 'tabla_pedidos', 'consecutivo'],
  ['pedidos', 'cons_almacen_destino', 'almacenes', 'consecutivo'],
  ['historial_movimientos', 'cons_movimiento', 'movimientos', 'consecutivo'],
  ['historial_movimientos', 'cons_producto', 'productos', 'consecutivo'],
  ['stock', 'cons_producto', 'productos', 'consecutivo'],
  ['stock', 'cons_almacen', 'almacenes', 'consecutivo'],
  ['Buques', 'id_naviera', 'Navieras', 'id'],
  ['SAEs', 'id_embarque', 'Embarques', 'id'],
  ['tabla_combos', 'cons_combo', 'combos', 'consecutivo'],
  ['productos', 'cons_categoria', 'categorias', 'consecutivo'],
  ['productos', 'cons_proveedor', 'proveedores', 'consecutivo'],
  ['usuarios', 'id_rol', 'categorias', 'id'],
];

const nonNullCondition = (column) => `src.\`${column}\` IS NOT NULL AND src.\`${column}\` <> ''`;

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || process.env.DATABASE_DEV_HOST,
    user: process.env.DATABASE_USERNAME || process.env.DATABASE_DEV_USERNAME,
    password: process.env.DATABASE_PASSWORD || process.env.DATABASE_DEV_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME,
  });

  const [tableRows] = await connection.execute(
    `SELECT TABLE_NAME, TABLE_ROWS
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
     ORDER BY TABLE_NAME`
  );
  const tableMap = new Map(tableRows.map((row) => [row.TABLE_NAME, Number(row.TABLE_ROWS || 0)]));

  const [fkRows] = await connection.execute(
    `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND REFERENCED_TABLE_NAME IS NOT NULL
     ORDER BY TABLE_NAME, COLUMN_NAME`
  );

  const orphanResults = [];
  for (const [sourceTable, sourceColumn, targetTable, targetColumn] of checks) {
    const sourceExists = tableMap.has(sourceTable);
    const targetExists = tableMap.has(targetTable);
    const hasRealFk = fkRows.some((row) =>
      row.TABLE_NAME === sourceTable
      && row.COLUMN_NAME === sourceColumn
      && row.REFERENCED_TABLE_NAME === targetTable
      && row.REFERENCED_COLUMN_NAME === targetColumn
    );

    if (!sourceExists || !targetExists) {
      orphanResults.push({
        sourceTable,
        sourceColumn,
        targetTable,
        targetColumn,
        sourceExists,
        targetExists,
        hasRealFk,
        totalLinked: null,
        orphanCount: null,
      });
      continue;
    }

    const [countRows] = await connection.execute(
      `SELECT
          COUNT(*) AS totalLinked,
          SUM(CASE WHEN tgt.\`${targetColumn}\` IS NULL THEN 1 ELSE 0 END) AS orphanCount
       FROM \`${sourceTable}\` src
       LEFT JOIN \`${targetTable}\` tgt
         ON src.\`${sourceColumn}\` = tgt.\`${targetColumn}\`
       WHERE ${nonNullCondition(sourceColumn)}`
    );

    orphanResults.push({
      sourceTable,
      sourceColumn,
      targetTable,
      targetColumn,
      sourceExists,
      targetExists,
      hasRealFk,
      totalLinked: Number(countRows[0]?.totalLinked || 0),
      orphanCount: Number(countRows[0]?.orphanCount || 0),
    });
  }

  const realFkCount = fkRows.length;
  const tablesWithoutRows = [...tableMap.entries()].filter(([, rows]) => rows === 0).map(([name]) => name);
  const criticalOrphans = orphanResults.filter((row) => (row.orphanCount || 0) > 0);
  const missingTables = orphanResults.filter((row) => !row.sourceExists || !row.targetExists);

  const lines = [];
  lines.push('# Auditoria de huerfanos y llaves foraneas reales');
  lines.push('');
  lines.push(`- Fecha: ${new Date().toISOString()}`);
  lines.push(`- Base evaluada: \`${process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME}\``);
  lines.push('');
  lines.push('## Resumen');
  lines.push('');
  lines.push(`- Tablas detectadas: ${tableMap.size}`);
  lines.push(`- FKs reales en information_schema: ${realFkCount}`);
  lines.push(`- Relaciones auditadas: ${orphanResults.length}`);
  lines.push(`- Relaciones con huerfanos: ${criticalOrphans.length}`);
  lines.push(`- Relaciones con tablas faltantes o no detectadas: ${missingTables.length}`);
  lines.push('');

  lines.push('## Relaciones con huerfanos');
  lines.push('');
  if (criticalOrphans.length === 0) {
    lines.push('- No se detectaron huerfanos en las relaciones auditadas.');
  } else {
    for (const row of criticalOrphans.sort((a, b) => b.orphanCount - a.orphanCount)) {
      lines.push(`- \`${row.sourceTable}.${row.sourceColumn}\` -> \`${row.targetTable}.${row.targetColumn}\`: ${row.orphanCount} huerfanos de ${row.totalLinked} filas enlazadas${row.hasRealFk ? ' (FK real presente)' : ' (sin FK real)'}`);
    }
  }
  lines.push('');

  lines.push('## Relaciones auditadas sin huerfanos');
  lines.push('');
  for (const row of orphanResults.filter((item) => item.sourceExists && item.targetExists && (item.orphanCount || 0) === 0)) {
    lines.push(`- \`${row.sourceTable}.${row.sourceColumn}\` -> \`${row.targetTable}.${row.targetColumn}\`: 0 huerfanos sobre ${row.totalLinked} filas${row.hasRealFk ? ' (FK real presente)' : ' (sin FK real)'}`);
  }
  lines.push('');

  lines.push('## Tablas faltantes o nombres inconsistentes');
  lines.push('');
  if (missingTables.length === 0) {
    lines.push('- Todas las tablas auditadas existen con los nombres esperados.');
  } else {
    for (const row of missingTables) {
      lines.push(`- \`${row.sourceTable}.${row.sourceColumn}\` -> \`${row.targetTable}.${row.targetColumn}\`: sourceExists=${row.sourceExists}, targetExists=${row.targetExists}`);
    }
  }
  lines.push('');

  lines.push('## Tablas sin registros aproximados');
  lines.push('');
  if (tablesWithoutRows.length === 0) {
    lines.push('- Todas las tablas reportan filas aproximadas en information_schema.');
  } else {
    for (const tableName of tablesWithoutRows) {
      lines.push(`- \`${tableName}\``);
    }
  }
  lines.push('');

  lines.push('## Llaves foraneas reales detectadas');
  lines.push('');
  if (fkRows.length === 0) {
    lines.push('- No se detectaron FKs reales en la base.');
  } else {
    for (const row of fkRows) {
      lines.push(`- \`${row.TABLE_NAME}.${row.COLUMN_NAME}\` -> \`${row.REFERENCED_TABLE_NAME}.${row.REFERENCED_COLUMN_NAME}\``);
    }
  }
  lines.push('');

  lines.push('## Conclusiones');
  lines.push('');
  lines.push('- Si el dump falla al subir a otro MySQL, este reporte ayuda a separar dos problemas: datos huerfanos reales vs. ausencia de FKs en el esquema.');
  lines.push('- Una base puede importar "bien" aun sin integridad referencial, y luego fallar cuando se intentan crear FKs o cuando otro servidor aplica validaciones distintas.');
  lines.push('- Las relaciones con huerfanos deben limpiarse antes de agregar restricciones reales.');
  lines.push('');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  await connection.end();
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
