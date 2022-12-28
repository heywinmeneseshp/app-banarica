import { encontrarModulo } from "@services/api/configuracion";

async function useSemana(weekNumber) {
    const semana = await encontrarModulo("Semana");
    return "S" + weekNumber + "-" + semana[0].anho_actual;
};

export default useSemana;