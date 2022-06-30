import React from 'react';

//Components
import TableroA from '@components/inicio/TableroA';
import Cards from '@components/inicio/Cards';
import TableroB from '@components/inicio/TableroB';

//CSS
import styles from '@styles/Tablero.module.css';

export default function Inicio() {
  return (
    <>
    <div className={styles.contenedorTableros}>
        <TableroA />
        <TableroB />
    </div>
        <Cards></Cards>
    </>
  )
}