import { useEffect } from "react";
import React from "react";
import { Dropdown, DropdownButton } from 'react-bootstrap';
import styles from '@styles/Tablero.module.css';


const BotonDespliegue = ({ funcion, nombreBoton, items }) => {

    useEffect(() => {
    }, [items]);

    return (
        <>
            {(items.length > 1) &&
                <DropdownButton
                    id="dropdown-basic-button"
                    title={nombreBoton}
                    variant="white"
                    size="sm"
                    className={styles.botonDespliegue}
                >
                    <Dropdown.Item onClick={() => funcion(null)}>All</Dropdown.Item>
                    {items.map((item, index) => {
                        let texto = item;
                        if (item == "Devolucion") texto = "Devolución";
                        if (item == "Liquidacion") texto = "Liquidación";
                        return (<Dropdown.Item onClick={() => funcion(item)} key={index} value={item}>{texto}</Dropdown.Item>);
                    })}
                </DropdownButton>
            }
        </>

    );

};

export default BotonDespliegue;