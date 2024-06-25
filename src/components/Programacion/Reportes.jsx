// components/TablaViajes.tsx

import React, { useEffect, useRef, useState } from 'react';

import { paginarRecord_consumo } from '@services/api/record_consumo';
import Bars from './Bars';
import Tabla from '@components/shared/Tablas/Tabla';
import BarHorizontar from './BarsHorizonal';



export default function Reportes() {

    const [dataTable, setDataTable] = useState([]);
    const [resTotal, setResTotal] = useState([]);
    const [dataBar, setDataBar] = useState([]);
    const formRef = useRef();
    const [initialDate, setInitialDate] = useState();
    const [finalDate, setFinalDate] = useState();



    useEffect(() => {
        listar();
    }, []);


    const listar = async () => {
        const formData = new FormData(formRef.current);
        const date = new Date();
        // Formatear la fecha a YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
        const day = String(date.getDate()).padStart(2, '0');


        const formattedDate = `${year}-${month}-${day}`;

        let fechaInicial = formData.get("fecha") ? formData.get("fecha") : `${year}-${month}-01`;


        if (fechaInicial.includes('-')) {
            const [year, month, day] = fechaInicial.split('-').map(Number);
            // Crear una fecha en la zona horaria local
            fechaInicial = new Date(year, month - 1, day);
        } else {
            fechaInicial = new Date(fechaInicial);
        }
        const anho = fechaInicial.getFullYear();
        const mes = String(fechaInicial.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
        const diaMes = String(fechaInicial.getDate()).padStart(2, '0');
        fechaInicial = `${anho}-${mes}-${diaMes}`;
        setInitialDate(fechaInicial);
        setFinalDate(formattedDate);
        const body = {
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: fechaInicial,
            liquidado: true,
        };
        let fechaFin = formData.get("fecha_fin") ? formData.get("fecha_fin") : formattedDate;
        if (fechaFin) body.fechaFin = fechaFin;


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
                "Gal por km real": parseFloat(dataBar[item].gal_por_km_real / dataBar[item].conteo).toFixed(4),
                "Gal por Km teorico": (dataBar[item].gal_por_km / dataBar[item].conteo).toFixed(4),
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
    };

    return (
        <>
            <form ref={formRef} style={{ minWidth: '90vw' }} method="POST" className="container" action="/crear-conductor">

                <div className="row col-md-12 row">
                    <div className="mb-2 col-md-2 col-lg-2">
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                            type="text"
                            id="semana"
                            name="semana"
                            onChange={() => listar()}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="fecha" className="form-label mb-1">Fecha inicial</label>
                        <input
                            type="date"
                            id="fecha"
                            name="fecha"
                            onChange={() => listar()}
                            defaultValue={initialDate}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="fecha" className="form-label mb-1">Fecha final</label>
                        <input
                            type="date"
                            id="fecha_fin"
                            name="fecha_fin"
                            onChange={() => listar()}
                            defaultValue={finalDate}
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="vehiculo" className="form-label mb-1">Vehiculo</label>
                        <input
                            type="text"
                            id="vehiculo"
                            name="vehiculo"
                            onChange={() => listar()}
                            className="form-control form-control-sm" />
                    </div>
                    <div className="mb-2 col-md-2">
                        <label htmlFor="articulo">Conductor</label>
                        <div>
                            <input
                                id='conductor'
                                name='conductor'
                                type="text"
                                list="conductorItems"
                                className="form-control form-control-sm"
                                onChange={() => listar()}
                            />
                        </div>
                    </div>

                </div>
            </form >

            <section className="mt-4">
                <div className="row">
                    <div className="col-md-8">
                        <div>
                            <Tabla data={dataTable} total={resTotal} />
                        </div>
                        <div className="mt-4" >
                            <Bars data={dataTable} valores={"Fecha"} items={"Recorrido"} />
                        </div>

                    </div>
                    <div className="col-md-4">
                        
                        <BarHorizontar data={dataBar} />
                    </div>
                </div>
            </section>


        </>
    );
}
