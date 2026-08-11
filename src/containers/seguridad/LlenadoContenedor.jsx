import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPlus, FaMinus, FaCamera, FaImages, FaTimes, FaCog } from 'react-icons/fa';
import Loader from '@components/shared/Loader';

import { filtrarSemanasRangoProgramador } from '@services/api/semanas';
import { encontrarModulo } from '@services/api/configuracion';
import { paginarEmbarques } from '@services/api/embarques';
import { actualizarListado, duplicarListado, paginarListado } from '@services/api/listado';
import { listarAlmacenes } from "@services/api/almacenes";
import { listarCombos } from '@services/api/combos';
import { encontrarUnSerial, usarSeriales, crearInspeccionVacio } from '@services/api/seguridad';
import { listarMotivoDeUso } from '@services/api/motivoDeUso';
import { listarMotivoDeRechazo } from '@services/api/motivoDeRechazo';
import { agregarRechazo } from '@services/api/rechazos';
import { subirEvidencias } from '@services/api/googleDrive';
import { filterActiveContainerRows, getLatestContainerRowByCode, getUniqueLatestContainerRowsByCode } from '@utils/contenedorEstado';
import InsumoInspeccVacio from "@components/seguridad/InsumoInspeccVacio";

const MOTIVO_LLENADO_CONTENEDOR = "Lleneado de contenedor";
const MODULO_INSUMOS_LLENADO = "Insumos_llenado_contenedor";
const EVIDENCIA_MAX_FILES = 20;
const EVIDENCIA_MAX_FILE_SIZE = 5 * 1024 * 1024;
const EVIDENCIA_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

const JERARQUIA_CAMPOS = {
  semana: ['consignee', 'buque', 'destino', 'booking', 'contenedor'],
  consignee: ['buque', 'destino', 'booking', 'contenedor'],
  buque: ['destino', 'booking', 'contenedor'],
  destino: ['booking', 'contenedor'],
  booking: ['contenedor']
};

