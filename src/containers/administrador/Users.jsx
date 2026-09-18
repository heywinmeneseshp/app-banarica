import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaEdit, FaKey, FaUserSlash } from 'react-icons/fa';
//Services
import { actualizarUsuario, regenerarPasswordLote } from '@services/api/usuarios';
import endPoints from '@services/api';
import { fetchAuthenticatedProfile } from '@services/api/auth';
//Components
import NuevoUsuario from '@components/administrador/NuevoUsuario';
import Alertas from '@components/shared/Alertas';
import Paginacion from '@components/Paginacion';
//Hooks
import useAlert from '@hooks/useAlert';
import excel from "@hooks/useExcel";
//CSS
import styles from '@styles/Listar.module.css';

const Users = () => {
    const buscardorRef = useRef(null);
const [currentUser, setCurrentUser] = useState(null);
const [editUser, setEditUser] = useState(null);
const [usuarios, setUsuarios] = useState([]);
const [statusFilter, setStatusFilter] = useState('todos');
const { alert, setAlert, toogleAlert } = useAlert();
const [open, setOpen] = useState(false);
const [pagination, setPagination] = useState(1);
const [total, setTotal] = useState(0);
const [seleccionados, setSeleccionados] = useState([]);
const [regenerando, setRegenerando] = useState(false);
const [passwordsGeneradas, setPasswordsGeneradas] = useState(null);
const limit = 10;

const listarUsurios = useCallback(async () => {
    const username = buscardorRef.current?.value || '';
    const res = await axios.get(endPoints.usuarios.pagination(pagination, limit, username));
    setTotal(res.data.total);
    setUsuarios(res.data.data);
}, [pagination]);

useEffect(() => {
    const fetchData = async () => {
        try {
            const profile = await fetchAuthenticatedProfile();
            if (!profile) {
                return;
            }

            if (profile.usuario.isBlock) {
                window.alert("El usuario esta deshabilitado, por favor comuniquese con el administrador");
                return;
            }

            setCurrentUser(profile.usuario);
            listarUsurios();
        } catch (error) {
            window.alert("Error al cargar los usuarios: " + error.message);
        }
    };

    fetchData();
}, [alert, listarUsurios]);

    const onChangeBuscador = () => {
        setPagination(1);
        listarUsurios();
    };

    const handleStatusFilter = (event) => {
        setStatusFilter(event.target.value);
    };

    const handleNuevo = async () => {
        setOpen(true);
        setEditUser(null);
    };

    const handleEditar = async (usuario) => {
        setOpen(true);
        setEditUser(usuario);
    };

    const onDescargar = async () => {
        const { data } = await axios.get(endPoints.usuarios.list);
        excel(data, "Usuarios", "Usuarios");
    };

    const handleActivar = async (usuario) => {
        try {
            const nextAction = usuario.isBlock ? "activar" : "deshabilitar";
            const deleteUser = window.confirm(`Esta seguro que desea ${nextAction} el usuario?`);
            if (!deleteUser) return;
            const changes = { isBlock: !usuario.isBlock };
            await actualizarUsuario(usuario.username, changes);
            setAlert({
                active: true,
                mensaje: 'El usuario "' + usuario.username + '" se ha actualizado',
                color: "success",
                autoClose: true
            });
        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error',
                color: "danger",
                autoClose: true
            });
        }
    };

    const usuariosFiltrados = usuarios.filter((usuarioItem) => {
        if (statusFilter === 'activos') {
            return !usuarioItem.isBlock;
        }

        if (statusFilter === 'deshabilitados') {
            return Boolean(usuarioItem.isBlock);
        }

        return true;
    });

    const todosSeleccionados = usuariosFiltrados.length > 0 &&
        usuariosFiltrados.every((usuarioItem) => seleccionados.includes(usuarioItem.username));

    const handleCheckUsuario = (username) => {
        setSeleccionados((prev) =>
            prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
        );
    };

    const handleCheckAll = () => {
        if (todosSeleccionados) {
            setSeleccionados((prev) => prev.filter((u) => !usuariosFiltrados.some((usuarioItem) => usuarioItem.username === u)));
        } else {
            setSeleccionados((prev) => Array.from(new Set([...prev, ...usuariosFiltrados.map((usuarioItem) => usuarioItem.username)])));
        }
    };

    const handleRegenerarLote = async () => {
        if (seleccionados.length === 0) return;
        const confirmar = window.confirm(`Esta seguro que desea regenerar la contraseña de ${seleccionados.length} usuario(s)?`);
        if (!confirmar) return;
        try {
            setRegenerando(true);
            const { data } = await regenerarPasswordLote(seleccionados);
            setPasswordsGeneradas(data);
            setSeleccionados([]);
        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error al regenerar las contraseñas',
                color: "danger",
                autoClose: true
            });
        } finally {
            setRegenerando(false);
        }
    };

    return (
        <div className='container-fluid px-0'>
            <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
            <h3>Usuarios</h3>
            <div className="row g-2 align-items-center mb-3">
                <div className="col-12 col-md-2">
                    <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                </div>
                <div className="col-12 col-md-5">
                    <input ref={buscardorRef} onChange={onChangeBuscador} className="form-control form-control-sm" type="text" placeholder="Buscar"></input>
                </div>
                <div className="col-12 col-md-3">
                    <select
                        className="form-select form-select-sm"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                    >
                        <option value="todos">Todos</option>
                        <option value="activos">Activos</option>
                        <option value="deshabilitados">Deshabilitados</option>
                    </select>
                </div>
                <div className="col-12 col-md-2">
                    <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
                </div>
            </div>

            <div className="row g-2 align-items-center mb-3">
                <div className="col-12 col-md-4">
                    <button
                        onClick={handleRegenerarLote}
                        type="button"
                        className="btn btn-outline-primary btn-sm w-100"
                        disabled={seleccionados.length === 0 || regenerando}
                    >
                        {regenerando ? 'Regenerando...' : `Regenerar contraseña (${seleccionados.length})`}
                    </button>
                </div>
            </div>

            <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
                <thead className={styles.letter}>
                    <tr>
                        <th scope="col" className="text-center align-middle">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={todosSeleccionados}
                                onChange={handleCheckAll}
                                aria-label="Seleccionar todos"
                            />
                        </th>
                        <th scope="col" className="text-center align-middle">Cod</th>
                        <th scope="col" className="text-center align-middle">Nombre</th>
                        <th scope="col" className="text-center align-middle">Usuario</th>
                        <th scope="col" className="text-center align-middle">Rol</th>
                        <th scope="col" className="text-center align-middle">Tel</th>
                        <th scope="col" className="text-center align-middle">email</th>
                        <th scope="col" className="text-center align-middle"></th>
                        <th scope="col" className="text-center align-middle"></th>
                    </tr>
                </thead>
                <tbody className={styles.letter}>
                    {usuariosFiltrados.map((usuario, index) => {
                        const allowDelete = usuario.username !== currentUser?.username;

                        return (
                            <tr key={index}>
                                <td className="text-center align-middle">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={seleccionados.includes(usuario.username)}
                                        onChange={() => handleCheckUsuario(usuario.username)}
                                        aria-label={`Seleccionar ${usuario.username}`}
                                    />
                                </td>
                                <td className="text-center align-middle">{usuario.id}</td>
                                <td className="text-center align-middle">{usuario.nombre + " " + usuario.apellido}</td>
                                <td className="text-center align-middle">{usuario.username}</td>
                                <td className="text-center align-middle">{usuario.id_rol}</td>
                                <td className="text-center align-middle">{usuario.tel}</td>
                                <td className="text-center align-middle">{usuario.email}</td>
                                <td className="text-center align-middle">
                                    <button
                                        onClick={() => handleEditar(usuario)}
                                        type="button"
                                        className="btn p-0 border-0 bg-transparent text-warning d-inline-flex align-items-center justify-content-center"
                                        title="Editar usuario"
                                        aria-label="Editar usuario"
                                        style={{ fontSize: '1.1rem' }}
                                    >
                                        <FaEdit />
                                    </button>
                                </td>
                                <td className="text-center align-middle">
                                    {allowDelete && (
                                        <button
                                            onClick={() => handleActivar(usuario)}
                                            type="button"
                                            className={`btn p-0 border-0 bg-transparent d-inline-flex align-items-center justify-content-center ${usuario.isBlock ? 'text-danger' : 'text-success'}`}
                                            title={usuario.isBlock ? 'Activar usuario' : 'Deshabilitar usuario'}
                                            aria-label={usuario.isBlock ? 'Activar usuario' : 'Deshabilitar usuario'}
                                            style={{ fontSize: '1.1rem' }}
                                        >
                                            {usuario.isBlock ? <FaUserSlash /> : <FaCheckCircle />}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoUsuario setOpen={setOpen} setAlert={setAlert} user={editUser} />}
            {passwordsGeneradas && (
                <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <FaKey className="me-2" />Contraseñas regeneradas
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setPasswordsGeneradas(null)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted small">Copie y comparta estas contraseñas con cada usuario. No se volverán a mostrar.</p>
                                <table className="table table-sm table-bordered align-middle">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Contraseña</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {passwordsGeneradas.map((item) => (
                                            <tr key={item.username}>
                                                <td>{item.username}</td>
                                                <td>
                                                    {item.password
                                                        ? <code>{item.password}</code>
                                                        : <span className="text-danger">{item.error}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPasswordsGeneradas(null)}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
