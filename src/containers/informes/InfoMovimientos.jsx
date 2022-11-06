import { Button } from "react-bootstrap";
import React, { useState } from "react";
import { Container } from "react-bootstrap";
import styles from '@styles/informes/informes.module.css';
import ReporteGeneralMovimientos from "@components/informes/ReporteGeneralMovimientos";
import ReporteSemanalMovimientos from "@components/informes/ReporteSemanalMovimientos";
import { useAuth } from "@hooks/useAuth";


export default function InfoMovimientos() {
    const { user } = useAuth()
    const titulo = { general: "Informe de movimientos", reporte: "Reporte semanal" }
    const [toggle, setToggle] = useState(false)

    return (
        <>
            <Container >
                {(user.id_rol == "Super administrador" || user.id_rol == "Super seguridad") &&
                    <div className={styles.buttons}>
                        <Button onClick={() => setToggle(false)} size="sm">Informe general</Button>
                        <Button onClick={() => setToggle(true)} size="sm">Reporte semanal</Button>
                    </div>
                }

                <div className="mt-3">
                    <h2>{toggle ? titulo.reporte : titulo.general}</h2>
                    <div className="line"></div>
                </div>

                {!toggle && <ReporteGeneralMovimientos />}
                {toggle && <ReporteSemanalMovimientos />}



            </Container>
        </>
    );
}

