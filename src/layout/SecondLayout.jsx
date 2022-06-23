import React from 'react';

//Component
import Header from "@components/Header";
import Footer from "@components/Footer";

//CSS
import styles from '@styles/SecondLayout.module.css';



export default function SecondLayout({ children }) {
  return (
    <>
      <Header />
      <main>
        <div className={styles.ancho}>{children}</div>
      </main>
      <Footer />
    </>
  );
}