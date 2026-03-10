import React, { useState } from 'react';
import { ZoomIn, Download, ExternalLink } from 'lucide-react';
import './DocumentViewer.css';

interface DocumentViewerProps {
    type: 'image' | 'pdf';
    url: string;
    alt: string;
    label: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ type, url, alt, label }) => {
    const [lightbox, setLightbox] = useState(false);

    if (type === 'image') {
        return (
            <div className="doc-viewer">
                <div className="doc-label">{label}</div>
                <div className="doc-image-wrap">
                    <img
                        src={url}
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
                    <a href={url} download className="doc-btn doc-btn-download">
                        <Download size={14} /> Download
                    </a>
                </div>

                {lightbox && (
                    <div className="doc-lightbox" onClick={() => setLightbox(false)}>
                        <div className="doc-lightbox-content" onClick={(e) => e.stopPropagation()}>
                            <button className="doc-lightbox-close" onClick={() => setLightbox(false)}>✕</button>
                            <img src={url} alt={alt} className="doc-lightbox-img" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="doc-viewer">
            <div className="doc-label">{label}</div>
            <div className="doc-pdf-preview">
                <iframe src={url} title={alt} className="doc-pdf-frame" />
            </div>
            <div className="doc-actions">
                <a href={url} target="_blank" rel="noopener noreferrer" className="doc-btn doc-btn-view">
                    <ExternalLink size={14} /> Open
                </a>
                <a href={url} download className="doc-btn doc-btn-download">
                    <Download size={14} /> Download
                </a>
            </div>
        </div>
    );
};

export default DocumentViewer;
