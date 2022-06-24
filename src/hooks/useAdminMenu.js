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



const useAdminMenu = () => {
    const [adminMenu, setAdminMenu] = useState(initialAdminMenu);

    function handleUsuarios() {
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
        });
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
            handleInicio
        };
    };
};

export default useAdminMenu;