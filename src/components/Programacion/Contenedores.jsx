import React, { useEffect, useState, useRef } from 'react';
import style from "@components/Programacion/camiones.module.css";
import Paginacion from '@components/shared/Tablas/Paginacion';
import Alertas from '@assets/Alertas';

import { paginarProgramaciones } from '@services/api/programaciones';
import { listarUbicaciones } from '@services/api/ubicaciones';
import { listarConductores } from '@services/api/conductores';
import useAlert from '@hooks/useAlert';
import FormulariosProgramacionEditar from '@components/shared/Formularios/FormularioProgramacionEditar';

export default function Programador() {
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(25);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [itemList, setItemsList] = useState([]);
    const [conductores, setConductores] = useState([]);
    const [open, setOpen] = useState(false);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [element, setElement] = useState(null);
    const formRef = useRef(null);

    // Manejo de la edición
    const onEditar = (item) => {
        setElement(item);
        setOpen(true);
    };

    // Lógica de listado
    const listar = async () => {
        const formData = new FormData(formRef.current);

        // Obtención de valores del formulario
        const body = {
            ubicacion1: formData.get("origen") || "",
            semana: formData.get("semana") || "",
            vehiculo: formData.get("vehiculo") || "",
            conductor: formData.get("conductor") || "",
            fecha: formData.get("fecha") || "",
            movimiento: "Contenedor",
            fechaFin: formData.get("fecha_fin") || null,
        };

        // Llamadas simultáneas para ubicaciones y conductores
        setLimit(25);
        const [newUbicaciones, newConductores, res] = await Promise.all([
            listarUbicaciones(),
            listarConductores(),
            paginarProgramaciones(pagination, limit, body),
        ]);

        // Actualización de los estados
        setUbicaciones(newUbicaciones);
        setConductores(newConductores);
        setItemsList(res.data);
        setTotal(res.total);
    };

    // Ejecutar listado al cargar o cambiar estado relevante
    useEffect(() => {
        listar();
    }, [pagination, alert]);

    return (
        <>
            <Alertas alert={alert} handleClose={toogleAlert} />

            {open && (
                <FormulariosProgramacionEditar
                    element={element}
                    setOpen={setOpen}
                    setAlert={setAlert}
                />
            )}

            <form ref={formRef} method="POST" className="container">
                <div className="row">
                    {[
                        { id: "semana", label: "Semana", type: "text" },
                        { id: "fecha", label: "Fecha inicial", type: "date" },
                        { id: "fecha_fin", label: "Fecha final", type: "date" },
                        { id: "vehiculo", label: "Vehículo", type: "text" },
                    ].map((field) => (
                        <div className="mb-2 col-md-2" key={field.id}>
                            <label htmlFor={field.id} className="form-label mb-1">
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                id={field.id}
                                name={field.id}
                                onChange={listar}
                                className="form-control form-control-sm"
                            />
                        </div>
                    ))}

                    <div className="mb-2 col-md-2">
                        <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
                        <input
                            id="conductor"
                            name="conductor"
                            type="text"
                            list="conductorItems"
                            className="form-control form-control-sm"
                            onChange={listar}
                        />
                        <datalist id="conductorItems">
                            <option value="" />
                            {conductores.map((item, index) => (
                                <option key={index} value={item.conductor} />
                            ))}
                        </datalist>
                    </div>

                    <div className="mb-2 col-md-2">
                        <label htmlFor="origen" className="form-label mb-1">Finca</label>
                        <select
                            id="origen"
                            name="origen"
                            className="form-control form-control-sm"
                            onChange={listar}
                        >
                            <option value="" />
                            {ubicaciones.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3 col-lg-2 mt-4">
                        <button type="button" className="btn btn-success text-center w-100">
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
                            <th>Sem</th>
                            <th>Vehículo</th>
                            <th className="bg-success text-white text-center">Finca</th>
                            <th className="bg-success text-white text-center">Llegada</th>
                            <th className="bg-success text-white text-center">Cierre</th>
                            <th className="bg-success text-white text-center">Salida</th>
                            <th className="bg-secondary text-white text-center">Contenedores</th>
                            <th className="bg-secondary text-white text-center"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemList.map((item, index) => (
                            <tr key={index}>
                                <td>{item?.fecha}</td>
                                <td>{item?.semana}</td>
                                <td>{item?.vehiculo?.placa}</td>
                                <td className="table-success text-center">{item?.ruta?.ubicacion_1?.ubicacion}</td>
                                <td className="table-success text-center">{item?.llegada_origen}</td>
                                <td className="table-success text-center">{item?.cierre}</td>
                                <td className="table-success text-center">{item?.salida_origen}</td>
                                <td className="table-secondary text-center"><b>{item?.contenedor}</b></td>
                                <td className="table-secondary text-center">
                                    <button
                                        onClick={() => onEditar(item)}
                                        className="btn-primary btn-warning btn btn-sm"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>
        </>
    );
}
