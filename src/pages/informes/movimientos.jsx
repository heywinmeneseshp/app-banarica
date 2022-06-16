import React from "react";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { Pagination, TabContainer } from "react-bootstrap";

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
            <div className={styles.contenedor1}>

              <div className={styles.grupo}>
                <label for="Username">Almacen</label>
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
                <label for="Username">Categoría</label>
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
                <label for="Username">Artículo</label>
                <div>
                  <input type="text" className="form-control form-control-sm" id="contraseña"></input>
                </div>
              </div>

            </div>

            <div className={styles.contenedor2}>

              <div className={styles.grupo}>
                <label for="Username">Movimiento</label>
                <div>
                  <select className="form-select form-select-sm">
                    <option>All</option>
                    <option>Ajuste</option>
                    <option>Devolución</option>
                    <option>Liquidación</option>
                    <option>Exportación</option>
                  </select>
                </div>
              </div>

              <div className={styles.grupo}>
                <label for="Username">Fecha Inicial</label>
                <div>
                  <input type="date" className="form-control form-control-sm" id="contraseña"></input>
                </div>
              </div>

              <div className={styles.grupo}>
                <label for="Username">Fecha Final</label>
                <div>
                  <input type="date" className="form-control form-control-sm" id="contraseña"></input>
                </div>
              </div>


              <Button className={styles.button} variant="primary" size="sm">
                Descargar
              </Button>
            </div>
          </div>


          <Table className={styles.tabla} striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Cons</th>
                <th>Almacen</th>
                <th>Cod</th>
                <th>Artículo</th>
                <th>Categoría</th>
                <th>Movimiento</th>
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
                <td>Liquidación</td>
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
                <td>Liquidación</td>
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
                <td>Liquidación</td>
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
  )
}

