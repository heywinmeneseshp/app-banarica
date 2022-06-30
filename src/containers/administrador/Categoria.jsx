import React from 'react';
import { useContext } from 'react';
import AppContext from '@context/AppContext';

//Components

//CSS
import styles from '@styles/Listar.module.css';


const Categoria = () => {

 
    const { initialAdminMenu } = useContext(AppContext);
    const handleNuevo = () => {
        initialAdminMenu.hadleOpenTable("categoria");
    };

    return (
        <>
            <div>
                <h3>Categorías</h3>
                <div className={styles.cajaBotones}>
                    <div className={styles.botones}>
                            <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
                    </div>
                    <div className={styles.botones}>
                        <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
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

                <table className="table">
                    <thead className={styles.letter}>
                        <tr>
                            <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
                            <th scope="col">Código</th>
                            <th scope="col">Nombre</th>
                            <th scope="col"></th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody className={styles.letter}>
                        <tr>
                            <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                            <td>001</td>
                            <td>Embalaje</td>
                            <td>
                                <button type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                            </td>
                            <td>
                                <button type="button" className="btn btn-danger btn-sm w-80">Activar</button>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                            <td>001</td>
                            <td>Embalaje</td>
                            <td>
                                <button type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                            </td>
                            <td>
                                <button type="button" className="btn btn-danger btn-sm w-80">Activar</button>
                            </td>
                        </tr>
                        <tr>
                            <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                            <td>001</td>
                            <td>Embalaje</td>
                            <td>
                                <button type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                            </td>
                            <td>
                                <button type="button" className="btn btn-danger btn-sm w-80">Activar</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default Categoria;
