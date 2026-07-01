import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "@hooks/useAuth";
import { ROL_SUPER_ADMIN } from "@containers/programacion/programadorUtils";

import Bodega from "@containers/administrador/Bodega";
import Categoria from "@containers/administrador/Categoria";
import Combo from "@containers/administrador/Combo";
import Producto from "@containers/administrador/Producto";
import Proveedor from "@containers/administrador/Proveedor";
import Transporte from "@containers/administrador/Transporte";
import Users from "@containers/administrador/Users";
import Etiquetas from "@containers/administrador/Etiquetas";
import MotivoDeRechazo from "@containers/administrador/MotivoDeRechazo";
import CategoriaVehiculos from "@components/Maestros/CategoriaVehiculos";
import Clientes from "@components/Maestros/Clientes";
import TipoMovimientoVehiculos from "@components/Maestros/TipoMovimientoVehiculos";
import Rutas from "@components/Maestros/Rutas";
import Ubicaciones from "@components/Maestros/Ubicaciones";
import Vehiculos from "@components/Maestros/Vehiculos";

export default function Maestros() {
    const { query } = useRouter();
    const { item } = query;
    const { getUser } = useAuth();
    const user = getUser();

    return (
        <div>
            {item === "bodegas" && <Bodega />}
            {item === "categorias" && <Categoria />}
            {item === "combos" && <Combo />}
            {item === "productos" && <Producto />}
            {item === "proveedores" && <Proveedor />}
            {item === "transporte" && <Transporte />}
            {item === "usuarios" && user?.id_rol === ROL_SUPER_ADMIN && <Users />}
            {item === "etiquetas" && <Etiquetas />}
            {item === "MotivoDeRechazo" && <MotivoDeRechazo />}
            {item === "categoriaVehiculos" && <CategoriaVehiculos />}
            {item === "clientes" && <Clientes />}
            {item === "tipoMovimientoVehiculos" && <TipoMovimientoVehiculos />}
            {item === "rutas" && <Rutas />}
            {item === "ubicaciones" && <Ubicaciones />}
            {item === "vehiculos" && <Vehiculos />}
        </div>
    );
}
