import React from 'react';
import { useState } from 'react';

//Boostrap
import { InputGroup } from 'react-bootstrap';
import { Form } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

//Components


//CSS
import styles from '@styles/NuevoCombo.module.css'

export default function NuevoCombo() {

    const [products, setProducts] = useState([1]);

    function addProduct() {
        setProducts([...products, products.length + 1]);
    }

    return (
        <div>
            <form className={styles.formulario}>

                <div className={styles.contenedor1}>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Nombre del Combo</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>


                </div>

{products.map( (item, key) => (
                <div item={item} key={key} className={styles.contenedor2}>

                    <InputGroup size="sm" className="mb-3">
                        <InputGroup.Text id="inputGroup-sizing-sm">Cod</InputGroup.Text>
                        <Form.Control
                            aria-label="Small"
                            aria-describedby="inputGroup-sizing-sm"
                        />
                    </InputGroup>

                    <Form.Select className={styles.select} size="sm">
                        <option>Cartón<nav></nav></option>
                        <option>Termógrafos</option>
                    </Form.Select>


                    <Form.Select className={styles.select} size="sm">
                        <option>Tapa OT<nav></nav></option>
                        <option>Tapa FT<nav></nav></option>
                        <option>Base 18kg</option>
                        <option>División</option>
                    </Form.Select>


                </div>
))}

                <div className={styles.contenedor3}>
                    <div>
                        <Button onClick={addProduct} variant="primary" size="sm">
                            Añadir artículo
                        </Button>
                    </div>

                    <div>
                        <Button variant="success" size="sm">
                            Crear combo
                        </Button>
                    </div>

                </div>
            </form>
        </div>
    )
}