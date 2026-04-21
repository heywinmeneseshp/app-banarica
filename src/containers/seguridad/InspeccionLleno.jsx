import React, { useCallback, useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaMinus, FaPlus } from "react-icons/fa";
import Loader from "@components/shared/Loader";
import { listarAlmacenes } from "@services/api/almacenes";
import { listarCombos } from "@services/api/combos";
import { paginarListado } from "@services/api/listado";
import { encontrarUnSerial, inspeccionAntinarcoticos } from "@services/api/seguridad";
import { filterActiveContainerRows } from "@utils/contenedorEstado";

const CONTAINER_LENGTH = 11;

const getSearchWindow = () => {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);

  from.setMonth(from.getMonth() - 1);
  to.setMonth(to.getMonth() + 1);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0]
  };
};

const createInitialFormData = () => ({
  consecutivo: "",
  fecha: "",
  hora_inicio: "",
  hora_fin: "",
  agente: "",
  zona: "",
  contenedor: "",
  bolsa: "",
  observaciones: ""
});

const createEmptySection = () => ({
  id: Date.now() + Math.random(),
  cod_productor: "",
  codigoPallet: "",
  producto: "",
  totalCajas: ""
});

const InputField = ({
  label,
  type = "text",
  id,
  value,
  onChange,
  required = false,
  readOnly = false,
  className = "",
  list,
  placeholder,
  onBlur,
  isValid = true,
  minLength,
  maxLength
}) => (
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

const SelectField = ({ label, value, onChange, required = false, children }) => (
  <div className="input-group">
    <span className="input-group-text">{label}:</span>
    <select className="form-control" value={value} required={required} onChange={onChange}>
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
      <div className="col-md-2 mb-3">
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
      </div>

      <div className="col-md-3 mb-3">
        <InputField
          label="Serial"
          type="text"
          value={section.codigoPallet}
          onChange={(event) => handleFieldChange("codigoPallet", event.target.value)}
          placeholder="Palet"
          required
        />
      </div>

      <div className="col-md-4 mb-3">
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
      </div>

      <div className="col-md-2 mb-3">
        <InputField
          label="Cajas"
          type="number"
          value={section.totalCajas}
          onChange={(event) => handleFieldChange("totalCajas", event.target.value)}
          placeholder="00"
          required
        />
      </div>

      <div className="col-md-1 mb-3">
        <button type="button" className="btn btn-outline-danger w-100" onClick={() => onRemove(section.id)}>
          <FaMinus />
        </button>
      </div>
    </>
  );
};

