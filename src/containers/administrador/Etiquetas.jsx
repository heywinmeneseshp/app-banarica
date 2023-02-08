import React, { useEffect } from 'react';
import { useState } from 'react';

//Components
import { Button } from 'react-bootstrap';
import CrearEtiqueta from '@components/administrador/CrearEtiqueta';
import CrearBardcode from '@components/administrador/CrearBarcode';

//CSS
import styles from '@styles/admin/etiquetas.module.css';


export default function Etiquetas() {

    const [toggleEtiqueta, setToggleEtiqueta] = useState(1)

    useEffect(()=>{
    },[])

    const handleToggleEtiqueta = (number) => {
        setToggleEtiqueta(number);
    };

    return (
        <>
            <div className={styles.container3}>
                <Button size="sm" onClick={() => handleToggleEtiqueta(1)}>Generar Barcode</Button>
                <Button size="sm" onClick={() => handleToggleEtiqueta(2)} >Crear etiqueta</Button>
            </div>
            {(toggleEtiqueta == 1) && <CrearBardcode />}
            {(toggleEtiqueta == 2) && <CrearEtiqueta />}
        </>
    );
}