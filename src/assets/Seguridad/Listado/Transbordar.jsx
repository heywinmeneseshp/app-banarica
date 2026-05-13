import { useEffect, useRef, useState } from 'react';
import styles2 from "@components/shared/Formularios/Formularios.module.css";
import { Button, Col, Container, Form, Row } from 'react-bootstrap';
import { FaMinus, FaPlus } from 'react-icons/fa';
import { listarAlmacenes } from '@services/api/almacenes';
import { listarCombos } from '@services/api/combos';
import { paginarListado } from '@services/api/listado';
import { agregarTransbordo } from '@services/api/transbordo';
import { listarSeriales } from '@services/api/seguridad';
import { filterActiveContainerRows, getLatestContainerRowByCode } from '@utils/contenedorEstado';

const createEmptySection = () => ({
    id: Date.now() + Math.random(),
    cod_productor: "",
    codigoPallet: "",
    producto: "",
    totalCajas: ""
});

const SelectField = ({ label, value, onChange, required = false, children }) => (
    <div>
        <Form.Label className="mb-1">{label}</Form.Label>
        <select className="form-control form-control-sm" value={value} required={required} onChange={onChange}>
            {children}
        </select>
    </div>
);

const DynamicSection = ({ section, onUpdate, onRemove, products, almacenes }) => {
    const handleFieldChange = (field, value) => {
        onUpdate(section.id, field, value);
    };

    return (
        <>
            <Col xs={12} md={6} lg={2}>
                <SelectField
                    label="Cod"
                    value={section.cod_productor}
                    required
                    onChange={(event) => handleFieldChange("cod_productor", event.target.value)}
                >
                    <option value=""></option>
                    {almacenes.map((item) => (
                        <option key={item.id} value={item.consecutivo}>
                            {item.consecutivo}
                        </option>
                    ))}
                </SelectField>
            </Col>

            <Col xs={12} md={6} lg={3}>
                <div>
                    <Form.Label className="mb-1">Serial</Form.Label>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={section.codigoPallet}
                        onChange={(event) => handleFieldChange("codigoPallet", event.target.value)}
                        placeholder="Palet"
                        required
                    />
                </div>
            </Col>

            <Col xs={12} md={6} lg={4}>
                <SelectField
                    label="Producto"
                    value={section.producto}
                    required
                    onChange={(event) => handleFieldChange("producto", event.target.value)}
                >
                    <option value=""></option>
                    {products.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.nombre}
                        </option>
                    ))}
                </SelectField>
            </Col>

            <Col xs={12} md={4} lg={2}>
                <div>
                    <Form.Label className="mb-1">Cajas</Form.Label>
                    <input
                        type="number"
                        className="form-control form-control-sm"
                        value={section.totalCajas}
                        onChange={(event) => handleFieldChange("totalCajas", event.target.value)}
                        placeholder="00"
                        required
                    />
                </div>
            </Col>

            <Col xs={12} md={2} lg={1} className="d-flex align-items-end">
                <button type="button" className="btn btn-outline-danger btn-sm w-100" onClick={() => onRemove(section.id)}>
                    <FaMinus />
                </button>
            </Col>
        </>
    );
};

