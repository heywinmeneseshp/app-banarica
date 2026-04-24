import React, { useRef } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { Form } from "react-bootstrap";

function Formularios({ titulo, setAlert, listas, element, setOpen, encabezados, actualizar, crear, onlyRead, valorPredeterminado, checkboxFields = [] }) {
  const formRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    const objeto = {};
    let validar = true;

    formData.forEach((value, key) => {
      if (checkboxFields.includes(key)) {
        return;
      }
      if (value === "" && key !== "id") {
        validar = false;
      }
      objeto[key] = value;
    });

    checkboxFields.forEach((field) => {
      const input = formRef.current?.elements?.namedItem(field);
      objeto[field] = Boolean(input?.checked);
    });

    if (!validar) {
      alert("Error, todas las casillas deben estar diligenciadas");
      return;
    }

    try {
      if (element) {
        const id = objeto.id;
        delete objeto.id;
        await actualizar(id, objeto);
        setOpen(false);
        setAlert({
          active: true,
          mensaje: "El item ha sido actualizado con exito",
          color: "success",
          autoClose: true
        });
        return;
      }

      if (!objeto.id) {
        delete objeto.id;
      }

      objeto.activo = true;
      await crear(objeto);
      setOpen(false);
      setAlert({
        active: true,
        mensaje: "El item ha sido creado con exito",
        color: "success",
        autoClose: true
      });
    } catch (error) {
      setAlert({
        active: true,
        mensaje: error.message || "Se presento un error al guardar el item",
        color: "danger",
        autoClose: true
      });
    }
  };

  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform}>
        <div className="card">
          <div className="card-header d-flex justify-content-between">
            <span className="fw-bold">{titulo ? titulo : ""}</span>
            <button type="button" onClick={() => setOpen(false)} className="btn-close" aria-label="Close"></button>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-12">
                <form ref={formRef} onSubmit={handleSubmit} className="col-md-12 row">
                  {Object.keys(encabezados).map((item, key) => {
                    if (!element && encabezados[item] === "id") {
                      return null;
                    }

                    let read = encabezados[item] === "id";
                    if (onlyRead) {
                      read = onlyRead.includes(encabezados[item]);
                    }

                    let lista = null;
                    try {
                      lista = listas[item];
                    } catch {
                      lista = null;
                    }

                    if (lista != null) {
                      return (
                        <div key={key} className="mb-3 col-md-3">
                          <label htmlFor={encabezados[item]} className="form-label mb-1">{`${item}:`}</label>
                          <select
                            id={encabezados[item]}
                            name={encabezados[item]}
                            className="form-control form-control-sm"
                            defaultValue={element ? element[encabezados[item]] : ""}
                          >
                            <option value=""></option>
                            {listas[item].map((item2) => (
                              <option key={item2.id} value={item2.id}>{item2.nombre}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (checkboxFields.includes(encabezados[item])) {
                      return (
                        <div key={key} className="mb-3 col-md-3 d-flex align-items-end">
                          <Form.Check
                            id={encabezados[item]}
                            name={encabezados[item]}
                            type="checkbox"
                            label={item}
                            defaultChecked={Boolean(element ? element[encabezados[item]] : false)}
                            disabled={read}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="mb-3 col-md-3">
                        <label htmlFor={encabezados[item]} className="form-label mb-1">{`${item}:`}</label>
                        <input
                          type={encabezados[item] === "fecha" ? "date" : "text"}
                          id={encabezados[item]}
                          name={encabezados[item]}
                          className="form-control form-control-sm"
                          defaultValue={encabezados[item] === onlyRead ? valorPredeterminado : (element ? element[encabezados[item]] : "")}
                          required
                          readOnly={read}
                        />
                      </div>
                    );
                  })}
                  <div className="mb-3 mt-3 col-md-12 align-items-end justify-content-end">
                    <div className="text-center text-lg-end">
                      <button type="submit" className={`btn btn-${element ? "warning" : "success"} col-md-3`}>
                        {element ? "Guardar" : "Crear nuevo"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Formularios;
