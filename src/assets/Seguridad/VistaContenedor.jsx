import React, { useEffect, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { filtrarProductos } from "@services/api/productos";
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

function VistaContenedor({ vistaCont, setVistaCont }) {
    const [items, setItems] = useState([]);
    const [serialChecks, setSerialChecks] = useState({});
    const [massApproveActive, setMassApproveActive] = useState({});

    useEffect(() => {
        if (vistaCont?.serial_de_articulos?.length) {
            filtrarProductosAsync();
        }
    }, [vistaCont]);

    const filtrarProductosAsync = async () => {
        try {
            const consecutivos = vistaCont.serial_de_articulos.map(item => item.cons_producto);
            const productos = await filtrarProductos({ producto: { consecutivo: consecutivos } });
            setItems(productos);

            // Inicializa el estado de serialChecks y massApproveActive
            const initialChecks = {};
            const initialMassApprove = {};
            productos.forEach(producto => {
                vistaCont.serial_de_articulos
                    .filter(articulo => articulo.cons_producto === producto.consecutivo)
                    .forEach(articulo => {
                        initialChecks[articulo.serial] = false; // Por defecto, no verificado
                    });
                initialMassApprove[producto.consecutivo] = false; // Inicia como no activado
            });
            setSerialChecks(initialChecks);
            setMassApproveActive(initialMassApprove);
        } catch (error) {
            console.error("Error al filtrar productos:", error);
        }
    };

    const handleCheck = (serial) => {
        setSerialChecks(prev => ({
            ...prev,
            [serial]: !prev[serial], // Cambia el estado actual
        }));
    };

    const handleMassApproveToggle = (consecutivo) => {
        const newMassApproveState = !massApproveActive[consecutivo];
        setMassApproveActive(prev => ({
            ...prev,
            [consecutivo]: newMassApproveState,
        }));

        // Si se activa el aprobar masivo, aprueba todos los seriales
        const updatedSerialChecks = { ...serialChecks };
        vistaCont.serial_de_articulos
            .filter(articulo => articulo.cons_producto === consecutivo)
            .forEach(articulo => {
                updatedSerialChecks[articulo.serial] = newMassApproveState; // Marca como aprobado o desaprobado masivamente
            });
        setSerialChecks(updatedSerialChecks);
    };

    const handleConfirm = () => {
        const confirmedSerials = Object.keys(serialChecks).map(serial => ({
            serial: serial,
            isChecked: serialChecks[serial] // Enviar también el valor booleano
        }));
        const contenedorData = {
            contenedor: vistaCont?.Contenedor?.contenedor,
            serials: confirmedSerials
        };
        console.log("Datos confirmados:", contenedorData);
        setVistaCont(null);
        // Aquí podrías enviar los datos a la API o procesarlos según sea necesario.
    };

    return (
        <div className={styles.fondo}>
            <div className={styles.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Contenedor: {vistaCont?.Contenedor?.contenedor}</span>
                        <button
                            type="button"
                            onClick={() => setVistaCont(null)}
                            className="btn-close"
                            aria-label="Close"
                        />
                    </div>
                    <div className="card-body">
                        <div className="container">
                            <div className="row">
                                {items.map((item, key) => {
                                    const seriales = vistaCont.serial_de_articulos.filter(
                                        articulo => articulo.cons_producto === item.consecutivo
                                    );

                                    return (
                                        <div key={key} className="col-12 mb-3">
                                            <div className="p-3 border rounded shadow-sm">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h5 className="text-center mb-2" style={{ fontSize: '1.1rem' }}>{item.name}</h5>
                                                    <div className="d-flex">
                                                        <button
                                                            onClick={() => handleMassApproveToggle(item.consecutivo)}
                                                            className="btn p-0"
                                                            aria-label={massApproveActive[item.consecutivo] ? "Desaprobar todos" : "Aprobar todos"}
                                                            style={{ fontSize: '1.5rem' }}
                                                        >
                                                            {massApproveActive[item.consecutivo] ? (
                                                                <BsCheckCircle  size={24} />
                                                            ) : (
                                                                <BsXCircle size={24} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <ul className="list-unstyled m-0">
                                                    {seriales.map((articulo) => {
                                                        const isoDate = articulo.fecha_de_uso;
                                                        const formattedDate = isoDate.split("T")[0];

                                                        return (
                                                            <li
                                                                key={articulo.serial}
                                                                className="d-flex justify-content-between align-items-center py-2 mb-1 border-bottom"
                                                            >
                                                                <div>
                                                                    <div className="text-muted">Fecha: {formattedDate}</div>
                                                                    <div className="text-muted">Serial: {articulo.serial}</div>
                                                                </div>
                                                                <div className="d-flex align-items-center">
                                                                    <button
                                                                        className="btn p-0"
                                                                        onClick={() => handleCheck(articulo.serial)}
                                                                    >
                                                                        {serialChecks[articulo.serial] ? (
                                                                            <BsCheckCircle className="text-success" size={24} />
                                                                        ) : (
                                                                            <BsXCircle className="text-danger" size={24} />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="card-footer text-center">
                        <button
                            onClick={handleConfirm}
                            className="btn btn-primary"
                            style={{
                                fontSize: '1.2rem',
                                padding: '10px 25px',
                                borderRadius: '25px',
                                backgroundColor: '#007bff', 
                                borderColor: '#007bff',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VistaContenedor;

