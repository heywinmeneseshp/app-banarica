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
    bodega: false,
    categoria: false,
    combo: false,
    producto: false,
    proveedor: false,
    transporte: false,
    usuario: false,
    conductor: false,
    contenedor: false
}


const useAdminMenu = () => {
    const [adminMenu, setAdminMenu] = useState(initialAdminMenu);
    const [tableros, setTableros] = useState(initialTableros);

    const hadleTableros = (name) => {
        setTableros({
            ...tableros,
            contenedor: !tableros.contenedor,
            [name]: !tableros[name]
        })

        let claves = Object.keys(tableros);
        claves.pop();
        for (let i = 0; claves.length; i++) {
            let clave = claves[1];
            if (clave != name) {
                console.log(clave)
            }
        }
    }
    const handleUsuarios = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: true,
            productos: false,
            combos: false,
            categorias: false,
            proveedores: false,
            bodegas: false,
            transporte: false,
            inicio: false
        })
    }

    const handleProductos = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: true,
            combos: false,
            categorias: false,
            proveedores: false,
            bodegas: false,
            transporte: false,
            inicio: false
        })
    }

    const handleCombos = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: false,
            combos: true,
            categorias: false,
            proveedores: false,
            bodegas: false,
            transporte: false,
            inicio: false
        })
    }

    const handleCategorias = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: false,
            combos: false,
            categorias: true,
            proveedores: false,
            bodegas: false,
            transporte: false,
            inicio: false
        })
    }

    const handleProveedores = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: false,
            combos: false,
            categorias: false,
            proveedores: true,
            bodegas: false,
            transporte: false,
            inicio: false
        })
    }

    const handleBodegas = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: false,
            combos: false,
            categorias: false,
            proveedores: false,
            bodegas: true,
            transporte: false,
            inicio: false
        })
    }

    const handleTransporte = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: false,
            combos: false,
            categorias: false,
            proveedores: false,
            bodegas: false,
            transporte: true,
            inicio: false
        })
    }

    const handleInicio = () => {
        setAdminMenu({
            ...adminMenu,
            usuarios: false,
            productos: false,
            combos: false,
            categorias: false,
            proveedores: false,
            bodegas: false,
            transporte: false,
            inicio: true
        })
    }

    return {
        adminMenu,
        handleUsuarios,
        handleProductos,
        handleCombos,
        handleCategorias,
        handleProveedores,
        handleBodegas,
        handleTransporte,
        handleInicio,
        tableros,
        hadleTableros
    };
};

export default useAdminMenu;