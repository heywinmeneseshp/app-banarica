// components/TablaViajes.tsx

import React, { useEffect, useState, useRef } from 'react';
import style from "@components/Programacion/camiones.module.css";
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';
import { paginarNotificaciones } from '@services/api/notificaciones';


import useAlert from '@hooks/useAlert';


export default function Notificaciones() {

    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(25);
    const [itemList, setItemsList] = useState([]);
    const [open, setOpen] = useState(false);
    const { alert, setAlert, toogleAlert } = useAlert();
    const formRef = useRef();

    useEffect(() => {
        listar();
    }, [pagination, alert],);

    const listar = async () => {
        const res = await paginarNotificaciones(pagination, 50, {});
        setItemsList(res.data);
        setTotal(res.total);
        setLimit(50);
    };

    return (

        <>
            <Alertas alert={alert} handleClose={toogleAlert} />
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
                        <label htmlFor="fecha" className="form-label mb-1">Fecha</label>
                        <input
                            type="date"
                            id="fecha"
                            name="fecha"
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

                    <div className='col-md-3 col-lg-2 mt-4'>
                        <button type="button" className={`btn btn-success text-center w-100`}>
                            Descargar Excel
                        </button>
                    </div>

                </div>

            </form>

            <div className={style.texto}>
                <table className="table table-striped table-bordered table-sm mt-4">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Vehículo</th>
                            <th>Descripción</th>
                            <th>Stock final</th>
                            <th>Stock real</th>
                            <th>Diferencia %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemList.map((item, index) => {

                            const diferencia = item?.dif_porcentual_consumo;
                            const color = diferencia > 0 ? "success" : "danger";

                            return (<tr key={index}>
                                <td className={`table-${color}`}>{item?.record_consumo?.fecha}</td>
                                <td className={`table-${color}`}>{item?.record_consumo?.vehiculo?.placa}</td>
                                <td className={`table-${color}`}>{item?.descripcion}</td>
                                <td className={`table-${color}`}>{item?.record_consumo?.stock_final}</td>
                                <td className={`table-${color}`}>{item?.record_consumo?.stock_real}</td>
                                <td className={`table-${color}`}>{diferencia} %</td>
                            </tr>);

                        })}

                    </tbody>
                </table>


                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>
            {open && <FormulariosProgramacion setOpen={setOpen} setAlert={setAlert} />}
        </>
    );
}
