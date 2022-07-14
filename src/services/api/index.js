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
        create: `${API}/api/${VERSION}/usuarios`,
        update: (username) => `${API}/api/${VERSION}/usuarios${username}`,
        delete: (username) =>`${API}/api/${VERSION}/usuarios${username}`,
        almacenes: {
            list: (username) => `${API}/api/${VERSION}/usuarios/almacen/${username}`,
            findByUsername: (username) => `${API}/api/${VERSION}/usuarios/almacen/${username}`,
            findAlmacenByUsername: (username, almacen) => `${API}/api/${VERSION}/usuarios/almacen/${username}/${almacen}`,
            create: `${API}/api/${VERSION}/usuarios/almacen/`,
            update: (username, almacen) => `${API}/api/${VERSION}/usuarios/almacen/${username}/${almacen}`,
            delete: (username, almacen) => `${API}/api/${VERSION}/usuarios/almacen/${username}/${almacen}`
        }
    },
    productos: { 
        list: `${API}/api/${VERSION}/productos`,
        findOne: (id) => `${API}/api/${VERSION}/productos/${id}`,
        create: `${API}/api/${VERSION}/productos`,
        update: (id) => `${API}/api/${VERSION}/productos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/productos/${id}`,
    },
    combos: { 
        list: `${API}/api/${VERSION}/combos`,
        findOne: (id) => `${API}/api/${VERSION}/combos/${id}`,
        listAsembled: `${API}/api/${VERSION}/combos/listar`,
        findOneAsembled: (id) => `${API}/api/${VERSION}/combos/listar/${id}`,
        create: `${API}/api/${VERSION}/combos`,
        assemble: `${API}/api/${VERSION}/combos/listar`,
        update: (id) => `${API}/api/${VERSION}/combos/${id}`,
        delete: (id) => `${API}/api/${VERSION}/combos/${id}`,
    },
    categorias: {
        list: `${API}/api/${VERSION}/categorias`,
        findOne: (id) => `${API}/api/${VERSION}/categorias/${id}`,
        create: `${API}/api/${VERSION}/categorias/`,
        update: (id) => `${API}/api/${VERSION}/categorias/${id}`,
        delete: (id) => `${API}/api/${VERSION}/categorias/${id}`,
    },
    proveedores: { 
        list: `${API}/api/${VERSION}/proveedores`,
        findOne: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
        create: `${API}/api/${VERSION}/proveedores`,
        update: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
        delete: (id) => `${API}/api/${VERSION}/proveedores/${id}`,
    },
    almacenes: { 
        list: `${API}/api/${VERSION}/almacenes`,
        findOne: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
        create: `${API}/api/${VERSION}/almacenes`,
        update: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
        delete: (id) => `${API}/api/${VERSION}/almacenes/${id}`,
    },
    transportadoras: {
        list: `${API}/api/${VERSION}/transportadoras`,
        findOne: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
        create: `${API}/api/${VERSION}/transportadoras`,
        update: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
        delete: (id) => `${API}/api/${VERSION}/transportadoras/${id}`,
    },
    conductores: { //Crear
        list: `${API}/api/${VERSION}/conductores`,
        findOne: (id) => `${API}/api/${VERSION}/conductores/${id}`,
        create: `${API}/api/${VERSION}/conductores`,
        update: (id) => `${API}/api/${VERSION}/conductores/${id}`,
        delete: (id) => `${API}/api/${VERSION}/conductores/${id}`
    }
}

export default endPoints;