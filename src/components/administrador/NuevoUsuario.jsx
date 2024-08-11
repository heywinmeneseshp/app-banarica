import React, { useEffect, useRef, useState } from 'react';
//Services
import endPoints from '@services/api';
import { actualizarUsuario, agregarUsuario, cargarAlmacenesPorUsuario } from '@services/api/usuarios';
//Hooks
//Components
//CSS
import styles from '@styles/admin/crearProducto.module.css';
import axios from 'axios';

export default function NuevoUsuario({ setAlert, setOpen, user, profile }) {
    const formRef = useRef(null);
    const [checkedState, setcheckedState] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [changePass, setChangePass] = useState(false);

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
    if (profile) styleBoton = { color: "success", text: "Editar perfil" };

    const closeWindow = () => {
        setOpen(false);
    };

    const hadleChangePass = () => {
        setChangePass(!changePass);
    };

    const onChangePass = async () => {
        const formData = new FormData(formRef.current);
        const oldpassword = formData.get('old-password');
        try {
            await axios.post(endPoints.auth.login, { username: user.username, password: oldpassword });
            const newpassword = formData.get('password');
            const repassword = formData.get('repassword');
            if (newpassword != repassword) return alert("Las contraseñas deben coincidir");
            if (oldpassword == newpassword) return alert("La nueva contraseña debe ser diferente a la actual");
            actualizarUsuario(user.username, { password: newpassword });
            setOpen(false);
            alert("Se ha cambiado la contraseña con exito");
        } catch {
            return alert("Contraseña incorrecta");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        let data = {
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
            if (data.password == null || data.password == "") delete data.password;
            if (data.username == null) delete data.username;
            if (data.id_rol == null) delete data.id_rol;
            delete data.isBlock;
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
                    <div className={styles.ex}><span tabIndex={0} role="button" onClick={closeWindow} onKeyDown={closeWindow} className={styles.x}>X</span></div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        {!changePass &&
                            <span className={styles.formulario7}>
                                <div className={styles.grupo}>
                                    <label htmlFor="username">Usuario</label>
                                    <div>
                                        <input defaultValue={user?.username}
                                            id="username"
                                            name="username"
                                            type="text"
                                            minLength="6"
                                            className="form-control form-control-sm"
                                            disabled={profile}
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
                                            disabled={profile}
                                            required={!user}
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
                                            disabled={profile}
                                            required={!user}
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

                                {profile && <div className={styles.grupo}>
                                    <button onClick={hadleChangePass} className={"btn btn-warning mt-4 btn-sm form-control form-control-sm"}>Cambiar contraseña</button>
                                </div>}

                                {!profile && <div className={styles.grupo}>
                                    <label htmlFor="id_rol">Rol</label>
                                    <div>
                                        <select id="id_rol" name="id_rol" className="form-select form-select-sm">
                                            { <option selected={user?.id_rol == "Super administrador"}>Super administrador</option>}
                                            { <option selected={user?.id_rol == "Administrador"}>Administrador</option>}
                                            { <option selected={user?.id_rol == "Oficinista"}>Oficinista</option>}
                                            { <option selected={user?.id_rol == "Operador"}>Operador</option>}
                                            { <option selected={user?.id_rol == "Super seguridad"}>Super seguridad</option>}
                                            { <option selected={user?.id_rol == "Seguridad"}>Seguridad</option>}
                                        </select>
                                    </div>
                                </div>}



                            </span>
                        }
                        {changePass &&
                            <span className={styles.formulario}>
                                <div className={styles.grupo}>
                                    <label htmlFor="username">Usuario</label>
                                    <div>
                                        <input defaultValue={user?.username}
                                            id="username2"
                                            name="username"
                                            type="text"
                                            minLength="6"
                                            className="form-control form-control-sm"
                                            disabled={profile}
                                            required
                                        ></input>
                                    </div>
                                </div>

                                <div className={styles.grupo}>
                                    <label htmlFor="old-password">Actual contraseña</label>
                                    <div>
                                        <input
                                            id="old-password"
                                            name="old-password"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={!profile}
                                            required
                                        ></input>
                                    </div>
                                </div>


                                <div className={styles.grupo}>
                                    <label htmlFor="password">Nueva contraseña</label>
                                    <div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={!profile}
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
                                            disabled={!profile}
                                            required
                                        ></input>
                                    </div>
                                </div>

                            </span>
                        }

                        <span >
                            {!profile &&
                                <span>
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
                                </span>
                            }
                            {!changePass && <div className={styles.formulario6}>
                                <br />
                                <div>
                                    <button type="submit" className={"btn btn-" + styleBoton.color + " btn-sm form-control form-control-sm"}>{styleBoton.text}</button>
                                </div>
                            </div>}

                            {changePass && <div className={styles.formulario6}>
                                <br />
                                <div>
                                    <button type="button" onClick={onChangePass} className={"btn btn-warning btn-sm form-control form-control-sm"}>Crear nueva contraseña</button>
                                </div>
                            </div>}

                        </span>
                    </form>

                </div>
            </div>
        </div>
    );
}