function useSemana(weekNumber) {
    return "S" + weekNumber + "-" + new Date().getFullYear()
};

export default useSemana