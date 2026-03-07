import React from 'react';
import './CyberGrid.css';

const CyberGrid = () => {
    return (
        <div className="cyber-grid-container">
            <div className="cyber-grid-overlay" />
            <div className="cyber-grid-floor" />
            <div className="cyber-grid-vignette" />
        </div>
    );
};

export default CyberGrid;
