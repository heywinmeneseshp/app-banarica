import React, { useState } from "react";
import { Button } from "react-bootstrap";
import * as XLSX from "xlsx"; // 📌 Importa xlsx para leer el archivo
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import excel from "@hooks/useExcel";
import Loader from "@components/shared/Loader";

const CargueMasivo = ({ setOpenMasivo, endPointCargueMasivo, encabezados, titulo }) => {
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
                const sheetName = workbook.SheetNames[0]; // Toma la primera hoja
                const sheet = workbook.Sheets[sheetName];
                let jsonData = XLSX.utils.sheet_to_json(sheet); // Convierte a JSON

                // Verifica si la columna "fecha" existe y si tiene valores en formato numérico
                jsonData = jsonData.map(row => {
                    // eslint-disable-next-line no-prototype-builtins
                    if (row.hasOwnProperty("fecha") && !isNaN(row.fecha)) {
                        // Convertir de formato serial de Excel a fecha YYYY-MM-DD
                        const fechaConvertida = new Date((row.fecha - 25569) * 86400 * 1000)
                            .toISOString()
                            .split('T')[0];
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

        setLoading(true);
        setProgress(10); // Simula inicio del progreso

        try {
            const response = await fetch(endPointCargueMasivo, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            setProgress(50); // Simula progreso intermedio

            const result = await response.json();
            setProgress(80); // Casi finalizado

            console.log("Respuesta del servidor:", result);
            if (result?.error) throw result?.message;

            alert("Carga exitosa");
            setOpenMasivo(false);
        } catch (error) {
            console.error("Error al enviar los datos:", error);
            alert("Error al cargar los datos. " + error);
        } finally {
            setProgress(100); // Finaliza la barra de carga
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 500);
        }
    };

    function handleDescargarPlantilla() {
        excel([encabezados], "Plantilla", `Cargue Masivo de ${titulo}`);
    }

    return (
        <>
            <Loader loading={(data.length > 0) && !loading} />
            <div className={styles2.fondo}>
                <div className={styles2.floatingform}>
                    <div className="card">
                        <div className="card-header d-flex justify-content-between">
                            <span className="fw-bold">Cargar Archivo Excel</span>
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
                                                plantilla aquí
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

                                {/* 🔹 Barra de Progreso */}
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
