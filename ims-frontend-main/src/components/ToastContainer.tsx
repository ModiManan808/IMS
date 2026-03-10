import React from 'react';
import Toast, { ToastItem } from './Toast';
import './Toast.css';

interface ToastContainerProps {
    toasts: ToastItem[];
    onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container" aria-live="polite" aria-atomic="false">
            {toasts.map((t) => (
                <Toast key={t.id} {...t} onClose={onClose} />
            ))}
        </div>
    );
};

export default ToastContainer;
