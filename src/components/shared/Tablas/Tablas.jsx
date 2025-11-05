import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaPowerOff, FaRegCircle, FaEdit, FaSearch, FaDownload, FaUpload, FaPlus, FaBan } from 'react-icons/fa';

// Hooks
import useAlert from '@hooks/useAlert';
// Components
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import Paginacion from '@components/shared/Tablas/Paginacion';
import NuevoItem from '@components/shared/Formularios/Formularios';
import Alertas from '@assets/Alertas';
// CSS
import excel from '@hooks/useExcel';
import { Button, ButtonGroup, Col, Row, Form, Badge, Tooltip, OverlayTrigger } from 'react-bootstrap';

export default function Tablas({
  encabezados,
  actualizar,
  listas,
  listar,
  paginar,
  crear,
  titulo,
  endPointCargueMasivo,
  encabezadosCargueMasivo,
  tituloCargueMasivo
}) {
  const ItemdorRef = useRef();
  const [item, setItem] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [labelForm, setLabelForm] = useState({});
  const { alert, setAlert, toogleAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [pagination, setPagination] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 30;
  const [openMasivo, setOpenMasivo] = useState(false);

  // Componente de Tooltip personalizado
  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text}`}>
      {text}
    </Tooltip>
  );

  // Memoizar la configuración de labels
  useEffect(() => {
    const labels = { ...encabezados };
    delete labels.Editar;
    delete labels.Activar;
    setLabelForm(labels);
  }, [encabezados]);

  // Memoizar la función de listar items
  const listarItems = useCallback(async () => {
    setLoading(true);
    try {
      const nombre = ItemdorRef.current?.value || '';
      const res = await paginar(pagination, limit, nombre);
      setItems(res.data);
      setTotal(res.total);
    } catch (error) {
      console.error('Error al listar items:', error);
      setAlert({
        active: true,
        mensaje: 'Error al listar items',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setLoading(false);
    }
  }, [pagination, paginar, setAlert]);

  // Efecto PRINCIPAL para cargar items - SOLO cuando cambian estos estados
  useEffect(() => {
    listarItems();
  }, [pagination, openMasivo]); // ← Removí 'alert' y 'open' de las dependencias

  // Debounce para búsqueda - SOLO para cambios en searchTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (ItemdorRef.current?.value || '')) {
        setPagination(1); // Resetear paginación al buscar
        listarItems();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, listarItems]); // ← Solo searchTerm

  // Efecto para recargar cuando se cierra el modal de edición
  useEffect(() => {
    if (!open) { // Solo ejecutar cuando el modal se CIERRA
      listarItems();
    }
  }, [open, listarItems]); // ← Solo cuando 'open' cambia a false

  const handleNuevo = (e) => {
    if (e) e.preventDefault();
    setOpen(true);
    setItem(null);
  };

  const handleEditar = (item, e) => {
    if (e) e.preventDefault();
    setOpen(true);
    setItem(item);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPagination(1);
    listarItems();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const onDescargar = async (e) => {
    if (e) e.preventDefault();
    try {
      const fileName = titulo ? titulo : "Listado";
      const data = await listar();
      excel(data, fileName, fileName);
      setAlert({
        active: true,
        mensaje: 'Descarga iniciada exitosamente',
        color: 'success',
        autoClose: true,
      });
    } catch (error) {
      console.error('Error al descargar lista:', error);
      setAlert({
        active: true,
        mensaje: 'Error al descargar lista',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  const handleActivar = async (item, e) => {
    if (e) e.preventDefault();
    try {
      const bool = item[encabezados['Activar']] === null ? false : item[encabezados['Activar']];
      const changes = { [encabezados["Activar"]]: !bool };
      await actualizar(item.id, changes);
      setAlert({
        active: true,
        mensaje: `El item "${item.id}" se ha ${!bool ? 'activado' : 'desactivado'} exitosamente`,
        color: 'success',
        autoClose: true,
      });
      // Recargar la lista después de activar/desactivar
      listarItems();
    } catch (error) {
      console.error('Error al actualizar item:', error);
      setAlert({
        active: true,
        mensaje: 'Se ha presentado un error al actualizar el item',
        color: 'danger',
        autoClose: true,
      });
    }
  };

  // Manejar selección de todos los ítems
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(items.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Manejar selección individual
  const handleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Desactivar ítems seleccionados
  const handleDesactivarMasivo = async (e) => {
    if (e) e.preventDefault();
    if (selectedItems.length === 0) {
      setAlert({
        active: true,
        mensaje: 'Por favor selecciona al menos un item',
        color: 'warning',
        autoClose: true,
      });
      return;
    }

    try {
      setLoading(true);
      const updatePromises = selectedItems.map(async (id) => {
        const changes = { [encabezados["Activar"]]: false };
        return actualizar(id, changes);
      });

      await Promise.all(updatePromises);

      setAlert({
        active: true,
        mensaje: `${selectedItems.length} item(s) desactivado(s) exitosamente`,
        color: 'success',
        autoClose: true,
      });

      listarItems();
      setSelectedItems([]);
    } catch (error) {
      console.error('Error al desactivar ítems:', error);
      setAlert({
        active: true,
        mensaje: 'Error al desactivar ítems seleccionados',
        color: 'danger',
        autoClose: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container-fluid">
        <Alertas alert={alert} handleClose={toogleAlert} />

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="mb-0">{titulo}</h2>
            {titulo && <div className="line mt-2"></div>}
          </div>
          {selectedItems.length > 0 && (
            <Badge bg="primary" pill className="fs-6">
              {selectedItems.length} seleccionado(s)
            </Badge>
          )}
        </div>

        {/* Controles - Envolver en form para prevenir submit */}
        <form onSubmit={(e) => e.preventDefault()}>
          <Row className="mb-3 g-2">
            <Col md={6} lg={4}>
              <ButtonGroup className="w-100">
                <OverlayTrigger placement="top" overlay={renderTooltip('Nuevo item')}>
                  <Button 
                    onClick={handleNuevo} 
                    variant="success" 
                    className="btn-sm"
                    type="button"
                  >
                    <FaPlus className="me-1" /> Nuevo
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger placement="top" overlay={renderTooltip('Desactivar seleccionados')}>
                  <Button
                    onClick={handleDesactivarMasivo}
                    variant="danger"
                    className="btn-sm"
                    disabled={selectedItems.length === 0 || loading}
                    type="button"
                  >
                    <FaBan className="me-1" /> Desactivar
                  </Button>
                </OverlayTrigger>
              </ButtonGroup>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex border rounded">
                <input
                  ref={ItemdorRef}
                  type="text"
                  className="form-control border-0 shadow-none"
                  placeholder="Buscar..."
                  onChange={handleInputChange}
                  value={searchTerm}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <button 
                  className="btn btn-sm border-0 bg-transparent"
                  onClick={handleSearch}
                  type="button"
                >
                  <FaSearch className="text-muted" size={14} />
                </button>
              </div>
            </Col>

            <Col md={12} lg={4}>
              <ButtonGroup className="w-100">
                {endPointCargueMasivo && (
                  <OverlayTrigger placement="top" overlay={renderTooltip('Cargue masivo')}>
                    <Button
                      onClick={() => setOpenMasivo(true)}
                      variant="primary"
                      className="btn-sm"
                      type="button"
                    >
                      <FaUpload className="me-1" /> Masivo
                    </Button>
                  </OverlayTrigger>
                )}

                <OverlayTrigger placement="top" overlay={renderTooltip('Descargar lista')}>
                  <Button 
                    onClick={onDescargar} 
                    variant="secondary" 
                    className="btn-sm"
                    type="button"
                  >
                    <FaDownload className="me-1" /> Exportar
                  </Button>
                </OverlayTrigger>
              </ButtonGroup>
            </Col>
          </Row>
        </form>

        {/* Tabla */}
        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover mt-3">
            <thead >
              <tr>
                <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                  <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItems.length === items.length && items.length > 0}
                    indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
                  />
                </th>
                {encabezados && Object.keys(encabezados).map((key) => (
                  <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }} key={key}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Object.keys(encabezados).length + 1} className="text-center py-4">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span className="ms-2">Cargando...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={Object.keys(encabezados).length + 1} className="text-center py-4 text-muted">
                    No se encontraron resultados
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const filteredHeaders = { ...encabezados };
                  delete filteredHeaders.Editar;

                  return (
                    <tr key={item.id || index}>
                      <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                        <Form.Check
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                        />
                      </td>

                      {Object.keys(filteredHeaders).map((headerKey) => {
                        if (headerKey === "Activar") return null;

                        let itemName = item[filteredHeaders[headerKey]];
                        const nuevaLista = listas?.[headerKey];

                        if (nuevaLista) {
                          itemName = nuevaLista.find((newI) => newI.id === itemName)?.nombre || itemName;
                        }

                        return (
                          <td key={headerKey} className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                            {itemName}
                          </td>
                        );
                      })}

                      {/* Botón Editar */}
                      <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                        <OverlayTrigger placement="top" overlay={renderTooltip('Editar item')}>
                          <button
                            onClick={(e) => handleEditar(item, e)}
                            type="button"
                            className="btn btn-warning btn-sm"
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '25px',
                              width: "25px",
                              margin: "auto"
                            }}
                          >
                            <FaEdit />
                          </button>
                        </OverlayTrigger>
                      </td>

                      {/* Botón Activar/Desactivar */}
                      <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip(
                            item[encabezados['Activar']] ? 'Desactivar item' : 'Activar item'
                          )}
                        >
                          <button
                            onClick={(e) => handleActivar(item, e)}
                            type="button"
                            className={`btn btn-${!item[encabezados['Activar']] ? "danger" : "success"} btn-sm`}
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '25px',
                              width: "25px",
                              margin: "auto"
                            }}
                          >
                            {!item[encabezados['Activar']] ? <FaRegCircle /> : <FaPowerOff />}
                          </button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {openMasivo && (
        <CargueMasivo
          setOpenMasivo={setOpenMasivo}
          endPointCargueMasivo={endPointCargueMasivo}
          encabezados={encabezadosCargueMasivo}
          titulo={tituloCargueMasivo}
        />
      )}

      <Paginacion
        setPagination={setPagination}
        pagination={pagination}
        total={total}
        limit={limit}
      />

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