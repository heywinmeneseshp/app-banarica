import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaMinus } from 'react-icons/fa';
import Loader from '@components/shared/Loader';

import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { listarAlmacenes } from "@services/api/almacenes";
import { listarCombos } from '@services/api/combos';
import { encontrarUnSerial, usarSeriales } from '@services/api/seguridad';
import { listarMotivoDeUso } from '@services/api/motivoDeUso';
import { listarMotivoDeRechazo } from '@services/api/motivoDeRechazo';
import { agregarRechazo } from '@services/api/rechazos';
import { filterActiveContainerRows } from '@utils/contenedorEstado';

const MOTIVO_LLENADO_CONTENEDOR = "Lleneado de contenedor";
const SERIALES_A_VERIFICAR = ["kit", "termografo"];

const JERARQUIA_CAMPOS = {
  semana: ['consignee', 'buque', 'destino', 'booking', 'contenedor'],
  consignee: ['buque', 'destino', 'booking', 'contenedor'],
  buque: ['destino', 'booking', 'contenedor'],
  destino: ['booking', 'contenedor'],
  booking: ['contenedor']
};

const getItemId = (item) => item?.id || item?.consecutivo;
const normalizeCode = (value) => String(value || '').trim().toUpperCase();

const buildEmptyRow = () => ({
  id: Date.now() + Math.random(),
  cod_productor: '',
  producto: '',
  totalCajas: '',
  pallet: '',
  motivo_rechazo: ''
});

