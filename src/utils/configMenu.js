const menuCompleto = {
    maestros: [
        ["bodegas", "Almacenes"],
        ["categorias", "Categoria productos"],
        ["categoriaVehiculos", "Categoria vehiculos"],
        ["clientes", "Clientes"],
        ["combos", "Combos"],
        ["etiquetas", "Etiquetas"],
        ["MotivoDeRechazo", "Motivos de Rechazo"],
        ["tipoMovimientoVehiculos", "Movimientos vehiculos"],
        ["productos", "Productos"],
        ["proveedores", "Proveedores"],
        ["rutas", "Rutas"],
        ["transporte", "Transporte"],
        ["ubicaciones", "Ubicaciones"],
        ["usuarios", "Usuarios"],
        ["vehiculos", "Vehiculos"]
    ],
    seguridad: [
        ["/Listado", "Contenedores"],
        ["/Dashboard", "Dashboard"],
        ["/Disponibles", "Disponibles"],
        ["/Embarques", "Embarques"],
        ["/InspLleno", "Insp Lleno"],
        ["/Lector", "Insp Vacio"],
        ["/ValidarSellosProgramador", "Validar Sellos Programador"],
        ["/LlenadoContenedor", "Llenado"],
        ["/Transbordar", "Transbordar"],
        ["/Recepcion", "Recepcion"],
        ["/Rechazos", "Rechazos"],
        ["/Transferencias", "Transferencias"],
        ["/Inspeccionados", "Inspeccionados"],
        ["/Devueltos", "Devueltos"],
        ["/Transbordados", "Transbordados"],
        ["/CartasAntinarcoticos", "Cartas antinarcoticos"]
    ],
    transporte: [
        ["/Programador", "Programador"],
        ["/SellosProgramador", "Sellos Programador"],
        ["/CargarCombustible", "Cargar Combustible"],
        ["/ConsumoRutas", "Consumo Ruta Vehiculo"],
        ["/ConsumoKm", "Consumo Km"],
        ["/Reportes", "Reportes"],

    ],
    almacen: [
        ["movimientos", "Movimientos"],
        ["pedidos", "Pedidos"],
        ["recepcion", "Recepcion"],
        ["traslados", "Traslados"],
        ["baja-seriales", "Baja Seriales"]
    ],
    informes: [
        ["movimientos", "Movimientos"],
        ["pedidos", "Pedidos"],
        ["stock", "Stock"],
        ["traslados", "Traslados"],
        ["temperatura", "Termógrafos"]
    ],
};

const pantallasInicio = [
    { label: 'Inicio (por defecto)', path: '/' },
    { label: 'Contenedores', path: '/Seguridad/Listado' },
    { label: 'Dashboard', path: '/Seguridad/Dashboard' },
    { label: 'Disponibles', path: '/Seguridad/Disponibles' },
    { label: 'Embarques', path: '/Seguridad/Embarques' },
    { label: 'Insp. Lleno', path: '/Seguridad/InspLleno' },
    { label: 'Insp. Vacío', path: '/Seguridad/Lector' },
    { label: 'Llenado', path: '/Seguridad/LlenadoContenedor' },
    { label: 'Transbordar', path: '/Seguridad/Transbordar' },
    { label: 'Recepcion (seg.)', path: '/Seguridad/Recepcion' },
    { label: 'Rechazos', path: '/Seguridad/Rechazos' },
    { label: 'Transferencias', path: '/Seguridad/Transferencias' },
    { label: 'Inspeccionados', path: '/Seguridad/Inspeccionados' },
    { label: 'Programador', path: '/Transporte/Programador' },
    { label: 'Sellos Programador', path: '/Transporte/SellosProgramador' },
    { label: 'Cargar Combustible', path: '/Transporte/CargarCombustible' },
    { label: 'Consumo Rutas', path: '/Transporte/ConsumoRutas' },
    { label: 'Reportes Transporte', path: '/Transporte/Reportes' },
];

const botones = [
    "dashboard_descargar_carrusel",
    "dashboard_descargar_relacion",
    "dashboard_agregar",
    "dashboard_devolver",
    "disponibles_serial",
    "disponibles_detallado",
    "disponibles_corregir_serial",
    "inspeccionados_corregir_contenedor",
    "inspeccion_vacio_cargue_masivo",
    "contenedores_edicion",
    "dashboard_configuracion",
    "dashboard_seriales",
    "programador_creacion_rapida",
    "programador_edicion",
    "programador_actualizar_pendientes",
    "programador_sellos_configuracion",
];

const menuPrincipal = () => {
    return Object.keys(menuCompleto);
};

export { menuPrincipal, menuCompleto, botones, pantallasInicio };
