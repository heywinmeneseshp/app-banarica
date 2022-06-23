import { useState } from "react";

const initialState = {
    realizarTraslado: true,
    recibirTraslado: false,
    header: "disappear",
    footer: "disappear",
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