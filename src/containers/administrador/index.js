import React from 'react';
import { useContext } from 'react';
import AppContext from '@context/AppContext';
//Bootstrap
//Components
import Bodega from '@containers/administrador/Bodega';
import Categoria from '@containers/administrador/Categoria';
import Combo from '@containers/administrador/Combo';
import Producto from '@containers/administrador/Producto';
import Proveedor from '@containers/administrador/Proveedor';
import Transporte from '@containers/administrador/Transporte';
import Users from '@containers/administrador/Users';
import Inicio from "@containers/Inicio";

export default function Adminsitrador() {

  const { initialAdminMenu } = useContext(AppContext)

  return (
    <>

      <div>
        {initialAdminMenu.adminMenu.inicio && <Inicio />}
        {initialAdminMenu.adminMenu.bodegas && <Bodega />}
        {initialAdminMenu.adminMenu.categorias && <Categoria />}
        {initialAdminMenu.adminMenu.combos && <Combo />}
        {initialAdminMenu.adminMenu.productos && <Producto />}
        {initialAdminMenu.adminMenu.proveedores && <Proveedor />}
        {initialAdminMenu.adminMenu.transporte && <Transporte />}
        {initialAdminMenu.adminMenu.usuarios && <Users />}
      </div>

    </>
  );
}
