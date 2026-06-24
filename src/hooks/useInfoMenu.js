import { useState } from "react";


const initialInfoMenu = {
    movimientos: true,
    stock: false,
    traslados: false,
    pedidos: false,
    temperatura: false
};

const useInfoMenu = () => {
    const [infoMenu, setInfoMenu] = useState(initialInfoMenu);

    const handleMovimientos = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: true,
            stock: false,
            traslados: false,
            pedidos: false,
            temperatura: false
        });
    };

    const handleStock = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: false,
            stock: true,
            traslados: false,
            pedidos: false,
            temperatura: false
        });
    };

    const handleTraslados = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: false,
            stock: false,
            traslados: true,
            pedidos: false,
            temperatura: false
        });
    };

    const handlePedidos = () => {
        setInfoMenu({
            ...infoMenu,
            movimientos: false,
            stock: false,
            traslados: false,
            pedidos: true,
            temperatura: false
        });
    };

    const handleTemperatura = () => {
        setInfoMenu({
            movimientos: false,
            stock: false,
            traslados: false,
            pedidos: false,
            temperatura: true
        });
    };

    return {
        infoMenu,
        handleMovimientos,
        handleStock,
        handleTraslados,
        handlePedidos,
        handleTemperatura
    };
};

export default useInfoMenu;