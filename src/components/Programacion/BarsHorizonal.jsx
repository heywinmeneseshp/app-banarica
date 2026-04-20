import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';



export default function BarHorizontal({ data }) {
  const hasBalanceSeries = data.some(
    (item) => item?.Cargado !== undefined || item?.Consumido !== undefined,
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{
          top: 20,
          right: 40,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="Fecha" />
        <Tooltip />
        <Legend />
        <ReferenceLine x={0} stroke="#000" />
        {hasBalanceSeries ? (
          <>
            <Bar dataKey="Cargado" name="Cargado" fill="#198754" />
            <Bar dataKey="Consumido" name="Consumido" fill="#dc3545" />
          </>
        ) : (
          <Bar dataKey="Recorrido" name="Recorrido" fill="#0d6efd" />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}


