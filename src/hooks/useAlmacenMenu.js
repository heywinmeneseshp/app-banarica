import { useState } from "react";


const initialAlmacenMenu = {
    recepcion: false,
    pedidos: false,
    traslados: false,
    movimientos: true
}

const useAdminMenu = () => {
    const [almacenMenu, setAlmacenMenu] = useState(initialAlmacenMenu);
 

    const handleRecepcion = () => {
        setAlmacenMenu({
            ...almacenMenu,
            recepcion: true,
            pedidos: false,
            traslados: false,
            movimientos: false
        })
    }

    const handlePedidos = () => {
        setAlmacenMenu({
            ...almacenMenu,
            recepcion: false,
            pedidos: true,
            traslados: false,
            movimientos: false
        })
    }

    const handleTraslados = () => {
        setAlmacenMenu({
            ...almacenMenu,
            recepcion: false,
            pedidos: false,
            traslados: true,
            movimientos: false
        })
    }

    const handleMovimientos = () => {
        setAlmacenMenu({
            ...almacenMenu,
            recepcion: false,
            pedidos: false,
            traslados: false,
            movimientos: true
        })
    }


    return {
        almacenMenu,
        handleRecepcion,
        handlePedidos,
        handleTraslados,
        handleMovimientos,
    };
};

export default useAdminMenu;