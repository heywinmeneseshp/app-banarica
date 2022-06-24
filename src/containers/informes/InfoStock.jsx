import React from "react";
import Table from 'react-bootstrap/Table';

//Components
import SecondLayout from "@layout/SecondLayout";


//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";
import { Pagination } from "react-bootstrap";

export default function InfoStock() {

  const data = {
    cod_almacen: "504",
    cod_producto: "001",
    producto: "Tapa OT 18KG",
    categoria: "Carton",
    cantidad: 1116,
    costo_unidad: 3400
  }

  return (
    <>
      <Container >

        <div className={styles.contenedor1}>

          <div className={styles.grupo}>
            <label htmlFor="Username">Almacen</label>
            <div>
              <select className="form-select form-select-sm">
                <option>All</option>
                <option>Macondo</option>
                <option>Maria Luisa</option>
                <option>Lucia</option>
                <option>Florida</option>
              </select>
            </div>
          </div>

          <div className={styles.grupo}>
            <label htmlFor="Username">Categoría</label>
            <div>
              <select className="form-select form-select-sm">
                <option>All</option>
                <option>Cartón</option>
                <option>Insumos</option>
                <option>Papelería</option>
              </select>
            </div>
          </div>

          <div className={styles.grupo}>
            <label htmlFor="Username">Artículo</label>
            <div>
              <input type="text" className="form-control form-control-sm" id="contraseña"></input>
            </div>
          </div>

        </div>

        <Table className={styles.tabla} striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Almacen</th>
              <th>Código</th>
              <th>Artículo</th>
              <th>Categoría</th>
              <th>Unidades</th>
              <th>Costo unidad</th>
              <th>Costo total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.almacen}</td>
              <td>{data.cod_producto}</td>
              <td>{data.producto}</td>
              <td>{data.categoria}</td>
              <td>{data.cantidad}</td>
              <td>COP {data.costo_unidad}</td>
              <td>COP {data.cantidad * data.costo_unidad}</td>
            </tr>
            <tr>
              <td>{data.cod_almacen}</td>
              <td>{data.cod_producto}</td>
              <td>{data.producto}</td>
              <td>{data.categoria}</td>
              <td>{data.cantidad}</td>
              <td>COP {data.costo_unidad}</td>
              <td>COP {data.cantidad * data.costo_unidad}</td>
            </tr>
            <tr>
              <td>{data.cod_almacen}</td>
              <td>{data.cod_producto}</td>
              <td>{data.producto}</td>
              <td>{data.categoria}</td>
              <td>{data.cantidad}</td>
              <td>COP {data.costo_unidad}</td>
              <td>COP {data.cantidad * data.costo_unidad}</td>
            </tr>
          </tbody>
        </Table>

        <div className={styles.pagination}>
          <Pagination>
            <Pagination.First />
            <Pagination.Prev />
            <Pagination.Item>{1}</Pagination.Item>
            <Pagination.Ellipsis />

            <Pagination.Item>{4}</Pagination.Item>
            <Pagination.Item>{5}</Pagination.Item>
            <Pagination.Item active>{6}</Pagination.Item>
            <Pagination.Item>{7}</Pagination.Item>
            <Pagination.Item disabled>{8}</Pagination.Item>

            <Pagination.Ellipsis />
            <Pagination.Item>{10}</Pagination.Item>
            <Pagination.Next />
            <Pagination.Last />
          </Pagination>
        </div>

      </Container>
    </>
  );
}

