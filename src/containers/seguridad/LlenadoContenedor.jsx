import React, { useEffect, useState, useCallback } from 'react';
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarListado, crearListado, duplicarListado, paginarListado } from '@services/api/listado';
import { listarAlmacenes } from "@services/api/almacenes";
import 'bootstrap/dist/css/bootstrap.min.css';
import { listarCombos } from '@services/api/combos';
import { FaPlus, FaMinus } from 'react-icons/fa';  // Importar los íconos de más y menos
import { encontrarUnSerial, usarSeriales } from '@services/api/seguridad';
import { consultarGalonesPorRuta } from '@services/api/rutas';

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
        e.preventDefault();

        try {
            let serialesList = [];
            const seriales = ["kit", "termografo"];
            for (const item of seriales) {
                const serial = await encontrarUnSerial({
                    bag_pack: formData[item],
                    available: [true],
                });
                if (!serial[0]) return window.alert(`El ${item} no existe`);
              serialesList = [...serialesList, ...serial];
            }
            console.log(serialesList);
      

            const id_embarque = embarquesObjet.find(item => item.bl === formData.booking)?.id;

            const itemListado = listado.filter(item => item?.Contenedor?.contenedor === formData.contenedor);
            const contenedorId = itemListado[0]?.id_contenedor;
            if (!contenedorId) return window.alert("El contenedor no existe");
            if (!id_embarque) return window.alert("El booking no existe");
            const listadoPredeterminado = itemListado.filter(item => item.combo.nombre === "Predeterminado");
            await Promise.all(sectionsProduct.map(async (element, index) => {
                const { cod_productor: id_lugar_de_llenado, producto: id_producto, totalCajas: cajas_unidades } = element;
                if (!id_lugar_de_llenado) return window.alert(`El almacen "${id_lugar_de_llenado}" no existe.`);

                const payload = {
                    fecha: formData.fecha,
                    id_embarque,
                    id_contenedor: contenedorId,
                    id_lugar_de_llenado,
                    id_producto,
                    cajas_unidades,
                    habilitado: true,
                };

                //CREAR

                if (listadoPredeterminado[index]) {
                    await actualizarListado(listadoPredeterminado[index].id, payload);
                } else {
                    const duplicado = await duplicarListado(itemListado[0].id);
                    await actualizarListado(duplicado.id, payload);
                }
                usarSeriales()
                const res = await usarSeriales(semana, fecha, seriales, contenedorID, usuarioID, motivo);
            }));

            console.log("Datos a enviar:", JSON.stringify({ formData, sectionsProduct, sections }, null, 2));
        } catch (error) {
            console.error("Error en el manejo del formulario:", error);
        }
    };


    return (
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

                {sectionsProduct[0] && <div className="line"></div>}
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
                                    <span className="input-group-text">Cajas recibidas:</span>
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

                        {sections[0] && <div className="line d-block d-md-none"></div>}
                    </>
                ))}
                {/* Rechazos*/}
                {sections[0] && <div className="line"></div>}
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
                                >    <option ></option>
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
                                <span className="input-group-text">Serial:</span>
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

                        <div className="col-md-4 mb-3">
                            <div className="input-group">
                                <span className="input-group-text">Producto:</span>
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
                                    <span className="input-group-text">Cajas rechazadas:</span>
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

                        {sections[0] && <div className="line d-block d-md-none"></div>}
                    </>
                ))}
                {(sections[0] || sectionsProduct[0]) && <div className="line"></div>}
            </div>

            <button type="submit" className="btn btn-success w-100">Enviar</button>
        </form>
    );
};

export default FormularioDinamico;
