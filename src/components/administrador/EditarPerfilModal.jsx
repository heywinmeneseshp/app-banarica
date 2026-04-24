import React, { useEffect, useState } from 'react';
import axios from 'axios';

import endPoints from '@services/api';
import { actualizarUsuario } from '@services/api/usuarios';
import { setStoredUser } from 'utils/session';

const EMPTY_PASSWORD_STATE = {
    oldPassword: '',
    newPassword: '',
    repeatPassword: '',
};

export default function EditarPerfilModal({ open, onClose, user, setAlert, onUserUpdated }) {
    const [formValues, setFormValues] = useState({
        username: '',
        email: '',
        nombre: '',
        apellido: '',
        tel: '',
    });
    const [passwordValues, setPasswordValues] = useState(EMPTY_PASSWORD_STATE);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (!open || !user) {
            return;
        }

        setFormValues({
            username: user.username || '',
            email: user.email || '',
            nombre: user.nombre || '',
            apellido: user.apellido || '',
            tel: user.tel || '',
        });
        setPasswordValues(EMPTY_PASSWORD_STATE);
        setShowPasswordForm(false);
    }, [open, user]);

    if (!open) {
        return null;
    }

    const handleProfileChange = ({ target }) => {
        const { name, value } = target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = ({ target }) => {
        const { name, value } = target;
        setPasswordValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        try {
            setSavingProfile(true);
            await actualizarUsuario(user.username, {
                email: formValues.email,
                nombre: formValues.nombre,
                apellido: formValues.apellido,
                tel: formValues.tel,
            });

            const updatedUser = {
                ...user,
                email: formValues.email,
                nombre: formValues.nombre,
                apellido: formValues.apellido,
                tel: formValues.tel,
            };

            setStoredUser(updatedUser);
            if (onUserUpdated) {
                onUserUpdated(updatedUser);
            }

            if (setAlert) {
                setAlert({
                    active: true,
                    mensaje: 'El perfil se actualizo correctamente',
                    color: 'success',
                    autoClose: true
                });
            }

            window.alert('Perfil actualizado correctamente.');
            onClose(false);
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            window.alert('No fue posible actualizar el perfil.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async () => {
        const { oldPassword, newPassword, repeatPassword } = passwordValues;

        if (!oldPassword || !newPassword || !repeatPassword) {
            window.alert('Debes completar todos los campos de contraseña.');
            return;
        }

        if (newPassword !== repeatPassword) {
            window.alert('Las contraseñas nuevas deben coincidir.');
            return;
        }

        if (oldPassword === newPassword) {
            window.alert('La nueva contraseña debe ser diferente a la actual.');
            return;
        }

        try {
            setSavingPassword(true);
            await axios.post(endPoints.auth.login, {
                username: user.username,
                password: oldPassword
            });

            await actualizarUsuario(user.username, { password: newPassword });
            setPasswordValues(EMPTY_PASSWORD_STATE);
            setShowPasswordForm(false);
            window.alert('La contraseña se actualizo correctamente.');
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            window.alert('La contraseña actual es incorrecta o no fue posible actualizarla.');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header">
                            <div>
                                <h5 className="modal-title mb-1">Mi perfil</h5>
                                <div className="small text-muted">
                                    Actualiza tu información personal y, si lo necesitas, cambia tu contraseña.
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => onClose(false)}
                                aria-label="Cerrar"
                            />
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleProfileSubmit}>
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label htmlFor="profile-username" className="form-label">Usuario</label>
                                        <input
                                            id="profile-username"
                                            name="username"
                                            type="text"
                                            className="form-control"
                                            value={formValues.username}
                                            disabled
                                        />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label htmlFor="profile-email" className="form-label">Correo</label>
                                        <input
                                            id="profile-email"
                                            name="email"
                                            type="email"
                                            className="form-control"
                                            value={formValues.email}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label htmlFor="profile-nombre" className="form-label">Nombre</label>
                                        <input
                                            id="profile-nombre"
                                            name="nombre"
                                            type="text"
                                            className="form-control"
                                            value={formValues.nombre}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label htmlFor="profile-apellido" className="form-label">Apellido</label>
                                        <input
                                            id="profile-apellido"
                                            name="apellido"
                                            type="text"
                                            className="form-control"
                                            value={formValues.apellido}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <label htmlFor="profile-tel" className="form-label">Teléfono</label>
                                        <input
                                            id="profile-tel"
                                            name="tel"
                                            type="text"
                                            className="form-control"
                                            value={formValues.tel}
                                            onChange={handleProfileChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-4 pt-3 border-top">
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning"
                                        onClick={() => {
                                            setShowPasswordForm((prev) => !prev);
                                            setPasswordValues(EMPTY_PASSWORD_STATE);
                                        }}
                                    >
                                        {showPasswordForm ? 'Cancelar cambio de contraseña' : 'Cambiar contraseña'}
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-success px-4"
                                        disabled={savingProfile}
                                    >
                                        {savingProfile ? 'Guardando...' : 'Guardar perfil'}
                                    </button>
                                </div>
                            </form>

                            {showPasswordForm && (
                                <div className="mt-4 pt-3 border-top">
                                    <div className="row g-3">
                                        <div className="col-12 col-md-4">
                                            <label htmlFor="old-password" className="form-label">Contraseña actual</label>
                                            <input
                                                id="old-password"
                                                name="oldPassword"
                                                type="password"
                                                className="form-control"
                                                value={passwordValues.oldPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label htmlFor="new-password" className="form-label">Nueva contraseña</label>
                                            <input
                                                id="new-password"
                                                name="newPassword"
                                                type="password"
                                                className="form-control"
                                                value={passwordValues.newPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>

                                        <div className="col-12 col-md-4">
                                            <label htmlFor="repeat-password" className="form-label">Repite la nueva contraseña</label>
                                            <input
                                                id="repeat-password"
                                                name="repeatPassword"
                                                type="password"
                                                className="form-control"
                                                value={passwordValues.repeatPassword}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-warning px-4"
                                            onClick={handlePasswordSubmit}
                                            disabled={savingPassword}
                                        >
                                            {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
}
