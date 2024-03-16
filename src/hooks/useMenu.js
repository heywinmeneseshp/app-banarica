import { useState } from "react";


const initialMenu = {
    inicio: true,
    administrador: false,
    almacen: false,
    informes: false
};

const useMenu = () => {
    const [navBar, setNavBar] = useState(true);
    const [menu, setMenu] = useState(initialMenu);

    const handleInicio = () => {
        setMenu({
            ...menu,
            inicio: true,
            administrador: false,
            almacen: false,
            informes: false
        });
    };

    const handleAdministrador = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: true,
            almacen: false,
            informes: false
        });


    };

    const handleAlmacen = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: false,
            almacen: true,
            informes: false
        });
    };

    const handleInformes = () => {
        setMenu({
            ...menu,
            inicio: false,
            administrador: false,
            almacen: false,
            informes: true
        });
    };

    const toggleNavBar = (bool) => {
        setNavBar(bool);
    };

    return {
        menu, 
        handleInicio, 
        handleAdministrador, 
        handleAlmacen, 
        handleInformes, 
        toggleNavBar,
        navBar
    };
};

export default useMenu;