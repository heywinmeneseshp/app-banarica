import React, { useState, useContext } from 'react';
import { Navbar } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { Container } from 'react-bootstrap';
import { DropdownButton } from 'react-bootstrap';
import { Dropdown } from 'react-bootstrap';

//Assets

//CSS
import styles from '@styles/header.module.css';

const Header = () => {

  return (
    <>

      <Navbar bg="primary" variant="dark">
        <Container>
          <Navbar.Brand href="/">Banarica</Navbar.Brand>
          <Nav className="me-auto">
            <DropdownButton className={styles.itemMenu} id="dropdown-basic-button" title="Administrador">
              <Dropdown.Item href="/admin/usuarios">Usuarios</Dropdown.Item>
              <Dropdown.Item href="/admin/productos">Productos</Dropdown.Item>
              <Dropdown.Item href="/admin/categorias">Categorias</Dropdown.Item>
              <Dropdown.Item href="/admin/proveedores">Proveedores</Dropdown.Item>
              <Dropdown.Item href="/admin/bodegas">Bodegas</Dropdown.Item>
              <Dropdown.Item href="/admin/transporte">Transporte</Dropdown.Item>
            </DropdownButton>

            <DropdownButton className={styles.itemMenu} id="dropdown-basic-button" title="Almacen">
              <Dropdown.Item href="/almacen/recepcion">Recepción</Dropdown.Item>
              <Dropdown.Item href="/almacen/traslado">Traslados</Dropdown.Item>
              <Dropdown.Item href="/almacen/movimientos">Movimientos</Dropdown.Item>
            </DropdownButton>

            <DropdownButton className={styles.itemMenu} id="dropdown-basic-button" title="Informes">
              <Dropdown.Item href="/informes/movimientos">Movimientos</Dropdown.Item>
              <Dropdown.Item href="/informes/stock">Stock</Dropdown.Item>
              <Dropdown.Item href="/informes/traslados">Traslados</Dropdown.Item>
            </DropdownButton>

          </Nav>
        </Container>
      </Navbar>


    </>
  );
};

export default Header;