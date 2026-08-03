import { useEffect, useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { encontrarModulo } from '@services/api/configuracion';

export function useBotonesUsuario() {
    const { user } = useAuth();
    const [botones, setBotones] = useState([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        if (user?.id_rol === 'Super administrador') {
            setIsSuperAdmin(true);
            setBotones([]);
            return;
        }

        setIsSuperAdmin(false);

        if (!user?.username) {
            setBotones([]);
            return;
        }

        let cancelado = false;

        encontrarModulo(user.username)
            .then((config) => {
                if (cancelado) return;
                const detallesRaw = config?.[0]?.detalles;
                const detalles = detallesRaw ? JSON.parse(detallesRaw) : {};
                setBotones(Array.isArray(detalles?.botones) ? detalles.botones : []);
            })
            .catch(() => {
                if (!cancelado) setBotones([]);
            });

        return () => { cancelado = true; };
    }, [user?.id_rol, user?.username]);

    const tieneBoton = (clave) => isSuperAdmin || botones.includes(clave);

    return { botones, isSuperAdmin, tieneBoton };
}
