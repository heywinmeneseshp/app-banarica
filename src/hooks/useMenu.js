import { useState } from "react";


const initialMenu = {
    inicio: true,
    administrador: false,
    almacen: false,
    informes: false
}

const useMenu = () => {

    const [menu, setMenu] = useState(initialMenu);

    const hadleInicio = () => {
        setMenu({
            ...menu,
            inicio: true,
            administrador: false,
            almacen: false,
            informes: false
        })
    }
    
    const hadleAdministrador = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: true,
            almacen: false,
            informes: false
        })
    }

    const hadleAlmacen = () => {
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

    return { menu, hadleInicio, hadleAdministrador, hadleAlmacen, handleInformes };
};

export default useMenu;