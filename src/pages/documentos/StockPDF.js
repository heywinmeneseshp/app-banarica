import React, {useState} from "react";
import { Table } from "react-bootstrap";


export default function StockPDF() {
    const [stock, setStock] = useState([1,2,3,4])

    return (
        <>
         <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Cod. Al</th>
                            <th>Almacen</th>
                            <th>Cod. Cat</th>
                            <th>Cod. Art</th>
                            <th>Artículo</th>
                            <th>Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stock.map((item, index) => (
                            <tr key={index}>
                                <td>Azul</td>
                                <td>Azul</td>
                                <td>Azul</td>
                                <td>Azul</td>
                                <td>Azul</td>
                                <td>Azul</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

        </>
    )
}
