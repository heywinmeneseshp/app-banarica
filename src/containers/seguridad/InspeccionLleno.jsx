import React, { useEffect, useRef, useState, useCallback } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { encontrarModulo } from "@services/api/configuracion";
import { listarCombos } from "@services/api/combos";
import { paginarListado } from "@services/api/listado";
import { encontrarUnSerial, inspeccionAntinarcoticos } from "@services/api/seguridad";
import { FaPlus, FaMinus } from 'react-icons/fa';
import Loader from "@components/shared/Loader";
import { listarAlmacenes } from "@services/api/almacenes";

// Constantes para configuración
const CONTAINER_LENGTH = 11;

// Hook personalizado para fechas
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

// Componente para campos de entrada
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

// Componente para secciones dinámicas
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
        <button
          type="button"
          className="btn btn-danger w-100"
          onClick={() => onRemove(section.id)}
          title="Eliminar sección"
        >
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
  const [validation, setValidation] = useState({
    bolsa: true,
    contenedor: true
  });

  const [formData, setFormData] = useState({
    consecutivo: "",
    fecha: currentDate,
    contenedor: '',
    bolsa: '',
    observaciones: ''
  });

  const [sections, setSections] = useState([]);

  // Generar consecutivo único
  const generarConsecutivo = useCallback(() => {
    const consecutivo = contenedores[0]?.id || "";
    setFormData(prev => ({ ...prev, consecutivo }));
  }, [contenedores]);

  // Listar contenedores
  const listarContenedores = useCallback(async (value) => {
    const filters = {
      contenedor: value,
      booking: '',
      bl: '',
      destino: '',
      naviera: '',
      cliente: '',
      semana: '',
      buque: '',
      fecha_inicial: monthBefore,
      fecha_final: monthLater,
      llenado: '',
      producto: '',
      habilitado: true,
    };

    try {
      const listado = await paginarListado(1, 10, filters);
      const result = listado.data
        .map(item => item?.Contenedor)
        .filter(item => item != null);
      
      const uniqueResult = [...new Set(result)];
      const semana = listado.data
        .filter(item => item?.Contenedor?.contenedor === uniqueResult[0]?.contenedor)[0]
        ?.Embarque?.semana?.consecutivo;

      setContenedores(uniqueResult);
      setValidation(prev => ({ 
        ...prev, 
        contenedor: uniqueResult.length > 0 
      }));
      
      // Actualizar consSemana en el estado si es necesario
      if (semana) {
        setFormData(prev => ({ ...prev, semana }));
      }
    } catch (error) {
      console.error('Error al listar contenedores:', error);
      setValidation(prev => ({ ...prev, contenedor: false }));
    }
  }, [monthBefore, monthLater]);

  // Manejar cambios en el formulario principal
  const handleInputChange = useCallback((e) => {
    const { id, value } = e.target;
    
    if (id === "contenedor") {
      listarContenedores(value);
    }
    
    setFormData(prev => ({ ...prev, [id]: value }));
  }, [listarContenedores]);

  // Manejar cambios en secciones dinámicas
  const handleSectionUpdate = useCallback((sectionId, field, value) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, [field]: value } : section
    ));
  }, []);

  // Agregar nueva sección
  const addSection = useCallback(() => {
    setSections(prev => [
      ...prev,
      { 
        id: Date.now(), 
        cod_productor: "", 
        codigoPallet: '', 
        producto: '', 
        totalCajas: '' 
      }
    ]);
  }, []);

  // Eliminar sección
  const removeSection = useCallback((id) => {
    setSections(prev => prev.filter(section => section.id !== id));
  }, []);

  // Validar formulario
  const validateForm = async () => {
    // Validar bolsa
    const kit = await encontrarUnSerial({
      bag_pack: formData.bolsa,
      available: [true],
    });

    if (kit.length === 0) {
      setValidation(prev => ({ ...prev, bolsa: false }));
      throw new Error('La Bolsa no existe');
    }

    // Validar contenedor
    if (contenedores.length === 0) {
      setValidation(prev => ({ ...prev, contenedor: false }));
      throw new Error('El Contenedor no existe');
    }

    setValidation({ bolsa: true, contenedor: true });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await validateForm();
      
      const usuario = JSON.parse(localStorage.getItem("usuario"));
      await inspeccionAntinarcoticos(
        { ...formData, id_usuario: usuario.id }, 
        sections
      );

      // Resetear formulario
      setFormData({
        consecutivo: "",
        fecha: currentDate,
        contenedor: '',
        bolsa: '',
        observaciones: ''
      });
      setSections([]);
      
      window.alert("Datos cargados con éxito");
    } catch (error) {
      window.alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Efectos iniciales
  useEffect(() => {
    const initializeData = async () => {
      try {
        await encontrarModulo("Semana");
        const [productsData, almacenesData] = await Promise.all([
          listarCombos(),
          listarAlmacenes()
        ]);
        setProducts(productsData);
        setAlmacenes(almacenesData);
      } catch (error) {
        console.error('Error inicializando datos:', error);
      }
    };

    initializeData();
  }, []);

  return (
    <>
      <Loader loading={loading} />

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="container">
          <div className="mb-4 mt-3 text-center">
            <h2>Inspección Lleno</h2>
          </div>

          <div className="container">
            <div className="row">
              {/* Campos principales */}
              <div className="col-sm-6 col-md-3 mb-3">
                <InputField
                  label="Cons"
                  type="text"
                  id="consecutivo"
                  value={formData.consecutivo}
                  readOnly
                  placeholder="Consecutivo"
                />
              </div>

              <div className="col-sm-6 col-md-3 mb-3">
                <InputField
                  label="Fecha"
                  type="date"
                  id="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="col-md-6 mb-3">
                <InputField
                  label="Contenedor"
                  type="text"
                  id="contenedor"
                  value={formData.contenedor}
                  onChange={handleInputChange}
                  onBlur={generarConsecutivo}
                  required
                  minLength={CONTAINER_LENGTH}
                  maxLength={CONTAINER_LENGTH}
                  placeholder="DUMMY000001"
                  isValid={validation.contenedor}
                  list="container-list"
                />
                <datalist id="container-list">
                  {contenedores.map((item, index) => (
                    <option key={index} value={item?.contenedor} />
                  ))}
                </datalist>
              </div>

              <div className="col-md-6 mb-3">
                <InputField
                  label="Kit"
                  type="text"
                  id="bolsa"
                  value={formData.bolsa}
                  onChange={handleInputChange}
                  required
                  placeholder="AA2L0000"
                  isValid={validation.bolsa}
                />
              </div>

              {/* Botón para agregar secciones */}
              <div className="col-md-6 mb-3">
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={addSection}
                >
                  <FaPlus /> Agregar Rechazo
                </button>
              </div>

              {sections.length > 0 && <div className="line"></div>}

              {/* Secciones dinámicas */}
              {sections.map(section => (
                <DynamicSection
                  key={section.id}
                  section={section}
                  onUpdate={handleSectionUpdate}
                  onRemove={removeSection}
                  products={products}
                  almacenes={almacenes}
                />
              ))}

              {sections.length > 0 && <div className="line d-none d-md-block"></div>}

              {/* Observaciones */}
              <div className="col-md-12 mb-3">
                <div className="input-group">
                  <span className="input-group-text">Observaciones:</span>
                  <textarea
                    id="observaciones"
                    className="form-control"
                    placeholder="Escriba sus observaciones"
                    onChange={handleInputChange}
                    value={formData.observaciones}
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 mb-2">
              <button type="submit" className="btn btn-success w-100">
                Guardar
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}