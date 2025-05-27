import React from 'react';
import { useContext } from 'react';
import { useAuth } from '@hooks/useAuth';
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
import Inicio from "@containers/inicio/Inicio";
import Etiquetas from "@containers/administrador/Etiquetas";
import Conductor from './transporte/Conductor';
//TRANSPORTE
import Ubicaciones from "@components/Maestros/Ubicaciones";
import CategoriaVehiculos from '@components/Maestros/CategoriaVehiculos';
import Rutas from '@components/Maestros/Rutas';
import Vehiculos from '@components/Maestros/Vehiculos';
//PROGRAMACIONES
import Programador from '@components/Programacion/Programador';
import Contenedores from '@components/Programacion/Contenedores';
import Notificaciones from '@components/Programacion/Notificaciones';
import Clientes from '@components/Maestros/Clientes';
import HistorialConsumo from "@components/Programacion/HistorialConsumos";
import ReportesConsumo from '@components/Programacion/Reportes';
import MotivoDeRechazo from '@containers/administrador/MotivoDeRechazo';


export default function Adminsitrador() {

  const { initialAdminMenu } = useContext(AppContext);
  const { getUser } = useAuth();
  const user = getUser();

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
        {(initialAdminMenu.adminMenu.usuarios && user.id_rol == "Super administrador" ) && <Users />}
        {initialAdminMenu.adminMenu.etiquetas && <Etiquetas />}
        {initialAdminMenu.adminMenu.MotivoDeRechazo && <MotivoDeRechazo/>}
        {/*Maestro*/}
        {initialAdminMenu.adminMenu.categoriaVehiculos && <CategoriaVehiculos />}
        {initialAdminMenu.adminMenu.clientes && <Clientes />}
        {initialAdminMenu.adminMenu.conductores && <Conductor />}
        {initialAdminMenu.adminMenu.rutas && <Rutas />}
        {initialAdminMenu.adminMenu.ubicaciones && <Ubicaciones />}
        {initialAdminMenu.adminMenu.vehiculos && <Vehiculos />}
        {/*Programacion*/}
        {initialAdminMenu.adminMenu.programador && <Programador />}
        {initialAdminMenu.adminMenu.contenedores && <Contenedores />}
        {initialAdminMenu.adminMenu.notificaciones && <Notificaciones />}
        {initialAdminMenu.adminMenu.historico && <HistorialConsumo />}
        {initialAdminMenu.adminMenu.reportesConsumo && <ReportesConsumo />}
      </div>

    </>
  );
}
