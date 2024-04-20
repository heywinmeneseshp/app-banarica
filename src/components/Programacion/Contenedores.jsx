// components/TablaViajes.tsx

import React, { useEffect, useState, useRef } from 'react';
import style from "@components/Programacion/camiones.module.css";
import Paginacion from '@components/shared/Tablas/Paginacion';
import Alertas from '@assets/Alertas';

import {  paginarProgramaciones } from '@services/api/programaciones';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import useAlert from '@hooks/useAlert';
import FormulariosProgramacionEditar from '@components/shared/Formularios/FormularioProgramacionEditar';



export default function Programador() {

    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState();
    const [limit, setLimit] = useState(25);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [itemList, setItemsList] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [open, setOpen] = useState(false);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [element, setElement] = useState();
    const formRef = useRef();

    const onEditar = (item) => {
        setElement(item);
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
            ubicacion1: formData.get("origen"),
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha"),
            movimiento: "Contenedor"
        };
        console.log(body);
        const res = await paginarProgramaciones(pagination, limit, body);
        setItemsList(res.data);
        setTotal(res.total);
        setLimit(25);
    };

    return (
        <>
            <Alertas alert={alert} handleClose={toogleAlert} />
         
            {open &&
               <FormulariosProgramacionEditar 
               element={element} setOpen={setOpen} setAlert={setAlert} />

            }
            <form ref={formRef} method="POST" className="container" action="/crear-conductor">

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

                    <div className="mb-2 col-md-2">
                        <label htmlFor="origen" className="form-label mb-1">Finca</label>
                        <select
                            id="origen"
                            name="origen"
                            className="form-control form-control-sm"
                            onChange={() => listar()}
                        >
                            <option value={""} defaultValue=""></option>
                            {ubicaciones.map((item) => (
                                <option key={item.id} value={item.id}>{item.ubicacion}</option>
                            ))}
                        </select>
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
                            <th >Sem</th>
                            <th>Vehiculo</th>
                            <th className='bg-success text-white text-center'>Finca</th>
                            <th className='bg-success text-white text-center'>Llegada</th>
                            <th className='bg-success text-white text-center'>Cierre</th>
                            <th className='bg-success text-white text-center'>Salida</th>
                            <th className='bg-secondary text-white text-center'>Contenedores</th>
                            <th className='bg-secondary text-white text-center'></th>

                        </tr>
                    </thead>
                    <tbody>
                        {itemList.map((item, index) => {

                            return (<tr key={index}>
                                <td>{item?.fecha}</td>
                                <td >{item?.semana}</td>
                                <td>{item?.vehiculo?.placa}</td>
                                <td className='table-success text-center'>{item?.ruta?.ubicacion_1?.ubicacion}</td>
                                <td className='table-success text-center'>{item?.llegada_origen}</td>
                                <td className='table-success text-center'>{item?.cierre}</td>
                                <td className='table-success text-center'>{item?.salida_origen}</td>
                                <td className='table-secondary text-center'><b>{item?.contenedor}</b></td>
                                <td className='table-secondary text-center'><button onClick={()=>onEditar(item)} className='btn-primary btn-warning btn btn-sm'>Editar</button></td>
                            </tr>);

                        })}

                    </tbody>
                </table>


                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>

        </>
    );
}
