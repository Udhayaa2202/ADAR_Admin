import React, { useMemo } from 'react';
import './StarBackground.css';

const StarBackground = () => {
    const starCount = 50;

    const stars = useMemo(() => {
        return Array.from({ length: starCount }).map((_, i) => ({
            id: i,
            style: {
                '--star-tail-length': `${(Math.floor(Math.random() * (750 - 500 + 1)) + 500) / 100}em`,
                '--top-offset': `${(Math.floor(Math.random() * (10000 - 0 + 1)) + 0) / 100}vh`,
                '--fall-duration': `${(Math.floor(Math.random() * (12000 - 6000 + 1)) + 6000) / 1000}s`,
                '--fall-delay': `${(Math.floor(Math.random() * (10000 - 0 + 1)) + 0) / 1000}s`,
            }
        }));
    }, []);

    return (
        <div className="star-container">
            {stars.map((star) => (
                <div 
                    key={star.id} 
                    className="star-item" 
                    style={star.style} 
                />
            ))}
        </div>
    );
};

export default StarBackground;
