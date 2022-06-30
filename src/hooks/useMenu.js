import { useState } from "react";


const initialMenu = {
    inicio: true,
    administrador: false,
    almacen: false,
    informes: false
}

const useMenu = () => {

    const [menu, setMenu] = useState(initialMenu);

    const handleInicio = () => {
        setMenu({
            ...menu,
            inicio: true,
            administrador: false,
            almacen: false,
            informes: false
        })
    }
    
    const handleAdministrador = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: true,
            almacen: false,
            informes: false
        })


    }

    const handleAlmacen = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: false,
            almacen: true,
            informes: false
        })
    }
    
    const handleInformes = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: false,
            almacen: false,
            informes: true
        })
    }

    return { menu, handleInicio, handleAdministrador, handleAlmacen, handleInformes };
};

export default useMenu;