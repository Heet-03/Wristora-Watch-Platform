import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Gift, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

/**
 * Register Page Component (Mockup 10)
 * 
 * Luxury account creation view:
 * - Left panel: Membership privilege highlights, curator guarantee, and photography.
 * - Right panel: Full registration form with live validation and Google Sign-in.
 */
function Register() {
  const navigate = useNavigate();
  const { registerWithEmail, loginWithGoogle } = useAuth();

  // Form input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI & Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength check
  const isPasswordLongEnough = password.length >= 6;
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!fullName.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (email.trim().toLowerCase() === 'wristora@gmail.com') {
      setErrorMessage('This email address is reserved for store administration and cannot be registered as a customer account.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Security password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('The passwords you entered do not match. Please re-enter.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please agree to the Wristora Terms of Service and Privacy Policy.');
      return;
    }

    setIsLoading(true);
    const result = await registerWithEmail(email.trim(), password, fullName.trim(), phone.trim());
    setIsLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMessage(result.error || 'Account creation failed. Please check your details.');
    }
  };

  // Handle Google OAuth Sign Up
  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setIsLoading(true);
    const result = await loginWithGoogle();
    setIsLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMessage(result.error || 'Google registration was cancelled or failed.');
    }
  };

  const privileges = [
    {
      icon: Gift,
      title: 'White-Glove Global Delivery',
      desc: 'Fully insured priority transit with signature verification.'
    },
    {
      icon: ShieldCheck,
      title: '2-Year Movement Guarantee',
      desc: 'Certified global warranty backing every timepiece sold.'
    },
    {
      icon: Sparkles,
      title: 'VIP Vault Access',
      desc: 'Exclusive allocations and early access to rare editions.'
    },
    {
      icon: FileText,
      title: 'Digital Certificate of Provenance',
      desc: 'Immutable digital proof of authenticity and ownership history.'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-luxury-cream-100 font-sans">
      
      {/* LEFT COLUMN: Membership Privileges & Hero Visual (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-luxury-charcoal-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background Visual */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity scale-105 transition-transform duration-10000 hover:scale-100"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200')` 
          }}
        />
        {/* Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-charcoal-900 via-luxury-charcoal-900/70 to-transparent" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full border border-luxury-gold-400/40 flex items-center justify-center text-luxury-gold-300">
            <Clock size={16} />
          </span>
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-luxury-gold-300">
            Curator Guild Membership
          </span>
        </div>

        {/* Center: Membership Privileges List */}
        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div className="space-y-2">
            <h2 className="text-3xl xl:text-4xl font-serif font-bold text-luxury-cream-50 leading-tight">
              Begin Your Horological Journey
            </h2>
            <p className="text-xs text-luxury-charcoal-300 leading-relaxed font-sans">
              Create an account to join an international circle of connoisseurs, collectors, and watchmakers.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {privileges.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start space-x-3.5 bg-white/5 p-3.5 rounded-xl border border-white/10 backdrop-blur-xs">
                  <div className="w-8 h-8 rounded-lg bg-luxury-gold-400/15 text-luxury-gold-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-wider font-bold text-luxury-cream-100">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-luxury-charcoal-300 leading-relaxed mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="relative z-10 flex items-center space-x-2 text-[11px] uppercase tracking-widest text-luxury-charcoal-400 border-t border-white/10 pt-4">
          <ShieldCheck size={14} className="text-luxury-gold-400" />
          <span>Strict Privacy & Confidentiality Ensured</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Account Creation Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-14">
        <div className="w-full max-w-md bg-luxury-cream-50 p-8 sm:p-10 rounded-2xl border border-luxury-cream-300 shadow-sm space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-block mb-2 hover:opacity-80 transition-opacity">
              <img src="/logo.png?v=2" alt="Wristora Logo" className="h-12 w-auto mx-auto mix-blend-multiply contrast-125" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900 tracking-tight">
              Create Vault Account
            </h1>
            <p className="text-xs sm:text-sm text-luxury-charcoal-500 font-sans">
              Enter your details below to establish your collector membership.
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-xs animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Legal Name */}
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alexander Wright"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500 transition-all"
                />
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexander@example.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500 transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                Contact Number <span className="text-luxury-charcoal-400 font-normal text-[10px]">(For Delivery Updates)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500 transition-all"
                />
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                  Password <span className="text-red-500">*</span>
                </label>
                {password && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isPasswordLongEnough ? 'text-green-600' : 'text-amber-600'}`}>
                    {isPasswordLongEnough ? '✓ Strong' : 'Min 6 Characters'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500 transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400 hover:text-luxury-charcoal-700 p-0.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                {confirmPassword && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${doPasswordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                    {doPasswordsMatch ? '✓ Matches' : '✗ No Match'}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className={`w-full pl-10 pr-11 py-2.5 bg-white border rounded-xl text-sm text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none transition-all ${
                    confirmPassword && !doPasswordsMatch
                      ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-luxury-cream-300 focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500'
                  }`}
                />
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400 hover:text-luxury-charcoal-700 p-0.5 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="pt-1">
              <label className="flex items-start space-x-2.5 cursor-pointer select-none text-xs text-luxury-charcoal-600 leading-relaxed">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="w-4 h-4 mt-0.5 rounded border-luxury-cream-300 text-luxury-charcoal-900 focus:ring-luxury-gold-400 accent-luxury-charcoal-900 cursor-pointer shrink-0"
                />
                <span>
                  I agree to the <a href="#" className="underline font-semibold text-luxury-charcoal-900 hover:text-luxury-gold-600">Terms of Service</a> and <a href="#" className="underline font-semibold text-luxury-charcoal-900 hover:text-luxury-gold-600">Privacy Policy</a>.
                </span>
              </label>
            </div>

            {/* Create Account Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3.5 justify-center tracking-widest text-xs uppercase font-bold mt-2"
            >
              Create Vault Account
            </Button>
          </form>

          {/* Social Sign-Up Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-luxury-cream-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-luxury-cream-50 px-3 text-luxury-charcoal-400 font-semibold text-[10px]">
                Or Register With
              </span>
            </div>
          </div>

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 bg-white border border-luxury-cream-300 rounded-xl text-xs uppercase tracking-wider font-bold text-luxury-charcoal-800 hover:bg-luxury-cream-100 hover:border-luxury-cream-400 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
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
            <span>Sign Up with Google</span>
          </button>

          {/* Bottom Login Redirect */}
          <div className="text-center pt-2 border-t border-luxury-cream-300 text-xs text-luxury-charcoal-500">
            Already a member?{' '}
            <Link 
              to="/login" 
              className="font-bold text-luxury-charcoal-900 hover:text-luxury-gold-600 transition-colors inline-flex items-center space-x-1"
            >
              <span>Sign In to Vault</span>
              <ArrowRight size={12} />
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Register;