export default function InspeccionLLeno() {
  const searchWindow = useMemo(() => getSearchWindow(), []);

  const [formData, setFormData] = useState(createInitialFormData);
  const [products, setProducts] = useState([]);
  const [contenedores, setContenedores] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState({ bolsa: true, contenedor: true });

  const containerSuggestions = useMemo(
    () => contenedores.map((item) => item?.contenedor).filter(Boolean),
    [contenedores]
  );

  const fetchContainers = useCallback(
    async (value) => {
      const code = String(value || "").trim().toUpperCase();

      if (!code || code.length < CONTAINER_LENGTH - 4) {
        setContenedores([]);
        setValidation((prev) => ({ ...prev, contenedor: true }));
        return;
      }

      const filters = {
        contenedor: code,
        booking: "",
        bl: "",
        destino: "",
        naviera: "",
        cliente: "",
        semana: "",
        buque: "",
        fecha_inicial: searchWindow.from,
        fecha_final: searchWindow.to,
        llenado: "",
        producto: "",
        habilitado: true
      };

      try {
        const listado = await paginarListado(1, 25, filters);
        const rows = filterActiveContainerRows(listado.data || []);

        const uniqueContainers = Array.from(
          new Map(
            rows
              .map((item) => item?.Contenedor)
              .filter(Boolean)
              .map((item) => [item.id, item])
          ).values()
        );

        setContenedores(uniqueContainers);
        setValidation((prev) => ({ ...prev, contenedor: uniqueContainers.length > 0 }));
      } catch (error) {
        console.error("Error al listar contenedores:", error);
        setContenedores([]);
        setValidation((prev) => ({ ...prev, contenedor: false }));
      }
    },
    [searchWindow]
  );

  const assignConsecutivo = useCallback((containerCode) => {
    const code = String(containerCode || "").trim().toUpperCase();
    const selected = contenedores.find((item) => item?.contenedor === code);

    setFormData((prev) => ({
      ...prev,
      contenedor: code || prev.contenedor,
      consecutivo: selected?.id || ""
    }));

    setValidation((prev) => ({ ...prev, contenedor: Boolean(selected) }));
  }, [contenedores]);

  const handleInputChange = useCallback(
    (event) => {
      const { id, value } = event.target;
      const normalizedValue = id === "contenedor" || id === "bolsa" ? value.toUpperCase() : value;

      setFormData((prev) => ({
        ...prev,
        [id]: normalizedValue
      }));

      if (id === "contenedor") {
        setFormData((prev) => ({ ...prev, contenedor: normalizedValue, consecutivo: "" }));
        fetchContainers(normalizedValue);
      }

      if (id === "bolsa") {
        setValidation((prev) => ({ ...prev, bolsa: true }));
      }
    },
    [fetchContainers]
  );

  const handleSectionUpdate = useCallback((sectionId, field, value) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    );
  }, []);

  const addSection = useCallback(() => {
    setSections((prev) => [...prev, createEmptySection()]);
  }, []);

  const removeSection = useCallback((id) => {
    setSections((prev) => prev.filter((section) => section.id !== id));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialFormData());
    setSections([]);
    setContenedores([]);
    setValidation({ bolsa: true, contenedor: true });
  }, []);

  const validateForm = useCallback(async () => {
    const bagCode = String(formData.bolsa || "").trim().toUpperCase();
    const selectedContainer = contenedores.find(
      (item) => item?.contenedor === String(formData.contenedor || "").trim().toUpperCase()
    );

    if (!selectedContainer) {
      setValidation((prev) => ({ ...prev, contenedor: false }));
      throw new Error("Selecciona un contenedor válido del listado.");
    }

    const kit = await encontrarUnSerial({ bag_pack: bagCode, available: [true] });
    const hasKit = Array.isArray(kit) && kit.length > 0;

    setValidation((prev) => ({ ...prev, bolsa: hasKit }));

    if (!hasKit) {
      throw new Error("El kit ingresado no existe o ya fue utilizado.");
    }

    return selectedContainer;
  }, [contenedores, formData.bolsa, formData.contenedor]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const selectedContainer = await validateForm();
      const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");

      await inspeccionAntinarcoticos(
        {
          ...formData,
          bolsa: String(formData.bolsa || "").trim().toUpperCase(),
          contenedor: selectedContainer.contenedor,
          consecutivo: selectedContainer.id,
          id_usuario: usuario.id
        },
        sections
      );

      window.alert("Datos cargados con éxito");
      resetForm();
    } catch (error) {
      window.alert(error.message || "No fue posible guardar la inspección.");
    } finally {
      setLoading(false);
    }
  }, [formData, resetForm, sections, validateForm]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [productsData, almacenesData] = await Promise.all([
          listarCombos(),
          listarAlmacenes()
        ]);

        setProducts(productsData || []);
        setAlmacenes(almacenesData || []);
      } catch (error) {
        console.error("Error inicializando inspección lleno:", error);
      }
    };

    initializeData();
  }, []);

  return (
    <>
      <Loader loading={loading} />

      <form onSubmit={handleSubmit}>
        <div className="container py-3">
          <div className="text-center mb-4">
            <h2 className="mb-2">Inspección Lleno</h2>
            <p className="text-muted mb-0">
              Registra la inspección antinarcóticos del contenedor lleno.
            </p>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Cons"
                    id="consecutivo"
                    value={formData.consecutivo}
                    readOnly
                    placeholder="Se asigna al elegir el contenedor"
                  />
                </div>

                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Fecha"
                    type="date"
                    id="fecha"
                    value={formData.fecha}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Inicio"
                    type="time"
                    id="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="col-sm-6 col-lg-3">
                  <InputField
                    label="Fin"
                    type="time"
                    id="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-lg-6">
                  <InputField
                    label="Contenedor"
                    id="contenedor"
                    value={formData.contenedor}
                    onChange={handleInputChange}
                    onBlur={(event) => assignConsecutivo(event.target.value)}
                    required
                    minLength={CONTAINER_LENGTH}
                    maxLength={CONTAINER_LENGTH}
                    placeholder="DUMMY000001"
                    isValid={validation.contenedor}
                    list="container-list"
                  />
                  <datalist id="container-list">
                    {containerSuggestions.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>

                <div className="col-lg-6">
                  <InputField
                    label="Kit"
                    id="bolsa"
                    value={formData.bolsa}
                    onChange={handleInputChange}
                    required
                    isValid={validation.bolsa}
                    placeholder="AA2L0000"
                  />
                </div>

                <div className="col-md-6">
                  <InputField
                    label="Agente"
                    id="agente"
                    value={formData.agente}
                    onChange={handleInputChange}
                    placeholder="Nombre del agente de policía"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <InputField
                    label="Zona"
                    id="zona"
                    value={formData.zona}
                    onChange={handleInputChange}
                    placeholder="Zona de inspección"
                    required
                  />
                </div>

                <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-2 mt-2">
                  <div className="mt-2">
                 
                    <span className="text-muted small">
                 
                    </span>
                  </div>

                  <button type="button" className="btn btn-primary" onClick={addSection}>
                    <FaPlus className="me-2" />
                    Agregar rechazo
                  </button>
                </div>

                {sections.length > 0 && (
                  <div className="col-12">
                    <div className="border rounded-3 p-3 bg-light-subtle">
                      <div className="row g-2">
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
                      </div>
                    </div>
                  </div>
                )}

                <div className="col-12">
                  <div className="input-group">
                    <span className="input-group-text">Observaciones:</span>
                    <textarea
                      id="observaciones"
                      className="form-control"
                      placeholder="Escriba sus observaciones"
                      onChange={handleInputChange}
                      value={formData.observaciones}
                      rows="4"
                    />
                  </div>
                </div>

                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-success flex-fill">
                    Guardar
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
