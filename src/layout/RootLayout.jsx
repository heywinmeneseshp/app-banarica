// RootLayout.tsx
import React from 'react';
import { useRouter } from 'next/router';
import Header from '@components/shared/Header/Header';
import Footer from '@components/shared/Footer/Footer';


export default function RootLayout({ children, showChrome = false }) {
  const router = useRouter();
  const isOperationalRoute = ['/Seguridad', '/Movimiento', '/tracecode', '/cartas'].some((prefix) => (
    router.pathname.startsWith(prefix) || router.asPath.startsWith(prefix)
  ));

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {showChrome && <Header className="header-with-high-zindex" />}
      <div
        className={isOperationalRoute ? 'container-fluid px-3 px-md-4 px-xl-5' : 'mx-auto d-block container'}
        style={{ flex: 1, marginTop: "20px", marginBottom: "20px" }}
      >
        {children}
      </div>
      {showChrome && <Footer />}
    </div>
  );
};

