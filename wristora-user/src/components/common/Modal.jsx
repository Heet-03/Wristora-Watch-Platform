import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * 
 * Reusable modal popup frame which prevents background document scrolling
 * when rendered, provides click-outside-to-dismiss behavior, and features flexible width sizing.
 */
function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = ''
}) {
  // Prevent page scroll when modal is visible
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Responsive max-width mapping
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-4xl',
    full: 'max-w-5xl'
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      
      {/* Click-outside Backdrop handler */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Dialog Body */}
      <div className={`relative bg-luxury-cream-50 w-full ${selectedSize} p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xl z-10 flex flex-col max-h-[92vh] ${className}`}>
        
        {/* Header Section */}
        <div className="flex items-center justify-between pb-4 border-b border-luxury-cream-300 mb-4 shrink-0">
          <h3 className="text-sm sm:text-base font-serif text-luxury-charcoal-900 font-bold tracking-widest uppercase">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="text-luxury-charcoal-400 hover:text-luxury-charcoal-900 transition-colors p-1.5 hover:bg-luxury-cream-200 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Inner Scrollable content viewport with custom smooth scroll */}
        <div className="overflow-y-auto pr-1 flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
