import React, { useEffect, useRef, useState } from 'react';
import endPoints from '@services/api';
import { actualizarUsuario, agregarUsuario, cargarAlmacenesPorUsuario } from '@services/api/usuarios';
//Components
//CSS
import styles from '@styles/NewUser.module.css';
import axios from 'axios';

export default function NuevoUsuario({ setAlert, setOpen, user }) {
    const formRef = useRef(null);
    const [checkedState, setcheckedState] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);

    useEffect(() => {
        async function listarAlmacenes() {
            const res = await axios.get(endPoints.almacenes.list);
            if (user) {
                const resB = await axios.get(endPoints.usuarios.almacenes.findByUsername(user.username));
                res.data.map(almacen => {
                    resB.data.map(item => {
                        let bool = false;
                        if (item.habilitado === "1") bool = true;
                        if(almacen.consecutivo === item.id_almacen){
                            setcheckedState(checkedState => [...checkedState, bool]);
                        }
                    });
                });
            } else {
                res.data.map(almacen => {
                    setcheckedState(checkedState => [...checkedState, false]);
                });
            }
            console.log(checkedState);
            setAlmacenes(res.data);
            
        }
        try {
            listarAlmacenes();
        } catch (e) {
            console.log(e);
        }

    }, [user]);



    const handleChange = (position) => {
        console.log(checkedState);
        const updatedCheckedState = checkedState.map((item, index) =>
            index === position ? !item : item
        );
        setcheckedState(updatedCheckedState);
    };


    let styleBoton = { color: "success", text: "Agregar usuario" };
    if (user) styleBoton = { color: "warning", text: "Editar usuario" };

    const closeWindow = () => {
        setOpen(false);
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
        if (user == null) {
            try {
                const result = agregarUsuario(data);

                almacenes.map((item, index) => {
                    cargarAlmacenesPorUsuario(data.username, item.consecutivo, checkedState[index]);
                });
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
            
            actualizarUsuario(user.username, data);
            almacenes.map((item, index) => {
                cargarAlmacenesPorUsuario(user.username, item.consecutivo, checkedState[index]);  
            }
            );
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

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <span className={styles.formulario}>
                            <div className={styles.grupo}>
                                <label htmlFor="username">Usuario</label>
                                <div>
                                    <input defaultValue={user?.username} id="username" name="username" type="text" className="form-control form-control-sm" ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="email">Correo</label>
                                <div>
                                    <input defaultValue={user?.email} id="email" name="email" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="password">Contraseña</label>
                                <div>
                                    <input defaultValue={user?.password} id="password" name="password" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="repassword">Repite la contraseña</label>
                                <div>
                                    <input defaultValue={user?.password} id="repassword" name="repassword" type="text" className="form-control form-control-sm" ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="nombre">Nombre</label>
                                <div>
                                    <input defaultValue={user?.nombre} id="nombre" name="nombre" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="apellido">Apellido</label>
                                <div>
                                    <input defaultValue={user?.apellido} id="apellido" name="apellido" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="tel">Teléfono</label>
                                <div>
                                    <input defaultValue={user?.tel} id="tel" name="tel" type="text" className="form-control form-control-sm"></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="id_rol">Rol</label>
                                <div>
                                    <select defaultValue={user?.id_rol} id="id_rol" name="id_rol" className="form-select form-select-sm">
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
                                        <input className="form-check-input" type="checkbox"  checked={checkedState[index]} onChange={() => handleChange(index)} name={almacen.consecutivo} id={almacen.consecutivo}></input>
                                        <label className="form-check-label" htmlFor={almacen.consecutivo}>
                                            {almacen.consecutivo}
                                        </label>
                                    </div>
                                ))}

                            </div>

                            <div className={styles.formulario6}>
                                <br />
                                <div>
                                    <button type="submit" className={"btn btn-" + styleBoton.color + " btn-sm form-control form-control-sm"}>{styleBoton.text}</button>
                                </div>
                            </div>

                        </span>
                    </form>

                </div>
            </div>
        </div>
    );
}