// Importacion de dependencias necesarias
import React, { useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Navbar, Nav, DropdownButton, Dropdown, Button, Container } from 'react-bootstrap';
import { FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

import { useAuth } from '@hooks/useAuth';
import useAlert from '@hooks/useAlert';
import AppContext from '@context/AppContext';

import EditarPerfilModal from "@components/administrador/EditarPerfilModal";
import Configuracion from '@components/administrador/Configuracion';

import { encontrarEmpresa, encontrarModulo } from '@services/api/configuracion';
import { menuCompleto } from 'utils/configMenu';
import { clearSession, getStoredUser, getStoredWarehouses, getToken } from 'utils/session';

const Header = () => {
  const router = useRouter();
  const { setAlert } = useAlert();
  const { user, setUser, setAlmacenByUser } = useAuth();
  const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu } = useContext(AppContext);

  const [openProfile, setOpenProfile] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [nombreApp, setNombreApp] = useState(null);
  const [configMenu, setConfigMenu] = useState([]);
  const [configSubMenu, setConfigSubMenu] = useState([]);

  useEffect(() => {
    const token = getToken();
    const usuario = user || getStoredUser();

    if (usuario && !user) {
      setUser(usuario);
    }

    if (!usuario || !token) {
      return;
    }

    encontrarEmpresa().then(res => setNombreApp(res.nombreComercial));

    encontrarModulo(usuario.username).then(res => {
      try {
        // Validar que la respuesta existe y tiene datos
        if (!res || !Array.isArray(res) || res.length === 0) {
          console.warn('No se encontró configuración de módulos para el usuario');
          // Proporcionar configuración por defecto según rol
          if (usuario.id_rol === "Super administrador") {
            setConfigMenu(["maestros", "programaciones", "seguridad", "almacen", "informes"]);
            setConfigSubMenu([]);
          }
          return;
        }

        // Validar que detalles no es null/undefined
        if (!res[0].detalles) {
          console.warn('Configuración vacía para el usuario, usando valores por defecto');
          if (usuario.id_rol === "Super administrador") {
            setConfigMenu(["maestros", "programaciones", "seguridad", "almacen", "informes"]);
            setConfigSubMenu([]);
          }
          return;
        }

        // Parsear con fallback
        const detalles = JSON.parse(res[0].detalles || "{}");
        setConfigMenu(detalles.menu || []);
        setConfigSubMenu(detalles.submenu || []);
      } catch (error) {
        console.error('Error al procesar configuración de módulos:', error);
        // Fallback: permitir acceso a todos los módulos para Super Admin
        if (usuario.id_rol === "Super administrador") {
          setConfigMenu(["maestros", "programaciones", "seguridad", "almacen", "informes"]);
          setConfigSubMenu([]);
        }
      }
    }).catch(error => {
      if (error?.response?.status === 401) {
        return;
      }

      console.error('Error al obtener módulos:', error);
      // Fallback en caso de error en la llamada
      if (usuario.id_rol === "Super administrador") {
        setConfigMenu(["maestros", "programaciones", "seguridad", "almacen", "informes"]);
        setConfigSubMenu([]);
      }
    });

    setAlmacenByUser(getStoredWarehouses());
  }, [user, setUser, setAlmacenByUser]);

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

  const onSeguridad = (ruta) => {
    router.push(`/Seguridad${ruta}`);
  };

  const cerrarSesion = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="sticky-top shadow-sm" style={{ zIndex: 1050 }}>
      <Navbar bg="dark" variant="dark" expand="lg" className="py-2">
        <Container fluid="xl">
          <Navbar.Brand onClick={() => openMenu("inicio")}>
            <b>{nombreApp || "LogiCrack App"}</b>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav" className="pt-3 pt-lg-0">
            <Nav className="me-auto align-items-lg-center gap-lg-1 flex-lg-row">
              {(configMenu.includes("maestros") || user?.id_rol === "Super administrador") && (
                <DropdownButton variant="dark" title="Maestros" onClick={() => openMenu("admin")}>
                  {menuCompleto.maestros.map(([key, label]) => {
                    if (configSubMenu.includes(label) || user?.id_rol === "Super administrador") {
                      return (
                        <Dropdown.Item key={key} onClick={() => openWindow(key)}>{label}</Dropdown.Item>
                      );
                    }

                    return null;
                  })}
                  <Dropdown.Item onClick={() => setOpenConfig(true)}>Configuracion</Dropdown.Item>
                </DropdownButton>
              )}

              {configMenu.includes("programaciones") && (
                <DropdownButton variant="dark" title="Programaciones" onClick={() => openMenu("admin")}>
                  {menuCompleto.programaciones.map(([key, label]) => (
                    <Dropdown.Item key={key} onClick={() => openWindow(key)}>{label}</Dropdown.Item>
                  ))}
                </DropdownButton>
              )}

              {configMenu.includes("seguridad") && (
                <DropdownButton variant="dark" title="Seguridad">
                  {menuCompleto.seguridad.map(([ruta, label]) => {
                    if (configSubMenu.includes(label) || user?.id_rol === "Super administrador") {
                      return (
                        <Dropdown.Item key={ruta} onClick={() => onSeguridad(ruta)}>{label}</Dropdown.Item>
                      );
                    }

                    return null;
                  })}
                </DropdownButton>
              )}

              {configMenu.includes("almacen") && (
                <DropdownButton variant="dark" title="Almacen" onClick={() => openMenu("almacen")}>
                  <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                  <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                  <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepcion</Dropdown.Item>
                  <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                </DropdownButton>
              )}

              {configMenu.includes("informes") && (
                <DropdownButton variant="dark" title="Informes" onClick={() => openMenu("info")}>
                  <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                  <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
                  <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
                  <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
                </DropdownButton>
              )}
            </Nav>

            <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-lg-end gap-2 w-100 w-lg-auto mt-3 mt-lg-0 ms-lg-auto">
              <Button
                variant="link"
                size="sm"
                onClick={handleProfile}
                className="w-auto d-inline-flex align-items-center justify-content-center gap-2 px-2 py-1 text-nowrap text-white text-decoration-none border-0 shadow-none"
              >
                <FaUserCircle />
                {user?.nombre} {user?.apellido}
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={cerrarSesion}
                className="w-auto d-inline-flex align-items-center justify-content-center px-2 py-1 text-white text-decoration-none border-0 shadow-none"
                title="Cerrar sesion"
                aria-label="Cerrar sesion"
              >
                <FaSignOutAlt />
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {openProfile && (
        <EditarPerfilModal
          open={openProfile}
          onClose={setOpenProfile}
          setAlert={setAlert}
          user={user}
          onUserUpdated={setUser}
        />
      )}
      {openConfig && <Configuracion setOpen={setOpenConfig} />}
    </div>
  );
};

export default Header;
