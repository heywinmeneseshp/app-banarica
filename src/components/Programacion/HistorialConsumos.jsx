// components/TablaViajes.tsx

import React, { useEffect, useState, useRef } from 'react';
import style from "@components/Programacion/camiones.module.css";
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';

import { listarProgramaciones, paginarProgramaciones } from '@services/api/programaciones';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import { listarRecord_consumo, paginarRecord_consumo } from '@services/api/record_consumo';
import useAlert from '@hooks/useAlert';


export default function Programador() {

    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(25);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [itemList, setItemsList] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [open, setOpen] = useState(false);
    const { alert, setAlert, toogleAlert } = useAlert();
    const formRef = useRef();

    const handleNuevoMovi = async () => {
        setOpen(true);
    };

    useEffect(() => {
        listar();
    }, [pagination, alert],);

    const listar = async () => {
        const formData = new FormData(formRef.current);
        const newUbicaciones = await listarUbicaciones();
        const newConductores = await listarConductores();
        setUbicaciones(newUbicaciones);
        setConductores(newConductores);


        const body = {
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha")
        };
        const res = await paginarRecord_consumo(pagination, limit, body);
        console.log(res);
        setItemsList(res.data);
        setTotal(res.total);
        setLimit(50);
    };

    return (
        <>
            <Alertas alert={alert} handleClose={toogleAlert} />
            <form ref={formRef}  style={{ minWidth: '90vw' }} method="POST" className="container" action="/crear-conductor">

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

                    <div className='col-md-3 col-lg-2 mt-4'>
                        <button onClick={() => handleNuevoMovi()} type="button" className={`btn btn-primary text-center w-100`}>
                            Nuevo Movimiento
                        </button>
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
                            <th className='col d-none d-lg-block'>Sem</th>
                            <th>Vehiculo</th>
                            <th className='col d-none d-lg-block'>Conductor</th>
                            <th className='text-center'>Stock Inicial</th>
                            <th className='bg-danger text-white text-center'>Consumo</th>
                            <th className='bg-success text-white text-center'>Tanqueo</th>
                            <th className='text-center'>Stock Final</th>
                            <th className='bg-info  text-center'>Stock Real</th>
                      
                            <th className='bg-warning text-black text-center'>Diferencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemList.map((item, index) => {
                           
                            return (<tr key={index}>
                                <td>{item?.fecha}</td>
                                <td className='col d-none d-lg-block'>{item?.semana}</td>
                                <td>{item?.vehiculo?.placa}</td>
                                <td className='col d-none d-lg-block'>{item?.conductore?.conductor}</td>
                                <td className=' text-center'>{item?.stock_inicial}</td>
                                <td className='table-danger text-center'>{item?.stock_final - item?.stock_inicial - item?.tanqueo}</td>
                                <td className='table-success text-center'>{item?.tanqueo}</td>
                                <td className=' text-center'>{item?.stock_final}</td>
                                <td className='table-info  text-center'>{item?.stock_real}</td>
                                <td className='table-warning text-center'>{item?.stock_real - item?.stock_final}</td>
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
