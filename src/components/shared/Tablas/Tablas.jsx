import React, { useRef, useState, useEffect } from 'react';

// Hooks
import useAlert from '@hooks/useAlert';
// Components
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import Paginacion from '@components/shared/Tablas/Paginacion';
import NuevoItem from '@components/shared/Formularios/Formularios';
import Alertas from '@assets/Alertas';
// CSS
import styles from '@styles/Listar.module.css';
import excel from '@hooks/useExcel';
import { Button, ButtonGroup, Col, Row } from 'react-bootstrap';

export default function Tablas({ encabezados, actualizar,
  listas, listar, paginar, crear,
  titulo, endPointCargueMasivo,
  encabezadosCargueMasivo, tituloCargueMasivo
}) {
  const ItemdorRef = useRef();
  const [item, setItem] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // Para manejar los ítems seleccionados
  const [labelForm, setLabelForm] = useState({});
  const { alert, setAlert, toogleAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [openMasivo, setOpenMasivo] = useState(false);

  useEffect(() => {
    const labels = { ...encabezados };
    delete labels.Editar;
    delete labels.Activar;
    setLabelForm(labels);
  }, [encabezados]); // Solo ejecuta cuando cambian los encabezados
  
  useEffect(() => {
    listarItems();
  }, [pagination, open, openMasivo, alert]); // Solo ejecuta cuando cambian estos estados
  

  async function listarItems() {
    const nombre = ItemdorRef.current.value;
    try {
      const res = await paginar(pagination, limit, nombre);
      console.log(res);
      setItems(res.data);
      setTotal(res.total);
    } catch (error) {
      console.log(error);
      setAlert({
        active: true,
        mensaje: 'Error al listar items',
        color: 'danger',
        autoClose: true,
      });
    }
  }

  const handleNuevo = () => {
    setOpen(true);
    setItem(null);
  };

  const handleEditar = (item) => {
    setOpen(true);
    setItem(item);
  };

  const handleSearch = () => {
    setPagination(1);
    listarItems();
  };

  const onDescargar = async () => {
    try {
      const fileName = titulo ? titulo : "Listado";
      const data = await listar();
      excel(data, fileName, fileName);
    } catch (error) {
      setAlert({
        active: true,
        mensaje: 'Error al descargar lista',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const handleActivar = async (item) => {
    try {
      let bool = item[encabezados['Activar']] === null ? false : item[encabezados['Activar']];
      const changes = { [encabezados["Activar"]]: !bool };
      await actualizar(item.id, changes);
      setAlert({
        active: true,
        mensaje: `El item "${item.id}" se ha actualizado`,
        color: 'success',
        autoClose: true,
      });
    } catch (e) {
      setAlert({
        active: true,
        mensaje: 'Se ha presentado un error',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  // Manejar selección de todos los ítems
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(items.map((item) => item.id)); // Seleccionar todos los ítems
    } else {
      setSelectedItems([]); // Deseleccionar todos
    }
  };

  // Manejar selección individual
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Desactivar ítems seleccionados
  const handleDesactivarMasivo = async () => {
    try {
      for (const id of selectedItems) {
        const item = items.find((i) => i.id === id);
        let bool = item[encabezados['Activar']] === null ? false : item[encabezados['Activar']];
        const changes = { [encabezados["Activar"]]: !bool };
        await actualizar(id, changes);
      }
      setAlert({
        active: true,
        mensaje: 'Items desactivados exitosamente',
        color: 'success',
        autoClose: true,
      });
      listarItems(); // Actualizar la lista
      setSelectedItems([]); // Limpiar la selección
    } catch (error) {
      setAlert({
        active: true,
        mensaje: 'Error al desactivar ítems',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  return (
    <>
      <div>
        <Alertas alert={alert} handleClose={toogleAlert} />
        <h2>{titulo}</h2>
        {titulo && <div className="line"></div>}
        <div>
          <Row className="mb-3">
            <Col md={5} lg={3} className="mb-2">
              <ButtonGroup className="w-100">
                <Button onClick={handleNuevo} variant="success" className="btn-sm w-100 m-1 mt-0 mb-0">
                  Nuevo
                </Button>
                <Button onClick={handleDesactivarMasivo} variant="danger" className="btn-sm w-100 m-1 mt-0 mb-0" >
                  Desactivar
                </Button>
              </ButtonGroup>
            </Col>
            <Col md={6} lg={6} className="mb-2">
              <input
                ref={ItemdorRef}
                className="form-control form-control-sm"
                type="text"
                placeholder="Item"
                onChange={handleSearch}
              />
            </Col>
            <Col md={12} lg={3} className="mb-2">
              <ButtonGroup className="w-100">
                {endPointCargueMasivo && <Button onClick={() => setOpenMasivo(true)} type="button" className="btn btn-primary btn-sm m-1 mt-0 mb-0">
                  Cargue Masivo
                </Button>}
                <Button onClick={onDescargar} type="button" className="btn btn-secondary btn-sm m-1 mt-0 mb-0 ">
                  Descargar lista
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </div>

        <table className="table table-striped table-bordered table-sm">
          <thead className={styles.letter}>
            <tr>
              <th>
                <input type="checkbox" onChange={handleSelectAll} />
              </th>
              {encabezados && Object.keys(encabezados).map((key) => {
                return (
                  <th key={key}>{key}</th>
                );
              })}
            </tr>
          </thead>
          <tbody className={styles.letter}>
            {items.map((item, index) => {
              const filteredHeaders = { ...encabezados };
              delete filteredHeaders.Editar;
              return (
                <tr key={index}>
                  <td className="text-custom-small text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </td>
                  {Object.keys(filteredHeaders).map((headerKey) => {

                    let itemName = item[filteredHeaders[headerKey]];
                    const nuevaLista = listas?.[headerKey];
                    if (nuevaLista) {
                      itemName = nuevaLista.find((newI) => newI.id === itemName)?.nombre || itemName;
                    }
                    if (headerKey !== "Activar")
                      return (
                        <td key={headerKey} className="text-custom-small text-center align-middle">
                          {itemName}
                        </td>
                      );
                  })}

                  <td key="Editar" className="text-custom-small text-center align-middle">
                    <button onClick={() => handleEditar(item)} type="button" className="btn btn-warning btn-sm w-80">
                      Editar
                    </button>
                  </td>

                  <td className="text-custom-small text-center align-middle">
                    <button
                      onClick={() => handleActivar(item)}
                      type="button"
                      className={`btn btn-${item[encabezados['Activar']] ? 'success' : 'danger'} btn-sm w-80`}
                    >
                      {item[encabezados['Activar']] ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openMasivo && <CargueMasivo
        setOpenMasivo={setOpenMasivo}
        endPointCargueMasivo={endPointCargueMasivo}
        encabezados={encabezadosCargueMasivo}
        titulo={tituloCargueMasivo}
      />}

      <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />
      {open && (
        <NuevoItem
          crear={crear}
          listas={listas}
          actualizar={actualizar}
          setOpen={setOpen}
          setAlert={setAlert}
          element={item}
          encabezados={labelForm}
        />
      )}
    </>
  );
}
