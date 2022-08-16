import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import editarPick from '@public/images/editar.png';
//Services 
import { listarAvisos, eliminarAviso } from '@services/api/avisos';
//Hooks
import { useAuth } from '@hooks/useAuth';
import useAlert from '@hooks/useAlert';
//Components
import NuevoAviso from './NuevoAviso';
import Alertas from '@assets/Alertas';
//Bootstrap
import { Alert } from 'react-bootstrap';
import styles from '@styles/Tablero.module.css';


const TableroB = () => {
    const { user } = useAuth();
    const { alert, setAlert, toogleAlert } = useAlert();
    const [avisos, setAvisos] = useState([]);
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState(null);

    useEffect(() => {
        listarAvisos().then(res => {
            setAvisos(res);
        });
    }, [alert]);

    function eliminar(id) {
        eliminarAviso(id).then(() => {
        });
        setAlert({
            active: true,
            mensaje: 'El aviso ha sido eliminado',
            color: "success",
            autoClose: true
        });
    }

    const editar = (item) => {
        setItem(item);
        setOpen(true);
    };

    function nuevoAviso() {
        setOpen(true);
        setItem(null);
    }


    return (
        <>

            <div className={styles.superTablero}>
                <div className={styles.tablero}>
                    <div className={styles.miniTablero}>
                        {(user.id_rol == "Super administrador") &&
                            <button onClick={nuevoAviso} className={styles.circulo}>+</button>
                        }
                        <div>
                            <h5 className={styles.plus}>+ Avisos</h5>
                        </div>
                        {avisos.map((aviso, index) => (
                            <Alert className={styles.alerta} key={index} variant="info">
                                <span className={styles.eliminarAviso}>
                                    {(user.id_rol == "Super administrador") &&
                                        <button onClick={() => eliminar(aviso.id)} type="button" className="btn-close" aria-label="Close"></button>
                                    }
                                </span>
                                <div className={styles.aviso}>
                                    {aviso.descripcion}
                                </div>

                                <span className={styles.editarAviso}>
                                    {(user.id_rol == "Super administrador") &&
                                        <Image onClick={() => editar(aviso)} className={styles.imagenEditar} width="20" height="20" src={editarPick} alt="editar" />
                                    }
                                </span>
                            </Alert>
                        ))}
                        <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
                    </div>
                </div>
            </div>
            {open && <NuevoAviso setOpen={setOpen} item={item} setAlert={setAlert} />}
        </>
    );
};

export default TableroB;