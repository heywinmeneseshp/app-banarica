import React from 'react';

//Components

//CSS
import styles from '@styles/Layout.module.css';

export default function Footer() {

    return (
        <>
            <footer className="footer bg-primary text-center text-white">
                <div className={styles.footer}>
                    <div className="text-center p-3" >
                        © 2022 Copyright: www.craken.com.co
                    </div>
                </div>
            </footer>
        </>
    );
}