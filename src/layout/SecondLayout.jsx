import Header from '@containers/Header';
import styles from '@styles/SecondLayout.module.css';

export default function SecondLayout({ children }) {
  return (
    <>
      <div className={styles.header}>
        <Header />
      </div>

      <main>
        <div className={styles.ancho}>{children}</div>
      </main>
    </>
  );
}