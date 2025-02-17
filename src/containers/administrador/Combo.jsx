import React, { useRef, useState, useEffect } from 'react';
//Hooks
import useAlert from '@hooks/useAlert';
//Components
import Paginacion from '@components/Paginacion';
import Alertas from '@assets/Alertas';
//CSS
import NuevoCombo from '@components/administrador/NuevoCombo';
import { actualizarCombos, listarCombos, paginarCombos } from '@services/api/combos';
import excel from '@hooks/useExcel';
import { FaEdit, FaPowerOff, FaRegCircle } from 'react-icons/fa';
import CargueMasivo from '@assets/Seguridad/Listado/CargueMasivo';
import endPoints from '@services/api';
import { Button, ButtonGroup, Col, Row } from 'react-bootstrap';

const Combo = () => {
    const buscardorRef = useRef();
    const [item, setItem] = useState(null);
    const [items, setItems] = useState([]);
    const { alert, setAlert, toogleAlert } = useAlert();
    const [open, setOpen] = useState(false);
    const [pagination, setPagination] = useState(1);
    const [total, setTotal] = useState(0);
    const [openMasivo, setOpenMasivo] = useState(false);
    const limit = 10;
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        try {
            listarItems(pagination, limit);
        } catch (e) {
            alert("Error al cargar los combos", "error");
        }
    }, [alert, pagination, openMasivo]);

    async function listarItems(page, limit) {
        const nombre = buscardorRef.current.value;
        const res = await paginarCombos(page, limit, nombre);
        setTotal(res.total);
        setItems(res.data);
    }

    const handleNuevo = () => {
        setOpen(true);
        setItem(null);
    };

    const handleEditar = (item) => {
        setOpen(true);
        setItem(item);
    };

    const buscar = async () => {
        setPagination(1);
        listarItems(pagination, limit);
    };

    const onDescargar = async () => {
        const data = await listarCombos();
        excel(data, "Combos", "Combos");
    };

    const handleActivar = (item) => {
        try {
            const changes = { isBlock: !item.isBlock };
            actualizarCombos(item.consecutivo, changes);
            setAlert({
                active: true,
                mensaje: 'El item "' + item.consecutivo + '" se ha actualizado',
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

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(items.map(item => item.consecutivo)); // Seleccionar todos
        } else {
            setSelectedItems([]); // Desmarcar todos
        }
    };

    const handleSelectOne = (e, consecutivo) => {
        if (e.target.checked) {
            setSelectedItems(prevState => [...prevState, consecutivo]);
        } else {
            setSelectedItems(prevState => prevState.filter(item => item !== consecutivo));
        }
    };

    const handleDesactivarMasivamente = async () => {
        try {
            const cambios = selectedItems.map(consecutivo => ({
                consecutivo,
                isBlock: true
            }));

            // Realizar las actualizaciones masivas
            for (const cambio of cambios) {
                await actualizarCombos(cambio.consecutivo, { isBlock: cambio.isBlock });
            }

            setAlert({
                active: true,
                mensaje: 'Los combos seleccionados han sido desactivados',
                color: "success",
                autoClose: true
            });

            // Limpiar las selecciones
            setSelectedItems([]);
        } catch (e) {
            setAlert({
                active: true,
                mensaje: 'Se ha presentado un error al desactivar los combos',
                color: "danger",
                autoClose: true
            });
        }
    };

    return (
        <div>
            <Alertas alert={alert} handleClose={toogleAlert} />
            <h2>Combos</h2>
            <div className="line"></div>
            <div>
                <Row className="mb-3">

                    <Col md={5} lg={3} className="mb-2">
                        <ButtonGroup className="w-100">
                            <Button onClick={handleNuevo} variant="success" className="btn-sm w-100 m-1 mt-0 mb-0">
                                Nuevo
                            </Button>
                            <Button onClick={handleDesactivarMasivamente} variant="danger" className="btn-sm w-100 m-1 mt-0 mb-0" >
                                Desactivar
                            </Button>
                        </ButtonGroup>
                    </Col>
                    <Col md={6} lg={6} className="mb-2">
                        <input
                            ref={buscardorRef}
                            className="form-control form-control-sm"
                            type="text"
                            placeholder="Item"
                            onChange={buscar}
                        />
                    </Col>
                    <Col md={12} lg={3} className="mb-2">
                        <ButtonGroup className="w-100">
                            <Button onClick={() => setOpenMasivo(true)} type="button" className="btn btn-primary btn-sm m-1 mt-0 mb-0">
                                Cargue Masivo
                            </Button>
                            <Button onClick={onDescargar} type="button" className="btn btn-secondary btn-sm m-1 mt-0 mb-0 ">
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
                            />
                        </th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Id</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Código</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Nombre</th>

                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Cajas x Palet</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Cajas x Mini Palet</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>Peso N</th>


                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Peso B</th>
                        <th className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>Precio</th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}></th>
                        <th className="text-custom-small text-center align-middle" style={{ padding: '2px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={selectedItems.includes(item.consecutivo)}
                                    onChange={(e) => handleSelectOne(e, item.consecutivo)}
                                />
                            </td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.id}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.consecutivo}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px' }}>{item.nombre}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.cajas_por_palet}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.cajas_por_mini_palet}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.peso_neto}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.peso_bruto}</td>
                            <td className="text-custom-small text-center align-middle d-none d-md-table-cell" style={{ padding: '2px' }}>{item.precio_de_venta}</td>
                            <td className="text-custom-small text-center align-middle" style={{ padding: '2px', width: '45px' }}>
                                <button
                                    onClick={() => handleEditar(item)}
                                    type="button"
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
                                    onClick={() => handleActivar(item)}
                                    type="button"
                                    className={`btn btn-${item.isBlock ? "danger" : "success"} btn-sm`}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '25px',
                                        width: "auto",
                                        margin: "auto"
                                    }}
                                >
                                    {item.isBlock ? <FaRegCircle /> : <FaPowerOff />}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {openMasivo && <CargueMasivo
                titulo={"Productos"}
                setOpenMasivo={setOpenMasivo}
                endPointCargueMasivo={endPoints.combos.create + "/masivo"}
                encabezados={{
                    "consecutivo": null,
                    "nombre": null,
                    "id_cliente": null,
                    "cajas_por_palet": null,
                    "cajas_por_mini_palet": null,
                    "palets_por_contenedor": null,
                    "peso_neto": null,
                    "peso_bruto": null,
                    "precio_de_venta": null,
                    "isBlock": null,
                }}
            />}

            <Paginacion
                pagination={pagination}
                setPagination={setPagination}
                total={total}
            />

            {open && <NuevoCombo open={open} setOpen={setOpen} setAlert={setAlert} item={item} />}
        </div>
    );
};

export default Combo;