const Transbordar = ({ setOpen = () => {}, pageMode = false }) => {
    const formRef = useRef();
    const [contenedores, setContenedores] = useState([]);
    const [semana, setSemana] = useState([]);
    const [listado, setListado] = useState([]);
    const [products, setProducts] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [sections, setSections] = useState([]);

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
                .sort((left, right) => (right?.id_contenedor || right?.Contenedor?.id || 0) - (left?.id_contenedor || left?.Contenedor?.id || 0))
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
        const semanaSeleccionada = String(formData.get('semana') || '').trim();
        const oldContainer = String(formData.get('contenedor') || '').trim().toUpperCase();
        const observaciones = formData.get('observaciones');
        const fecha = formData.get('fecha');
        const kit = formData.get('kit');
        const inspeccionado = formData.get('check') === 'on';
        const contenedorSeleccionado = getLatestContainerRowByCode(listado, oldContainer);
        if (!contenedorSeleccionado) return window.alert("El contenedor no existe");

        const contenedorOrigen = contenedorSeleccionado?.Contenedor;
        if (!contenedorOrigen?.id) return window.alert("No fue posible identificar el contenedor de origen.");

        const lineasContenedor = listado.filter(
            item => (item?.id_contenedor || item?.Contenedor?.id) === contenedorOrigen.id
        );
        if (lineasContenedor.length === 0) {
            return window.alert("No fue posible cargar las lineas del contenedor seleccionado.");
        }

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
            lineas_listado: lineasContenedor,
            usuario: usuario,
            observaciones: observaciones,
            cons_semana: semanaSeleccionada,
            inspeccionado,
            rechazos: sections
        };

        await agregarTransbordo(transbordo);
        window.alert("Transbordo realizado exitosamente.");
        formRef.current?.reset();
        setContenedores([]);
        setSemana([]);
        setListado([]);
        setSections([]);

        if (!pageMode) {
            setOpen(false);
        }
    };

    useEffect(() => {
        filtrarContenedores();
        const loadBaseData = async () => {
            try {
                const [productsData, almacenesData] = await Promise.all([
                    listarCombos(),
                    listarAlmacenes()
                ]);
                setProducts(productsData || []);
                setAlmacenes(almacenesData || []);
            } catch (error) {
                console.error('Error cargando datos base del transbordo:', error);
            }
        };

        loadBaseData();
    }, []);

    const handleSectionUpdate = (sectionId, field, value) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId ? { ...section, [field]: value } : section
            )
        );
    };

    const addSection = () => {
        setSections((prev) => [...prev, createEmptySection()]);
    };

    const removeSection = (id) => {
        setSections((prev) => prev.filter((section) => section.id !== id));
    };

    const formContent = (
        <Form ref={formRef} onSubmit={handleTransbordar}>
            <Row className="g-3">
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
                            {semana.map(item => <option key={item} value={item} />)}
                        </datalist>
                    </Form.Group>
                </Col>

                <Col md={3}>
                    <Form.Group className="mb-0" controlId="fecha">
                        <Form.Label className='mt-1 mb-1'>Fecha</Form.Label>
                        <Form.Control
                            className='form-control-sm'
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
                            title="Debe ser 4 letras seguidas de 7 numeros"
                            required
                            list="contenedores"
                            onChange={filtrarContenedores}
                        />
                        <datalist id="contenedores">
                            {contenedores.map(item => <option key={item} value={item} />)}
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
                            title="Debe ser 4 letras seguidas de 7 numeros"
                            placeholder="DUMY0000002"
                        />
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
                            placeholder="AA2L00001"
                        />
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

                <Col md={6}>
                    <Form.Group className="mb-0 text-start" controlId="observaciones">
                        <Form.Label className='mt-1 mb-1'>Observaciones</Form.Label>
                        <Form.Control
                            className='form-control-sm'
                            type="text"
                            name="observaciones"
                            placeholder="Deja tus comentarios aqui"
                        />
                    </Form.Group>
                </Col>

            </Row>

            <div className="card border-0 shadow-sm mt-4">
                <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                        <div>
                            <h5 className="mb-1">Rechazos del transbordo</h5>
                            <p className="text-muted mb-0">
                                Registra aqui las cajas rechazadas asociadas al nuevo contenedor.
                            </p>
                        </div>
                        <Button type="button" variant="outline-primary" size="sm" onClick={addSection}>
                            <FaPlus className="me-2" />
                            Agregar rechazo
                        </Button>
                    </div>

                    {sections.length === 0 ? (
                        <div className="text-muted small">
                            No hay rechazos agregados para este transbordo.
                        </div>
                    ) : (
                        <Row className="g-3">
                            {sections.map((section) => (
                                <DynamicSection
                                    key={section.id}
                                    section={section}
                                    onUpdate={handleSectionUpdate}
                                    onRemove={removeSection}
                                    products={products}
                                    almacenes={almacenes}
                                />
                            ))}
                        </Row>
                    )}
                </div>
            </div>

            <div className="d-flex justify-content-end mt-4">
                <Button type='submit' size="sm" variant="success">
                    Transbordar
                </Button>
            </div>
        </Form>
    );

    if (pageMode) {
        return (
            <Container>
                <h2 className="mb-2">Transbordar contenedor</h2>
                <div className="line"></div>
                <div className="card mt-4">
                    <div className="card-body">
                        {formContent}
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <div className={styles2.fondo}>
            <div
                className={styles2.floatingform}
                style={{
                    width: "min(96vw, 1100px)",
                    maxWidth: "1100px",
                    maxHeight: "90vh"
                }}
            >
                <div className="card">
                    <div className="card-header d-flex justify-content-between">
                        <span className="fw-bold">Realizar Transbordo</span>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn-close"
                            aria-label="Close"
                        />
                    </div>
                    <div className="card-body ">
                        {formContent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transbordar;
