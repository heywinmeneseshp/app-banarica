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
                let array = new Array(res.data.length).fill(false); 
                res.data.map((almacen, index) => {
                    resB.data.map(item => {
                        if (almacen.consecutivo === item.id_almacen) {
                            array[index] = item.habilitado;
                        }
                    });
                });
                setcheckedState(array);
            } else {
                const array = new Array(res.data.length).fill(false);
                setcheckedState(array);
            }
            setAlmacenes(res.data);
        }
        try {
            listarAlmacenes();
        } catch (e) {
            alert("Se ha presentado un error");
        }

    }, [user]);



    const handleChange = (position) => {
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
            isBlock: false
        };
        const repassword = formData.get('repassword');
        if (data.password != repassword) {
            alert("La contraseña debe coincidir");
            return;
        }
        if (user == null) {
            try {
                agregarUsuario(data);
                almacenes.map((item, index) => {
                    cargarAlmacenesPorUsuario(data.username, item.consecutivo, checkedState[index]);
                });
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
            console.log(checkedState);
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

                    <div className={styles.ex}><span tabIndex={0} role="button" onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        <span className={styles.formulario}>
                            <div className={styles.grupo}>
                                <label htmlFor="username">Usuario</label>
                                <div>
                                    <input defaultValue={user?.username}
                                        id="username"
                                        name="username"
                                        type="text"
                                        minLength="6"
                                        className="form-control form-control-sm"
                                        required
                                    ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="email">Correo</label>
                                <div>
                                    <input defaultValue={user?.email}
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="form-control form-control-sm"
                                        required
                                    ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="password">Contraseña</label>
                                <div>
                                    <input 
                                        id="password"
                                        name="password"
                                        type="text"
                                        minLength="4"
                                        className="form-control form-control-sm"
                                        required
                                    ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="repassword">Repite la contraseña</label>
                                <div>
                                    <input 
                                        id="repassword"
                                        name="repassword"
                                        type="text"
                                        minLength="4"
                                        className="form-control form-control-sm"
                                        required
                                    ></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="nombre">Nombre</label>
                                <div>
                                    <input defaultValue={user?.nombre}
                                        id="nombre"
                                        name="nombre"
                                        type="text"
                                        className="form-control form-control-sm"
                                        required></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="apellido">Apellido</label>
                                <div>
                                    <input defaultValue={user?.apellido}
                                        id="apellido"
                                        name="apellido"
                                        type="text"
                                        className="form-control form-control-sm"
                                        required></input>
                                </div>
                            </div>

                            <div className={styles.grupo}>
                                <label htmlFor="tel">Teléfono</label>
                                <div>
                                    <input defaultValue={user?.tel}
                                        id="tel"
                                        name="tel"
                                        type="text"
                                        className="form-control form-control-sm"
                                        required
                                    ></input>
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
                                        <input className="form-check-input" type="checkbox" checked={checkedState[index]} onChange={() => handleChange(index)} name={almacen.consecutivo} id={almacen.consecutivo}></input>
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