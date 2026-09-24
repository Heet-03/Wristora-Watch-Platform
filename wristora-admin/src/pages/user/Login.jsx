import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

/**
 * Login Page Component (Mockup 09)
 * 
 * Luxury split-screen authentication view:
 * - Left panel: Atmospheric luxury horology hero visual with brand testimonial.
 * - Right panel: Focused credential form, Google OAuth, and one-click demo credentials.
 */
function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, resetPassword } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  // Target path to redirect after successful login
  const from = location.state?.from?.pathname || '/admin';

  // Handle Standard Email/Password Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    if (cleanEmail !== 'wristora@gmail.com') {
      setErrorMessage('Access denied: Only authorized administrator (wristora@gmail.com) can access this portal.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithEmail(cleanEmail, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/admin', { replace: true });
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  // Handle Password Reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    const result = await resetPassword ? await resetPassword(forgotEmail.trim()) : { success: true };
    setForgotLoading(false);

    if (result.success) {
      setForgotSuccess(true);
    } else {
      setForgotError(result.error || 'Failed to send reset link. Please try again.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-luxury-cream-100 font-sans">
      
      {/* LEFT COLUMN: Luxury Visual Hero Showcase (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-luxury-charcoal-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Atmospheric Dark Image Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-10000 hover:scale-100"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200')` 
          }}
        />
        {/* Soft Luxury Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-charcoal-900 via-luxury-charcoal-900/60 to-transparent" />

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full border border-luxury-gold-400/40 flex items-center justify-center text-luxury-gold-300">
            <Clock size={16} />
          </span>
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-luxury-gold-300">
            Wristora Private Vault
          </span>
        </div>

        {/* Bottom Testimonial / Brand Narrative */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <blockquote className="text-2xl xl:text-3xl font-serif leading-snug tracking-wide text-luxury-cream-50 italic">
            "A fine timepiece is not merely an instrument of precision; it is an heirloom of human devotion and timeless artistry."
          </blockquote>
          <div className="flex items-center space-x-4 pt-2 border-t border-white/10">
            <div className="text-xs tracking-wider uppercase">
              <p className="font-bold text-luxury-gold-200">The Curators Guild</p>
              <p className="text-luxury-charcoal-300">Swiss Horological Heritage</p>
            </div>
          </div>
        </div>

        {/* Floating Trust Badge */}
        <div className="relative z-10 flex items-center space-x-2 text-[11px] uppercase tracking-widest text-luxury-charcoal-300">
          <ShieldCheck size={14} className="text-luxury-gold-400" />
          <span>256-Bit Encrypted Authentication Gateway</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Authentication Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-luxury-cream-50 p-8 sm:p-10 rounded-2xl border border-luxury-cream-300 shadow-sm space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-block mb-3">
              <img src="/logo.png?v=2" alt="Wristora Logo" className="h-12 w-auto mx-auto mix-blend-multiply contrast-125" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900 tracking-tight">
              Administrator Portal
            </h1>
            <p className="text-xs sm:text-sm text-luxury-charcoal-500 font-sans">
              Enter administrator credentials to access store management.
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-xs animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Main Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="wristora@gmail.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500 transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-luxury-gold-600 hover:text-luxury-gold-700 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500 transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400 hover:text-luxury-charcoal-700 transition-colors p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-luxury-charcoal-600">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 focus:ring-luxury-gold-400 accent-luxury-charcoal-900 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
            </div>

            {/* Sign In Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3.5 justify-center tracking-widest text-xs uppercase font-bold"
            >
              Sign In to Admin Portal
            </Button>
          </form>

        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => {
          setIsForgotModalOpen(false);
          setForgotSuccess(false);
          setForgotError('');
        }}
        title="Reset Vault Password"
      >
        {forgotSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-serif font-bold text-luxury-charcoal-900">
              Reset Link Dispatched
            </h3>
            <p className="text-xs text-luxury-charcoal-500 leading-relaxed">
              We have sent password recovery instructions to <strong className="text-luxury-charcoal-800">{forgotEmail}</strong>. Please check your inbox.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setIsForgotModalOpen(false);
                setForgotSuccess(false);
              }}
              className="w-full justify-center text-xs uppercase tracking-widest mt-2"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-luxury-charcoal-500 leading-relaxed">
              Enter your registered email address and we will dispatch a secure link to reset your account password.
            </p>

            {forgotError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center space-x-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] uppercase tracking-wider font-bold text-luxury-charcoal-700">
                Registered Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsForgotModalOpen(false)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={forgotLoading}
                className="flex-1 justify-center text-xs uppercase"
              >
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}

export default Login;
