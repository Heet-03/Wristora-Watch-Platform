import React from 'react';

/**
 * Input Component
 * 
 * Styled form field helper. Automatically supports select elements, text areas,
 * and text inputs with inline accessibility labels and layout error bindings.
 */
function Input({
  label,
  name,
  type = 'text',
  error,
  options = [],
  className = '',
  rows = 4,
  ...props
}) {
  const inputBaseStyles = 'w-full px-4 py-3 bg-luxury-cream-50 border rounded font-sans text-sm text-luxury-charcoal-900 placeholder-luxury-charcoal-300 focus:outline-none focus:border-luxury-gold-300 focus:ring-1 focus:ring-luxury-gold-300 transition-all duration-200';
  const borderStyles = error ? 'border-red-500' : 'border-luxury-cream-300';

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-[10px] font-bold uppercase tracking-widest text-luxury-charcoal-500"
        >
          {label}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          className={`${inputBaseStyles} ${borderStyles} resize-none`}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={name}
          name={name}
          className={`${inputBaseStyles} ${borderStyles} appearance-none cursor-pointer`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          className={`${inputBaseStyles} ${borderStyles}`}
          {...props}
        />
      )}
      
      {error && (
        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
