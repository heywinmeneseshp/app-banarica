import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Navbar, NavDropdown, Nav, DropdownButton, Dropdown, Button, ButtonGroup } from 'react-bootstrap';
import { useAuth } from '@hooks/useAuth';
import useAlert from '@hooks/useAlert';
import AppContext from '@context/AppContext';
import NuevoUsuario from "@components/administrador/NuevoUsuario";
import Configuracion from '@components/administrador/Configuracion';
import Image from 'next/image';
import config from '@public/images/config.png';
import styles from '@styles/header.module.css';
import { encontrarEmpresa } from '@services/api/configuracion';

const Header = () => {
  const router = useRouter();
  const { setAlert } = useAlert();
  const { user, setUser, setAlmacenByUser } = useAuth();
  const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu } = useContext(AppContext);

  const [openProfile, setOpenProfile] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [nombreApp, setNombreApp] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    encontrarEmpresa().then(res => setNombreApp(res.nombreComercial));
    setUser(usuario);
    const almacenByUser = JSON.parse(localStorage.getItem("almacenByUser"));
    setAlmacenByUser(almacenByUser);
  }, [setUser, setAlmacenByUser]);

  const handleProfile = () => setOpenProfile(prev => !prev);

  const openWindow = (window) => {
    initialAdminMenu.hadleOpenWindows(window);
  };

  const openMenu = (itemMenu) => {
    router.push("/");
    switch (itemMenu) {
      case "admin": initialMenu.handleAdministrador(); break;
      case "almacen": initialMenu.handleAlmacen(); break;
      case "info": initialMenu.handleInformes(); break;
      case "inicio": initialMenu.handleInicio(); break;
      default: break;
    }
  };

  const onSeguridad = (itemMenu) => {
    router.push(`/Seguridad${itemMenu}`);
  };

  const cerrarSesion = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="header">
      <Navbar bg="dark" variant="dark" className='justify'>
        <div className='display-mobile' id="menuToggle">
          <input type="checkbox" />
          <span></span>
          <span></span>
          <span></span>
          <ul id="menu">
            <NavDropdown title="Administrador" drop='end' id="nav-dropdown">
              <Dropdown.Item onClick={() => openWindow("bodegas")}>Almacenes</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("categorias")}>Categorias</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("combos")}>Combos</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("etiquetas")}>Etiquetas</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("productos")}>Productos</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("proveedores")}>Proveedores</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("transporte")}>Transporte</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("usuarios")}>Usuarios</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("categorias")}>Categorias</Dropdown.Item>
            </NavDropdown>
            <NavDropdown title="Seguridad" drop='end' id="nav-dropdown">
              <Dropdown.Item onClick={() => onSeguridad("/Disponibles")}>Disponibles</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Dashboard")}>Dashboard</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Embarques")}>Embarques</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/InspLleno")}>Insp Lleno</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Lector")}>Insp Vacio</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Listado")}>Contenedores</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Recepcion")}>Recepción</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Transferencias")}>Transferencias</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Usuarios")}>Usuarios</Dropdown.Item>
            </NavDropdown>
            <NavDropdown title="Almacén" drop='end' id="nav-dropdown">
              <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
              <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
              <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
            </NavDropdown>
            <NavDropdown title="Informes" drop='end' id="nav-dropdown">
              <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
              <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
              <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
            </NavDropdown>
          </ul>
        </div>

        <span className='display-desktop'>
          <Navbar.Brand onClick={() => openMenu("inicio")}><b>{nombreApp ? nombreApp : "LogiCrack App"}</b></Navbar.Brand>

          <Nav className="me-auto">
            <DropdownButton variant="dark" id="dropdown-basic-button" title="Maestros" onClick={() => openMenu("admin")}>
              <Dropdown.Item onClick={() => openWindow("bodegas")}>Almacenes</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("categorias")}>Categoria productos</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("categoriaVehiculos")}>Categoria vehiculos</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("clientes")}>Clientes</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("combos")}>Combos</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("etiquetas")}>Etiquetas</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("productos")}>Productos</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("proveedores")}>Proveedores</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("rutas")}>Rutas</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("transporte")}>Transporte</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("ubicaciones")}>Ubicaciones</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("vehiculos")}>Vehiculos</Dropdown.Item>
              <Dropdown.Item onClick={() => setOpenConfig(true)} className={styles.configButton}>
                <Image className={styles.imgConfig} width="15" height="15" src={config} alt="configuración" />
                <span className={styles.textConfig}>Configuración</span>
              </Dropdown.Item>
            </DropdownButton>

            <DropdownButton variant="dark" id="dropdown-basic-button" title="Programaciones" onClick={() => openMenu("admin")}>
              <Dropdown.Item onClick={() => openWindow("contenedores")}>Contenedores</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("historico")}>Historico</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("programador")}>Programador</Dropdown.Item>
              <Dropdown.Item onClick={() => openWindow("reportesConsumo")}>Reportes</Dropdown.Item>
            </DropdownButton>

            <DropdownButton variant="dark" id="dropdown-basic-button" title="Seguridad">
              <Dropdown.Item onClick={() => onSeguridad("/Dashboard")}>Dashboard</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Disponibles")}>Disponibles</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Embarques")}>Embarques</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/InspLleno")}>Insp Lleno</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Lector")}>Insp Vacio</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Listado")}>Contenedores</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Recepcion")}>Recepción</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Transferencias")}>Transferencias</Dropdown.Item>
              <Dropdown.Item onClick={() => onSeguridad("/Usuarios")}>Usuarios</Dropdown.Item>
            </DropdownButton>

            <DropdownButton variant="dark" id="dropdown-basic-button" title="Almacén" onClick={() => openMenu("almacen")} className={styles.itemMenu}>
              <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
              <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
              <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
            </DropdownButton>

            <DropdownButton variant="dark" id="dropdown-basic-button" title="Inventario" onClick={() => openMenu("info")} className={styles.itemMenu}>
              <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
              <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
              <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
            </DropdownButton>
          </Nav>

          <ButtonGroup size="sm">
            <Button variant="dark"  onClick={handleProfile}>{user?.nombre} {user?.apellido}</Button>
            <Button variant="dark" onClick={cerrarSesion}>Cerrar sesión</Button>
          </ButtonGroup>
        </span>
      </Navbar>

      {openProfile && <NuevoUsuario setOpen={setOpenProfile} setAlert={setAlert} user={user} profile={true} />}
      {openConfig && <Configuracion setOpen={setOpenConfig} />}
    </div>
  );
};

export default Header;
