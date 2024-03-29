import React from "react";
import { actualizarNotificaciones } from "@services/api/notificaciones";

import Alert from 'react-bootstrap/Alert';


export default function AlertaCombustible({ data, setChange }) {




    const onCerrar = () => {
        actualizarNotificaciones(data.id, { visto: true, aprobado: true, descripcion: "completado" });
        setChange(true);
        setTimeout(() => {
            setChange(data.id);
        }, 500);
    };


    return (
        <Alert className="row" key={data.id} variant={data?.dif_porcentual_consumo > 0 ? "success" : "warning"}>
            <div className="col-md-11">
                <b>| {data?.record_consumo?.vehiculo?.placa} |</b> {data?.descripcion}
            </div>
            <div className="col-md-1">
                <button onClick={onCerrar} type="button" className="btn btn-danger btn-sm">
                    Cerrar
                </button>
            </div>
        </Alert>
    );
}
