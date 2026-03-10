import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastProps extends ToastItem {
    onClose: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
};

const Toast: React.FC<ToastProps> = ({ id, message, type, duration, onClose }) => {
    const [exiting, setExiting] = useState(false);

    const dismiss = () => {
        setExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    useEffect(() => {
        if (duration > 0) {
            const t = setTimeout(dismiss, duration);
            return () => clearTimeout(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, duration]);

    return (
        <div className={`toast toast-${type} ${exiting ? 'toast-exit' : ''}`} role="alert">
            <span className="toast-icon">{ICONS[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={dismiss} aria-label="Dismiss">
                <X size={14} />
            </button>
            {duration > 0 && (
                <div
                    className="toast-progress"
                    style={{ animationDuration: `${duration}ms` }}
                />
            )}
        </div>
    );
};

export default Toast;
