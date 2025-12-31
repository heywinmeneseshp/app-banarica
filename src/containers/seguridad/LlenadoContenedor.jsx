import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

// Constantes
const MOTIVO_LLENADO_CONTENEDOR = "Lleneado de contenedor";
const SERIALES_A_VERIFICAR = ["kit", "termografo"];

// Jerarquía de campos
const JERARQUIA_CAMPOS = {
  semana: ['consignee', 'buque', 'destino', 'booking', ''],
  consignee: ['buque', 'destino', 'booking', ''],
  buque: ['destino', 'booking', ''],
  destino: ['booking', ''],
  booking: ['']
};

const FormularioDinamico = () => {
  // Fechas iniciales
  const [fechaInicial, fechaFinal, today] = useMemo(() => {
    const today = new Date();
    const monthBefore = new Date(today);
    const monthLater = new Date(today);
    monthBefore.setMonth(monthBefore.getMonth() - 1);
    monthLater.setMonth(monthLater.getMonth() + 1);
    return [
      monthBefore.toISOString().split('T')[0],
      monthLater.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ];
  }, []);

  // Estado principal del formulario
  const [formData, setFormData] = useState({
    fecha: today,
    semana: '',
    consignee: "",
    buque: '',
    destino: '',
    booking: '',
    contenedor: '',
    kit: '',
    termografo: ''
  });

  // Estados para opciones
  const [semOptions, setSemOptions] = useState([]);
  const [embarquesObjet, setEmbarquesObject] = useState([]);
  const [contenedores, setContenedores] = useState([]);
  const [listado, setListado] = useState([]);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [almacenByUser, setAlmacenByUser] = useState([]);
  const [motivosRechazo, setMotivosRechazo] = useState([]);
  const [loading, setLoading] = useState(false);

  // Secciones dinámicas
  const [sections, setSections] = useState([]);
  const [sectionsProduct, setSectionsProduct] = useState([]);

  // Datos derivados para opciones de datalist
  const { buquesOpciones, destinosOpciones, consigneeOpciones } = useMemo(() => {
    if (!embarquesObjet.length) return { buquesOpciones: [], destinosOpciones: [], consigneeOpciones: [] };
    
    // Filtramos según lo que ya se ha seleccionado
    let filteredEmbarques = embarquesObjet;
    
    if (formData.consignee) {
      filteredEmbarques = filteredEmbarques.filter(res => res.cliente.cod === formData.consignee);
    }
    if (formData.buque) {
      filteredEmbarques = filteredEmbarques.filter(res => res.Buque.buque === formData.buque);
    }
    if (formData.destino) {
      filteredEmbarques = filteredEmbarques.filter(res => res.Destino.destino === formData.destino);
    }
    
    const consignees = [...new Set(filteredEmbarques.map(res => res.cliente.cod))];
    const buquesList = [...new Set(filteredEmbarques.map(res => res.Buque.buque))];
    const destinosList = [...new Set(filteredEmbarques.map(res => res.Destino.destino))];
    
    return { 
      buquesOpciones: buquesList, 
      destinosOpciones: destinosList, 
      consigneeOpciones: consignees 
    };
  }, [embarquesObjet, formData.consignee, formData.buque, formData.destino]);

  // Embarques filtrados para el datalist de booking
  const embarquesFiltrados = useMemo(() => {
    if (!embarquesObjet.length) return [];
    
    let filtered = embarquesObjet;
    
    if (formData.consignee) {
      filtered = filtered.filter(res => res.cliente.cod === formData.consignee);
    }
    if (formData.buque) {
      filtered = filtered.filter(res => res.Buque.buque === formData.buque);
    }
    if (formData.destino) {
      filtered = filtered.filter(res => res.Destino.destino === formData.destino);
    }
    
    return filtered.map(item => item.bl);
  }, [embarquesObjet, formData.consignee, formData.buque, formData.destino]);

  // Configuración de campos del formulario
  const fields = useMemo(() => [
    { label: "Fecha", id: "fecha", type: "date", className: "col-md-6 mb-3", required: true },
    { label: "Semana", id: "semana", type: "text", className: "col-md-6 mb-3", datalist: semOptions, required: true },
    { label: "Consignee", id: "consignee", type: "text", className: "col-md-6 mb-3", datalist: consigneeOpciones, required: true },
    { label: "Buque", id: "buque", type: "text", className: "col-md-6 mb-3", datalist: buquesOpciones, required: true },
    { label: "Destino", id: "destino", type: "text", className: "col-md-6 mb-3", datalist: destinosOpciones, required: true },
    { label: "Booking", id: "booking", type: "text", className: "col-md-6 mb-3", datalist: embarquesFiltrados, required: true },
    { label: "Contenedor", id: "contenedor", type: "text", className: "col-md-6 mb-3", datalist: contenedores, required: true },
    { label: "Kit", id: "kit", type: "text", className: "col-md-6 mb-3" },
    { label: "Termógrafo", id: "termografo", type: "text", className: "col-md-6 mb-3" }
  ], [semOptions, consigneeOpciones, buquesOpciones, destinosOpciones, embarquesFiltrados, contenedores]);

  // Inicialización
  const initial = useCallback(async () => {
    try {
      const [weeks, productosData, motivos, almacenesData] = await Promise.all([
        filtrarSemanaRangoMes(1, 1),
        listarCombos(),
        listarMotivoDeRechazo(),
        listarAlmacenes()
      ]);

      setProductos(productosData);
      setMotivosRechazo(motivos);
      setAlmacenes(almacenesData);
      setSemOptions(weeks.map(item => item.consecutivo));
      setAlmacenByUser(JSON.parse(localStorage.getItem("almacenByUser") || "[]"));
    } catch (error) {
      console.error("Error en inicialización:", error);
    }
  }, []);

  // Cargar embarques por semana
  const listarEmbarques = useCallback(async () => {
    if (!formData.semana) return;
    
    try {
      const embarquesList = await paginarEmbarques(1, 1000, { semana: formData.semana });
      setEmbarquesObject(embarquesList.data);
    } catch (error) {
      console.error("Error al listar embarques:", error);
    }
  }, [formData.semana]);

  // Listar contenedores
  const listarContenedores = useCallback(async () => {
    if (!formData.booking) return; // Solo buscar contenedores cuando hay booking
    
    try {
      const list = await paginarListado(1, 10, {
        contenedor: formData.contenedor,
        fecha_inicial: fechaInicial,
        fecha_final: fechaFinal,
        habilitado: true,
      });
      
      setListado(list.data);
      setContenedores(list.data.map(item => item.Contenedor?.contenedor || ''));
    } catch (error) {
      console.error("Error al listar contenedores:", error);
    }
  }, [formData.contenedor, formData.booking, fechaInicial, fechaFinal]);

  // Efectos
  useEffect(() => { initial(); }, [initial]);
  useEffect(() => { listarEmbarques(); }, [listarEmbarques]);
  useEffect(() => { 
    if (formData.booking) {
      listarContenedores(); 
    }
  }, [listarContenedores]);

  // Handler para cambios en campos con limpieza de jerarquía
  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Campos a limpiar basados en la jerarquía
    const camposALimpiar = JERARQUIA_CAMPOS[id] || [];
    
    setFormData(prev => {
      const nuevoEstado = { ...prev, [id]: value };
      
      // Limpiar campos inferiores en la jerarquía
      camposALimpiar.forEach(campo => {
        nuevoEstado[campo] = '';
      });
      
      return nuevoEstado;
    });
  };

  const addSection = (type) => {
    const newSection = { 
      id: Date.now(), 
      cod_productor: "", 
      producto: '', 
      totalCajas: '',
      ...(type === 'rechazo' && { codigoPallet: '', motivo_rechazo: '' })
    };
    
    if (type === 'producto') {
      setSectionsProduct(prev => [...prev, newSection]);
    } else {
      setSections(prev => [...prev, newSection]);
    }
  };

  const removeSection = (id, type) => {
    if (type === 'producto') {
      setSectionsProduct(prev => prev.filter(section => section.id !== id));
    } else {
      setSections(prev => prev.filter(section => section.id !== id));
    }
  };

  const updateSection = (id, field, value, type) => {
    const updateFn = type === 'producto' ? setSectionsProduct : setSections;
    
    updateFn(prev => prev.map(sec =>
      sec.id === id ? { ...sec, [field]: value } : sec
    ));
  };

  // Validaciones y procesamiento
  const validarSeriales = async () => {
    const serialesList = [];
    
    for (const item of SERIALES_A_VERIFICAR) {
      if (formData[item]) {
        const serial = await encontrarUnSerial({
          bag_pack: formData[item],
          available: [true],
        });
        
        if (!serial[0]) {
          const continuar = window.confirm(`El ${item} no existe. ¿Desea continuar?`);
          if (!continuar) return null;
        }
        serialesList.push(formData[item]);
      }
    }
    
    return serialesList;
  };

  const validarDatos = () => {
    if (!semOptions.includes(formData.semana)) {
      window.alert(`La semana "${formData.semana}" no existe`);
      return false;
    }
    
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
    if (!user.id) {
      window.alert("Usuario no encontrado");
      return false;
    }
    
    const id_embarque = embarquesObjet.find(item => item.bl === formData.booking)?.id;
    if (!id_embarque) {
      window.alert("El booking no existe");
      return false;
    }
    
    const itemListado = listado.filter(item => item?.Contenedor?.contenedor === formData.contenedor);
    const contenedorId = itemListado[0]?.id_contenedor;
    if (!contenedorId) {
      window.alert("El contenedor no existe");
      return false;
    }
    
    return { id_embarque, contenedorId, itemListado, user };
  };

  const procesarProductos = async (itemListado, id_embarque, contenedorId) => {
    const listadoPredeterminado = itemListado.filter(item => item.combo.nombre === "Predeterminado");
    
    await Promise.all(sectionsProduct.map(async (element, index) => {
      const { cod_productor: id_lugar_de_llenado, producto: id_producto, totalCajas: cajas_unidades } = element;
      
      if (!id_lugar_de_llenado) {
        window.alert(`El almacén "${id_lugar_de_llenado}" no existe.`);
        return;
      }
      
      const payload = {
        fecha: formData.fecha,
        id_embarque,
        id_contenedor: contenedorId,
        id_lugar_de_llenado,
        id_producto,
        cajas_unidades,
        habilitado: true,
      };
      
      if (listadoPredeterminado[index]) {
        await actualizarListado(listadoPredeterminado[index].id, payload);
      } else {
        const duplicado = await duplicarListado(itemListado[0].id);
        await actualizarListado(duplicado.id, payload);
      }
    }));
  };

  const procesarRechazos = async (contenedorId, userId) => {
    await Promise.all(sections.map(async item => {
      const rechazo = {
        id_producto: item.producto,
        id_motivo_de_rechazo: item.motivo_rechazo,
        cantidad: item.totalCajas,
        serial_palet: item.codigoPallet,
        cod_productor: item.cod_productor,
        id_contenedor: contenedorId,
        id_usuario: userId,
        habilitado: false,
      };
      await agregarRechazo(rechazo);
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validar que todos los campos requeridos estén llenos
      const camposRequeridos = ['semana', 'consignee', 'buque', 'destino', 'booking', 'contenedor'];
      const camposFaltantes = camposRequeridos.filter(campo => !formData[campo]);
      
      if (camposFaltantes.length > 0) {
        window.alert(`Por favor complete los siguientes campos: ${camposFaltantes.join(', ')}`);
        return;
      }
      
      // Validar seriales
      const serialesList = await validarSeriales();
      if (serialesList === null) return;
      
      // Validar datos básicos
      const datosValidados = validarDatos();
      if (!datosValidados) return;
      const { id_embarque, contenedorId, itemListado, user } = datosValidados;
      
      // Obtener motivo de uso
      const motivos = await listarMotivoDeUso();
      const motivo = motivos.find(item => item.motivo_de_uso === MOTIVO_LLENADO_CONTENEDOR);
      if (!motivo) {
        window.alert(`El motivo "${MOTIVO_LLENADO_CONTENEDOR}" no existe`);
        return;
      }
      
      // Procesar en paralelo
      await Promise.all([
        procesarProductos(itemListado, id_embarque, contenedorId),
        procesarRechazos(contenedorId, user.id),
      ]);
      
      // Registrar seriales si existen
      if (serialesList.length > 0) {
        await usarSeriales(formData.semana, formData.fecha, serialesList, contenedorId, user.id, motivo);
      }
      
      window.alert("Formulario enviado exitosamente");
      
    } catch (error) {
      console.error("Error en el manejo del formulario:", error);
      window.alert("Ocurrió un error al procesar la solicitud.");
    } finally {
      // Resetear formulario
      setSectionsProduct([]);
      setSections([]);
      setFormData({
        fecha: today,
        semana: '',
        consignee: "",
        buque: '',
        destino: '',
        booking: '',
        contenedor: '',
        kit: '',
        termografo: ''
      });
      setEmbarquesObject([]);
      setContenedores([]);
      setListado([]);
      setLoading(false);
    }
  };

  // Componentes reutilizables
  const SeccionProducto = ({ section, type = 'producto' }) => (
    <>
      {/* Código Productor */}
      <div className="col-md-2 mb-3">
        <div className="input-group">
          <span className="input-group-text">Cod:</span>
          <select
            className="form-control"
            value={section.cod_productor}
            required
            onChange={(e) => updateSection(section.id, 'cod_productor', e.target.value, type)}
          >
            <option value=""></option>
            {(type === 'producto' ? almacenByUser : almacenes).map((item, key) => (
              <option key={key} value={type === 'producto' ? item.id : item.consecutivo}>
                {item.consecutivo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Campo adicional para rechazos */}
      {type === 'rechazo' && (
        <>
          <div className="col-md-2 mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Palet"
                value={section.codigoPallet}
                required
                onChange={(e) => updateSection(section.id, 'codigoPallet', e.target.value, type)}
              />
            </div>
          </div>
          <div className="col-md-2 mb-3">
            <div className="input-group">
              <select
                className="form-control"
                value={section.motivo_rechazo}
                required
                onChange={(e) => updateSection(section.id, 'motivo_rechazo', e.target.value, type)}
              >
                <option value="">Seleccione el motivo</option>
                {motivosRechazo.map((item, key) => (
                  <option key={key} value={item.id}>
                    {item.motivo_rechazo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {/* Producto */}
      <div className={type === 'producto' ? "col-md-6 mb-3" : "col-md-3 mb-3"}>
        <div className="input-group">
          <span className="input-group-text">Producto:</span>
          <select
            className="form-control"
            value={section.producto}
            required
            onChange={(e) => updateSection(section.id, 'producto', e.target.value, type)}
          >
            <option value=""></option>
            {productos.map((item, key) => (
              <option key={key} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cajas */}
      <div className="col-md-2 mb-3">
        <div className="input-group">
          <span className="input-group-text">Cajas:</span>
          <input
            type="number"
            className="form-control"
            placeholder="00"
            value={section.totalCajas}
            required
            onChange={(e) => updateSection(section.id, 'totalCajas', e.target.value, type)}
          />
        </div>
      </div>

      {/* Botón eliminar */}
      <div className="col-md-1 mb-3">
        <button
          type="button"
          className="btn btn-danger w-100"
          onClick={() => removeSection(section.id, type)}
        >
          <FaMinus />
        </button>
      </div>
    </>
  );

  return (
    <>
      <Loader loading={loading} />
      <form onSubmit={handleSubmit} className="container">
        <div className="mb-4 mt-3 text-center">
          <h2>Llenado de Contenedor</h2>
        </div>
        
        {/* Campos principales */}
        <div className="row">
          {fields.map(({ label, id, type, className, required, datalist }) => (
            <div className={className} key={id}>
              <div className="input-group">
                <span className="input-group-text">{label}</span>
                <input
                  type={type}
                  id={id}
                  value={formData[id]}
                  onChange={handleChange}
                  className="form-control"
                  required={required || false}
                  list={datalist ? `list-${id}` : undefined}
                  disabled={id === 'contenedor' && !formData.booking} // Deshabilitar contenedor si no hay booking
                />
                {datalist && (
                  <datalist id={`list-${id}`}>
                    {datalist.map((option, index) => (
                      <option key={index} value={option} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>
          ))}

          <div></div>

          {/* Botones para agregar secciones */}
          <div className="col-md-6 mb-3">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={() => addSection('producto')}
              disabled={!formData.contenedor} // Solo habilitar cuando hay contenedor
            >
              <FaPlus /> Asignar Cajas
            </button>
          </div>
          
          <div className="col-md-6 mb-3">
            <button
              type="button"
              className="btn btn-warning w-100"
              onClick={() => addSection('rechazo')}
              disabled={!formData.contenedor} // Solo habilitar cuando hay contenedor
            >
              <FaPlus /> Agregar Rechazo
            </button>
          </div>

          {/* Sección de cajas recibidas */}
          {sectionsProduct.length > 0 && (
            <>
              <div className="line"></div>
              <h5 className="mb-3">Cajas Recibidas</h5>
              {sectionsProduct.map(section => (
                <SeccionProducto key={section.id} section={section} type="producto" />
              ))}
            </>
          )}

          {/* Sección de rechazos */}
          {sections.length > 0 && (
            <>
              <div className="line"></div>
              <h5 className="mb-3">Cajas Rechazadas</h5>
              {sections.map(section => (
                <SeccionProducto key={section.id} section={section} type="rechazo" />
              ))}
            </>
          )}

          {(sections.length > 0 || sectionsProduct.length > 0) && <div className="line"></div>}
        </div>

        <button 
          type="submit" 
          className="btn btn-success w-100"
          disabled={!formData.contenedor || loading}
        >
          {loading ? 'Procesando...' : 'Enviar'}
        </button>
      </form>
    </>
  );
};

export default FormularioDinamico;