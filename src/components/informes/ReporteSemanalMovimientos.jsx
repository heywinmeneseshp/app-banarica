import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import endPoints from "@services/api";
//CSS
import styles from '@styles/informes/informes.module.css';
import { useAuth } from "@hooks/useAuth";
import { listarCategorias } from "@services/api/categorias";
import { Button, Table } from "react-bootstrap";
import { encontrarModulo } from "@services/api/configuracion";
import { filtrarProductos } from "@services/api/productos";
import { DownloadTableExcel } from 'react-export-table-to-excel';

export default function ReporteSemanalMovimientos() {
    const { almacenByUser, user } = useAuth();
    const tablaRef = useRef();
    const formRef = useRef();
    const companies = ["Banarica", "Banachica"];
    const [tipoTabla, setTipoTable] = useState(false);
    const [almacenes, setAlmacenes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [company, setCompany] = useState("Banarica");
    const [semana, setSemana] = useState(null);
    const [tabla, setTabla] = useState([]);
    const [productArray, setProductArray] = useState([]);
    const [productos, setProductos] = useState([]);
    const [product, setProduct] = useState("");

    useEffect(() => {
        listarTabla();
    }, [product]);

    const encontrarProductos = async (categoria, categorias) => {
        const data = {
            producto: {
                cons_categoria: categoria == "" ? categorias.map(item => { return item.consecutivo; }) : categoria,
                isBlock: false
            }
        };
        const res = await filtrarProductos(data);
        setProductos(res);
    };

    const listarTabla = async () => {
        const formData = new FormData(formRef.current);
        const categories = await listarCategorias();
        setCategorias(categories);
        const cons_almacen = formData.get('almacen');
        const cons_movimiento = formData.get('movimiento');
        let cons_semana = formData.get('semana');
        let anho = formData.get('anho') ? formData.get('anho') : new Date().getFullYear();
        const cons_categoria = formData.get('categoria') == 0 ? "" : formData.get('categoria');
        await encontrarProductos(cons_categoria, categories);
        const producto = product;
        if (semana == null) {
            const week = await encontrarModulo("Semana");
            cons_semana = week[0].semana_actual;
        }
        setSemana(cons_semana);
        let body = {};
        body.movimiento = { cons_semana: `S${cons_semana}-${anho}` };
        let almacenes = [];
        if (cons_almacen == 0) {
            almacenes = selectAlmacenes();
            const list = almacenes.map((item) => item.consecutivo);
            body.historial = { cons_almacen_gestor: list };
        } else {
            body.historial = { cons_almacen_gestor: cons_almacen };
            almacenes = almacenByUser.filter(item => item.consecutivo == cons_almacen);
        }
        if (cons_movimiento != 0) body.historial = { ...body.historial, cons_lista_movimientos: cons_movimiento };
        let { data } = await axios.post(`${endPoints.historial.list}/filter`, { ...body, producto: { name: producto, cons_categoria: cons_categoria } });

        data = data.filter(item => item.movimiento.razon_movimiento != "Rechazado");

        if (cons_movimiento == "DV" || cons_movimiento == "LQ") data = data.filter(item => item.movimiento.pendiente == false);

        let productList = [];
        for (let product of data) {
            const item = { nombre: product.Producto.name, consecutivo: product.Producto.consecutivo };
            if (!productList.find(item => item.nombre == product.Producto.name)) productList.push(item);
        }
        productList.sort((a, b) => {
            if (a.consecutivo > b.consecutivo) return 1;
            if (a.consecutivo < b.consecutivo) return -1;
        });
        setProductArray(productList);

        let newTable = [];
        almacenes.map((item) => {
            let result = {};
            productList.map((product) => {
                result[product.consecutivo] = 0;
            });
            const list = data.filter(itemB => itemB.cons_almacen_gestor == item.consecutivo);

            list.map((dataItem) => {
                result[dataItem.cons_producto] = result[dataItem.cons_producto] + dataItem.cantidad;
            });
            newTable.push({ consecutivo: item.consecutivo, result: result, nombre: item.nombre });
        });
        setTabla(newTable);
    };

    const selectAlmacenes = () => {
        const formData = new FormData(formRef.current);
        const companyR = formData.get("company");
        setCompany(companyR);
        if (companyR == "Banachica") {
            const banachica = almacenByUser.filter(item => item.consecutivo.substr(-2, item.consecutivo.length) == "BC");
            setAlmacenes(banachica);
            return banachica;
        } else {
            const banarica = almacenByUser.filter(item => item.consecutivo.substr(-2, item.consecutivo.length) != "BC");
            setAlmacenes(banarica);
            return banarica;
        }
    };

    const handleCheck = () => {
        setTipoTable(!tipoTabla);
    };


    return (
        <>
            <form ref={formRef}>
                <div className={styles.contenedor3}>
                    <div className={styles.grupo}>
                        <label htmlFor="company">Comercializadora</label>
                        <div>
                            <select
                                className="form-select form-select-sm"
                                id="company"
                                name="company"
                                onChange={listarTabla}
                            >
                                {companies.map((item, index) => (
                                    <option key={index} selected={item == "Banarica"}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className={styles.grupo}>
                        <label htmlFor="almacen">Almacén</label>
                        <div>
                            <select
                                className="form-select form-select-sm"
                                id="almacen"
                                name="almacen"
                                onChange={listarTabla}
                            >
                                <option value={0}>All</option>
                                {almacenes.map(almacen => (
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
                                onChange={listarTabla}
                            >
                                <option value={'RC'}>Recepción</option>
                                <option value={'AJ'}>Ajuste</option>
                                <option value={'DV'}>Devolución</option>
                                <option value={'LQ'}>Liquidación</option>
                                <option value={'EX'} selected>Exportación</option>
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
                                onChange={listarTabla}
                            >
                                {!(user?.id_rol == "Super seguridad" || user?.id_rol == "Seguridad") &&
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
                            <input
                                type="text"
                                list="articulo"
                                className="form-control form-control-sm"
                                onChange={(e) => setProduct(e.target.value)}
                            />
                            <datalist
                                id="articulo"
                                name='articulo'
                            >
                                <option value={""} />
                                {productos.map((item, index) => (
                                    <option key={index} value={item.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <span className={styles.semanaAndAnho}>
                        <div className={styles.grupo}>
                            <label htmlFor="semana">Semana</label>
                            <div>
                                <input type="number"
                                    className="form-control form-control-sm"
                                    min={1}
                                    max={52}
                                    id="semana"
                                    name='semana'
                                    onChange={listarTabla}
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
                                    onChange={listarTabla}
                                ></input>
                            </div>
                        </div>
                    </span>



                    <div className={styles.radio}>
                        <input
                            id="Check"
                            checked={tipoTabla}
                            onChange={() => handleCheck()}
                            className="form-check-input"
                            type="checkbox"
                            aria-label="Radio button for following text input" />
                        <label className="form-check-label w-100 mt-4" htmlFor="flexCheckDefault">
                            Invertir vista
                        </label>
                    </div>

                    <div className={styles.grupo}>

                        <DownloadTableExcel
                            filename={`Reporte Sem ${semana}`}
                            sheet={`Semana ${semana}`}
                            currentTableRef={tablaRef.current}
                        >
                            <Button className="w-100 mt-4" variant="success" size="sm">
                                Descargar Excel
                            </Button>

                        </DownloadTableExcel>

                    </ div >

                </div>
            </form>

            <div className="mt-3">
                <h3 >{company} - {semana}</h3>
                <div className={styles.tablaContainer}>

                    <Table ref={tablaRef} striped bordered hover size="sm" className={styles.tabla2}>

                        {tipoTabla && <thead>
                            <tr className="d-flex">
                                <th className="w-100">Cod.</th>
                                <th className={styles.nombre}>Almacén</th>
                                {productArray.map((item, index) => {
                                    return (<th key={index} className="w-100" >{item.nombre}</th>);
                                })
                                }
                            </tr>
                        </thead>}
                        {tipoTabla && <tbody>
                            {tabla.map((almacen, index) => {
                                const dataAlmacen = Object.values(almacen.result);
                                return (
                                    <tr key={index} className="d-flex">
                                        <td className="w-100">{almacen?.consecutivo}</td>
                                        <td className={styles.nombre}>{almacen?.nombre}</td>
                                        {dataAlmacen.map((item, indexB) => {
                                            return (<td key={indexB} className="w-100">{item}</td>);
                                        })
                                        }
                                    </tr>
                                );
                            })
                            }
                        </tbody>}


                        {!tipoTabla && <thead>

                            <tr className="d-flex">
                                <th className={styles.detalle}>Cod.</th>
                                <th className={styles.nombre}>Artículo</th>
                                {tabla.map((almacen, index) => {
                                    return (
                                        <th key={index} className={styles.detalle}>{almacen?.consecutivo}</th>
                                    );
                                })
                                }

                            </tr>
                        </thead>}
                        {!tipoTabla && <tbody>
                            {productArray.map((item, index) => {
                                return (
                                    <tr key={index} className="d-flex">
                                        <td className={styles.detalle}>{item.consecutivo}</td>
                                        <td className={styles.nombre}>{item.nombre}</td>
                                        {tabla.map((itemB, indexB) => {

                                            const result = itemB.result[item.consecutivo];
                                            return (
                                                <td key={indexB} className={styles.detalle}>{result}</td>
                                            );
                                        })}


                                    </tr>
                                );
                            })
                            }
                        </tbody>}
                    </Table>




                </div>
            </div>



        </>
    );
}

