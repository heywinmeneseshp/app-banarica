import React, { useEffect, useState } from 'react';

//Services


//CSS
import styles from '@styles/Listar.module.css';
import endPoints from '@services/api';
import { useRouter } from 'next/router';


export default function Tabla({ data, total }) {

    const [titles, setTitles] = useState([]);
    const [info, setInfo] = useState([]);
    const router = useRouter();
const { query } = router;

    useEffect(() => {
        listar();
    }, [data]);

    const listar = () => {
        if (data[0]) {
            const encabezados = Object.keys(data[0]);
            setTitles(encabezados);
            setInfo(data);
        }
    };

    const abrirHistorial = (res, item) => {
        var consulta;
        if(query?.anho) consulta = `anho=${query?.anho}`;
        if(query?.mes) consulta = `${consulta}&mes=${query?.mes}`;
        if(query?.sem) consulta = `${consulta}&sem=${query?.sem}`;
        if (res == "Item") window.open(endPoints.reporteConsumo.consumoVehiculo(`item=${item}&${consulta}`));
    };

    return (
        <>

            <table className="table table-sm">
                <thead className={`text-center ${styles.letter}`} style={{ fontSize: '12px' }}>
                    <tr>
                        {titles.map((item, index) => (
                            <th key={index} scope="col">{item}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className={`text-center ${styles.letter}`} style={{ fontSize: '14px' }}>
                    {info.map((item, index) => (
                        <tr key={index}>
                            {titles.map((element, key) => (
                                <td onClick={() => abrirHistorial(element, item[element])} key={key} className={`text-center ${item[titles[0]] == item[element] ? "text-primary fw-bold" : "" }`}>
                                    <span style={item[titles[0]] == item[element] ? { cursor: "pointer" } : {}}>
                                        {item[element]}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                {total && <thead className={`text-center ${styles.letter}`} style={{ fontSize: '14px' }}>
                    <tr>
                        {titles.map((item, index) => (
                            <th key={index} scope="col">{total[item]}</th>
                        ))}
                    </tr>
                </thead>}
            </table>


        </>
    );
}
