import React from "react";
import { useContext, useState } from "react";
import AppContext from "@context/AppContext";

//Bootstrap
import Alert from 'react-bootstrap/Alert';

//Components


//CSS
import styles from "@styles/almacen/almacen.module.css";

export default function Alertas({ alert, handleClose }) {

    if (alert && alert?.autoClose) {
        setTimeout(() => {
            handleClose();
        }, 9000)
    }

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
    )
}