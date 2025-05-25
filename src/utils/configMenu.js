
const menuCompleto = {
    'maestros': [
        ["bodegas", "Almacenes"],
        ["categorias", "Categoria productos"],
        ["categoriaVehiculos", "Categoria vehiculos"],
        ["clientes", "Clientes"],
        ["combos", "Combos"],
        ["etiquetas", "Etiquetas"],
        ["MotivoDeRechazo", "Motivos de Rechazo"],
        ["productos", "Productos"],
        ["proveedores", "Proveedores"],
        ["rutas", "Rutas"],
        ["transporte", "Transporte"],
        ["ubicaciones", "Ubicaciones"],
        ["usuarios", "Usuarios"],
        ["vehiculos", "Vehiculos"]
    ],
    'seguridad': [
        ["/Listado", "Contenedores"],
        ["/Dashboard", "Dashboard"],
        ["/Disponibles", "Disponibles"],
        ["/Embarques", "Embarques"],
        ["/InspLleno", "Insp Lleno"],
        ["/Lector", "Insp Vacio"],
        ["/LlenadoContenedor", "Llenado"],
        ["/Recepcion", "Recepción"],
        ["/Rechazos", "Rechazos"],
        ["/Transferencias", "Transferencias"]
    ],
    'programaciones': [
        ["contenedores", "Contenedores"],
        ["historico", "Historico"],
        ["programador", "Programador"],
        ["reportesConsumo", "Reportes"]
    ],
    'almacen': [],
    'informes': [],
};

const botones = [
    'dashboard_descargar_carrusel',
    'dashboard_descargar_relacion',
    'dashboard_agregar',
    'disponibles_serial',
    'disponibles_detallado',
    'contenedores_edicion',
    'dashboard_configuracion',
    'dashboard_seriales',
];

const menuPrincipal = () => {
    return Object.keys(menuCompleto);
};


export { menuPrincipal, menuCompleto, botones };
