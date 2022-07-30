const useDate = () => {

    const date = new Date();
    let dia = date.getDate()
    let mes = date.getMonth() + 1
    let anho = date.getFullYear()
    if (dia < 10) dia = "0" + dia
    if (mes < 10) mes = "0" + mes

    return anho + "-" + mes + "-" + dia
};

export default useDate;