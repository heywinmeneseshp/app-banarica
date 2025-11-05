import React, { useState, useEffect, useRef } from 'react';
import { FaPowerOff, FaRegCircle, FaEdit } from 'react-icons/fa';
import axios from 'axios';
//Services
import endPoints from '@services/api';
import { actualizarAlmacen, listarAlmacenes } from '@services/api/almacenes';
//Components
import NuevaBodega from '@components/administrador/NuevaBodega';
import Alertas from '@assets/Alertas';
import Paginacion from '@components/Paginacion';
//Hooks
import useAlert from '@hooks/useAlert';
//Bootstrap
import { Row, Col, ButtonGroup, Button } from 'react-bootstrap';

import excel from '@hooks/useExcel';

const Bodega = () => {
    const buscardorRef = useRef(null);
    const [almacen, setAlmacen] = useState(null);
    const [almacenes, setAlmacenes] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);
    const limit = 30;

    useEffect(() => {
        async function fetchAlmacenes() {
            const buscador = buscardorRef.current.value;
            const res = await axios.get(endPoints.almacenes.pagination(pagination, limit, buscador));
            setTotal(res.data.total);
            setAlmacenes(res.data.data);
        }
        try {
            fetchAlmacenes();
        } catch (e) {
            setAlert({
                active: true,
                mensaje: "Se ha producido un error al listar los almacenes",
                color: "danger",
                autoClose: true
            });
        }
    }, [alert, pagination]);

    // Función para seleccionar/deseleccionar todos los items
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allConsecutivos = almacenes.map(almacen => almacen.consecutivo);
            setSelectedItems(allConsecutivos);
        } else {
            setSelectedItems([]);
        }
    };

    // Función para seleccionar/deseleccionar un item individual
    const handleSelectOne = (e, consecutivo) => {
        if (e.target.checked) {
            setSelectedItems(prev => [...prev, consecutivo]);
        } else {
            setSelectedItems(prev => prev.filter(item => item !== consecutivo));
        }
    };

    const handleNuevo = () => {
        setOpen(true);
        setAlmacen(null);
    };

    const handleEditar = (almacen) => {
        setOpen(true);
        setAlmacen(almacen);
    };

    const handleChangeBuscardor = async () => {
        setPagination(1);
        const buscador = buscardorRef.current.value;
        const res = await axios.get(endPoints.almacenes.pagination(pagination, limit, buscador));
        setTotal(res.data.total);
        setAlmacenes(res.data.data);
        // Limpiar selección al buscar
        setSelectedItems([]);
    };

    const onDescargar = async () => {
        const data = await listarAlmacenes();
        excel(data, "Almacenes", "Almacenes");
    };

    const handleDesactivarMasivamente = async () => {
        if (selectedItems.length === 0) {
            setAlert({
                active: true,
                mensaje: "Por favor seleccione al menos un almacén para desactivar",
                color: "warning",
                autoClose: true
            });
            return;
        }

        try {
            // Confirmación antes de desactivar
            const confirmar = window.confirm(
                `¿Está seguro que desea desactivar ${selectedItems.length} almacén(es) seleccionado(s)?`
            );

            if (!confirmar) return;

            // Desactivar todos los almacenes seleccionados
            const promises = selectedItems.map(consecutivo =>
                actualizarAlmacen(consecutivo, { isBlock: true })
            );

            await Promise.all(promises);

            // Actualizar el estado local
            setAlmacenes(prev =>
                prev.map(almacen =>
                    selectedItems.includes(almacen.consecutivo)
                        ? { ...almacen, isBlock: true }
                        : almacen
                )
            );

            // Limpiar selección
            setSelectedItems([]);

            setAlert({
                active: true,
                mensaje: `Se han desactivado ${selectedItems.length} almacén(es) correctamente`,
                color: "success",
                autoClose: true
            });

        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error al desactivar los almacenes',
                color: "danger",
                autoClose: true
            });
        }
    };

    const handleActivar = async (almacen) => {
        try {
            const changes = { isBlock: !almacen.isBlock };
            await actualizarAlmacen(almacen.consecutivo, changes);

            // Actualizar el estado local
            setAlmacenes(prev => prev.map(a =>
                a.consecutivo === almacen.consecutivo
                    ? { ...a, isBlock: !a.isBlock }
                    : a
            ));

            setAlert({
                active: true,
                mensaje: `El almacén "${almacen.consecutivo}" se ha ${almacen.isBlock ? 'activado' : 'desactivado'} correctamente`,
                color: "success",
                autoClose: true
            });
        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error al actualizar el almacén',
                color: "danger",
                autoClose: true
            });
        }
    };

    return (
        <div>
            <Alertas alert={alert} handleClose={toogleAlert} />
            <h2>Almacenes</h2>
            <div className="line"></div>
            <div>
                <Row className="mb-3">
                    <Col md={5} lg={3} className="mb-2">
                        <ButtonGroup className="w-100">
                            <Button onClick={handleNuevo} variant="success" className="btn-sm w-100 m-1 mt-0 mb-0">
                                Nuevo
                            </Button>
                            <Button onClick={handleDesactivarMasivamente} variant="danger" className="btn-sm w-100 m-1 mt-0 mb-0">
                                Desactivar
                            </Button>
                        </ButtonGroup>
                    </Col>
                    <Col md={6} lg={6} className="mb-2">
                        <input
                            ref={buscardorRef}
                            className="form-control form-control-sm"
                            type="text"
                            placeholder="Buscar"
                            onChange={handleChangeBuscardor}
                        />
                    </Col>
                    <Col md={12} lg={3} className="mb-2">
                        <ButtonGroup className="w-100">
                            <Button onClick={onDescargar} type="button" className="btn btn-secondary btn-sm m-1 mt-0 mb-0">
                                Descargar lista
                            </Button>
                        </ButtonGroup>
                    </Col>
                </Row>
            </div>
            <table className="table table-bordered table-sm mt-3">
                <thead>
                    <tr>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="checkboxAll"
                                onChange={handleSelectAll}
                                checked={selectedItems.length > 0 && selectedItems.length === almacenes.length}
                            />
                        </th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Código</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Almacén</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Razón social</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Dirección</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Teléfono</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Email</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Editar</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Activar</th>
                    </tr>
                </thead>
                <tbody>
                    {almacenes.map((almacen, index) => (
                        <tr key={index}>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedItems.includes(almacen.consecutivo)}
                                    onChange={(e) => handleSelectOne(e, almacen.consecutivo)}
                                />
                            </td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{almacen.consecutivo}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{almacen.nombre}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{almacen.razon_social}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{almacen.direccion}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{almacen.telefono}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{almacen.email}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                <button
                                    onClick={() => handleEditar(almacen)}
                                    type="button"
                                    title={"Editar"}
                                    className="btn btn-warning btn-sm"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '25px',
                                        width: "auto",
                                        margin: "auto"
                                    }}
                                >
                                    <FaEdit></FaEdit>
                                </button>
                            </td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                <button
                                    onClick={() => handleActivar(almacen)}
                                    type="button"
                                    title={almacen.isBlock ? "Activar" : "Desactivar"}
                                    className={`btn btn-${almacen.isBlock ? "danger" : "success"} btn-sm`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '25px',
                                        width: "auto",
                                        margin: "auto"
                                    }}
                                >
                                    {almacen.isBlock ? <FaRegCircle /> : <FaPowerOff />}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Paginacion
                pagination={pagination}
                setPagination={setPagination}
                total={total}
                limit={limit}
            />

            {open && <NuevaBodega open={open} setOpen={setOpen} setAlert={setAlert} almacen={almacen} />}
        </div>
    );
};

export default Bodega;