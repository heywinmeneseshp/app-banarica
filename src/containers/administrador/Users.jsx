import React from 'react';
import { useContext, useState, useEffect } from 'react';
import AppContext from "@context/AppContext";
import endPoints from '@services/api';
import axios from 'axios';
//Components
import NuevoUsuario from '@components/administrador/NuevoUsuario';
import Alertas from '@assets/almacen/Alertas';
import useAlert from '@hooks/useAlert';

//CSS
import styles from '@styles/Listar.module.css';


const Users = () => {
    const [user, setUser] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const {alert, setAlert, toogleAlert} = useAlert();
    const [open, setOpen] = useState(false)
 
    useEffect(()=>{
        async function listarUsurios() {
            const res = await axios.get(endPoints.usuarios.list);
            setUsuarios(res.data)
        }
        try {
            listarUsurios()
        } catch (e) {
            console.log(e);
        } 
    }, [alert])

    const handleNuevo = () => {
        setOpen(true);
    };
    
    const handleEditar = (usuario) => {
        setOpen(true);
        setUser(usuario)
    };

    return (
        <div>
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
                    <input className="form-control form-control-sm w-80" type="text" placeholder="Buscar"></input>
                </div>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-light btn-sm">Buscar</button>
                </div>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-light btn-sm">Ordenar</button>
                </div>
            </div>

            <table className="table">
                <thead className={styles.letter}>
                    <tr>
                        <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
                        <th scope="col">Cod</th>
                        <th scope="col">Nombre</th>
                        <th scope="col">Usurio</th>
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
                            <td scope="row">{usuario.id}</td>
                            <td>{usuario.nombre + " " + usuario.apellido}</td>
                            <td>{usuario.username}</td>
                            <td>{usuario.id_rol}</td>
                            <td>{usuario.tel}</td>
                            <td>{usuario.email}</td>
                            <td>
                                <button onClick={() => handleEditar(usuario)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                            </td>
                            <td>
                                <button type="button" className="btn btn-danger btn-sm w-80">Activar</button>
                            </td>
                        </tr>)
                    )}

                </tbody>
            </table>

            {open && <NuevoUsuario setOpen={setOpen} setAlert={setAlert} user={user} />}
 
        </div>
    )
}

export default Users;
