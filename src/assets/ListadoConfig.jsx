import React, { useEffect, useRef, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";

function ListadoConfig({ handleConfig }) {
  const formRef = useRef();

  const [dataList, setDataList] = useState([
    "Fecha",
    "Sem",
    "Booking",
    "BoL",
    "Naviera",
    "Buque",
    "Destino",
    "Llenado",
    "Contenedor",
    "Insumos de segurdad",
    "Producto",
    "Cajas",
    "Pallets",
    "Peso Bruto",
    "Peso Neto"
  ]);

  const [tags, setTags] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {

    let tagsList = localStorage.getItem("ListadoConfig") || `[ "Fecha", "Sem", "BoL",
      "Naviera", "Destino", "Llenado", "Contenedor", "Insumos de segurdad", "Producto",
      "Cajas", "Peso Neto"]`;
    tagsList = JSON.parse(tagsList);
    const newDataList = dataList.filter(item => !tagsList.includes(item));
    setTags(tagsList.sort());
    setDataList(newDataList.sort());

  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const json = JSON.stringify(tags.sort());
    localStorage.setItem("ListadoConfig", json);
    handleConfig();
  };

  const handleAddTag = () => {
    const input = inputRef.current.value;
    const res = tags.find(item => item == input);
    if (!res && (input != "")) {
      const newDataList = dataList.filter(item => ![...tags, input].includes(item));
      setTags([...tags, input].sort());
      setDataList(newDataList.sort());
    }
    inputRef.current.value = "";
  };

  const handleRemoveTag = (tag) => {
    const newList = tags.filter(item => item !== tag);
    setTags(newList.sort());
    setDataList([...dataList, tag].sort());
  };


  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform}>
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <span className="fw-bold">Configuración de campos</span>
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
              <div className="col-md-7">
                <label htmlFor="selectInsumo" className="form-label">Campo</label>
                <select
                  ref={inputRef}
                  id="selectInsumo"
                  name="selectInsumo"
                  className="form-control"
                >
                  <option selected value={""}>{""}</option>
                  {dataList.map((item, index) => (
                    <option key={index} value={item}>{item}</option>
                  ))}
                </select>
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
                        return (
                          <span
                            key={index}
                            className="badge bg-primary me-2 mb-2 d-flex align-items-center"
                          >
                            {tag}
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

export default ListadoConfig;
