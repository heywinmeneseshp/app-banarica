import React, { useRef, useState, useEffect } from "react";


import styles from "@components/shared/Formularios/Formularios.module.css";
import { Form } from "react-bootstrap";
import { listarUbicaciones } from "@services/api/ubicaciones";
import { listarConductores } from "@services/api/conductores";
import { listarVehiculo } from "@services/api/vehiculos";
import { listarClientes } from "@services/api/clientes";
import { actualizarProgramaciones } from "@services/api/programaciones";
import { agregarRutas, buscarRutaPost } from "@services/api/rutas";





export default function FormulariosProgramacionEditar({ element, setOpen, setAlert }) {

  const formRef = useRef();
  const [listaConductores, setListaConductores] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [change, setChange] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedContenedor, setIsCheckedContenedor] = useState(false);
  const [listaUbicaciones, setListaUbicaciones] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);



  useEffect(() => {
    setIsChecked(element.cobrar);
    listar();

  }, [change]);


  const handleSubmit = async () => {
    const formData = new FormData(formRef.current);
    if (formData.get("origen") == formData.get("destino")) return alert("El origen y el destino no puede ser el mismo.");
    const buscarRuta = { ubicacion1: formData.get("origen"), ubicacion2: formData.get("destino") };
    var existeRuta;
    try {
      existeRuta = await buscarRutaPost(buscarRuta);
    } catch (e) {
      existeRuta = await agregarRutas(buscarRuta);
    }
    let contenedor = null;
    if (isCheckedContenedor) {
      contenedor = formData.get("contenedor") ? formData.get("contenedor") : "DUMY0000000";
    }
    let objetoProgramacion = {
      ruta_id: existeRuta.data.id,
      cobrar: isChecked,
      id_pagador_flete: formData.get("cliente"),
      activo: (element ? element.activo : true),
      movimiento: formData.get("movimiento"),
      conductor_id: formData.get("conductor"),
      vehiculo_id: formData.get("vehiculo"),
      contenedor: contenedor,
      semana: formData.get("semana"),
      fecha: formData.get("fecha"),
      detalles: formData.get("detalles"),
      llegada_origen: formData.get("llegada_origen"),
      salida_origen: formData.get("salida_origen"),
      llegada_destino: formData.get("llegada_destino"),
      salida_destino: formData.get("salida_destino"),
    };

    await actualizarProgramaciones(element.id, objetoProgramacion);
    setChange(!change);
    setOpen(false);
    setAlert({
      active: true,
      mensaje: "La ruta ha sido programada con éxito",
      color: "success",
      autoClose: true
    });
  };

  const handleCheckBoxChange = () => {
    let newIsChecked = !isChecked;
    setIsChecked(newIsChecked);
  };

  const isContainter = () => {
    const formData = new FormData(formRef.current);
    const res = formData.get("movimiento") == "Contenedor" ? true : false;
    setIsCheckedContenedor(res);
  };



  const listar = async () => {
    let ubicaciones = await listarUbicaciones();
    let clientes = await listarClientes();
    let conductores = await listarConductores();
    let vehiculos = await listarVehiculo();
    setListaConductores(conductores);
    setListaVehiculos(vehiculos);
    setListaUbicaciones(ubicaciones);
    setListaClientes(clientes);
  };





  return (
    <>
      <div className={styles.fondo}>
        <div style={{ maxWidth: "90%" }} className={styles.floatingform}>
          <div style={{ maxWidth: "100%" }} className="card">
            <span style={{ maxWidth: "100%" }} className={styles.ventana}>
              <div className="card-header text-end">
                <button type="button" onClick={() => setOpen(false)} className="btn-close" aria-label="Close"></button>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-12"></div>

                  <form ref={formRef} className="container">
                    <span className="col-md-12 row">
                      <div className="mb-2 col-md-2">
                        <label htmlFor={"fecha"} className="form-label mb-1">Fecha</label>
                        <input
                          type="date"
                          id="fecha"
                          name="fecha"
                          className="form-control form-control-sm"
                          defaultValue={element.fecha}
                        />
                      </div>

                      <div className="mb-2 col-md-2">
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                          type="number"
                          id="semana"
                          name="semana"
                          className="form-control form-control-sm"
                          defaultValue={element.semana}
                          min={1}
                          max={53}


                        />
                      </div>


                      <div className="mb-2 col-md-2">
                        <label htmlFor="placa" className="form-label mb-1">Placa</label>
                        <select id="vehiculo"
                          name="vehiculo"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaVehiculos.map((item, index) => {
                            return (
                              <option key={index} selected={item?.id == element.vehiculo_id} value={item?.id}>{item?.placa}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-2">
                        <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
                        <select
                          id="conductor"
                          name="conductor"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaConductores.map((item, index) => {
                            return (
                              <option key={index} selected={item?.id == element.conductor_id} value={item?.id}>{item?.conductor}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className={`mb-2 col-md-2`}>
                        <label htmlFor="semana" className="form-label mb-1">Origen</label>
                        <select
                          id="origen"
                          name="origen"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaUbicaciones.map((item, index) => {
                            return (
                              <option
                                key={index}
                                value={item?.id}
                                selected={item?.id == element.ruta.ubicacion_1.id}
                              >{item?.ubicacion}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className={`mb-2 col-md-2`}>
                        <label htmlFor="semana" className="form-label mb-1">Destino</label>
                        <select
                          id="destino"
                          name="destino"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaUbicaciones.map((item, index) => {
                            return (
                              <option
                                key={index}
                                value={item?.id} selected={item?.id == element.ruta.ubicacion_2.id}
                              >{item?.ubicacion}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-2">
                        <label htmlFor={"llegada_origen"} className="form-label mb-1">Llegada en Origen</label>
                        <input
                          type="time"
                          id="llegada_origen"
                          name="llegada_origen"
                          className="form-control form-control-sm"
                          defaultValue={element.fecha}
                        />
                      </div>


                      <div className="mb-2 col-md-2">
                        <label htmlFor={"salida_origen"} className="form-label mb-1">Salida en Origen</label>
                        <input
                          type="time"
                          id="salida_origen"
                          name="salida_origen"
                          className="form-control form-control-sm"
                          defaultValue={element.fecha}
                        />
                      </div>


                      <div className="mb-2 col-md-2">
                        <label htmlFor={"llegada_destino"} className="form-label mb-1">Llegada en Destino</label>
                        <input
                          type="time"
                          id="llegada_destino"
                          name="llegada_destino"
                          className="form-control form-control-sm"
                          defaultValue={element.fecha}
                        />
                      </div>


                      <div className="mb-2 col-md-2">
                        <label htmlFor={"salida_destino"} className="form-label mb-1">Salida en Destino</label>
                        <input
                          type="time"
                          id="salida_destino"
                          name="salida_destino"
                          className="form-control form-control-sm"
                          defaultValue={element.fecha}
                        />
                      </div>

                      <div className="mb-2 col-md-2">
                        <label htmlFor="semana" className="form-label mb-1">Movimiento</label>
                        <select
                          id="movimiento"
                          name="movimiento"
                          className="form-control form-control-sm"
                          required
                          onChange={() => isContainter()}
                        >
                          <option value="Local">Local</option>
                          <option value="Puerto">Puerto</option>
                          <option value="Contenedor">Contenedor</option>
                          <option value="Transitorio">Transitorio</option>
                          <option value="Transitorio">Otro</option>
                        </select>
                      </div>



                      <div className="mt-3 mb-2 col-md-2 d-flex justify-content-center align-items-center">
                        <div className="container d-flex justify-content-center">
                          <div className="d-flex row justify-content-around">
                            <div className="col">
                              <Form.Check
                                type="checkbox"
                                id="cobrar"
                                label="Cobrar"
                                checked={isChecked}
                                onChange={handleCheckBoxChange}
                              />
                            </div>

                          </div>
                        </div>

                      </div>


                    </span>

                    <span className="col-md-12 row">




                      {isCheckedContenedor &&
                        <div className={`mb-2 col-md-6`}>
                          <label htmlFor="contenedor" className="form-label mb-1">Contenedor</label>
                          <input
                            type="text"
                            id="contenedor"
                            name="contenedor"
                            defaultValue={element.contenedor}
                            className="form-control form-control-sm"
                            maxLength={11}
                            required={true}

                          />
                        </div>
                      }



                      {isChecked &&
                        <div className={`mb-2 col-md-6`}>
                          <label htmlFor="cliente" className="form-label mb-1">Cliente</label>
                          <select
                            id="cliente"
                            name="cliente"
                            className="form-control form-control-sm"
                            required

                          >
                            {listaClientes.map((item, index) => {
                              return (
                                <option
                                  key={index}
                                  value={item?.id}
                                  selected={item?.id == element.id_pagador_flete}
                                >{item?.razon_social}</option>
                              );
                            })}
                          </select>
                        </div>
                      }


                      <div className={`mb-2 col-md-${isCheckedContenedor && !isChecked ? 6 : !isCheckedContenedor && !isChecked ? 12 : (isChecked && !isCheckedContenedor ? 6 : 12)}`}>
                        <label htmlFor="semana" className="form-label mb-1">Observaciones</label>
                        <input
                          type="text"
                          id="detalles"
                          name="detalles"
                          className="form-control form-control-sm"
                          required
                          defaultValue={element.detalles}

                        />
                      </div>


                    </span>

                    {/*PRODUCTOS */}


                    {/*BOTONES*/}
                    <span className="col-md-12 row mt-4 justify-content-end">
                      <div className="mb-2 col-md-4">
                        <button type="button" onClick={() => handleSubmit()} className={`btn btn-warning col-md-4 w-100`}>
                          {"Editar"}
                        </button>
                      </div>

                    </span>
                  </form>




                </div>
              </div>
            </span>
          </div>
        </div >
      </div >
    </>
  );
};