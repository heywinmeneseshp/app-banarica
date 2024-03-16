import React, { useRef, useState, useEffect } from "react";
import styles from "@components/shared/Formularios/Formularios.module.css";
import { Form, InputGroup } from "react-bootstrap";
import { listarUbicaciones } from "@services/api/ubicaciones";
import { listarConductores } from "@services/api/conductores";
import { listarVehiculo } from "@services/api/vehiculos";
import { listarProductos } from "@services/api/productos";
import { listarClientes } from "@services/api/clientes";
import { agregarProgramaciones } from "@services/api/programaciones";
import { agregarRutas, buscarRutaPost } from "@services/api/rutas";
import { agregarProductosViaje } from "@services/api/productos_viaje";



export default function FormulariosProgramacion({ element, setOpen, setAlert }) {
  const formRef = useRef();
  const [date, setDate] = useState("");
  const [numero, setNumero] = useState(0);
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedContenedor, setIsCheckedContenedor] = useState(false);
  const [listaUbicaciones, setListaUbicaciones] = useState([]);
  const [listaConductores, setListaConductores] = useState([]);
  const [listaVehiculos, setListaVehiculos] = useState([]);
  const [listaProductos, setListaProductos] = useState([]);
  const [listaClientes, setListaClientes] = useState([]);


  useEffect(() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth() + 1; // Se suma 1 porque los meses comienzan desde 0
    const dia = hoy.getDate();
    const fechaHoy = `${año}-${mes < 10 ? '0' + mes : mes}-${dia < 10 ? '0' + dia : dia}`;
    setDate(fechaHoy);
    listar();
  }, [isCheckedContenedor]);

  const listar = async () => {
    let ubicaciones = await listarUbicaciones();
    let conductores = await listarConductores();
    let vehiculos = await listarVehiculo();
    let productos = await listarProductos();
    let clientes = await listarClientes();
    setListaConductores(conductores);
    setListaUbicaciones(ubicaciones);
    setListaVehiculos(vehiculos);
    setListaProductos(productos);
    setListaClientes(clientes);
  };

  const handleAgregar = () => {
    let nuevoNumero = numero + 1;
    setNumero(nuevoNumero);
  };

  const handleEliminar = () => {
    if (!(numero < 1)) {
      let nuevoNumero = numero - 1;
      setNumero(nuevoNumero);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      cobrar: formData.get("semana"),
      id_pagador_flete: formData.get("cliente"),
      activo: (element ? element.activo : true),
      movimiento: formData.get("movimiento"),
      conductor_id: formData.get("conductor"),
      vehiculo_id: formData.get("vehiculo"),
      contenedor: contenedor,
      semana: formData.get("semana"),
      fecha: formData.get("fecha"),
      detalles: formData.get("detalles")
    };

    const { data } = await agregarProgramaciones(objetoProgramacion);
    Array.from({ length: numero }).map((_, index) => {
      const objeto = {
        programacion_id: data.id,
        producto_id: formData.get(`producto-${index}`),
        unidad_de_medida: formData.get(`pieza-${index}`), // Corregido el símbolo de asignación
        cantidad: formData.get(`cantidad-${index}`),
        activo: true
      };
      agregarProductosViaje(objeto);
    });
    setOpen(false);
    setAlert({
      active: true,
      mensaje: "La ruta ha sido programada con éxito",
      color: "success",
      autoClose: true
    });
  };

  return (
    <div className={styles.fondo}>
      <div className={styles.floatingform}>
        <div className="card">
          <span className={styles.ventana}>
            <div className="card-header text-end">
              <button type="button" onClick={() => setOpen(false)} className="btn-close" aria-label="Close"></button>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-12">
                  <form ref={formRef} onSubmit={handleSubmit} className="container" method="POST" action="/crear-conductor">
                    {/*Inputs*/}
                    <span className="col-md-12 row">
                      <div className="mb-2 col-md-2">
                        <label htmlFor={"fecha"} className="form-label mb-1">Fecha</label>
                        <input
                          type="date"
                          id="fecha"
                          name="fecha"
                          className="form-control form-control-sm"
                          defaultValue={date}
                          required
                        />
                      </div>

                      <div className="mb-2 col-md-2">
                        <label htmlFor="semana" className="form-label mb-1">Semana</label>
                        <input
                          type="number"
                          id="semana"
                          name="semana"
                          className="form-control form-control-sm"
                          defaultValue={0}
                          min={1}
                          max={53}
                          required
                        />
                      </div>


                      <div className="mb-2 col-md-2">
                        <label htmlFor="placa" className="form-label mb-1">Placa</label>
                        <select id="vehiculo"
                          name="vehiculo"
                          className="form-control form-control-sm"
                          required >
                          {listaVehiculos.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.placa}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-3">
                        <label htmlFor="conductor" className="form-label mb-1">Conductor</label>
                        <select
                          id="conductor"
                          name="conductor"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaConductores.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.conductor}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-3">
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

                      <div className="mb-2 col-md-3">
                        <label htmlFor="semana" className="form-label mb-1">Origen</label>
                        <select
                          id="origen"
                          name="origen"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaUbicaciones.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.ubicacion}</option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="mb-2 col-md-3">
                        <label htmlFor="semana" className="form-label mb-1">Destino</label>
                        <select
                          id="destino"
                          name="destino"
                          className="form-control form-control-sm"
                          required
                        >
                          {listaUbicaciones.map((item, index) => {
                            return (
                              <option key={index} value={item?.id}>{item?.ubicacion}</option>
                            );
                          })}
                        </select>
                      </div>

                      {isCheckedContenedor &&
                        <div className={`mb-2 col-md-3`}>
                          <label htmlFor="contenedor" className="form-label mb-1">Contenedor</label>
                          <input
                            type="text"
                            id="contenedor"
                            name="contenedor"
                            className="form-control form-control-sm"
                            maxLength={11}
                            required={true}
                          />
                        </div>
                      }


                      <div className="mt-3 mb-2 col-md-3 d-flex justify-content-center align-items-center">
                        <div>
                          <Form.Check
                            type="checkbox"
                            id="cobrar"
                            label="Cobrar"
                            checked={isChecked}
                            onChange={handleCheckBoxChange}
                          />
                        </div>

                      </div>


                      {isChecked &&
                        <div className={`mb-2 col-md-12`}>
                          <label htmlFor="cliente" className="form-label mb-1">Cliente</label>
                          <select
                            id="cliente"
                            name="cliente"
                            className="form-control form-control-sm"
                            required
                          >
                            {listaClientes.map((item, index) => {
                              return (
                                <option key={index} value={item?.id}>{item?.razon_social}</option>
                              );
                            })}
                          </select>
                        </div>
                      }


                      {isChecked &&
                        <div className="mt-3 mb-0 col-md-12">
                          <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text required id="inputGroup-sizing-sm">Observaciones</InputGroup.Text>
                            <Form.Control id="detalles" name="detalles" type="text" />
                          </InputGroup>
                        </div>
                      }

                    </span>

                    {/*Borde*/}
                    <div className="border border-1 mt-3 mb-4 border-secondary"></div>

                    {/* Producto*/}
                    {Array.from({ length: numero }).map((_, index) => (
                      <span key={index} className="col-md-12 row mt-0">
                        <div className="mb-2 col-md-6">
                          <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text id="inputGroup-sizing-sm">Producto</InputGroup.Text>
                            <Form.Select id={`producto-${index}`} name={`producto-${index}`} aria-label="Default select example">
                              {listaProductos.map((item, index) => {
                                return (
                                  <option key={index} value={item?.id}>{item?.name}</option>
                                );
                              })}
                            </Form.Select>
                          </InputGroup>
                        </div>
                        <div className="mb-2 col-md-3">
                          <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text id="inputGroup-sizing-sm">Pieza</InputGroup.Text>
                            <Form.Select id={`pieza-${index}`} name={`pieza-${index}`} aria-label="Default select example">
                              <option value="Cajas">Cajas</option>
                              <option value="Palets">Palets</option>
                              <option value="Unidades">Unidades</option>
                            </Form.Select>
                          </InputGroup>
                        </div>
                        <div className="mb-2 col-md-3">
                          <InputGroup size="sm" className="mb-2">
                            <InputGroup.Text id="inputGroup-sizing-sm">Cantidad</InputGroup.Text>
                            <Form.Control id={`cantidad-${index}`} name={`cantidad-${index}`} type="number" min={0} />
                          </InputGroup>
                        </div>
                      </span>
                    ))}

                    {/*botones*/}
                    <span className="col-md-12 row mt-3 justify-content-end">

                      <div className="mb-2 col-md-4">
                        <button type="button" onClick={() => handleAgregar()} className={`btn btn-primary col-md-4  w-100`}>
                          Agregar producto
                        </button>
                      </div>

                      <div className="mb-2 col-md-4">
                        <button type="button" onClick={() => handleEliminar()} className={`btn btn-danger col-md-4  w-100`}>
                          Eliminar producto
                        </button>
                      </div>

                      <div className="mb-2 col-md-4">
                        <button type="submit" className={`btn btn-${element ? "warning" : "success"} col-md-4 w-100`}>
                          {element ? "Editar" : "Programar"}
                        </button>
                      </div>
                    </span>

                  </form>
                </div>
              </div>
            </div>
          </span>

        </div>
      </div>
    </div>
  );


};