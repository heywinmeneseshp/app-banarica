import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@hooks/useAuth";
import { PropagateLoader } from "react-spinners";
import useDate from "@hooks/useDate";

// Servicios y Hooks
import { actualizarSeriales, listarProductosSeguridad, listarSeriales } from "@services/api/seguridad";
import { agregarTraslado } from "@services/api/traslados";
import { agregarNotificaciones } from "@services/api/notificaciones";
import { agregarHistorial } from "@services/api/historialMovimientos";
import { encontrarModulo } from "@services/api/configuracion";
import { restar, sumar } from "@services/api/stock";
import { enviarCorreo } from "@services/api/correo";
import uSemana from "@hooks/useSemana";

// Componentes
import Paginacion from "@components/Paginacion";

// CSS
import styles from "@styles/Seguridad.module.css";
import styles2 from "@styles/Config.module.css";
import { generateTransferExcelBase64 } from "utils/generateTransferExcelBase64.js";




/**
 * Componente Modal para mostrar la lista de ítems a transferir
 * Se ha mantenido aquí para evitar dependencias de archivos externos
 * @param {object} props
 * @param {boolean} props.show
 * @param {function} props.onClose
 * @param {array} props.items
 * @param {function} props.onRemove
 */

const TransferListModal = ({ show, onClose, items, onRemove }) => {
   
    const [selectedItemsToDelete, setSelectedItemsToDelete] = useState([]);
  

    // ESTADO LOCAL para rastrear qué ítems están marcados para ELIMINAR
   

    // Resetea la selección cada vez que el modal se abre con nuevos ítems
    useEffect(() => {
        if (show) {
            setSelectedItemsToDelete([]);
        }
    }, [show, items]);

    // Función para manejar la selección individual
    const handleCheck = (item) => {
        setSelectedItemsToDelete(prev => {
            const uniqueKey = `${item.cons_producto}-${item.serial || item.id}`;
            if (prev.some(i => `${i.cons_producto}-${i.serial || i.id}` === uniqueKey)) {
                // Deseleccionar
                return prev.filter(i => `${i.cons_producto}-${i.serial || i.id}` !== uniqueKey);
            } else {
                // Seleccionar
                return [...prev, item];
            }
        });
    };

    // Función para manejar la selección de todos
    const handleCheckAll = () => {
        if (selectedItemsToDelete.length === items.length) {
            // Deseleccionar todos
            setSelectedItemsToDelete([]);
        } else {
            // Seleccionar todos (copia de la lista completa)
            setSelectedItemsToDelete([...items]);
        }
    };

    // Función para eliminar ítems seleccionados
    const handleMassiveRemove = () => {
        if (selectedItemsToDelete.length === 0) {
            return window.alert("Debe seleccionar al menos un artículo para eliminar.");
        }

        if (window.confirm(`¿Está seguro de eliminar ${selectedItemsToDelete.length} artículo(s) de la lista de traslado?`)) {
            // Llama a la prop onRemove con la lista de ítems a eliminar
            onRemove(selectedItemsToDelete);
            setSelectedItemsToDelete([]); // Limpia la selección después de la eliminación
        }
    };


    const modalStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1050,
    };

    const contentStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '700px', // Aumentado ligeramente para la nueva columna
        width: '90%',
        boxShadow: '0 5px 15px rgba(0,0,0,.5)',
        maxHeight: '80vh',
        overflowY: 'auto',
    };

    const allChecked = items.length > 0 && selectedItemsToDelete.length === items.length;

    if (show) return (
        <div style={modalStyle}>
            <div style={contentStyle}>
                <div className="modal-header d-flex justify-content-between align-items-center mb-3">
                    <h5 className="modal-title">Artículos Agregados ({items.length})</h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                <div className="modal-body">
                    {items.length === 0 ? (
                        <p>No hay artículos en la lista de traslado.</p>
                    ) : (
                        <table className="table table-striped table-sm">
                            <thead>
                                <tr>
                                    <th className="text-center">
                                        {/* Checkbox "Seleccionar Todos" */}
                                        <input className="form-check-input"
                                            type="checkbox"
                                            onChange={handleCheckAll}
                                            checked={allChecked}
                                            disabled={items.length === 0}
                                        />
                                    </th>
                                    <th className="text-center">Artículo</th>
                                    <th className="text-center">Serial Ext</th>
                                    <th className="text-center">S Pack</th>
                                    <th className="text-center">M Pack</th>
                                    <th className="text-center">L Pack</th>
                                    <th className="text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const uniqueKey = `${item.cons_producto}-${item.serial || item.id}`;
                                    const isSelected = selectedItemsToDelete.some(i =>
                                        `${i.cons_producto}-${i.serial || i.id}` === uniqueKey
                                    );

                                    return (
                                        <tr key={uniqueKey}>
                                            <td className="text-center">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleCheck(item)}
                                                />
                                            </td>
                                            <td className="text-center">{item.cons_producto}</td>
                                            <td className="text-center">{item.bag_pack}</td>
                                            <td className="text-center">{item.s_pack}</td>
                                            <td className="text-center">{item.m_pack}</td>
                                            <td className="text-center">{item.l_pack}</td>
                                            <td className="text-center">
                                                {/* Botón de eliminación individual (mantenido por si acaso) */}
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => onRemove(item)}
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="modal-footer d-flex justify-content-between pt-3">
                    {/* Botón de eliminación masiva */}
                    <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={handleMassiveRemove}
                        disabled={selectedItemsToDelete.length === 0}
                    >
                        Eliminar Seleccionados ({selectedItemsToDelete.length})
                    </button>

                    <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// --------------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// --------------------------------------------------------------------------------

export default function Transferencias() {
    const limitRef = useRef();
    const formRef = useRef();

    const { almacenByUser, user } = useAuth();

    // Estado para la lógica de la tabla (Resultados de búsqueda)
    const [tabla, setTabla] = useState([]);
    const [total, setTotal] = useState(0);
    const [productos, setProductos] = useState([]);

    // Estado para la paginación
    const [limit, setLimit] = useState(20);
    const [pagination, setPagination] = useState(1);

    // Estado para la lógica de selección (checkboxes en la tabla actual)
    const [checkAll, setCheckAll] = useState(false);
    const [checKs, setChecks] = useState([]);

    // ESTADO: Items acumulados para la transferencia
    const [itemsToTransfer, setItemsToTransfer] = useState([]);

    // NUEVO ESTADO: Control de visibilidad del modal
    const [showModal, setShowModal] = useState(false);

    // Estado de la UI y lógica de transferencia
    const [semanaData, setSemanaData] = useState(null);
    const [bool, setBool] = useState(false); // Indica si la transferencia se completó
    const [loading, setLoading] = useState(false);
    const [mostrarSerial, setMostrarSerial] = useState(false);


    // --------------------------------------------------------------------------------
    // Funciones de Lógica y Búsqueda (sin cambios)
    // --------------------------------------------------------------------------------

    // Obtener parámetros del formulario de búsqueda
    const getFormData = () => {
        const formData = new FormData(formRef.current);
        return {
            cons_producto: formData.get("producto"),
            serial: formData.get("serial"),
            bag_pack: formData.get("bag_pack"),
            s_pack: formData.get("s_pack"),
            m_pack: formData.get("m_pack"),
            l_pack: formData.get("l_pack"),
            cons_almacen: formData.get("origen"),
            available: [true]
        };
    };

    // Función principal de búsqueda de artículos
    const buscarArticulos = useCallback(async () => {
        if (!formRef.current) return;
        setCheckAll(false);
        setChecks([]);

        const data = getFormData();

        try {
            const res = await listarSeriales(pagination, limit, data);
            setTabla(res.data);
            setTotal(res.total);
            setChecks(new Array(res.data.length).fill(false));
        } catch (error) {
            console.error("Error al listar seriales:", error);
        }
    }, [pagination, limit]);

    // --------------------------------------------------------------------------------
    // Lógica del useEffect (Montaje e Interacciones)
    // --------------------------------------------------------------------------------

    useEffect(() => {
        buscarArticulos();
    }, [buscarArticulos]);

    useEffect(() => {
        // Carga de datos estáticos al montar el componente
        listarProductosSeguridad()
            .then(res => setProductos(res.filter(item => item.serial === true)));

        encontrarModulo("Semana")
            .then(res => setSemanaData(res[0]));

        setMostrarSerial(user.id_roll !== "Super usuario");

    }, [user.id_roll]);

    // --------------------------------------------------------------------------------
    // Handlers de Interfaz (Ajustados con la nueva lógica)
    // --------------------------------------------------------------------------------

    const onChanageBuscar = () => {
        setPagination(1);
        buscarArticulos();
    };

    const handleLimit = () => {
        setPagination(1);
        const newLimit = parseInt(limitRef.current.value);
        if (newLimit > 0) {
            setLimit(newLimit);
        }
        setCheckAll(false);
    };

    const handleCheckAll = () => {
        const newState = !checkAll;
        setChecks(new Array(tabla.length).fill(newState));
        setCheckAll(newState);
    };

    const hadleChecks = (position) => {
        setChecks(prevChecks => {
            const newChecks = [...prevChecks];
            newChecks[position] = !newChecks[position];

            if (!newChecks[position]) {
                setCheckAll(false);
            }
            else if (newChecks.every(check => check === true)) {
                setCheckAll(true);
            }

            return newChecks;
        });
    };

    // FUNCIÓN: Agregar ítems seleccionados a la lista temporal
    const agregarItem = () => {
        const itemsSeleccionados = tabla.filter((_, index) => checKs[index]);

        if (itemsSeleccionados.length === 0) {
            return window.alert("Seleccione al menos un artículo para agregar.");
        }

        const nuevosItems = [...itemsToTransfer];
        let itemsAgregados = 0;

        itemsSeleccionados.forEach(item => {
            // Usamos una combinación de cons_producto y serial para identificar la unicidad.
            const uniqueKey = `${item.cons_producto}-${item.serial || item.id}`;
            const exists = nuevosItems.some(existingItem => `${existingItem.cons_producto}-${existingItem.serial || existingItem.id}` === uniqueKey);

            if (!exists) {
                nuevosItems.push(item);
                itemsAgregados++;
            }
        });

        setItemsToTransfer(nuevosItems);

        // Limpiar la selección actual de la tabla
        setChecks(new Array(tabla.length).fill(false));
        setCheckAll(false);

        window.alert(`${itemsAgregados} artículo(s) agregado(s) a la lista de traslado. Total: ${nuevosItems.length}`);
    };

    // NUEVA FUNCIÓN: Eliminar un ítem de la lista temporal
    // FUNCIÓN: Eliminar un ítem o una lista de ítems de la lista temporal
    const removeItemFromTransfer = (itemsToRemove) => {
        // Aseguramos que 'itemsToRemove' sea siempre un array para un manejo consistente
        const listToRemove = Array.isArray(itemsToRemove) ? itemsToRemove : [itemsToRemove];

        if (listToRemove.length === 0) return;

        const confirmationText = listToRemove.length === 1
            ? `¿Está seguro de eliminar el artículo ${listToRemove[0].cons_producto} (Serial Ext: ${listToRemove[0].bag_pack || 'N/A'}) de la lista de traslado?`
            : `¿Está seguro de eliminar ${listToRemove.length} artículos de la lista de traslado?`;

        if (window.confirm(confirmationText)) {
            const uniqueKeysToRemove = new Set(listToRemove.map(item => `${item.cons_producto}-${item.serial || item.id}`));

            const updatedItems = itemsToTransfer.filter(item => {
                const itemKey = `${item.cons_producto}-${item.serial || item.id}`;
                return !uniqueKeysToRemove.has(itemKey);
            });

            setItemsToTransfer(updatedItems);
            window.alert(`${listToRemove.length} artículo(s) removido(s) de la lista. Total restante: ${updatedItems.length}`);

            // Si el modal usa un estado para la selección, este paso es crucial:
            // Dado que el modal gestiona su propio estado de selección, no necesitamos hacer nada más aquí.
        }
    };


    // --------------------------------------------------------------------------------
    // Lógica de Transferencia (Procesamiento y Ejecución - sin cambios)
    // --------------------------------------------------------------------------------

    // Agrupa los artículos seleccionados (de itemsToTransfer) y cuenta las cantidades por producto
    const getTransferData = useMemo(() => {
        return itemsToTransfer.reduce((acc, item) => {
            const destino = formRef.current?.destino.value;

            // 1. Lista de seriales a actualizar
            acc.transferencias.push({ ...item, cons_almacen: destino });

            // 2. Contador de productos (claves)
            const consProducto = item.cons_producto;
            acc.claves[consProducto] = (acc.claves[consProducto] || 0) + 1;

            return acc;
        }, { transferencias: [], claves: {} });
    }, [itemsToTransfer, formRef.current?.destino.value]);

    // Lógica de Ejecución (Sin cambios funcionales)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const form = formRef.current;
        const origen = form.origen.value;
        const destino = form.destino.value;
        const fecha = form.fecha.value;
        const semanaInput = form.semana.value;

        const { transferencias, claves } = getTransferData;

        // Validación 1: Artículos seleccionados (usando itemsToTransfer)
        if (itemsToTransfer.length === 0) {
            setLoading(false);
            return window.alert("No ha seleccionado ningún artículo para trasladar.");
        }

        // Validación 2: Origen y Destino
        if (destino === origen) {
            setLoading(false);
            return window.alert("El origen y el destino no pueden ser el mismo.");
        }

        try {
            // 1. Actualizar seriales (Cambio de almacén)
            await actualizarSeriales(transferencias);

            // 2. Obtener semana ID
            const semanaId = await uSemana(semanaInput);

            // 3. Crear el Traslado
            const trasladoData = {
                transportadora: "No aplica", conductor: "No aplica", vehiculo: "No aplica",
                origen, destino, estado: "Completado",
                fecha_salida: fecha, fecha_entrada: fecha,
                observaciones: `Precintos transferidos al almacén ${destino}`,
                semana: semanaId
            };
            const traslado = await agregarTraslado(trasladoData);
            const cons_traslado = traslado.data.consecutivo;

            // 4. Actualizar Stock e Historial (Ejecución Paralela)
            const historialPromises = Object.entries(claves).map(([cons_producto, cantidad]) => {

                const stockPromises = [
                    restar(origen, cons_producto, cantidad),
                    sumar(destino, cons_producto, cantidad)
                ];

                const dataHistorial = {
                    cons_movimiento: cons_traslado, cons_producto, cons_almacen_gestor: origen,
                    cons_almacen_receptor: destino, cons_lista_movimientos: "TR", tipo_movimiento: "Traslado", cantidad
                };
                stockPromises.push(agregarHistorial(dataHistorial));

                return Promise.all(stockPromises);
            });

            await Promise.all(historialPromises);

            // 5. Agregar Notificación
            const dataNotificacion = {
                almacen_emisor: origen, almacen_receptor: destino, cons_movimiento: cons_traslado,
                tipo_movimiento: "Traslado", descripcion: "Precintos transferidos.", aprobado: true, visto: false
            };
            await agregarNotificaciones(dataNotificacion);

            //6. Enviar correo
            const base64String = await generateTransferExcelBase64(transferencias, destino);

            try {

                const fechaEnvio = new Date().toLocaleDateString('es-ES');
                const datosCorreo = {
                    destinatario: "amaestre@banarica.com",
                    asunto: `Transferencia de Insumos - ${destino} (${fechaEnvio})`,
                    cuerpo: `
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    border: 1px solid #dddddd;
                    border-radius: 8px;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: #28a745ff; /* Color azul para el encabezado */
                    color: white;
                    padding: 10px;
                    border-radius: 5px 5px 0 0;
                    text-align: center;
                    margin: -20px -20px 20px -20px; /* Extender al borde del contenedor */
                }
                .content {
                    padding: 0 10px;
                }
                .highlight {
                    font-weight: bold;
                    color: #28a745ff;
                }
                .details-box {
                    background-color: #ffffff;
                    border: 1px solid #e0e0e0;
                    border-left: 5px solid #28a745ff; /* Línea verde de énfasis */
                    padding: 15px;
                    margin-top: 15px;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📦 Notificación de Transferencia de Insumos</h2>
                </div>
                <div class="content">
                    <p>Estimado/a destinatario/a,</p>
                    <p>Por medio del presente, se informa la transferencia de insumos realizada desde el almacén <span class="highlight">${origen}</span> hacia el almacén <span class="highlight">${destino}</span>.</p>
                    
                    <div class="details-box">
                        <p><strong>Detalles de la Transferencia:</strong></p>
                        <ul>
                            <li><strong>Origen:</strong> <span class="highlight">${origen}</span></li>
                            <li><strong>Destino:</strong> <span class="highlight">${destino}</span></li>
                            <li><strong>Fecha de Envío:</strong> <span class="highlight">${fechaEnvio}</span></li>
                        </ul>
                    </div>
                    
                    <p>El **listado detallado** de todos los insumos transferidos se adjunta a este correo en formato **Excel (.xlsx)**.</p>
                    <p>Por favor, verifique el archivo adjunto para su registro y confirmación de recepción.</p>
                    <p>Atentamente,</p>
                    <p>El equipo de Logística.</p>
                </div>
            </div>
        </body>
        </html>
    `,
                    archivo: {
                        nombre: `Transferencia_${destino.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
                        contenido: base64String, // Asumiendo que 'base64String' está definida
                        tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                };
                await enviarCorreo(datosCorreo);
            } catch (error) {
                // No bloqueamos la transferencia si el correo falla, solo alertamos.
                console.error("Error al enviar el correo de transferencia:", error);
                window.alert("Advertencia: La transferencia fue exitosa, pero hubo un error al enviar el correo con el Excel.");
            }

            // 6. Finalización y UI
            setPagination(1);
            setItemsToTransfer([]); // LIMPIAR LISTA TRAS ÉXITO
            window.alert("Transferencia realizada");
            setBool(true);
            setLoading(false);

        } catch (e) {
            console.error("Error al procesar transferencia:", e);
            setLoading(false);
            window.alert("Error en la transferencia");
        }
    };

    // --------------------------------------------------------------------------------
    // Resetear UI
    // --------------------------------------------------------------------------------

    const nuevaTranferencia = async () => {
        setBool(false);
        setItemsToTransfer([]); // Asegurar que la lista esté vacía para la nueva transferencia
        await buscarArticulos();
    };

    // --------------------------------------------------------------------------------
    // Renderizado JSX
    // --------------------------------------------------------------------------------

    return (
        <>
            {/* Loader */}
            <div>
                {loading && (
                    <div className={styles2.spinnerContainer}>
                        <PropagateLoader color="#0d6efd" />
                    </div>
                )}
            </div>

            {/* Componente Modal */}
            <TransferListModal
                show={showModal}
                onClose={() => setShowModal(false)}
                items={itemsToTransfer}
                onRemove={removeItemFromTransfer}
            />

            <form ref={formRef} onSubmit={handleSubmit}>
                <h2>Transferencias</h2>
                <div className={styles.grid_tranferencias}>
                    {/* Select Origen */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Orígen</span>
                        <select className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            onChange={onChanageBuscar}
                            id="origen"
                            name="origen"
                            disabled={bool}>
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Select Destino */}
                    <div
                        className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Destino</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="destino"
                            disabled={bool}
                            name="destino">
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Select Artículo */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Artículo</span>
                        <select
                            className="form-select form-select-sm"
                            aria-label=".form-select-sm example"
                            id="producto"
                            name="producto"
                            disabled={bool}
                            onChange={onChanageBuscar}
                        >
                            <option value={""}>All</option>
                            {productos.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Input Semana */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Semana</span>
                        <input type="number"
                            className="form-control"
                            aria-label="Sizing example input"
                            id="semana"
                            name="semana"
                            min={semanaData ? semanaData.semana_actual - semanaData.semana_previa : 0}
                            max={semanaData ? semanaData.semana_actual * 1 + semanaData.semana_siguiente : 99}
                            required
                            disabled={bool}
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    {/* Input Fecha */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Fecha</span>
                        <input type="date"
                            className="form-control"
                            aria-label="Sizing example input"
                            id="fecha"
                            name="fecha"
                            defaultValue={useDate()}
                            disabled={bool}
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    {/* Input Serial Int (Condicional) */}
                    <div className={`input-group input-group-sm ${mostrarSerial ? "" : "d-none"}`}>
                        <span className="input-group-text" id="inputGroup-sizing-sm">Serial Int</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            id="serial"
                            name="serial"
                            onChange={onChanageBuscar}
                            disabled={bool}
                            readOnly={!mostrarSerial}
                            aria-describedby="inputGroup-sizing-sm"></input>
                    </div>

                    {/* Input Serial Ext */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">Serial Ext</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            id="bag_pack"
                            onChange={onChanageBuscar}
                            disabled={bool}
                            name="bag_pack"></input>
                    </div>

                    {/* Input S Pack */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">S Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            id="s_pack"
                            onChange={onChanageBuscar}
                            disabled={bool}
                            name="s_pack"></input>
                    </div>


                    {/* Input M Pack */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">M Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            onChange={onChanageBuscar}
                            id="m_pack"
                            name="m_pack"
                            disabled={bool}></input>

                    </div>


                    {/* Input L Pack */}
                    <div className="input-group input-group-sm">
                        <span className="input-group-text" id="inputGroup-sizing-sm">L Pack</span>
                        <input type="text"
                            className="form-control"
                            aria-label="Sizing example input"
                            aria-describedby="inputGroup-sizing-sm"
                            onChange={onChanageBuscar}
                            id="l_pack"
                            name="l_pack"
                            disabled={bool}></input>
                    </div>

                </div>
                <div className="line"></div>

                <div>
                    <div className={styles.grid_result}>
                        <div className={styles.botonesTrans}>
                            <span className={styles.grid_result_child2}>
                                <input type="number" onChange={handleLimit}
                                    className="form-control form-control-sm"
                                    id="limit"
                                    name="limit"
                                    min={1}
                                    max={total}
                                    ref={limitRef}
                                    placeholder={limit}></input>
                                <span className="mb-2 mt-2">Resultados de {total}</span>
                            </span>

                            {/* CONTADOR, BOTÓN AGREGAR y NUEVO BOTÓN VER LISTA */}


                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="btn btn-warning btn-sm w-100"
                                disabled={bool}
                            >
                                Ver Lista ({itemsToTransfer.length})
                            </button>

                            <button
                                type="button"
                                onClick={agregarItem}
                                className="btn btn-primary btn-sm w-100"
                                disabled={bool || checKs.every(c => c === false)}
                            >
                                Agregar a la lista
                            </button>

                            {!bool &&
                                <button type="submit" className="btn btn-success btn-sm w-100">Realizar Transferencia</button>
                            }
                            {bool &&
                                <button type="button" onClick={nuevaTranferencia} className="btn btn-primary btn-sm w-100">Nueva Transferencia</button>
                            }
                        </div>
                    </div>

                    <span className={styles.tabla_text}>

                        <table className="table mb-4 table-striped cont_tabla">
                            <thead>
                                <tr>
                                    <th scope="row">
                                        <input className="form-check-input"
                                            type="checkbox"
                                            id="checkAll"
                                            name="checkAll"
                                            onChange={() => handleCheckAll()}
                                            checked={checkAll}
                                        ></input>
                                    </th>
                                    <th scope="col">Alm</th>
                                    <th scope="col">Artículo</th>
                                    {mostrarSerial && <th scope="col">Serial Int</th>}
                                    <th scope="col">Serial Ext</th>
                                    <th scope="col">S Pack</th>
                                    <th scope="col">M Pack</th>
                                    <th scope="col">L Pack</th>
                                    <th className={styles.display} scope="col">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tabla.map((item, index) => {
                                    return (
                                        <tr key={index}>
                                            <th scope="row">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox" id={`check-${index}`}
                                                    name={`check-${index}`}
                                                    checked={checKs[index]}
                                                    onChange={() => hadleChecks(index)}
                                                ></input>
                                            </th>
                                            <td>{item?.cons_almacen}</td>
                                            <td>{item?.cons_producto}</td>
                                            {mostrarSerial && <td>{item?.serial}</td>}
                                            <td>{item?.bag_pack}</td>
                                            <td>{item?.s_pack}</td>
                                            <td>{item?.m_pack}</td>
                                            <td>{item?.l_pack}</td>
                                            <td className={styles.display}>{item?.available == true ? "Disponible" : "Usado"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <span className="container">
                            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
                        </span>
                    </span>
                </div>
            </form>
        </>
    );
}