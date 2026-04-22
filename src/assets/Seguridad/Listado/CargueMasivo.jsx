import React, { useState } from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx";
import axios from "axios";
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import excel from "@hooks/useExcel";
import Loader from "@components/shared/Loader";
import { getToken } from "utils/session";

const CargueMasivo = ({
    setOpenMasivo,
    endPointCargueMasivo,
    encabezados,
    titulo,
    authRequired = false,
    onSuccess
}) => {
    const [archivo, setArchivo] = useState(null);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleArchivoChange = (event) => {
        const file = event.target.files[0];
        setArchivo(file);

        if (file) {
            const reader = new FileReader();
            reader.readAsBinaryString(file);

            reader.onload = (e) => {
                const binaryStr = e.target.result;
                const workbook = XLSX.read(binaryStr, { type: "binary" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                let jsonData = XLSX.utils.sheet_to_json(sheet);

                jsonData = jsonData.map((row) => {
                    if (Object.prototype.hasOwnProperty.call(row, "fecha") && !Number.isNaN(Number(row.fecha))) {
                        const fechaConvertida = new Date((row.fecha - 25569) * 86400 * 1000)
                            .toISOString()
                            .split("T")[0];
                        row.fecha = fechaConvertida;
                    }
                    return row;
                });

                setData(jsonData);
            };

            reader.onerror = (error) => {
                console.error("Error al leer el archivo: ", error);
            };
        }
    };

    const handleCargar = async () => {
        if (!archivo) {
            alert("Por favor selecciona un archivo antes de cargar.");
            return;
        }

        if (data.length === 0) {
            alert("No hay datos para cargar. Verifica el archivo.");
            return;
        }

        setLoading(true);
        setProgress(10);

        try {
            const requestConfig = {
                headers: {
                    "Content-Type": "application/json"
                }
            };

            if (authRequired) {
                const token = getToken();
                if (!token) {
                    throw new Error("No se encontro sesion activa para realizar este cargue.");
                }

                requestConfig.headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post(endPointCargueMasivo, data, requestConfig);
            const result = response?.data || {};

            setProgress(80);

            if (result?.error) {
                throw new Error(result.message || "Error en el procesamiento de los datos");
            }

            if (result?.results?.some((item) => item.error)) {
                const errores = result.results.filter((item) => item.error);
                const mensajeErrores = errores.map((err) => {
                    const referencia = [
                        err.fila ? `Fila ${err.fila}` : null,
                        err.fecha ? `Fecha: ${err.fecha}` : null,
                        err.contenedor ? `Contenedor: ${err.contenedor}` : null
                    ]
                        .filter(Boolean)
                        .join(", ");

                    return `${referencia || "Registro"} - ${err.message}`;
                }).join("\n");

                alert(`Carga parcialmente exitosa. Errores encontrados:\n${mensajeErrores}`);
            } else {
                alert(result?.message || "Carga exitosa");
                setOpenMasivo(false);
                if (typeof onSuccess === "function") {
                    onSuccess(result);
                }
            }
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            alert("Error al cargar los datos: " + (error?.response?.data?.message || error.message));
        } finally {
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 500);
        }
    };

    const handleDescargarPlantilla = () => {
        excel([encabezados], "Plantilla", `Cargue Masivo de ${titulo}`);
    };

    return (
        <>
            <Loader loading={(data.length > 0) && !loading} />
            <div className={styles2.fondo}>
                <div className={styles2.floatingform}>
                    <div className="card">
                        <div className="card-header d-flex justify-content-between">
                            <span>
                                <span className="fw-bold me-2">Cargar Archivo Excel</span>
                                {titulo && (
                                    <span>
                                        <span className="fw-bold me-2">|</span>
                                        <span>{titulo}</span>
                                    </span>
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => setOpenMasivo(false)}
                                className="btn-close"
                                aria-label="Close"
                            />
                        </div>
                        <div className="card-body">
                            <div className="container">
                                <div className="row mb-1">
                                    <div className="col-12">
                                        <p className="text-muted">
                                            Para garantizar que el archivo cargado cumpla con el formato requerido, puedes descargar la{" "}
                                            <button
                                                className="btn btn-link p-0 m-0 align-baseline text-primary fw-bold"
                                                style={{ textDecoration: "none" }}
                                                onClick={handleDescargarPlantilla}
                                            >
                                                plantilla aqui
                                            </button>.
                                        </p>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <span className="form-label fw-bold">Selecciona un archivo:</span>
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            className="form-control"
                                            onChange={handleArchivoChange}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="col-12 d-flex justify-content-between">
                                        <Button
                                            className="w-50 me-2"
                                            variant="secondary"
                                            onClick={() => setOpenMasivo(false)}
                                            disabled={loading}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button className="w-50" variant="primary" onClick={handleCargar} disabled={loading}>
                                            {loading ? "Cargando..." : "Cargar"}
                                        </Button>
                                    </div>
                                </div>

                                {loading && (
                                    <div className="mt-3 text-center">
                                        <progress value={progress} max="100" style={{ width: "80%" }}></progress>
                                        <p className="text-primary mt-2">Cargando... {progress}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CargueMasivo;
