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
        <XAxis type="number" domain={[-180, 180]} />
        <YAxis type="category" dataKey="Item" />
        <Tooltip />
        <Legend />
        <ReferenceLine x={0} stroke="#000" />
        <Bar dataKey="Diferencia" fill="#0d6efd" />
      </BarChart>
    </ResponsiveContainer>
  );
}


