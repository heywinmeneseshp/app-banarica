import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
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
import NuevoUsuario from './administrador/NuevoUsuario';
//Assets
//Imagenes
import config from '@public/images/config.png';

//CSS
import styles from '@styles/header.module.css';
import endPoints from '@services/api';
import AsideNotificaciones from '@assets/AsideNotificaciones';
import { buscarUsuario } from '@services/api/usuarios';
import Image from 'next/image';
import Configuracion from './administrador/Configuracion';

const Header = () => {
    const router = useRouter();
    const { setAlert } = useAlert();
    const { user, setUser } = useAuth();
    const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu } = useContext(AppContext);
    const [notiNumber, setNotiNumber] = useState("");
    const [notificaciones, setNotificaciones] = useState([]);
    const [openNoti, setOpenNoti] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);
    const [openConfig, setOpenConfig] = useState(false);

    useEffect(() => {
        const listar = async () => {
            const body = {
                "almacen_receptor": user.username,
                "visto": false,
                "aprobado": true
            };
            const res = await axios.post(endPoints.notificaciones.filter, body);
            setNotiNumber(res.data.length);
            setNotificaciones(res.data);
            buscarUsuario(user.username).then(res => setUser(res));
        };
        listar();
    }, [openNoti, openProfile, initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu]);

    const hadleNoti = () => {
        setOpenNoti(!openNoti);
    };

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
                <Navbar className='justify' bg="primary" variant="dark">

                    <div className='display-mobile' id="menuToggle">
                        <input type="checkbox" />
                        <span></span>
                        <span></span>
                        <span></span>
                        <ul id="menu">
                            {(user?.id_rol == "Super administrador") &&
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
                                </NavDropdown>}
                            {(user.id_rol == "seguridad" || user.id_rol == "Super seguridad") &&
                                <NavDropdown title="Seguridad" drop='end' id="nav-dropdown">
                                    <Dropdown.Item onClick={() => onSeguridad("/Recepcion")}>Recepción</Dropdown.Item>
                                    <Dropdown.Item onClick={() => onSeguridad("/Transferencias")}>Transferencias</Dropdown.Item>
                                    <Dropdown.Item onClick={() => onSeguridad("/Disponibles")}>Disponibles</Dropdown.Item>
                                    {user.id_rol == "Super seguridad" && <Dropdown.Item onClick={() => onSeguridad("/Usuarios")}>Usuarios</Dropdown.Item>}
                                </NavDropdown>}
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
                        <Navbar.Brand onClick={inicio}>LogiCrack</Navbar.Brand>
                        {initialMenu.navBar &&
                            <Nav className="me-auto">
                                {(user?.id_rol == "Super administrador") &&
                                    <DropdownButton className={styles.itemMenuAdmin} onClick={() => openMenu("admin")} id="dropdown-basic-button" title="Administrador">
                                        <Dropdown.Item onClick={() => openWindow("usuarios")} >Usuarios</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("productos")}>Productos</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("combos")}>Combos</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("categorias")}>Categorias</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("proveedores")}>Proveedores</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("bodegas")}>Almacenes</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("transporte")}>Transporte</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("etiquetas")}>Etiquetas</Dropdown.Item>
                                        <Dropdown.Item onClick={() => setOpenConfig(true)} className={styles.configButton}>
                                            <Image className={styles.imgConfig} width="15" height="15" src={config} alt="configuración" />
                                            <span className={styles.textConfig}>Configuración</span>
                                        </Dropdown.Item>
                                    </DropdownButton>}
                                {(user.id_rol == "seguridad" || user.id_rol == "Super seguridad") &&
                                    <DropdownButton id="dropdown-basic-button" title="Seguridad">
                                        <Dropdown.Item onClick={() => onSeguridad("/Recepcion")}>Recepción</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onSeguridad("/Transferencias")}>Transferencias</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onSeguridad("/Disponibles")}>Disponibles</Dropdown.Item>
                                        {(user.id_rol == "Super seguridad") && <Dropdown.Item onClick={() => onSeguridad("/Usuarios")}>Usuarios</Dropdown.Item>}
                                    </DropdownButton>}

                                <DropdownButton onClick={() => openMenu("almacen")} className={styles.itemMenu} id="dropdown-basic-button" title="Almacén">
                                    <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                                    <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                                    <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                                    <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                                </DropdownButton>

                                <DropdownButton onClick={() => openMenu("info")} className={styles.itemMenu} id="dropdown-basic-button" title="Informes">
                                    <Dropdown.Item onClick={initialInfoMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                                    <Dropdown.Item onClick={initialInfoMenu.handleStock}>Stock</Dropdown.Item>
                                    <Dropdown.Item onClick={initialInfoMenu.handleTraslados}>Traslados</Dropdown.Item>
                                    <Dropdown.Item onClick={initialInfoMenu.handlePedidos}>Pedidos</Dropdown.Item>
                                </DropdownButton>

                            </Nav>
                        }
                        <ButtonGroup size="sm">
                            <div tabIndex={0} role="button" onKeyDown={hadleNoti} onClick={hadleNoti} className={styles.circulo}><h2 className={styles.number}>{notiNumber}</h2></div>
                            <div className={styles.noti}>

                            </div>
                            <Button onClick={handleProfile}>{user.nombre} {user.apellido}</Button>
                        </ButtonGroup>

                        <ButtonGroup size="sm">
                            <Button onClick={() => cerrarSesion()}>Cerrar sesión</Button>
                        </ButtonGroup>

                    </span>



                </Navbar>
                {openNoti && <AsideNotificaciones setNotificaciones={setNotificaciones} notificaciones={notificaciones} />}
                {openProfile && <NuevoUsuario setOpen={setOpenProfile} setAlert={setAlert} user={user} profile={true} />}
                {openConfig && <Configuracion setOpen={setOpenConfig} />}
            </div>

        </>
    );
};

export default Header;