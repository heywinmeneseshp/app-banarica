import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from 'xlsx';
//Services
//Hooks
import { useAuth } from "@hooks/useAuth";
import fecha from "@hooks/useDate";
//Bootstrap
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
//Services 
import endPoints from '@services/api';
//Components
import Paginacion from '@components/Paginacion';
//CSS
import styles from '@styles/informes/informes.module.css';
import { buscarMovimiento } from "@services/api/movimientos";
import { listarCategorias } from "@services/api/categorias";
import { encontrarModulo } from "@services/api/configuracion";

export default function ReporteGeneralMovimientos() {
    const { almacenByUser, user } = useAuth();
    const formRef = useRef();
    const [historial, setHistorial] = useState([1]);
    const [pagination, setPagination] = useState(1);
    const [categorias, setCategorias] = useState([]);
    const [total, setTotal] = useState(0);
    const [semana, setSemana] = useState();
    const limit = 20;

    useEffect(() => {
        try {
            listarCategorias().then(res => {
                if (user.id_rol == "Super seguridad" || user.id_rol == "Seguridad") {
                    setCategorias(res.filter(item => item.nombre == "Seguridad"));
                } else {
                    setCategorias(res);
                }
            });
            listarItems();

        } catch (e) {
            alert("Error al cargar los usuarios", "error");
        }
    }, [alert, pagination]);

    const entradaOrSalida = (item) => {
        if (item === "Entrada") {
            return <td className="text-success">{item}</td>;
        } else {
            return <td className="text-danger">{item}</td>;
        }
    };

    async function listarItems() {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_movimiento = formData.get('movimiento');
        let cons_semana = formData.get('semana');
        if (!cons_semana || cons_semana == "") {
            encontrarModulo('Semana').then(res => {
                cons_semana = res[0].semana_actual;
                setSemana(res[0].semana_actual);
            });
        }
        const producto = formData.get('articulo');
        const categoria = formData.get('categoria') == 0 ? "" : formData.get('categoria');
        const seguridad = user.id_rol == "Seguridad" || user.id_rol == "Super seguridad" ? await listarCategorias() : false;
        const cons_categoria = !seguridad ? categoria : seguridad.find(item => item.nombre == "Seguridad").consecutivo;
        let url = `${endPoints.historial.list}/filter`;
        let body = {};
        const anho = formData.get('anho') ? formData.get('anho') : new Date().getFullYear();
        if (cons_semana) body.movimiento = { cons_semana: `S${cons_semana}-${anho}` };
        if (cons_almacen != 0) {
            body.historial = { cons_almacen_gestor: cons_almacen };
        } else {
            const list = almacenByUser.map((item) => item.consecutivo);
            body.historial = { cons_almacen_gestor: list };
        }
        if (cons_movimiento != 0) body.historial = { ...body.historial, cons_lista_movimientos: cons_movimiento };
        body.pagination = { limit: limit, offset: pagination };
        const res = await axios.post(url, { ...body, producto: { name: producto, cons_categoria: cons_categoria } });
        console.log({ ...body, producto: { name: producto, cons_categoria: cons_categoria } });
        setTotal(res.data.total);
        setHistorial(res.data.data);
    }

    const onBuscar = async () => {
        setPagination(1);
        listarItems();
    };

    const onDescargar = async () => {
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_movimiento = formData.get('movimiento');
        const cons_semana = formData.get('semana');
        let body = {};
        const anho = new Date().getFullYear();
        if (cons_semana) body.movimiento = { cons_semana: `S${cons_semana}-${anho}` };
        if (cons_almacen != 0) {
            body.historial = { cons_almacen_gestor: cons_almacen };
        } else {
            const list = almacenByUser.map((item) => item.consecutivo);
            body.historial = { cons_almacen_gestor: list };
        }
        if (cons_movimiento != 0) body.historial = { ...body.historial, cons_lista_movimientos: cons_movimiento };
        const { data } = await axios.post(`${endPoints.historial.list}/filter`, body);
        const newData = data.map(item => {
            const body = {
                "Cons": item.cons_movimiento,
                "Almacén": item.cons_almacen_gestor,
                "Artículo": item.Producto.name,
                "Unidades": item.cantidad,
                "Movimiento": item.cons_lista_movimientos,
                "Tipo de movimiento": item.tipo_movimiento,
                "Razón": item.razon_movimiento,
                "Observaciones": item.movimiento?.observaciones,
                "Respuesta": item.movimiento?.respuesta,
                "Remisión": item.movimiento?.remision,
                "Semana": item.movimiento?.cons_semana,
                "Fecha": item.movimiento?.fecha
            };
            return body;
        });
        const book = XLSX.utils.book_new();
        const sheet = XLSX.utils.json_to_sheet(newData);
        XLSX.utils.book_append_sheet(book, sheet, "Movimientos");
        XLSX.writeFile(book, `Historial de movimientos ${fecha()}.xlsx`);
    };

    const onDescargarDocumento = async () => {
        const formData = new FormData(formRef.current);
        let documento = formData.get(`documento`).toUpperCase();
        if (!documento) return alert("Por favor, introduzca un consecutivo");
        const res = await buscarMovimiento(documento);
        if (!res) return;
        let movimiento;
        if (documento.substr(0, 2) == "RC") movimiento = "Recepción";
        if (documento.substr(0, 2) == "LQ") movimiento = "Liquidación";
        if (documento.substr(0, 2) == "DV") movimiento = "Devolución";
        if (documento.substr(0, 2) == "AJ") movimiento = "Ajuste";
        if (documento.substr(0, 2) == "EX") movimiento = "Exportación";
        window.open(endPoints.document.movimientos(documento, movimiento));
    };

    return (
        <>

            <div>

                <form ref={formRef}>
                    <div className={styles.contenedor3}>
                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Almacén</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id="almacen"
                                    name="almacen"
                                    onChange={onBuscar}
                                >
                                    <option value={0}>All</option>
                                    {almacenByUser.map(almacen => (
                                        <option key={almacen.consecutivo} value={almacen.consecutivo} >{almacen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="movimiento">Movimiento</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id='movimiento'
                                    name='movimiento'
                                    onChange={onBuscar}
                                >
                                    <option value={0}>All</option>
                                    <option value={'RC'}>Recepción</option>
                                    <option value={'AJ'}>Ajuste</option>
                                    <option value={'DV'}>Devolución</option>
                                    <option value={'LQ'}>Liquidación</option>
                                    <option value={'EX'}>Exportación</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="almacen">Categoría</label>
                            <div>
                                <select
                                    className="form-select form-select-sm"
                                    id="categoria"
                                    name="categoria"
                                    onChange={onBuscar}
                                >
                                    {!(user.id_rol == "Super seguridad" || user.id_rol == "Seguridad") &&
                                        <option value={0}>All</option>
                                    }

                                    {categorias.map(categoria => (
                                        <option key={categoria.consecutivo} value={categoria.consecutivo} >{categoria.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="articulo">Artículo</label>
                            <div>
                                <input type="text"
                                    className="form-control form-control-sm"
                                    id="articulo"
                                    name='articulo'
                                    onChange={onBuscar}
                                ></input>
                            </div>
                        </div>

                        <span className={styles.semanaAndAnho}>
                            <div className={styles.grupo}>
                                <label htmlFor="semana">Semana</label>
                                <div>
                                    <input type="number"
                                        className="form-control form-control-sm"
                                        id="semana"
                                        name='semana'
                                        onChange={onBuscar}
                                        defaultValue={semana}
                                    ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="anho">Año</label>
                                <div>
                                    <input type="number"
                                        className="form-control form-control-sm"
                                        id="anho"
                                        name='anho'
                                        defaultValue={new Date().getFullYear()}
                                    ></input>
                                </div>
                            </div>
                        </span>

                    </div>
                    <div className={styles.contenedor3}>
                        <div className={styles.grupo}>
                            <label htmlFor="documento">Consecutivo</label>
                            <div>
                                <input type="text"
                                    className="form-control form-control-sm"
                                    id="documento"
                                    name='documento'
                                ></input>
                            </div>
                        </div>
                        <Button onClick={onDescargarDocumento} className={styles.button} variant="warning" size="sm">
                            Ver documento
                        </Button>


                        <Button onClick={onDescargar} className={styles.button} variant="success" size="sm">
                            Descargar Excel
                        </Button>

                    </div>
                </form>
            </div>




            <Table className={styles.tabla} striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>Cons.</th>
                        <th className={styles.display}>Almacén</th>
                        <th className={styles.display_desktop}>Alm.</th>
                        <th>Artículo</th>
                        <th className={styles.display_desktop}>Und.</th>
                        <th className={styles.display}>Unidades</th>
                        <th className={styles.display}>Movimiento</th>
                        <th>Tipo</th>
                        <th className={styles.display}>Motivo</th>
                        <th>Semana</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>
                    {historial.map((item, index) => (
                        <tr key={index}>
                            <td>{item?.cons_movimiento}</td>
                            <td>{item?.cons_almacen_gestor}</td>
                            <td>{item?.Producto?.name}</td>
                            <td>{item?.cantidad}</td>
                            <td className={styles.display}>{item?.cons_lista_movimientos}</td>
                            {entradaOrSalida(item?.tipo_movimiento)}
                            <td className={styles.display}>{item?.razon_movimiento}</td>
                            <td>{item?.movimiento?.cons_semana}</td>
                            <td>{item?.movimiento?.fecha}</td>
                        </tr>)
                    )}
                </tbody>
            </Table>

            <div className={styles.pagination}>
                <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            </div>

        </>
    );
}

