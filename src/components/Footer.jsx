import React from 'react';

//Components

//CSS
import styles from '@styles/App.module.css';

export default function Footer() { 
  
  return (
    <>
    <div className="footer">
      <div className={styles.foot}>

        <footer className="bg-primary text-center text-white">

          <div className="text-center p-3" >
            © 2022 Copyright: www.craken.com.co
          </div>

        </footer>

      </div>
    </div>
    </>
  );
}