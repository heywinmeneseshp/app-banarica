import { Button } from "react-bootstrap";
import React, { useState } from "react";
import { Container } from "react-bootstrap";
import styles from '@styles/informes/informes.module.css';
import ReporteGeneral from "@components/informes/ReporteGeneralMovimientos";
import ReporteDiario from "@components/informes/ReporteDiarioMovimientos";
import RepoteSemanal from "@components/informes/ReporteSemanalMovimientos";
import { useAuth } from "@hooks/useAuth";


export default function InfoMovimientos() {
    const { user } = useAuth();
    const titulo = { general: "Informe de movimientos", reporte: "Reporte semanal" };
    const [toggle, setToggle] = useState(1);

    return (
        <>
            <Container >

                <div className={styles.buttons}>
                    <Button onClick={() => setToggle(1)} size="sm">Reporte general</Button>
                    {(user.id_rol == "Super administrador" || user.id_rol == "Super seguridad") &&
                        <Button onClick={() => setToggle(2)} size="sm">Reporte díario</Button>
                    }
                    <Button onClick={() => setToggle(3)} size="sm">Reporte semanal</Button>
                </div>


                <div className="mt-3">
                    <h2>{toggle ? titulo.reporte : titulo.general}</h2>
                    <div className="line"></div>
                </div>

                {(toggle == 1) && <ReporteGeneral />}
                {(toggle == 2) && <ReporteDiario />}
                {(toggle == 3) && <RepoteSemanal />}



            </Container>
        </>
    );
}

