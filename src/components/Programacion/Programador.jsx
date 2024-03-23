// components/TablaViajes.tsx

import React, { useEffect, useState, useRef } from 'react';
import style from "@components/Programacion/camiones.module.css";
import Paginacion from '@components/shared/Tablas/Paginacion';
import FormulariosProgramacion from '@components/shared/Formularios/FormularioProgramacion';
import Alertas from '@assets/Alertas';
import menos from '@public/images/menos.png';

import { paginarProgramaciones, eliminarProgramaciones } from '@services/api/programaciones';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import useAlert from '@hooks/useAlert';
import FormulariosProgramacionEditar from '@components/shared/Formularios/FormularioProgramacionEditar';
import Image from 'next/image';
import excel from '@hooks/useExcel';



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
    const [element, setElement] = useState();
    const [openEditar, setOpenEditar] = useState(false);
    const [change, setChange] = useState(false);


    const handleNuevoMovi = async () => {
        setOpen(true);
    };

    useEffect(() => {
        listar();
    }, [pagination, alert, change],);

    const listar = async () => {
        const formData = new FormData(formRef.current);
        const newUbicaciones = await listarUbicaciones();
        const newConductores = await listarConductores();
        setUbicaciones(newUbicaciones);
        setConductores(newConductores);

        const body = {
            ubicacion1: formData.get("origen"),
            ubicacion2: formData.get("destino"),
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha"),
            movimiento: formData.get("movimiento"),
        };
        const res = await paginarProgramaciones(pagination, limit, body);
        setItemsList(res.data);
        setTotal(res.total);
        setLimit(25);
    };

    const onEditar = (item) => {
        setElement(item);
        setOpenEditar(true);
    };

    const eliminar = async (id) => {
        await eliminarProgramaciones(id);
        setChange(!change);
        setAlert({
            active: true,
            mensaje: "El item ha sido eliminado",
            color: "success",
            autoClose: true
        });
    };

    const descargarExel = async () => {
        const formData = new FormData(formRef.current);
        const body = {
            ubicacion1: formData.get("origen"),
            ubicacion2: formData.get("destino"),
            semana: formData.get("semana"),
            vehiculo: formData.get("vehiculo"),
            conductor: formData.get("conductor") ? formData.get("conductor") : "",
            fecha: formData.get("fecha"),
            movimiento: formData.get("movimiento"),
        };
        const { data } = await paginarProgramaciones(pagination, limit, body);
        const fecha = new Date().getDate();
        excel(data, `Programacion ${fecha}`, "Programacion");

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
                        <label htmlFor="origen" className="form-label mb-1">Origen</label>
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

                    <div className="mb-2 col-md-2">
                        <label htmlFor="destino" className="form-label mb-1">Destino</label>
                        <select
                            id="destino"
                            name="destino"
                            className="form-control form-control-sm"
                            onChange={() => listar()}
                        >

                            <option value={""} defaultValue=""></option>
                            {ubicaciones.map((item) => (
                                <option key={item.id} value={item.id}>{item.ubicacion}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="articulo">Movimiento</label>
                        <div>
                            <input
                                id='movimiento'
                                name='movimiento'
                                type="text"
                                list="movimientoList"
                                className="form-control form-control-sm"
                                onChange={() => listar()}
                            />
                            <datalist
                                id="movimientoList"
                                name='movimientoList'
                            >
                                <option value={"Local"} />
                                <option value={"Puerto"} />
                                <option value={"Contenedor"} />
                                <option value={"Transitorio"} />
                                <option value={"Otro"} />
                            </datalist>

                        </div>
                    </div>

                    <div className='col-md-3 col-lg-2 mt-4'>
                        <button onClick={() => handleNuevoMovi()} type="button" className={`btn btn-primary text-center w-100`}>
                            Nuevo Movimiento
                        </button>
                    </div>

                    <div className='col-md-3 col-lg-2 mt-4'>
                        <button onClick={() => descargarExel()} type="button" className={`btn btn-success text-center w-100`}>
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
                            <th className='bg-success text-white text-center'>Origen</th>
                            <th className='bg-success text-white text-center col d-none d-lg-block'>Llegada</th>
                            <th className='bg-success text-white text-center'>Salida</th>
                            <th className='bg-primary text-white text-center'>Destino</th>
                            <th className='bg-primary text-white text-center col d-none d-lg-block'>Llegada</th>
                            <th className='bg-primary text-white text-center'>Salida</th>
                            <th>Movimiento</th>
                            <th>Editar</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemList.map((item, index) => {
                            return (<tr key={index}>
                                <td>{item?.fecha}</td>
                                <td className=''>{item?.semana}</td>
                                <td>{item?.vehiculo?.placa}</td>
                                <td className=''>{item?.conductor?.conductor}</td>
                                <td className='table-success text-center'>{item?.ruta?.ubicacion_1?.ubicacion}</td>
                                <td className='table-success text-center'>{item.llegada_origen}</td>
                                <td className='table-success text-center'>{item.salida_origen}</td>
                                <td className='table-primary text-center'>{item?.ruta?.ubicacion_2?.ubicacion}</td>
                                <td className='table-primary text-center'>{item.llegada_destino}</td>
                                <td className='table-primary text-center'>{item.salida_destino}</td>
                                <td>{item?.movimiento}</td>
                                <td className='table- text-center'><button onClick={() => onEditar(item)} className='btn-primary btn-warning btn btn-sm'>Editar</button></td>
                                <th className='text-center align-middle'>
                                    {item.activo && <Image style={{ cursor: 'pointer' }} onClick={() => eliminar(item.id)} width="20" height="20" src={menos} alt="menos" />
                                    }
                                </th>
                            </tr>);

                        })}

                    </tbody>
                </table>


                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>
            {open && <FormulariosProgramacion setOpen={setOpen} setAlert={setAlert} />}
            {openEditar && <FormulariosProgramacionEditar element={element} setOpen={setOpenEditar} setAlert={setAlert} />}
        </>
    );
}
