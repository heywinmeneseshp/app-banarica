import React from "react";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { Pagination } from "react-bootstrap";

//Components
import SecondLayout from "@layout/SecondLayout";


//CSS
import styles from '@styles/informes/informes.module.css';
import { Container } from "react-bootstrap";


export default function InfoMovimientos() {

  const data = {
    consecutivo: "0001",
    cod_almacen: "502",
    cod_producto: "001",
    producto: "Division",
    categoria: "Cartón",
    movimientio: "Liquidación",
    motivo: "mal estado",
    cantidad: 10,
    costo_unidad: 3400,
    username: "heywin",
    fecha: "25-01-2022"
  }

  return (
    <>
      <Container >
        <div>
        <h2>Informe de movimientos</h2>
        <div className="line"></div>
          <div className={styles.contenedor3}>

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

            <div className={styles.grupo}>
              <label htmlFor="Username">Fecha Inicial</label>
              <div>
                <input type="date" className="form-control form-control-sm" id="contraseña"></input>
              </div>
            </div>

            <div className={styles.grupo}>
              <label htmlFor="Username">Fecha Final</label>
              <div>
                <input type="date" className="form-control form-control-sm" id="contraseña"></input>
              </div>
            </div>

          </div>

          <div className={styles.contenedor3}>

            <div className={styles.grupo}>
              <label htmlFor="Username">Movimiento</label>
              <div>
                <select className="form-select form-select-sm">
                  <option>All</option>
                  <option>Recepción</option>
                  <option>Ajuste</option>
                  <option>Devolución</option>
                  <option>Liquidación</option>
                  <option>Exportación</option>
                </select>
              </div>
            </div>

            <Button className={styles.button} variant="success" size="sm">
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
              <th>Motivo</th>
              <th>Und</th>
              <th>Costo und</th>
              <th>Costo total</th>
              <th>Usernama</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.consecutivo}</td>
              <td>{data.cod_almacen}</td>
              <td>{data.cod_producto}</td>
              <td>{data.producto}</td>
              <td>{data.categoria}</td>
              <td>{data.movimientio}</td>
              <td>{data.motivo}</td>
              <td>{data.cantidad}</td>
              <td>COP {data.costo_unidad}</td>
              <td>COP {data.costo_unidad * data.cantidad}</td>
              <td>{data.username}</td>
              <td>{data.fecha}</td>
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

