import React, { useContext } from 'react';
import AppContext from '@context/AppContext';

//Components
import Inicio from '@containers/Inicio';
import SecondLayout from 'layout/SecondLayout';
import Adminsitrador from '@containers/administrador';
import Almacen from '@containers/almacen';
import Informes from '@containers/informes';


//CSS

export default function Home() {

  const { initialMenu } = useContext(AppContext);

  return (
    <div>
      <div>
        <SecondLayout>
          {initialMenu.menu.inicio && <Inicio />}
          {initialMenu.menu.administrador && <Adminsitrador />}
          {initialMenu.menu.almacen && <Almacen />}
          {initialMenu.menu.informes && <Informes />}
        </SecondLayout>
      </div>
    </div>
  );
}
