import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaMinus } from 'react-icons/fa';
import Loader from '@components/shared/Loader';

// Servicios API
import { filtrarSemanaRangoMes } from '@services/api/semanas';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { listarAlmacenes } from "@services/api/almacenes";
import { listarCombos } from '@services/api/combos';
import { encontrarUnSerial, usarSeriales } from '@services/api/seguridad';
import { listarMotivoDeUso } from '@services/api/motivoDeUso';
import { listarMotivoDeRechazo } from '@services/api/motivoDeRechazo';
import { agregarRechazo } from '@services/api/rechazos';

const MOTIVO_LLENADO_CONTENEDOR = "Lleneado de contenedor";
const SERIALES_A_VERIFICAR = ["kit", "termografo"];

const JERARQUIA_CAMPOS = {
  semana: ['consignee', 'buque', 'destino', 'booking', 'contenedor'],
  consignee: ['buque', 'destino', 'booking', 'contenedor'],
  buque: ['destino', 'booking', 'contenedor'],
  destino: ['booking', 'contenedor'],
  booking: ['contenedor']
};

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
  const [listado, setListado] = useState([]);

  // Secciones Dinámicas
  const [sectionsProduct, setSectionsProduct] = useState([]);
  const [sectionsRechazo, setSectionsRechazo] = useState([]);

  const { today, fechaInicial, fechaFinal } = useMemo(() => {
    const d = new Date();
    const before = new Date(d); const later = new Date(d);
    before.setMonth(d.getMonth() - 1); later.setMonth(d.getMonth() + 1);
    return {
      today: d.toISOString().split('T')[0],
      fechaInicial: before.toISOString().split('T')[0],
      fechaFinal: later.toISOString().split('T')[0]
    };
  }, []);

  const init = useCallback(async () => {
    try {
      const [weeks, prods, motivos, alms] = await Promise.all([
        filtrarSemanaRangoMes(1, 1), listarCombos(),
        listarMotivoDeRechazo(), listarAlmacenes()
      ]);
      setOptions({
        semanas: weeks.map(w => w.consecutivo),
        productos: prods, motivosRechazo: motivos, almacenes: alms,
        almacenByUser: JSON.parse(localStorage.getItem("almacenByUser") || "[]")
      });
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (filtros.semana) {
      paginarEmbarques(1, 1000, { semana: filtros.semana }).then(res => setEmbarquesObject(res.data));
    }
  }, [filtros.semana]);

  useEffect(() => {
    if (filtros.booking) {
      paginarListado(1, 10, { fecha_inicial: fechaInicial, fecha_final: fechaFinal, habilitado: true })
        .then(res => {
          setListado(res.data);
          setContenedores(res.data.map(i => i.Contenedor?.contenedor || ''));
        });
    }
  }, [filtros.booking, fechaInicial, fechaFinal]);

  const datalists = useMemo(() => {
    let filtered = embarquesObjet;
    if (filtros.consignee) filtered = filtered.filter(r => r.cliente.cod === filtros.consignee);
    if (filtros.buque) filtered = filtered.filter(r => r.Buque.buque === filtros.buque);
    if (filtros.destino) filtered = filtered.filter(r => r.Destino.destino === filtros.destino);
    return {
      consignees: [...new Set(filtered.map(r => r.cliente.cod))],
      buques: [...new Set(filtered.map(r => r.Buque.buque))],
      destinos: [...new Set(filtered.map(r => r.Destino.destino))],
      bookings: filtered.map(item => item.bl)
    };
  }, [embarquesObjet, filtros]);

  const handleHierarchyChange = (e) => {
    const { id, value } = e.target;
    const aLimpiar = JERARQUIA_CAMPOS[id] || [];
    setFiltros(prev => {
      const nuevo = { ...prev, [id]: value };
      aLimpiar.forEach(c => {
        nuevo[c] = '';
        if (inputsRef.current[c]) inputsRef.current[c].value = '';
      });
      return nuevo;
    });
  };

  // --- SOLUCIÓN: Lógica de agregar secciones corregida ---
  const addSection = (type) => {
    const newRow = { id: Date.now(), cod_productor: '', producto: '', totalCajas: '', pallet: '', motivo_rechazo: '' };
    if (type === 'producto') {
      setSectionsProduct(prev => [...prev, newRow]);
    } else if (type === 'rechazo') {
      setSectionsRechazo(prev => [...prev, newRow]);
    }
  };

  const updateDynamicRow = (id, field, value, type) => {
    if (type === 'producto') {
      setSectionsProduct(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    } else {
      setSectionsRechazo(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const getVal = (id) => inputsRef.current[id]?.value || filtros[id];

    try {
      const serialesList = [];
      for (const key of SERIALES_A_VERIFICAR) {
        const val = inputsRef.current[key]?.value;
        if (val) {
          const res = await encontrarUnSerial({ bag_pack: val, available: [true] });
          if (!res[0] && !window.confirm(`El ${key} "${val}" no existe. ¿Continuar?`)) {
            setLoading(false); return;
          }
          serialesList.push(val);
        }
      }

      const user = JSON.parse(localStorage.getItem("usuario") || "{}");
      const id_embarque = embarquesObjet.find(i => i.bl === filtros.booking)?.id;
      const itemContenedor = listado.find(i => i.Contenedor?.contenedor === getVal('contenedor'));

      if (!id_embarque || !itemContenedor) throw new Error("Booking o Contenedor no válido");
      console.log(itemContenedor.id);

      await Promise.all([
        ...sectionsProduct.map((sec, index) => {
          if (index == 0) {
            actualizarListado(itemContenedor.id, {
              fecha: inputsRef.current.fecha.value,
              id_embarque,
              id_contenedor: itemContenedor.id_contenedor,
              id_lugar_de_llenado: sec.cod_productor,
              id_producto: sec.producto,
              cajas_unidades: sec.totalCajas,
              habilitado: true
            });
          } else {
            duplicarListado(itemContenedor.id).then(res => {
              actualizarListado(res.id, {
                fecha: inputsRef.current.fecha.value,
                id_embarque,
                id_contenedor: itemContenedor.id_contenedor,
                id_lugar_de_llenado: sec.cod_productor,
                id_producto: sec.producto,
                cajas_unidades: sec.totalCajas,
                habilitado: true
              });
            });
          }

        }),
        ...sectionsRechazo.map(sec => agregarRechazo({
          id_producto: sec.producto,
          id_motivo_de_rechazo: sec.motivo_rechazo,
          cantidad: sec.totalCajas,
          serial_palet: sec.pallet,
          cod_productor: sec.cod_productor,
          id_contenedor: itemContenedor.id_contenedor,
          id_usuario: user.id,
          fecha_rechazo: inputsRef.current.fecha.value
        }))
      ]);

      if (serialesList.length > 0) {
        const motivos = await listarMotivoDeUso();
        const motivo = motivos.find(m => m.motivo_de_uso === MOTIVO_LLENADO_CONTENEDOR);
        await usarSeriales(filtros.semana, inputsRef.current.fecha.value, serialesList, itemContenedor.id_contenedor, user.id, motivo);
      }

      window.alert("¡Éxito!");
      window.location.reload();

    } catch (err) {
      window.alert(err.message);
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
              <input type="date" className="form-control" ref={el => inputsRef.current.fecha = el} defaultValue={today} />
            </div>
          </div>

          {[
            { label: "Semana", id: "semana", list: options.semanas },
            { label: "Consignee", id: "consignee", list: datalists.consignees },
            { label: "Buque", id: "buque", list: datalists.buques },
            { label: "Destino", id: "destino", list: datalists.destinos },
            { label: "Booking", id: "booking", list: datalists.bookings },
            { label: "Contenedor", id: "contenedor", list: contenedores },
          ].map(f => (
            <div className="col-md-6 mb-3" key={f.id}>
              <div className="input-group">
                <span className="input-group-text">{f.label}</span>
                <input
                  type="text"
                  id={f.id}
                  className="form-control"
                  list={`l-${f.id}`}
                  ref={el => inputsRef.current[f.id] = el}
                  onChange={handleHierarchyChange}
                  required
                />
                <datalist id={`l-${f.id}`}>
                  {f.list.map((o, i) => <option key={i} value={o} />)}
                </datalist>
              </div>
            </div>
          ))}

          <div className="col-md-6 mb-3">
            <div className="input-group"><span className="input-group-text">Kit</span>
              <input type="text" className="form-control" ref={el => inputsRef.current.kit = el} /></div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="input-group"><span className="input-group-text">Termógrafo</span>
              <input type="text" className="form-control" ref={el => inputsRef.current.termografo = el} /></div>
          </div>
        </div>

        <div className="row my-3">
          <div className="col-md-6">
            <button type="button" className="btn btn-primary w-100" onClick={() => addSection('producto')}>
              <FaPlus /> Cajas Recibidas
            </button>
          </div>
          <div className="col-md-6">
            <button type="button" className="btn btn-warning w-100" onClick={() => addSection('rechazo')}>
              <FaPlus /> Agregar Rechazo
            </button>
          </div>
        </div>

        {/* --- RENDER SECCIÓN PRODUCTOS --- */}
        {sectionsProduct.length > 0 && <h5 className="mt-4">Cajas Recibidas</h5>}
        {sectionsProduct.map(s => (
          <div key={s.id} className="row g-2 mb-2 align-items-center">
            <div className="col-md-3">
              <select className="form-select" required onChange={e => updateDynamicRow(s.id, 'cod_productor', e.target.value, 'producto')}>
                <option value="">Productor</option>
                {options.almacenByUser.map(a => <option key={a.id} value={a.id}>{a.consecutivo}</option>)}
              </select>
            </div>
            <div className="col-md-5">
              <select className="form-select" required onChange={e => updateDynamicRow(s.id, 'producto', e.target.value, 'producto')}>
                <option value="">Producto</option>
                {options.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <input type="number" className="form-control" placeholder="Cant" required onChange={e => updateDynamicRow(s.id, 'totalCajas', e.target.value, 'producto')} />
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-danger w-100" onClick={() => setSectionsProduct(prev => prev.filter(x => x.id !== s.id))}><FaMinus /></button>
            </div>
          </div>
        ))}

        {/* --- RENDER SECCIÓN RECHAZOS (CORREGIDO) --- */}
        {sectionsRechazo.length > 0 && <h5 className="mt-4 text-warning">Cajas Rechazadas</h5>}
        {sectionsRechazo.map(s => (
          <div key={s.id} className="row g-2 mb-2 align-items-center border-start border-warning border-4 ps-2">
            <div className="col-md-2">
              <select className="form-select" required onChange={e => updateDynamicRow(s.id, 'cod_productor', e.target.value, 'rechazo')}>
                <option value="">Cod</option>
                {options.almacenes.map(a => <option key={a.id} value={a.consecutivo}>{a.consecutivo}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="text" className="form-control" placeholder="Pallet" onChange={e => updateDynamicRow(s.id, 'pallet', e.target.value, 'rechazo')} />
            </div>
            <div className="col-md-3">
              <select className="form-select" required onChange={e => updateDynamicRow(s.id, 'producto', e.target.value, 'rechazo')}>
                <option value="">Producto</option>
                {options.productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" required onChange={e => updateDynamicRow(s.id, 'motivo_rechazo', e.target.value, 'rechazo')}>
                <option value="">Motivo</option>
                {options.motivosRechazo.map(m => <option key={m.id} value={m.id}>{m.motivo_rechazo}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="number" className="form-control" placeholder="Cant" required onChange={e => updateDynamicRow(s.id, 'totalCajas', e.target.value, 'rechazo')} />
            </div>
            <div className="col-md-1">
              <button type="button" className="btn btn-danger w-100" onClick={() => setSectionsRechazo(prev => prev.filter(x => x.id !== s.id))}><FaMinus /></button>
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