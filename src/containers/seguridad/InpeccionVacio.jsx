import React, { useEffect } from "react";

import '@fortawesome/fontawesome-free/css/all.min.css'; // Importar los estilos de Font Awesome
import 'bootstrap/dist/css/bootstrap.min.css'; // Importar los estilos de Bootstrap
import InspeccionVacioFinca from "@components/seguridad/InspeccionVacioFinca";


export default function InspeccionVacio() {



    useEffect(() => {

    }, []);


    return (
        <>

            <div className="mb-4 mt-3 text-center">
                <h2>Inspección contenedor vacío</h2>
            </div>
            <InspeccionVacioFinca />
        </>
    );
}
