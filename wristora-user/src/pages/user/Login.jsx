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
  const { loginWithEmail, loginWithGoogle, resetPassword } = useAuth();

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
  const from = location.state?.from?.pathname || '/';

  // Handle Standard Email/Password Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    if (cleanEmail === 'wristora@gmail.com') {
      setErrorMessage('Access denied: Store administrator accounts cannot log in to the customer storefront. Please access the Admin Portal at http://localhost:5174/login');
      return;
    }

    setIsLoading(true);
    const result = await loginWithEmail(cleanEmail, password);
    setIsLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    const result = await loginWithGoogle();
    setIsLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMessage(result.error || 'Google Sign-In was cancelled or failed.');
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
            <Link to="/" className="inline-block mb-3 hover:opacity-80 transition-opacity">
              <img src="/logo.png?v=2" alt="Wristora Logo" className="h-12 w-auto mx-auto mix-blend-multiply contrast-125" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-luxury-charcoal-500 font-sans">
              Enter your credentials to access your collection and private orders.
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
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
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
              Sign In to Vault
            </Button>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-luxury-cream-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-luxury-cream-50 px-3 text-luxury-charcoal-400 font-semibold text-[10px]">
                Or Continue With
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white border border-luxury-cream-300 rounded-xl text-xs uppercase tracking-wider font-bold text-luxury-charcoal-800 hover:bg-luxury-cream-100 hover:border-luxury-cream-400 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Bottom Register Redirect */}
          <div className="text-center pt-2 border-t border-luxury-cream-300 text-xs text-luxury-charcoal-500">
            New to Wristora?{' '}
            <Link 
              to="/register" 
              className="font-bold text-luxury-charcoal-900 hover:text-luxury-gold-600 transition-colors inline-flex items-center space-x-1"
            >
              <span>Create an Account</span>
              <ArrowRight size={12} />
            </Link>
          </div>

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
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setForgotSuccess(false)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Resend Email
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSuccess(false);
                }}
                className="flex-1 justify-center text-xs uppercase"
              >
                Back to Login
              </Button>
            </div>
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
