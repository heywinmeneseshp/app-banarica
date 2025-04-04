const API = process.env.NEXT_PUBLIC_API_URL;
const VERSION = process.env.NEXT_PUBLIC_API_VERSION;
const OWN_URL = process.env.NEXT_PUBLIC_OWN_URL;

const endPoints = {
    auth: { //Crear
        login: `${API}/api/${VERSION}/auth/login`,
        profile: `${API}/api/${VERSION}/auth/profile`,
    },
    usuarios: {
        list: `${API}/api/${VERSION}/usuarios`,
        findOne: (username) => `${API}/api/${VERSION}/usuarios/${username}`,
        pagination: (page, limit, username) => `${API}/api/${VERSION}/usuarios/paginar?page=${page}&limit=${limit}&username=${username}`,
        create: `${API}/api/${VERSION}/usuarios`,
        update: (username) => `${API}/api/${VERSION}/usuarios/${username}`,
        delete: (username) => `${API}/api/${VERSION}/usuarios/${username}`,
        almacenes: {
            list: (username) => `${API}/api/${VERSION}/usuarios/almacen/${username}`,
            findByUsername: (username) => `${API}/api/${VERSION}/usuarios/almacen/${username}`,
            findUsersByAlamcen: (almacen) => `${API}/api/${VERSION}/usuarios/almacen/cons/${almacen}`,
            create: `${API}/api/${VERSION}/usuarios/almacen`,
            update: `${API}/api/${VERSION}/usuarios/almacen/actualizar`,
            delete: (username, almacen) => `${API}/api/${VERSION}/usuarios/almacen/${username}/${almacen}`
        }
    },
    semanas: {
        list: `${API}/api/${VERSION}/semanas`,
        findOne: (id) => `${API}/api/${VERSION}/semanas/${id}`,
        filter:  `${API}/api/${VERSION}/semanas/filter`,
        findAllByCategory: (category) => `${API}/api/${VERSION}/semanas/categoria/${category}`,
        create: `${API}/api/${VERSION}/productos`,
        update: (id) => `${API}/api/${VERSION}/semanas/${id}`,
        delete: (id) => `${API}/api/${VERSION}/semanas/${id}`,
        pagination: (page, limit, consecutivo) => `${API}/api/${VERSION}/semana/paginar?page=${page}&limit=${limit}&consecutivo=${consecutivo}`,
    },
    productos: {
        list: `${API}/api/${VERSION}/productos`,
        findOne: (id) => `${API}/api/${VERSION}/productos/${id}`,
        filter: `${API}/api/${VERSION}/productos/filter`,
        findAllByCategory: (category) => `${API}/api/${VERSION}/productos/categoria/${category}`,
        create: `${API}/api/${VERSION}/productos`,
        pagination: (page, limit, name) => `${API}/api/${VERSION}/productos/paginar?page=${page}&limit=${limit}&name=${name}`,
        update: (id) => `${API}/api/${VERSION}/productos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/productos/${id}`,
    },
    combos: {
        list: `${API}/api/${VERSION}/combos`,
        findOne: (id) => `${API}/api/${VERSION}/combos/${id}`,
        listAsembled: `${API}/api/${VERSION}/combos/listar`,
        findOneAsembled: (id) => `${API}/api/${VERSION}/combos/listar/${id}`,
        pagination: (page, limit, nombre) => `${API}/api/${VERSION}/combos/paginar?page=${page}&limit=${limit}&nombre=${nombre}`,
        create: `${API}/api/${VERSION}/combos`,
        assemble: `${API}/api/${VERSION}/combos/listar`,
        update: (id) => `${API}/api/${VERSION}/combos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/combos/${id}`,
    },
    categorias: {
        list: `${API}/api/${VERSION}/categorias`,
        findOne: (id) => `${API}/api/${VERSION}/categorias/${id}`,
        pagination: (page, limit, nombre) => `${API}/api/${VERSION}/categorias/paginar?page=${page}&limit=${limit}&nombre=${nombre}`,
        create: `${API}/api/${VERSION}/categorias/`,
        update: (id) => `${API}/api/${VERSION}/categorias/${id}`,
        delete: (id) => `${API}/api/${VERSION}/categorias/${id}`,
    },
    proveedores: {
        list: `${API}/api/${VERSION}/proveedores`,
        findOne: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
        create: `${API}/api/${VERSION}/proveedores`,
        pagination: (page, limit, nombre) => `${API}/api/${VERSION}/proveedores/paginar?page=${page}&limit=${limit}&nombre=${nombre}`,
        update: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
        delete: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
    },
    almacenes: {
        list: `${API}/api/${VERSION}/almacenes`,
        findOne: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
        pagination: (page, limit, almacen) => `${API}/api/${VERSION}/almacenes/paginar?page=${page}&limit=${limit}&almacen=${almacen}`,
        create: `${API}/api/${VERSION}/almacenes`,
        update: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
        delete: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
    },
    transportadoras: {
        list: `${API}/api/${VERSION}/transportadoras`,
        findOne: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
        pagination: (page, limit, nombre) => `${API}/api/${VERSION}/transportadoras/paginar?page=${page}&limit=${limit}&nombre=${nombre}`,
        create: `${API}/api/${VERSION}/transportadoras`,
        update: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
        delete: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
    },
    conductores: { //Crear
        list: `${API}/api/${VERSION}/conductores`,
        findOne: (id) => `${API}/api/${VERSION}/conductores/${id}`,
        pagination: (page, limit, nombre) => `${API}/api/${VERSION}/conductores/paginar?page=${page}&limit=${limit}&nombre=${nombre}`,
        create: `${API}/api/${VERSION}/conductores`,
        update: (id) => `${API}/api/${VERSION}/conductores/${id}`,
        delete: (id) => `${API}/api/${VERSION}/conductores/${id}`
    },
    stock: {
        list: `${API}/api/${VERSION}/stock`,
        filter: `${API}/api/${VERSION}/stock/filter`,
        findOneAlmacen: (cons_almacen) => `${API}/api/${VERSION}/stock/filter/${cons_almacen}`,
        findOneProductInAll: (cons_producto) => `${API}/api/${VERSION}/stock/filter/product/${cons_producto}`,
        filterAlmacenAndProduct: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/filter/${cons_almacen}/${cons_producto}`,
        export: `${API}/api/${VERSION}/stock/export`,
        pagination: (page, limit) => `${API}/api/${VERSION}/stock/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/stock`,
        update: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/${cons_almacen}/${cons_producto}`,
        delete: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/${cons_almacen}/${cons_producto}`,
        add: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/sumar/${cons_almacen}/${cons_producto}`,
        subtract: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/restar/${cons_almacen}/${cons_producto}`,
        enable: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/habilitar/${cons_almacen}/${cons_producto}`,
        disponible: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/stock/disponible/${cons_almacen}/${cons_producto}`,
    },
    pedidos: {
        list: `${API}/api/${VERSION}/pedidos`,
        findOneAlmacen: (cons_almacen) => `${API}/api/${VERSION}/pedidos/filter/${cons_almacen}`,
        findOneProductInAll: (cons_producto) => `${API}/api/${VERSION}/pedidos/filter/product/${cons_producto}`,
        filterAlmacenAndProduct: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/filter/${cons_almacen}/${cons_producto}`,
        pagination: `${API}/api/${VERSION}/pedidos/paginar`,
        create: `${API}/api/${VERSION}/pedidos`,
        createTable: `${API}/api/${VERSION}/pedidos/listar`,
        findOneDocument: (consecutivo) => `${API}/api/${VERSION}/pedidos/listar/${consecutivo}`,
        updatePedido: (consecutivo) => `${API}/api/${VERSION}/pedidos/listar/${consecutivo}`,
        update: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/${cons_almacen}/${cons_producto}`,
        delete: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/${cons_almacen}/${cons_producto}`,
        add: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/sumar/${cons_almacen}/${cons_producto}`,
        subtract: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/restar/${cons_almacen}/${cons_producto}`,
        enable: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/habilitar/${cons_almacen}/${cons_producto}`,
    },
    recepcion: {
        list: `${API}/api/${VERSION}/recepcion`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/recepcion/${consecutivo}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/recepcion/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/recepcion`,
        update: (id) => `${API}/api/${VERSION}/recepcion/${id}`,
        delete: (id) => `${API}/api/${VERSION}/recepcion/${id}`
    },
    historial: {
        list: `${API}/api/${VERSION}/historial-movimientos`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/historial-movimientos/${consecutivo}`,
        filter: (consMovimiento) => `${API}/api/${VERSION}/historial-movimientos/filter?cons_movimiento=${consMovimiento}`,
        generalFilter: `${API}/api/${VERSION}/historial-movimientos/filter`,
        pagination: (page, limit) => `${API}/api/${VERSION}/historial-movimientos/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/historial-movimientos`,
        update: (id) => `${API}/api/${VERSION}/historial-movimientos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/historial-movimientos/${id}`
    },
    traslados: {
        list: `${API}/api/${VERSION}/traslados`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/traslados/${consecutivo}`,
        filter: `${API}/api/${VERSION}/traslados/filter`,
        pagination: (page, limit) => `${API}/api/${VERSION}/traslados/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/traslados`,
        update: (id) => `${API}/api/${VERSION}/traslados/modificar/${id}`,
        delete: (id) => `${API}/api/${VERSION}/traslados/${id}`
    },
    movimientos: {
        list: `${API}/api/${VERSION}/movimientos`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/movimientos/${consecutivo}`,
        document: `${API}/api/${VERSION}/movimientos/document`,
        pagination: (page, limit) => `${API}/api/${VERSION}/movimientos/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/movimientos`,
        update: (id) => `${API}/api/${VERSION}/movimientos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/movimientos/${id}`
    },
    notificaciones: {
        list: `${API}/api/${VERSION}/notificaciones`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/notificaciones/${consecutivo}`,
        filter: `${API}/api/${VERSION}/notificaciones/filter`,
        pagination: (page, limit) => `${API}/api/${VERSION}/notificaciones/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/notificaciones`,
        update: (id) => `${API}/api/${VERSION}/notificaciones/${id}`,
        delete: (id) => `${API}/api/${VERSION}/notificaciones/${id}`
    },
    avisos: {
        list: `${API}/api/${VERSION}/avisos`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/avisos/${consecutivo}`,
        create: `${API}/api/${VERSION}/avisos`,
        update: (id) => `${API}/api/${VERSION}/avisos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/avisos/${id}`
    },
    document: {
        pedido: `${API}/api/${VERSION}/documentos/pedido`,
        stock: (cons_almacen, cons_categoria) => `${OWN_URL}/Documento/Stock/${cons_almacen}?cons_categoria=${cons_categoria}`,
        movimientos: (consecutivo) => `${OWN_URL}/Documento/Movimiento/${consecutivo}`,
        traslados: (consecutivo) => `${OWN_URL}/Documento/Traslado/${consecutivo}`,
        barcodes: `${OWN_URL}/Documento/Barcodes`
    },
    seguridad: {
        listarProductos: `${API}/api/${VERSION}/seguridad/listar-articulos`,
        listarSeriales: `${API}/api/${VERSION}/seguridad/seriales`,
        listarUsuarios: `${API}/api/${VERSION}/seguridad/usuarios`,
        ActualizarSeriales: `${API}/api/${VERSION}/seguridad/actualizar-seriales`,
        ActualizarSerial: `${API}/api/${VERSION}/seguridad/actualizar-serial`,
        CargarSeriales: `${API}/api/${VERSION}/seguridad/cargar-seriales`,
        encontrarSerial: `${API}/api/${VERSION}/seguridad/encontrar-serial`,
        inspeccionAntinarcoticos: `${API}/api/${VERSION}/seguridad/inspeccion-antinarcoticos`,
        usarSeriales: `${API}/api/${VERSION}/seguridad/usar-seriales`
    },
    etiquetas: {
        crearEtiqueta: `${API}/api/${VERSION}/etiquetas`,
        encontrarEtiqueta: (consecutivo) => `${API}/api/${VERSION}/etiquetas/${consecutivo}`,
        listarEtiquetas: `${API}/api/${VERSION}/etiquetas`,
        actualizarEtiqueta: (consecutivo) => `${API}/api/${VERSION}/etiquetas/${consecutivo}`,
    },
    confi: {
        buscarModulo: (modulo) => `${API}/api/${VERSION}/confi/encontrar/${modulo}`,
        actualizarModulo: `${API}/api/${VERSION}/confi/actualizar`,
        encontrarEmpresa:  `${API}/api/${VERSION}/empresa/1`,
        actualizarEmpresa:  `${API}/api/${VERSION}/empresa/1`,
    },
    //TRANSPOTER
    ubicaciones: {
        list: `${API}/api/${VERSION}/ubicaciones`,
        findOne: (id) => `${API}/api/${VERSION}/ubicaciones/${id}`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/ubicaciones/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/ubicaciones`,
        update: (id) => `${API}/api/${VERSION}/ubicaciones/${id}`,
        delete: (id) => `${API}/api/${VERSION}/ubicaciones/${id}`,
    },
    clientes: {
        list: `${API}/api/${VERSION}/clientes`,
        findOne: (id) => `${API}/api/${VERSION}/clientes/${id}`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/clientes/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/clientes`,
        update: (id) => `${API}/api/${VERSION}/clientes/${id}`,
        delete: (id) => `${API}/api/${VERSION}/clientes/${id}`,
    },
    galonesPorRuta: {
        list: `${API}/api/${VERSION}/galonesPorRuta`,
        findOne: (id) => `${API}/api/${VERSION}/galonesPorRuta/${id}`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/cliengalonesPorRutates/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/galonesPorRuta`,
        update: (id) => `${API}/api/${VERSION}/galonesPorRuta/${id}`,
        delete: (id) => `${API}/api/${VERSION}/galonesPorRuta/${id}`,
        consultar:  `${API}/api/${VERSION}/galonesPorRuta/consultar`,
    },
    record_consumo: {
        list: `${API}/api/${VERSION}/record_consumo`,
        findOne: `${API}/api/${VERSION}/record_consumo/encontrar-uno`,
        pagination: (page, limit) => `${API}/api/${VERSION}/record_consumo/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/record_consumo`,
        update: (id) => `${API}/api/${VERSION}/record_consumo/${id}`,
        delete: (id) => `${API}/api/${VERSION}/record_consumo/${id}`,
        consultarConsumo: `${API}/api/${VERSION}/record_consumo/sin-liquidar`,
        liquidar: `${API}/api/${VERSION}/record_consumo/liquidar`,
    },
    programaciones: {
        list: `${API}/api/${VERSION}/programaciones`,
        findOne: (id) => `${API}/api/${VERSION}/programaciones/${id}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/programaciones/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/programaciones`,
        update: (id) => `${API}/api/${VERSION}/programaciones/${id}`,
        delete: (id) => `${API}/api/${VERSION}/programaciones/${id}`,
    },
    rutas: {
        list: `${API}/api/${VERSION}/rutas`,
        findOne: (id) => `${API}/api/${VERSION}/rutas/${id}`,
        findWhere: `${API}/api/${VERSION}/rutas/buscar`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/rutas/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/rutas`,
        update: (id) => `${API}/api/${VERSION}/rutas/${id}`,
        delete: (id) => `${API}/api/${VERSION}/rutas/${id}`,
    },
    vehiculos: {
        list: `${API}/api/${VERSION}/vehiculos`,
        findOne: (id) => `${API}/api/${VERSION}/vehiculos/${id}`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/vehiculos/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/vehiculos`,
        update: (id) => `${API}/api/${VERSION}/vehiculos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/vehiculos/${id}`,
    },
    ProductosViaje: {
        list: `${API}/api/${VERSION}/productos-viaje`,
        findOne: (id) => `${API}/api/${VERSION}/productos-viaje/${id}`,
        findWhere: `${API}/api/${VERSION}/productos-viaje/buscar`,
        pagination: (page, limit) => `${API}/api/${VERSION}/productos-viaje/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/productos-viaje`,
        update: (id) => `${API}/api/${VERSION}/productos-viaje/${id}`,
        delete: (id) => `${API}/api/${VERSION}/productos-viaje/${id}`,
    },
    categoriaVehiculos: {
        list: `${API}/api/${VERSION}/categoriaVehiculos`,
        findOne: (id) => `${API}/api/${VERSION}/categoriaVehiculos/${id}`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/categoriaVehiculos/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/categoriaVehiculos`,
        update: (id) => `${API}/api/${VERSION}/categoriaVehiculos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/categoriaVehiculos/${id}`,
    },
    tanqueo: {
        list: `${API}/api/${VERSION}/tanqueo`,
        findOne: (id) => `${API}/api/${VERSION}/tanqueo/${id}`,
        findAll: `${API}/api/${VERSION}/tanqueo/encontrar`,
        pagination: (page, limit, item) => `${API}/api/${VERSION}/tanqueo/paginar?page=${page}&limit=${limit}&item=${item}`,
        create: `${API}/api/${VERSION}/tanqueo`,
        update: (id) => `${API}/api/${VERSION}/tanqueo/${id}`,
        delete: (id) => `${API}/api/${VERSION}/tanqueo/${id}`,
    },
    reporteConsumo: {
        semana: (sem, anho) => `${OWN_URL}/Documento/ReporteConsumo?anho=${anho}&sem=${sem}`,
        mes: (mes, anho) => `${OWN_URL}/Documento/ReporteConsumo?mes=${mes}&anho=${anho}`,
        consumoVehiculo: (query) => `${OWN_URL}/Documento/HistorialConsumo?${query}`,
    },
    email: {
        send: `${API}/api/${VERSION}/email/send`,
    },
    //LOGISTICA
    contenedores: {
        create: `${API}/api/${VERSION}/contenedor`,
        findOne: (id) => `${API}/api/${VERSION}/contenedor/${id}`,
        update: (id) => `${API}/api/${VERSION}/contenedor/${id}`,
        delete: (id) => `${API}/api/${VERSION}/contenedor/${id}`,
    },
    //http://localhost:3000/api/v1/listados/paginar?offset=1&limit=4
    listado: {
        create: `${API}/api/${VERSION}/listado`,
        duplicar: (id) => `${API}/api/${VERSION}/listado/duplicar/${id}`,
        findOne: (id) => `${API}/api/${VERSION}/listado/${id}`,
        paginar: (offset, limit) => `${API}/api/${VERSION}/listado/paginar?offset=${offset}&limit=${limit}`,
        update: (id) => `${API}/api/${VERSION}/listado/${id}`,
        delete: (id) => `${API}/api/${VERSION}/listado/${id}`,
    },
    Navieras: {
        list: `${API}/api/${VERSION}/naviera`,
        create: `${API}/api/${VERSION}/naviera`,
        findOne: (id) => `${API}/api/${VERSION}/naviera/${id}`,
        paginar: (offset, limit) => `${API}/api/${VERSION}/naviera/paginar?offset=${offset}&limit=${limit}`,
        update: (id) => `${API}/api/${VERSION}/naviera/${id}`,
        delete: (id) => `${API}/api/${VERSION}/naviera/${id}`,
        cargueMasivo: `${API}/api/${VERSION}/naviera/masivo`,
    },
    Buques: {
        list: `${API}/api/${VERSION}/buque`,
        create: `${API}/api/${VERSION}/buque`,
        findOne: (id) => `${API}/api/${VERSION}/buque/${id}`,
        paginar: (offset, limit, buque) => `${API}/api/${VERSION}/buque/paginar?offset=${offset}&limit=${limit}&buque=${buque}`,
        update: (id) => `${API}/api/${VERSION}/buque/${id}`,
        delete: (id) => `${API}/api/${VERSION}/buque/${id}`,
    },
    Embarques: {
        list: `${API}/api/${VERSION}/embarque`,
        create: `${API}/api/${VERSION}/embarque`,
        findOne: (id) => `${API}/api/${VERSION}/embarque/${id}`,
        paginar: (offset, limit) => `${API}/api/${VERSION}/embarque/paginar?offset=${offset}&limit=${limit}`,
        update: (id) => `${API}/api/${VERSION}/embarque/${id}`,
        delete: (id) => `${API}/api/${VERSION}/embarque/${id}`,
    },
    Destinos: {
        list: `${API}/api/${VERSION}/destino`,
        create: `${API}/api/${VERSION}/destino`,
        findOne: (id) => `${API}/api/${VERSION}/destino/${id}`,
        paginar: (offset, limit, nombre) => `${API}/api/${VERSION}/destino/paginar?offset=${offset}&limit=${limit}&destino=${nombre}`,
        update: (id) => `${API}/api/${VERSION}/destino/${id}`,
        delete: (id) => `${API}/api/${VERSION}/destino/${id}`,
    },
    Transbordo: {
        list: `${API}/api/${VERSION}/transbordo`,
        create: `${API}/api/${VERSION}/transbordo`,
        findOne: (id) => `${API}/api/${VERSION}/transbordo/${id}`,
        paginar: (offset, limit, nombre) => `${API}/api/${VERSION}/transbordo/paginar?offset=${offset}&limit=${limit}&destino=${nombre}`,
        update: (id) => `${API}/api/${VERSION}/transbordo/${id}`,
        delete: (id) => `${API}/api/${VERSION}/transbordo/${id}`,
    }, 
    rechazos: {
        list: `${API}/api/${VERSION}/rechazo`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/rechazo/${consecutivo}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/rechazo/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/rechazo`,
        update: (id) => `${API}/api/${VERSION}/rechazo/${id}`,
        delete: (id) => `${API}/api/${VERSION}/rechazo/${id}`
    },
    motivoDeUso: {
        list: `${API}/api/${VERSION}/motivoDeUso`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/motivoDeUso/${consecutivo}`,
        pagination: (page, limit, MotivoDeUso) => `${API}/api/${VERSION}/motivoDeUso/paginar?page=${page}&limit=${limit}&MotivoDeUso=${MotivoDeUso}`,
        create: `${API}/api/${VERSION}/motivoDeUso`,
        update: (id) => `${API}/api/${VERSION}/motivoDeUso/${id}`,
        delete: (id) => `${API}/api/${VERSION}/motivoDeUso/${id}`
    },
    motivoDeRechazo: {
        list: `${API}/api/${VERSION}/motivoDeRechazo`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/motivoDeRechazo/${consecutivo}`,
        pagination: (page, limit, motivoDeRechazo) => `${API}/api/${VERSION}/motivoDeRechazo/paginar?page=${page}&limit=${limit}&motivo_rechazo=${motivoDeRechazo}`,
        create: `${API}/api/${VERSION}/motivoDeRechazo`,
        update: (id) => `${API}/api/${VERSION}/motivoDeRechazo/${id}`,
        delete: (id) => `${API}/api/${VERSION}/motivoDeRechazo/${id}`
    },




};

export default endPoints;