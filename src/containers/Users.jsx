import React from 'react';

//Components



//CSS
import styles from '../styles/Listar.module.css';


const Users = () => {
    return (
        <div>

            <div className={styles.cajaBotones}>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-success btn-sm"><span>+ </span>Nuevo</button>
                </div>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-danger btn-sm"><span>- </span>Eliminar</button>
                </div>
                <div className={styles.buscar}>
                    <input className="form-control form-control-sm" type="text" placeholder="Buscar"></input>
                </div>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-light btn-sm">Buscar</button>
                </div>
                <div className={styles.botones}>
                    <button type="button" className="btn btn-light btn-sm">Ordenar</button>
                </div>
            </div>

            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Cod</th>
                        <th scope="col">Usurio</th>
                        <th scope="col">Rol</th>
                        <th scope="col">Finca</th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">1</th>
                        <td>Mark</td>
                        <td>super administrador</td>
                        <td>Macondo</td>
                        <td>
                            <button type="button" className="btn btn-warning btn-sm">Editar</button>
                        </td>
                        <td>
                            <button type="button" className="btn btn-danger btn-sm">Activar</button>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">2</th>
                        <td>Jacob</td>
                        <td>administrador</td>
                        <td>Lola</td>
                        <td>
                            <button type="button" className="btn btn-warning btn-sm">Editar</button>
                        </td>
                        <td>
                            <button type="button" className="btn btn-success btn-sm">Desactivar</button>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">3</th>
                        <td>Larry</td>
                        <td>operador</td>
                        <td>San Francisco</td>
                        <td>
                            <button type="button" className="btn btn-warning btn-sm">Editar</button>
                        </td>
                        <td>
                            <button type="button" className="btn btn-success btn-sm">Desactivar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Users;
