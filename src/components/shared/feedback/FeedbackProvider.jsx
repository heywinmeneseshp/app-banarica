import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Modal, Toast, ToastContainer } from 'react-bootstrap';
import FeedbackContext from '@context/FeedbackContext';

const DEFAULT_CONFIRM = {
  title: 'Confirmar accion',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'primary',
};

let feedbackSequence = 0;

export default function FeedbackProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: DEFAULT_CONFIRM.title,
    message: '',
    confirmLabel: DEFAULT_CONFIRM.confirmLabel,
    cancelLabel: DEFAULT_CONFIRM.cancelLabel,
    variant: DEFAULT_CONFIRM.variant,
  });
  const confirmResolverRef = useRef(null);

  const closeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback((message, options = {}) => {
    if (!message) {
      return;
    }

    const id = ++feedbackSequence;
    const {
      variant = 'info',
      title = '',
      autoClose = true,
      delay = 3500,
    } = options;

    setNotifications((prev) => [
      ...prev,
      {
        id,
        message,
        variant,
        title,
        autoClose,
        delay,
      },
    ]);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const resolveConfirm = useCallback((result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }

    setConfirmState({
      open: false,
      title: DEFAULT_CONFIRM.title,
      message: '',
      confirmLabel: DEFAULT_CONFIRM.confirmLabel,
      cancelLabel: DEFAULT_CONFIRM.cancelLabel,
      variant: DEFAULT_CONFIRM.variant,
    });
  }, []);

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    confirmResolverRef.current = resolve;
    setConfirmState({
      open: true,
      title: options.title || DEFAULT_CONFIRM.title,
      message: options.message || '',
      confirmLabel: options.confirmLabel || DEFAULT_CONFIRM.confirmLabel,
      cancelLabel: options.cancelLabel || DEFAULT_CONFIRM.cancelLabel,
      variant: options.variant || DEFAULT_CONFIRM.variant,
    });
  }), []);

  const contextValue = useMemo(() => ({
    notify,
    clearNotifications,
    confirm,
  }), [clearNotifications, confirm, notify]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const originalAlert = window.alert;
    window.alert = (message) => {
      notify(String(message || 'Ocurrio un evento en la aplicacion.'), {
        variant: 'warning',
        autoClose: false,
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [notify]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1090 }}>
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            bg={notification.variant}
            onClose={() => closeNotification(notification.id)}
            autohide={notification.autoClose}
            delay={notification.delay}
          >
            {(notification.title || notification.variant === 'danger' || notification.variant === 'warning') && (
              <Toast.Header closeButton>
                <strong className="me-auto">
                  {notification.title || (notification.variant === 'danger' ? 'Atencion' : 'Aviso')}
                </strong>
              </Toast.Header>
            )}
            <Toast.Body className={notification.variant === 'light' ? '' : 'text-white'}>
              {notification.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      <Modal
        show={confirmState.open}
        onHide={() => resolveConfirm(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>{confirmState.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant={confirmState.variant === 'danger' ? 'danger' : 'light'} className="mb-0">
            {confirmState.message}
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => resolveConfirm(false)}>
            {confirmState.cancelLabel}
          </Button>
          <Button variant={confirmState.variant} onClick={() => resolveConfirm(true)}>
            {confirmState.confirmLabel}
          </Button>
        </Modal.Footer>
      </Modal>
    </FeedbackContext.Provider>
  );
}
