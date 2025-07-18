import React, { useEffect, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { filtrarProductos } from "@services/api/productos";
import { BsCheckCircle, BsXCircle } from "react-icons/bs";
import { enviarEmail } from "@services/api/email";
import { useAuth } from "@hooks/useAuth";
import Loader from "@components/shared/Loader";
import { actualizarSerial } from "@services/api/seguridad";


function VistaContenedor({ vistaCont, setVistaCont, correos, configProducts }) {
    const { getUser } = useAuth();
    const [items, setItems] = useState([]);
    const [serialChecks, setSerialChecks] = useState({});
    const [massApproveActive, setMassApproveActive] = useState({});
    const [loading, setLoading] = useState(false);
    const [serialesSinRevision, setSerialesSinRevision] = useState([]);
    const user = getUser();


    useEffect(() => {
        if (vistaCont?.serial_de_articulos?.length) {
            filtrarProductosAsync();
        }
        console.log(correos);
    }, [loading]);

    const filtrarProductosAsync = async () => {
        try {
            const usuario = user;
            let sinRevisar = usuario.id_rol === "Super administrador" ? vistaCont.serial_de_articulos : vistaCont.serial_de_articulos.filter(item => (item.revisado == false) && configProducts.includes(item.cons_producto));
            sinRevisar = sinRevisar.filter(item => configProducts.includes(item.cons_producto) == true);
            setSerialesSinRevision(sinRevisar);
            const consecutivos = sinRevisar.map(item => item.cons_producto);
            const productos = await filtrarProductos({ producto: { consecutivo: consecutivos } });
            setItems(productos);

            const initialChecks = {};
            const initialMassApprove = {};
            productos.forEach(({ consecutivo }) => {
                const seriales = vistaCont.serial_de_articulos.filter(articulo => articulo.cons_producto === consecutivo);
                seriales.forEach(({ serial }) => initialChecks[serial] = false);
                initialMassApprove[consecutivo] = false;
            });
            setSerialChecks(initialChecks);
            setMassApproveActive(initialMassApprove);
        } catch (error) {
            console.error("Error al filtrar productos:", error);
        }
    };

    const handleCheck = serial => {
     
        setSerialChecks(prev => ({ ...prev, [serial]: !prev[serial] }));
    };

    const handleMassApproveToggle = consecutivo => {
        setMassApproveActive(prev => {
            const newState = !prev[consecutivo];
            const updatedSerialChecks = { ...serialChecks };

            vistaCont.serial_de_articulos
                .filter(articulo => articulo.cons_producto === consecutivo)
                .forEach(({ serial }) => {
                    updatedSerialChecks[serial] = newState;
                });

            setSerialChecks(updatedSerialChecks);
            return { ...prev, [consecutivo]: newState };
        });
    };

    const handleConfirm = async () => {
        setLoading(true);

        const getConfirmedSerials = () => {
            return Object.entries(serialChecks)
                .filter(([, isChecked]) => !isChecked)
                .map(([serial]) => {
                    const articulo = vistaCont.serial_de_articulos.find(item => item.serial === serial);
                    const producto = articulo && items.find(element => element.consecutivo === articulo.cons_producto);
                    if (!producto) return null;

                    const serialReal = window.prompt(`Por favor, ingresa el serial correcto del artículo ${producto.name}:`);
                    return { serial, producto: producto.name, serialReal };
                })
                .filter(Boolean);
        };

        const confirmedSerials = getConfirmedSerials();

        if (confirmedSerials.length === 0) {
            for (const item of serialesSinRevision) {
                await actualizarSerial({ ...item, revisado: true });
            }
            const serials = vistaCont.serial_de_articulos.map(item => {
                return { ...item, revisado: true };
            });
            vistaCont.serial_de_articulos = serials;
            setLoading(false);
            setVistaCont(null);
            return;
        }

        const generarFechaFormateada = (fechaISO) => {
            const fecha = new Date(fechaISO);
            const dia = String(fecha.getUTCDate()).padStart(2, "0");
            const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
            const año = fecha.getUTCFullYear();
            return `${dia}-${mes}-${año}`;
        };

        const generarTablaHTML = (serials) => {
            return `
        <table style="width: 60%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
            <thead>
                <tr style="background-color: #f8f9fa; text-align: left; border-bottom: 2px solid #ddd;">
                    <th style="padding: 6px; border: 1px solid #ddd;">Artículo</th>
                    <th style="padding: 6px; border: 1px solid #ddd; color: red;">Serial Registrado</th>
                    <th style="padding: 6px; border: 1px solid #ddd; color: green;">Serial Recibido</th>
                </tr>
            </thead>
            <tbody>
                ${serials.map(item => `
                    <tr>
                        <td style="padding: 6px; border: 1px solid #ddd;">${item.producto}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; color: red; font-weight: bold;">${item.serial}</td>
                        <td style="padding: 6px; border: 1px solid #ddd; color: green; font-weight: bold;">${item.serialReal}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>`;
        };

        const contenedor = vistaCont?.Contenedor?.contenedor;
        const fechaFormateada = generarFechaFormateada(vistaCont?.fecha);
        const tablaHTML = generarTablaHTML(confirmedSerials);

        const cuerpo = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #d9534f;">⚠️ ALERTA: Inconsistencias en unidad ${contenedor}</h2>
            <p><b>📅 Fecha:</b> ${fechaFormateada}</p>
            <p><b>📌 Observaciones:</b> Se han detectado diferencias en los siguientes seriales:</p>
            ${tablaHTML}
            <p style="margin-top: 20px; color: #555;"><i>Por favor, revisar y tomar las acciones necesarias.</i></p>
        </div>
    `;
       console.log(correos, "hhhhhh");
        await enviarEmail(
            correos,
            `Alerta: Inconsistencias en unidad ${contenedor} - ${fechaFormateada}`,
            cuerpo
        );

        for (const item of serialesSinRevision) {
            await actualizarSerial({ ...item, revisado: true });
        }
        const serials = vistaCont.serial_de_articulos.map(item => {
            return { ...item, revisado: true };
        });
        vistaCont.serial_de_articulos = serials;
        setLoading(false);
        setVistaCont(null);
    };




    return (
        <div className={styles.fondo}>
            <div className={styles.floatingform}>
                <div className="card">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <span className="fw-bold">Contenedor: {vistaCont?.Contenedor?.contenedor}</span>
                        <button type="button" onClick={() => setVistaCont(null)} className="btn-close" aria-label="Close" />
                    </div>
                    <div className="card-body">
                        <div className="container">
                            <Loader loading={loading} />
                            <div className="row">
                                {items.map(({ consecutivo, name }) => (
                                    <div key={consecutivo} className="col-12 mb-3">
                                        <div className="p-3 border rounded shadow-sm">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h5 className="text-center mb-2" style={{ fontSize: '1.1rem' }}>{name}</h5>
                                                <button onClick={() => handleMassApproveToggle(consecutivo)} className="btn p-0">
                                                    {massApproveActive[consecutivo] ? <BsCheckCircle size={24} /> : <BsXCircle size={24} />}
                                                </button>
                                            </div>
                                            <ul className="list-unstyled m-0">
                                                {vistaCont.serial_de_articulos.filter(({ cons_producto }) => cons_producto === consecutivo)
                                                    .map(({ serial, fecha_de_uso }) => (
                                                        <li key={serial} className="d-flex justify-content-between align-items-center py-2 mb-1 border-bottom">
                                                            <div>
                                                                <div className="text-muted">Fecha: {fecha_de_uso.split("T")[0]}</div>
                                                                <div className="text-muted">Serial: {serial}</div>
                                                            </div>
                                                            <button className="btn p-0" onClick={() => handleCheck(serial)}>
                                                                {serialChecks[serial] ? <BsCheckCircle className="text-success" size={24} /> : <BsXCircle className="text-danger" size={24} />}
                                                            </button>
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="card-footer text-center">
                        <button onClick={handleConfirm} className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '10px 25px', borderRadius: '25px' }}>
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VistaContenedor;
