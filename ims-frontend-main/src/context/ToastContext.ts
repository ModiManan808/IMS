import { createContext } from 'react';

export interface ToastContextValue {
    showSuccess: (msg: string, duration?: number) => string;
    showError: (msg: string, duration?: number) => string;
    showWarning: (msg: string, duration?: number) => string;
    showInfo: (msg: string, duration?: number) => string;
}

const noop = (_msg: string, _dur?: number): string => '';

export const ToastContext = createContext<ToastContextValue>({
    showSuccess: noop,
    showError: noop,
    showWarning: noop,
    showInfo: noop,
});
