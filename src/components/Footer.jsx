import React from 'react';
import { useContext } from 'react';
import AppContext from '@context/AppContext';

//Components

//CSS
import styles from '@styles/App.module.css';

export default function Footer() { 
  
  return (
    <>
    <div className="footer">
      <div classNameName={styles.foot}>

        <footer className="bg-primary text-center text-white">

          <div className="text-center p-3" >
            © 2022 Copyright: www.craken.com.co
          </div>

        </footer>

      </div>
    </div>
    </>
  )
}