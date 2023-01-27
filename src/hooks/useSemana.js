import { encontrarModulo } from "@services/api/configuracion";

async function useSemana(weekNumber) {
    let number = parseInt(weekNumber);
    const semana = await encontrarModulo("Semana");
    return "S" + number + "-" + semana[0].anho_actual;
};

export default useSemana;