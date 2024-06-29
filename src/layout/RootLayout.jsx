// RootLayout.tsx
import React from 'react';
import Header from '@components/shared/Header/Header';
import Footer from '@components/shared/Footer/Footer';

export default function RootLayout({ children }) {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header />
      <div className="mx-auto d-block container" style={{ flex: 1, marginTop: "70px", marginBottom: "20px" }}>
        {children}
      </div>
      <Footer />
    </div>
  );
};

