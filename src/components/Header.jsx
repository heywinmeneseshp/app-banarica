import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AppContext from '@context/AppContext';
import { useRouter } from 'next/router';
//Hooks
import { useAuth } from '@hooks/useAuth';
import useAlert from '@hooks/useAlert';
//Bootstrap
import { Navbar } from 'react-bootstrap';
import { Nav } from 'react-bootstrap';
import { Container } from 'react-bootstrap';
import { DropdownButton } from 'react-bootstrap';
import { Dropdown, Button, ButtonGroup } from 'react-bootstrap';
//Components
import NuevoUsuario from './administrador/NuevoUsuario';
//Assets

//CSS
import styles from '@styles/header.module.css';
import endPoints from '@services/api';
import AsideNotificaciones from '@assets/AsideNotificaciones';
import { buscarUsuario } from '@services/api/usuarios';

const Header = () => {
    const router = useRouter();
    const { setAlert } = useAlert();
    const { user, setUser } = useAuth();
    const { initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu, gestionNotificacion } = useContext(AppContext);
    const [notiNumber, setNotiNumber] = useState("");
    const [notificaciones, setNotificaciones] = useState([]);
    const [openNoti, setOpenNoti] = useState(false);
    const [openProfile, setOpenProfile] = useState(false);

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
    }, [openNoti, openProfile, initialMenu, initialAdminMenu, initialAlmacenMenu, initialInfoMenu, gestionNotificacion]);

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

    return (
        <>
            <div className="header">
                <Navbar bg="primary" variant="dark">
                    <Container>
                        <Navbar.Brand onClick={inicio}>Banarica</Navbar.Brand>
                        {initialMenu.navBar &&
                            <Nav className="me-auto">
                                {(user?.id_rol == "Super administrador") &&
                                    <DropdownButton onClick={() => openMenu("admin")} className={styles.itemMenu} id="dropdown-basic-button" title="Administrador">
                                        <Dropdown.Item onClick={() => openWindow("usuarios")} >Usuarios</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("productos")}>Productos</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("combos")}>Combos</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("categorias")}>Categorias</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("proveedores")}>Proveedores</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("bodegas")}>Almacenes</Dropdown.Item>
                                        <Dropdown.Item onClick={() => openWindow("transporte")}>Transporte</Dropdown.Item>
                                    </DropdownButton>}

                                <DropdownButton onClick={() => openMenu("almacen")} className={styles.itemMenu} id="dropdown-basic-button" title="Almacén">
                                    <Dropdown.Item onClick={initialAlmacenMenu.handleRecepcion}>Recepción</Dropdown.Item>
                                    <Dropdown.Item onClick={initialAlmacenMenu.handleTraslados}>Traslados</Dropdown.Item>
                                    {(user?.id_rol == "Administrador" || "Super Administrador") &&
                                        <span>
                                            <Dropdown.Item onClick={initialAlmacenMenu.handlePedidos}>Pedidos</Dropdown.Item>
                                            <Dropdown.Item onClick={initialAlmacenMenu.handleMovimientos}>Movimientos</Dropdown.Item>
                                        </span>
                                    }
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
                            <div tabIndex={0} role="button" onKeyDown={hadleNoti}  onClick={hadleNoti} className={styles.circulo}><h2 className={styles.number}>{notiNumber}</h2></div>
                            <div className={styles.noti}>

                            </div>
                            <Button onClick={handleProfile}>{user.nombre} {user.apellido}</Button>
                        </ButtonGroup>

                    </Container>

                </Navbar>
                {openNoti && <AsideNotificaciones notificaciones={notificaciones} />}
                {openProfile && <NuevoUsuario setOpen={setOpenProfile} setAlert={setAlert} user={user} profile={true} />}
            </div>
            
        </>
    );
};

export default Header;