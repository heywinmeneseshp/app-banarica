import React from 'react';


//Components
import Bodega from '@containers/administrador/Bodega';
import Categoria from '@containers/administrador/Categoria';
import Combo from '@containers/administrador/Combo';
import Producto from '@containers/administrador/Producto';
import Proveedor from '@containers/administrador/Proveedor';
import Transporte from '@containers/administrador/Transporte';
import Users from '@containers/administrador/Users';

//CSS

export default function Adminsitrador() {
  return (
    <div>
        <Bodega />
        <Categoria />
        <Combo />
        <Producto />
        <Proveedor />
        <Transporte />
        <Users />
    </div>
  );
}
