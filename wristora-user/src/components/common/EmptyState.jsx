import React from 'react';
import { PackageOpen } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState Component
 * 
 * Renders user-friendly, responsive message components whenever lists, filters,
 * shop queries, cart states, or wishlists return zero items.
 */
function EmptyState({
  title = 'No items found',
  message = 'We couldn\'t find any records matching this category.',
  icon: Icon = PackageOpen,
  actionLabel,
  onActionClick,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 bg-luxury-cream-50 rounded-lg border border-luxury-cream-200 max-w-md mx-auto space-y-5 ${className}`}>
      
      {/* Icon Frame */}
      <div className="w-16 h-16 bg-luxury-cream-200 rounded-full flex items-center justify-center text-luxury-gold-400">
        <Icon size={28} strokeWidth={1.5} />
      </div>

      {/* Message Content */}
      <div className="space-y-1">
        <h3 className="text-lg font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
          {title}
        </h3>
        <p className="text-xs text-luxury-charcoal-500 font-sans leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </div>

      {/* Optional Interactive CTA */}
      {actionLabel && onActionClick && (
        <div className="pt-2">
          <Button onClick={onActionClick} variant="primary" size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
