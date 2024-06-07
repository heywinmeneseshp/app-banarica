// components/TablaViajes.tsx
import React, { useEffect, useState, useRef } from 'react';


import * as XLSX from 'xlsx';

import { listarConductores } from '@services/api/conductores';
import { listarVehiculo } from '@services/api/vehiculos';
import { paginarRecord_consumo } from '@services/api/record_consumo';
import { Button } from 'react-bootstrap';
import Bars from './Bars';


export default function ReportesConsumo() {



    const [conductores, setConductores] = useState([]);
    const [vehiculosLista, setVehiculosList] = useState([]);

    const formRef = useRef();

    useEffect(() => {
        listar();
    }, [],);

    const listar = async () => {
        const formData = new FormData(formRef.current);

        const body = {
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha")
        };

        let fechaFin = formData.get("fecha_fin");
        if (fechaFin) body.fechaFin = fechaFin;

        const {data} = await paginarRecord_consumo(null, null, body);
        const newData = data.map( (item) => {
            const stockInicial = parseFloat(item?.stock_inicial || 0).toFixed(2);
            const stockReal = parseFloat(item?.stock_real || 0).toFixed(2);
            const stockFinal = parseFloat(item?.stock_final || 0).toFixed(2);
            const tanqueo = parseFloat(item?.tanqueo || 0).toFixed(2);
            const recorridos = parseFloat(item?.km_recorridos || 0).toFixed(2);
            const gal_por_km = parseFloat(item?.gal_por_km || 0).toFixed(4);
            const consumo_real = (parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)).toFixed(2);
            const gal_por_km_real = ((parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)) / recorridos).toFixed(4);
            const consumo_teorico = (recorridos * gal_por_km).toFixed(2);
            const diferencia = (stockReal - stockFinal).toFixed(2);
            return {
                "Fecha": { v: item.fecha, s: { fill: { fgColor: { rgb: "FFFF00" } } } },
                "Vehículo": item?.vehiculo?.placa,
                "Conductor": item?.conductore?.conductor,
                "Stock incial": stockInicial.replace(".", ","),
                "Recorrido": recorridos.replace(".", ","),
                "Gal por km teórico": gal_por_km.replace(".", ","),
                "Gal por km real": stockReal !=0  ? gal_por_km_real.replace(".", ",") : null,
                "Consumo teórico": stockReal !=0 ? consumo_teorico.replace(".", ",") : null,
                "Consumo real": stockReal !=0 ? consumo_real.replace(".", ",") : null,
                "Tanqueo": stockReal !=0 ? tanqueo.replace(".", ",") : null,
                "Stock final": stockReal !=0 ? (stockFinal).replace(".", ",") : null,
                "Stock real": stockReal !=0 ? (stockReal).replace(".", ",") : null,
                "Diferencia": diferencia ? diferencia.replace(".", ",") : null,
            };
        });

        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData);
        XLSX.utils.book_append_sheet(book, sheet, "Consumos");
        XLSX.writeFile(book, `Historial de consumos.xlsx`);
    };

    // Función para calcular el recorrido de cada vehículo
    function calcularRecorrido(vehiculo, datos) {
        let recorridoTotal = 0;
        let conteo = 0;
        for (const registro of datos) {
            console.log(registro);
            if (registro.vehiculo.placa === vehiculo) {
                const recorrido = registro.km_recorridos ? registro.km_recorridos : 0;
                recorridoTotal = recorridoTotal + recorrido;
                conteo = conteo + 1;
            };
        };
        return recorridoTotal;
    };





    const descargarExcel = async () => {
        const formData = new FormData(formRef.current);

        const body = {
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha")
        };

        let fechaFin = formData.get("fecha_fin");
        if (fechaFin) body.fechaFin = fechaFin;

        const { data } = await paginarRecord_consumo(null, null, body);
        console.log(data);

        const newData = data.map((item) => {
            const stockInicial = parseFloat(item?.stock_inicial || 0).toFixed(2);
            const stockReal = parseFloat(item?.stock_real || 0).toFixed(2);
            const stockFinal = parseFloat(item?.stock_final || 0).toFixed(2);
            const tanqueo = parseFloat(item?.tanqueo || 0).toFixed(2);
            const recorridos = parseFloat(item?.km_recorridos || 0).toFixed(2);
            const gal_por_km = parseFloat(item?.gal_por_km || 0).toFixed(4);
            const consumo_real = (parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)).toFixed(2);
            const gal_por_km_real = ((parseFloat(stockInicial) + parseFloat(tanqueo) - parseFloat(stockReal)) / recorridos).toFixed(4);
            const consumo_teorico = (recorridos * gal_por_km).toFixed(2);
            const diferencia = (stockReal - stockFinal).toFixed(2);
            return {
                "Fecha": { v: item.fecha, s: { fill: { fgColor: { rgb: "FFFF00" } } } },
                "Vehículo": item?.vehiculo?.placa,
                "Conductor": item?.conductore?.conductor,
                "Stock incial": stockInicial.replace(".", ","),
                "Recorrido": recorridos.replace(".", ","),
                "Gal por km teórico": gal_por_km.replace(".", ","),
                "Gal por km real": stockReal != 0 ? gal_por_km_real.replace(".", ",") : null,
                "Consumo teórico": stockReal != 0 ? consumo_teorico.replace(".", ",") : null,
                "Consumo real": stockReal != 0 ? consumo_real.replace(".", ",") : null,
                "Tanqueo": stockReal != 0 ? tanqueo.replace(".", ",") : null,
                "Stock final": stockReal != 0 ? (stockFinal).replace(".", ",") : null,
                "Stock real": stockReal != 0 ? (stockReal).replace(".", ",") : null,
                "Diferencia": diferencia ? diferencia.replace(".", ",") : null,
            };
        });

        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData);
        XLSX.utils.book_append_sheet(book, sheet, "Movimientos");
        XLSX.writeFile(book, `Historial de movimientos.xlsx`);
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
                            className="form-control form-control-sm" />
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="fecha" className="form-label mb-1">Fecha final</label>
                        <input
                            type="date"
                            id="fecha_fin"
                            name="fecha_fin"
                            onChange={() => listar()}
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
                            <datalist
                                id="conductorItems"
                                name='conductorItems'
                            >
                                <option value={""} />
                                {conductores.map((item, index) => (
                                    <option key={index} value={item.conductor} />
                                ))}
                            </datalist>

                        </div>
                    </div>


                    <div className="mb-2 col-md-2">
                        <Button type="button" onClick={() => descargarExcel()} className="w-100 mt-4" variant="success" size="sm">
                            Descargar Excel
                        </Button>
                    </div>
                </div>
            </form >

            <section className='container'>

                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th scope="col">Vehiculo</th>
                            <th scope="col">Consumo teorico</th>
                            <th scope="col">Consumo real</th>
                            <th scope="col">Diferencia</th>
                            <th scope="col">Km recorridos</th>
                            <th scope="col">Consumo por Km teorico</th>
                            <th scope="col">Consumo por Km promedio</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td> </td>
                            <td>Mark</td>
                            <td>Otto</td>
                            <td>@mdo</td>
                            <td>@mdo</td>
                            <td>@mdo</td>
                            <td>@mdo</td>
                        </tr>
                    </tbody>
                </table>


                <Bars></Bars>
            </section>
        </>
    );
}
