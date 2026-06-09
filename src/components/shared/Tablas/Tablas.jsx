import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaPowerOff, FaRegCircle, FaEdit, FaSearch, FaDownload, FaUpload, FaPlus, FaBan } from 'react-icons/fa';
import useAlert from '@hooks/useAlert';
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import Paginacion from '@components/shared/Tablas/Paginacion';
import NuevoItem from '@components/shared/Formularios/Formularios';
import Alertas from '@assets/Alertas';
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
  checkboxFields = [],
  endPointCargueMasivo,
  encabezadosCargueMasivo,
  tituloCargueMasivo,
  endPointActualizacionMasiva,
  encabezadosActualizacionMasiva,
  tituloActualizacionMasiva,
  switchFields,
  onMassUploadSuccess,
  onMassUpdateSuccess,
  filtrosExtra = [],
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
  const [extraFilters, setExtraFilters] = useState({});
  const [openMasivo, setOpenMasivo] = useState(false);
  const [openActualizacionMasiva, setOpenActualizacionMasiva] = useState(false);
  const limit = 30;

  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text}`}>
      {text}
    </Tooltip>
  );

  const formatBooleanValue = (value) => (
    value ? 'Sí' : 'No'
  );

  useEffect(() => {
    const labels = { ...encabezados };
    delete labels.Editar;
    delete labels.Activar;
    setLabelForm(labels);
  }, [encabezados]);

  const listarItems = useCallback(async () => {
    setLoading(true);
    try {
      const nombre = ItemdorRef.current?.value || '';
      const res = await paginar(pagination, limit, nombre, extraFilters);
      setItems(res?.data || []);
      setTotal(res?.total || 0);
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
  }, [extraFilters, pagination, paginar, setAlert]);

  useEffect(() => {
    listarItems();
  }, [listarItems, openMasivo, openActualizacionMasiva]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (ItemdorRef.current?.value || '')) {
        setPagination(1);
        listarItems();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, listarItems]);

  useEffect(() => {
    if (!open) {
      listarItems();
    }
  }, [open, listarItems]);

  const handleNuevo = (e) => {
    if (e) e.preventDefault();
    setOpen(true);
    setItem(null);
  };

  const handleEditar = (rowItem, e) => {
    if (e) e.preventDefault();
    setOpen(true);
    setItem(rowItem);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPagination(1);
    listarItems();
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExtraFilterChange = (field, value) => {
    setExtraFilters((prev) => ({ ...prev, [field]: value }));
    setPagination(1);
  };

  const onDescargar = async (e) => {
    if (e) e.preventDefault();
    try {
      const fileName = titulo || 'Listado';
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

  const handleActivar = async (rowItem, e) => {
    if (e) e.preventDefault();
    try {
      const bool = rowItem[encabezados.Activar] === null ? false : rowItem[encabezados.Activar];
      const changes = { [encabezados.Activar]: !bool };
      await actualizar(rowItem.id, changes);
      setAlert({
        active: true,
        mensaje: `El item "${rowItem.id}" se ha ${!bool ? 'activado' : 'desactivado'} exitosamente`,
        color: 'success',
        autoClose: true,
      });
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

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(items.map((rowItem) => rowItem.id));
      return;
    }
    setSelectedItems([]);
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) => (
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    ));
  };

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
      await Promise.all(selectedItems.map((id) => actualizar(id, { [encabezados.Activar]: false })));
      setAlert({
        active: true,
        mensaje: `${selectedItems.length} item(s) desactivado(s) exitosamente`,
        color: 'success',
        autoClose: true,
      });
      setSelectedItems([]);
      listarItems();
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

        <form onSubmit={(e) => e.preventDefault()}>
          <Row className="mb-3 g-2">
            <Col md={6} lg={4}>
              <ButtonGroup className="w-100">
                <OverlayTrigger placement="top" overlay={renderTooltip('Nuevo item')}>
                  <Button onClick={handleNuevo} variant="success" className="btn-sm" type="button">
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
                <button className="btn btn-sm border-0 bg-transparent" onClick={handleSearch} type="button">
                  <FaSearch className="text-muted" size={14} />
                </button>
              </div>
            </Col>

            {filtrosExtra.map((filter) => (
              <Col md={6} lg={3} key={filter.name}>
                <Form.Select
                  size="sm"
                  value={extraFilters[filter.name] || ''}
                  onChange={(event) => handleExtraFilterChange(filter.name, event.target.value)}
                >
                  <option value="">{filter.label}</option>
                  {(filter.options || []).map((option) => (
                    <option key={option.id} value={option.id}>{option.nombre}</option>
                  ))}
                </Form.Select>
              </Col>
            ))}

            <Col md={12} lg={4}>
              <ButtonGroup className="w-100">
                {endPointActualizacionMasiva && (
                  <OverlayTrigger placement="top" overlay={renderTooltip('Actualizacion masiva')}>
                    <Button
                      onClick={() => setOpenActualizacionMasiva(true)}
                      variant="outline-primary"
                      className="btn-sm"
                      type="button"
                    >
                      <FaUpload className="me-1" /> Actualizar masivo
                    </Button>
                  </OverlayTrigger>
                )}

                {endPointCargueMasivo && (
                  <OverlayTrigger placement="top" overlay={renderTooltip('Cargue masivo')}>
                    <Button
                      onClick={() => setOpenMasivo(true)}
                      variant="primary"
                      className="btn-sm"
                      type="button"
                    >
                      <FaUpload className="me-1" /> Cargue masivo
                    </Button>
                  </OverlayTrigger>
                )}

                <OverlayTrigger placement="top" overlay={renderTooltip('Descargar lista')}>
                  <Button onClick={onDescargar} variant="secondary" className="btn-sm" type="button">
                    <FaDownload className="me-1" /> Exportar
                  </Button>
                </OverlayTrigger>
              </ButtonGroup>
            </Col>
          </Row>
        </form>

        <div className="table-responsive">
          <table className="table table-bordered table-sm table-hover mt-3">
            <thead>
              <tr>
                <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                  <Form.Check
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItems.length === items.length && items.length > 0}
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
                items.map((rowItem, index) => {
                  const filteredHeaders = { ...encabezados };
                  delete filteredHeaders.Editar;

                  return (
                    <tr key={rowItem.id || index}>
                      <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                        <Form.Check
                          type="checkbox"
                          checked={selectedItems.includes(rowItem.id)}
                          onChange={() => handleSelectItem(rowItem.id)}
                        />
                      </td>

                      {Object.keys(filteredHeaders).map((headerKey) => {
                        if (headerKey === 'Activar') {
                          return null;
                        }

                        const fieldName = filteredHeaders[headerKey];
                        let itemName = rowItem[fieldName];
                        const nuevaLista = listas?.[headerKey];

                        if (nuevaLista) {
                          itemName = nuevaLista.find((newI) => String(newI.id) === String(itemName))?.nombre || itemName;
                        }

                        if (switchFields?.[fieldName]) {
                          const config = switchFields[fieldName];
                          return (
                            <td key={headerKey} className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                              <Form.Check
                                type="switch"
                                id={`${fieldName}-${rowItem.id}`}
                                checked={Boolean(rowItem[fieldName])}
                                onChange={() => config.onToggle(rowItem)}
                                label=""
                                className="d-flex justify-content-center"
                              />
                            </td>
                          );
                        }

                        if (checkboxFields.includes(fieldName)) {
                          return (
                            <td key={headerKey} className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                              <Badge
                                bg={rowItem[fieldName] ? 'success' : 'secondary'}
                                className="px-2 py-1 fw-normal"
                                style={{ fontSize: '0.75rem' }}
                              >
                                {formatBooleanValue(Boolean(rowItem[fieldName]))}
                              </Badge>
                            </td>
                          );
                        }

                        return (
                          <td key={headerKey} className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                            {itemName}
                          </td>
                        );
                      })}

                      <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                        <OverlayTrigger placement="top" overlay={renderTooltip('Editar item')}>
                          <button
                            onClick={(e) => handleEditar(rowItem, e)}
                            type="button"
                            className="btn btn-warning btn-sm"
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '25px',
                              width: '25px',
                              margin: 'auto',
                            }}
                          >
                            <FaEdit />
                          </button>
                        </OverlayTrigger>
                      </td>

                      <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                        <OverlayTrigger
                          placement="top"
                          overlay={renderTooltip(rowItem[encabezados.Activar] ? 'Desactivar item' : 'Activar item')}
                        >
                          <button
                            onClick={(e) => handleActivar(rowItem, e)}
                            type="button"
                            className={`btn btn-${!rowItem[encabezados.Activar] ? 'danger' : 'success'} btn-sm`}
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: '25px',
                              width: '25px',
                              margin: 'auto',
                            }}
                          >
                            {!rowItem[encabezados.Activar] ? <FaRegCircle /> : <FaPowerOff />}
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

      {openMasivo && (
        <CargueMasivo
          setOpenMasivo={setOpenMasivo}
          endPointCargueMasivo={endPointCargueMasivo}
          encabezados={encabezadosCargueMasivo}
          titulo={tituloCargueMasivo}
          onSuccess={onMassUploadSuccess}
        />
      )}

      {openActualizacionMasiva && (
        <CargueMasivo
          setOpenMasivo={setOpenActualizacionMasiva}
          endPointCargueMasivo={endPointActualizacionMasiva}
          encabezados={encabezadosActualizacionMasiva}
          titulo={tituloActualizacionMasiva}
          onSuccess={onMassUpdateSuccess}
        />
      )}

      <Paginacion setPagination={setPagination} pagination={pagination} total={total} limit={limit} />

      {open && (
        <NuevoItem
          crear={crear}
          listas={listas}
          actualizar={actualizar}
          checkboxFields={checkboxFields}
          setOpen={setOpen}
          setAlert={setAlert}
          element={item}
          encabezados={labelForm}
        />
      )}
    </>
  );
}
