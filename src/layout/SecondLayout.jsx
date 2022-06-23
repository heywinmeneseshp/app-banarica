import React from 'react';

//Component
import Header from "@containers/Header";
import Footer from "@containers/Footer";

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