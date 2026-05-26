import React, { useEffect } from "react";

//Bootstrap
import Alert from 'react-bootstrap/Alert';

//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Alertas({ alert, handleClose }) {
    useEffect(() => {
        if (!alert?.active || !alert?.autoClose) {
            return undefined;
        }

        const timeoutId = setTimeout(() => {
            handleClose();
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [alert?.active, alert?.autoClose, handleClose]);

    return (
        <>
            {alert?.active &&
                <Alert className={styles.alert} key={alert.color} variant={alert.color}>
                    <div >
                        {alert.mensaje}
                    </div>
                </Alert>
            }
        </>
    );
}
