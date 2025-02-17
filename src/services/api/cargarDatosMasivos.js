import axios from "axios";



const cargaMasiva = async (endPoint, body) => {
    const res = await axios.post(endPoint, body);
    return res.data;
};


export {
    cargaMasiva
};
