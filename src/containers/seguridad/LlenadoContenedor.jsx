import React, { useEffect, useState, useCallback } from 'react';
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { listarAlmacenes } from "@services/api/almacenes";
import 'bootstrap/dist/css/bootstrap.min.css';
import { listarCombos } from '@services/api/combos';
import { FaPlus, FaMinus } from 'react-icons/fa';  // Importar los íconos de más y menos
import { encontrarUnSerial, usarSeriales } from '@services/api/seguridad';
import { listarMotivoDeUso } from '@services/api/motivoDeUso';
import { listarMotivoDeRechazo } from '@services/api/motivoDeRechazo';
import { agregarRechazo } from '@services/api/rechazos';
import Loader from '@components/shared/Loader';

const FormularioDinamico = () => {
    const today = new Date().toISOString().split('T')[0];
    const monthBefore = new Date();
    const monthLater = new Date();
    monthBefore.setMonth(monthBefore.getMonth() - 1);
    monthLater.setMonth(monthLater.getMonth() + 1);
    const fechaInicial = monthBefore.toISOString().split('T')[0];
    const fechaFinal = monthLater.toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        fecha: today,
        semana: '',
        booking: '',
        contenedor: '',
        kit: '',
        termografo: ''
    });

    const [semOptions, setSemOptions] = useState([]);
    const [embarques, setEmbarques] = useState([]);
    const [embarquesObjet, setEmbarquesObject] = useState([]);
    const [contenedores, setContenedores] = useState([]);
    const [listado, setListado] = useState([]);
    const [productos, setProductos] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [sections, setSections] = useState([]); // Almacena las secciones de campos adicionales
    const [sectionsProduct, setsectionsProduct] = useState([]);
    const [almacenByUser, setAlmacenByUser] = useState([]);
    const [motivosRechazo, setMotivosRechazo] = useState([]);
    const [loading, setLoading] = useState(false);


    const fields = [
        { label: "Fecha", id: "fecha", type: "date", className: "col-md-6 mb-3", required: true },
        { label: "Semana", id: "semana", type: "text", className: "col-md-6 mb-3", datalist: semOptions, required: true },
        { label: "Booking", id: "booking", type: "text", className: "col-md-6 mb-3", datalist: embarques, required: true },
        { label: "Contenedor", id: "contenedor", type: "text", className: "col-md-6 mb-3", datalist: contenedores, required: true },
        { label: "Kit", id: "kit", type: "text", className: "col-md-6 mb-3" },
        { label: "Termógrafo", id: "termografo", type: "text", className: "col-md-6 mb-3" }
    ];

    const initial = useCallback(async () => {
        try {
            const weeks = await filtrarSemanaRangoMes(1, 1);
            const productos = await listarCombos();
            const motivos = await listarMotivoDeRechazo();
            setMotivosRechazo(motivos);
            setAlmacenByUser(JSON.parse(localStorage.getItem("almacenByUser")));
            listarAlmacenes().then(res => setAlmacenes(res));
            setProductos(productos);
            setSemOptions(weeks.map(item => item.consecutivo));
        } catch (error) {
            console.error("Error al listar semanas:", error);
        }
    }, []);

    const listarEmbarques = useCallback(async () => {
        if (!formData.semana) return;
        try {
            const embarquesList = await paginarEmbarques(1, 20, { semana: formData.semana });
            setEmbarques(embarquesList.data.map(item => item.bl));
            setEmbarquesObject(embarquesList.data);
        } catch (error) {
            console.error("Error al listar embarques:", error);
        }
    }, [formData.semana]);

    const listarContenedores = useCallback(async () => {
        try {
            const list = await paginarListado(1, 10, {
                contenedor: formData.contenedor,
                fecha_inicial: fechaInicial,
                fecha_final: fechaFinal,
                habilitado: true,
            });
            setListado(list.data);
            setContenedores(list.data.map(item => item.Contenedor.contenedor));

        } catch (error) {
            console.error("Error al listar contenedores:", error);
        }
    }, [formData.contenedor]);

    useEffect(() => { initial(); }, [initial]);
    useEffect(() => { listarEmbarques(); }, [listarEmbarques]);
    useEffect(() => { listarContenedores(); }, [listarContenedores]);

    const handleChange = (e) => {
        const { id, value } = e.target;

        setFormData(prevState => ({
            ...prevState,
            [id]: value,
            ...(id === "semana" && { booking: "", contenedor: "" }) // Si cambia "semana", reinicia estos campos
        }));
    };

    const addProduct = () => {
        setsectionsProduct(prevSections => [
            ...prevSections,
            { id: Date.now(), cod_productor: "", producto: '', totalCajas: '' }
        ]);
    };

    const removeProduct = (id) => {
        setsectionsProduct(prevSections => prevSections.filter(section => section.id !== id));
    };

    const addSection = () => {
        setSections(prevSections => [
            ...prevSections,
            { id: Date.now(), cod_productor: "", codigoPallet: '', producto: '', totalCajas: '' }
        ]);
    };

    // Eliminar una sección
    const removeSection = (id) => {
        setSections(prevSections => prevSections.filter(section => section.id !== id));
    };


    const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    setLoading(true);

    try {
        const seriales = ["kit", "termografo"];
        let serialesList = [];

        // Verificar la existencia de los seriales
        for (const item of seriales) {
            const serial = await encontrarUnSerial({
                bag_pack: formData[item],
                available: [true],
            });

            if (!serial[0]) {
                const continuar = window.confirm(`El ${item} no existe. ¿Desea continuar?`);
                if (!continuar) return;
            }

            if (formData[item] !== "") serialesList.push(formData[item]); 
        }

        // Validar la existencia de la semana en las opciones disponibles
        const constWeek = semOptions.find(semana => semana === formData.semana);
        if (!constWeek) {
            window.alert(`La semana "${formData.semana}" no existe`);
            return;
        }

        // Obtener el motivo de uso específico
        let motivo = await listarMotivoDeUso();
        motivo = motivo.find(item => item.motivo_de_uso === "Lleneado de contenedor");
        if (!motivo) {
            window.alert('El motivo "Lleneado de contenedor" no existe');
            return;
        }

        // Obtener el usuario desde localStorage
        const user = localStorage.getItem("usuario");
        const userID = user ? JSON.parse(user).id : null;
        if (!userID) {
            window.alert("usuario_id no existe");
            return;
        }

        // Buscar el ID del embarque asociado al booking
        const id_embarque = embarquesObjet.find(item => item.bl === formData.booking)?.id;
        if (!id_embarque) {
            window.alert("El booking no existe");
            return;
        }

        // Buscar el contenedor en el listado
        const itemListado = listado.filter(item => item?.Contenedor?.contenedor === formData.contenedor);
        const contenedorId = itemListado[0]?.id_contenedor;
        if (!contenedorId) {
            window.alert("El contenedor no existe");
            return;
        }

        // Filtrar los listados predeterminados
        const listadoPredeterminado = itemListado.filter(item => item.combo.nombre === "Predeterminado");

        // Procesar los productos en paralelo
        await Promise.all(sectionsProduct.map(async (element, index) => {
            const { cod_productor: id_lugar_de_llenado, producto: id_producto, totalCajas: cajas_unidades } = element;

            if (!id_lugar_de_llenado) {
                window.alert(`El almacén "${id_lugar_de_llenado}" no existe.`);
                return;
            }

            // Construcción del payload con los datos del producto
            const payload = {
                fecha: formData.fecha,
                id_embarque,
                id_contenedor: contenedorId,
                id_lugar_de_llenado,
                id_producto,
                cajas_unidades,
                habilitado: true,
            };

            // Actualizar o duplicar listado según disponibilidad
            if (listadoPredeterminado[index]) {
                await actualizarListado(listadoPredeterminado[index].id, payload);
            } else {
                const duplicado = await duplicarListado(itemListado[0].id);
                await actualizarListado(duplicado.id, payload);
            }
        }));

        // Agregar rechazos en paralelo
        await Promise.all(sections.map(async item => {
            const rechazo = {
                id_producto: item.producto,
                id_motivo_de_rechazo: item.motivo_rechazo,
                cantidad: item.totalCajas,
                serial_palet: item.codigoPallet,
                cod_productor: item.cod_productor,
                id_contenedor: contenedorId,
                id_usuario: userID,
                habilitado: false,
            };
            await agregarRechazo(rechazo);
        }));

        // Registrar el uso de seriales
        if (serialesList.length > 0) await usarSeriales(constWeek, formData.fecha, serialesList, contenedorId, userID, motivo);

    } catch (error) {
        console.error("Error en el manejo del formulario:", error);
        window.alert("Ocurrió un error al procesar la solicitud. Consulte la consola para más detalles.");
    } finally {
        // Restablecer estados siempre, sin importar si hubo un error o un return antes
        setsectionsProduct([]);
        setSections([]);
        setFormData(
            Object.keys(formData).reduce((acc, key) => {
                acc[key] = "";
                return acc;
            }, {})
        );
        setLoading(false);
    }
};



    return (
        <>
            <Loader loading={loading} />
            <form onSubmit={handleSubmit} className="container">
                <div className="mb-4 mt-3 text-center">
                    <h2>Llenado de Contenedor</h2>
                </div>
                <div className="row">
                    {fields.map(({ label, id, type, className, required, datalist }) => (
                        <div className={className} key={id}>
                            <div className="input-group">
                                <span className="input-group-text">{label}</span>
                                <input
                                    type={type}
                                    id={id}
                                    value={formData[id]}
                                    onChange={handleChange}
                                    className="form-control"
                                    required={required || false}
                                    list={datalist ? `list-${id}` : undefined}
                                />
                                {datalist && (
                                    <datalist id={`list-${id}`}>
                                        {datalist.map((option, index) => (
                                            <option key={index} value={option} />
                                        ))}
                                    </datalist>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="col-md-6 mb-3">
                        <button
                            type="button"
                            className="btn btn-primary w-100"
                            onClick={addProduct}  // Agregar nueva sección
                        >
                            <FaPlus /> Asignar Cajas
                        </button>
                    </div>


                    <div className="col-md-6 mb-3">
                        <button
                            type="button"
                            className="btn btn-warning w-100"
                            onClick={addSection}  // Agregar nueva sección
                        >
                            <FaPlus /> Agregar Rechazo
                        </button>
                    </div>

                    {sectionsProduct[0] && (<div className="line"></div>)}
                    {sectionsProduct[0] && (<h5 className="mb-3">Cajas Recibidas</h5>)}
                    {/* Secciones dinámicas */}
                    {/* Asignacion de cajas*/}

                    {sectionsProduct.map(section => (
                        <>
                            <div className="col-md-2 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Cod:</span>
                                    <select
                                        id={`cod_productor-${section.id}`}
                                        className="form-control"
                                        value={section.cod_productor}
                                        required
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setsectionsProduct(prevSections => prevSections.map(sec =>
                                                sec.id === section.id ? { ...sec, cod_productor: newValue } : sec
                                            ));
                                        }}
                                    >    <option ></option>
                                        {almacenByUser.map((item, key) => (
                                            <option key={key} value={item.id}>
                                                {item.consecutivo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-6 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Producto:</span>
                                    <select
                                        id={`producto-${section.id}`}
                                        className="form-control"
                                        value={section.producto}
                                        required
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setsectionsProduct(prevSections => prevSections.map(sec =>
                                                sec.id === section.id ? { ...sec, producto: newValue } : sec
                                            ));
                                        }}
                                    >
                                        <option ></option>
                                        {productos.map((item, key) => (
                                            <option key={key} value={item.id}>
                                                {item.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-3 mb-3">
                                <div className="row">
                                    <div className="input-group w-10">
                                        <span className="input-group-text">Cajas:</span>
                                        <input
                                            type="number"
                                            id={`totalCajas-${section.id}`}
                                            className="form-control"
                                            placeholder="00"
                                            value={section.totalCajas}
                                            required
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                setsectionsProduct(prevSections => prevSections.map(sec =>
                                                    sec.id === section.id ? { ...sec, totalCajas: newValue } : sec
                                                ));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-1 mb-3">
                                <button
                                    type="button"
                                    className="btn btn-danger w-100"
                                    onClick={() => removeProduct(section.id)}  // Eliminar la sección
                                >
                                    <FaMinus />
                                </button>
                            </div>


                        </>
                    ))}
                    {/* Rechazos*/}
                    {sections[0] && <div className="line"></div>}
                    {sections[0] && <h5 className="mb-3">Cajas Rechazadas</h5>}

                    {sections.map(section => (
                        <>
                            <div className="col-md-2 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Cod:</span>
                                    <select
                                        id={`cod_productor-${section.id}`}
                                        className="form-control"
                                        value={section.cod_productor}
                                        required
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSections(prevSections => prevSections.map(sec =>
                                                sec.id === section.id ? { ...sec, cod_productor: newValue } : sec
                                            ));
                                        }}
                                    >
                                        <option ></option>
                                        {almacenes.map((item, key) => (
                                            <option key={key} value={item.consecutivo}>
                                                {item.consecutivo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>


                            <div className="col-md-2 mb-3">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        id={`codigoPallet-${section.id}`}
                                        className="form-control"
                                        placeholder="Palet"
                                        value={section.codigoPallet}
                                        required
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSections(prevSections => prevSections.map(sec =>
                                                sec.id === section.id ? { ...sec, codigoPallet: newValue } : sec
                                            ));
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="col-md-2 mb-3">
                                <div className="input-group">
                                    <select
                                        id={`rechazo-${section.id}`}
                                        className="form-control"
                                        value={section.motivo_rechazo}
                                        required
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSections(prevSections => prevSections.map(sec =>
                                                sec.id === section.id ? { ...sec, motivo_rechazo: newValue } : sec
                                            ));
                                        }}
                                    >
                                        <option value={""}>Seleccione el motivo</option>
                                        {motivosRechazo.map((item, key) => (
                                            <option key={key} value={item.id}>
                                                {item.motivo_rechazo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-3 mb-3">
                                <div className="input-group">
                                    <select
                                        id={`producto-${section.id}`}
                                        className="form-control"
                                        value={section.producto}
                                        required
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSections(prevSections => prevSections.map(sec =>
                                                sec.id === section.id ? { ...sec, producto: newValue } : sec
                                            ));
                                        }}
                                    >
                                        <option value={""}>Seleccione el producto</option>
                                        {productos.map((item, key) => (
                                            <option key={key} value={item.id}>
                                                {item.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="col-md-2 mb-3">
                                <div className="row">
                                    <div className="input-group w-10">
                                        <span className="input-group-text">Cajas:</span>
                                        <input
                                            type="number"
                                            id={`totalCajas-${section.id}`}
                                            className="form-control"
                                            placeholder="00"
                                            value={section.totalCajas}
                                            required
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                setSections(prevSections => prevSections.map(sec =>
                                                    sec.id === section.id ? { ...sec, totalCajas: newValue } : sec
                                                ));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-1 mb-3">
                                <button
                                    type="button"
                                    className="btn btn-danger w-100"
                                    onClick={() => removeSection(section.id)}  // Eliminar la sección
                                >
                                    <FaMinus />
                                </button>
                            </div>
                        </>
                    ))}
                    {(sections[0] || sectionsProduct[0]) && <div className="line"></div>}
                </div>

                <button type="submit" className="btn btn-success w-100">Enviar</button>
            </form>
        </>
    );
};

export default FormularioDinamico;
