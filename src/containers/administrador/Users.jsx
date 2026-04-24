import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaEdit, FaUserSlash } from 'react-icons/fa';
//Services
import { actualizarUsuario } from '@services/api/usuarios';
import endPoints from '@services/api';
import { fetchAuthenticatedProfile } from '@services/api/auth';
//Components
import NuevoUsuario from '@components/administrador/NuevoUsuario';
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
//Hooks
import useAlert from '@hooks/useAlert';
import excel from "@hooks/useExcel";
//CSS
import styles from '@styles/Listar.module.css';

const Users = () => {
    const buscardorRef = useRef(null);
    const [user, setUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [statusFilter, setStatusFilter] = useState('todos');
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
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

                setUser(profile.usuario);
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
        setUser(null);
    };

    const handleEditar = async (usuario) => {
        setOpen(true);
        setUser(usuario);
    };

    const onDescargar = async () => {
        const { data } = await axios.get(endPoints.usuarios.list);
        excel(data, "Usuarios", "Usuarios");
    };

    const handleActivar = (usuario) => {
        try {
            const nextAction = usuario.isBlock ? "activar" : "deshabilitar";
            const deleteUser = window.confirm(`Esta seguro que desea ${nextAction} el usuario?`);
            if (!deleteUser) return;
            const changes = { isBlock: !usuario.isBlock };
            actualizarUsuario(usuario.username, changes);
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

            <div className="table-responsive">
            <table className="table table-striped table-bordered align-middle">
                <thead className={styles.letter}>
                    <tr>
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
                        const allowDelete = usuario.username !== user?.username;

                        return (
                            <tr key={index}>
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
            {open && <NuevoUsuario setOpen={setOpen} setAlert={setAlert} user={user} />}
        </div>
    );
};

export default Users;
