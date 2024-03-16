import React, { useRef, useState, useEffect } from 'react';

//Hooks
import useAlert from '@hooks/useAlert';
//Components
import Paginacion from '@components/shared/Tablas/Paginacion';
import NuevoItem from '@components/shared/Formularios/Formularios';
import Alertas from '@assets/Alertas';
//CSS
import styles from '@styles/Listar.module.css';
import excel from '@hooks/useExcel';

export default function Tablas({ encabezados, actualizar, listar, paginar, crear, titulo, arrayList }) {
  const ItemdorRef = useRef();
  const [item, setItem] = useState(null);
  const [items, setItems] = useState([]);
  const [labelForm, setLabelForm] = useState();

  const { alert, setAlert, toogleAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    let labels = Object.assign({}, encabezados);
    delete labels.Editar;
    delete labels.Activar;
    setLabelForm(labels);
    listrasItems();
  }, [alert, pagination, open]);

  async function listrasItems() {
    let nombre = ItemdorRef.current.value;
    const res = await paginar(pagination, limit, nombre);
    console.log(res);
    setItems(res.data);
    setTotal(res.total);
  }

  const handleNuevo = () => {
    setOpen(true);
    setItem(null);
  };

  const handleEditar = (item) => {
    setOpen(true);
    setItem(item);
  };

  const Item = async () => {
    setPagination(1);
    listrasItems();
  };

  const onDescargar = async () => {
    const data = await listar();
    excel(data, "Proveedores", "Proveedores");
  };

  const handleActivar = (item) => {
    try {
      const changes = { activo: !item.activo };
      actualizar(item.id, changes);
      setAlert({
        active: true,
        mensaje: 'El item "' + item.id + '" se ha actualizado',
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
    <>
      <div>
        <Alertas alert={alert} handleClose={toogleAlert}></Alertas>
        <h3>{titulo}</h3>
        <div className={styles.cajaBotones}>
          <div className={styles.botones}>
            <button onClick={handleNuevo} type="button" className="btn btn-success btn-sm w-100">Nuevo</button>
          </div>
          <div className={styles.botones}>
            <button type="button" className="btn btn-danger btn-sm w-100">Eliminar</button>
          </div>
          <div className={styles.Item}>
            <input ref={ItemdorRef}
              className="form-control form-control-sm"
              type="text"
              placeholder="Item"
              onChange={Item}></input>
          </div>
          <div className={styles.botones}>
            <button onClick={onDescargar} type="button" className="btn btn-light btn-sm w-100">Descargar lista</button>
          </div>
        </div>

        <table className="table">
          <thead className={styles.letter}>
            <tr>
              <th><input type="checkbox" id="topping" name="topping" value="Paneer" /></th>
              {encabezados && Object.keys(encabezados).map(element => {
                return (<th key={element} >{element}</th>);
              })}
            </tr>
          </thead>
          <tbody className={styles.letter}>
            {items.map((item, index) => {
              let newEncabezados = Object.assign({}, encabezados);
              delete newEncabezados.Editar;
              return (
                <tr key={index}>
                  <td><input type="checkbox" id="topping" name="topping" value="Paneer" /></td>
                  {Object.keys(newEncabezados).map((element, index) => {
                    if (element != "Activar") {
                      return (<td key={index} >{item[newEncabezados[element]]}</td>);
                    }
                  })
                  }
                  <td>
                    <button onClick={() => handleEditar(item)} type="button" className="btn btn-warning btn-sm w-80">Editar</button>
                  </td>
                  <td>
                    <button onClick={() => handleActivar(item)} type="button" className={`btn btn-${item.activo ? "success" : "danger"} btn-sm w-80`}>{item.activo ? "Desactivar" : "Activar"}</button>
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>
      </div>
      <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
      {open && <NuevoItem crear={crear} actualizar={actualizar} setOpen={setOpen} setAlert={setAlert} element={item} encabezados={labelForm} arrayList={arrayList}/>}
    </>
  );
}
