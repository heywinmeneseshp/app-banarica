const fs = require('fs');
const path = require('path');

const apiRoot = path.resolve(__dirname, '..', '..', 'api-rest-banarica');
const modelsDir = path.join(apiRoot, 'models');
const migrationsDir = path.join(apiRoot, 'migrations');
const outputPath = path.resolve(__dirname, '..', 'outputs', 'api-relations-audit.md');

const readText = (filePath) => fs.readFileSync(filePath, 'utf8');
const listJsFiles = (dirPath) => fs.readdirSync(dirPath).filter((name) => name.endsWith('.js'));

const parseAssociations = (content, fileName) => {
  const matches = [...content.matchAll(
    /(this|[A-Za-z_][A-Za-z0-9_]*)\.(hasOne|belongsTo|hasMany|belongsToMany)\(\s*models\.([A-Za-z_][A-Za-z0-9_]*)\s*,\s*\{([\s\S]*?)\}\s*\)/g
  )];

  return matches.map((match) => {
    const [, , relationType, targetModel, optionsBlock] = match;
    const getOption = (name) => {
      const optionMatch = optionsBlock.match(new RegExp(`${name}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`));
      return optionMatch ? optionMatch[1] : null;
    };

    return {
      fileName,
      relationType,
      targetModel,
      foreignKey: getOption('foreignKey'),
      sourceKey: getOption('sourceKey'),
      targetKey: getOption('targetKey'),
      as: getOption('as'),
      raw: match[0],
    };
  });
};

