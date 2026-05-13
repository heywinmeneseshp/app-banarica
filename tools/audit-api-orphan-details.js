const fs = require('fs');
const path = require('path');

require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'dotenv')).config({
  path: path.resolve(__dirname, '..', '..', 'api-rest-banarica', '.env'),
});

const mysql = require(path.resolve(__dirname, '..', '..', 'api-rest-banarica', 'node_modules', 'mysql2', 'promise'));

const outputPath = path.resolve(__dirname, '..', 'outputs', 'api-orphans-details.md');

const criticalChecks = [
  ['historial_movimientos', 'cons_movimiento', 'movimientos', 'consecutivo'],
  ['serial_de_articulos', 'cons_movimiento', 'movimientos', 'consecutivo'],
  ['serial_de_articulos', 'id_motivo_de_uso', 'MotivoDeUsos', 'id'],
  ['serial_de_articulos', 'id_usuario', 'usuarios', 'id'],
  ['usuarios', 'id_rol', 'categorias', 'id'],
  ['productos', 'cons_proveedor', 'proveedores', 'consecutivo'],
];

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || process.env.DATABASE_DEV_HOST,
    user: process.env.DATABASE_USERNAME || process.env.DATABASE_DEV_USERNAME,
    password: process.env.DATABASE_PASSWORD || process.env.DATABASE_DEV_PASSWORD,
    database: process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME,
  });

  const lines = [];
  lines.push('# Detalle de huerfanos criticos');
  lines.push('');
  lines.push(`- Fecha: ${new Date().toISOString()}`);
  lines.push(`- Base evaluada: \`${process.env.DATABASE_NAME || process.env.DATABASE_DEV_NAME}\``);
  lines.push('');

  for (const [sourceTable, sourceColumn, targetTable, targetColumn] of criticalChecks) {
    const [countRows] = await connection.execute(
      `SELECT COUNT(*) AS orphanCount
       FROM \`${sourceTable}\` src
       LEFT JOIN \`${targetTable}\` tgt
         ON src.\`${sourceColumn}\` = tgt.\`${targetColumn}\`
       WHERE src.\`${sourceColumn}\` IS NOT NULL
         AND src.\`${sourceColumn}\` <> ''
         AND tgt.\`${targetColumn}\` IS NULL`
    );

    const orphanCount = Number(countRows[0]?.orphanCount || 0);
    lines.push(`## ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn}`);
    lines.push('');
    lines.push(`- Huerfanos detectados: **${orphanCount}**`);
    lines.push('');

    if (orphanCount > 0) {
      if (sourceTable === 'historial_movimientos' && sourceColumn === 'cons_movimiento') {
        const [trasladoRows] = await connection.execute(
          `SELECT COUNT(*) AS matchesInTraslados
           FROM \`historial_movimientos\` src
           INNER JOIN \`traslados\` t
             ON src.\`cons_movimiento\` = t.\`consecutivo\``
        );
        lines.push(`- Nota: **${Number(trasladoRows[0]?.matchesInTraslados || 0)}** de estas filas si coinciden con \`traslados.consecutivo\`. Esta relacion no debe limpiarse como huerfana comun.`);
        lines.push('');
      }

      const [sampleRows] = await connection.execute(
        `SELECT src.*
         FROM \`${sourceTable}\` src
         LEFT JOIN \`${targetTable}\` tgt
           ON src.\`${sourceColumn}\` = tgt.\`${targetColumn}\`
         WHERE src.\`${sourceColumn}\` IS NOT NULL
           AND src.\`${sourceColumn}\` <> ''
           AND tgt.\`${targetColumn}\` IS NULL
         LIMIT 10`
      );

      lines.push('Muestra de filas afectadas:');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(sampleRows, null, 2));
      lines.push('```');
      lines.push('');

      if (sourceTable === 'serial_de_articulos' && sourceColumn === 'cons_movimiento') {
        const [valueRows] = await connection.execute(
          `SELECT src.\`${sourceColumn}\` AS value, COUNT(*) AS total
           FROM \`${sourceTable}\` src
           LEFT JOIN \`${targetTable}\` tgt
             ON src.\`${sourceColumn}\` = tgt.\`${targetColumn}\`
           WHERE src.\`${sourceColumn}\` IS NOT NULL
             AND src.\`${sourceColumn}\` <> ''
             AND tgt.\`${targetColumn}\` IS NULL
           GROUP BY src.\`${sourceColumn}\`
           ORDER BY total DESC
           LIMIT 10`
        );

        lines.push('Valores huerfanos mas frecuentes:');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(valueRows, null, 2));
        lines.push('```');
        lines.push('');
      }
    } else {
      lines.push('- Sin muestras; no hay huerfanos en esta relacion.');
      lines.push('');
    }
  }

  lines.push('## Recomendacion');
  lines.push('');
  lines.push('- Corregir primero `id_motivo_de_uso` e `id_usuario` en `serial_de_articulos`, porque son reparaciones seguras por mapeo a datos existentes.');
  lines.push('- Tratar `serial_de_articulos.cons_movimiento = EX` como deuda de aplicacion: no es buen candidato para autocompletar sin una regla de negocio clara.');
  lines.push('- No limpiar `historial_movimientos.cons_movimiento` como si fuera basura comun; hoy referencia `traslados` en una parte importante del historico.');
  lines.push('- Validar el origen real de `usuarios.id_rol`: todo apunta a que `categorias` no es una tabla de roles confiable para FK.');
  lines.push('- Corregir el proveedor huerfano antes de endurecer `productos.cons_proveedor`.');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  await connection.end();
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
