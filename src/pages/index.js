import React from 'react';


//Components
import Inicio from '@containers/Inicio';
import SecondLayout from 'layout/SecondLayout';
import Usuarios from './admin/usuarios';
import Bodegas from '@containers/Bodegas';

//CSS

export default function Home() {
  return (
    <div>

      <SecondLayout>
        <Inicio />
        <Usuarios />
        <Bodegas />
      </SecondLayout>

    </div>
  );
}
