import React, { useEffect, useRef, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { encontrarModulo } from "@services/api/configuracion";
import { listarCombos } from "@services/api/combos";
import { paginarListado } from "@services/api/listado";
import { encontrarUnSerial, inspeccionAntinarcoticos } from "@services/api/seguridad";
import { FaPlus, FaMinus } from 'react-icons/fa';  // Importar los íconos de más y menos

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
        const semana = listado.data.filter(item => item?.Contenedor?.contenedor == filteredResult[0].contenedor )[0]?.Embarque?.semana?.consecutivo;
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
        // Verificar si la bolsa existe
        const kit = await encontrarUnSerial({
            bag_pack: formData.bolsa,
            available: [true],
        });
        if (kit.length === 0 ) {
            setBolsaStated(false);
            return window.alert('La Bolsa no existe');
        }

        if (!containerStated) return window.alert('El Contenedor no existe');
        setBolsaStated(true);
        // Imprimir todos los datos en la consola
        console.log('Formulario:', formData);
    
        // Imprimir las secciones dinámicas
        sections.forEach((section, index) => {
            console.log(`Sección ${index + 1}:`, section);
        });

        console.log(sections);

        await inspeccionAntinarcoticos({...formData, semana: consSemana},sections );
    
        // Si quieres hacer algo más, como enviar los datos a un servidor, lo puedes hacer aquí.
    };

    // Agregar una nueva sección
    const addSection = () => {
        setSections(prevSections => [
            ...prevSections,
            { id: Date.now(), IBM: '', codigoPallet: '', producto: '', totalCajas: '' }
        ]);
    };

    // Eliminar una sección
    const removeSection = (id) => {
        setSections(prevSections => prevSections.filter(section => section.id !== id));
    };

    useEffect(() => {
        encontrarModulo("Semana").then(res => console.log(res[0]));
        listarCombos().then(res => setProduct(res));
    }, []);

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="container">
                <div className="mb-4 mt-3 text-center">
                    <h2>Ingreso de Datos</h2>
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
                                    placeholder="Contenedor"
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
                                <span className="input-group-text">Bolsa:</span>
                                <input
                                    type="text"
                                    id="bolsa"
                                    name="bolsa"
                                    className={`form-control ${bolsaStated ? "" : "is-invalid"}`}
                                    placeholder="Bolsa"
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
                                className="btn btn-outline-primary w-100"
                                onClick={addSection}  // Agregar nueva sección
                            >
                                <FaPlus /> Agregar Rechazo
                            </button>
                        </div>

                        {/* Secciones dinámicas */}
                        {sections.map(section => (
                            <>
                                <div className="col-md-6 mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text">IBM:</span>
                                        <input
                                            type="text"
                                            id={`IBM-${section.id}`}
                                            className="form-control"
                                            placeholder="000"
                                            value={section.IBM}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                setSections(prevSections => prevSections.map(sec =>
                                                    sec.id === section.id ? { ...sec, IBM: newValue } : sec
                                                ));
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text">Palet:</span>
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
                                                setSections(prevSections => prevSections.map(sec =>
                                                    sec.id === section.id ? { ...sec, producto: newValue } : sec
                                                ));
                                            }}
                                        >
                                            <option value="">Seleccione un producto</option>
                                            {product.map((item, key) => (
                                                <option key={key} value={item.id}>
                                                    {item.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <div className="row">
                                        <div className="input-group w-50">
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
                                        <div className="input-group w-50">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger"
                                                onClick={() => removeSection(section.id)}  // Eliminar la sección
                                            >
                                                <FaMinus /> Quitar Rechazo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="line"></div>
                            </>
                        ))}

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
    );
}
