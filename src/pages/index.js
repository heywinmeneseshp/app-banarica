import React from 'react';


//Components
import Inicio from '@containers/Inicio';
import SecondLayout from 'layout/SecondLayout';
import Adminsitrador from '@containers/administrador';
import Almacen from '@containers/almacen';
import Informes from '@containers/informes';


//CSS

export default function Home() {
  return (
    <div>

      <SecondLayout>
        <Inicio />
        <Adminsitrador />
        <Almacen />
        <Informes />
      </SecondLayout>

    </div>
  );
}
