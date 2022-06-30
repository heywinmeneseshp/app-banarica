import React from 'react';
import { useContext } from 'react';
import AppContext from '@context/AppContext';

//Bootstrap
import { Container } from 'react-bootstrap';

//Components
import Bodega from '@containers/administrador/Bodega';
import Categoria from '@containers/administrador/Categoria';
import Combo from '@containers/administrador/Combo';
import Producto from '@containers/administrador/Producto';
import Proveedor from '@containers/administrador/Proveedor';
import Transporte from '@containers/administrador/Transporte';
import Users from '@containers/administrador/Users';
import Inicio from "@containers/Inicio";
import NuevaBodega from '@components/administrador/NuevaBodega';
import NuevaCategoria from '@components/administrador/NuevaCategoria';
import NuevoCombo from '@components/administrador/NuevoCombo';
import NuevoConductor from '@components/administrador/NuevoConductor';
import NuevoProducto from '@components/administrador/NuevoProducto';
import NuevoProveedor from '@components/administrador/NuevoProveedor';
import NuevoTransporte from '@components/administrador/NuevoTransporte';
import NuevoUsuario from '@components/administrador/NuevoUsuario';


//


//CSS
import styles from "@styles/Tablero.module.css"

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

      {initialAdminMenu.tableros.contenedor &&
        <div className={styles.padre}>
          <div className={styles.tableros}>
            {initialAdminMenu.tableros.bodega && <NuevaBodega />}
            {initialAdminMenu.tableros.categoria && <NuevaCategoria />}
            {initialAdminMenu.tableros.combo && <NuevoCombo />}
            {initialAdminMenu.tableros.conductor && <NuevoConductor />}
            {initialAdminMenu.tableros.producto && <NuevoProducto />}
            {initialAdminMenu.tableros.proveedor && <NuevoProveedor />}
            {initialAdminMenu.tableros.transporte && <NuevoTransporte />}
            {initialAdminMenu.tableros.usuario && <NuevoUsuario />}
          </div>
        </div>}

    </>
  );
}
