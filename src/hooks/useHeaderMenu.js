import { useState } from "react";

const headerMenu = {
    
}

const useInitialState = () => {
    const [state, setState] = useState(initialState);

    const handleRealizarTraslado = () => {
        setState({
            ...state,
            realizarTraslado: true,
            recibirTraslado: false,
        });
    };

    const handleRecibirTraslado = () => {
        setState({
            ...state,
            realizarTraslado: false,
            recibirTraslado: true,
        });

        console.log(state);
    };

    const handleLogin = () => {
        setState({
            ...state,
            header: "header",
            footer: "footer"
        });
    };

    return { state, handleRealizarTraslado, handleRecibirTraslado, handleLogin };
};

export default useInitialState;