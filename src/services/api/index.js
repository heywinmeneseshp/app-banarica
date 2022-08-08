const API = process.env.NEXT_PUBLIC_API_URL;
const VERSION = process.env.NEXT_PUBLIC_API_VERSION;

const endPoints = { 
    auth: { //Crear
        login: `${API}/api/${VERSION}/auth/login`,
        profile: `${API}/api/${VERSION}/auth/profile`,
    },
    usuarios: { 
        list: `${API}/api/${VERSION}/usuarios`,
        findOne: (username) => `${API}/api/${VERSION}/usuarios/${username}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/usuarios/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/usuarios`,
        update: (username) => `${API}/api/${VERSION}/usuarios/${username}`,
        delete: (username) =>`${API}/api/${VERSION}/usuarios/${username}`,
        almacenes: {
            list: (username) => `${API}/api/${VERSION}/usuarios/almacen/${username}`,
            findByUsername: (username) => `${API}/api/${VERSION}/usuarios/almacen/${username}`,
            findAlmacenByUsername: (username, almacen) => `${API}/api/${VERSION}/usuarios/almacen/${username}/${almacen}`,
            create: `${API}/api/${VERSION}/usuarios/almacen`,
            update: `${API}/api/${VERSION}/usuarios/almacen/actualizar`,
            delete: (username, almacen) => `${API}/api/${VERSION}/usuarios/almacen/${username}/${almacen}`
        }
    },
    productos: { 
        list: `${API}/api/${VERSION}/productos`,
        findOne: (id) => `${API}/api/${VERSION}/productos/${id}`,
        findAllByCategory: (category) => `${API}/api/${VERSION}/productos/categoria/${category}`,
        create: `${API}/api/${VERSION}/productos`,
        pagination: (page, limit) => `${API}/api/${VERSION}/productos/paginar?page=${page}&limit=${limit}`,
        update: (id) => `${API}/api/${VERSION}/productos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/productos/${id}`,
    },
    combos: { 
        list: `${API}/api/${VERSION}/combos`,
        findOne: (id) => `${API}/api/${VERSION}/combos/${id}`,
        listAsembled: `${API}/api/${VERSION}/combos/listar`,
        findOneAsembled: (id) => `${API}/api/${VERSION}/combos/listar/${id}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/combos/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/combos`,
        assemble: `${API}/api/${VERSION}/combos/listar`,
        update: (id) => `${API}/api/${VERSION}/combos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/combos/${id}`,
    },
    categorias: {
        list: `${API}/api/${VERSION}/categorias`,
        findOne: (id) => `${API}/api/${VERSION}/categorias/${id}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/categorias/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/categorias/`,
        update: (id) => `${API}/api/${VERSION}/categorias/${id}`,
        delete: (id) => `${API}/api/${VERSION}/categorias/${id}`,
    },
    proveedores: { 
        list: `${API}/api/${VERSION}/proveedores`,
        findOne: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
        create: `${API}/api/${VERSION}/proveedores`,
        pagination: (page, limit) => `${API}/api/${VERSION}/proveedores/paginar?page=${page}&limit=${limit}`,
        update: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
        delete: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
    },
    almacenes: { 
        list: `${API}/api/${VERSION}/almacenes`,
        findOne: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/almacenes/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/almacenes`,
        update: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
        delete: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
    },
    transportadoras: {
        list: `${API}/api/${VERSION}/transportadoras`,
        findOne: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/transportadoras/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/transportadoras`,
        update: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
        delete: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
    },
    conductores: { //Crear
        list: `${API}/api/${VERSION}/conductores`,
        findOne: (id) => `${API}/api/${VERSION}/conductores/${id}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/conductores/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/conductores`,
        update: (id) => `${API}/api/${VERSION}/conductores/${id}`,
        delete: (id) => `${API}/api/${VERSION}/conductores/${id}`
    },
    stock: {
        list: `${API}/api/${VERSION}/stock`,
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
    },
    pedidos: {
        list: `${API}/api/${VERSION}/pedidos`,
        findOneAlmacen: (cons_almacen) => `${API}/api/${VERSION}/pedidos/filter/${cons_almacen}`,
        findOneProductInAll: (cons_producto) => `${API}/api/${VERSION}/pedidos/filter/product/${cons_producto}`,
        filterAlmacenAndProduct: (cons_almacen, cons_producto) => `${API}/api/${VERSION}/pedidos/filter/${cons_almacen}/${cons_producto}`,
        pagination: (page, limit) => `${API}/api/${VERSION}/pedidos/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/pedidos`,
        createTable: `${API}/api/${VERSION}/pedidos/listar`,
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
        pagination: (page, limit) => `${API}/api/${VERSION}/historial-movimientos/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/historial-movimientos`,
        update: (id) => `${API}/api/${VERSION}/historial-movimientos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/historial-movimientos/${id}`
    },
    traslados: {
        list: `${API}/api/${VERSION}/traslados`, //Listo
        findOne: (consecutivo) => `${API}/api/${VERSION}/traslados/${consecutivo}`,
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
        filter: (url) => `${API}/api/${VERSION}/notificaciones/filter?${url}`,
        filterPost: `${API}/api/${VERSION}/notificaciones/filter`,
        pagination: (page, limit) => `${API}/api/${VERSION}/notificaciones/paginar?page=${page}&limit=${limit}`,
        create: `${API}/api/${VERSION}/notificaciones`,
        update: (id) => `${API}/api/${VERSION}/notificaciones/${id}`,
        delete: (id) => `${API}/api/${VERSION}/notificaciones/${id}`
    }
}

export default endPoints;