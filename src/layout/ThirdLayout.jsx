import React from 'react';

//Component
import Footer from "@components/Footer";
import Header from '@components/Header';
//CSS
import styles from '@styles/SecondLayout.module.css';

export default function ThirdLayout({ children }) {
  return (
    <>
      <Header />
      <main>
        <div className={styles.thirdLayout}>{children}</div>
      </main>
      <Footer />
    </>
  );
}