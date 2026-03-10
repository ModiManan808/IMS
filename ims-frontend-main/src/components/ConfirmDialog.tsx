import React, { useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const ICONS = {
    danger: <AlertCircle size={24} />,
    warning: <AlertTriangle size={24} />,
    info: <Info size={24} />,
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
    onConfirm,
    onCancel,
}) => {
    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div
                className={`confirm-dialog confirm-dialog-${type}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
            >
                <div className={`confirm-icon-wrap confirm-icon-${type}`}>
                    {ICONS[type]}
                </div>
                <h3 id="confirm-title" className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="confirm-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`confirm-btn-ok confirm-btn-ok-${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
