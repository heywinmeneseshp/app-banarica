

const useAdminMenu = () => {
   
    const generarSCC18 = (producto, pallet_inicial, pallet_final, ibm) => {
        const concat = `003${producto.gnl.substr(0,9)}${ibm}`;
        let codigos = [];
        for (let init = pallet_inicial; init < ((pallet_final * 1) + 1); init++) {
            let pallet = init;
            if (pallet < 1000 && pallet > 99) pallet = `0${pallet}`;
            if (pallet < 100 && pallet > 9) pallet = `00${pallet}`;
            if (pallet < 10) pallet = `000${pallet}`;

            let control = 0;
            for (let number in Array.from(`${concat}${pallet}`).reverse()) {
                if ((number % 2) == 0) {
                    control = control + (Array.from(`${concat}${pallet}`).reverse()[number] * 3);
                } else {
                    control = control + (Array.from(`${concat}${pallet}`).reverse()[number] * 1);
                }
            }
            const digitoControl = (Math.ceil(control / 10) * 10) - control;
            codigos.push(`${concat}${pallet}${digitoControl}`);
        }
        return codigos;
    };


    return {
        generarSCC18
    };
};

export default useAdminMenu;