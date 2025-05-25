import React, { useEffect, useRef, useState } from 'react';
//Services
import endPoints from '@services/api';
import { actualizarUsuario, agregarUsuario, cargarAlmacenesPorUsuario } from '@services/api/usuarios';
//Hooks
//Components
//CSS
import styles from "@components/shared/Formularios/Formularios.module.css";
import axios from 'axios';
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
import { botones, menuCompleto, menuPrincipal } from 'utils/configMenu';



export default function NuevoUsuario({ setAlert, setOpen, user, profile }) {
    const formRef = useRef(null);
    const [checkedState, setcheckedState] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [changePass, setChangePass] = useState(false);
    const [tagMenu, setTagMenu] = useState([]);
    const [tagSubMenu, setTagSubMenu] = useState([]);
    const [menuSelected, setMenuSelected] = useState([]);
    const [tagBotones, setTagBotones] = useState([]);

    const configMenuKeys = menuPrincipal();
    const configSubMenuKeys = menuCompleto;
    const configBotones = botones;

    const onChaneselectionTagsMenu = () => {
        const formData = new FormData(formRef.current);
        const menuSeleccionado = formData.get('selectionTagsMenu');
        const res = configSubMenuKeys[menuSeleccionado] || [];
        setMenuSelected(res);
    };

    useEffect(() => {
        async function listarAlmacenes() {
            const res = await axios.get(endPoints.almacenes.list);
            if (user) {
                const resB = await axios.get(endPoints.usuarios.almacenes.findByUsername(user?.username));
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
            encontrarModulo(user?.username).then(res => {
                const detalles = JSON.parse(res[0].detalles || "{}");
                setTagMenu(detalles.menu || []);
                setTagSubMenu(detalles.submenu || []);
                setTagBotones(detalles.botones || []);
                console.log(detalles);
            });
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

    const handleAddTagMenu = () => {
        const formData = new FormData(formRef.current);
        const tag = formData.get("inputTagsMenu");
        if (tag && !tagMenu.includes(tag)) {
            setTagMenu([...tagMenu, tag]);
            const input = formRef.current.querySelector('[name="inputTagsMenu"]');
            if (input) input.value = "";
        }
    };


    const handleAddTagSubMenu = () => {
        const formData = new FormData(formRef.current);
        const tag = formData.get("inputTagsSubMenu");
        if (tag && !tagMenu.includes(tag)) {
            setTagSubMenu([...tagSubMenu, tag]);
            const input = formRef.current.querySelector('[name="inputTagsSubMenu"]');
            if (input) input.value = "";
        }
    };

    const handleAddTagBoton = () => {
        const formData = new FormData(formRef.current);
        const tag = formData.get("inputTagsBotones");
        if (tag && !tagMenu.includes(tag)) {
            setTagBotones([...tagBotones, tag]);
            const input = formRef.current.querySelector('[name="inputTagsSubMenu"]');
            if (input) input.value = "";
        }
    };

    const handleRemoveTagMenu = (tag) => {
        const newList = tagMenu.filter(item => item !== tag);
        setTagMenu(newList);
    };

    const handleRemoveTagSubMenu = (tag) => {
        const newList = tagSubMenu.filter(item => item !== tag);
        setTagSubMenu(newList);
    };

    const handleRemoveBoton = (tag) => {
        const newList = tagBotones.filter(item => item !== tag);
        setTagBotones(newList);
    };



    const handleSubmit = async (e) => {
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
            }
        } else {
            console.log(data);
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
        }
        const res = await encontrarModulo(user.username);
        let confUser = {};
        try {
            confUser = JSON.parse(res[0].detalles);
        } catch (err) {
            console.error("Error al parsear JSON:", err);
            console.log("Contenido que falló:", res[0].detalles);
            // Puedes decidir cómo manejar el error aquí
        }
        confUser = JSON.stringify({ ...confUser, menu: tagMenu, submenu: tagSubMenu, botones: tagBotones });
        await actualizarModulo({ modulo: user.username, detalles: confUser });
        console.log({ modulo: user.username, detalles: confUser });
        setOpen(false);
    };

    return (
        <div className={styles.floatingform}>
            <div className={styles.fondo}>
                <div className="card" style={{
                    width: window.innerWidth < 768 ? '100vh' : "auto",
                    overflowY: 'auto'
                }}>
                    <div className="card-header d-flex justify-content-between">
                        <span className="fw-bold">Usuario</span>
                        <button
                            type="button"
                            onClick={closeWindow}
                            onKeyDown={closeWindow}
                            className="btn-close"
                            aria-label="Close"
                        />
                    </div>


                    <div>
                        <form ref={formRef} onSubmit={handleSubmit} className="card-body">
                            <div className='container' style={{
                                height: window.innerWidth < 768 ? '80vh' : '70vh',
                                overflowY: 'auto'
                            }}>                            {!changePass ? (
                                <div className="row">
                                    {/* Datos básicos */}
                                    <div className="col-md-3">
                                        <label htmlFor="username">Usuario</label>
                                        <input
                                            defaultValue={user?.username}
                                            id="username"
                                            name="username"
                                            type="text"
                                            minLength="6"
                                            className="form-control form-control-sm"
                                            disabled={profile}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="email">Correo</label>
                                        <input
                                            defaultValue={user?.email}
                                            id="email"
                                            name="email"
                                            type="email"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="password">Contraseña</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={profile}
                                            required={!user}
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="repassword">Repite la contraseña</label>
                                        <input
                                            id="repassword"
                                            name="repassword"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={profile}
                                            required={!user}
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="nombre">Nombre</label>
                                        <input
                                            defaultValue={user?.nombre}
                                            id="nombre"
                                            name="nombre"
                                            type="text"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="apellido">Apellido</label>
                                        <input
                                            defaultValue={user?.apellido}
                                            id="apellido"
                                            name="apellido"
                                            type="text"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="tel">Teléfono</label>
                                        <input
                                            defaultValue={user?.tel}
                                            id="tel"
                                            name="tel"
                                            type="text"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    {profile ? (
                                        <div className="col-md-3 d-flex align-items-end">
                                            <button
                                                onClick={hadleChangePass}
                                                className="btn btn-warning btn-sm w-100"
                                            >
                                                Cambiar contraseña
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="col-md-3">
                                            <label htmlFor="id_rol">Rol</label>
                                            <select
                                                id="id_rol"
                                                name="id_rol"
                                                className="form-select form-select-sm"
                                                defaultValue={user?.id_rol}
                                            >
                                                <option value="Super administrador">Super administrador</option>
                                                <option value="Administrador">Administrador</option>
                                                <option value="Oficinista">Oficinista</option>
                                                <option value="Operador">Operador</option>
                                                <option value="Super seguridad">Super seguridad</option>
                                                <option value="Seguridad">Seguridad</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <label htmlFor="username2">Usuario</label>
                                        <input
                                            defaultValue={user?.username}
                                            id="username2"
                                            name="username"
                                            type="text"
                                            minLength="6"
                                            className="form-control form-control-sm"
                                            disabled={profile}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="old-password">Actual contraseña</label>
                                        <input
                                            id="old-password"
                                            name="old-password"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={!profile}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="password">Nueva contraseña</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={!profile}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-3">
                                        <label htmlFor="repassword">Repite la contraseña</label>
                                        <input
                                            id="repassword"
                                            name="repassword"
                                            type="text"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            disabled={!profile}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                                {/* Configuración de menú y almacenes */}
                                {!profile && !changePass && (
                                    <>

                                        {/**Habilitar Menú*/}
                                        <div className="row g-3 mt-1 mb-1">

                                            <h6 className='mb-0'>Habilitar Menú</h6>
                                            <div className="col-md-8">
                                                <input
                                                    type="text"
                                                    id="inputTagsMenu"
                                                    list="tagMenu"
                                                    name="inputTagsMenu"
                                                    className="form-control"
                                                    placeholder="Ingrese el ítem"
                                                />
                                                <datalist id="tagMenu">
                                                    {configMenuKeys
                                                        .filter(item => !tagMenu.includes(item))
                                                        .map(item => (
                                                            <option key={item} value={item} />
                                                        ))}
                                                </datalist>
                                            </div>
                                            <div className="col-md-4 d-flex align-items-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary w-100"
                                                    onClick={handleAddTagMenu}
                                                >
                                                    Agregar
                                                </button>
                                            </div>

                                            <div className="col-md-12">
                                                <div className="card">
                                                    <div className="card-body d-flex flex-wrap">
                                                        {tagMenu.map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="badge bg-primary me-2 mb-2 d-flex align-items-center"
                                                            >
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    className="btn-close btn-sm ms-2"
                                                                    aria-label="Remove"
                                                                    onClick={() => handleRemoveTagMenu(tag)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/**Habilitar submenu */}
                                        <div className="row g-3 mt-1 mb-1">

                                            <h6 className='mb-0'>Habilitar Submenu</h6>
                                            <div className="col-md-4">
                                                <select
                                                    id="selectionTagsMenu"
                                                    name="selectionTagsMenu"
                                                    className="form-control"
                                                    defaultValue=""
                                                    onChange={() => onChaneselectionTagsMenu()}
                                                >
                                                    <option value="">Seleccione un ítem</option>
                                                    {tagMenu.map((item, key) => {
                                                        return (
                                                            <option key={key} value={item}>{item}</option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <select
                                                    id="inputTagsSubMenu"
                                                    name="inputTagsSubMenu"
                                                    className="form-control"
                                                    defaultValue=""
                                                >
                                                    <option value="" >Seleccione un ítem</option>
                                                    {menuSelected.map(([ruta, label]) => {
                                                        if (!tagSubMenu.includes(label)) {
                                                            return (
                                                                <option key={ruta} value={label}>{label}</option>
                                                            );
                                                        }
                                                    })}
                                                </select>
                                            </div>
                                            <div className="col-md-4 d-flex align-items-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary w-100"
                                                    onClick={handleAddTagSubMenu}
                                                >
                                                    Agregar
                                                </button>
                                            </div>

                                            <div className="col-md-12">
                                                <div className="card">
                                                    <div className="card-body d-flex flex-wrap">
                                                        {tagSubMenu.map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="badge bg-primary me-2 mb-2 d-flex align-items-center"
                                                            >
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    className="btn-close btn-sm ms-2"
                                                                    aria-label="Remove"
                                                                    onClick={() => handleRemoveTagSubMenu(tag)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/**Botones */}
                                        <div className="row g-3 mt-1 mb-1">

                                            <h6 className='mb-0'>Habilitar Submenu</h6>

                                            <div className="col-md-8">
                                                <select
                                                    id="inputTagsBotones"
                                                    name="inputTagsBotones"
                                                    className="form-control"
                                                    defaultValue=""
                                                >
                                                    <option value="" >Seleccione un ítem</option>
                                                    {configBotones.map((label, key) => {
                                                        if (!tagBotones.includes(label)) {
                                                            return (
                                                                <option key={key} value={label}>{label}</option>
                                                            );
                                                        }
                                                    })}
                                                </select>
                                            </div>
                                            <div className="col-md-4 d-flex align-items-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary w-100"
                                                    onClick={handleAddTagBoton}
                                                >
                                                    Agregar
                                                </button>
                                            </div>

                                            <div className="col-md-12">
                                                <div className="card">
                                                    <div className="card-body d-flex flex-wrap">
                                                        {tagBotones.map((tag, index) => (
                                                            <span
                                                                key={index}
                                                                className="badge bg-primary me-2 mb-2 d-flex align-items-center"
                                                            >
                                                                {tag}
                                                                <button
                                                                    type="button"
                                                                    className="btn-close btn-sm ms-2"
                                                                    aria-label="Remove"
                                                                    onClick={() => handleRemoveBoton(tag)}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Almacenes */}
                                        <div className="container mt-4">
                                            <h6 className='mb-3'>Habilitar almacenes</h6>
                                            <div className="row">
                                                {almacenes.map((almacen, index) => (
                                                    <div key={index} className="col-md-3 form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={checkedState[index]}
                                                            onChange={() => handleChange(index)}
                                                            name={almacen.consecutivo}
                                                            id={almacen.consecutivo}
                                                        />
                                                        <label
                                                            className="form-check-label"
                                                            htmlFor={almacen.consecutivo}
                                                        >
                                                            {almacen.consecutivo}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                            </div>

                            {/* Botones de acción */}
                            <div className="mt-4">
                                {changePass ? (
                                    <button
                                        type="button"
                                        onClick={onChangePass}
                                        className="btn btn-warning btn-sm w-100"
                                    >
                                        Crear nueva contraseña
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className={`btn btn-${styleBoton.color} btn-sm w-100`}
                                    >
                                        {styleBoton.text}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

    );
}