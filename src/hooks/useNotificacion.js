import { filtrarNotificaciones } from "@services/api/notificaciones";
import { useState } from "react";

const useNotificacion = () => {
    const [notificacion, setNotificacion] = useState(null);
    const [notificaciones, setNotificaciones] = useState([]);

    const ingresarNotificacion = (data) => {
        setNotificacion(data)
    }

    const ingresarNotificaciones = (data) => {
        setNotificaciones(data)
    }

    return { notificacion, notificaciones, ingresarNotificacion, ingresarNotificaciones };
};

export default useNotificacion;