import React from 'react';
import { useRouter } from 'next/router';
//Hooks
import { useAuth } from '@hooks/useAuth';
//Component
import Footer from "@components/Footer";
import Header from '@components/Header';
//CSS
import styles from '@styles/Layout.module.css';
import { useEffect } from 'react';

export default function ThirdLayout({ children }) {
    const router = useRouter();
    const { user } = useAuth();
    useEffect(() => {
        if (!user) router.push('/login');
    }, [])
    if (user) {
        return (
            <>
                <Header />
                <main>
                    <div className={styles.main}>{children}</div>
                </main>
                <Footer />
            </>
        );
    }
}