import React from 'react';
import styles from '../styles/Loading.module.css';
import Spinner from 'react-bootstrap/Spinner';



const Loading = () => {

    return (
        <>
            <div>
                <div className={styles.tableros}>
                    <div className={styles.padre}>
                        <Spinner animation="border" variant="primary" style={{ width: "4rem", height: "4rem" }} />
                        <h4 className={styles.text}>Cargando</h4>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Loading;