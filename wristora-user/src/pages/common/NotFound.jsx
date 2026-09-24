import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import Button from '../../components/common/Button';

/**
 * NotFound Component (404 Page)
 * 
 * Luxury horology themed 404 error page for unmatched routes.
 */
function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-16 font-sans text-center">
      <div className="max-w-md w-full space-y-6 bg-luxury-cream-50 p-8 sm:p-12 rounded-3xl border border-luxury-cream-300 shadow-sm">
        
        {/* Animated Compass Icon */}
        <div className="w-20 h-20 rounded-full bg-luxury-charcoal-900 border-2 border-luxury-gold-400 flex items-center justify-center mx-auto text-luxury-gold-300 shadow-md">
          <Compass size={36} className="animate-spin-slow" />
        </div>

        {/* Status & Title */}
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] text-luxury-gold-600 font-bold block">
            Error 404 • Lost in Time
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900">
            Coordinates Unknown
          </h1>
          <p className="text-xs text-luxury-charcoal-500 font-sans leading-relaxed">
            The horological document or timepiece you are looking for has been moved, reallocated to private auction, or does not exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center space-x-2 text-xs uppercase font-bold"
          >
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </Button>

          <Link to="/shop" className="w-full sm:w-auto">
            <Button
              variant="primary"
              className="w-full flex items-center justify-center space-x-2 text-xs uppercase font-bold"
            >
              <ShoppingBag size={14} />
              <span>Explore Vault</span>
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default NotFound;
