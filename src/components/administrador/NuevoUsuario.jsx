import React from 'react';
import { useContext, useRef, useState } from 'react';
import AppContext from '@context/AppContext';
import useFetch from '@hooks/useFetch';
import endPoints from '@services/api';
import { agregarUsuario } from '@services/api/usuarios';

//Components


//CSS
import styles from '@styles/NewUser.module.css';

export default function NuevoUsuario({ data }) {
    const { initialAdminMenu } = useContext(AppContext);
    const formRef = useRef(null);
    const almacenes = useFetch(endPoints.almacenes.list);
    const [checkState, setCheckState] = useState(new Array(almacenes.length).fill(false));

    const handleChange = (position) => {
        const newCheckState = [...checkState];
        newCheckState[position] = !newCheckState[position];
        setCheckState(newCheckState);
        console.log(almacenes[position].consecutivo,);
    }


    const closeWindow = () => {
        initialAdminMenu.hadleCloseTable();
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const data = {
            username: formData.get('username'),
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            password: formData.get('password'),
            tel: formData.get('tel'),
            id_rol: formData.get('id_rol'),
            isBlock: true
        };
        agregarUsuario(data);
    }

    return (
        <div>
            <div className={styles.tableros}>
                <div className={styles.padre}>

                    <div className={styles.ex}><span onClick={() => closeWindow()} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <span className={styles.formulario}>
                            <div className={styles.grupo}>
                                <label htmlFor="username">Usuario</label>
                                <div>
                                    <input id="username" name="username" type="text" className="form-control form-control-sm" ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="email">Correo</label>
                                <div>
                                    <input id="email" name="email" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>


                            <div className={styles.grupo}>
                                <label htmlFor="password">Contraseña</label>
                                <div>
                                    <input id="password" name="password" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="repassword">Repite la contraseña</label>
                                <div>
                                    <input id="repassword" name="repassword" type="text" className="form-control form-control-sm" ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="nombre">Nombre</label>
                                <div>
                                    <input id="nombre" name="nombre" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="apellido">Apellido</label>
                                <div>
                                    <input id="apellido" name="apellido" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="tel">Teléfono</label>
                                <div>
                                    <input id="tel" name="tel" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="id_rol">Rol</label>
                                <div>
                                    <select id="id_rol" name="id_rol" className="form-select form-select-sm">
                                        <option>Super administrador</option>
                                        <option>Administrador</option>
                                        <option>Oficinista</option>
                                        <option>Operador</option>
                                    </select>
                                </div>
                            </div>



                        </span>
                        <span >

                            <div className={styles.formulario5}>
                                <p>Habilitar almacenes</p>
                            </div>

                            <div className={styles.formulario4}>

                                {almacenes.map((almacen, index) => (
                                    <div key={index} className="form-check">
                                        <input className="form-check-input" type="checkbox" value={almacen.consecutivo} checked={checkState[index]} onChange={() => handleChange(index)} name={almacen.consecutivo} id={almacen.consecutivo}></input>
                                        <label className="form-check-label" htmlFor={almacen.consecutivo}>
                                            {almacen.consecutivo}
                                        </label>
                                    </div>
                                ))}

                            </div>

                            <div className={styles.formulario6}>
                                <br />
                                <div>
                                    <button type="submit" className="btn btn-success btn-sm form-control form-control-sm">Crear producto</button>
                                </div>
                            </div>

                        </span>
                    </form>

                </div>
            </div>
        </div>
    );
}