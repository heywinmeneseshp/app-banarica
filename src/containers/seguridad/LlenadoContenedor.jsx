import React, { useEffect, useRef, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaMinus } from 'react-icons/fa';

export default function LlenadoContenedor() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    const formRef = useRef();

    const [contenedores, setContenedores] = useState([]);
    const [product, setProduct] = useState([]);
    const [containerStated, setContainerStated] = useState(true);
    const [kitStated, setKitStated] = useState(true);
    const [sections, setSections] = useState([]);
    const [formData, setFormData] = useState({
        consecutivo: "",
        fecha: formattedDate,
        contenedor: "",
        producto: "",
        kit: "",
        numeroCajas: "",
        observaciones: ""
    });

    const generarConsecutivo = () => {
        const consecutivo = contenedores[0]?.id || `CONS-${Date.now()}`;
        setFormData(prev => ({ ...prev, consecutivo }));
    };

    const listarContenedores = async (value) => {
        const listado = [
            { id: "CONT-001", contenedor: "ABC12345678" },
            { id: "CONT-002", contenedor: "XYZ87654321" }
        ].filter(item => item.contenedor.includes(value));

        setContenedores(listado);
        setContainerStated(listado.length > 0);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === "contenedor") listarContenedores(value);
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setKitStated(true);
        if (!containerStated) return alert("El contenedor no existe");
        if (!kitStated) return alert("El kit no existe");

        console.log("Formulario enviado:", formData);
        console.log("Secciones dinámicas:", sections);
    };

    const addSection = () => {
        setSections(prev => [...prev, { id: Date.now(), codigoPallet: "", producto: "", totalCajas: "" }]);
    };

    const removeSection = (id) => {
        setSections(prev => prev.filter(section => section.id !== id));
    };

    useEffect(() => {
        setProduct([
            { id: "PROD-001", nombre: "Producto 1" },
            { id: "PROD-002", nombre: "Producto 2" }
        ]);
    }, []);

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className="container">
                <h2 className="text-center mb-4 mt-3">Llenado Contenedor</h2>
                <div className="row">
                {/* Fecha */}
                <div className="col-md-3 mb-3">
                    <div className="input-group">
                        <span className="input-group-text">Fecha:</span>
                        <input
                            type="date"
                            id="fecha"
                            className="form-control"
                            value={formData.fecha}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

           
                    {/* BoL */}
                    <div className="col-md-3 mb-3">
                        <div className="input-group">
                            <span className="input-group-text">BoL:</span>
                            <input
                                type="text"
                                id="consecutivo"
                                className="form-control"
                                readOnly
                                placeholder="BOOKING0001"
                            />
                        </div>
                    </div>
                    {/* Contenedor */}
                    <div className="col-md-6 mb-3">
                        <div className="input-group">
                            <span className="input-group-text">Contenedor:</span>
                            <input
                                type="text"
                                id="contenedor"
                                className={`form-control ${containerStated ? "" : "is-invalid"}`}
                                placeholder="DUMMY000001"
                                value={formData.contenedor}
                                onChange={handleInputChange}
                                onBlur={generarConsecutivo}
                            />
                            <datalist id="container-list">
                                {contenedores.map((item, idx) => (
                                    <option key={idx} value={item.contenedor} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    {/* Producto */}
                    <div className="col-md-6 mb-3">
                        <div className="input-group">
                            <span className="input-group-text">Producto:</span>
                            <select
                                id="producto"
                                className="form-control"
                                value={formData.producto}
                                onChange={handleInputChange}
                            >
                                <option value="">Seleccione un producto</option>
                                {product.map((item, idx) => (
                                    <option key={idx} value={item.id}>
                                        {item.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Número de Cajas */}
                    <div className="col-md-6 mb-3">
                        <div className="input-group">
                            <span className="input-group-text">Cajas:</span>
                            <input
                                type="number"
                                id="numeroCajas"
                                className="form-control"
                                placeholder="00"
                                value={formData.numeroCajas}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    {/* Kit */}
                    <div className="col-md-6 mb-3">
                        <div className="input-group">
                            <span className="input-group-text">Kit:</span>
                            <input
                                type="text"
                                id="kit"
                                className={`form-control ${kitStated ? "" : "is-invalid"}`}
                                placeholder="AA2L0000"
                                value={formData.kit}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    {/* Agregar Sección */}
                    <div className="col-md-6 mb-3">
                        <button type="button" className="btn btn-primary w-100" onClick={addSection}>
                            <FaPlus /> Agregar Rechazo
                        </button>
                    </div>
                </div>

                {sections[0] && <div className="line"></div>}

                {/* Secciones dinámicas */}
                {sections.map((section) => (
                    <>
                        <div key={section.id} className="row">
                            <div className="col-md-3 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Palet:</span>
                                    <input
                                        type="text"
                                        id={`codigoPallet-${section.id}`}
                                        className="form-control"
                                        placeholder="Palet"
                                        value={section.codigoPallet}
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
                                        value={section.producto}
                                        onChange={(e) =>
                                            setSections(prev =>
                                                prev.map(sec => (sec.id === section.id ? { ...sec, producto: e.target.value } : sec))
                                            )
                                        }
                                        className="form-control"
                                    >
                                        <option value="">Seleccione Producto</option>
                                        {product.map((item, key) => (
                                            <option key={key} value={item.id}>
                                                {item.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <div className="input-group">
                                    <span className="input-group-text">Cajas:</span>
                                    <input
                                        type="number"
                                        placeholder="00"
                                        value={section.totalCajas}
                                        onChange={(e) =>
                                            setSections(prev =>
                                                prev.map(sec => (sec.id === section.id ? { ...sec, totalCajas: e.target.value } : sec))
                                            )
                                        }
                                        className="form-control"
                                    />
                                </div>
                            </div>
                            <div className="col-md-2 mb-3">
                                <button
                                    type="button"
                                    className="btn btn-danger w-100"
                                    onClick={() => removeSection(section.id)}
                                >
                                    <FaMinus /> Quitar Rechazo
                                </button>
                            </div>

                        </div>
                        {sections[0] && <div className="line d-block d-md-none"></div>}
                    </>

                ))}

                {sections[0] && <div className="line d-none d-md-block"></div>}
                {/* Observaciones */}
                <div className="row mb-3">
                    <div className="col-md-12">
                        <textarea
                            id="observaciones"
                            className="form-control"
                            placeholder="Observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows="3"
                        ></textarea>
                    </div>
                </div>

                {/* Botón de enviar */}
                <button type="submit" className="btn btn-success w-100 mt-4">
                    Enviar
                </button>
            </div >
        </form>
    );
}
