import React, {  useEffect } from 'react';

import endPoints from '@services/api';
import { actualizarAlmacen, agregarAlmacen, buscarAlmacen, listarAlmacenes, paginarAlmacenes } from '@services/api/almacenes';
//Components
import Tablas from '@components/shared/Tablas/Tablas';

const Bodega = () => {


    useEffect(() => {
    }, []);

    return (
        <>
            <Tablas
                titulo={"Almacenes"}
                actualizar={actualizarAlmacen}
                paginar={paginarAlmacenes}
                crear={agregarAlmacen}
                listar={listarAlmacenes}
                encabezados={{
                    "ID": "id",
                    "Cons": "consecutivo",
                    "Almacén": "nombre",
                    "Razon Social": "razon_social",
                    "Domicilio": "direccion",
                    "Teléfono": "telefono",
                    "email": "email",
                    "Editar": "",
                    "Activar": "isBlock",
                }}
                //Cargue Masivo
                tituloCargueMasivo={"Almecenes"}
                endPointCargueMasivo={endPoints.almacenes.create + "/masivo"}
                encabezadosCargueMasivo={{
                    "consecutivo": null,
                    "nombre": null,
                    "razon_social": null,
                    "direccion": null,
                    "telefono": null,
                    "email": null
                }}
            />
        </>
    );
};

export default Bodega;
