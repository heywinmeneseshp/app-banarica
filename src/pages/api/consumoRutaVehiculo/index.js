import store from './store';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(store.getAll());
  }

  if (req.method === 'POST') {
    const { vehiculo_id, ruta_id, consumo_por_km, activo } = req.body;

    if (!vehiculo_id || !ruta_id || consumo_por_km === undefined || consumo_por_km === null) {
      return res.status(400).json({ error: 'vehiculo_id, ruta_id y consumo_por_km son obligatorios.' });
    }

    const record = store.create({ vehiculo_id, ruta_id, consumo_por_km, activo });
    return res.status(201).json(record);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
