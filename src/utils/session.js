import Cookie from 'js-cookie';

const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';
const WAREHOUSES_KEY = 'almacenByUser';
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
};

const clearSession = () => {
    Cookie.remove(TOKEN_KEY);
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

const sortWarehousesByName = (warehouses = []) => (
    [...warehouses].sort((a, b) => a.nombre.localeCompare(b.nombre))
);

export {
    TOKEN_EXPIRATION_DAYS,
    clearSession,
    clearSessionStorage,
    getStoredUser,
    getStoredWarehouses,
    getToken,
    persistToken,
    setStoredUser,
    setStoredWarehouses,
    sortWarehousesByName,
};
