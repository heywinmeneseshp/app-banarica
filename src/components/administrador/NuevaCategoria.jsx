import React, { useRef } from 'react';

//Components


//CSS
import styles from '@styles/NuevaBodega.module.css';
import { actualizarCategorias, agregarCategorias } from '@services/api/categorias';

export default function NuevaCategoria({ setAlert, setOpen, item }) {
    const formRef = useRef(null);

    let styleBoton = { color: "success", text: "Agregar" };
    if (item) styleBoton = { color: "warning", text: "Editar" };

    const closeWindow = () => {
        setOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        let bool = false;
        if (item) bool = item.isBlock;
        let data = {
            nombre: formData.get('nombre'),
            isBlock: bool
        };
        if (item == null) {
            try {
                const result = agregarCategorias(data);
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
            actualizarCategorias(item.consecutivo, data);
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
                    <form ref={formRef} onSubmit={handleSubmit} className={styles.formularioCategoria}>

                        <div className={styles.grupo}>
                            <label htmlFor="consecutivo">Código</label>
                            <div>
                                <input defaultValue={item?.consecutivo} id="consecutivo" name='consecutivo' type="text" className="form-control form-control-sm" disabled></input>
                            </div>
                        </div>

                        <div className={styles.grupo}>
                            <label htmlFor="nombre">Categoría</label>
                            <div>
                                <input defaultValue={item?.nombre} id="nombre" name='nombre' type="text" className="form-control form-control-sm"></input>
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