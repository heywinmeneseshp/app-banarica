import React from "react";
import Table from 'react-bootstrap/Table';

//Components
import SecondLayout from "@layout/SecondLayout";


//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";
import { Pagination } from "react-bootstrap";

export default function traslado() {
  return (
    <>
      <SecondLayout>
        <Container className={styles.contenedor} >

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
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
              </tr>
              <tr>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
              </tr>
              <tr>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
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
      </SecondLayout>
    </>
  );
}

