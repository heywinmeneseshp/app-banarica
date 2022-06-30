import React from 'react';

//Bootstrap
import { Alert } from 'react-bootstrap';

import styles from '@styles/Tablero.module.css';


const TableroB = () => {

    return (
        <>

            <div className={styles.superTablero}>
                <div className={styles.tablero}>
                    <div className={styles.containerCrear}>
                        <h5 className={styles.plus}>+ Avisos</h5>
                        
                        <Alert key={"01"} variant="info"> 
                            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Similique delectus, ipsa cum cumque incidunt reiciendis blanditiis maxime unde quod quas soluta numquam quae, dolorum repellendus labore tempora mollitia pariatur ducimus?
                        </Alert>

                    </div>
                </div>
            </div>
        </>
    );
};

export default TableroB;