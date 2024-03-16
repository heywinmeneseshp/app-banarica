import React, { useRef, useState } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";

function Formularios({ setAlert, element, setOpen, encabezados, actualizar, crear, onlyRead, valorPredeterminado }) {

  const formRef = useRef();

  useState(() => {

  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(formRef.current);
    let objeto = {};
    formData.forEach((value, key) => {
      objeto[key] = value;
    });
    if (element) {
      const id = objeto.id;
      delete objeto.id;
      actualizar(id, objeto);
      setOpen(false);
      setAlert({
        active: true,
        mensaje: "El item ha sido actualizado con éxito",
        color: "success",
        autoClose: true
      });
    } else {
      objeto["activo"] = true;
      crear(objeto);
      setOpen(false);
      setAlert({
        active: true,
        mensaje: "El item ha sido creado con éxito",
        color: "success",
        autoClose: true
      });
    }

  };


  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform}>
        <div className="card">
          <div className="card-header text-end">
            <button type="button" onClick={() => setOpen(false)} className="btn-close" aria-label="Close"></button>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-12">
                <form ref={formRef} onSubmit={handleSubmit} className="col-md-12 row" method="POST" action="/crear-conductor">
                  {Object.keys(encabezados).map((item, key) => {
                    var read = encabezados[item] == "id" ? true : false;
                    if(onlyRead) {
                     read = onlyRead.includes(encabezados[item]);
                    } 
                    return (
                      <div key={key} className="mb-3 col-md-3">
                        <label htmlFor={encabezados[item]} className="form-label mb-1">{`${item}:`}</label>
                        <input
                          type={encabezados[item] == "fecha" ? "date" : "text"}
                          id={encabezados[item]}
                          name={encabezados[item]}
                          className="form-control form-control-sm"
                          defaultValue={(encabezados[item] == onlyRead) ? valorPredeterminado : (element ? element[encabezados[item]] : null)}
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
