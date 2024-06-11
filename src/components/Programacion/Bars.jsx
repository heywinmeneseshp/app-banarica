import React, { useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';


export default function Bars({data}) {

    useEffect(() => {
    }, [data]);
    return (
        <ResponsiveContainer width="100%" aspect={2}>
            <BarChart
                data={data}
                width={300}
                height={100}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                <CartesianGrid strokeDasharray="4 1 2" />
                <XAxis dataKey="Fecha" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Recorrido" fill="#0d6efd" />

            </BarChart>
        </ResponsiveContainer>
    );
}
