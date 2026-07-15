import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarRechazo, eliminarRechazo, paginarRechazos, aprobarRechazoApi } from '@services/api/rechazos';
import { useEffect, useRef, useState } from 'react';
import { Form, Col, Row } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import { BsSendCheckFill } from "react-icons/bs";
import { TiDelete } from "react-icons/ti";
import { FaSave } from "react-icons/fa";
import { listarAlmacenes } from '@services/api/almacenes';
import { filtrarContenedor } from '@services/api/contenedores';
import { paginarSemanas } from '@services/api/semanas';
import { paginarListado } from '@services/api/listado';





const Rechazos = () => {

    const formRef = useRef();
    const tablaRef = useRef();
    const [tableData, setTableData] = useState([]);
    const [pagination, setPagination] = useState(1);
    const [limit, setLimit] = useState(100);
    const [total, setTotal] = useState();
    const [editando, setEditando] = useState(null);
    const [valoresEditados, setValoresEditados] = useState({});
    const [almacenes, setAlmacenes] = useState([]);
    const [semana, setSemana] = useState([]);
    const [contenedoresSemana, setContenedoresSemana] = useState([]);

    useEffect(() => {
        buscarSemana();
        listar();
    }, []);

    const listar = async () => {
        try {
            const formData = new FormData(formRef.current);
            const body = {
                semana: formData.get("semana"),
                productor: formData.get("productor") || "",
                contenedor: formData.get("contenedor") || "",
                producto: formData.get("producto") || "",
            };



            let foundWeek = body.semana ? semana.filter(item => item.consecutivo == body.semana) : "";
            console.log(foundWeek);
            body.semana = foundWeek[0]?.id;
            console.log(body.semana);
            const [res, almacenes] = await Promise.all([
                paginarRechazos(pagination, limit, body),
                listarAlmacenes()
            ]);

            setAlmacenes(almacenes);
            setLimit(100);
            setTableData(res.data);
            console.log(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error("❌ Error al listar datos:", error);
        }
    };



    const buscarSemana = async () => {
        try {
            const formData = new FormData(formRef.current);
            const week = await paginarSemanas(formData.get("semana"));
            setSemana(week);
        } catch (error) {
            console.error("❌ Error al listar semanas:", error);
        }
    };



    const aprobarRechazo = async (rechazo) => {
        try {
            const { Contenedor, id_producto, cod_productor, almacene } = rechazo;
            const { Listados, contenedor } = Contenedor;
            const existeProductoRechazado = Listados.some(item => item.combo.id === id_producto);
            const existeProductorRechazado = Listados.some(item => item.almacen.consecutivo === cod_productor);

            if (!existeProductorRechazado) {
                const ok = window.confirm(`⚠ El productor "${almacene.nombre}" no está asignado al contenedor "${contenedor}". ¿Desea continuar?`);
                if (!ok) return;
            }
            if (!existeProductoRechazado) {
                return window.alert(`⚠ El producto "${rechazo.combo.nombre}" no está asignado al contenedor "${contenedor}".`);
            }

            // Seleccionar el productor responsable
            let almacenCod = null;
            let message = "🔹 Ingresa el código del productor responsable del rechazo del producto. Opciones disponibles:";
            while (!almacenCod) {
                let almacenesFiltrados = Listados.filter(item => item.combo.id === id_producto).map(item => item.almacen);
                const almacenExist = almacenesFiltrados.find(item => item.consecutivo == almacene.consecutivo);
                almacenesFiltrados = almacenExist == null ? almacenesFiltrados : [almacenExist];
                if (almacenesFiltrados.length > 1) {
                    const opciones = almacenesFiltrados.map(el => `${el.consecutivo} ${el.nombre}`).join(", ");
                    const inputUsuario = window.prompt(`${message} ${opciones}`);
                    if (!inputUsuario) return;
                    almacenCod = almacenesFiltrados.find(item => item.consecutivo === inputUsuario)?.consecutivo;
                } else {
                    almacenCod = almacenesFiltrados[0]?.consecutivo || cod_productor;
                }
                if (!almacenCod) {
                    message = "⚠ El código ingresado no es válido. Inténtalo de nuevo:";
                }
            }

            if (!window.confirm("¿Estás seguro de aprobar el rechazo?")) return;

            // El backend lee las cajas actuales con SELECT FOR UPDATE para evitar
            // descuentos incorrectos cuando se aprueban múltiples rechazos del mismo contenedor
            await aprobarRechazoApi(rechazo.id, { cod_productor: almacenCod });
            await listar();
        } catch (error) {
            console.error("❌ Error al aprobar rechazo:", error);
            window.alert(error?.response?.data?.message || "Error al aprobar el rechazo.");
        }
    };

    const editarRechazo = async (rechazo) => {
        setValoresEditados([]);
        setEditando(rechazo.id);
        const semanaCons = rechazo.Contenedor?.Listados?.[0]?.Embarque?.semana?.consecutivo;
        if (semanaCons) {
            try {
                const res = await paginarListado(1, 500, { semana: semanaCons });
                const unique = [...new Set((res?.data || []).map(l => l?.Contenedor?.contenedor).filter(Boolean))];
                setContenedoresSemana(unique);
            } catch {
                setContenedoresSemana([]);
            }
        }
    };

    const guardarEdicion = async (rechazo) => {
        try {
            const { Contenedor } = rechazo;
            let { Listados, contenedor: contenedorActual } = Contenedor;

            // Validación y resolución de nuevo contenedor
            let nuevoIdContenedor = null;
            if (valoresEditados?.contenedor && valoresEditados.contenedor !== contenedorActual) {
                const res = await filtrarContenedor({ contenedor: valoresEditados.contenedor });
                const encontrado = (res?.data || []).find(c => c.contenedor === valoresEditados.contenedor);
                if (!encontrado) {
                    return window.alert(`⚠ El contenedor "${valoresEditados.contenedor}" no existe.`);
                }
                nuevoIdContenedor = encontrado.id;
                // Al cambiar contenedor, los Listados del nuevo contenedor no están disponibles en memoria.
                // Se omite la validación de producto/productor contra el nuevo contenedor.
                Listados = [];
                contenedorActual = valoresEditados.contenedor;
            }

            // Validación de productor
            if (valoresEditados?.productor) {
                const ibm = almacenes.find(item => item.nombre === valoresEditados.productor);
                if (!ibm) return window.alert(`⚠ Error: el productor "${valoresEditados.productor}" no existe.`);
                rechazo.cod_productor = ibm.consecutivo;
            }

            // Validación de producto (solo si no cambió el contenedor)
            if (valoresEditados?.producto && !nuevoIdContenedor) {
                const producto = Listados.find(item => item.combo.nombre === valoresEditados.producto);
                if (!producto) {
                    return window.alert(`⚠ Error: el producto "${valoresEditados.producto}" no está asignado al contenedor "${contenedorActual}".`);
                }
                rechazo.id_producto = producto.combo.id;
                rechazo.combo.nombre = producto.combo.nombre;
            }

            // Validar producto en el contenedor actual (solo si no cambió el contenedor)
            if (!nuevoIdContenedor) {
                const existeProductoRechazado = Listados.some(item => item.combo.id === rechazo.id_producto);
                if (!existeProductoRechazado) {
                    return window.alert(`⚠ El producto "${rechazo.combo.nombre}" no está asignado al contenedor "${contenedorActual}".`);
                }

                // Selección del código de almacén
                let almacen = null;
                let message = "🔹 Ingresa el código del productor responsable del rechazo del producto. Opciones disponibles:";
                while (!almacen) {
                    const almacenesFiltrados = Listados.filter(item => item.combo.id === rechazo.id_producto).map(item => item.almacen);
                    if (almacenesFiltrados.length > 1) {
                        const opciones = almacenesFiltrados.map(el => `${el.consecutivo} ${el.nombre}`).join(", ");
                        const inputUsuario = window.prompt(`${message} ${opciones}`);
                        if (!inputUsuario) return;
                        almacen = almacenesFiltrados.find(item => item.consecutivo === inputUsuario)?.consecutivo;
                        rechazo.cod_productor = almacen;
                    } else {
                        almacen = almacenesFiltrados[0]?.consecutivo || rechazo.cod_productor;
                    }
                    if (!almacen) message = "⚠ El código ingresado no es válido. Inténtalo de nuevo:";
                }

                if (rechazo.cod_productor !== almacen) {
                    if (!window.confirm("El productor seleccionado no está asignado a este contenedor. ¿Desea continuar?")) return;
                }
            }

            rechazo.serial_palet = valoresEditados?.pallet ?? rechazo.serial_palet;
            rechazo.cantidad = valoresEditados?.cajas ?? rechazo.cantidad;

            const body = {
                cod_productor: rechazo.cod_productor,
                serial_palet: rechazo.serial_palet,
                id_producto: rechazo.id_producto,
                cantidad: rechazo.cantidad,
                id_motivo_de_rechazo: rechazo.id_motivo_de_rechazo,
                ...(nuevoIdContenedor && { id_contenedor: nuevoIdContenedor }),
            };

            await actualizarRechazo(rechazo.id, body);
            setEditando(null);
            await listar();
        } catch (error) {
            console.error("❌ Error al guardar la edición:", error);
            window.alert("⚠ Se produjo un error al guardar los cambios. Inténtalo de nuevo.");
        }
    };

    const handleChange = (e, field) => {
        setValoresEditados({ ...valoresEditados, [field]: e.target.value });
    };

    const eliminarRechazoHandler = async (rechazo) => {
        if (!window.confirm("¿Estás seguro de eliminar el rechazo?")) return;
        await eliminarRechazo(rechazo.id);
        listar();
    };

    const getListadoRelacionado = (rechazo) => {
        const listados = rechazo?.Contenedor?.Listados || [];
        return listados.find((item) => item?.id_producto === rechazo?.id_producto) || listados[0] || null;
    };

    const formatDateValue = (value) => {
        if (!value) return "";

        if (typeof value === "string") {
            if (value.includes("T")) return value.split("T")[0];
            const parsedStringDate = new Date(value);
            return Number.isNaN(parsedStringDate.getTime()) ? value : parsedStringDate.toISOString().split("T")[0];
        }

        const parsedDate = new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString().split("T")[0];
    };


    return (

        <>
            <h2 className="mb-2">{"Rechazos"}</h2>
            <div className="line"></div>
            {/* Filtros */}
            <Form ref={formRef} className="">
                <Row xs={1} sm={2} md={4} lg={6} className="">

                    {/* Semana*/}
                    <Col>
                        <Form.Group className="mb-0" controlId="semana">
                            <Form.Label className='mt-1 mb-1'>Sem</Form.Label>
                            <Form.Control
                                className='form-control-sm'
                                type="text"
                                name="semana"
                                placeholder="Ingrese la semana"
                                list="lista-semanas" // <--- VINCULACIÓN AQUÍ
                                onBlur={listar}
                                onChange={(e) => {
                                    // Tu función listar() existente
                                    buscarSemana(e.target.value);
                                }}
                            />

                            {/* 2. DEFINICIÓN DEL DATALIST */}
                            <datalist id="lista-semanas">
                                {semana.map((item) => (
                                    <option key={item.id} value={item.consecutivo} />
                                ))}
                            </datalist>
                        </Form.Group>
                    </Col>
                    {/* Cliente */}
                    <Col>
                        <Form.Group className="mb-0" controlId="cliente">
                            <Form.Label className='mt-1 mb-1'>Productor</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" name="productor" placeholder="Ingrese Cliente" />
                        </Form.Group>
                    </Col>

                    {/* Contenedor */}
                    <Col>
                        <Form.Group className="mb-0" controlId="contenedor">
                            <Form.Label className='mt-1 mb-1'>Contenedor</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" name="contenedor" placeholder="DUMY0000001" />
                        </Form.Group>
                    </Col>
                    {/*Producto*/}
                    <Col>
                        <Form.Group className="mb-0" controlId="producto">
                            <Form.Label className='mt-1 mb-1'>Producto</Form.Label>
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" name="producto" placeholder="Ingrese el Producto" />
                        </Form.Group>
                    </Col>

                </Row>
            </Form>


            {/* Tabla */}
            <table ref={tablaRef} className="table table-striped table-bordered table-sm mt-3">
                <thead>
                    <tr>
                        <th>Semana</th>
                        <th className='table-success'>Fecha Llenado</th>
                        <th  className="table-danger">Fecha Rechazo</th>
                        <th>Productor</th>
                        <th>Contenedor</th>
                        <th>Producto</th>
                        <th>Pallet</th>
                        <th>Cajas</th>
                        <th>Motivo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {tableData.map((item, key) => {
                        const listadoRelacionado = getListadoRelacionado(item);
                        return (
                        <tr key={key}>
                            {editando === item.id ? (
                                <>
                                    <td className="text-custom-small text-center">
                                        {valoresEditados.semana || listadoRelacionado?.Embarque?.semana?.consecutivo}
                                    </td>
                                    <td className="text-custom-small text-center">{formatDateValue(listadoRelacionado?.fecha)}</td>
                                    <td className="text-custom-small text-center">{formatDateValue(item?.fecha_rechazo)}</td>
                                    <td>
                                        <input
                                            list={`almacenes-${item.combo.id}`}
                                            className="form-control custom-input text-custom-small text-center"
                                            style={{ padding: "0", margin: "0", fontSize: "12px", width: "100%" }}
                                            onChange={(e) => handleChange(e, 'productor')}
                                            defaultValue={item?.almacene?.nombre}
                                        />
                                        <datalist id={`almacenes-${item.combo.id}`}>
                                            {almacenes.map((element, key) => (
                                                <option key={key} value={element?.nombre} />
                                            ))}
                                        </datalist>
                                    </td>
                                    <td>
                                        <input
                                            list={`contenedores-${item.id}`}
                                            className="form-control custom-input text-custom-small text-center"
                                            style={{ padding: "0", margin: "0", fontSize: "12px", width: "100%" }}
                                            type="text"
                                            defaultValue={item?.Contenedor?.contenedor}
                                            onChange={(e) => handleChange(e, 'contenedor')}
                                            placeholder="ABCD0000000"
                                            maxLength={11}
                                        />
                                        <datalist id={`contenedores-${item.id}`}>
                                            {contenedoresSemana.map((cont, key) => (
                                                <option key={key} value={cont} />
                                            ))}
                                        </datalist>
                                    </td>
                                    <td>
                                        <input
                                            list={`productos-${item.combo.id}`}
                                            className="form-control custom-input text-custom-small text-center"
                                            style={{ padding: "0", margin: "0", fontSize: "12px", width: "100%" }}
                                            onChange={(e) => handleChange(e, 'producto')}
                                            defaultValue={item.combo.nombre}
                                        />
                                        <datalist id={`productos-${item.combo.id}`}>
                                            {item.Contenedor.Listados.map((element, key) => (
                                                <option key={key} value={element.combo.nombre} />
                                            ))}
                                        </datalist>
                                    </td>


                                    <td><input
                                        className="form-control custom-input text-custom-small text-center"
                                        style={{ padding: "0", margin: "0", fontSize: "12px" }}
                                        type="text" value={valoresEditados.pallet || item?.serial_palet} onChange={(e) => handleChange(e, 'pallet')} />
                                    </td>
                                    <td><input
                                        className="form-control custom-input text-custom-small text-center"
                                        style={{ padding: "0", margin: "0", fontSize: "12px" }}
                                        type="text" value={valoresEditados.cajas || item?.cantidad} onChange={(e) => handleChange(e, 'cajas')} />
                                    </td>
                                    <td><input
                                        className="form-control custom-input text-custom-small text-center"
                                        style={{ padding: "0", margin: "0", fontSize: "12px" }}
                                        type="text" value={valoresEditados.motivo || item?.MotivoDeRechazo?.motivo_rechazo} onChange={(e) => handleChange(e, 'motivo')} />
                                    </td>
                                    <td style={{}}>
                                        <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center", margin: "auto", width: "100px", height: "100%" }}>
                                            <FaSave onClick={() => guardarEdicion(item)} style={{ cursor: "pointer", color: "black", fontSize: "1.2rem" }} />
                                        </div>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td className="text-custom-small text-center">{listadoRelacionado?.Embarque?.semana?.consecutivo}</td>
                                    <td className="text-custom-small text-center">{formatDateValue(listadoRelacionado?.fecha)}</td>
                                    <td className="text-custom-small text-center">{formatDateValue(item?.fecha_rechazo)}</td>
                                    <td className="text-custom-small text-center">{item?.almacene?.nombre}</td>
                                    <td className="text-custom-small text-center">{item?.Contenedor?.contenedor}</td>
                                    <td className="text-custom-small text-center">{item?.combo?.nombre}</td>
                                    <td className="text-custom-small text-center">{item?.serial_palet}</td>
                                    <td className="text-custom-small text-center">{item?.cantidad}</td>
                                    <td className="text-custom-small text-center">{item?.MotivoDeRechazo?.motivo_rechazo}</td>
                                    <td className="text-custom-small text-center" style={{ height: "100%" }}>
                                        <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center", width: "100%", height: "100%" }}>

                                            <FaEdit onClick={() => editarRechazo(item)} style={{ cursor: "pointer", color: "#997a1c", fontSize: "1.2rem" }} />

                                            {!item?.habilitado && (
                                                <BsSendCheckFill onClick={() => aprobarRechazo(item)} style={{ cursor: "pointer", color: "#579164", fontSize: "1.2rem" }} />
                                            )}
                                            {!item?.habilitado && (
                                                <TiDelete onClick={() => eliminarRechazoHandler(item)} style={{ cursor: "pointer", color: "#91484f", fontSize: "1.4rem" }} />
                                            )}
                                        </div>
                                    </td>

                                </>
                            )}
                        </tr>
                        );
                    })}
                </tbody>
            </table>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
        </>
    );
};

export default Rechazos;
