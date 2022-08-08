import React, { useRef } from 'react';

//Components


//CSS
import styles from '@styles/NewUser.module.css';
import { actualizarProveedor, agregarProveedor } from '@services/api/proveedores';

export default function NuevoProveedor({ setAlert, setOpen, item }) {
    const formRef = useRef(null);

    let styleBoton = { color: "success", text: "Agregar" };
    if (item) styleBoton = { color: "warning", text: "Editar" };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const data = {
            razon_social: formData.get('razon_social'),
            direccion: formData.get('direccion'),
            tel: formData.get('telefono'),
            email: formData.get('email'),
            isBlock: false
        };
        if (item == null) {
            try {
                agregarProveedor(data);
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
            actualizarProveedor(item.id, data);
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
                            <label htmlFor="razon_social">Razón social</label>
                            <div>
                                <input defaultValue={item?.razon_social} type="text" className="form-control form-control-sm" name='razon_social' id="razon_social"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="direccion">Dirección</label>
                            <div>
                                <input defaultValue={item?.direccion} type="text" className="form-control form-control-sm" name="direccion" id="direccion"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="email">Correo</label>
                            <div>
                                <input defaultValue={item?.email} type="text" className="form-control form-control-sm" name="email" id="email"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="telefono">Telefono</label>
                            <div>
                                <input defaultValue={item?.tel} type="text" className="form-control form-control-sm" name="telefono" id="telefono"></input>
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