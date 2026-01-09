// Código optimizado con nuevos campos agregados
import React, { useEffect, useRef, useState, useCallback } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { encontrarModulo } from "@services/api/configuracion";
import { listarCombos } from "@services/api/combos";
import { paginarListado } from "@services/api/listado";
import { encontrarUnSerial, inspeccionAntinarcoticos } from "@services/api/seguridad";
import { FaPlus, FaMinus } from 'react-icons/fa';
import Loader from "@components/shared/Loader";
import { listarAlmacenes } from "@services/api/almacenes";

const CONTAINER_LENGTH = 11;

const useDates = () => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const getDateOffset = (months) => {
    const date = new Date(today);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  };
  return {
    currentDate: formattedDate,
    monthBefore: getDateOffset(-1),
    monthLater: getDateOffset(1)
  };
};

const InputField = ({ label, type = "text", id, value, onChange, required = false, readOnly = false, className = "", list, placeholder, onBlur, isValid = true, minLength, maxLength }) => (
  <div className="input-group">
    <span className="input-group-text">{label}:</span>
    <input
      type={type}
      id={id}
      className={`form-control ${className} ${isValid ? "" : "is-invalid"}`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      readOnly={readOnly}
      list={list}
      onBlur={onBlur}
      minLength={minLength}
      maxLength={maxLength}
    />
  </div>
);

const DynamicSection = ({ section, onUpdate, onRemove, products, almacenes }) => {
  const handleFieldChange = (field, value) => {
    onUpdate(section.id, field, value);
  };

  return (
    <>
      <div className="col-md-2 mb-3">
        <div className="input-group">
          <span className="input-group-text">Cod:</span>
          <select
            className="form-control"
            value={section.cod_productor}
            required
            onChange={(e) => handleFieldChange('cod_productor', e.target.value)}
          >
            <option value=""></option>
            {almacenes.map((item) => (
              <option key={item.id} value={item.consecutivo}>
                {item.consecutivo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="col-md-3 mb-3">
        <InputField
          label="Serial"
          type="text"
          value={section.codigoPallet}
          onChange={(e) => handleFieldChange('codigoPallet', e.target.value)}
          placeholder="Palet"
          required
        />
      </div>

      <div className="col-md-4 mb-3">
        <div className="input-group">
          <span className="input-group-text">Producto:</span>
          <select
            className="form-control"
            value={section.producto}
            required
            onChange={(e) => handleFieldChange('producto', e.target.value)}
          >
            <option value=""></option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="col-md-2 mb-3">
        <InputField
          label="Cajas"
          type="number"
          value={section.totalCajas}
          onChange={(e) => handleFieldChange('totalCajas', e.target.value)}
          placeholder="00"
          required
        />
      </div>

      <div className="col-md-1 mb-3">
        <button type="button" className="btn btn-danger w-100" onClick={() => onRemove(section.id)}>
          <FaMinus />
        </button>
      </div>

      <div className="line d-block d-md-none"></div>
    </>
  );
};

export default function InspeccionLLeno() {
  const { currentDate, monthBefore, monthLater } = useDates();
  const formRef = useRef();
  const [products, setProducts] = useState([]);
  const [contenedores, setContenedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState({ bolsa: true, contenedor: true });

  const [formData, setFormData] = useState({
    consecutivo: "",
    fecha: currentDate,
    hora_inicio: "",
    hora_fin: "",
    agente: "",
    zona: "",
    contenedor: '',
    bolsa: '',
    observaciones: ''
  });

  const [sections, setSections] = useState([]);

  const generarConsecutivo = useCallback(() => {
    const consecutivo = contenedores[0]?.id || "";
    setFormData(prev => ({ ...prev, consecutivo }));
  }, [contenedores]);

  const listarContenedores = useCallback(async (value) => {
    const filters = {
      contenedor: value,
      booking: '', bl: '', destino: '', naviera: '', cliente: '', semana: '', buque: '',
      fecha_inicial: monthBefore, fecha_final: monthLater,
      llenado: '', producto: '', habilitado: true
    };

    try {
      const listado = await paginarListado(1, 10, filters);
      const result = listado.data.map(item => item?.Contenedor).filter(item => item != null);
      const uniqueResult = [...new Set(result)];
      setContenedores(uniqueResult);
      setValidation(prev => ({ ...prev, contenedor: uniqueResult.length > 0 }));
    } catch (error) {
      console.error(error);
      setValidation(prev => ({ ...prev, contenedor: false }));
    }
  }, [monthBefore, monthLater]);

  const handleInputChange = useCallback((e) => {
    const { id, value } = e.target;
    if (id === "contenedor") listarContenedores(value);
    setFormData(prev => ({ ...prev, [id]: value }));
  }, [listarContenedores]);

  const handleSectionUpdate = useCallback((sectionId, field, value) => {
    setSections(prev => prev.map(section => section.id === sectionId ? { ...section, [field]: value } : section));
  }, []);

  const addSection = () => setSections(prev => [...prev, { id: Date.now(), cod_productor: "", codigoPallet: '', producto: '', totalCajas: '' }]);
  const removeSection = (id) => setSections(prev => prev.filter(section => section.id !== id));

  const validateForm = async () => {
    const kit = await encontrarUnSerial({ bag_pack: formData.bolsa, available: [true] });
    if (kit.length === 0) throw new Error('La Bolsa no existe');
    if (contenedores.length === 0) throw new Error('El Contenedor no existe');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await validateForm();
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      await inspeccionAntinarcoticos({ ...formData, id_usuario: usuario.id }, sections);
      window.alert("Datos cargados con éxito");
      setFormData({ consecutivo: "", fecha: currentDate, hora_inicio: "", hora_fin: "", agente: "", zona: "", contenedor: '', bolsa: '', observaciones: '' });
      setSections([]);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await encontrarModulo("Semana");
        const [productsData, almacenesData] = await Promise.all([listarCombos(), listarAlmacenes()]);
        setProducts(productsData);
        setAlmacenes(almacenesData);
      } catch (error) {
        console.error(error);
      }
    };
    initializeData();
  }, []);

  return (
    <>
      <Loader loading={loading} />
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="container">

          <div className="mb-4 mt-3 text-center"><h2>Inspección Lleno</h2></div>

          <div className="row">
            <div className="col-sm-6 col-md-3 mb-3">
              <InputField label="Cons" id="consecutivo" value={formData.consecutivo} readOnly placeholder="Consecutivo" />
            </div>

            <div className="col-sm-6 col-md-3 mb-3">
              <InputField label="Fecha" type="date" id="fecha" value={formData.fecha} onChange={handleInputChange} required />
            </div>

            <div className="col-sm-6 col-md-3 mb-3">
              <InputField label="Inicio" type="time" id="hora_inicio" value={formData.hora_inicio} onChange={handleInputChange} required />
            </div>

            <div className="col-sm-6 col-md-3 mb-3">
              <InputField label="Fin" type="time" id="hora_fin" value={formData.hora_fin} onChange={handleInputChange}  />
            </div>

        
            <div className="col-md-6 mb-3">
              <InputField label="Contenedor" id="contenedor" value={formData.contenedor} onChange={handleInputChange} onBlur={generarConsecutivo} required minLength={CONTAINER_LENGTH} maxLength={CONTAINER_LENGTH} placeholder="DUMMY000001" isValid={validation.contenedor} list="container-list" />
              <datalist id="container-list">
                {contenedores.map((item, index) => (<option key={index} value={item?.contenedor} />))}
              </datalist>
            </div>


            <div className="col-md-6 mb-3">
              <InputField label="Kit" id="bolsa" value={formData.bolsa} onChange={handleInputChange} required isValid={validation.bolsa} placeholder="AA2L0000" />
            </div>

              <div className="col-sm-6 col-md-6 mb-3">
              <InputField label="Agente" type="text" id="agente" value={formData.agente} onChange={handleInputChange} placeholder="Nombre del agente de policía" required />
            </div>

            <div className="col-sm-6 col-md-6 mb-3">
              <InputField label="Zona" type="text" id="zona" value={formData.zona} onChange={handleInputChange} placeholder="Zona de inspección" required />
            </div>


            <div className="col-md-6 mb-3">
              <button type="button" className="btn btn-primary w-100" onClick={addSection}><FaPlus /> Agregar Rechazo</button>
            </div>

            {sections.length > 0 && <div className="line"></div>}

            {sections.map(section => (
              <DynamicSection key={section.id} section={section} onUpdate={handleSectionUpdate} onRemove={removeSection} products={products} almacenes={almacenes} />
            ))}

            <div className="col-md-12 mb-3">
              <div className="input-group">
                <span className="input-group-text">Observaciones:</span>
                <textarea id="observaciones" className="form-control" placeholder="Escriba sus observaciones" onChange={handleInputChange} value={formData.observaciones} rows="3"></textarea>
              </div>
            </div>

            <div className="col-12 mb-2">
              <button type="submit" className="btn btn-success w-100">Guardar</button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
