import React, { useEffect, useRef, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { listarProductos } from "@services/api/productos";
import { actualizarModulo, encontrarModulo } from "@services/api/configuracion";

function InsumoConfig({handleConfig, modulo_confi }) {
  const formRef = useRef();


  const [productos, setProductos] = useState([]);
  const [selectedConsecutivo, setSelectedConsecutivo] = useState('');
  const [tags, setTags] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    listarProductos().then(res => setProductos(res || []));
    encontrarModulo(modulo_confi).then(res => {
      setTags(JSON.parse(res[0].detalles || "[]"));
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const json = JSON.stringify(tags);
    actualizarModulo({
      "modulo": modulo_confi,
      "detalles": json
    });
    handleConfig();
  };

  const handleAddTag = () => {
    if (selectedConsecutivo && !tags.includes(selectedConsecutivo)) {
      setTags([...tags, selectedConsecutivo]);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
      setSelectedConsecutivo("");
    } 
  };

  const handleRemoveTag = (tag) => {
    const newList = tags.filter(item => item !== tag);
    setTags(newList);
  };

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const selectedProduct = productos.find((product) => product.name === selectedValue
    );
    setSelectedConsecutivo(selectedProduct ? selectedProduct.consecutivo : "");
    // Puedes realizar otras acciones aquí con selectedValue
  };
  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform}>
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <span className="fw-bold">Configuración de insumos</span>
            <button
              type="button"
              onClick={handleConfig} // Close or go back
              className="btn-close"
              aria-label="Close"
            />
          </div>
          <div className="card-body">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="row g-3" // Added gap between rows
              method="POST"
              action="/crear-conductor" // Update action URL if needed
            >
              <div className="col-md-2">
                <label htmlFor="selectInsumo" className="form-label">Consecutivo</label>
                <input
                  type="text"
                  id="selectInsumo"
                  list="articulo"
                  name="inputField"
                  className="form-control"
                  value={selectedConsecutivo}
                  disabled
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="selectInsumo" className="form-label">Insumo</label>
                <input
                  ref={inputRef}
                  onChange={handleChange}
                  type="text"
                  id="selectInsumo"
                  list="articulo"
                  name="inputField"
                  className="form-control"
                  placeholder="Ingrese el nombre del insumo"
                />
                <datalist id="articulo">
                  {productos.map((item, index) => (
                    <option key={index} value={item.name} />

                  ))}
                </datalist>
              </div>
              <div style={{ margin: "auto auto 0px auto" }} className="col-md-5">
                <button
                  type="button"
                  className={`btn btn-primary w-100`}
                  onClick={handleAddTag}
                >Agregar
                </button>
              </div>





              <div className="mt-12">
                <div className="card">

                  <div className="card-body">
                    <div className="d-flex flex-wrap">
                      {tags.map((tag, index) => {
                        const res = productos.find(item => item.consecutivo == tag);
                        return (
                          <span
                            key={index}
                            className="badge bg-primary me-2 mb-2 d-flex align-items-center"
                          >
                            {res?.name}
                            <button
                              type="button"
                              className="btn-close btn-sm ms-2"
                              aria-label="Remove"
                              onClick={() => handleRemoveTag(tag)}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <button
                  type="submit"
                  className={`btn btn-success`}
                >
                  {"Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InsumoConfig;
