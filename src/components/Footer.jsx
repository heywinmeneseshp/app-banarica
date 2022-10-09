import React from 'react';

//Components

//CSS
import styles from '@styles/Layout.module.css';
import Link from 'next/link';

export default function Footer() {

    return (
        <>
            <span className={styles.footer}>
                <footer className="bg-primary text-white pt-3">
                    <Link href={"https://www.craken.com.co/"}>
                        <span>
                            <p className={styles.link}>
                                © 2022 Copyright: www.craken.com.co
                            </p>
                        </span>
                    </Link>
                </footer>
            </span>
        </>
    );
}