import React from 'react';

//Components


//CSS
import styles from '@styles/admin/crearProducto.module.css'

export default function NuevoProducto() {
    return (
        <div>
            <form>
                <div className={styles.formulario}>
                    <div className={styles.grupo}>
                        <label for="Username">Código</label>
                        <div>
                            <input type="text" className="form-control form-control-sm" id="usuario"></input>
                        </div>
                    </div>

                    <div className={styles.grupo}>
                        <label for="Username">Proveedor</label>
                        <div>
                            <select className="form-select form-select-sm">
                                <option>Maderkit</option>
                                <option>Corbeta</option>
                                <option>Meico</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.grupo}>
                        <label for="Username">Categoría</label>
                        <div>
                            <select className="form-select form-select-sm">
                                <option>Cartón</option>
                                <option>Seguridad</option>
                                <option>Otros</option>
                            </select>
                        </div>
                    </div>

                </div>

                <div className={styles.formulario2}>
                    <div className={styles.grupo}>
                        <label for="Username">Descripción del producto</label>
                        <div>
                            <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                        </div>
                    </div>
                </div>

                <div className={styles.formulario3}>
                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                Salida sin stock
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                Serial
                            </label>
                    </div>
                </div>

                <div className={styles.formulario5}>
                <p>Habilitar almacenes</p>
                </div>

                <div className={styles.formulario4}>
                    
                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                001
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                002
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                003
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                004
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                005
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                006
                            </label>
                    </div>

                    <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault"></input>
                            <label className="form-check-label" for="flexCheckDefault">
                                007
                            </label>
                    </div>

                  
                </div>
               
                <div className={styles.formulario6}>
                    <br />
                    <div>
                        <button type="button" className="btn btn-success btn-sm form-control form-control-sm">Crear producto</button>
                    </div>
                </div>
            </form>



        </div>
    )
}