// RootLayout.tsx
import React from 'react';
import Header from '@components/shared/Header/Header';
import Footer from '@components/shared/Footer/Footer';

export default function RootLayout({ children }) {
  return (
    <body className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      <Header />
      <div className="mx-auto d-block bg-blue container py-4" style={{ flex: 1 }}>
        {children}
      </div>
      <Footer />
    </body>
  );
};

