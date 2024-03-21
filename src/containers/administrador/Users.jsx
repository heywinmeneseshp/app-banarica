import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookie from 'js-cookie';
//Services
import { actualizarUsuario } from '@services/api/usuarios';
import endPoints from '@services/api';
//Components
import NuevoUsuario from '@components/administrador/NuevoUsuario';
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
//Hooks
import useAlert from '@hooks/useAlert';
import excel from "@hooks/useExcel";
//Bootstrap
//CSS
import styles from '@styles/Listar.module.css';

const Users = () => {
    const buscardorRef = useRef(null);
    const [user, setUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;


    useEffect(() => {
        const fetchData = async () => {
            try {
                var token = Cookie.get('token');
                axios.defaults.headers.Authorization = 'Bearer ' + token;
                const res = await axios.get(endPoints.auth.profile);
                if (res.data.usuario.isBlock) {
                    window.alert("El usuario está deshabilitado, por favor comuníquese con el administrador");
                    return;
                }
                setUser(res.data.usuario);
                listarUsurios();
            } catch (error) {
                window.alert("Error al cargar los usuarios: " + error.message);
            }
        };
    
        fetchData();
    }, [alert, pagination]);
    

    

    async function listarUsurios() {
        const username = buscardorRef.current.value;
        const res = await axios.get(endPoints.usuarios.pagination(pagination, limit, username));
        setTotal(res.data.total);
        setUsuarios(res.data.data);
    }

    const onChangeBuscador = () => {
        setPagination(1);
        listarUsurios();
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
        console.log(data);
        excel(data, "Usuarios", "Usuarios");
    };

    const handleActivar = (usuario) => {
        try {
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

    return (
        <div className='container'>
            <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
            <h3>Usuarios</h3>
            <div className={styles.cajaBotones}>
                <div className={styles.botones}>
                    <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                </div>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
                </div>
                <div className={styles.buscar}>
                    <input ref={buscardorRef} onChange={onChangeBuscador} className="form-control form-control-sm w-90" type="text" placeholder="Buscar"></input>
                </div>
                <div className={styles.botones}>
                    <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
                </div>
            </div>

            <table className="table">
                <thead className={styles.letter}>
                    <tr>
                        <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
                        <th scope="col">Cod</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Usuario</th>
                        <th scope="col">Rol</th>
                        <th scope="col">Tel</th>
                        <th scope="col">email</th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody className={styles.letter}>
                    {usuarios.map((usuario, index) => (
                        <tr key={index} >
                            <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                            <td >{usuario.id}</td>
                            <td>{usuario.nombre + " " + usuario.apellido}</td>
                            <td>{usuario.username}</td>
                            <td>{usuario.id_rol}</td>
                            <td>{usuario.tel}</td>
                            <td>{usuario.email}</td>
                            <td>
                                <button onClick={() => handleEditar(usuario)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                            </td>
                            <td>
                                {usuario.isBlock && <button onClick={() => handleActivar(usuario)} type="button" className="btn btn-danger btn-sm w-80">Activar</button>}
                                {!usuario.isBlock && <button onClick={() => handleActivar(usuario)} type="button" className="btn btn-success btn-sm w-80">Desactivar</button>}
                            </td>
                        </tr>)
                    )}

                </tbody>
            </table>
            <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
            {open && <NuevoUsuario setOpen={setOpen} setAlert={setAlert} user={user} />}

        </div>
    );
};

export default Users;
