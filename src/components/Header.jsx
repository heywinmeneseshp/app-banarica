import React, { useContext } from 'react';
import AppContext from '@context/AppContext';

//Bootstrap
import { Navbar } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { Container } from 'react-bootstrap';
import { DropdownButton } from 'react-bootstrap';
import { Dropdown } from 'react-bootstrap';

//Assets

//CSS
import styles from '@styles/header.module.css';

const Header = () => {

  const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu } = useContext(AppContext);
  
  const openWindow = (window) =>{
    initialAdminMenu.hadleCloseTable();
    initialAdminMenu.hadleOpenWindows(window);
  };

  const openMenu = (itemMenu) => {
    if ( itemMenu == "admin" ) initialMenu.handleAdministrador();
    if ( itemMenu == "almacen" ) initialMenu.handleAlmacen();
    if ( itemMenu == "info" ) initialMenu.handleInformes();

  };

  return (
    <>
      <div className="header">
        <Navbar bg="primary" variant="dark">
          <Container>
            <Navbar.Brand onClick={initialMenu.hadleInicio}>Banarica</Navbar.Brand>
            <Nav className="me-auto">
              <DropdownButton onClick={() => openMenu("admin")} className={styles.itemMenu} id="dropdown-basic-button" title="Administrador">
                <Dropdown.Item onClick={() => openWindow("usuarios")} >Usuarios</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("productos")}>Productos</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("combos")}>Combos</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("categorias")}>Categorias</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("proveedores")}>Proveedores</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("bodegas")}>Bodegas</Dropdown.Item>
                <Dropdown.Item onClick={() => openWindow("transporte")}>Transporte</Dropdown.Item>
              </DropdownButton>

              <DropdownButton onClick={() => openMenu("almacen")} className={styles.itemMenu} id="dropdown-basic-button" title="Almacen">
                <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              </DropdownButton>

              <DropdownButton onClick={() => openMenu("info")} className={styles.itemMenu} id="dropdown-basic-button" title="Informes">
                <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
              </DropdownButton>

            </Nav>
          </Container>
        </Navbar>
      </div>
    </>
  );
};

export default Header;