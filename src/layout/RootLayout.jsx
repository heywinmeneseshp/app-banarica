// RootLayout.tsx
import React from 'react';
import Header from '@components/shared/Header/Header';
import Footer from '@components/shared/Footer/Footer';


export default function RootLayout({ children }) {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header  className="header-with-high-zindex" />
      <div className="mx-auto d-block container" style={{ flex: 1, marginTop: "20px", marginBottom: "20px" }}>
        {children}
      </div>
      <Footer />
    </div>
  );
};

