import React from "react";

//CSS


export default function MainLayout({ children }) {


  return (
    <>
      <div >
        <main >
          <div>{children}</div>
        </main>
      </div>
    </>
  );
}
