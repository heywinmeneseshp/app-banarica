import React from 'react';

//Component
import Header from "@components/Header";
import Footer from "@components/Footer";

//CSS
import styles from '@styles/Layout.module.css';



export default function SecondLayout({ children }) {
    return (
        <>
            <Header />
            <main className={styles.main}>
                <div >{children}</div>
            </main>
            <Footer />
        </>
    );
}