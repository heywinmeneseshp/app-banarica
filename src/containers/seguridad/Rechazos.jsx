import Paginacion from '@components/shared/Tablas/Paginacion';
import { actualizarRechazo, eliminarRechazo, paginarRechazos, aprobarRechazoApi, agregarRechazo, restaurarRechazoApi } from '@services/api/rechazos';
import { useEffect, useRef, useState } from 'react';
import { Form, Col, Row, Modal, Button } from 'react-bootstrap';
import { FaEdit, FaPlus, FaTrashRestore, FaInfoCircle } from 'react-icons/fa';
import { BsSendCheckFill } from "react-icons/bs";
import { TiDelete } from "react-icons/ti";
import { FaSave } from "react-icons/fa";
import { listarAlmacenes } from '@services/api/almacenes';
import { filtrarContenedor } from '@services/api/contenedores';
import { paginarSemanas } from '@services/api/semanas';
import { paginarListado } from '@services/api/listado';
import { listarMotivoDeRechazo } from '@services/api/motivoDeRechazo';
import { encontrarModulo } from '@services/api/configuracion';
import { useAuth } from '@hooks/useAuth';





const Rechazos = () => {
    const { getUser } = useAuth();
    const isSuperAdmin = getUser()?.id_rol === 'Super administrador';

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

    const [showCargarRechazo, setShowCargarRechazo] = useState(false);
    const [motivosRechazo, setMotivosRechazo] = useState([]);
    const [listadosSemanaNuevo, setListadosSemanaNuevo] = useState([]);
    const [semanasNuevoRechazo, setSemanasNuevoRechazo] = useState([]);
    const [guardandoRechazo, setGuardandoRechazo] = useState(false);
    const [soloEliminados, setSoloEliminados] = useState(false);
    // Semanas en las que el backend permite eliminar/restaurar rechazos: la
    // actual y la ultima con datos registrados. Se calculan aqui para no
    // mostrar el icono en filas donde la accion siempre fallaria.
    const [semanasPermitidasEliminar, setSemanasPermitidasEliminar] = useState(new Set());
    const [showAyudaRechazos, setShowAyudaRechazos] = useState(false);
    const [nuevoRechazo, setNuevoRechazo] = useState({
        semana: '', contenedor: '', productor: '', producto: '', pallet: '', cajas: '', motivo: '', fecha: ''
    });

    // Derivados en el cliente a partir de los listados de la semana ya cargados (sin nuevas consultas)
    const contenedoresSemanaNuevo = [...new Set(
        listadosSemanaNuevo.map((item) => item?.Contenedor?.contenedor).filter(Boolean)
    )];
    const listadosContenedorNuevo = nuevoRechazo.contenedor
        ? listadosSemanaNuevo.filter(
            (item) => item?.Contenedor?.contenedor?.toUpperCase() === nuevoRechazo.contenedor.trim().toUpperCase()
        )
        : [];

    useEffect(() => {
        buscarSemana();
        listar();
        listarMotivoDeRechazo().then(setMotivosRechazo).catch(() => setMotivosRechazo([]));
        cargarSemanasPermitidasEliminar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        listar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [soloEliminados]);

    const toggleSoloEliminados = () => {
        setEditando(null);
        setSoloEliminados((prev) => !prev);
    };

    // Misma regla que aplica el backend: solo se puede eliminar/restaurar un
    // rechazo de la semana actual o de la ultima semana con datos registrados.
    const cargarSemanasPermitidasEliminar = async () => {
        try {
            const [configSemana, ultimoListado] = await Promise.all([
                encontrarModulo('Semana', { syncWeeks: false }).catch(() => []),
                paginarListado(1, 1, { habilitado: true }).catch(() => null),
            ]);

            const semanaActual = configSemana?.[0]?.semana_actual !== undefined
                ? `S${String(configSemana[0].semana_actual).padStart(2, '0')}-${configSemana[0].anho_actual}`
                : null;
            const ultimaConDatos = ultimoListado?.data?.[0]?.Embarque?.semana?.consecutivo || null;

            setSemanasPermitidasEliminar(new Set([semanaActual, ultimaConDatos].filter(Boolean)));
        } catch (error) {
            console.error("❌ Error al calcular las semanas permitidas para eliminar:", error);
            setSemanasPermitidasEliminar(new Set());
        }
    };

    const puedeEliminarORestaurar = (rechazo) => {
        if (semanasPermitidasEliminar.size === 0) return true; // si no se pudo calcular, no bloquear en el front (el backend igual valida)
        const semanaRechazo = getListadoRelacionado(rechazo)?.Embarque?.semana?.consecutivo;
        return !semanaRechazo || semanasPermitidasEliminar.has(semanaRechazo);
    };

    const listar = async () => {
        try {
            const formData = new FormData(formRef.current);
            const body = {
                semana: formData.get("semana"),
                productor: formData.get("productor") || "",
                contenedor: formData.get("contenedor") || "",
                producto: formData.get("producto") || "",
                eliminado: soloEliminados,
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
            const nombreProductorOriginal = almacene?.nombre || cod_productor;

            const existeProductoRechazado = Listados.some(item => item.combo.id === id_producto);
            if (!existeProductoRechazado) {
                return window.alert(`⚠ El producto "${rechazo.combo.nombre}" no está asignado al contenedor "${contenedor}".`);
            }

            // Productores del contenedor que si tienen este producto: son las unicas
            // fuentes validas de inventario para descontar las cajas del rechazo.
            const candidatos = Listados
                .filter(item => item.combo.id === id_producto)
                .map(item => item.almacen);

            if (candidatos.length === 0) {
                return window.alert(`⚠ Ningún productor del contenedor "${contenedor}" tiene este producto asignado. No es posible aprobar el rechazo.`);
            }

            let codProductorDescuento = null;
            const candidatoOriginal = candidatos.find(item => item.consecutivo === cod_productor);

            if (candidatoOriginal) {
                // El productor del rechazo si tiene el producto en el contenedor: se descuenta de el mismo.
                codProductorDescuento = candidatoOriginal.consecutivo;
            } else if (candidatos.length === 1) {
                const unico = candidatos[0];
                const ok = window.confirm(
                    `⚠ El productor "${nombreProductorOriginal}" no tiene este producto en el contenedor "${contenedor}". `
                    + `Se conservará "${nombreProductorOriginal}" como productor del rechazo, pero las cajas se descontarán `
                    + `del inventario de "${unico.nombre}" (${unico.consecutivo}). ¿Deseas continuar?`
                );
                if (!ok) return;
                codProductorDescuento = unico.consecutivo;
            } else {
                let message = `🔹 El productor "${nombreProductorOriginal}" no tiene este producto en el contenedor. Elige de cuál productor se descuentan las cajas. Opciones disponibles:`;
                while (!codProductorDescuento) {
                    const opciones = candidatos.map(el => `${el.consecutivo} ${el.nombre}`).join(", ");
                    const inputUsuario = window.prompt(`${message} ${opciones}`);
                    if (!inputUsuario) return;
                    codProductorDescuento = candidatos.find(item => item.consecutivo === inputUsuario)?.consecutivo;
                    if (!codProductorDescuento) message = "⚠ El código ingresado no es válido. Inténtalo de nuevo:";
                }
            }

            const nombreProductorDescuento = candidatos.find(item => item.consecutivo === codProductorDescuento)?.nombre || codProductorDescuento;
            const mensajeConfirmacion = codProductorDescuento === cod_productor
                ? "¿Estás seguro de aprobar el rechazo?"
                : `¿Estás seguro de aprobar el rechazo? El productor registrado se mantendrá como "${nombreProductorOriginal}"; `
                    + `las cajas se descontarán del inventario de "${nombreProductorDescuento}".`;
            if (!window.confirm(mensajeConfirmacion)) return;

            // El backend lee las cajas actuales con SELECT FOR UPDATE para evitar
            // descuentos incorrectos cuando se aprueban múltiples rechazos del mismo contenedor.
            // cod_productor se conserva sin modificar; cod_productor_descuento indica de
            // donde se descuenta el inventario cuando difiere del productor original.
            await aprobarRechazoApi(rechazo.id, {
                cod_productor,
                cod_productor_descuento: codProductorDescuento,
            });
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

            // Validación de motivo
            if (valoresEditados?.motivo) {
                const motivoEncontrado = motivosRechazo.find(item => item.motivo_rechazo === valoresEditados.motivo);
                if (!motivoEncontrado) return window.alert(`⚠ Error: el motivo "${valoresEditados.motivo}" no existe.`);
                rechazo.id_motivo_de_rechazo = motivoEncontrado.id;
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

                // Guardar no requiere que el productor tenga el producto en el contenedor
                // (a diferencia de aprobar, guardar no descuenta inventario). Solo se avisa.
                const tieneProductorElProducto = Listados.some(
                    item => item.combo.id === rechazo.id_producto && item.almacen.consecutivo === rechazo.cod_productor
                );
                if (!tieneProductorElProducto) {
                    const ok = window.confirm(
                        `⚠ El productor actual no tiene este producto en el contenedor "${contenedorActual}". `
                        + `¿Deseas guardarlo así de todas formas?`
                    );
                    if (!ok) return;
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
            window.alert(error?.response?.data?.message || "⚠ Se produjo un error al guardar los cambios. Inténtalo de nuevo.");
        }
    };

    const handleChange = (e, field) => {
        setValoresEditados({ ...valoresEditados, [field]: e.target.value });
    };

    const eliminarRechazoHandler = async (rechazo) => {
        const mensaje = rechazo?.habilitado
            ? `¿Estás seguro de eliminar el rechazo? Ya estaba aprobado: se devolverán ${rechazo.cantidad} cajas al inventario del productor.`
            : "¿Estás seguro de eliminar el rechazo?";
        if (!window.confirm(mensaje)) return;
        try {
            await eliminarRechazo(rechazo.id);
            await listar();
            await cargarSemanasPermitidasEliminar();
        } catch (error) {
            console.error("❌ Error al eliminar el rechazo:", error);
            window.alert(error?.response?.data?.message || "Error al eliminar el rechazo.");
        }
    };

    const restaurarRechazoHandler = async (rechazo) => {
        const mensaje = rechazo?.habilitado
            ? `¿Restaurar este rechazo? Estaba aprobado: se volverán a descontar ${rechazo.cantidad} cajas del inventario del productor.`
            : "¿Restaurar este rechazo?";
        if (!window.confirm(mensaje)) return;
        try {
            await restaurarRechazoApi(rechazo.id);
            await listar();
            await cargarSemanasPermitidasEliminar();
        } catch (error) {
            console.error("❌ Error al restaurar el rechazo:", error);
            window.alert(error?.response?.data?.message || "Error al restaurar el rechazo.");
        }
    };

    const abrirCargarRechazo = () => {
        setNuevoRechazo({
            semana: '', contenedor: '', productor: '', producto: '', pallet: '', cajas: '', motivo: '',
            fecha: new Date().toISOString().split('T')[0],
        });
        setListadosSemanaNuevo([]);
        setSemanasNuevoRechazo([]);
        setShowCargarRechazo(true);
    };

    const cerrarCargarRechazo = () => {
        setShowCargarRechazo(false);
    };

    const handleChangeNuevoRechazo = (field, value) => {
        setNuevoRechazo((prev) => ({ ...prev, [field]: value }));
    };

    // Al fijar la semana se cargan UNA sola vez todos sus listados (contenedor + producto + almacen).
    // El campo Contenedor y su datalist filtran de esa misma carga, sin nuevas consultas.
    const buscarSemanaNuevoRechazo = async (codigo) => {
        handleChangeNuevoRechazo('semana', codigo);
        handleChangeNuevoRechazo('contenedor', '');
        handleChangeNuevoRechazo('producto', '');

        try {
            const semanasEncontradas = await paginarSemanas(codigo);
            setSemanasNuevoRechazo(semanasEncontradas || []);
        } catch (error) {
            console.error("❌ Error al buscar semanas:", error);
            setSemanasNuevoRechazo([]);
        }

        if (!codigo) {
            setListadosSemanaNuevo([]);
            return;
        }
        try {
            const res = await paginarListado(1, 500, { semana: codigo, habilitado: true });
            setListadosSemanaNuevo(res?.data || []);
        } catch (error) {
            console.error("❌ Error al buscar contenedores de la semana:", error);
            setListadosSemanaNuevo([]);
        }
    };

    const guardarNuevoRechazo = async () => {
        try {
            const { contenedor, productor, producto, pallet, cajas, motivo, fecha } = nuevoRechazo;

            if (!contenedor || !productor || !producto || !cajas || !motivo || !fecha) {
                return window.alert("⚠ Completa todos los campos obligatorios (Contenedor, Productor, Producto, Cajas, Motivo, Fecha).");
            }

            if (listadosContenedorNuevo.length === 0) {
                return window.alert(`⚠ El contenedor "${contenedor}" no existe o no tiene productos asignados.`);
            }

            const almacen = almacenes.find((item) => item.nombre === productor);
            if (!almacen) return window.alert(`⚠ El productor "${productor}" no existe.`);

            const listadoProducto = listadosContenedorNuevo.find((item) => item?.combo?.nombre === producto);
            if (!listadoProducto) return window.alert(`⚠ El producto "${producto}" no está asignado al contenedor "${contenedor}".`);

            const motivoEncontrado = motivosRechazo.find((item) => item.motivo_rechazo === motivo);
            if (!motivoEncontrado) return window.alert(`⚠ El motivo "${motivo}" no existe.`);

            const idContenedor = listadoProducto?.Contenedor?.id || listadoProducto?.id_contenedor;
            const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

            setGuardandoRechazo(true);

            await agregarRechazo({
                id_producto: listadoProducto.combo.id,
                id_motivo_de_rechazo: motivoEncontrado.id,
                cantidad: cajas,
                serial_palet: pallet,
                cod_productor: almacen.consecutivo,
                id_contenedor: idContenedor,
                id_usuario: usuario?.id,
                fecha_rechazo: fecha,
            });

            setShowCargarRechazo(false);
            await listar();
        } catch (error) {
            console.error("❌ Error al cargar el rechazo:", error);
            window.alert(error?.response?.data?.message || "⚠ Se produjo un error al cargar el rechazo.");
        } finally {
            setGuardandoRechazo(false);
        }
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
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="mb-0 d-flex align-items-center gap-2">
                    {"Rechazos"}
                    <button
                        type="button"
                        className="btn btn-link btn-sm text-decoration-none p-0 text-secondary"
                        style={{ lineHeight: 1 }}
                        onClick={() => setShowAyudaRechazos(true)}
                        title="Ver detalle de las acciones del módulo"
                    >
                        <FaInfoCircle size={17} />
                    </button>
                </h2>
                <div className="d-flex gap-2">
                    {isSuperAdmin && (
                        <button
                            type="button"
                            className={`btn btn-sm ${soloEliminados ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={toggleSoloEliminados}
                        >
                            {soloEliminados ? 'Ver activos' : 'Ver eliminados'}
                        </button>
                    )}
                    {!soloEliminados && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={abrirCargarRechazo}>
                            <FaPlus className="me-1" /> Cargar rechazo
                        </button>
                    )}
                </div>
            </div>
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
                        <th>N°</th>
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
                            <td className="text-custom-small text-center">{(pagination - 1) * limit + key + 1}</td>
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
                                    <td>
                                        <input
                                            list={`motivos-${item.id}`}
                                            className="form-control custom-input text-custom-small text-center"
                                            style={{ padding: "0", margin: "0", fontSize: "12px" }}
                                            type="text"
                                            value={valoresEditados.motivo !== undefined ? valoresEditados.motivo : (item?.MotivoDeRechazo?.motivo_rechazo || '')}
                                            onChange={(e) => handleChange(e, 'motivo')}
                                        />
                                        <datalist id={`motivos-${item.id}`}>
                                            {motivosRechazo.map((element) => (
                                                <option key={element.id} value={element.motivo_rechazo} />
                                            ))}
                                        </datalist>
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
                                            {soloEliminados ? (
                                                puedeEliminarORestaurar(item) && (
                                                    <FaTrashRestore
                                                        onClick={() => restaurarRechazoHandler(item)}
                                                        title={item?.habilitado ? "Restaurar (vuelve a descontar las cajas)" : "Restaurar"}
                                                        style={{ cursor: "pointer", color: "#579164", fontSize: "1.2rem" }}
                                                    />
                                                )
                                            ) : (
                                                <>
                                                    <FaEdit onClick={() => editarRechazo(item)} style={{ cursor: "pointer", color: "#997a1c", fontSize: "1.2rem" }} />

                                                    {!item?.habilitado && (
                                                        <BsSendCheckFill onClick={() => aprobarRechazo(item)} style={{ cursor: "pointer", color: "#579164", fontSize: "1.2rem" }} />
                                                    )}
                                                    {isSuperAdmin && puedeEliminarORestaurar(item) && (
                                                        <TiDelete
                                                            onClick={() => eliminarRechazoHandler(item)}
                                                            title={item?.habilitado ? "Eliminar (devuelve las cajas al inventario)" : "Eliminar"}
                                                            style={{ cursor: "pointer", color: "#91484f", fontSize: "1.4rem" }}
                                                        />
                                                    )}
                                                </>
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

            {showCargarRechazo && (
                <>
                    <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-dialog-centered" role="document">
                            <div className="modal-content">
                                <div className="modal-header py-2">
                                    <h5 className="modal-title mb-0">Cargar rechazo</h5>
                                    <button type="button" className="btn-close" onClick={cerrarCargarRechazo} aria-label="Cerrar"></button>
                                </div>
                                <div className="modal-body">
                                    <Row className="g-2">
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Semana</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="text"
                                                list="nuevo-rechazo-semanas"
                                                placeholder="Ingrese la semana"
                                                value={nuevoRechazo.semana}
                                                onChange={(e) => buscarSemanaNuevoRechazo(e.target.value)}
                                            />
                                            <datalist id="nuevo-rechazo-semanas">
                                                {semanasNuevoRechazo.map((item) => (
                                                    <option key={item.id} value={item.consecutivo} />
                                                ))}
                                            </datalist>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Fecha rechazo</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="date"
                                                value={nuevoRechazo.fecha}
                                                onChange={(e) => handleChangeNuevoRechazo('fecha', e.target.value)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Contenedor</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="text"
                                                list="nuevo-rechazo-contenedores"
                                                placeholder="ABCD0000000"
                                                maxLength={11}
                                                value={nuevoRechazo.contenedor}
                                                onChange={(e) => handleChangeNuevoRechazo('contenedor', e.target.value)}
                                            />
                                            {nuevoRechazo.contenedor.length >= 5 && (
                                                <datalist id="nuevo-rechazo-contenedores">
                                                    {contenedoresSemanaNuevo.map((cod, key) => (
                                                        <option key={key} value={cod} />
                                                    ))}
                                                </datalist>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Productor</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="text"
                                                list="nuevo-rechazo-almacenes"
                                                value={nuevoRechazo.productor}
                                                onChange={(e) => handleChangeNuevoRechazo('productor', e.target.value)}
                                            />
                                            <datalist id="nuevo-rechazo-almacenes">
                                                {almacenes.map((item) => (
                                                    <option key={item.id} value={item.nombre} />
                                                ))}
                                            </datalist>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Producto</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="text"
                                                list="nuevo-rechazo-productos"
                                                disabled={listadosContenedorNuevo.length === 0}
                                                value={nuevoRechazo.producto}
                                                onChange={(e) => handleChangeNuevoRechazo('producto', e.target.value)}
                                            />
                                            <datalist id="nuevo-rechazo-productos">
                                                {listadosContenedorNuevo.map((item, key) => (
                                                    <option key={key} value={item?.combo?.nombre} />
                                                ))}
                                            </datalist>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Pallet</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="text"
                                                value={nuevoRechazo.pallet}
                                                onChange={(e) => handleChangeNuevoRechazo('pallet', e.target.value)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Cajas</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="number"
                                                min={1}
                                                value={nuevoRechazo.cajas}
                                                onChange={(e) => handleChangeNuevoRechazo('cajas', e.target.value)}
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="mb-1 small">Motivo</Form.Label>
                                            <Form.Control
                                                className="form-control-sm"
                                                type="text"
                                                list="nuevo-rechazo-motivos"
                                                value={nuevoRechazo.motivo}
                                                onChange={(e) => handleChangeNuevoRechazo('motivo', e.target.value)}
                                            />
                                            <datalist id="nuevo-rechazo-motivos">
                                                {motivosRechazo.map((item) => (
                                                    <option key={item.id} value={item.motivo_rechazo} />
                                                ))}
                                            </datalist>
                                        </Col>
                                    </Row>
                                    {nuevoRechazo.contenedor && listadosContenedorNuevo.length === 0 && (
                                        <div className="text-danger small mt-2">
                                            No se encontro el contenedor o no tiene productos asignados.
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer py-2">
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={cerrarCargarRechazo} disabled={guardandoRechazo}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-primary btn-sm" onClick={guardarNuevoRechazo} disabled={guardandoRechazo}>
                                        {guardandoRechazo ? "Guardando..." : "Guardar"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            <Modal show={showAyudaRechazos} onHide={() => setShowAyudaRechazos(false)} centered>
                <Modal.Header closeButton className="bg-dark text-white">
                    <Modal.Title className="h6 mb-0">Acciones del módulo de Rechazos</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul className="mb-0 ps-3">
                        <li className="mb-2">
                            <strong>Cargar rechazo:</strong> registra un rechazo pendiente, sin afectar el inventario
                            todavía. Queda a la espera de ser aprobado.
                        </li>
                        <li className="mb-2">
                            <strong>Editar</strong> (lápiz): permite corregir contenedor, productor, producto, pallet,
                            cajas o motivo. Si el rechazo <strong>ya fue aprobado</strong> y cambias la cantidad de
                            cajas, el inventario se ajusta automáticamente por la diferencia. No se puede cambiar el
                            productor de un rechazo ya aprobado.
                        </li>
                        <li className="mb-2">
                            <strong>Aprobar</strong> (✔ verde, solo en rechazos pendientes): descuenta las cajas del
                            inventario del productor. Si el productor original no tiene el producto en el contenedor,
                            te deja elegir de cuál productor del contenedor se descuentan.
                        </li>
                        <li className="mb-2">
                            <strong>Eliminar</strong> (solo <strong>Super administrador</strong>): si el rechazo ya
                            estaba aprobado, al eliminarlo se <strong>devuelven las cajas descontadas</strong> al
                            inventario. Solo se puede eliminar un rechazo de la <strong>semana actual</strong> o de la
                            <strong> última semana con datos registrados</strong>; por eso el ícono no aparece en filas
                            de semanas más antiguas.
                        </li>
                        <li className="mb-0">
                            <strong>Ver eliminados / Restaurar</strong> (solo Super administrador): muestra los
                            rechazos eliminados. Al restaurar uno que estaba aprobado, se{' '}
                            <strong>vuelven a descontar las cajas</strong> del inventario. Aplica la misma restricción
                            de semana que eliminar.
                        </li>
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowAyudaRechazos(false)}>Entendido</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Rechazos;
