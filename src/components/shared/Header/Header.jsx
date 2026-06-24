// Importacion de dependencias necesarias
import React, { useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

// Constantes
const SUPER_ADMIN_ROLE = "Super administrador";
const DEFAULT_MENU_KEYS = Object.keys(menuCompleto);

// Componente de menú reutilizable
const MenuDropdown = ({ title, items, variant = "dark", onItemClick, isVisible, userRole, configSubMenu }) => {
  if (!isVisible) return null;

  const handleItemClick = (item, key) => {
    if (typeof item === 'function') {
      item();
    } else if (onItemClick) {
      onItemClick(item, key);
    }
  };

  return (
    <DropdownButton variant={variant} title={title}>
      {items.map((item, index) => {
        const [key, label] = Array.isArray(item) ? item : [index, item];
        const isVisibleItem = configSubMenu.includes(label) || userRole === SUPER_ADMIN_ROLE;
        
        if (!isVisibleItem) return null;
        
        return (
          <Dropdown.Item key={key} onClick={() => handleItemClick(item, key)}>
            {label}
          </Dropdown.Item>
        );
      })}
    </DropdownButton>
  );
};

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
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Verificar si es super admin
  const isSuperAdmin = useMemo(() => user?.id_rol === SUPER_ADMIN_ROLE, [user?.id_rol]);

  // Verificar acceso a menús
  const hasMenuAccess = useCallback((menuName) => {
    return configMenu.includes(menuName) || isSuperAdmin;
  }, [configMenu, isSuperAdmin]);

  // Función para cargar configuración del usuario
  const loadUserConfig = useCallback(async (usuario) => {
    setIsLoadingConfig(true);
    try {
      const res = await encontrarModulo(usuario.username);
      
      // Validar respuesta
      if (!res?.[0]?.detalles) {
        throw new Error('Configuración no encontrada');
      }
      
      const detalles = JSON.parse(res[0].detalles);
      setConfigMenu(detalles.menu || []);
      setConfigSubMenu(detalles.submenu || []);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      
      // Fallback para super admin
      if (isSuperAdmin) {
        setConfigMenu(DEFAULT_MENU_KEYS);
        setConfigSubMenu([]);
      }
    } finally {
      setIsLoadingConfig(false);
    }
  }, [isSuperAdmin]);

  // Cargar nombre de la empresa
  const loadCompanyName = useCallback(async () => {
    try {
      const res = await encontrarEmpresa();
      setNombreApp(res?.nombreComercial || null);
    } catch (error) {
      console.error('Error al cargar nombre de empresa:', error);
      setNombreApp(null);
    }
  }, []);

  // Efecto principal
  useEffect(() => {
    const token = getToken();
    const usuario = user || getStoredUser();

    if (!usuario || !token) {
      setIsLoadingConfig(false);
      return;
    }

    if (usuario && !user) {
      setUser(usuario);
    }

    loadCompanyName();
    loadUserConfig(usuario);
    setAlmacenByUser(getStoredWarehouses());
  }, [user, setUser, setAlmacenByUser, loadCompanyName, loadUserConfig]);

  // Handlers
  const handleProfile = useCallback(() => setOpenProfile(prev => !prev), []);
  const handleOpenWindow = useCallback((window) => initialAdminMenu.hadleOpenWindows(window), [initialAdminMenu]);
  
  const openMenu = useCallback((itemMenu) => {
    if (router.pathname !== "/") {
      router.push("/");
    }

    const menuActions = {
      admin: initialMenu.handleAdministrador,
      almacen: initialMenu.handleAlmacen,
      info: initialMenu.handleInformes,
      inicio: initialMenu.handleInicio
    };
    menuActions[itemMenu]?.();
  }, [router, initialMenu]);

  const onSeguridad = useCallback((ruta) => {
    router.push(`/Seguridad${ruta}`);
  }, [router]);

  const almacenActions = useMemo(() => ({
    movimientos: initialAlmacenMenu.handleMovimientos,
    pedidos: initialAlmacenMenu.handlePedidos,
    recepcion: initialAlmacenMenu.handleRecepcion,
    traslados: initialAlmacenMenu.handleTraslados
  }), [initialAlmacenMenu]);

  const infoActions = useMemo(() => ({
    movimientos: initialInfoMenu.handleMovimientos,
    pedidos: initialInfoMenu.handlePedidos,
    stock: initialInfoMenu.handleStock,
    traslados: initialInfoMenu.handleTraslados,
    temperatura: initialInfoMenu.handleTemperatura
  }), [initialInfoMenu]);

  const cerrarSesion = useCallback(() => {
    clearSession();
    router.push('/login');
  }, [router]);

  // Configuración de menús
  const menuConfigs = useMemo(() => ({
    maestros: {
      title: "Maestros",
      items: [...menuCompleto.maestros, ['configuracion', 'Configuracion']],
      onItemClick: (item) => {
        if (item[1] === 'Configuracion') {
          setOpenConfig(true);
        } else {
          openMenu('admin');
          handleOpenWindow(item[0]);
        }
      }
    },
    transporte: {
      title: "Transporte",
      items: menuCompleto.transporte,
      onItemClick: (item) => router.push(`/Transporte${item[0]}`)
    },
    seguridad: {
      title: "Seguridad",
      items: menuCompleto.seguridad,
      onItemClick: (item) => onSeguridad(item[0])
    },
    almacen: {
      title: "Almacen",
      items: menuCompleto.almacen,
      onItemClick: (item) => {
        openMenu('almacen');
        almacenActions[item[0]]?.();
      }
    },
    informes: {
      title: "Informes",
      items: menuCompleto.informes,
      onItemClick: (item) => {
        openMenu('info');
        infoActions[item[0]]?.();
      }
    }
  }), [almacenActions, handleOpenWindow, infoActions, onSeguridad, openMenu, router]);

  // Renderizar menús dinámicamente
  const renderMenu = (menuKey) => {
    const config = menuConfigs[menuKey];
    if (!config || !hasMenuAccess(menuKey)) return null;

    return (
      <MenuDropdown
        title={config.title}
        items={config.items}
        onItemClick={config.onItemClick}
        isVisible={true}
        userRole={user?.id_rol}
        configSubMenu={configSubMenu}
      />
    );
  };

  // Si está cargando configuración, mostrar versión simplificada o skeleton
  if (isLoadingConfig) {
    return (
      <div className="sticky-top shadow-sm" style={{ zIndex: 1050 }}>
        <Navbar bg="dark" variant="dark" expand="lg" className="py-2 w-100">
          <Container fluid="xl" className="px-2 px-sm-3">
            <Navbar.Brand className="me-2 text-truncate" style={{ maxWidth: 'calc(100vw - 56px)', minWidth: 0 }}>
              <b>Cargando...</b>
            </Navbar.Brand>
          </Container>
        </Navbar>
      </div>
    );
  }

  return (
    <div className="sticky-top shadow-sm" style={{ zIndex: 1050 }}>
      <Navbar bg="dark" variant="dark" expand="lg" className="py-2 w-100">
        <Container fluid="xl" className="px-2 px-sm-3">
          <Navbar.Brand
            onClick={() => openMenu("inicio")}
            className="me-2 text-truncate"
            style={{ cursor: 'pointer', maxWidth: 'calc(100vw - 72px)', minWidth: 0 }}
          >
            <b>{nombreApp || "LogiCrack App"}</b>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="navbar-nav" className="ms-auto flex-shrink-0" />
          <Navbar.Collapse id="navbar-nav" className="pt-3 pt-lg-0">
            <Nav className="me-auto align-items-lg-center gap-lg-1 flex-lg-row">
              {renderMenu('maestros')}
              {renderMenu('transporte')}
              {renderMenu('seguridad')}
              {renderMenu('almacen')}
              {renderMenu('informes')}
            </Nav>

            <div className="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-lg-end gap-2 w-100 w-lg-auto mt-3 mt-lg-0 ms-lg-auto">
              <Button
                variant="link"
                size="sm"
                onClick={handleProfile}
                className="w-auto d-inline-flex align-items-center justify-content-center gap-2 px-2 py-1 text-lg-nowrap text-white text-decoration-none border-0 shadow-none"
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
