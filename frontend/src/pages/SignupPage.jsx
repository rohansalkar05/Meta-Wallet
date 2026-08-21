import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupApi, verifyOtpApi } from '../services/api';
import { User, Mail, Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const SignupPage = () => {
  const navigate = useNavigate();

  // Form State
  const [step, setStep] = useState('signup'); // 'signup' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  // Dev & Auth Tokens State
  const [otpToken, setOtpToken] = useState('');
  const [devOtp, setDevOtp] = useState('');
  
  // UI Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Signup Submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const data = await signupApi(name, email, password);
      setOtpToken(data.otpToken);
      if (data.otp) {
        setDevOtp(data.otp);
      }
      setSuccessMsg('Account created successfully! Please enter the 6-digit OTP sent to your email.');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification Submission
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit numeric OTP.');
      return;
    }

    setLoading(true);

    try {
      const data = await verifyOtpApi(email, otp.trim(), otpToken);
      // Store session token in localStorage as 'authToken'
      localStorage.setItem('authToken', data.token);
      
      // Navigate to /dashboard using history replacement
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <div className="brand-badge">
            <ShieldCheck className="icon-glow" size={28} />
            <span>SecureAuth</span>
          </div>
          <h2>{step === 'signup' ? 'Create Account' : 'Verify Signup OTP'}</h2>
          <p className="subtitle">
            {step === 'signup'
              ? 'Enter your credentials to get started'
              : `Enter the 6-digit OTP sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success">
            <ShieldCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Local Dev Testing Notice */}
        {step === 'otp' && devOtp && (
          <div className="dev-otp-box">
            <span className="dev-label">DEV OTP FOR LOCAL TESTING:</span>
            <span className="dev-code">{devOtp}</span>
          </div>
        )}

        {step === 'signup' ? (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Continue to OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="auth-footer">
              Already have an account? <Link to="/login" className="link">Log In</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="input-group">
              <label htmlFor="otpCode">6-Digit Verification Code</label>
              <div className="input-wrapper">
                <KeyRound className="input-icon" size={18} />
                <input
                  id="otpCode"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  className="otp-input-field"
                  required
                />
              </div>
              <small className="help-text">Numeric-only. OTP expires in 5 minutes.</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || otp.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Enter Dashboard</span>
                  <ShieldCheck size={18} />
                </>
              )}
            </button>

            <div className="auth-footer">
              Wrong email or want to restart?{' '}
              <button 
                type="button" 
                onClick={() => setStep('signup')} 
                className="btn-text"
              >
                Back to Signup
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