const getItemId = (item) => item?.id || item?.consecutivo;
const normalizeCode = (value) => String(value || '').trim().toUpperCase();
const capitalizarPrimeraLetra = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : "");

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
  const [evidenciaFiles, setEvidenciaFiles] = useState([]);
  const [uploadingEvidencia, setUploadingEvidencia] = useState(false);
  const [evidenciaDriveFolderId, setEvidenciaDriveFolderId] = useState('');
  const [openConfig, setOpenConfig] = useState(false);
  const [insumosConfig, setInsumosConfig] = useState([]);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const parseDetalles = useCallback((detalles) => {
    try {
      const parsed = JSON.parse(detalles);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const serialFields = useMemo(
    () => (Array.isArray(insumosConfig) ? insumosConfig : []),
    [insumosConfig]
  );

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
      const [moduloSemana, prods, motivos, alms, driveModuloListado, moduloInsumos] = await Promise.all([
        encontrarModulo("Semana", { syncWeeks: false }),
        listarCombos(),
        listarMotivoDeRechazo(),
        listarAlmacenes(),
        encontrarModulo('Google_drive_evidencias_listado').catch(() => []),
        encontrarModulo(MODULO_INSUMOS_LLENADO).catch(() => [])
      ]);

      const insumos = parseDetalles(moduloInsumos?.[0]?.detalles);
      setInsumosConfig(insumos);

      try {
        const driveDetalles = driveModuloListado?.[0]?.detalles;
        if (driveDetalles) {
          const driveConfig = JSON.parse(driveDetalles);
          if (driveConfig?.carpetaID) setEvidenciaDriveFolderId(driveConfig.carpetaID);
        }
      } catch { /* carpeta Drive listado no configurada aun */ }

      const weeks = await filtrarSemanasRangoProgramador({
        anho_actual: moduloSemana[0]?.anho_actual,
        semana_actual: moduloSemana[0]?.semana_actual,
        semana_previa: moduloSemana[0]?.semana_previa,
        semana_siguiente: moduloSemana[0]?.semana_siguiente,
        total_semanas_anho: moduloSemana[0]?.total_semanas_anho,
      }).catch(() => []);

      setOptions({
        semanas: (weeks || []).map((w) => w.consecutivo),
        productos: Array.isArray(prods) ? prods : [],
        motivosRechazo: Array.isArray(motivos) ? motivos : [],
        almacenes: Array.isArray(alms) ? alms : [],
        almacenByUser: JSON.parse(localStorage.getItem("almacenByUser") || "[]")
      });
    } catch (error) {
      console.error("Error al cargar datos iniciales del llenado:", error);
    }
  }, [parseDetalles]);

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

        const uniqueContenedores = getUniqueLatestContainerRowsByCode(listadoFiltrado);

        setContenedores(uniqueContenedores);
        setSelectedContenedor(getLatestContainerRowByCode(uniqueContenedores, filtros.contenedor));
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
      consignees: [...new Set(embarquesObjet.map((r) => r.cliente?.cod).filter(Boolean))],
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

  const agregarEvidenciaFiles = (fileList) => {
    const nuevos = Array.from(fileList || []);
    if (!nuevos.length) return;

    const combinados = [...evidenciaFiles, ...nuevos];

    if (combinados.length > EVIDENCIA_MAX_FILES) {
      window.alert(`Solo puedes subir maximo ${EVIDENCIA_MAX_FILES} fotos.`);
      return;
    }

    const invalido = nuevos.find(
      (file) => !EVIDENCIA_ALLOWED_TYPES.includes(file.type) || file.size > EVIDENCIA_MAX_FILE_SIZE
    );

    if (invalido) {
      window.alert(`El archivo ${invalido.name} no es valido. Usa JPG, PNG, GIF o WEBP de maximo 5MB.`);
      return;
    }

    setEvidenciaFiles(combinados);
  };

  const removerEvidenciaFile = (idx) => {
    setEvidenciaFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const subirEvidenciasLlenado = async () => {
    if (!selectedContenedor) {
      window.alert("Selecciona un contenedor antes de subir evidencias.");
      return;
    }

    if (!evidenciaFiles.length) {
      window.alert("Selecciona al menos una foto para subir.");
      return;
    }

    if (!evidenciaDriveFolderId) {
      window.alert("La carpeta de evidencias no esta configurada. Contacta a un administrador.");
      return;
    }

    setUploadingEvidencia(true);

    try {
      const formData = new FormData();
      formData.append('listado_id', selectedContenedor.id);
      formData.append('semana', filtros.semana || '');
      formData.append('fecha', inputsRef.current.fecha?.value || today);
      formData.append('item', selectedContenedor.Contenedor?.contenedor || `listado-${selectedContenedor.id}`);
      formData.append('finca_destino', selectedContenedor.almacen?.consecutivo || selectedContenedor.almacen?.nombre || '');
      formData.append('carpetaID', evidenciaDriveFolderId);
      evidenciaFiles.forEach((file) => formData.append('fotos', file));

      await subirEvidencias(formData);

      window.alert(`Se subieron ${evidenciaFiles.length} fotos exitosamente.`);
      setEvidenciaFiles([]);
    } catch (error) {
      window.alert(error.message || "No fue posible subir las evidencias.");
    } finally {
      setUploadingEvidencia(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const getVal = (id) => inputsRef.current[id]?.value || filtros[id];

    try {
      if (sectionsProduct.length === 0 && sectionsRechazo.length === 0) {
        throw new Error("Agrega al menos una caja recibida o un rechazo antes de guardar");
      }

      const serialesIngresados = serialFields
        .map((item) => ({
          key: capitalizarPrimeraLetra(item.name),
          value: inputsRef.current[`serial_${item.consecutivo || item.id}`]?.value?.trim() || ''
        }))
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
        itemContenedor = getLatestContainerRowByCode(rows, contenedorIngresado);
      }

      if (!id_embarque) {
        throw new Error("Booking no válido");
      }

      if (!itemContenedor && contenedorIngresado) {
        const formatoValido = /^[A-Za-z]{4}\d{7}$/.test(contenedorIngresado);
        if (!formatoValido) {
          throw new Error("El contenedor debe tener el formato ABCD1234567 (4 letras y 7 numeros)");
        }

        const confirmarCreacion = window.confirm(
          `El contenedor "${contenedorIngresado}" no existe. ¿Desea crearlo para continuar con el llenado?`
        );
        if (!confirmarCreacion) {
          return;
        }

        const ahora = new Date();
        const horaActual = [
          String(ahora.getHours()).padStart(2, '0'),
          String(ahora.getMinutes()).padStart(2, '0'),
          String(ahora.getSeconds()).padStart(2, '0')
        ].join(':');

        const resCrear = await crearInspeccionVacio({
          fecha: inputsRef.current.fecha?.value || today,
          contenedor: contenedorIngresado,
          observaciones: 'Contenedor creado desde el modulo de Llenado de Contenedores',
          seriales: [],
          semana: filtros.semana,
          hora_inicio: horaActual,
          hora_fin: horaActual,
          agente:
            [user?.nombre, user?.apellido].filter(Boolean).join(" ").trim()
            || user?.username
            || "Sistema",
          zona: "Inspeccion vacio"
        });

        itemContenedor = resCrear?.data?.listado || null;

        if (!itemContenedor) {
          throw new Error("No fue posible crear el contenedor. Verifica la semana y vuelve a intentar.");
        }
      }

      if (!itemContenedor) {
        throw new Error("Booking o contenedor no válido");
      }

      await Promise.all([
        ...sectionsProduct.map(async (sec, index) => {
const payload = {
            fecha: inputsRef.current.fecha?.value || today,
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
            fecha_rechazo: inputsRef.current.fecha?.value || today
          })
        )
      ]);

      if (serialesVerificados.length > 0) {
        const motivos = await listarMotivoDeUso();
        const motivo = motivos.find((m) => m.motivo_de_uso === MOTIVO_LLENADO_CONTENEDOR);

        await usarSeriales(
          filtros.semana,
          inputsRef.current.fecha?.value || today,
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
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="mb-0">Llenado de Contenedor</h2>
          {(() => {
            const usuarioConfig = typeof window !== "undefined"
              ? JSON.parse(localStorage.getItem("usuario") || "{}")
              : {};
            return usuarioConfig?.id_rol === "Super administrador" && (
              <button
                type="button"
                onClick={() => setOpenConfig(true)}
                className="btn btn-link p-0"
                aria-label="Configuracion"
              >
                <FaCog style={{ color: "rgba(0, 0, 0, 0.3)" }} size={20} />
              </button>
            );
          })()}
        </div>

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
                required
              />
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="input-group">
              <span className="input-group-text">Semana</span>
              <input
                type="text"
                id="semana"
                className="form-control"
                list="l-semana"
                ref={(el) => {
                  inputsRef.current.semana = el;
                }}
                onChange={handleHierarchyChange}
                required
              />
              <datalist id="l-semana">
                {options.semanas.map((semana) => (
                  <option key={semana} value={semana}>{semana}</option>
                ))}
              </datalist>
            </div>
          </div>

          {[
            {
              label: "Consignee", id: "consignee",
              opciones: () => datalists.consignees.map((cod) => ({ value: cod, label: cod }))
            },
            {
              label: "Buque", id: "buque",
              opciones: () => datalists.buques.map((b) => ({ value: b, label: b }))
            },
            {
              label: "Destino", id: "destino",
              opciones: () => datalists.destinos.map((d) => ({ value: d, label: d }))
            },
            {
              label: "Booking", id: "booking",
              opciones: () => datalists.bookings.map((b) => ({ value: b, label: b }))
            },
          ].map((field) => (
            <div className="col-md-6 mb-3" key={field.id}>
              <div className="input-group">
                <span className="input-group-text">{field.label}</span>
                <select
                  id={field.id}
                  className="form-select"
                  ref={(el) => {
                    inputsRef.current[field.id] = el;
                  }}
                  value={filtros[field.id] || ''}
                  onChange={handleHierarchyChange}
                  required
                >
                  <option value="">Seleccione</option>
                  {field.opciones().map((op, index) => (
                    <option key={`${field.id}-${index}`} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <div className="col-md-6 mb-3">
            <div className="input-group">
              <span className="input-group-text">Contenedor</span>
              <input
                type="text"
                id="contenedor"
                className="form-control"
                list="l-contenedor"
                ref={(el) => {
                  inputsRef.current.contenedor = el;
                }}
                onChange={handleHierarchyChange}
                required
              />
              <datalist id="l-contenedor">
                {contenedores.map((option) => (
                  <option
                    key={`contenedor-${option?.id}-${option?.id_contenedor}`}
                    value={option?.Contenedor?.contenedor || ''}
                  />
                ))}
              </datalist>
            </div>
          </div>

          {serialFields.map((field) => (
            <div className="col-md-6 mb-3" key={field.id || field.consecutivo}>
              <div className="input-group">
                <span className="input-group-text">{capitalizarPrimeraLetra(field.name)}</span>
                <input
                  type="text"
                  className="form-control"
                  ref={(el) => {
                    inputsRef.current[`serial_${field.consecutivo || field.id}`] = el;
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="row my-3">
          <div className="col-12">
            <h5 className="mb-2">Evidencia Fotografica</h5>
            {!selectedContenedor && (
              <div className="alert alert-secondary py-2 mb-2">
                Selecciona un contenedor existente para habilitar la carga de evidencias.
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                agregarEvidenciaFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                agregarEvidenciaFiles(e.target.files);
                e.target.value = '';
              }}
            />

            <div className="row g-2 mb-2">
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-outline-primary w-100"
                  disabled={!selectedContenedor || uploadingEvidencia}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <FaCamera className="me-1" /> Tomar foto
                </button>
              </div>
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  disabled={!selectedContenedor || uploadingEvidencia}
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <FaImages className="me-1" /> Elegir de galeria
                </button>
              </div>
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-success w-100"
                  disabled={!selectedContenedor || uploadingEvidencia || evidenciaFiles.length === 0}
                  onClick={subirEvidenciasLlenado}
                >
                  {uploadingEvidencia ? 'Subiendo...' : `Subir evidencias (${evidenciaFiles.length})`}
                </button>
              </div>
            </div>

            {evidenciaFiles.length > 0 && (
              <ul className="list-group list-group-flush mb-2">
                {evidenciaFiles.map((file, idx) => (
                  <li key={idx} className="list-group-item small d-flex justify-content-between align-items-center px-0">
                    <span>
                      {file.name}
                      <span className="text-muted ms-2">({(file.size / 1024).toFixed(1)} KB)</span>
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-danger p-0"
                      onClick={() => removerEvidenciaFile(idx)}
                      disabled={uploadingEvidencia}
                    >
                      <FaTimes />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
      {openConfig && (
        <InsumoInspeccVacio
          setOpenConfig={(val) => {
            setOpenConfig(val);
            if (!val) init();
          }}
          modulo={MODULO_INSUMOS_LLENADO}
        />
      )}
    </>
  );
};

export default FormularioDinamico;
