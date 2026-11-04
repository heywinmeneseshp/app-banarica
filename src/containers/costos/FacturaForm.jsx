/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, no-unused-vars, no-empty */
// Formulario de factura y su fila de ítem. Portado de la app Trazabilidad (Auxiliar Logístico > Facturas).
import React, { useState, useEffect, useRef } from 'react';
import { FaCopy, FaTimes } from 'react-icons/fa';
import { costosFetch } from './costosApi';
import SugerenciasDropdown from './SugerenciasDropdown';

const SuggestDropdown = SugerenciasDropdown;
const GREY = { background: '#e9ecef', color: '#6c757d' };
const TIPOS_FALLBACK = ['Factura', 'Nota Débito', 'Nota Crédito', 'Otro'];
const DIVISAS = ['COP', 'USD', 'EUR'];

// ── Item de Factura (fila con contenedor/booking autocomplete) ────────────────
const EMPTY_ITEM = { semana: '', mes: '', concepto: '', id_contenedor: '', booking: '', divisa: 'COP', cantidad: '', valor_unitario: '', nivel_asociacion: '', tipo_costo: '', metodo_distribucion: 'por_cajas' };
const NIVELES_ASOCIACION = ['contenedor', 'booking', 'semana', 'mes'];
const NIVEL_BADGE = { contenedor: 'bg-primary', booking: 'bg-success', semana: 'bg-warning text-dark', mes: 'bg-secondary', año: 'bg-dark' };
const TIPOS_COSTO = ['FINCA', 'PUERTO', 'INSPECCION', 'ALL', 'FINCA+PUERTO', 'FINCA+INSPECCION', 'PUERTO+INSPECCION'];

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function mesDesdeRango(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return '';
  const start = new Date(fechaInicio + 'T00:00:00');
  const end   = new Date(fechaFin   + 'T00:00:00');
  const counts = {};
  const cur = new Date(start);
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${cur.getMonth()}`;
    counts[key] = (counts[key] || 0) + 1;
    cur.setDate(cur.getDate() + 1);
  }
  let maxKey = null, maxDays = 0;
  for (const [key, days] of Object.entries(counts)) {
    if (days > maxDays) { maxDays = days; maxKey = key; }
  }
  if (!maxKey) return '';
  const [year, month] = maxKey.split('-');
  return `${MESES_ES[parseInt(month)]} ${year}`;
}

function ItemRow({ item, idx, onChange, onRemove, onDuplicate, tiposCosto = [] }) {
  const [conceptoQuery, setConceptoQuery] = useState(item.concepto || '');
  const [conceptoSugs, setConceptoSugs]   = useState([]);
  const [conceptoFocused, setConceptoFocused] = useState(false);
  const [contQuery, setContQuery]         = useState(item.id_contenedor === 'N/A' ? '' : (item.id_contenedor || ''));
  const [sinContenedor, setSinContenedor] = useState(item.id_contenedor === 'N/A');
  const [contSugs, setContSugs]           = useState([]);
  const [contFocused, setContFocused]     = useState(false);
  const [bookQuery, setBookQuery]         = useState(item.booking === 'N/A' ? '' : (item.booking || ''));
  const [sinBooking, setSinBooking]       = useState(item.booking === 'N/A');
  const [bookSugs, setBookSugs]           = useState([]);
  const [bookFocused, setBookFocused]     = useState(false);
  const [semQuery, setSemQuery]           = useState(item.semana === 'N/A' ? '' : (item.semana || ''));
  const [sinSemana, setSinSemana]         = useState(item.semana === 'N/A');
  const [semSugs, setSemSugs]             = useState([]);
  const [semFocused, setSemFocused]       = useState(false);
  const [mesQuery, setMesQuery]           = useState(item.mes === 'N/A' ? '' : (item.mes || ''));
  const [sinMes, setSinMes]               = useState(item.mes === 'N/A');
  const [mesSugs, setMesSugs]             = useState([]);
  const [mesFocused, setMesFocused]       = useState(false);
  const [anhoQuery, setAnhoQuery]         = useState(item.anho || '');
  const [validAnhos, setValidAnhos]       = useState([]);
  const [anhoFocused, setAnhoFocused]     = useState(false);

  const conceptoRef = useRef(null);
  const contRef     = useRef(null);
  const bookRef     = useRef(null);
  const semRef      = useRef(null);
  const mesRef      = useRef(null);
  const anhoRef     = useRef(null);

  // semana editable solo sin contenedor Y sin booking
  const semanaEditable = sinContenedor && sinBooking;

  function calcNivel(it) {
    if (it.id_contenedor && it.id_contenedor !== 'N/A') return 'contenedor';
    if (it.booking && it.booking !== 'N/A') return 'booking';
    if (it.semana && it.semana !== 'N/A') return 'semana';
    if (it.mes && it.mes !== 'N/A') return 'mes';
    if (it.anho) return 'año';
    return '';
  }

  function upd(k, v) {
    const updated = { ...item, [k]: v };
    if (k === 'mes' && v && v !== 'N/A') {
      const m = String(v).match(/\b(\d{4})\b/);
      if (m) { updated.anho = m[1]; setAnhoQuery(m[1]); }
    }
    if (['id_contenedor', 'booking', 'semana', 'mes', 'anho'].includes(k)) {
      updated.nivel_asociacion = calcNivel(updated);
    }
    onChange(idx, updated);
  }

  function toggleSinContenedor(val) {
    setSinContenedor(val);
    setSinMes(false);
    setContQuery('');
    setBookQuery('');
    setSinBooking(false);
    setSemQuery('');
    setMesQuery('');
    setAnhoQuery('');
    const n = { ...item, id_contenedor: val ? 'N/A' : '', booking: '', semana: '', mes: '', anho: '' };
    onChange(idx, { ...n, nivel_asociacion: calcNivel(n) });
  }

  function toggleSinBooking(val) {
    setSinBooking(val);
    setSinMes(false);
    setBookQuery('');
    setSemQuery('');
    setSinSemana(false);
    setMesQuery('');
    setAnhoQuery('');
    const n = { ...item, booking: val ? 'N/A' : '', semana: '', mes: '', anho: '' };
    onChange(idx, { ...n, nivel_asociacion: calcNivel(n) });
  }

  function toggleSinSemana(val) {
    setSinSemana(val);
    setSinMes(false);
    setSemQuery('');
    setMesQuery('');
    setAnhoQuery('');
    const n = { ...item, semana: val ? 'N/A' : '', mes: '', anho: '' };
    onChange(idx, { ...n, nivel_asociacion: calcNivel(n) });
  }

  function toggleSinMes(val) {
    setSinMes(val);
    setMesQuery('');
    setAnhoQuery('');
    const n = { ...item, mes: val ? 'N/A' : '', anho: '' };
    onChange(idx, { ...n, nivel_asociacion: calcNivel(n) });
  }

  // concepto search (catálogo de ítems)
  useEffect(() => {
    if (conceptoQuery.length < 2) { setConceptoSugs([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await costosFetch(`/items-catalog?q=${encodeURIComponent(conceptoQuery)}`);
        setConceptoSugs(await r.json());
      } catch { setConceptoSugs([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [conceptoQuery]);

  // contenedor search
  useEffect(() => {
    if (sinContenedor || contQuery.length < 2) { setContSugs([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await costosFetch(`/contenedores-cache?q=${encodeURIComponent(contQuery)}`);
        setContSugs(await r.json());
      } catch { setContSugs([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [contQuery, sinContenedor]);

  // booking search
  useEffect(() => {
    if (!sinContenedor || sinBooking || bookQuery.length < 2) { setBookSugs([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await costosFetch(`/bookings-cache?q=${encodeURIComponent(bookQuery)}`);
        setBookSugs(await r.json());
      } catch { setBookSugs([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [bookQuery, sinContenedor, sinBooking]);

  // mes search — solo cuando sinSemana está activo
  useEffect(() => {
    if (!semanaEditable || !sinSemana || !mesFocused) { setMesSugs([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await costosFetch(`/meses?q=${encodeURIComponent(mesQuery)}`);
        setMesSugs(await r.json());
      } catch { setMesSugs([]); }
    }, 200);
    return () => clearTimeout(t);
  }, [mesQuery, semanaEditable, sinSemana, mesFocused]);

  // años válidos — carga cuando sinMes se activa
  useEffect(() => {
    if (!sinMes) { setValidAnhos([]); return; }
    costosFetch('/anhos').then(r => r.json()).then(setValidAnhos).catch(() => setValidAnhos([]));
  }, [sinMes]);

  // semana search (solo editable cuando sinContenedor && sinBooking)
  useEffect(() => {
    if (!semanaEditable || !semFocused || sinSemana) { setSemSugs([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await costosFetch(`/semanas?q=${encodeURIComponent(semQuery)}`);
        const data = await r.json();
        setSemSugs(Array.isArray(data) ? data.slice(0, 12) : []);
      } catch { setSemSugs([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [semQuery, semanaEditable, semFocused, sinSemana]);

  const anhoSugs = anhoFocused && validAnhos.length > 0
    ? (anhoQuery ? validAnhos.filter(a => String(a).includes(anhoQuery)) : validAnhos)
    : [];

  const subtotal = (parseFloat(item.cantidad)||0) * (parseFloat(item.valor_unitario)||0);

  return (
    <tr>
      {/* Concepto */}
      <td style={{ minWidth: 170 }} className="align-middle">
        <input ref={conceptoRef} className="form-control form-control-sm" value={conceptoQuery}
          onChange={e => { setConceptoQuery(e.target.value); upd('concepto', e.target.value); setConceptoSugs([]); }}
          onFocus={() => setConceptoFocused(true)}
          onBlur={() => { setTimeout(() => { setConceptoFocused(false); setConceptoSugs([]); }, 150); }}
          placeholder="Concepto / descripción..."
          autoComplete="off" />
        <SuggestDropdown anchorRef={conceptoRef} show={conceptoFocused && conceptoSugs.length > 0}>
          {conceptoSugs.map(c => (
            <li key={c.id}
              className="list-group-item list-group-item-action py-1 px-2"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onMouseDown={e => {
                e.preventDefault();
                setConceptoQuery(c.nombre);
                setConceptoSugs([]);
                onChange(idx, {
                  ...item,
                  concepto: c.nombre,
                  valor_unitario: c.precio_ref != null ? String(c.precio_ref) : item.valor_unitario,
                  tipo_costo: c.tipo_costo_default || item.tipo_costo,
                });
              }}>
              <div className="fw-bold">{c.nombre}</div>
              {(c.descripcion || c.unidad || c.precio_ref != null) && (
                <div className="text-muted" style={{ fontSize: 11 }}>
                  {c.codigo && <span className="me-2 text-secondary">{c.codigo}</span>}
                  {c.unidad && <span className="me-2">{c.unidad}</span>}
                  {c.precio_ref != null && <span className="text-success">${Number(c.precio_ref).toLocaleString('es-CO')}</span>}
                </div>
              )}
            </li>
          ))}
        </SuggestDropdown>
      </td>

      {/* Contenedor */}
      <td style={{ minWidth: 190 }} className="align-middle">
        <div className="input-group input-group-sm">
          <span className="input-group-text px-1" style={{ background: '#f8f9fa', cursor: 'pointer' }}
            title="No aplica" onClick={() => toggleSinContenedor(!sinContenedor)}>
            <input type="checkbox" checked={sinContenedor} onChange={e => toggleSinContenedor(e.target.checked)}
              style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 10, marginLeft: 2 }}>N/A</span>
          </span>
          <input ref={contRef} className="form-control form-control-sm"
            value={sinContenedor ? '' : contQuery}
            disabled={sinContenedor}
            style={sinContenedor ? GREY : {}}
            onChange={e => { setContQuery(e.target.value); setBookQuery(''); const n = { ...item, id_contenedor: '', booking: '' }; onChange(idx, { ...n, nivel_asociacion: calcNivel(n) }); }}
            onFocus={() => setContFocused(true)}
            onBlur={() => { setTimeout(() => { setContFocused(false); setContSugs([]); }, 150); }}
            placeholder={sinContenedor ? 'No aplica' : 'Buscar contenedor...'}
            autoComplete="off" />
        </div>
        <SuggestDropdown anchorRef={contRef} show={contFocused && contSugs.length > 0 && !item.id_contenedor}>
          {contSugs.map(c => (
            <li key={`${c.contenedor}|${c.consecutivo_semana}`}
              className="list-group-item list-group-item-action py-1 px-2"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onMouseDown={e => {
                e.preventDefault();
                setContQuery(c.contenedor);
                setBookQuery(c.booking || '');
                setSemQuery(c.consecutivo_semana || '');
                setContSugs([]);
                const nc = { ...item, id_contenedor: c.contenedor, booking: c.booking || '', semana: c.consecutivo_semana || '' };
                onChange(idx, { ...nc, nivel_asociacion: calcNivel(nc) });
              }}>
              <div className="d-flex justify-content-between align-items-center">
                <strong>{c.contenedor}</strong>
                <span className="badge bg-primary ms-2" style={{ fontSize: 10 }}>{c.consecutivo_semana}</span>
              </div>
              {(c.lugar_llenado || c.fecha_llenado || c.fecha_inspeccion) && (
                <div className="d-flex gap-3 mt-1" style={{ fontSize: 10, color: '#555' }}>
                  {c.lugar_llenado  && <span>📍 {c.lugar_llenado}</span>}
                  {c.fecha_llenado  && <span>📅 {c.fecha_llenado}</span>}
                  {c.fecha_inspeccion && <span style={{ color: '#664d03' }}>🔍 Insp: {c.fecha_inspeccion}</span>}
                </div>
              )}
            </li>
          ))}
        </SuggestDropdown>
        {item.id_contenedor && item.id_contenedor !== 'N/A' && (
          <small className="text-success" style={{ fontSize: 10 }}>✓ {item.id_contenedor}</small>
        )}
      </td>

      {/* Booking */}
      <td style={{ minWidth: 170 }} className="align-middle">
        <div className="input-group input-group-sm">
          <span className="input-group-text px-1"
            style={{ background: sinContenedor ? '#f8f9fa' : GREY.background, cursor: sinContenedor ? 'pointer' : 'default' }}>
            <input type="checkbox" checked={sinBooking} disabled={!sinContenedor}
              onChange={e => toggleSinBooking(e.target.checked)}
              style={{ cursor: sinContenedor ? 'pointer' : 'default' }} />
            <span style={{ fontSize: 10, marginLeft: 2, color: sinContenedor ? 'inherit' : '#aaa' }}>N/A</span>
          </span>
          <input ref={bookRef} className="form-control form-control-sm"
            value={sinBooking ? '' : bookQuery}
            disabled={sinBooking || !sinContenedor}
            style={(sinBooking || !sinContenedor) ? GREY : {}}
            onChange={e => { setBookQuery(e.target.value); setSemQuery(''); const nb = { ...item, booking: e.target.value, semana: '' }; onChange(idx, { ...nb, nivel_asociacion: calcNivel(nb) }); }}
            onFocus={() => setBookFocused(true)}
            onBlur={() => { setTimeout(() => { setBookFocused(false); setBookSugs([]); }, 150); }}
            placeholder={sinBooking ? 'No aplica' : !sinContenedor ? (bookQuery || 'Auto con contenedor') : 'Buscar booking...'}
            autoComplete="off" />
        </div>
        <SuggestDropdown anchorRef={bookRef} show={bookFocused && bookSugs.length > 0}>
          {bookSugs.map(b => (
            <li key={`${b.booking}|${b.consecutivo_semana}`}
              className="list-group-item list-group-item-action py-1 px-2 d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onMouseDown={e => {
                e.preventDefault();
                setBookQuery(b.booking);
                setSemQuery(b.consecutivo_semana || '');
                setBookSugs([]);
                const nb = { ...item, booking: b.booking, semana: b.consecutivo_semana || '' };
                onChange(idx, { ...nb, nivel_asociacion: calcNivel(nb) });
              }}>
              <strong>{b.booking}</strong>
              <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>{b.consecutivo_semana}</span>
            </li>
          ))}
        </SuggestDropdown>
      </td>

      {/* Divisa */}
      <td style={{ minWidth: 80 }} className="align-middle">
        <select className="form-select form-select-sm" value={item.divisa || 'COP'}
          onChange={e => upd('divisa', e.target.value)}>
          {DIVISAS.map(d => <option key={d}>{d}</option>)}
        </select>
      </td>

      {/* Cantidad */}
      <td style={{ minWidth: 90 }} className="align-middle">
        <input type="number" step="any" className="form-control form-control-sm" value={item.cantidad}
          onChange={e => upd('cantidad', e.target.value)} placeholder="0" />
      </td>

      {/* Valor Unitario */}
      <td style={{ minWidth: 110 }} className="align-middle">
        <input type="number" step="any" className="form-control form-control-sm" value={item.valor_unitario}
          onChange={e => upd('valor_unitario', e.target.value)} placeholder="0.00" />
      </td>

      {/* Subtotal */}
      <td style={{ minWidth: 100 }} className="text-end fw-bold align-middle">
        <span className="text-primary" style={{ fontSize: 13 }}>
          {subtotal > 0 ? subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '-'}
        </span>
      </td>

      {/* Semana */}
      <td style={{ minWidth: 150 }} className="align-middle">
        <div className="input-group input-group-sm">
          <span className="input-group-text px-1"
            style={{ background: semanaEditable ? '#f8f9fa' : GREY.background, cursor: semanaEditable ? 'pointer' : 'default' }}>
            <input type="checkbox" checked={sinSemana} disabled={!semanaEditable}
              onChange={e => toggleSinSemana(e.target.checked)}
              style={{ cursor: semanaEditable ? 'pointer' : 'default' }} />
            <span style={{ fontSize: 10, marginLeft: 2, color: semanaEditable ? 'inherit' : '#aaa' }}>N/A</span>
          </span>
          <input ref={semRef} className="form-control form-control-sm"
            value={sinSemana ? '' : semQuery}
            disabled={!semanaEditable || sinSemana}
            style={(!semanaEditable || sinSemana) ? GREY : {}}
            onChange={e => { setSemQuery(e.target.value); upd('semana', e.target.value); setSemSugs([]); }}
            onFocus={() => setSemFocused(true)}
            onBlur={() => { setTimeout(() => { setSemFocused(false); setSemSugs([]); }, 150); }}
            placeholder={!semanaEditable ? 'Auto' : sinSemana ? 'No aplica' : 'Ej: S25-2026'}
            autoComplete="off" />
        </div>
        <SuggestDropdown anchorRef={semRef} show={semFocused && semanaEditable && !sinSemana && semSugs.length > 0}>
          {semSugs.map(s => (
            <li key={s.consecutivo}
              className="list-group-item list-group-item-action py-1 px-2"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onMouseDown={e => {
                e.preventDefault();
                const mes = s.mes || mesDesdeRango(s.fecha_inicio, s.fecha_fin) || '';
                const anhoFromMes = mes ? (mes.match(/\b(\d{4})\b/) || [])[1] || '' : '';
                setSemQuery(s.consecutivo);
                setMesQuery(mes);
                setAnhoQuery(anhoFromMes);
                setSemSugs([]);
                const ns = { ...item, semana: s.consecutivo, mes, anho: anhoFromMes };
                onChange(idx, { ...ns, nivel_asociacion: calcNivel(ns) });
              }}>
              <strong>{s.consecutivo}</strong>
              <span className="text-muted ms-2" style={{ fontSize: 11 }}>
                {s.fecha_inicio} → {s.fecha_fin}
                {s.fecha_inicio && s.fecha_fin && (
                  <span className="ms-1 text-primary">({mesDesdeRango(s.fecha_inicio, s.fecha_fin)})</span>
                )}
              </span>
            </li>
          ))}
        </SuggestDropdown>
      </td>

      {/* Mes */}
      <td style={{ minWidth: 160 }} className="align-middle">
        <div className="input-group input-group-sm">
          <span className="input-group-text px-1"
            style={{ background: (semanaEditable && sinSemana) ? '#f8f9fa' : GREY.background, cursor: (semanaEditable && sinSemana) ? 'pointer' : 'default' }}>
            <input type="checkbox" checked={sinMes} disabled={!semanaEditable || !sinSemana}
              onChange={e => toggleSinMes(e.target.checked)}
              style={{ cursor: (semanaEditable && sinSemana) ? 'pointer' : 'default' }} />
            <span style={{ fontSize: 10, marginLeft: 2, color: (semanaEditable && sinSemana) ? 'inherit' : '#aaa' }}>N/A</span>
          </span>
          <input ref={mesRef} className="form-control form-control-sm"
            value={(semanaEditable && sinSemana && !sinMes) ? mesQuery : ''}
            disabled={!semanaEditable || !sinSemana || sinMes}
            style={(!semanaEditable || !sinSemana || sinMes) ? GREY : {}}
            onChange={e => { setMesQuery(e.target.value); upd('mes', e.target.value); }}
            onFocus={() => setMesFocused(true)}
            onBlur={() => { setTimeout(() => { setMesFocused(false); setMesSugs([]); }, 150); }}
            placeholder={!semanaEditable || !sinSemana ? (mesQuery || 'Auto') : sinMes ? 'No aplica' : 'Ej: Julio 2026'}
            autoComplete="off" />
        </div>
        <SuggestDropdown anchorRef={mesRef} show={mesFocused && semanaEditable && sinSemana && !sinMes && mesSugs.length > 0}>
          {mesSugs.map(m => (
            <li key={m.id}
              className="list-group-item list-group-item-action py-1 px-2 d-flex justify-content-between align-items-center"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onMouseDown={e => {
                e.preventDefault();
                setMesQuery(m.nombre);
                setMesSugs([]);
                upd('mes', m.nombre);
              }}>
              <strong>{m.nombre}</strong>
              <span className="badge bg-secondary ms-1" style={{ fontSize: 10 }}>#{m.mes_numero}</span>
            </li>
          ))}
        </SuggestDropdown>
      </td>

      {/* Año */}
      <td style={{ minWidth: 100 }} className="align-middle">
        <input ref={anhoRef} className="form-control form-control-sm"
          value={(semanaEditable && sinSemana && sinMes) ? anhoQuery : ''}
          disabled={!semanaEditable || !sinSemana || !sinMes}
          style={(!semanaEditable || !sinSemana || !sinMes) ? GREY : {}}
          onChange={e => { setAnhoQuery(e.target.value); upd('anho', e.target.value); }}
          onFocus={() => setAnhoFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              setAnhoFocused(false);
              if (anhoQuery && validAnhos.length > 0 && !validAnhos.includes(anhoQuery)) {
                setAnhoQuery('');
                upd('anho', '');
              }
            }, 150);
          }}
          placeholder={!semanaEditable || !sinSemana ? 'No aplica' : !sinMes ? 'Auto con mes' : 'Ej: 2026'}
          maxLength={4}
          autoComplete="off" />
        <SuggestDropdown anchorRef={anhoRef} show={anhoFocused && anhoSugs.length > 0}>
          {anhoSugs.map(a => (
            <li key={a}
              className="list-group-item list-group-item-action py-1 px-2"
              style={{ cursor: 'pointer', fontSize: 12 }}
              onMouseDown={e => {
                e.preventDefault();
                setAnhoQuery(a);
                setAnhoFocused(false);
                upd('anho', a);
              }}>
              <strong>{a}</strong>
            </li>
          ))}
        </SuggestDropdown>
      </td>

      {/* Nivel asociación (auto-calculado) */}
      <td style={{ minWidth: 100 }} className="align-middle text-center">
        {item.nivel_asociacion
          ? <span className={`badge ${NIVEL_BADGE[item.nivel_asociacion] || 'bg-secondary'}`} style={{ fontSize: 11 }}>{item.nivel_asociacion}</span>
          : <span className="text-muted" style={{ fontSize: 11 }}>—</span>}
      </td>

      {/* Tipo costo */}
      <td style={{ minWidth: 150 }} className="align-middle">
        <select className="form-select form-select-sm" value={item.tipo_costo || ''}
          onChange={e => upd('tipo_costo', e.target.value)}>
          <option value="">— Sin tipo —</option>
          {tiposCosto.length > 0
            ? tiposCosto.map(t => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)
            : TIPOS_COSTO.map(t => <option key={t} value={t}>{t}</option>)
          }
        </select>
      </td>

      {/* Método distribución */}
      <td style={{ minWidth: 120 }} className="align-middle">
        <select className="form-select form-select-sm" value={item.metodo_distribucion || 'por_cajas'}
          onChange={e => upd('metodo_distribucion', e.target.value)}>
          <option value="por_cajas">Por cajas</option>
          <option value="por_partes_iguales">Partes iguales</option>
        </select>
        {item.distribuido_en && (
          <small className="text-success d-block mt-1" style={{ fontSize: 10 }} title={`Distribuido: ${item.distribuido_en}`}>
            ✓ Distribuido
          </small>
        )}
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <button type="button" title="Duplicar ítem" onClick={() => onDuplicate(idx)}
            style={{ display: 'inline-flex', alignItems: 'center', padding: 4, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: '#6c757d', opacity: 0.75 }}>
            <FaCopy size={13} />
          </button>
          <button type="button" title="Eliminar ítem" onClick={() => onRemove(idx)}
            style={{ display: 'inline-flex', alignItems: 'center', padding: 4, border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: '#dc3545', opacity: 0.8 }}>
            <FaTimes size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Formulario de Factura ────────────────────────────────────────────────────
const EMPTY_HEADER = {
  fecha: '', tipo: 'Factura', numero_factura: '', nit_proveedor: '', total: '',
};

function FacturaForm({ initial, proveedores, tiposDocs = [], tiposCosto = [], onSave, onCancel }) {
  const [form, setForm]     = useState(() => {
    if (!initial) return EMPTY_HEADER;
    const { items: _i, proveedor_nombre: _p, proveedor_razon: _r, semana: _s, mes: _m, estado_total: _e, ...rest } = initial;
    return { ...EMPTY_HEADER, ...rest, total: rest.total ?? '' };
  });
  const [items, setItems]   = useState(initial?.items?.length ? initial.items : [{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [trm, setTrm]       = useState(null);
  const [trmLoading, setTrmLoading] = useState(false);

  useEffect(() => {
    if (!form.fecha) { setTrm(null); return; }
    setTrmLoading(true);
    costosFetch(`/trm?fecha=${form.fecha}`)
      .then(r => r.json())
      .then(d => setTrm(d.valor ?? null))
      .catch(() => setTrm(null))
      .finally(() => setTrmLoading(false));
  }, [form.fecha]);

  const trmStr = trm != null ? String(trm) : '';

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function addItem() { setItems(prev => [...prev, { ...EMPTY_ITEM }]); }
  function removeItem(idx) { setItems(prev => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx, val) { setItems(prev => prev.map((it, i) => i === idx ? val : it)); }
  function duplicateItem(idx) { setItems(prev => [...prev.slice(0, idx + 1), { ...prev[idx] }, ...prev.slice(idx + 1)]); }

  const hasUSD = items.some(it => (it.divisa||'COP').toUpperCase() === 'USD');
  const calcTotal = items.reduce((s, it) => {
    const sub = (parseFloat(it.cantidad)||0) * (parseFloat(it.valor_unitario)||0);
    return s + ((it.divisa||'COP').toUpperCase() === 'USD' ? sub * (trm ?? 1) : sub);
  }, 0);
  const declaredTotal = form.total !== '' && form.total != null ? parseFloat(form.total) : null;
  const totalMismatch = declaredTotal !== null && Math.abs(calcTotal - declaredTotal) >= 0.01;

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, items });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Encabezado ── */}
      <div className="row g-2 mb-3">
        {/* Fecha */}
        <div className="col-md-2">
          <label className="form-label small fw-bold mb-1">Fecha</label>
          <input type="date" className="form-control form-control-sm" value={form.fecha}
            onChange={e => set('fecha', e.target.value)} />
        </div>

        {/* Tipo */}
        <div className="col-md-2">
          <label className="form-label small fw-bold mb-1">Tipo</label>
          <select className="form-select form-select-sm" value={form.tipo}
            onChange={e => set('tipo', e.target.value)}>
            {(tiposDocs.length ? tiposDocs : TIPOS_FALLBACK.map(n => ({ nombre: n }))).map(t => (
              <option key={t.nombre} value={t.nombre}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* N° Factura */}
        <div className="col-md-2">
          <label className="form-label small fw-bold mb-1">N° Factura</label>
          <input className="form-control form-control-sm" value={form.numero_factura}
            onChange={e => set('numero_factura', e.target.value)} placeholder="FV-001234" />
        </div>

        {/* TRM — solo visible cuando hay ítems en USD */}
        {hasUSD && (
          <div className="col-md-2">
            <label className="form-label small fw-bold mb-1 d-flex align-items-center gap-1">
              TRM (USD→COP)
              {trmLoading && <span className="spinner-border spinner-border-sm text-secondary" style={{ width: 10, height: 10, borderWidth: 2 }} />}
            </label>
            <div className={`form-control form-control-sm fw-bold ${!trmStr ? 'text-warning border-warning' : 'text-success'}`}
              style={{ background: '#f8f9fa' }}>
              {trmStr ? Number(trmStr).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : 'Sin TRM'}
            </div>
          </div>
        )}

        {/* Proveedor */}
        <div className="col-md-8">
          <label className="form-label small fw-bold mb-1">Proveedor (NIT)</label>
          <select className="form-select form-select-sm" value={form.nit_proveedor}
            onChange={e => set('nit_proveedor', e.target.value)} required>
            <option value="">— Seleccionar proveedor —</option>
            {proveedores.map(p => (
              <option key={p.nit} value={p.nit}>{p.nit} — {p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Total declarado */}
        <div className="col-md-2">
          <label className="form-label small fw-bold mb-1">Total declarado</label>
          <input type="number" min="0" step="any"
            className={`form-control form-control-sm ${totalMismatch ? 'border-warning' : ''}`}
            value={form.total}
            onChange={e => set('total', e.target.value)}
            placeholder="Opcional" />
        </div>

        {/* Total calculado (solo lectura) */}
        <div className="col-md-2">
          <label className="form-label small fw-bold mb-1">Total calculado (COP)</label>
          <div className="form-control form-control-sm fw-bold"
            style={{ background: '#d1e7dd', border: `1px solid ${totalMismatch ? '#ffc107' : '#a8c8b2'}`, color: totalMismatch ? '#664d03' : '#0f5132' }}>
            {calcTotal > 0 ? calcTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '—'}
          </div>
        </div>

        {/* Advertencia de mismatch */}
        {totalMismatch && (
          <div className="col-12">
            <div className="alert alert-warning py-1 px-2 mb-0 small" style={{ fontSize: 12 }}>
              El total declarado ({Number(declaredTotal).toLocaleString('es-CO')}) no coincide con la suma de ítems ({calcTotal.toLocaleString('es-CO')}).
              Diferencia: {Math.abs(calcTotal - declaredTotal).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}.
              Se guardará el total declarado con estado mismatch.
            </div>
          </div>
        )}
      </div>

      {/* ── Ítems ── */}
      <div className="mb-2 d-flex align-items-center gap-2">
        <span className="fw-bold small">Ítems de la factura</span>
        <button type="button" className="btn btn-outline-success btn-sm py-0 px-2" onClick={addItem}>
          Agregar ítem
        </button>
      </div>

      <div className="table-responsive mb-3">
        <table className="table table-sm table-bordered mb-0" style={{ fontSize: 13 }}>
          <thead style={{ background: '#e9ecef' }}>
            <tr>
              <th>Concepto</th>
              <th>Contenedor</th>
              <th>Booking</th>
              <th>Divisa</th>
              <th>Cantidad</th>
              <th>Valor Unitario</th>
              <th className="text-end">Subtotal</th>
              <th>Semana</th>
              <th>Mes</th>
              <th>Año</th>
              <th>Nivel</th>
              <th>Tipo costo</th>
              <th title="Método de distribución">Distribución</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <ItemRow key={idx} item={it} idx={idx} onChange={updateItem} onRemove={removeItem} onDuplicate={duplicateItem} tiposCosto={tiposCosto} />
            ))}
            {items.length === 0 && (
              <tr><td colSpan={14} className="text-center text-muted py-2 small">Sin ítems — agrega uno arriba</td></tr>
            )}
          </tbody>
          {items.length > 1 && (
            <tfoot>
              <tr>
                <td colSpan={6} className="text-end fw-bold small pe-2">Total (COP):</td>
                <td className="text-end fw-bold text-primary">
                  {calcTotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

export default FacturaForm;
