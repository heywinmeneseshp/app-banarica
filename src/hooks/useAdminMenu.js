import { useState } from "react";


const initialAdminMenu = {
    usuarios: false,
    productos: false,
    combos: false,
    categorias: false,
    proveedores: false,
    bodegas: false,
    transporte: false,
    inicio: true
}

const initialTableros = {
    bodega: null,
    categoria: null,
    combo: null,
    producto: null,
    proveedor: null,
    transporte: null,
    usuario: null,
    conductor: null,
    contenedor: null
}


const useAdminMenu = () => {
    const [adminMenu, setAdminMenu] = useState(initialAdminMenu);
    const [tableros, setTableros] = useState(initialTableros);

    const hadleOpenTable = (name) => {
        setTableros({
            contenedor: true,
            [name]: true
        })
    };

    const hadleCloseTable = () => {
        setTableros({
            ...tableros,
            bodega: false,
            categoria: false,
            combo: false,
            producto: false,
            proveedor: false,
            transporte: false,
            usuario: false,
            conductor: false,
            contenedor: false
        });
    }

    const hadleOpenWindows = (name) => {
        setAdminMenu({
            [name]: true
        })
    };

    const hadleCloseWindows = () => {
        setAdminMenu({
            usuarios: false,
            productos: false,
            combos: false,
            categorias: false,
            proveedores: false,
            bodegas: false,
            transporte: false,
            inicio: false
        });
    }

    return {
        adminMenu,
        hadleOpenWindows,
        hadleCloseWindows,
        tableros,
        hadleOpenTable,
        hadleCloseTable
    };
};

export default useAdminMenu;