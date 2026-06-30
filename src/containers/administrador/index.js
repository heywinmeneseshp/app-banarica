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
import TipoMovimientoVehiculos from '@components/Maestros/TipoMovimientoVehiculos';
import Vehiculos from '@components/Maestros/Vehiculos';
//PROGRAMACIONES
import Programador from '@containers/programacion/Programador';
import Contenedores from '@components/Programacion/Contenedores';
import Notificaciones from '@containers/programacion/Notificaciones';
import Clientes from '@components/Maestros/Clientes';
import HistorialConsumo from "@containers/programacion/ConsumoKm";
import HistoricoConsumoRuta from '@containers/programacion/ConsumoRutas';
import SaldoCombustibleVehiculos from '@containers/programacion/SaldoCombustible';
import ReportesConsumo from '@containers/programacion/Reportes';
import ConsumoRutaVehiculo from '@containers/programacion/ConsumoRutaVehiculo';
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
        {initialAdminMenu.adminMenu.tipoMovimientoVehiculos && <TipoMovimientoVehiculos />}
        {initialAdminMenu.adminMenu.rutas && <Rutas />}
        {initialAdminMenu.adminMenu.ubicaciones && <Ubicaciones />}
        {initialAdminMenu.adminMenu.vehiculos && <Vehiculos />}
        {/*Programacion*/}
        {initialAdminMenu.adminMenu.programador && <Programador />}
        {initialAdminMenu.adminMenu.contenedores && <Contenedores />}
        {initialAdminMenu.adminMenu.notificaciones && <Notificaciones />}
        {initialAdminMenu.adminMenu.historico && <HistorialConsumo />}
        {initialAdminMenu.adminMenu.historicoRutaVehiculo && <HistoricoConsumoRuta />}
        {initialAdminMenu.adminMenu.saldoCombustibleVehiculos && <SaldoCombustibleVehiculos />}
        {initialAdminMenu.adminMenu.reportesConsumo && <ReportesConsumo />}
        {initialAdminMenu.adminMenu.consumoRutaVehiculo && <ConsumoRutaVehiculo />}
      </div>

    </>
  );
}
