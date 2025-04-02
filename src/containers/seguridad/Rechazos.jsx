import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarRechazo, eliminarRechazo, paginarRechazos } from '@services/api/rechazos';
import { useEffect, useRef, useState } from 'react';
import { Form, Col, Row } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';
import { BsSendCheckFill } from "react-icons/bs";
import { TiDelete } from "react-icons/ti";
import { FaSave } from "react-icons/fa";
import { listarAlmacenes } from '@services/api/almacenes';
import { actualizarListado } from '@services/api/listado';




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

    useEffect(() => {
        listar();
    }, []);

    const listar = async () => {
        try {
            const formData = new FormData(formRef.current);
            const body = {
                semana: formData.get("semana") || "",
                productor: formData.get("productor") || "",
                contenedor: formData.get("contenedor") || "",
                producto: formData.get("producto") || "",
            };

            const [res, almacenes] = await Promise.all([
                paginarRechazos(pagination, limit, body),
                listarAlmacenes()
            ]);

            setAlmacenes(almacenes);
            setLimit(100);
            setTableData(res.data);
            setTotal(res.total);
        } catch (error) {
            console.error("❌ Error al listar datos:", error);
        }
    };

    const aprobarRechazo = async (rechazo) => {
        try {
            console.log(rechazo);
            const { Contenedor, id_producto, cod_productor, almacene } = rechazo;
            const { Listados, contenedor } = Contenedor;
            const existeProductoRechazado = Listados.some(item => item.combo.id === id_producto);
            const existeProductorRechazado = Listados.some(item => item.almacen.consecutivo === cod_productor);
            if (!existeProductorRechazado) {
                const confirm = window.confirm(`⚠ El productor "${almacene.nombre}" no está asignado al contenedor "${contenedor}". ¿Desea continuar?`);
                if (!confirm) return;
            }
            if (!existeProductoRechazado) {
                return window.alert(`⚠ El producto "${rechazo.combo.nombre}" no está asignado al contenedor "${contenedor}".`);
            }
            let almacen = null;
            let message = "🔹 Ingresa el código del productor responsable del rechazo del producto. Opciones disponibles:";
            while (!almacen) {
                let almacenesFiltrados = Listados.filter(item => item.combo.id === id_producto).map(item => item.almacen);
                const almacenExist = almacenesFiltrados.find(item => item.consecutivo == almacene.consecutivo);
                almacenesFiltrados = almacenExist == null ? almacenesFiltrados : [almacenExist];
                if (almacenesFiltrados.length > 1) {
                    const opciones = almacenesFiltrados.map(el => `${el.consecutivo} ${el.nombre}`).join(", ");
                    const inputUsuario = window.prompt(`${message} ${opciones}`);
                    if (!inputUsuario) return;
                    almacen = almacenesFiltrados.find(item => item.consecutivo === inputUsuario)?.consecutivo;
                    rechazo.cod_productor = almacen;
                } else {
                    almacen = almacenesFiltrados[0]?.consecutivo || cod_productor;
                }

                if (!almacen) {
                    message = "⚠ El código ingresado no es válido. Inténtalo de nuevo:";
                }
            }
            if (!window.confirm("¿Estás seguro de aprobar el rechazo?")) return;
            const itemListado = Listados.find(item =>
                (item.almacen.consecutivo == almacen) &&
                (item.id_producto == id_producto)
            );
            const cajas = itemListado.cajas_unidades - rechazo.cantidad;
            await actualizarRechazo(rechazo.id, { habilitado: true, cod_productor: rechazo.cod_productor });
            await actualizarListado(itemListado.id, { cajas_unidades: cajas });
            listar();
        } catch (error) {
            console.error("❌ Error al aprobar rechazo:", error);
        }
    };

    const editarRechazo = (rechazo) => {
        setValoresEditados([]);
        setEditando(rechazo.id);
    };

    const guardarEdicion = async (rechazo) => {
        try {
            console.log(rechazo);

            const { Contenedor } = rechazo;
            const { Listados, contenedor } = Contenedor;

            // Validación de productor
            if (valoresEditados?.productor) {
                const ibm = almacenes.find(item => item.nombre === valoresEditados.productor);
                if (!ibm) return window.alert(`⚠ Error: el productor "${valoresEditados.productor}" no existe.`);
                rechazo.cod_productor = ibm.consecutivo;
            }

            // Validación de producto
            if (valoresEditados?.producto) {
                const producto = Listados.find(item => item.combo.nombre === valoresEditados.producto);
                if (!producto) {
                    return window.alert(`⚠ Error: el producto "${valoresEditados.producto}" no está asignado al contenedor "${contenedor}".`);
                }
                rechazo.id_producto = producto.combo.id;
                rechazo.combo.nombre = producto.combo.nombre;
            }

            const existeProductoRechazado = Listados.some(item => item.combo.id === rechazo.id_producto);
            if (!existeProductoRechazado) {
                return window.alert(`⚠ El producto "${rechazo.combo.nombre}" no está asignado al contenedor "${contenedor}".`);
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

                if (!almacen) {
                    message = "⚠ El código ingresado no es válido. Inténtalo de nuevo:";
                }
            }

            if (rechazo.cod_productor !== almacen) {
                if (!window.confirm("El productor seleccionado no está asignado a este contenedor. ¿Desea continuar?")) return;
            }

            // Actualización de valores editados
            rechazo.serial_palet = valoresEditados?.pallet ?? rechazo.serial_palet;
            rechazo.cantidad = valoresEditados?.cajas ?? rechazo.cantidad;

            // Creación del objeto a enviar
            const body = {
                cod_productor: rechazo.cod_productor,
                serial_palet: rechazo.serial_palet,
                id_producto: rechazo.id_producto,
                cantidad: rechazo.cantidad,
                id_motivo_de_rechazo: rechazo.id_motivo_de_rechazo,
            };

            console.log(body);

            // Guardar cambios y actualizar la lista
            await actualizarRechazo(rechazo.id, body);
            setEditando(null);
            listar();
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
                            <Form.Control className='form-control-sm' onChange={() => listar()} type="text" name="semana" placeholder="Ingrese la semana" />
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
                    {tableData.map((item, key) => (
                        <tr key={key}>
                            {editando === item.id ? (
                                <>
                                    <td className="text-custom-small text-center">
                                        {valoresEditados.semana || item?.Contenedor?.Listados[0]?.Embarque?.semana?.consecutivo}
                                    </td>
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


                                    <td className="text-custom-small text-center">{valoresEditados.contenedor || item?.Contenedor?.contenedor}</td>
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
                                    <td className="text-custom-small text-center">{item?.Contenedor?.Listados[0]?.Embarque?.semana?.consecutivo}</td>
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
                    ))}
                </tbody>
            </table>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
        </>
    );
};

export default Rechazos;
