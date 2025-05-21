// Importación de dependencias necesarias
import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Navbar, Nav, DropdownButton, Dropdown, Button, ButtonGroup, Container } from 'react-bootstrap';

import { useAuth } from '@hooks/useAuth';
import useAlert from '@hooks/useAlert';
import AppContext from '@context/AppContext';

import NuevoUsuario from "@components/administrador/NuevoUsuario";
import Configuracion from '@components/administrador/Configuracion';

import { encontrarEmpresa, encontrarModulo } from '@services/api/configuracion';
import { menuCompleto } from 'utils/configMenu';

const Header = () => {
  const router = useRouter();
  const { setAlert } = useAlert();
  const { user, setUser, setAlmacenByUser } = useAuth();
  const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu } = useContext(AppContext);

  // Estados locales del componente
  const [openProfile, setOpenProfile] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [nombreApp, setNombreApp] = useState(null);
  const [configMenu, setConfigMenu] = useState([]);
  const [configSubMenu, setConfigSubMenu] = useState([]);

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    setUser(usuario);

    // Consulta el nombre de la empresa
    encontrarEmpresa().then(res => setNombreApp(res.nombreComercial));

    // Consulta la configuración de menú para el usuario
    encontrarModulo(usuario.username).then(res => {
      console.log(res);
      const detalles = JSON.parse(res[0].detalles);
      setConfigMenu(detalles.menu || []);
      setConfigSubMenu(detalles.submenu || []);
    });

    // Cargar almacén asociado al usuario
    const almacenByUser = JSON.parse(localStorage.getItem("almacenByUser"));
    setAlmacenByUser(almacenByUser);
  }, [setUser, setAlmacenByUser]);

  // Alternar la visibilidad del perfil
  const handleProfile = () => setOpenProfile(prev => !prev);

  // Abre una ventana específica del administrador
  const openWindow = (window) => {
    initialAdminMenu.hadleOpenWindows(window);
  };

  // Manejo de navegación de menú principal
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

  // Redirige a rutas de seguridad
  const onSeguridad = (ruta) => {
    router.push(`/Seguridad${ruta}`);
  };

  // Cierra la sesión del usuario
  const cerrarSesion = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div style={{ zIndex: 1050 }}>
      {/* Barra de navegación */}
      <Navbar bg="dark" variant="dark" expand="lg" className="justify-content-center">
        <Container>
          {/* Nombre de la aplicación */}
          <Navbar.Brand onClick={() => openMenu("inicio")}>
            <b>{nombreApp || "LogiCrack App"}</b>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">

              {/* Menú: Maestros */}
              {(configMenu.includes("maestros") || user?.id_rol === "Super administrador") && (
                <DropdownButton variant="dark" title="Maestros" onClick={() => openMenu("admin")}>
                  {/* Ítems del menú Maestros */}
                  {
                    menuCompleto.maestros.map(([key, label]) => {
                      if (configSubMenu.includes(label) || user?.id_rol === "Super administrador") return (
                        <Dropdown.Item key={key} onClick={() => openWindow(key)}>{label}</Dropdown.Item>
                      );
                    })}
                  {/* Configuración */}
                  <Dropdown.Item onClick={() => setOpenConfig(true)}>Configuración</Dropdown.Item>
                </DropdownButton>
              )}

              {/* Menú: Programaciones */}
              {configMenu.includes("programaciones") && (
                <DropdownButton variant="dark" title="Programaciones" onClick={() => openMenu("admin")}>
                  {menuCompleto.programaciones.map(([key, label]) => (
                    <Dropdown.Item key={key} onClick={() => openWindow(key)}>{label}</Dropdown.Item>
                  ))}
                </DropdownButton>
              )}

              {/* Menú: Seguridad */}
              {configMenu.includes("seguridad") && (
                <DropdownButton variant="dark" title="Seguridad">
                  {menuCompleto.seguridad.map(([ruta, label]) => {
                    if (configSubMenu.includes(label)) return (
                      <Dropdown.Item key={ruta} onClick={() => onSeguridad(ruta)}>{label}</Dropdown.Item>
                    );
                  })}
                </DropdownButton>
              )}

              {/* Menú: Almacén */}
              {configMenu.includes("almacen") && (
                <DropdownButton variant="dark" title="Almacén" onClick={() => openMenu("almacen")}>
                  <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                  <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                  <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                  <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                </DropdownButton>
              )}

              {/* Menú: Informes */}
              {configMenu.includes("informes") && (
                <DropdownButton variant="dark" title="Informes" onClick={() => openMenu("info")}>
                  <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                  <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
                  <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
                  <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
                </DropdownButton>
              )}
            </Nav>

            {/* Botones de usuario */}
            <ButtonGroup size="sm">
              <Button variant="dark" onClick={handleProfile}>
                {user?.nombre} {user?.apellido}
              </Button>
              <Button variant="dark" onClick={cerrarSesion}>Cerrar sesión</Button>
            </ButtonGroup>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Ventanas emergentes: Perfil y Configuración */}
      {openProfile && <NuevoUsuario setOpen={setOpenProfile} setAlert={setAlert} user={user} profile={true} />}
      {openConfig && <Configuracion setOpen={setOpenConfig} />}
    </div>
  );
};

export default Header;

