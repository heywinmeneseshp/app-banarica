import { useState } from 'react';

const useAlert = (options) => {
    const defaultOptions = {
        active: false,
        mensaje: "",
        color: '',
        autoClose: true
    };

    const [alert, setAlert] = useState({
        ...defaultOptions,
        ...options,
    });

    const toogleAlert = () => {
        setAlert(!alert.active);
    };

    return {
       alert,
       setAlert,
       toogleAlert 
    };
};

export default useAlert;