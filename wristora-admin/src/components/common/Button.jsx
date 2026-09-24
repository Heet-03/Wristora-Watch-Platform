import React from 'react';

/**
 * Button Component
 * 
 * Styled button atom that supports custom visual variations (primary charcoal,
 * secondary bronze/gold, outline, danger) and handles internal processing (loading) animations.
 */
function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary', 
  size = 'md',
  disabled = false, 
  isLoading = false,
  className = '',
  ...props 
}) {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold uppercase tracking-widest transition-all duration-200 focus:outline-none rounded active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-luxury-charcoal-900 text-white hover:bg-luxury-gold-300 hover:text-luxury-charcoal-900 shadow-md',
    secondary: 'bg-luxury-gold-300 text-luxury-charcoal-900 hover:bg-luxury-gold-400 hover:shadow-lg',
    outline: 'border border-luxury-charcoal-900 text-luxury-charcoal-900 hover:bg-luxury-charcoal-900 hover:text-white',
    ghost: 'text-luxury-charcoal-500 hover:text-luxury-charcoal-900 hover:bg-luxury-cream-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[9px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-xs'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-[10px] tracking-wider font-semibold">Processing...</span>
        </span>
      ) : children}
    </button>
  );
}

export default Button;
