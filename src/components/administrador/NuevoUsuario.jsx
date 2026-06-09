import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import endPoints from '@services/api';
import {
    actualizarUsuario,
    agregarUsuario,
    cargarAlmacenesPorUsuario,
    cargarTransportadorasPorUsuario,
    listarAlmacenesPorUsuario,
    listarTransportadorasPorUsuario,
    listarUsuarios,
} from '@services/api/usuarios';
import { listarTransportadoras } from '@services/api/transportadoras';
import { actualizarModulo, encontrarModulo, listarModulos } from '@services/api/configuracion';
import { botones, menuCompleto, menuPrincipal } from 'utils/configMenu';

const PROFILE_PREFIX = 'perfil:';
const ROLE_OPTIONS = ['Super administrador', 'Operador'];

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

const slugifyProfileName = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const buildProfileLabel = (profile) => {
    const details = parseDetallesModulo([profile]);
    return details?.nombre_perfil || profile?.modulo?.replace(PROFILE_PREFIX, '') || '';
};

export default function NuevoUsuario({ setAlert, setOpen, user }) {
    const formRef = useRef(null);
    const [almacenes, setAlmacenes] = useState([]);
    const [transportadoras, setTransportadoras] = useState([]);
    const [checkedState, setCheckedState] = useState([]);
    const [checkedTransportadorasState, setCheckedTransportadorasState] = useState([]);
    const [tagMenu, setTagMenu] = useState([]);
    const [tagSubMenu, setTagSubMenu] = useState([]);
    const [tagBotones, setTagBotones] = useState([]);
    const [menuSelected, setMenuSelected] = useState([]);
    const [selectedMenuKey, setSelectedMenuKey] = useState('');
    const [activeTab, setActiveTab] = useState('basicos');
    const [almacenSearch, setAlmacenSearch] = useState('');
    const [transportadoraSearch, setTransportadoraSearch] = useState('');
    const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
    const [usuarioBase, setUsuarioBase] = useState('');
    const [perfilesDisponibles, setPerfilesDisponibles] = useState([]);
    const [perfilBase, setPerfilBase] = useState('');
    const [nombrePerfil, setNombrePerfil] = useState('');
    const [isCopyingAccess, setIsCopyingAccess] = useState(false);
    const [isApplyingProfile, setIsApplyingProfile] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [loading, setLoading] = useState(false);

    const isEditing = Boolean(user);
    const actionLabel = isEditing ? 'Editar usuario' : 'Agregar usuario';
    const actionColor = isEditing ? 'warning' : 'success';

    const configMenuKeys = useMemo(() => menuPrincipal(), []);
    const configSubMenuKeys = useMemo(() => menuCompleto, []);
    const configBotones = useMemo(() => botones, []);
    const filteredWarehouses = useMemo(() => {
        const rawQuery = almacenSearch.trim().toLowerCase();
        const queryParts = rawQuery
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter(Boolean);

        return almacenes
            .map((almacen, index) => ({ almacen, index }))
            .filter(({ almacen }) => (
                !queryParts.length || queryParts.some((query) => (
                    String(almacen?.consecutivo || '').toLowerCase().includes(query)
                ))
            ));
    }, [almacenSearch, almacenes]);

    const filteredTransportadoras = useMemo(() => {
        const rawQuery = transportadoraSearch.trim().toLowerCase();
        const queryParts = rawQuery
            .split(/[\s,]+/)
            .map((item) => item.trim())
            .filter(Boolean);

        return transportadoras
            .map((transportadora, index) => ({ transportadora, index }))
            .filter(({ transportadora }) => {
                const label = `${transportadora?.razon_social || ''} ${transportadora?.consecutivo || ''}`.toLowerCase();
                return !queryParts.length || queryParts.some((query) => label.includes(query));
            });
    }, [transportadoraSearch, transportadoras]);

    const resolveMenuOptions = useCallback((menuKey) => {
        if (!menuKey) {
            return [];
        }

        if (configSubMenuKeys[menuKey]) {
            return configSubMenuKeys[menuKey];
        }

        const resolvedEntry = Object.entries(configSubMenuKeys).find(([key, items]) => (
            key === menuKey || items.some(([, label]) => label === menuKey)
        ));

        return [...(resolvedEntry?.[1] || [])]
            .sort(([, leftLabel], [, rightLabel]) => (
                String(leftLabel || '').localeCompare(String(rightLabel || ''), 'es', { sensitivity: 'base' })
            ));
    }, [configSubMenuKeys]);

    const closeWindow = () => {
        setOpen(false);
    };

    const applyAccessConfiguration = useCallback((
        details = {},
        enabledWarehouses = [],
        roleOverride = '',
        warehousesSource = [],
        enabledTransportadoras = [],
        transportadorasSource = [],
    ) => {
        const almacenesHabilitados = new Set(enabledWarehouses);
        const transportadorasHabilitadas = new Set(enabledTransportadoras.map((item) => String(item)));

        if (formRef.current?.elements?.id_rol && roleOverride) {
            formRef.current.elements.id_rol.value = roleOverride;
        }

        setTagMenu(details.menu || []);
        setTagSubMenu(details.submenu || []);
        setTagBotones(details.botones || []);
        setSelectedMenuKey('');
        setMenuSelected([]);
        setCheckedState(
            warehousesSource.map((almacen) => almacenesHabilitados.has(almacen.consecutivo)),
        );
        setCheckedTransportadorasState(
            transportadorasSource.map((transportadora) => transportadorasHabilitadas.has(String(transportadora.id))),
        );
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [almacenesResponse, transportadorasResponse, usuariosResponse, perfilesResponse] = await Promise.all([
                    axios.get(endPoints.almacenes.list),
                    listarTransportadoras(),
                    listarUsuarios(),
                    listarModulos(PROFILE_PREFIX),
                ]);

                const almacenesData = almacenesResponse.data || [];
                const transportadorasData = transportadorasResponse || [];
                setAlmacenes(almacenesData);
                setTransportadoras(transportadorasData);
                setCheckedState(new Array(almacenesData.length).fill(false));
                setCheckedTransportadorasState(new Array(transportadorasData.length).fill(false));
                setPerfilesDisponibles(perfilesResponse || []);
                setUsuariosDisponibles(
                    (usuariosResponse || []).filter((item) => item?.username && item.username !== user?.username),
                );

                if (!user?.username) {
                    setTagMenu([]);
                    setTagSubMenu([]);
                    setTagBotones([]);
                    return;
                }

                const [almacenesUsuario, transportadorasUsuario, configUsuario] = await Promise.all([
                    axios.get(endPoints.usuarios.almacenes.findByUsername(user.username)),
                    listarTransportadorasPorUsuario(user.username),
                    encontrarModulo(user.username),
                ]);

                const almacenesHabilitados = new Set(
                    (almacenesUsuario?.data || [])
                        .filter((item) => item?.habilitado)
                        .map((item) => item.id_almacen),
                );
                const transportadorasHabilitadas = new Set(
                    (transportadorasUsuario || [])
                        .filter((item) => item?.habilitado)
                        .map((item) => item.id_transportadora),
                );

                const detalles = parseDetallesModulo(configUsuario);
                applyAccessConfiguration(
                    detalles,
                    Array.from(almacenesHabilitados),
                    user?.id_rol,
                    almacenesData,
                    Array.from(transportadorasHabilitadas),
                    transportadorasData,
                );
            } catch (error) {
                console.error("Error cargando datos del usuario:", error);
                window.alert("No fue posible cargar la informacion del usuario.");
            }
        };

        loadData();
    }, [applyAccessConfiguration, user]);

    const handleWarehouseChange = (position) => {
        setCheckedState((prev) => prev.map((item, index) => (
            index === position ? !item : item
        )));
    };

    const updateAllWarehouses = (nextValue) => {
        setCheckedState((prev) => prev.map(() => nextValue));
    };

    const updateVisibleWarehouses = (nextValue) => {
        const visibleIndexes = new Set(filteredWarehouses.map(({ index }) => index));
        setCheckedState((prev) => prev.map((item, index) => (
            visibleIndexes.has(index) ? nextValue : item
        )));
    };

    const handleTransportadoraChange = (position) => {
        setCheckedTransportadorasState((prev) => prev.map((item, index) => (
            index === position ? !item : item
        )));
    };

    const updateAllTransportadoras = (nextValue) => {
        setCheckedTransportadorasState((prev) => prev.map(() => nextValue));
    };

    const updateVisibleTransportadoras = (nextValue) => {
        const visibleIndexes = new Set(filteredTransportadoras.map(({ index }) => index));
        setCheckedTransportadorasState((prev) => prev.map((item, index) => (
            visibleIndexes.has(index) ? nextValue : item
        )));
    };

    const handleMenuSelection = (event) => {
        const selectedMenu = event.target.value;
        setSelectedMenuKey(selectedMenu);
        setMenuSelected(resolveMenuOptions(selectedMenu));
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
            const [sourceUser, sourceWarehouses, sourceTransportadoras, sourceConfig] = await Promise.all([
                axios.get(endPoints.usuarios.findOne(usuarioBase)),
                listarAlmacenesPorUsuario(usuarioBase),
                listarTransportadorasPorUsuario(usuarioBase),
                encontrarModulo(usuarioBase),
            ]);

            const detalles = parseDetallesModulo(sourceConfig);
            const almacenesHabilitados = new Set(
                (sourceWarehouses || [])
                    .filter((item) => item?.habilitado)
                    .map((item) => item.id_almacen),
            );
            const transportadorasHabilitadas = new Set(
                (sourceTransportadoras || [])
                    .filter((item) => item?.habilitado)
                    .map((item) => item.id_transportadora),
            );

            applyAccessConfiguration(
                detalles,
                Array.from(almacenesHabilitados),
                sourceUser?.data?.id_rol || '',
                almacenes,
                Array.from(transportadorasHabilitadas),
                transportadoras,
            );
        } catch (error) {
            console.error("Error al copiar permisos del usuario:", error);
            window.alert("No fue posible copiar los permisos y accesos del usuario seleccionado.");
        } finally {
            setIsCopyingAccess(false);
        }
    };

    const handleApplyProfile = async () => {
        if (!perfilBase) {
            window.alert("Selecciona un perfil para aplicar sus permisos.");
            return;
        }

        try {
            setIsApplyingProfile(true);
            const perfilConfig = await encontrarModulo(perfilBase);
            const detalles = parseDetallesModulo(perfilConfig);
            applyAccessConfiguration(
                detalles,
                Array.isArray(detalles?.almacenes) ? detalles.almacenes : [],
                detalles?.rol || '',
                almacenes,
                Array.isArray(detalles?.transportadoras) ? detalles.transportadoras : [],
                transportadoras,
            );
        } catch (error) {
            console.error("Error al aplicar perfil:", error);
            window.alert("No fue posible aplicar el perfil seleccionado.");
        } finally {
            setIsApplyingProfile(false);
        }
    };

    const handleSaveProfile = async () => {
        const slug = slugifyProfileName(nombrePerfil);
        if (!slug) {
            window.alert("Debes indicar un nombre valido para el perfil.");
            return;
        }

        const roleValue = formRef.current?.elements?.id_rol?.value || 'Operador';
        const almacenesSeleccionados = almacenes
            .filter((_, index) => checkedState[index])
            .map((item) => item.consecutivo);
        const transportadorasSeleccionadas = transportadoras
            .filter((_, index) => checkedTransportadorasState[index])
            .map((item) => item.id);
        const moduloPerfil = `${PROFILE_PREFIX}${slug}`;

        try {
            setIsSavingProfile(true);
            await encontrarModulo(moduloPerfil);
            await actualizarModulo({
                modulo: moduloPerfil,
                detalles: JSON.stringify({
                    nombre_perfil: nombrePerfil.trim(),
                    rol: roleValue,
                    menu: tagMenu,
                    submenu: tagSubMenu,
                    botones: tagBotones,
                    almacenes: almacenesSeleccionados,
                    transportadoras: transportadorasSeleccionadas,
                }),
            });

            const perfilesActualizados = await listarModulos(PROFILE_PREFIX);
            setPerfilesDisponibles(perfilesActualizados || []);
            setPerfilBase(moduloPerfil);
            setNombrePerfil('');
            window.alert("Perfil de permisos guardado correctamente.");
        } catch (error) {
            console.error("Error al guardar perfil:", error);
            window.alert("No fue posible guardar el perfil de permisos.");
        } finally {
            setIsSavingProfile(false);
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
                await Promise.all(
                    transportadoras.map((item, index) =>
                        cargarTransportadorasPorUsuario(payload.username, item.id, checkedTransportadorasState[index]),
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
                await Promise.all(
                    transportadoras.map((item, index) =>
                        cargarTransportadorasPorUsuario(user.username, item.id, checkedTransportadorasState[index]),
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
                                <div className="nav nav-tabs mb-3">
                                    {[
                                        ['basicos', 'Datos basicos'],
                                        ['permisos', 'Permisos'],
                                        ['almacenes', 'Almacenes'],
                                        ['transportadoras', 'Transportadoras'],
                                    ].map(([tabKey, label]) => (
                                        <button
                                            key={tabKey}
                                            type="button"
                                            className={`nav-link ${activeTab === tabKey ? 'active' : ''}`}
                                            onClick={() => setActiveTab(tabKey)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {activeTab === 'basicos' && (
                                    <>
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
                                            defaultValue={user?.id_rol === 'Super administrador' ? 'Super administrador' : 'Operador'}
                                        >
                                            {ROLE_OPTIONS.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
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

                                    </>
                                )}

                                {activeTab === 'permisos' && (
                                    <>
                                <div className="mt-4 pt-3 border-top">
                                    <h6 className="mb-3">Perfiles de permisos</h6>
                                    <div className="row g-3">
                                        <div className="col-12 col-md-8">
                                            <select
                                                id="perfilBase"
                                                name="perfilBase"
                                                className="form-select form-select-sm"
                                                value={perfilBase}
                                                onChange={(event) => setPerfilBase(event.target.value)}
                                            >
                                                <option value="">Seleccione un perfil</option>
                                                {perfilesDisponibles.map((item) => (
                                                    <option key={item.modulo} value={item.modulo}>
                                                        {buildProfileLabel(item)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm w-100"
                                                onClick={handleApplyProfile}
                                                disabled={!perfilBase || isApplyingProfile}
                                            >
                                                {isApplyingProfile ? 'Aplicando...' : 'Aplicar perfil'}
                                            </button>
                                        </div>
                                        <div className="col-12 col-md-8">
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={nombrePerfil}
                                                onChange={(event) => setNombrePerfil(event.target.value)}
                                                placeholder="Nombre para guardar el perfil actual"
                                            />
                                        </div>
                                        <div className="col-12 col-md-4">
                                            <button
                                                type="button"
                                                className="btn btn-outline-success btn-sm w-100"
                                                onClick={handleSaveProfile}
                                                disabled={!nombrePerfil.trim() || isSavingProfile}
                                            >
                                                {isSavingProfile ? 'Guardando...' : 'Guardar como perfil'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

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
                                                value={selectedMenuKey}
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
                                                    {[...tagSubMenu]
                                                        .sort((leftTag, rightTag) => (
                                                            String(leftTag || '').localeCompare(String(rightTag || ''), 'es', { sensitivity: 'base' })
                                                        ))
                                                        .map((tag) => (
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

                                    </>
                                )}

                                {activeTab === 'almacenes' && (
                                    <>
                                <div className="mt-4 pt-3 border-top">
                                    <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-3">
                                        <div>
                                            <h6 className="mb-1">Habilitar almacenes</h6>
                                            <div className="small text-muted">
                                                Busca por c&oacute;digo y marca varios almacenes de una sola vez.
                                            </div>
                                        </div>
                                        <div className="d-flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => updateAllWarehouses(true)}
                                            >
                                                Seleccionar todos
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={() => updateAllWarehouses(false)}
                                            >
                                                Limpiar todos
                                            </button>
                                        </div>
                                    </div>
                                    <div className="row g-2 align-items-end mb-3">
                                        <div className="col-12 col-lg-4">
                                            <label htmlFor="almacenSearch" className="form-label">Buscar almac&eacute;n</label>
                                            <input
                                                id="almacenSearch"
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder="Ej: 513, 502, BAN"
                                                value={almacenSearch}
                                                onChange={(event) => setAlmacenSearch(event.target.value)}
                                            />
                                            <div className="form-text">
                                                Acepta comas, espacios o saltos de l&iacute;nea.
                                            </div>
                                        </div>
                                        <div className="col-12 col-lg">
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => updateVisibleWarehouses(true)}
                                                    disabled={!filteredWarehouses.length}
                                                >
                                                    Seleccionar visibles
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => updateVisibleWarehouses(false)}
                                                    disabled={!filteredWarehouses.length}
                                                >
                                                    Limpiar visibles
                                                </button>
                                                <span className="small text-muted align-self-center">
                                                    {filteredWarehouses.length} de {almacenes.length} almacenes visibles
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        {filteredWarehouses.map(({ almacen, index }) => (
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
                                        {!filteredWarehouses.length && (
                                            <div className="col-12">
                                                <div className="alert alert-light border mb-0 py-2">
                                                    No hay almacenes que coincidan con la b&uacute;squeda.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                    </>
                                )}

                                {activeTab === 'transportadoras' && (
                                    <div className="mt-4 pt-3 border-top">
                                        <div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3 mb-3">
                                            <div>
                                                <h6 className="mb-1">Habilitar transportadoras</h6>
                                                <div className="small text-muted">
                                                    Busca por nombre o consecutivo y marca las transportadoras disponibles para el usuario.
                                                </div>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => updateAllTransportadoras(true)}
                                                >
                                                    Seleccionar todas
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => updateAllTransportadoras(false)}
                                                >
                                                    Limpiar todas
                                                </button>
                                            </div>
                                        </div>
                                        <div className="row g-2 align-items-end mb-3">
                                            <div className="col-12 col-lg-4">
                                                <label htmlFor="transportadoraSearch" className="form-label">Buscar transportadora</label>
                                                <input
                                                    id="transportadoraSearch"
                                                    type="text"
                                                    className="form-control form-control-sm"
                                                    placeholder="Ej: BAN, DHL, 001"
                                                    value={transportadoraSearch}
                                                    onChange={(event) => setTransportadoraSearch(event.target.value)}
                                                />
                                            </div>
                                            <div className="col-12 col-lg">
                                                <div className="d-flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() => updateVisibleTransportadoras(true)}
                                                        disabled={!filteredTransportadoras.length}
                                                    >
                                                        Seleccionar visibles
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() => updateVisibleTransportadoras(false)}
                                                        disabled={!filteredTransportadoras.length}
                                                    >
                                                        Limpiar visibles
                                                    </button>
                                                    <span className="small text-muted align-self-center">
                                                        {filteredTransportadoras.length} de {transportadoras.length} transportadoras visibles
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row g-3">
                                            {filteredTransportadoras.map(({ transportadora, index }) => {
                                                const label = transportadora?.razon_social || transportadora?.consecutivo || `Transportadora ${transportadora?.id}`;
                                                return (
                                                    <div key={transportadora.id} className="col-12 col-md-6 col-xl-4">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={checkedTransportadorasState[index] || false}
                                                                onChange={() => handleTransportadoraChange(index)}
                                                                name={`transportadora-${transportadora.id}`}
                                                                id={`transportadora-${transportadora.id}`}
                                                            />
                                                            <label
                                                                className="form-check-label"
                                                                htmlFor={`transportadora-${transportadora.id}`}
                                                            >
                                                                {label}
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {!filteredTransportadoras.length && (
                                                <div className="col-12">
                                                    <div className="alert alert-light border mb-0 py-2">
                                                        No hay transportadoras que coincidan con la b&uacute;squeda.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
