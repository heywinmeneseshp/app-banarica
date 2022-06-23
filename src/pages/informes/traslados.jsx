import React from "react";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { Pagination } from "react-bootstrap";

//Components
import SecondLayout from "@layout/SecondLayout";


//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";


export default function movimientos() {
  return (
    <>
      <SecondLayout>
        <Container className={styles.contenedor} >
          <div>
            <div className={styles.contenedor3}>

              <div className={styles.grupo}>
                <label htmlFor="Username">Origen</label>
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
                <label htmlFor="Username">Destino</label>
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
                <label htmlFor="Username">Fecha inicial</label>
                <div>
                  <input type="date" className="form-control form-control-sm" id="contraseña"></input>
                </div>
              </div>

              <div className={styles.grupo}>
                <label htmlFor="Username">Fecha final</label>
                <div>
                  <input type="date" className="form-control form-control-sm" id="contraseña"></input>
                </div>
              </div>

              <Button className={styles.button} variant="primary" size="sm">
                Buscar
              </Button>

            </div>

            <div className={styles.contenedor3}>

              <div className={styles.grupo}>
                <label htmlFor="Username">Consecutivo</label>
                <div>
                  <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                </div>
              </div>

              <Button className={styles.button} variant="warning" size="sm">
                Editar documento
              </Button>

              <Button className={styles.button} variant="success" size="sm">
                Descargar documento
              </Button>

            </div>
          </div>


          <Table className={styles.tabla} striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Cons.</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Artículo</th>
                <th>Categoría</th>
                <th>Und</th>
                <th>Usernama</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0123</td>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
                <td>heywin</td>
                <td>25-10-2021</td>
              </tr>
              <tr>
                <td>0123</td>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
                <td>heywin</td>
                <td>25-10-2021</td>
              </tr>
              <tr>
                <td>0123</td>
                <td>504</td>
                <td>001</td>
                <td>Tapa OT 18KG</td>
                <td>Cartón</td>
                <td>1116</td>
                <td>heywin</td>
                <td>25-10-2021</td>
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