const FormularioDinamico = () => {
  const inputsRef = useRef({});
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    semana: '', consignee: '', buque: '', destino: '', booking: '', contenedor: ''
  });
  const [options, setOptions] = useState({
    semanas: [], productos: [], almacenes: [], almacenByUser: [], motivosRechazo: []
  });
  const [embarquesObjet, setEmbarquesObject] = useState([]);
  const [contenedores, setContenedores] = useState([]);
  const [selectedContenedor, setSelectedContenedor] = useState(null);
  const [sectionsProduct, setSectionsProduct] = useState([]);
  const [sectionsRechazo, setSectionsRechazo] = useState([]);

  const { today, fechaInicial, fechaFinal } = useMemo(() => {
    const d = new Date();
    const before = new Date(d);
    const later = new Date(d);
    before.setMonth(d.getMonth() - 1);
    later.setMonth(d.getMonth() + 1);

    return {
      today: d.toISOString().split('T')[0],
      fechaInicial: before.toISOString().split('T')[0],
      fechaFinal: later.toISOString().split('T')[0]
    };
  }, []);

  const init = useCallback(async () => {
    try {
      const [weeks, prods, motivos, alms] = await Promise.all([
        filtrarSemanaRangoMes(1, 1),
        listarCombos(),
        listarMotivoDeRechazo(),
        listarAlmacenes()
      ]);

      setOptions({
        semanas: weeks.map((w) => w.consecutivo),
        productos: Array.isArray(prods) ? prods : [],
        motivosRechazo: Array.isArray(motivos) ? motivos : [],
        almacenes: Array.isArray(alms) ? alms : [],
        almacenByUser: JSON.parse(localStorage.getItem("almacenByUser") || "[]")
      });
    } catch (error) {
      console.error("Error al cargar datos iniciales del llenado:", error);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!filtros.semana) {
      setEmbarquesObject([]);
      return;
    }

    paginarEmbarques(1, 1000, { semana: filtros.semana })
      .then((res) => setEmbarquesObject(res.data || []))
      .catch((error) => {
        console.error("Error al cargar embarques:", error);
        setEmbarquesObject([]);
      });
  }, [filtros.semana]);

  useEffect(() => {
    if (!filtros.contenedor || normalizeCode(filtros.contenedor).length < 3) {
      setContenedores([]);
      setSelectedContenedor(null);
      return;
    }

    paginarListado(1, 25, {
      fecha_inicial: fechaInicial,
      fecha_final: fechaFinal,
      habilitado: true,
      contenedor: normalizeCode(filtros.contenedor)
    })
      .then((res) => {
        const listadoFiltrado = filterActiveContainerRows(res.data || []).filter(
          (item) => normalizeCode(item.Contenedor?.contenedor).includes(normalizeCode(filtros.contenedor))
        );

        const uniqueContenedores = Array.from(
          new Map(
            listadoFiltrado
              .filter((item) => item?.Contenedor?.contenedor)
              .map((item) => [normalizeCode(item.Contenedor?.contenedor), item])
          ).values()
        );

        setContenedores(uniqueContenedores);

        const exactMatch = uniqueContenedores.find(
          (item) => normalizeCode(item.Contenedor?.contenedor) === normalizeCode(filtros.contenedor)
        );
        setSelectedContenedor(exactMatch || null);
      })
      .catch((error) => {
        console.error("Error al cargar contenedores:", error);
        setContenedores([]);
        setSelectedContenedor(null);
      });
  }, [filtros.contenedor, fechaInicial, fechaFinal]);

  const datalists = useMemo(() => {
    let filtered = embarquesObjet;

    if (filtros.consignee) filtered = filtered.filter((r) => r.cliente?.cod === filtros.consignee);
    if (filtros.buque) filtered = filtered.filter((r) => r.Buque?.buque === filtros.buque);
    if (filtros.destino) filtered = filtered.filter((r) => r.Destino?.destino === filtros.destino);

    return {
      consignees: [...new Set(filtered.map((r) => r.cliente?.cod).filter(Boolean))],
      buques: [...new Set(filtered.map((r) => r.Buque?.buque).filter(Boolean))],
      destinos: [...new Set(filtered.map((r) => r.Destino?.destino).filter(Boolean))],
      bookings: [...new Set(filtered.map((item) => item.bl).filter(Boolean))]
    };
  }, [embarquesObjet, filtros]);

  const handleHierarchyChange = (e) => {
    const { id, value } = e.target;
    const aLimpiar = JERARQUIA_CAMPOS[id] || [];

    setFiltros((prev) => {
      const nuevo = { ...prev, [id]: value };
      aLimpiar.forEach((campo) => {
        nuevo[campo] = '';
        if (inputsRef.current[campo]) {
          inputsRef.current[campo].value = '';
        }
      });
      return nuevo;
    });

    if (id === 'contenedor') {
      setSelectedContenedor(null);
    }
  };

  const addSection = (type) => {
    if (type === 'producto') {
      setSectionsProduct((prev) => [...prev, buildEmptyRow()]);
      return;
    }

    if (type === 'rechazo') {
      setSectionsRechazo((prev) => [...prev, buildEmptyRow()]);
    }
  };

  const updateDynamicRow = (id, field, value, type) => {
    if (type === 'producto') {
      setSectionsProduct((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
      );
      return;
    }

    setSectionsRechazo((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const getVal = (id) => inputsRef.current[id]?.value || filtros[id];

    try {
      if (sectionsProduct.length === 0 && sectionsRechazo.length === 0) {
        throw new Error("Agrega al menos una caja recibida o un rechazo antes de guardar");
      }

      const serialesIngresados = SERIALES_A_VERIFICAR
        .map((key) => ({ key, value: inputsRef.current[key]?.value?.trim() || '' }))
        .filter((item) => item.value);

      const serialesVerificados = await Promise.all(
        serialesIngresados.map(async ({ key, value }) => {
          const res = await encontrarUnSerial({ bag_pack: value, available: [true] });
          return { key, value, exists: Boolean(res?.[0]) };
        })
      );

      for (const { key, value, exists } of serialesVerificados) {
        if (!exists && !window.confirm(`El ${key} "${value}" no existe. ¿Continuar?`)) {
          return;
        }
      }

      const user = JSON.parse(localStorage.getItem("usuario") || "{}");
      const bookingIngresado = normalizeCode(getVal('booking'));
      const contenedorIngresado = normalizeCode(getVal('contenedor'));

      const id_embarque = embarquesObjet.find(
        (item) => normalizeCode(item.bl) === bookingIngresado
      )?.id;

      let itemContenedor = selectedContenedor;

      if (!itemContenedor && contenedorIngresado) {
        const exactMatch = await paginarListado(1, 25, {
          fecha_inicial: fechaInicial,
          fecha_final: fechaFinal,
          habilitado: true,
          contenedor: contenedorIngresado
        });

        const rows = filterActiveContainerRows(exactMatch?.data || []);
        itemContenedor = rows.find(
          (item) => normalizeCode(item.Contenedor?.contenedor) === contenedorIngresado
        );
      }

      if (!id_embarque || !itemContenedor) {
        throw new Error("Booking o contenedor no válido");
      }

      await Promise.all([
        ...sectionsProduct.map(async (sec, index) => {
          const payload = {
            fecha: inputsRef.current.fecha.value,
            id_embarque,
            id_contenedor: itemContenedor.id_contenedor,
            id_lugar_de_llenado: sec.cod_productor,
            id_producto: sec.producto,
            cajas_unidades: sec.totalCajas,
            habilitado: true
          };

          if (index === 0) {
            return actualizarListado(itemContenedor.id, payload);
          }

          const duplicado = await duplicarListado(itemContenedor.id);
          return actualizarListado(duplicado.id, payload);
        }),
        ...sectionsRechazo.map((sec) =>
          agregarRechazo({
            id_producto: sec.producto,
            id_motivo_de_rechazo: sec.motivo_rechazo,
            cantidad: sec.totalCajas,
            serial_palet: sec.pallet,
            cod_productor: sec.cod_productor,
            id_contenedor: itemContenedor.id_contenedor,
            id_usuario: user.id,
            fecha_rechazo: inputsRef.current.fecha.value
          })
        )
      ]);

      if (serialesVerificados.length > 0) {
        const motivos = await listarMotivoDeUso();
        const motivo = motivos.find((m) => m.motivo_de_uso === MOTIVO_LLENADO_CONTENEDOR);

        await usarSeriales(
          filtros.semana,
          inputsRef.current.fecha.value,
          serialesVerificados.map((item) => item.value),
          itemContenedor.id_contenedor,
          user.id,
          motivo
        );
      }

      window.alert("¡Éxito!");
      window.location.reload();
    } catch (error) {
      window.alert(error.message || "No fue posible guardar el llenado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Loader loading={loading} />
      <form onSubmit={handleSubmit} className="container py-4">
        <h2 className="text-center mb-4">Llenado de Contenedor</h2>

        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="input-group">
              <span className="input-group-text">Fecha</span>
              <input
                type="date"
                className="form-control"
                ref={(el) => {
                  inputsRef.current.fecha = el;
                }}
                defaultValue={today}
              />
            </div>
          </div>

          {[
            { label: "Semana", id: "semana", list: options.semanas },
            { label: "Consignee", id: "consignee", list: datalists.consignees },
            { label: "Buque", id: "buque", list: datalists.buques },
            { label: "Destino", id: "destino", list: datalists.destinos },
            { label: "Booking", id: "booking", list: datalists.bookings },
            { label: "Contenedor", id: "contenedor", list: contenedores },
          ].map((field) => (
            <div className="col-md-6 mb-3" key={field.id}>
              <div className="input-group">
                <span className="input-group-text">{field.label}</span>
                <input
                  type="text"
                  id={field.id}
                  className="form-control"
                  list={`l-${field.id}`}
                  ref={(el) => {
                    inputsRef.current[field.id] = el;
                  }}
                  onChange={handleHierarchyChange}
                  required
                />
                <datalist id={`l-${field.id}`}>
                  {field.id === 'contenedor'
                    ? contenedores.map((option) => (
                      <option
                        key={`${field.id}-${option?.id}-${option?.id_contenedor}`}
                        value={option?.Contenedor?.contenedor || ''}
                      />
                    ))
                    : field.list.map((option, index) => (
                      <option key={`${field.id}-${index}`} value={option} />
                    ))}
                </datalist>
              </div>
            </div>
          ))}

          <div className="col-md-6 mb-3">
            <div className="input-group">
              <span className="input-group-text">Kit</span>
              <input
                type="text"
                className="form-control"
                ref={(el) => {
                  inputsRef.current.kit = el;
                }}
              />
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="input-group">
              <span className="input-group-text">Termografo</span>
              <input
                type="text"
                className="form-control"
                ref={(el) => {
                  inputsRef.current.termografo = el;
                }}
              />
            </div>
          </div>
        </div>

        <div className="row my-3">
          <div className="col-md-6">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => addSection('producto')}
            >
              <FaPlus /> Cajas Recibidas
            </button>
          </div>

          <div className="col-md-6">
            <button
              type="button"
              className="btn btn-warning w-100"
              onClick={() => addSection('rechazo')}
            >
              <FaPlus /> Agregar Rechazo
            </button>
          </div>
        </div>

        {sectionsProduct.length > 0 && <h5 className="mt-4">Cajas Recibidas</h5>}
        {sectionsProduct.map((section) => (
          <div key={section.id} className="row g-2 mb-2 align-items-center">
            <div className="col-md-3">
              <select
                className="form-select"
                required
                onChange={(e) => updateDynamicRow(section.id, 'cod_productor', e.target.value, 'producto')}
              >
                <option value="">Productor</option>
                {options.almacenByUser.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.consecutivo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-5">
              <select
                className="form-select"
                required
                onChange={(e) => updateDynamicRow(section.id, 'producto', e.target.value, 'producto')}
              >
                <option value="">Producto</option>
                {options.productos.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder="Cant"
                required
                onChange={(e) => updateDynamicRow(section.id, 'totalCajas', e.target.value, 'producto')}
              />
            </div>

            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => setSectionsProduct((prev) => prev.filter((item) => item.id !== section.id))}
              >
                <FaMinus />
              </button>
            </div>
          </div>
        ))}

        {sectionsRechazo.length > 0 && <h5 className="mt-4 text-warning">Cajas Rechazadas</h5>}
        {sectionsRechazo.map((section) => (
          <div key={section.id} className="row g-2 mb-2 align-items-center border-start border-warning border-4 ps-2">
            <div className="col-md-2">
              <select
                className="form-select"
                required
                onChange={(e) => updateDynamicRow(section.id, 'cod_productor', e.target.value, 'rechazo')}
              >
                <option value="">Cod</option>
                {options.almacenes.map((item) => (
                  <option key={getItemId(item)} value={item.consecutivo}>
                    {item.consecutivo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <input
                type="text"
                className="form-control"
                placeholder="Pallet"
                onChange={(e) => updateDynamicRow(section.id, 'pallet', e.target.value, 'rechazo')}
              />
            </div>

            <div className="col-md-3">
              <select
                className="form-select"
                required
                onChange={(e) => updateDynamicRow(section.id, 'producto', e.target.value, 'rechazo')}
              >
                <option value="">Producto</option>
                {options.productos.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <select
                className="form-select"
                required
                onChange={(e) => updateDynamicRow(section.id, 'motivo_rechazo', e.target.value, 'rechazo')}
              >
                <option value="">Motivo</option>
                {options.motivosRechazo.map((item) => (
                  <option key={getItemId(item)} value={getItemId(item)}>
                    {item.motivo_rechazo}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Cant"
                required
                onChange={(e) => updateDynamicRow(section.id, 'totalCajas', e.target.value, 'rechazo')}
              />
            </div>

            <div className="col-md-1">
              <button
                type="button"
                className="btn btn-danger w-100"
                onClick={() => setSectionsRechazo((prev) => prev.filter((item) => item.id !== section.id))}
              >
                <FaMinus />
              </button>
            </div>
          </div>
        ))}

        <button type="submit" className="btn btn-success btn-lg w-100 mt-5" disabled={loading}>
          {loading ? 'Guardando...' : 'Enviar Formulario'}
        </button>
      </form>
    </>
  );
};

export default FormularioDinamico;
