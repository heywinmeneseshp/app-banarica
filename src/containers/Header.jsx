import React, { useState, useContext } from 'react';
import { Navbar } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { Container } from 'react-bootstrap';

const Header = () => {
  
  return (
   <>
 
  <Navbar bg="primary" variant="dark">
    <Container>
    <Navbar.Brand href="#home">Banarica</Navbar.Brand>
    <Nav className="me-auto">
      <Nav.Link href="#home">Administrador</Nav.Link>
      <Nav.Link href="#features">Almacén</Nav.Link>
      <Nav.Link href="#pricing">Informes</Nav.Link>
    </Nav>
    </Container>
  </Navbar>


   </>
  );
};

export default Header;