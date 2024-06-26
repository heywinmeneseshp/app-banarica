// Header.js
import React, { useContext, useState, useEffect } from 'react';
import AppContext from '@context/AppContext';
import { useRouter } from 'next/router';
//Hooks
import { useAuth } from '@hooks/useAuth';
import useAlert from '@hooks/useAlert';
//Bootstrap
import { Navbar, NavDropdown } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { DropdownButton } from 'react-bootstrap';
import { Dropdown, Button, ButtonGroup } from 'react-bootstrap';
//Components
import NuevoUsuario from "@components/administrador/NuevoUsuario";
//Assets
//Imagenes
import config from '@public/images/config.png';

//CSS
import styles from '@styles/header.module.css';
import Image from 'next/image';
import Configuracion from '@components/administrador/Configuracion';

const Header = () => {
  const router = useRouter();
  const { setAlert } = useAlert();
  const { user, setUser, setAlmacenByUser } = useAuth();
  const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu } = useContext(AppContext);


  const [openProfile, setOpenProfile] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  useEffect(() => {
    let usuario = localStorage.getItem('usuario');
    const usuarioParsenado = JSON.parse(usuario);
    setUser(usuarioParsenado);
    const almacenByUser = JSON.parse(localStorage.getItem("almacenByUser"));
    setAlmacenByUser(almacenByUser);
    const listar = async () => {
    };
    listar();
  }, [openProfile, initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu]);



  const handleProfile = () => {
    setOpenProfile(!openProfile);
  };

  const openWindow = (window) => {
    initialAdminMenu.hadleOpenWindows(window);
  };

  const openMenu = (itemMenu) => {
    router.push("/");
    if (itemMenu == "admin") initialMenu.handleAdministrador();
    if (itemMenu == "almacen") initialMenu.handleAlmacen();
    if (itemMenu == "info") initialMenu.handleInformes();
    if (itemMenu == "inicio") initialMenu.handleInicio();

  };

  const inicio = () => {
    router.push("/");
    openMenu("inicio");
  };

  const onSeguridad = (itemMenu) => {
    router.push("/Seguridad" + itemMenu);
  };

  const cerrarSesion = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <>

      <div className="header">
        <Navbar className='justify' bg="dark" variant="dark">

          <div className='display-mobile' id="menuToggle">
            <input type="checkbox" />
            <span></span>
            <span></span>
            <span></span>
            <ul id="menu">

              <NavDropdown onClick={() => openMenu("admin")} title="Administrador" drop='end' id="nav-dropdown">
                <Dropdown.Item onClick={() => openWindow("usuarios")} >Usuarios</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("productos")}>Productos</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("combos")}>Combos</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("categorias")}>Categorias</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("proveedores")}>Proveedores</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("bodegas")}>Almacenes</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("transporte")}>Transporte</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("etiquetas")}>Etiquetas</Dropdown.Item>
                <Dropdown.Item >Configuración</Dropdown.Item>
              </NavDropdown>

              <NavDropdown title="Seguridad" drop='end' id="nav-dropdown">
                <Dropdown.Item onClick={() => onSeguridad("/Recepcion")}>Recepción</Dropdown.Item>
                <Dropdown.Item onClick={() => onSeguridad("/Transferencias")}>Transferencias</Dropdown.Item>
                <Dropdown.Item onClick={() => onSeguridad("/Disponibles")}>Disponibles</Dropdown.Item>
                <Dropdown.Item onClick={() => onSeguridad("/Usuarios")}>Usuarios</Dropdown.Item>
              </NavDropdown>
              <NavDropdown onClick={() => openMenu("almacen")} title="Almacén" drop='end' id="nav-dropdown">
                <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              </NavDropdown>
              <NavDropdown onClick={() => openMenu("info")} title="Informes" drop='end' id="nav-dropdown">
                <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
              </NavDropdown>
            </ul>
          </div>

          <span className='display-desktop'>
            <Navbar.Brand variant="dark" onClick={inicio}><b>Transmonsa App</b></Navbar.Brand>

            <Nav variant="dark" className="me-auto">

              <DropdownButton onClick={() => openMenu("admin")} variant="dark" id="dropdown-basic-button" title="Maestros">
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
                <Dropdown.Item onClick={() => openWindow("usuarios")}>Usuarios</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("vehiculos")}>Vehiculos</Dropdown.Item>
                <Dropdown.Item onClick={() => setOpenConfig(true)} className={styles.configButton}>
                  <Image className={styles.imgConfig} width="15" height="15" src={config} alt="configuración" />
                  <span className={styles.textConfig}>Configuración</span>
                </Dropdown.Item>
              </DropdownButton>

              <DropdownButton onClick={() => openMenu("admin")} variant="dark" id="dropdown-basic-button" title="Programaciones">
                <Dropdown.Item onClick={() => openWindow("programador")} >Programador</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("contenedores")}>Contenedores</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("historico")}>Historico</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("reportesConsumo")}>Reportes</Dropdown.Item>
              </DropdownButton>

              <DropdownButton variant="dark" id="dropdown-basic-button" title="Seguridad">
                <Dropdown.Item onClick={() => onSeguridad("/Recepcion")}>Recepción</Dropdown.Item>
                <Dropdown.Item onClick={() => onSeguridad("/Transferencias")}>Transferencias</Dropdown.Item>
                <Dropdown.Item onClick={() => onSeguridad("/Disponibles")}>Disponibles</Dropdown.Item>
                <Dropdown.Item onClick={() => onSeguridad("/Usuarios")}>Usuarios</Dropdown.Item>
              </DropdownButton>

              <DropdownButton variant="dark" onClick={() => openMenu("almacen")} className={styles.itemMenu} id="dropdown-basic-button" title="Almacén">
                <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              </DropdownButton>

              <DropdownButton variant="dark" onClick={() => openMenu("info")} className={styles.itemMenu} id="dropdown-basic-button" title="Inventario">
                <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
              </DropdownButton>

            </Nav>

            <ButtonGroup variant="dark" size="sm">

              <Button onClick={handleProfile}>{user?.nombre} {user?.apellido}</Button>
            </ButtonGroup>

            <ButtonGroup variant="dark" size="sm">
              <Button variant="dark" onClick={() => cerrarSesion()}>Cerrar sesión</Button>
            </ButtonGroup>

          </span>
        </Navbar>

        {openProfile && <NuevoUsuario setOpen={setOpenProfile} setAlert={setAlert} user={user} profile={true} />}
        {openConfig && <Configuracion setOpen={setOpenConfig} />}
      </div>

    </>
  );
};

export default Header;