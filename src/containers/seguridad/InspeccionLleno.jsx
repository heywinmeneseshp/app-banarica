import React, { useEffect, useRef, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { encontrarModulo } from "@services/api/configuracion";
import { listarCombos } from "@services/api/combos";
import { paginarListado } from "@services/api/listado";
import { encontrarUnSerial, inspeccionAntinarcoticos } from "@services/api/seguridad";
import { FaPlus, FaMinus } from 'react-icons/fa';  // Importar los íconos de más y menos
import Loader from "@components/shared/Loader";
import { listarAlmacenes } from "@services/api/almacenes";

export default function InspeccionLLeno() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    today.setMonth(today.getMonth() - 1);
    const monthBefore = today.toISOString().split('T')[0];
    today.setMonth(today.getMonth() + 2);
    const monthLater = today.toISOString().split('T')[0];
    const formRef = useRef();
    const [product, setProduct] = useState([]);
    const [contenedores, setContenedores] = useState([]);
    const [bolsaStated, setBolsaStated] = useState(true);
    const [containerStated, setConstainerStated] = useState(true);
    const [consSemana, setConsSemana] = useState(null);
    const [loading, setLoading] = useState(false);
    const [almacenes, setAlmacenes] = useState([]);

    const [formData, setFormData] = useState({
        consecutivo: "", // Campo para el consecutivo único
        fecha: formattedDate,
        contenedor: '',
        bolsa: '',
        observaciones: ''
    });

    // Estado para las secciones dinámicas
    const [sections, setSections] = useState([]); // Almacena las secciones de campos adicionales

    // Función para generar un consecutivo único
    const generarConsecutivo = () => {
        // Podrías usar cualquier formato para el consecutivo. Aquí estamos usando la fecha y un número aleatorio
        const consecutivo = contenedores[0]?.id;
        console.log(contenedores);
        setFormData(prevData => ({ ...prevData, consecutivo }));
    };


    const listarContenedores = async (value) => {
        const object = {
            contenedor: value,
            booking: '',
            bl: '',
            destino: '',
            naviera: '',
            cliente: '',
            semana: '',
            buque: '',
            fecha_inicial: monthBefore,
            fecha_final: monthLater,
            llenado: '',
            producto: '',
            habilitado: true,
        };
        const listado = await paginarListado(1, 10, object);
        const result = listado.data.map(item => item?.Contenedor);
        const filteredResult = result.filter(item => item != null);
        const semana = listado.data.filter(item => item?.Contenedor?.contenedor == filteredResult[0].contenedor)[0]?.Embarque?.semana?.consecutivo;
        setConsSemana(semana);
        const uniqueResult = [...new Set(filteredResult)];
        setContenedores(uniqueResult);
        uniqueResult[0] ? setConstainerStated(true) : setConstainerStated(false);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        console.log(id, value); // Imprime el id y el valor en consola
        if (id === "contenedor") {
            listarContenedores(value);
        };
        setFormData(prevData => ({ ...prevData, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Verificar si la bolsa existe
        const kit = await encontrarUnSerial({
            bag_pack: formData.bolsa,
            available: [true],
        });
        if (kit.length === 0) {
            setBolsaStated(false);
            setLoading(false);
            return window.alert('La Bolsa no existe');
        }
        setLoading(true);
        setBolsaStated(true);
        if (!containerStated) {
            setLoading(false);
            return window.alert('El Contenedor no existe');
        }

        // Imprimir todos los datos en la consola

        // Imprimir las secciones dinámicas
        sections.forEach((section, index) => {
            console.log(`Sección ${index + 1}:`, section);
        });

        console.log(sections);
        const usuario = JSON.parse(localStorage.getItem("usuario"));
        await inspeccionAntinarcoticos({ ...formData, semana: consSemana, id_usuario: usuario.id }, sections);

        setFormData({
            consecutivo: "", // Campo para el consecutivo único
            fecha: formattedDate,
            contenedor: '',
            bolsa: '',
            observaciones: ''
        });
        setSections([]);
        window.alert("Datos cargados con exito");
        setLoading(false);
    };

    // Agregar una nueva sección
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

    useEffect(() => {
        encontrarModulo("Semana").then(res => console.log(res[0]));
        listarCombos().then(res => setProduct(res));
        listarAlmacenes().then(res => setAlmacenes(res));
    }, []);

    return (
        <>
            <Loader loading={loading} />

            <form ref={formRef} onSubmit={handleSubmit}>
                <div className="container">
                    <div className="mb-4 mt-3 text-center">
                        <h2>Inspeccion Lleno</h2>
                    </div>

                    <div className="container">
                        <div className="row">
                            {/* Primera columna */}
                            <div className="col-sm-6 col-md-3 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Cons:</span>
                                    <input
                                        type="text"
                                        id="consecutivo"
                                        className="form-control"
                                        placeholder="Consecutivo"
                                        value={formData.consecutivo}
                                        readOnly // El campo es solo lectura
                                    />
                                </div>
                            </div>

                            <div className="col-sm-6 col-md-3 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Fecha:</span>
                                    <input
                                        type="date"
                                        id="fecha"
                                        className="form-control"
                                        placeholder={formData.fecha}
                                        defaultValue={formData.fecha}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-md-6 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Contenedor:</span>
                                    <input
                                        type="text"
                                        id="contenedor"
                                        maxLength="11"
                                        minLength={11}
                                        list="container-list"
                                        className={`form-control ${containerStated ? "" : "is-invalid"}`}
                                        placeholder="DUMMY000001"
                                        value={formData.contenedor}
                                        onChange={handleInputChange}
                                        required
                                        onBlur={generarConsecutivo}
                                    />
                                    {/* Datalist con opciones dinámicas */}
                                    <datalist id="container-list">
                                        {contenedores.map((item, index) => (
                                            <option key={index} value={item?.contenedor} />
                                        ))}
                                    </datalist>
                                </div>
                            </div>

                            {/* Otras entradas */}
                            <div className="col-md-6 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Kit:</span>
                                    <input
                                        type="text"
                                        id="bolsa"
                                        name="bolsa"
                                        className={`form-control ${bolsaStated ? "" : "is-invalid"}`}
                                        placeholder="AA2L0000"
                                        onChange={handleInputChange}
                                        value={formData.bolsa}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Botones "+" y "-" para mostrar/ocultar campos */}
                            <div className="col-md-6 mb-3">
                                <button
                                    type="button"
                                    className="btn btn-primary w-100"
                                    onClick={addSection}  // Agregar nueva sección
                                >
                                    <FaPlus /> Agregar Rechazo
                                </button>
                            </div>
                            {sections[0] && <div className="line"></div>}
                            {/* Secciones dinámicas */}
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


                                    <div className="col-md-3 mb-3">
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
                                                {product.map((item, key) => (
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

                                    {sections[0] && <div className="line d-block d-md-none"></div>}
                                </>
                            ))}
                            {sections[0] && <div className="line d-none d-md-block"></div>}
                            {/* Observaciones ocupa una fila completa */}
                            <div className="col-md-12 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Observaciones:</span>
                                    <textarea
                                        id="observaciones"
                                        className="form-control"
                                        placeholder="Escriba sus observaciones"
                                        onChange={handleInputChange}
                                        value={formData.observaciones}
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12 mb-2">
                            <button type="submit" className="btn btn-success w-100">Guardar</button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
