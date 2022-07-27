import React, { useRef } from 'react';
import { actualizarAlmacen, agregarAlmacen } from '@services/api/almacenes';
//Components
//CSS
import styles from '@styles/NuevaBodega.module.css';

export default function NuevaBodega({ setAlert, setOpen, almacen }) {
    const formRef = useRef(null);

    let styleBoton = { color: "success", text: "Agregar" };
    if (almacen) styleBoton = { color: "warning", text: "Editar" };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const data = {
            consecutivo: formData.get('consecutivo'),
            nombre: formData.get('nombre'),
            razon_social: formData.get('razon_social'),
            direccion: formData.get('direccion'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            isBlock: true
        };
        if (almacen == null) {
            try {
                const result = agregarAlmacen(data);
                console.log(result);
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
            actualizarAlmacen(almacen.consecutivo, data);
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

                    <div className={styles.ex}><span onClick={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit} className={styles.formulario}>

                        <div className={styles.grupo}>
                            <label htmlFor="consecutivo">Código</label>
                            <div>
                                <input defaultValue={almacen?.consecutivo} type="text" className="form-control form-control-sm" name="consecutivo" id="consecutivo"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="nombre">Almacén</label>
                            <div>
                                <input defaultValue={almacen?.nombre} type="text" className="form-control form-control-sm" name='nombre' id="nombre"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="razon_social">Razon social</label>
                            <div>
                                <input defaultValue={almacen?.consecutivo} type="text" className="form-control form-control-sm w-100" name='razon_social' id="razon_social"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="telefono">Teléfono</label>
                            <div>
                                <input defaultValue={almacen?.telefono} type="text" className="form-control form-control-sm" name='telefono' id="telefono"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="direccion">Dirección</label>
                            <div>
                                <input defaultValue={almacen?.direccion} type="text" className="form-control form-control-sm" name='direccion' id="direccion"></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="email">Correo</label>
                            <div>
                                <input defaultValue={almacen?.email} type="text" className="form-control form-control-sm" name='email' id="email"></input>
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
        </div>
    );
}