import { useState, useCallback, useContext } from 'react';
import { ToastItem, ToastType } from '../components/Toast';
import { ToastContext } from '../context/ToastContext';

/** Standalone hook — manages its own state.
 *  Use this ONLY in the root App component to power the ToastContainer.
 *  Everywhere else, use `useToastContext()`. */
export const useToastState = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback(
        (message: string, type: ToastType = 'info', duration = 5000): string => {
            const id = Math.random().toString(36).slice(2, 11);
            setToasts((prev) => [...prev, { id, message, type, duration }]);
            return id;
        },
        [],
    );

    const showSuccess = useCallback((msg: string, dur = 5000) => addToast(msg, 'success', dur), [addToast]);
    const showError = useCallback((msg: string, dur = 0) => addToast(msg, 'error', dur), [addToast]);
    const showWarning = useCallback((msg: string, dur = 5000) => addToast(msg, 'warning', dur), [addToast]);
    const showInfo = useCallback((msg: string, dur = 5000) => addToast(msg, 'info', dur), [addToast]);

    return { toasts, removeToast, showSuccess, showError, showWarning, showInfo };
};

/** Consumer hook — use this in any component that needs toasts. */
export const useToast = () => useContext(ToastContext);
