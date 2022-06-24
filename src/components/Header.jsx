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
  
  return (
    <>
      <div className="header">
        <Navbar bg="primary" variant="dark">
          <Container>
            <Navbar.Brand onClick={initialMenu.hadleInicio}>Banarica</Navbar.Brand>
            <Nav className="me-auto">
              <DropdownButton onClick={initialMenu.hadleAdministrador} className={styles.itemMenu} id="dropdown-basic-button" title="Administrador">
                <Dropdown.Item onClick={initialAdminMenu.handleUsuarios} >Usuarios</Dropdown.Item>
                <Dropdown.Item onClick={initialAdminMenu.handleProductos}>Productos</Dropdown.Item>
                <Dropdown.Item onClick={initialAdminMenu.handleCombos}>Combos</Dropdown.Item>
                <Dropdown.Item onClick={initialAdminMenu.handleCategorias}>Categorias</Dropdown.Item>
                <Dropdown.Item onClick={initialAdminMenu.handleProveedores}>Proveedores</Dropdown.Item>
                <Dropdown.Item onClick={initialAdminMenu.handleBodegas}>Bodegas</Dropdown.Item>
                <Dropdown.Item onClick={initialAdminMenu.handleTransporte}>Transporte</Dropdown.Item>
              </DropdownButton>

              <DropdownButton onClick={initialMenu.hadleAlmacen} className={styles.itemMenu} id="dropdown-basic-button" title="Almacen">
                <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
              </DropdownButton>

              <DropdownButton onClick={initialMenu.handleInformes} className={styles.itemMenu} id="dropdown-basic-button" title="Informes">
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