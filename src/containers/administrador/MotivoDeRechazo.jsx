import React, {  useEffect } from 'react';

import endPoints from '@services/api';//Components
import Tablas from '@components/shared/Tablas/Tablas';
import { actualizarMotivoDeRechazo, crearMotivoDeRechazo, listarMotivoDeRechazo, paginarMotivoDeRechazo } from '@services/api/motivoDeRechazo';

const MotivoDeRechazo = () => {

    useEffect(() => {
    }, []);

    return (
      <>
                <Tablas
                    titulo={"Motivos de Rechazo"}
                    actualizar={actualizarMotivoDeRechazo}
                    paginar={paginarMotivoDeRechazo}
                    crear={crearMotivoDeRechazo}
                    listar={listarMotivoDeRechazo}
                    encabezados={{
                        "ID": "id",
                        "Motivo": "motivo_rechazo",
                        "Editar": "",
                        "Activar": "habilitado",
                    }}
                    //Cargue Masivo
                    tituloCargueMasivo={"Motivo de Rechazo"}
                    endPointCargueMasivo={endPoints.motivoDeRechazo.create + "/masivo"}
                    encabezadosCargueMasivo={{
                        "motivo_rechazo": null,
                        "habilitado": null,
                    }}
                />
            </>
    );
};

export default MotivoDeRechazo;
