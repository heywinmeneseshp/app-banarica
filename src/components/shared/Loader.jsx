import React from 'react';

//Components
import { PropagateLoader } from "react-spinners";

//CSS
import styles2 from "@styles/Config.module.css";



export default function Loader({ loading }) {

    return (
        <>
            {loading && (
                <div className={styles2.spinnerContainer}>
                    <PropagateLoader color="#0d6efd" />
                </div>
            )}
        </>
    );
}