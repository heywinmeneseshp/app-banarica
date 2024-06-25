import React, { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';


export default function Bars({ data }) {

    const [minimo, setMinimo] = useState(-100);
    const [maximo, setMaximo] = useState(100);

    useEffect(() => {
        let max = 0;
        let min = 0;
        data.map(item => {
            if ((item.Diferencia*1) > max) max = item.Diferencia;
            if ((item.Diferencia*1) < min) min = item.Diferencia;
        });

        if(min < 0)  min = min * -1;
        if(max < 0)  max = max * -1;

        if (min > max) {
            max = min;
        } else {
            min = max;
        }

        setMaximo(max);
        setMinimo(min*-1);

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
                <XAxis type="category" dataKey="Item" />
                <YAxis domain={[minimo, maximo]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Diferencia" fill="#0d6efd" />

            </BarChart>
        </ResponsiveContainer>
    );
}
