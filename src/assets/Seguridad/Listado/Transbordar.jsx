import { useEffect, useRef, useState } from 'react';
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import { Col, Form, Row } from 'react-bootstrap';
import { paginarListado } from '@services/api/listado';
import { agregarTransbordo } from '@services/api/transbordo';
import { listarSeriales } from '@services/api/seguridad';
import { filterActiveContainerRows } from '@utils/contenedorEstado';

const Transbordar = ({ setOpen }) => {

    const formRef = useRef();
    const [contenedores, setContenedores] = useState([]);
    const [semana, setSemana] = useState([]);
    const [listado, setListado] = useState([]);

    const handleClose = () => {
        setOpen(false);
    };

    const filtrarContenedores = async () => {
        if (!formRef.current) return;

        try {
            const formData = new FormData(formRef.current);
            const object = {
                contenedor: String(formData.get('contenedor') || '').trim().toUpperCase(),
                semana: String(formData.get('semana') || '').trim(),
                habilitado: true,
            };
            const res = await paginarListado(1, 20, object);
            const rows = filterActiveContainerRows(res?.data || []);
            const contenedoresConDuplicados = rows
                .map(item => item?.Contenedor?.contenedor)
                .filter(Boolean);
            const contSinDuplicados = contenedoresConDuplicados.filter((item, index) => {
                return contenedoresConDuplicados.indexOf(item) === index;
            });
            setContenedores(contSinDuplicados);

            const semConDuplicados = rows
                .map(item => item?.Embarque?.semana?.consecutivo)
                .filter(Boolean);
            const semSinDuplicados = semConDuplicados.filter((item, index) => {
                return semConDuplicados.indexOf(item) === index;
            });
            setListado(rows);
            setSemana(semSinDuplicados);
        } catch (error) {
            console.error('Error al filtrar contenedores para transbordo:', error);
            setContenedores([]);
            setSemana([]);
            setListado([]);
        }
    };



    const handleTransbordar = async (e) => {
        e.preventDefault();
        const formData = new FormData(formRef.current);
        const container = String(formData.get('nuevo-contenedor') || '').trim().toUpperCase();
        const semana = String(formData.get('semana') || '').trim();
        const oldContainer = String(formData.get('contenedor') || '').trim().toUpperCase();
        const observaciones = formData.get('observaciones');
        const fecha = formData.get('fecha');
        const kit = formData.get('kit');
        const existeCont = listado.filter(item => item?.Contenedor?.contenedor === oldContainer);
        if (existeCont.length === 0) return window.alert("El contenedor no existe");

        const contenedorOrigen = existeCont[0]?.Contenedor;
        if (!contenedorOrigen?.id) return window.alert("No fue posible identificar el contenedor de origen.");

        const kitContent = await listarSeriales(null, null, {
            bag_pack: kit,
            available: [true],
        });
        const serialesDisponibles = Array.isArray(kitContent?.data)
            ? kitContent.data
            : Array.isArray(kitContent)
                ? kitContent
                : [];
        if (serialesDisponibles.length === 0) return window.alert("El Kit no existe");

        const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
        const transbordo = {
            id_contenedor_viejo: contenedorOrigen.id,
            nuevo_contenedor: container,
            fecha_transbordo: fecha,
            habilitado: true,
            seriales: serialesDisponibles,
            lineas_listado: existeCont,
            usuario: usuario,
            observaciones: observaciones,
            cons_semana: semana
        };
        await agregarTransbordo(transbordo);
        setOpen(false);
    };

    useEffect(() => {
        filtrarContenedores();
    }, []);

    return (
        <>
            {/*Formulario Transbordo*/}
            <div className={styles2.fondo}>
                <div className={styles2.floatingform}>
                    <div className="card">
                        <div className="card-header d-flex justify-content-between">
                            <span className="fw-bold">Realizar Transbordo</span>
                            <button
                                type="button"
                                onClick={handleClose} // Close or go back
                                className="btn-close"
                                aria-label="Close"
                            />
                        </div>
                        <div className="card-body ">
                            {/*Inicio contenido*/}
                            <Form ref={formRef} onSubmit={handleTransbordar}>
                                <Row>
                                    <Col md={3}>
                                        <Form.Group className="mb-0" controlId="semana">
                                            <Form.Label className='mt-1 mb-1'>Semana</Form.Label>
                                            <Form.Control
                                                className='form-control-sm'
                                                minLength={8}
                                                maxLength={8}
                                                required
                                                type="text"
                                                name="semana"
                                                placeholder="S00-2000"
                                                list="semanas"
                                                onChange={filtrarContenedores}
                                            />
                                            <datalist id="semanas">
                                                {semana.map(item => {
                                                    return <option key={item} value={item} />;
                                                })}
                                            </datalist>
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group className="mb-0" controlId="fecha">
                                            <Form.Label className='mt-1 mb-1'>Fecha</Form.Label>
                                            <Form.Control
                                                className='form-control-sm'
                                                minLength={8}
                                                maxLength={8}
                                                required
                                                type="date"
                                                name="fecha"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group className="mb-0" controlId="contenedor">
                                            <Form.Label className='mt-1 mb-1'>Contenedor</Form.Label>
                                            <Form.Control
                                                className='form-control-sm'
                                                type="text"
                                                name="contenedor"
                                                placeholder="DUMY0000001"
                                                pattern="[A-Za-z]{4}[0-9]{7}"
                                                title="Debe ser 4 letras seguidas de 7 números"
                                                required
                                                list="contenedores"
                                                onChange={filtrarContenedores}
                                            />
                                            <datalist id="contenedores">
                                                {contenedores.map(item => {
                                                    return <option key={item} value={item} />;
                                                })}
                                            </datalist>
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group className="mb-0" controlId="nuevo-contenedor">
                                            <Form.Label className='mt-1 mb-1'>Nuevo Contenedor</Form.Label>
                                            <Form.Control
                                                className='form-control-sm'
                                                pattern="[A-Za-z]{4}[0-9]{7}"
                                                type="text"
                                                required
                                                name="nuevo-contenedor"
                                                title="Debe ser 4 letras seguidas de 7 números"
                                                placeholder="DUMY0000002" />
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group className="mb-0" controlId="kit">
                                            <Form.Label className='mt-1 mb-1'>Kit</Form.Label>
                                            <Form.Control
                                                className='form-control-sm'
                                                type="text"
                                                required
                                                name="kit"
                                                placeholder="AA2L00001" />
                                        </Form.Group>
                                    </Col>

                                    <Col md={3}>
                                        <Form.Group className="mb-0 text-start" controlId="check">
                                            <Form.Label className='mt-1 mb-2'>Inspeccionado</Form.Label>
                                            <Form.Check
                                                className='m-auto'
                                                type="checkbox"
                                                name="check"
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col >
                                        <Form.Group className="mb-0 text-start" controlId="observaciones">
                                            <Form.Label className='mt-1 mb-1'>Observaciones</Form.Label>
                                            <Form.Control className='form-control-sm' type="text" name="observaciones" placeholder="Deja tus comentarios aquí" />
                                        </Form.Group>
                                    </Col>

                                    <Col md={12} className='text-end mt-3'>
                                        <button type='submit' className="btn btn-sm btn-success">
                                            {'Transbordar'}
                                        </button>
                                    </Col>

                                </Row>
                            </Form>
                            {/*Final contenido*/}

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Transbordar;
