let data = [];
let nextId = 1;

const getAll = () => data;

const getById = (id) => data.find((item) => item.id === id);

const create = (item) => {
  const record = {
    id: nextId++,
    vehiculo_id: item.vehiculo_id,
    ruta_id: item.ruta_id,
    consumo_por_km: Number(item.consumo_por_km),
    activo: item.activo === undefined ? true : Boolean(item.activo),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  data.push(record);
  return record;
};

const update = (id, changes) => {
  const record = getById(id);
  if (!record) return null;

  if (changes.vehiculo_id !== undefined) {
    record.vehiculo_id = changes.vehiculo_id;
  }
  if (changes.ruta_id !== undefined) {
    record.ruta_id = changes.ruta_id;
  }
  if (changes.consumo_por_km !== undefined) {
    record.consumo_por_km = Number(changes.consumo_por_km);
  }
  if (changes.activo !== undefined) {
    record.activo = Boolean(changes.activo);
  }

  record.updated_at = new Date().toISOString();
  return record;
};

const remove = (id) => {
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return false;
  data.splice(index, 1);
  return true;
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
};
