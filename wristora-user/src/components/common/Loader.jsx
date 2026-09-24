import React from 'react';

/**
 * Loader Component
 * 
 * Simple circular spinner loading element to denote content fetching states.
 */
function Loader({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className={`relative ${sizes[size]}`}>
        <div className="absolute inset-0 rounded-full border-2 border-luxury-cream-300"></div>
        <div className="absolute inset-0 rounded-full border-2 border-luxury-gold-300 border-t-transparent animate-spin"></div>
      </div>
    </div>
  );
}

export default Loader;
