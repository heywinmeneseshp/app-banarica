import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import endPoints from '@services/api';
import {
    actualizarUsuario,
    agregarUsuario,
    cargarAlmacenesPorUsuario,
    listarAlmacenesPorUsuario,
    listarUsuarios,
} from '@services/api/usuarios';
import { actualizarModulo, encontrarModulo } from '@services/api/configuracion';
import { botones, menuCompleto, menuPrincipal } from 'utils/configMenu';

const parseDetallesModulo = (response) => {
    if (!response?.length) {
        return {};
    }

    try {
        return JSON.parse(response[0].detalles || "{}");
    } catch (error) {
        console.error("Error al parsear configuracion del modulo:", error);
        return {};
    }
};

export default function NuevoUsuario({ setAlert, setOpen, user }) {
    const formRef = useRef(null);
    const [almacenes, setAlmacenes] = useState([]);
    const [checkedState, setCheckedState] = useState([]);
    const [tagMenu, setTagMenu] = useState([]);
    const [tagSubMenu, setTagSubMenu] = useState([]);
    const [tagBotones, setTagBotones] = useState([]);
    const [menuSelected, setMenuSelected] = useState([]);
    const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
    const [usuarioBase, setUsuarioBase] = useState('');
    const [isCopyingAccess, setIsCopyingAccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEditing = Boolean(user);
    const actionLabel = isEditing ? 'Editar usuario' : 'Agregar usuario';
    const actionColor = isEditing ? 'warning' : 'success';

    const configMenuKeys = useMemo(() => menuPrincipal(), []);
    const configSubMenuKeys = useMemo(() => menuCompleto, []);
    const configBotones = useMemo(() => botones, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [almacenesResponse, usuariosResponse] = await Promise.all([
                    axios.get(endPoints.almacenes.list),
                    listarUsuarios(),
                ]);

                const almacenesData = almacenesResponse.data || [];
                setAlmacenes(almacenesData);
                setCheckedState(new Array(almacenesData.length).fill(false));
                setUsuariosDisponibles(
                    (usuariosResponse || []).filter((item) => item?.username && item.username !== user?.username),
                );

                if (!user?.username) {
                    setTagMenu([]);
                    setTagSubMenu([]);
                    setTagBotones([]);
                    return;
                }

                const [almacenesUsuario, configUsuario] = await Promise.all([
                    axios.get(endPoints.usuarios.almacenes.findByUsername(user.username)),
                    encontrarModulo(user.username),
                ]);

                const almacenesHabilitados = new Set(
                    (almacenesUsuario?.data || [])
                        .filter((item) => item?.habilitado)
                        .map((item) => item.id_almacen),
                );

                setCheckedState(
                    almacenesData.map((almacen) => almacenesHabilitados.has(almacen.consecutivo)),
                );

                const detalles = parseDetallesModulo(configUsuario);
                setTagMenu(detalles.menu || []);
                setTagSubMenu(detalles.submenu || []);
                setTagBotones(detalles.botones || []);
            } catch (error) {
                console.error("Error cargando datos del usuario:", error);
                window.alert("No fue posible cargar la informacion del usuario.");
            }
        };

        loadData();
    }, [user]);

    const closeWindow = () => {
        setOpen(false);
    };

    const handleWarehouseChange = (position) => {
        setCheckedState((prev) => prev.map((item, index) => (
            index === position ? !item : item
        )));
    };

    const handleMenuSelection = () => {
        const formData = new FormData(formRef.current);
        const selectedMenu = formData.get('selectionTagsMenu');
        setMenuSelected(configSubMenuKeys[selectedMenu] || []);
    };

    const handleAddTag = (fieldName, currentValues, setValues) => {
        const formData = new FormData(formRef.current);
        const value = String(formData.get(fieldName) || '').trim();

        if (!value || currentValues.includes(value)) {
            return;
        }

        setValues([...currentValues, value]);
        const input = formRef.current?.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.value = '';
        }
    };

    const handleRemoveTag = (tag, currentValues, setValues) => {
        setValues(currentValues.filter((item) => item !== tag));
    };

    const handleCopyAccess = async () => {
        if (!usuarioBase) {
            window.alert("Selecciona un usuario para copiar sus permisos y accesos.");
            return;
        }

        try {
            setIsCopyingAccess(true);
            const [sourceUser, sourceWarehouses, sourceConfig] = await Promise.all([
                axios.get(endPoints.usuarios.findOne(usuarioBase)),
                listarAlmacenesPorUsuario(usuarioBase),
                encontrarModulo(usuarioBase),
            ]);

            const detalles = parseDetallesModulo(sourceConfig);
            const almacenesHabilitados = new Set(
                (sourceWarehouses || [])
                    .filter((item) => item?.habilitado)
                    .map((item) => item.id_almacen),
            );

            if (formRef.current?.elements?.id_rol && sourceUser?.data?.id_rol) {
                formRef.current.elements.id_rol.value = sourceUser.data.id_rol;
            }

            setTagMenu(detalles.menu || []);
            setTagSubMenu(detalles.submenu || []);
            setTagBotones(detalles.botones || []);
            setMenuSelected([]);
            setCheckedState(
                almacenes.map((almacen) => almacenesHabilitados.has(almacen.consecutivo)),
            );
        } catch (error) {
            console.error("Error al copiar permisos del usuario:", error);
            window.alert("No fue posible copiar los permisos y accesos del usuario seleccionado.");
        } finally {
            setIsCopyingAccess(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(formRef.current);

        const payload = {
            username: formData.get('username'),
            nombre: formData.get('nombre'),
            apellido: formData.get('apellido'),
            email: formData.get('email'),
            password: formData.get('password'),
            tel: formData.get('tel'),
            id_rol: formData.get('id_rol'),
            isBlock: false
        };

        const repeatPassword = formData.get('repassword');

        if (!isEditing && payload.password !== repeatPassword) {
            window.alert("La contraseña debe coincidir.");
            return;
        }

        try {
            setLoading(true);
            const targetUsername = user?.username || payload.username;

            if (!isEditing) {
                await agregarUsuario(payload);
                await Promise.all(
                    almacenes.map((item, index) =>
                        cargarAlmacenesPorUsuario(payload.username, item.consecutivo, checkedState[index]),
                    ),
                );
            } else {
                if (!payload.password) delete payload.password;
                if (!payload.username) delete payload.username;
                if (!payload.id_rol) delete payload.id_rol;
                delete payload.isBlock;

                await actualizarUsuario(user.username, payload);
                await Promise.all(
                    almacenes.map((item, index) =>
                        cargarAlmacenesPorUsuario(user.username, item.consecutivo, checkedState[index]),
                    ),
                );
            }

            let confUser = {};
            try {
                const configResponse = await encontrarModulo(targetUsername);
                confUser = parseDetallesModulo(configResponse);
            } catch (error) {
                console.error("Error consultando configuracion del usuario:", error);
            }

            await actualizarModulo({
                modulo: targetUsername,
                detalles: JSON.stringify({
                    ...confUser,
                    menu: tagMenu,
                    submenu: tagSubMenu,
                    botones: tagBotones
                })
            });

            setAlert({
                active: true,
                mensaje: isEditing ? 'El usuario se ha actualizado' : 'El usuario ha sido creado con exito',
                color: 'success',
                autoClose: true
            });
            setOpen(false);
        } catch (error) {
            console.error("Error guardando usuario:", error);
            setAlert({
                active: true,
                mensaje: isEditing
                    ? 'Se produjo un error al actualizar el usuario'
                    : 'Se produjo un error al crear el usuario',
                color: 'warning',
                autoClose: true
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-xl modal-dialog-scrollable" role="document">
                    <div
                        className="modal-content border-0 shadow"
                        style={{ maxHeight: 'calc(100vh - 3.5rem)' }}
                    >
                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title mb-1">Usuario</h5>
                                <div className="small text-muted">
                                    {isEditing
                                        ? 'Actualiza los datos, permisos y accesos del usuario.'
                                        : 'Crea un usuario nuevo y define sus permisos iniciales.'}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={closeWindow}
                                aria-label="Cerrar"
                            />
                        </div>

                        <form
                            ref={formRef}
                            onSubmit={handleSubmit}
                            className="d-flex flex-column flex-grow-1"
                            style={{ minHeight: 0 }}
                        >
                            <div className="modal-body overflow-auto">
                                <div className="row g-3">
                                    <div className="col-12 col-md-3">
                                        <label htmlFor="username" className="form-label">Usuario</label>
                                        <input
                                            defaultValue={user?.username}
                                            id="username"
                                            name="username"
                                            type="text"
                                            minLength="6"
                                            className="form-control form-control-sm"
                                            required
                                            disabled={isEditing}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="email" className="form-label">Correo</label>
                                        <input
                                            defaultValue={user?.email}
                                            id="email"
                                            name="email"
                                            type="email"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="password" className="form-label">Contraseña</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            required={!isEditing}
                                            placeholder={isEditing ? 'Deja vacío para conservarla' : ''}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="repassword" className="form-label">Repite la contraseña</label>
                                        <input
                                            id="repassword"
                                            name="repassword"
                                            type="password"
                                            minLength="4"
                                            className="form-control form-control-sm"
                                            required={!isEditing}
                                            placeholder={isEditing ? 'Solo si cambias la contraseña' : ''}
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="nombre" className="form-label">Nombre</label>
                                        <input
                                            defaultValue={user?.nombre}
                                            id="nombre"
                                            name="nombre"
                                            type="text"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="apellido" className="form-label">Apellido</label>
                                        <input
                                            defaultValue={user?.apellido}
                                            id="apellido"
                                            name="apellido"
                                            type="text"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="tel" className="form-label">Teléfono</label>
                                        <input
                                            defaultValue={user?.tel}
                                            id="tel"
                                            name="tel"
                                            type="text"
                                            className="form-control form-control-sm"
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-3">
                                        <label htmlFor="id_rol" className="form-label">Rol</label>
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
                                </div>

                                {!isEditing && (
                                    <div className="mt-4 pt-3 border-top">
                                        <h6 className="mb-3">Copiar permisos y accesos</h6>
                                        <div className="row g-3">
                                            <div className="col-12 col-md-8">
                                                <select
                                                    id="usuarioBase"
                                                    name="usuarioBase"
                                                    className="form-select form-select-sm"
                                                    value={usuarioBase}
                                                    onChange={(event) => setUsuarioBase(event.target.value)}
                                                >
                                                    <option value="">Seleccione un usuario</option>
                                                    {usuariosDisponibles.map((item) => (
                                                        <option key={item.username} value={item.username}>
                                                            {item.nombre} {item.apellido} ({item.username})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-12 col-md-4">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm w-100"
                                                    onClick={handleCopyAccess}
                                                    disabled={!usuarioBase || isCopyingAccess}
                                                >
                                                    {isCopyingAccess ? 'Copiando...' : 'Copiar accesos'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">Habilitar menú</h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-8">
                                            <input
                                                type="text"
                                                id="inputTagsMenu"
                                                list="tagMenu"
                                                name="inputTagsMenu"
                                                className="form-control form-control-sm"
                                                placeholder="Ingrese el item"
                                            />
                                            <datalist id="tagMenu">
                                                {configMenuKeys
                                                    .filter((item) => !tagMenu.includes(item))
                                                    .map((item) => (
                                                        <option key={item} value={item} />
                                                    ))}
                                            </datalist>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={() => handleAddTag('inputTagsMenu', tagMenu, setTagMenu)}
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                        <div className="col-12">
                                            <div className="card">
                                                <div className="card-body d-flex flex-wrap gap-2">
                                                    {tagMenu.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="badge bg-primary d-inline-flex align-items-center"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                className="btn-close btn-close-white ms-2"
                                                                aria-label="Remove"
                                                                style={{ fontSize: '0.55rem' }}
                                                                onClick={() => handleRemoveTag(tag, tagMenu, setTagMenu)}
                                                            />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">Habilitar submenú</h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-4">
                                            <select
                                                id="selectionTagsMenu"
                                                name="selectionTagsMenu"
                                                className="form-select form-select-sm"
                                                defaultValue=""
                                                onChange={handleMenuSelection}
                                            >
                                                <option value="">Seleccione un item</option>
                                                {tagMenu.map((item) => (
                                                    <option key={item} value={item}>{item}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <select
                                                id="inputTagsSubMenu"
                                                name="inputTagsSubMenu"
                                                className="form-select form-select-sm"
                                                defaultValue=""
                                            >
                                                <option value="">Seleccione un item</option>
                                                {menuSelected.map(([ruta, label]) => (
                                                    !tagSubMenu.includes(label) ? (
                                                        <option key={ruta} value={label}>{label}</option>
                                                    ) : null
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={() => handleAddTag('inputTagsSubMenu', tagSubMenu, setTagSubMenu)}
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                        <div className="col-12">
                                            <div className="card">
                                                <div className="card-body d-flex flex-wrap gap-2">
                                                    {tagSubMenu.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="badge bg-primary d-inline-flex align-items-center"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                className="btn-close btn-close-white ms-2"
                                                                aria-label="Remove"
                                                                style={{ fontSize: '0.55rem' }}
                                                                onClick={() => handleRemoveTag(tag, tagSubMenu, setTagSubMenu)}
                                                            />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">Habilitar botones</h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-8">
                                            <select
                                                id="inputTagsBotones"
                                                name="inputTagsBotones"
                                                className="form-select form-select-sm"
                                                defaultValue=""
                                            >
                                                <option value="">Seleccione un item</option>
                                                {configBotones.map((label) => (
                                                    !tagBotones.includes(label) ? (
                                                        <option key={label} value={label}>{label}</option>
                                                    ) : null
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm w-100"
                                                onClick={() => handleAddTag('inputTagsBotones', tagBotones, setTagBotones)}
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                        <div className="col-12">
                                            <div className="card">
                                                <div className="card-body d-flex flex-wrap gap-2">
                                                    {tagBotones.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="badge bg-primary d-inline-flex align-items-center"
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                className="btn-close btn-close-white ms-2"
                                                                aria-label="Remove"
                                                                style={{ fontSize: '0.55rem' }}
                                                                onClick={() => handleRemoveTag(tag, tagBotones, setTagBotones)}
                                                            />
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">Habilitar almacenes</h6>
                                    <div className="row g-3">
                                        {almacenes.map((almacen, index) => (
                                            <div key={almacen.consecutivo} className="col-12 col-md-4 col-xl-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={checkedState[index] || false}
                                                        onChange={() => handleWarehouseChange(index)}
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
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeWindow}>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={`btn btn-${actionColor} btn-sm px-4`}
                                    disabled={loading}
                                >
                                    {loading ? 'Guardando...' : actionLabel}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}
