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
        ["traslados", "Traslados"]
    ],
    informes: [
        ["movimientos", "Movimientos"],
        ["pedidos", "Pedidos"],
        ["stock", "Stock"],
        ["traslados", "Traslados"]
    ],
};

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

export { menuPrincipal, menuCompleto, botones };
