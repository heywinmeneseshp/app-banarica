/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef } from "react";
import * as XLSX from "xlsx"; // 📌 Importa xlsx para leer el archivo
import { InputGroup, Form } from "react-bootstrap";

import uDate from "@hooks/useDate";
import { useAuth } from "@hooks/useAuth";
import { cargarSeriales, listarProductosSeguridad } from "@services/api/seguridad";
import file from "@hooks/useFile";
import excel from "@hooks/useExcel";
import Alertas from "@assets/Alertas";
import useAlert from "@hooks/useAlert";
import uSemana from "@hooks/useSemana";
import styles from "@styles/Seguridad.module.css";

export default function Recepcion() {
    const almacenRef = useRef();
    const articuloRef = useRef();
    const formRef = useRef();
    
    const [archivoExcel, setArchivoExcel] = useState([]);
    const [tabla, setTabla] = useState([]);
    const [productos, setProductos] = useState([]);
    const [limit, setLimit] = useState(5);
    const [archivoBruto, setArchivoBruto] = useState(null);
    const [almacenByUser, setAlmacenByUser] = useState([]);
    const [bool, setBool] = useState(false);
    const [nuevo, setNuevo] = useState(true);
    
    const { alert, setAlert, toogleAlert } = useAlert();
    const { user } = useAuth();

    useEffect(() => {
        listarProductosSeguridad().then(res => {
            setProductos(res.filter(item => item.serial));
        });
        setAlmacenByUser(JSON.parse(localStorage.getItem("almacenByUser")) || []);
    }, []);

    const subirExcel = (e) => {
        const archivo = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            
            setArchivoBruto(rows);
            const response = file().ordenarExcelSerial(rows, almacenRef.current.value, articuloRef.current.value);
            setArchivoExcel(response);
            setTabla(response.slice(0, limit));
        };
        reader.readAsArrayBuffer(archivo);
    };

    const previsualizar = () => {
        if (archivoExcel.length) {
            const response = file().ordenarExcelSerial(["0"].concat(archivoBruto), almacenRef.current.value, articuloRef.current.value);
            setArchivoExcel(response);
            setTabla(response.slice(0, limit));
        }
    };

    const descargarPlantilla = () => {
        const data = [{
            "Consecutivo artículo": null,
            "Serial artículo": null,
            "Serial bag pack": null,
            "Serial s_pack": null,
            "Serial m_pack": null,
            "Serial l_pack": null,
        }];
        excel(data, "Plantilla", "Plantilla seriales");
    };

    const limitPaginacion = (e) => {
        setLimit(e.target.value);
        setTabla(archivoExcel.slice(0, e.target.value));
    };

    const cargarDatos = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(formRef.current);
            const remision = formData.get("remision");
            if (remision.length < 3) {
                setAlert({ active: true, mensaje: "La remisión debe tener al menos tres caracteres.", color: "danger", autoClose: false });
                return;
            }
            const res = await cargarSeriales(
                archivoExcel,
                remision,
                formData.get("pedido"),
                await uSemana(formData.get("semana")),
                formData.get("fecha"),
                formData.get("observaciones"),
                user.username
            );
            setBool(res.bool);
            setAlert({ active: true, mensaje: res.message, color: res.bool ? "success" : "danger", autoClose: false });
        } catch {
            setAlert({ active: true, mensaje: "Error, quizá existan seriales repetidos.", color: "danger", autoClose: false });
        }
    };

    const nuevoMovimiento = () => {
        setArchivoExcel([]);
        setTabla([]);
        setArchivoBruto(null);
        setBool(false);
        setNuevo(false);
        setTimeout(() => setNuevo(true), 50);
    };

    return (
        <section>
            <h2>Recepción</h2>
            {nuevo && (
                <form ref={formRef} onSubmit={cargarDatos} className={styles.grid_recepcion}>
                    <InputGroup size="sm">
                        <InputGroup.Text>Almacén</InputGroup.Text>
                        <Form.Select ref={almacenRef} onChange={previsualizar} disabled={bool}>
                            {almacenByUser.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.nombre}</option>
                            ))}
                        </Form.Select>
                    </InputGroup>
                    <InputGroup size="sm">
                        <InputGroup.Text>Remisión</InputGroup.Text>
                        <Form.Control id="remision" name="remision" required minLength={3} disabled={bool} />
                    </InputGroup>
                    <InputGroup size="sm">
                        <InputGroup.Text>Pedido</InputGroup.Text>
                        <Form.Control id="pedido" name="pedido" required disabled={bool} />
                    </InputGroup>
                    <InputGroup size="sm">
                        <InputGroup.Text>Semana</InputGroup.Text>
                        <Form.Control id="semana" name="semana" type="number" min="1" max="52" required disabled={bool} />
                    </InputGroup>
                    <InputGroup size="sm">
                        <InputGroup.Text>Fecha</InputGroup.Text>
                        <Form.Control id="fecha" name="fecha" type="date" defaultValue={uDate()} disabled={bool} />
                    </InputGroup>
                    <InputGroup size="sm">
                        <InputGroup.Text>Artículo</InputGroup.Text>
                        <Form.Select ref={articuloRef} onChange={previsualizar} disabled={bool}>
                            <option value={0}>Varios</option>
                            {productos.map((item, index) => (
                                <option key={index} value={item.consecutivo}>{item.name}</option>
                            ))}
                        </Form.Select>
                    </InputGroup>
                    <Form.Control className="form-control-sm" type="file" onChange={subirExcel} required disabled={bool} />
                    <InputGroup size="sm">
                        <InputGroup.Text>Observaciones</InputGroup.Text>
                        <Form.Control id="observaciones" name="observaciones" required disabled={bool} />
                    </InputGroup>
                    <button type="submit" className="btn btn-success btn-sm" disabled={bool}>Cargar datos</button>
                </form>
            )}
            <Alertas alert={alert} handleClose={toogleAlert} />
            {tabla.length > 0 && (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            {Object.keys(tabla[0]).map((key, index) => (
                                <th key={index}>{key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tabla.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {Object.values(row).map((value, colIndex) => (
                                    <td key={colIndex}>{value}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

        </section>
    );
}
