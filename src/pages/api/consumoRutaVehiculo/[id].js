import store from './store';

export default function handler(req, res) {
  const { id } = req.query;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  const record = store.getById(numericId);
  if (!record) {
    return res.status(404).json({ error: 'Registro no encontrado.' });
  }

  if (req.method === 'PATCH') {
    const { vehiculo_id, ruta_id, consumo_por_km, activo } = req.body;
    const updated = store.update(numericId, { vehiculo_id, ruta_id, consumo_por_km, activo });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    store.remove(numericId);
    return res.status(200).json({ message: 'Registro eliminado.' });
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
