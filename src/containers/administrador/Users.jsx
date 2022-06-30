import React from 'react';
import { useContext } from 'react';
import AppContext from "@context/AppContext";

//Components



//CSS
import styles from '@styles/Listar.module.css';


const Users = () => {

    const { initialAdminMenu } = useContext(AppContext);
    const handleNuevo = () => {
        initialAdminMenu.hadleOpenTable("usuario");
    };

    return (
        <div>
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

            <table class="table">
                <thead className={styles.letter}>
                    <tr>
                        <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
                        <th scope="col">Cod</th>
                        <th scope="col">Usurio</th>
                        <th scope="col">Rol</th>
                        <th scope="col">Finca</th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody className={styles.letter}>
                    <tr>
                        <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                        <td scope="row">1</td>
                        <td>Mark</td>
                        <td>super administrador</td>
                        <td>Macondo</td>
                        <td>
                            <button type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                        </td>
                        <td>
                            <button type="button" className="btn btn-danger btn-sm w-80">Activar</button>
                        </td>
                    </tr>
                    <tr>
                        <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                        <td scope="row">2</td>
                        <td>Jacob</td>
                        <td>administrador</td>
                        <td>Lola</td>
                        <td>
                            <button type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                        </td>
                        <td>
                            <button type="button" className="btn btn-success btn-sm w-80">Desactivar</button>
                        </td>
                    </tr>
                    <tr>
                        <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                        <th scope="row">3</th>
                        <td>Larry</td>
                        <td>operador</td>
                        <td>San Francisco</td>
                        <td>
                            <button type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                        </td>
                        <td>
                            <button type="button" className="btn btn-success btn-sm w-80">Desactivar</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Users;
