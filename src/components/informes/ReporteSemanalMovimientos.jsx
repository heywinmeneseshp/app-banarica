import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import endPoints from "@services/api";
//CSS
import styles from '@styles/informes/informes.module.css';
import { useAuth } from "@hooks/useAuth";
import { listarCategorias } from "@services/api/categorias";
import { Table } from "react-bootstrap";
import { encontrarModulo } from "@services/api/configuracion";
import { filtrarProductos } from "@services/api/productos";


export default function ReporteSemanalMovimientos() {
    const { almacenByUser, user } = useAuth();
    const formRef = useRef();
    const companies = ["Banarica", "Banachica"];
    const [almacenes, setAlmacenes] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [company, setCompany] = useState("Banarica");
    const [semana, setSemana] = useState(null);
    const [tabla, setTabla] = useState([]);
    const [productos, setProductos] = useState([]);
    const [product, setProduct] = useState("")

    useEffect(() => {
        selectAlmacenes();
        listarTabla();
    }, [product]);

    const encontrarProductos = async (categoria, categorias) => {
        const data = {
            producto: {
                cons_categoria: categoria == "" ? categorias.map(item => { return item.consecutivo }) : categoria,
                isBlock: false
            }
        }
        const res = await filtrarProductos(data)
        setProductos(res)
    }

    const listarTabla = async () => {
        const categories = await listarCategorias();
        setCategorias(categories);
        const formData = new FormData(formRef.current);
        const cons_almacen = formData.get('almacen');
        const cons_movimiento = formData.get('movimiento');
        let cons_semana = formData.get('semana');
        setSemana(cons_semana);
        let anho = formData.get('anho') ? formData.get('anho') : new Date().getFullYear();
        const cons_categoria = formData.get('categoria') == 0 ? "" : formData.get('categoria');
        await encontrarProductos(cons_categoria, categories);
        const producto = product;
        if (!cons_semana || cons_semana == "") {
            encontrarModulo("Semana").then(res => {
                cons_semana = res[0].semana_actual;
                setSemana(res[0].semana_actual);
            });
        }
        let body = {};
        body.movimiento = { cons_semana: `S${cons_semana}-${anho}` };
        if (cons_almacen != 0) {
            body.historial = { cons_almacen_gestor: cons_almacen };
        } else {
            const list = almacenes.map((item) => item.consecutivo);
            body.historial = { cons_almacen_gestor: list };
        }
        if (cons_movimiento != 0) body.historial = { ...body.historial, cons_lista_movimientos: cons_movimiento };
        const { data } = await axios.post(`${endPoints.historial.list}/filter`, { ...body, producto: { name: producto, cons_categoria: cons_categoria } });
        let dias = {
            domingo: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 0),
            lunes: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 1),
            martes: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 2),
            miercoles: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 3),
            jueves: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 4),
            viernes: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 5),
            sabado: data.filter(item => new Date(item?.movimiento?.fecha).getDay() == 6)
        };

        for (var dia in dias) {
            let categoria = {};
            let producto = {};
            dias[dia].map((item) => {
                const almacenR = item?.cons_almacen_gestor;
                const cantidad = item?.cantidad;
                const productoR = item?.Producto?.name;
                const cons_categoria = categories.find(item2 => item2.consecutivo == item.Producto.cons_categoria).nombre;
                categoria[`${almacenR}-${cons_categoria}`] = categoria[`${almacenR}-${cons_categoria}`] ? categoria[`${almacenR}-${cons_categoria}`] + cantidad : cantidad;
                producto[`${almacenR}-${productoR}`] = producto[`${almacenR}-${productoR}`] ? producto[`${almacenR}-${productoR}`] + cantidad : cantidad;
            });
            dias[dia] = { categoria, producto };
        }
        setTabla(dias);

    };

    const selectAlmacenes = () => {
        const formData = new FormData(formRef.current);
        const companyR = formData.get("company");
        setCompany(companyR);
        if (companyR == "Banachica") {
            const banachica = almacenByUser.filter(item => item.consecutivo.substr(-2, item.consecutivo.length) == "BC");
            setAlmacenes(banachica);
        } else {
            const banarica = almacenByUser.filter(item => item.consecutivo.substr(-2, item.consecutivo.length) != "BC");
            setAlmacenes(banarica);
        }
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
                                onChange={selectAlmacenes}
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
                        <label >Artículo</label>
                        <div>
                            <input
                                type="text"
                                list="articulo"
                                className="form-control form-control-sm"
                                onChange={ (e) => setProduct(e.target.value)}
                            />
                            <datalist
                                id="articulo"
                                name='articulo'
                            >
                                <option  value={""} />
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


                </div>
            </form>

            <div className="mt-3">
                <h3 >{company} - {semana}</h3>
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cod.</th>
                            <th>Almacén</th>
                            <th>Lunes</th>
                            <th>Martes</th>
                            <th>Miercoles</th>
                            <th>Jueves</th>
                            <th>Viernes</th>
                            <th>Sábado</th>
                            <th>Domingo</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {almacenes.map((almacen, index) => {

                            let dias = {
                                domingo: 0,
                                lunes: 0,
                                martes: 0,
                                miercoles: 0,
                                jueves: 0,
                                viernes: 0,
                                sabado: 0
                            };

                            for (var dia in tabla) {
                                for (var almacenR in tabla[dia]?.categoria) {
                                    const almacenTabla = almacenR.substring(0, almacen?.consecutivo.length);
                                    if (almacenTabla == almacen.consecutivo) {
                                        dias[dia] = dias[dia] + tabla[dia].categoria[almacenR];
                                    }
                                }
                            }
                            let total = 0;
                            for (dia in dias) {
                                total = total + dias[dia];
                            }

                            const color = total == 0 ? "table-danger" : "";

                            return (
                                <tr className={color} key={index}>
                                    <td>{almacen.consecutivo}</td>
                                    <td>{almacen.nombre}</td>
                                    <td>{dias.lunes}</td>
                                    <td>{dias.martes}</td>
                                    <td>{dias.miercoles}</td>
                                    <td>{dias.jueves}</td>
                                    <td>{dias.viernes}</td>
                                    <td>{dias.sabado}</td>
                                    <td>{dias.domingo}</td>
                                    <td>{total}</td>
                                </tr>
                            );
                        })
                        }
                    </tbody>
                </Table>
            </div>



        </>
    );
}

