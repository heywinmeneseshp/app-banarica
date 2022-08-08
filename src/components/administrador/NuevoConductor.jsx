import React, { useEffect, useRef, useState } from 'react';
//Services
import { listarTransportadoras } from '@services/api/transportadoras';
import { agregarConductor, actualizarConductor } from '@services/api/conductores';
//Components

//CSS
import styles from '@styles/NewUser.module.css';

export default function NuevoConductor({ setAlert, setOpen, item }) {
    const formRef = useRef(null);
    const [transportadoras, setTransportadoras] = useState([]);

    useEffect(() => {
        async function listar() {
            const res = await listarTransportadoras();
            setTransportadoras(res);
        }

        listar();
    }, []);

    let styleBoton = { color: "success", text: "Agregar" };
    if (item) styleBoton = { color: "warning", text: "Editar" };


    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const data = {
            conductor: formData.get('conductor'),
            cons_transportadora: formData.get('transportadora'),
            tel: formData.get('telefono'),
            email: formData.get('email'),
            isBlock: false
        };
        if (item == null) {
            try {
                agregarConductor(data);
                setAlert({
                    active: true,
                    mensaje: "El usuario ha sido creado con exito",
                    color: "success",
                    autoClose: true
                });
                setOpen(false);
            } catch (e) {
                setAlert({
                    active: true,
                    mensaje: "Se ha producido un error al crear el usuario",
                    color: "warning",
                    autoClose: true
                });
                setOpen(false);
            }
        } else {
            actualizarConductor(item.consecutivo, data);
            setAlert({
                active: true,
                mensaje: 'El usuario se ha actualizado',
                color: "success",
                autoClose: true
            });
            setOpen(false);
        }
    };
    return (
        <div>
            <div className={styles.tableros}>
                <div className={styles.padre}>
                    <div className={styles.ex}><span tabIndex={0} role="button" onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit} className={styles.formulario}>

                        <div className={styles.grupo}>
                            <label htmlFor="conductor">Conductor</label>
                            <div>
                                <input defaultValue={item?.conductor} type="text" className="form-control form-control-sm" name="conductor" id="conductor"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="transportadora">Transportadora</label>
                            <div>
                                <select defaultValue={item?.cons_transportadora} id="transportadora" name='transportadora' className="form-select form-select-sm">

                                    {transportadoras.map((item, index) => (
                                        <option key={index}>{item.razon_social}</option>
                                    ))}

                                </select>
                            </div>
                        </div>


                        <div className={styles.grupo}>
                            <label htmlFor="email">Correo</label>
                            <div>
                                <input defaultValue={item?.email} type="text" className="form-control form-control-sm" name="email" id="email"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="telefono">Télefono</label>
                            <div>
                                <input defaultValue={item?.tel} type="text" className="form-control form-control-sm" name='telefono' id="telefono"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <br />
                            <div>
                                <button type="submit" className={"btn btn-" + styleBoton.color + " btn-sm form-control form-control-sm"}>{styleBoton.text}</button>
                            </div>
                        </div>

                    </form>

                </div>
            </div>
        </div >
    );
}