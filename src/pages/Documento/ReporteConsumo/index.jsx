// components/TablaViajes.tsx

import React, { useEffect, useState } from 'react';

import { paginarRecord_consumo } from '@services/api/record_consumo';
import Bars from '@components/Programacion/Bars';
import Tabla from '@components/shared/Tablas/Tabla';
import BarHorizontar from '@components/Programacion/BarsHorizonal';
import { useRouter } from 'next/router';



export default function Reportes() {

    const router = useRouter();
    const { query } = router;

    const [dataTable, setDataTable] = useState([]);
    const [resTotal, setResTotal] = useState([]);
    const [dataBar, setDataBar] = useState([]);

    useEffect(() => {
        listar();
    }, [query?.anho]);


    const listar = async () => {

        const body = {
            liquidado: true,
        };

        if (query?.sem) {
            body.semana = query?.sem;
            body.fecha = `${query?.anho}-01-01`;
            body.fechaFin = `${query?.anho}-12-31`;;
        } else if (query?.anho) {
            const years = query?.anho; // Obtén el año actual
            const months = query?.mes; - 1; // Mayo es el mes 4 (0-indexed en JavaScript)

            const firstDayOfMonth = new Date(years, months -1, 1);
            const lastDayOfMonth = new Date(years, months, 0);
            const formattedFirstDay = firstDayOfMonth.toISOString().split('T')[0];
            const formattedLastDay = lastDayOfMonth.toISOString().split('T')[0];
            body.fecha = formattedFirstDay;
            body.fechaFin = formattedLastDay;
            console.log(formattedFirstDay, formattedLastDay);
        };
if(query?.anho){
        const { data } = await paginarRecord_consumo("", "", body);
        let dataBar = {};
        let dia = {};
        data.map((item) => {
            dia[item.fecha] = (dia[item.fecha] || 0) * 1 + parseFloat(item?.km_recorridos);
            const stockInicial = parseFloat(item?.stock_inicial);
            const stockReal = parseFloat(item?.stock_real);
            const tanqueo = parseFloat(item?.tanqueo);
            const recorridos = parseFloat(item?.km_recorridos);
            const gal_por_km = parseFloat(item?.gal_por_km);
            const consumo_real = (parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal));
            const gal_por_km_real = ((parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)) / recorridos);
            const consumo_teorico = (recorridos * gal_por_km);
            if (!dataBar[item?.vehiculo?.placa]) {
                dataBar[item?.vehiculo?.placa] = {}; // Crear un objeto vacío si no existe
                dataBar[item?.vehiculo?.placa].conteo = 0;
                dataBar[item?.vehiculo?.placa].recorrido = 0;
                dataBar[item?.vehiculo?.placa].consumo_teorico = 0;
                dataBar[item?.vehiculo?.placa].consumo_real = 0;
                dataBar[item?.vehiculo?.placa].gal_por_km = 0;
                dataBar[item?.vehiculo?.placa].gal_por_km_real = 0;
            }
            dataBar[item?.vehiculo?.placa].recorrido = dataBar[item?.vehiculo?.placa].recorrido + recorridos;
            dataBar[item?.vehiculo?.placa].conteo = dataBar[item?.vehiculo?.placa].conteo + 1;
            dataBar[item?.vehiculo?.placa].consumo_teorico = dataBar[item?.vehiculo?.placa].consumo_teorico + consumo_teorico;
            dataBar[item?.vehiculo?.placa].consumo_real = dataBar[item?.vehiculo?.placa].consumo_real + consumo_real;
            dataBar[item?.vehiculo?.placa].gal_por_km = dataBar[item?.vehiculo?.placa].gal_por_km + gal_por_km;
            dataBar[item?.vehiculo?.placa].gal_por_km_real = dataBar[item?.vehiculo?.placa].gal_por_km_real + gal_por_km_real;
        });
        let newDataBar = [];
        let total = {};

        Object.keys(dataBar).map(item => {
            newDataBar = [...newDataBar, {
                "Item": item,
                "Consumo real": (dataBar[item].consumo_real).toFixed(2),
                "Consumo teorico": (dataBar[item].consumo_teorico).toFixed(2),
                "Diferencia": (-dataBar[item].consumo_real + dataBar[item].consumo_teorico).toFixed(2),
                "Kms recorridos": dataBar[item].recorrido.toFixed(2),
                "Gal por km real": parseFloat(dataBar[item].consumo_real / dataBar[item].recorrido).toFixed(4),
                "Gal por Km teorico": (dataBar[item].consumo_teorico / dataBar[item].recorrido).toFixed(4),
            }];

            total["Consumo real"] = ((total["Consumo real"] || 0) * 1 + dataBar[item].consumo_real * 1).toFixed(2);
            total["Consumo teorico"] = ((total["Consumo teorico"] || 0) * 1 + dataBar[item].consumo_teorico).toFixed(2);
            total["Diferencia"] = ((total["Diferencia"] || 0) * 1 + (-dataBar[item].consumo_real + dataBar[item].consumo_teorico)).toFixed(2);
            total["Kms recorridos"] = ((total["Kms recorridos"] || 0) * 1 + dataBar[item].recorrido).toFixed(2);
        });
        total["Gal por km real"] = (total["Consumo real"] / total["Kms recorridos"]).toFixed(4);
        total["Gal por Km teorico"] = (total["Consumo teorico"] / total["Kms recorridos"]).toFixed(4);
        total["Item"] = "Total";

        let barList = Object.keys(dia).map((item) => { return ({ Fecha: item, Recorrido: dia[item] }); });
        barList = barList.sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
        setDataBar(barList);
        setResTotal(total);
        setDataTable(newDataBar);
    }
    };

    return (
        <>

            <section className="mt-4 container">
                <div className='container text-center mb-4'><h2>Reporte de recorrido y consumo</h2></div>
                <div className="row">
                    <div className="col-md-8">
                        <div>
                            <Tabla data={dataTable} total={resTotal} />
                        </div>
                        <div className="mt-4" >
                            <Bars data={dataBar} valores={"Fecha"} items={"Recorrido"} />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <BarHorizontar data={dataTable} />
                    </div>
                </div>
            </section>


        </>
    );
}
