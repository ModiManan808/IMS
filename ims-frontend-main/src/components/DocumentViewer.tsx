import React, { useState, useEffect } from 'react';
import { ZoomIn, Download, ExternalLink, Loader2 } from 'lucide-react';
import './DocumentViewer.css';

interface DocumentViewerProps {
    type: 'image' | 'pdf';
    url: string;
    alt: string;
    label: string;
}

/**
 * Fetches a file from an authenticated endpoint (JWT from localStorage)
 * and returns a local blob URL so it can be used in <img> / <iframe> / download links.
 * Uses AbortController to cancel in-flight requests on unmount or URL change.
 */
function useBlobUrl(apiRelativePath: string) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // Keep a ref to the current objectUrl so the cleanup always has access,
    // even if abort fires after response.blob() resolves but before the ref updates.
    const objectUrlRef = React.useRef<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const revokeCurrent = () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };

        const fetchBlob = async () => {
            setLoading(true);
            setError(false);
            setBlobUrl(null);
            revokeCurrent(); // revoke any previous URL

            try {
                const token = localStorage.getItem('token');
                const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const fullUrl = `${base}/api${apiRelativePath}`;

                const response = await fetch(fullUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    signal: controller.signal,
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const blob = await response.blob();

                // If aborted during response.blob(), discard and revoke immediately
                if (controller.signal.aborted) return;

                const newUrl = URL.createObjectURL(blob);
                objectUrlRef.current = newUrl;
                setBlobUrl(newUrl);
            } catch (err: any) {
                if (err.name !== 'AbortError') setError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchBlob();

        return () => {
            controller.abort();
            revokeCurrent(); // always revoke on unmount / url change
        };
    }, [apiRelativePath]);

    return { blobUrl, loading, error };
}

/** Derive a safe download filename (with extension) from the API path e.g. /files/photos/abc.jpg → abc.jpg */
function getFilename(apiPath: string): string {
    return apiPath.split('/').pop() || 'download';
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ type, url, alt, label }) => {
    const [lightbox, setLightbox] = useState(false);
    const { blobUrl, loading, error } = useBlobUrl(url);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="doc-loading">
                    <Loader2 size={24} className="doc-spinner" />
                    <span>Loading…</span>
                </div>
            );
        }

        if (error || !blobUrl) {
            return (
                <div className="doc-loading doc-error">
                    <span>Failed to load file</span>
                </div>
            );
        }

        if (type === 'image') {
            return (
                <>
                    <div className="doc-image-wrap">
                        <img
                            src={blobUrl}
                            alt={alt}
                            className="doc-thumbnail"
                            onClick={() => setLightbox(true)}
                        />
                        <div className="doc-overlay" onClick={() => setLightbox(true)}>
                            <ZoomIn size={20} />
                        </div>
                    </div>
                    <div className="doc-actions">
                        <button className="doc-btn doc-btn-view" onClick={() => setLightbox(true)}>
                            <ZoomIn size={14} /> View
                        </button>
                        <a href={blobUrl} download={getFilename(url)} className="doc-btn doc-btn-download">
                            <Download size={14} /> Download
                        </a>
                    </div>

                    {lightbox && (
                        <div className="doc-lightbox" onClick={() => setLightbox(false)}>
                            <div className="doc-lightbox-content" onClick={(e) => e.stopPropagation()}>
                                <button className="doc-lightbox-close" onClick={() => setLightbox(false)} aria-label="Close preview">✕</button>
                                <img src={blobUrl} alt={alt} className="doc-lightbox-img" />
                            </div>
                        </div>
                    )}
                </>
            );
        }

        // PDF
        return (
            <>
                <div className="doc-pdf-preview">
                    <iframe src={blobUrl} title={alt} className="doc-pdf-frame" />
                </div>
                <div className="doc-actions">
                    <a href={blobUrl} target="_blank" rel="noopener noreferrer" className="doc-btn doc-btn-view">
                        <ExternalLink size={14} /> Open
                    </a>
                    <a href={blobUrl} download={getFilename(url)} className="doc-btn doc-btn-download">
                        <Download size={14} /> Download
                    </a>
                </div>
            </>
        );
    };

    return (
        <div className="doc-viewer">
            <div className="doc-label">{label}</div>
            {renderContent()}
        </div>
    );
};

export default DocumentViewer;
