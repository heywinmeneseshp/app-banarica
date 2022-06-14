import React, { useState, useContext } from 'react';
import { Navbar } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { Container } from 'react-bootstrap';
import { DropdownButton } from 'react-bootstrap';
import { Dropdown } from 'react-bootstrap';

//Assets

//CSS


const Header = () => {

  return (
    <>

      <Navbar bg="primary" variant="dark">
        <Container>
          <Navbar.Brand href="/">Banarica</Navbar.Brand>
          <Nav className="me-auto">
            <DropdownButton id="dropdown-basic-button" title="Administrador">
              <Dropdown.Item href="/admin/usuarios">Usuarios</Dropdown.Item>
              <Dropdown.Item href="/admin/productos">Productos</Dropdown.Item>
              <Dropdown.Item href="/admin/categorias">Categorias</Dropdown.Item>
              <Dropdown.Item href="/admin/bodegas">Bodegas</Dropdown.Item>
              <Dropdown.Item href="/admin/transporte">Transporte</Dropdown.Item>
            </DropdownButton>
            <DropdownButton id="dropdown-basic-button" title="Almacen">
              <Dropdown.Item href="/users">Recepción</Dropdown.Item>
              <Dropdown.Item href="#/action-2">Traslados</Dropdown.Item>
              <Dropdown.Item href="#/action-3">Movimientos</Dropdown.Item>
            </DropdownButton>
          </Nav>
        </Container>
      </Navbar>


    </>
  );
};

export default Header;