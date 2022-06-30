import { useState } from "react";


const initialInfoMenu = {
    movimientos: true,
    stock: false,
    traslados: false,
    pedidos: false
}

const useInfoMenu = () => {
    const [infoMenu, setInfoMenu] = useState(initialInfoMenu);

    const handleMovimientos = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: true,
            stock: false,
            traslados: false,
            pedidos: false
        })
    }

    const handleStock = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: false,
            stock: true,
            traslados: false,
            pedidos: false
        })
    }

    const handleTraslados = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: false,
            stock: false,
            traslados: true,
            pedidos: false
        })
    }

    const handlePedidos = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: false,
            stock: false,
            traslados: false,
            pedidos: true
        })
    }


    return {
        infoMenu,
        handleMovimientos,
        handleStock,
        handleTraslados,
        handlePedidos
    };
};

export default useInfoMenu;