const parseInitColumns = (content) => {
  const initMatch = content.match(/\.init\(\s*\{([\s\S]*?)\}\s*,\s*\{/);
  if (!initMatch) {
    return [];
  }

  const block = initMatch[1];
  const columns = [];
  const columnRegex = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/gm;
  let match;
  while ((match = columnRegex.exec(block))) {
    columns.push(match[1]);
  }
  return [...new Set(columns)];
};

const parseMigrationReferences = (content) => {
  const references = [];
  const refRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\{[\s\S]*?references\s*:\s*\{[\s\S]*?model\s*:\s*['"`]([^'"`]+)['"`][\s\S]*?key\s*:\s*['"`]([^'"`]+)['"`][\s\S]*?\}/g;
  let match;
  while ((match = refRegex.exec(content))) {
    references.push({
      column: match[1],
      model: match[2],
      key: match[3],
    });
  }
  return references;
};

const parseCreateTableName = (content) => {
  const match = content.match(/createTable\(\s*['"`]([^'"`]+)['"`]/);
  return match ? match[1] : null;
};

const models = [];
for (const fileName of listJsFiles(modelsDir)) {
  if (fileName === 'index.js') continue;
  const fullPath = path.join(modelsDir, fileName);
  const content = readText(fullPath);
  models.push({
    fileName,
    fullPath,
    columns: parseInitColumns(content),
    associations: parseAssociations(content, fileName),
  });
}

const migrations = [];
for (const fileName of listJsFiles(migrationsDir)) {
  const fullPath = path.join(migrationsDir, fileName);
  const content = readText(fullPath);
  migrations.push({
    fileName,
    tableName: parseCreateTableName(content),
    references: parseMigrationReferences(content),
  });
}

const suspiciousAssociations = [];
for (const model of models) {
  for (const assoc of model.associations) {
    const hasLocalIdKey = assoc.sourceKey && /^id_|_id$/.test(assoc.sourceKey);
    const pointsToRemoteId = assoc.foreignKey === 'id';
    const looksLikeInverseLookup = assoc.relationType === 'hasOne' && hasLocalIdKey && pointsToRemoteId;
    const localColumnMatchesForeignKey = assoc.foreignKey && model.columns.includes(assoc.foreignKey);

    if (looksLikeInverseLookup || (assoc.relationType === 'hasOne' && localColumnMatchesForeignKey)) {
      suspiciousAssociations.push({
        model: model.fileName,
        relationType: assoc.relationType,
        targetModel: assoc.targetModel,
        foreignKey: assoc.foreignKey,
        sourceKey: assoc.sourceKey,
        targetKey: assoc.targetKey,
        alias: assoc.as,
      });
    }
  }
}

const referenceRows = migrations.flatMap((migration) =>
  migration.references.map((reference) => ({
    migration: migration.fileName,
    tableName: migration.tableName,
    ...reference,
  }))
);

const foreignKeyLikeColumns = models.flatMap((model) =>
  model.columns
    .filter((column) => /(^id_|_id$|^cons_)/.test(column))
    .map((column) => ({
      model: model.fileName,
      column,
      hasMigrationReference: referenceRows.some((reference) => reference.column === column),
    }))
);

const missingReferences = foreignKeyLikeColumns.filter((row) => !row.hasMigrationReference);

const relationSparseTables = migrations
  .filter((migration) => migration.tableName)
  .map((migration) => ({
    tableName: migration.tableName,
    migration: migration.fileName,
    referenceCount: migration.references.length,
  }))
  .filter((row) => row.referenceCount === 0)
  .sort((left, right) => left.tableName.localeCompare(right.tableName));

const lines = [];
lines.push('# Auditoria de relaciones API / MySQL');
lines.push('');
lines.push(`- Fecha: ${new Date().toISOString()}`);
lines.push(`- API auditada: \`${apiRoot}\``);
lines.push('');
lines.push('## Resumen');
lines.push('');
lines.push(`- Modelos revisados: ${models.length}`);
lines.push(`- Migraciones revisadas: ${migrations.length}`);
lines.push(`- Asociaciones sospechosas: ${suspiciousAssociations.length}`);
lines.push(`- Columnas tipo FK/relacion sin \`references\` en migraciones: ${missingReferences.length}`);
lines.push(`- Tablas creadas sin ninguna referencia declarada: ${relationSparseTables.length}`);
lines.push('');

lines.push('## Asociaciones sospechosas en modelos');
lines.push('');
if (suspiciousAssociations.length === 0) {
  lines.push('- No se detectaron asociaciones sospechosas con la heuristica actual.');
} else {
  for (const item of suspiciousAssociations) {
    lines.push(`- \`${item.model}\`: \`${item.relationType}\` hacia \`${item.targetModel}\` con foreignKey=\`${item.foreignKey || '-'}\`, sourceKey=\`${item.sourceKey || '-'}\`, targetKey=\`${item.targetKey || '-'}\`${item.alias ? `, as=\`${item.alias}\`` : ''}`);
  }
}
lines.push('');

lines.push('## Columnas relacionales sin FK real en migraciones');
lines.push('');
if (missingReferences.length === 0) {
  lines.push('- Todas las columnas tipo relacion detectadas tienen alguna referencia declarada.');
} else {
  for (const item of missingReferences) {
    lines.push(`- \`${item.model}\` -> columna \`${item.column}\``);
  }
}
lines.push('');

lines.push('## Tablas creadas sin references');
lines.push('');
for (const item of relationSparseTables) {
  lines.push(`- \`${item.tableName}\` (${item.migration})`);
}
lines.push('');

lines.push('## Hallazgos clave');
lines.push('');
lines.push('- El esquema depende mucho mas de asociaciones Sequelize que de llaves foraneas reales en MySQL.');
lines.push('- Varias relaciones de tipo padre-hijo estan modeladas como `hasOne` cuando por semantica de la columna local parecen `belongsTo`.');
lines.push('- Al migrar entre servidores MySQL, esto deja espacio para datos huerfanos, diferencias de orden de carga y errores al intentar recrear integridad referencial.');
lines.push('');

lines.push('## Ejemplos de alto riesgo');
lines.push('');
lines.push('- `Listado.id_embarque`, `Listado.id_contenedor`, `Listado.id_lugar_de_llenado`, `Listado.id_producto`: no tienen FK real en la migracion de `Listados`.');
lines.push('- `Embarques.id_semana`, `id_cliente`, `id_destino`, `id_naviera`, `id_buque`: tampoco tienen `references` en su migracion.');
lines.push('- `Inspeccions.id_contenedor` no tiene FK real en migracion.');
lines.push('- `Transbordos.id_contenedor_viejo` e `id_contenedor_nuevo` no tienen FK real.');
lines.push('- `serial_de_articulos` solo declara referencia para `cons_producto`; `id_contenedor`, `id_motivo_de_uso`, `id_usuario`, `cons_movimiento` quedaron sin FK.');
lines.push('');

lines.push('## Recomendacion tecnica');
lines.push('');
lines.push('1. Corregir asociaciones Sequelize para usar `belongsTo` donde la tabla actual guarda la FK.');
lines.push('2. Crear migraciones nuevas para agregar FKs reales en MySQL, con limpieza previa de datos huerfanos.');
lines.push('3. Auditar datos existentes antes de activar FKs para evitar que el alter falle.');
lines.push('4. Si el dump falla al importar, revisar tambien `DEFINER`, charset/collation y version del motor MySQL.');
lines.push('');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');

console.log(outputPath);
