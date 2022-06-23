import React from "react";

//CSS


export default function MainLayout({ children }) {


  return (
    <>
      <div className="contenedor-principal">
        <main className="cuerpo">
          <div>{children}</div>
        </main>
      </div>
    </>
  );
}
