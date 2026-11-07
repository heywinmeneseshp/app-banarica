import Cookie from 'js-cookie';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';
const WAREHOUSES_KEY = 'almacenByUser';
const TRANSPORTERS_KEY = 'transportadorasByUser';
const SESSION_NOTICE_KEY = 'sessionNotice';
const VIEW_AS_KEY = 'viewAs';
const LAST_ACTIVITY_KEY = 'lastActivityAt';
const TOKEN_EXPIRATION_DAYS = 1 / 48;

const parseJSON = (value, fallback = null) => {
    if (!value) {
        return fallback;
    }

    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const isBrowser = typeof window !== 'undefined';

const getToken = () => Cookie.get(TOKEN_KEY);

const persistToken = (token, expires = TOKEN_EXPIRATION_DAYS) => {
    Cookie.set(TOKEN_KEY, token, { expires });
};

const clearSessionStorage = () => {
    if (!isBrowser) {
        return;
    }

    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(WAREHOUSES_KEY);
    localStorage.removeItem(TRANSPORTERS_KEY);
    localStorage.removeItem(VIEW_AS_KEY);
};

const getSessionNotice = () => (
    isBrowser ? sessionStorage.getItem(SESSION_NOTICE_KEY) || '' : ''
);

const setSessionNotice = (message) => {
    if (!isBrowser) {
        return;
    }

    if (!message) {
        sessionStorage.removeItem(SESSION_NOTICE_KEY);
        return;
    }

    sessionStorage.setItem(SESSION_NOTICE_KEY, message);
};

const clearSessionNotice = () => {
    if (!isBrowser) {
        return;
    }

    sessionStorage.removeItem(SESSION_NOTICE_KEY);
};

const getLastActivityAt = () => {
    if (!isBrowser) {
        return null;
    }

    const rawValue = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const setLastActivityAt = (timestamp) => {
    if (!isBrowser) {
        return;
    }

    if (!timestamp) {
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
        return;
    }

    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
};

const clearLastActivityAt = () => {
    if (!isBrowser) {
        return;
    }

    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
};

const clearSession = () => {
    Cookie.remove(TOKEN_KEY);
    clearLastActivityAt();
    clearSessionStorage();
};

const getStoredUser = () => (
    isBrowser ? parseJSON(localStorage.getItem(USER_KEY)) : null
);

const setStoredUser = (user) => {
    if (!isBrowser) {
        return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const getStoredWarehouses = () => (
    isBrowser ? parseJSON(localStorage.getItem(WAREHOUSES_KEY), []) : []
);

const setStoredWarehouses = (warehouses) => {
    if (!isBrowser) {
        return;
    }

    localStorage.setItem(WAREHOUSES_KEY, JSON.stringify(warehouses));
};

const getStoredTransporters = () => (
    isBrowser ? parseJSON(localStorage.getItem(TRANSPORTERS_KEY), []) : []
);

const setStoredTransporters = (transporters) => {
    if (!isBrowser) {
        return;
    }

    localStorage.setItem(TRANSPORTERS_KEY, JSON.stringify(transporters));
};

// "Ver como": el super administrador ve la aplicacion con el usuario, los almacenes y las
// transportadoras de otro usuario (solo la vista; el token sigue siendo el suyo). Se guardan los
// datos originales para restaurarlos al salir de esta vista.
const getViewAs = () => (isBrowser ? parseJSON(localStorage.getItem(VIEW_AS_KEY)) : null);

const startViewAs = ({ usuario, almacenes = [], transportadoras = [] }) => {
    if (!isBrowser) {
        return;
    }

    const actual = getViewAs();
    const original = actual?.original || {
        usuario: getStoredUser(),
        almacenes: getStoredWarehouses(),
        transportadoras: getStoredTransporters(),
    };

    localStorage.setItem(VIEW_AS_KEY, JSON.stringify({
        original,
        username: usuario.username,
        nombre: [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.username,
        rol: usuario.id_rol,
    }));
    setStoredUser(usuario);
    setStoredWarehouses(sortWarehousesByName(almacenes));
    setStoredTransporters(sortTransportersByName(transportadoras));
};

const stopViewAs = () => {
    if (!isBrowser) {
        return;
    }

    const actual = getViewAs();
    if (actual?.original?.usuario) {
        setStoredUser(actual.original.usuario);
        setStoredWarehouses(actual.original.almacenes || []);
        setStoredTransporters(actual.original.transportadoras || []);
    }
    localStorage.removeItem(VIEW_AS_KEY);
};

const sortWarehousesByName = (warehouses = []) => (
    [...warehouses].sort((a, b) => a.nombre.localeCompare(b.nombre))
);

const sortTransportersByName = (transporters = []) => (
    [...transporters].sort((a, b) => String(a.razon_social || '').localeCompare(String(b.razon_social || '')))
);

export {
    TOKEN_EXPIRATION_DAYS,
    clearLastActivityAt,
    clearSessionNotice,
    clearSession,
    clearSessionStorage,
    getLastActivityAt,
    getSessionNotice,
    getStoredUser,
    getViewAs,
    startViewAs,
    stopViewAs,
    getStoredWarehouses,
    getStoredTransporters,
    getToken,
    persistToken,
    setLastActivityAt,
    setSessionNotice,
    setStoredUser,
    setStoredWarehouses,
    setStoredTransporters,
    sortWarehousesByName,
    sortTransportersByName,
};
