import React from 'react';

//Components


//CSS
import styles from '@styles/NuevaBodega.module.css'

export default function NuevaCategoria() {
    return (
        <div>
            <form className={styles.formularioCategoria}>
              
                <div className={styles.grupo}>
                    <label for="Username">Código</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="usuario"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <label for="Username">Categoría</label>
                    <div>
                        <input type="text" className="form-control form-control-sm" id="correo"></input>
                    </div>
                </div>

                <div className={styles.grupo}>
                    <br />
                    <div>
                        <button type="button" className="btn btn-success btn-sm form-control form-control-sm">Crear almacén</button>
                    </div>
                </div>

            </form>



        </div>
    )
}