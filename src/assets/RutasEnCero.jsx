import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, InputGroup } from 'react-bootstrap';
import { consultarGalonesPorRuta, actualizarGalonesPorRuta } from '@services/api/rutas';

export default function RutasEnCero({ setAlert }) {
    const [rutasEnCero, setRutasEnCero] = useState([]);
    const [changes, setChanges] = useState(false);
    const formData = useRef();

    useEffect(() => {
        listar();
    }, [changes]);

    const listar = async () => {
        const res = await consultarGalonesPorRuta();
        setRutasEnCero(res);
    };

    const onGuardar = async (item, index) => {
        const consumo = formData.current[`consumo-${index}`].value;
        const body = { galones_por_ruta: consumo };
        actualizarGalonesPorRuta(item.id, body);
        setChanges(!changes);
        setAlert({
            active: true,
            mensaje: "La ruta ha sido actualizada con éxito",
            color: "success",
            autoClose: true
        });
    };

    return (
        <>
            <form ref={formData} className='container d-flex row justify-content-center mb-4 overflow-auto' style={{ maxHeight: '120px' }}>
                {rutasEnCero.map((item, index) => (
                    <div key={index} className="col-lg-3 col-md-6 col-sm-12 m-0 p-1">
                        <Alert variant='info' className='m-0'>
                            <div className='text-center mb-1'>
                                Ruta <b>{`${item?.ruta?.ubicacion_1?.ubicacion} - ${item?.ruta?.ubicacion_2?.ubicacion}`}</b>
                            </div>
                            <div className='text-center mb-1'>
                                Categoria <b>{`${item?.categoria_vehiculo?.categoria}`}</b>
                            </div>
                            <InputGroup size="sm">
                                <InputGroup.Text className="fs-6">Galones:</InputGroup.Text>
                                <input
                                    className='form-control form-control-sm'
                                    name={`consumo-${index}`}
                                    type="number"
                                />
                                <Button onClick={() => onGuardar(item, index)} className='btn-sm'>Guardar</Button>
                            </InputGroup>
                        </Alert>
                    </div>
                ))}
            </form>
        </>
    );
}
