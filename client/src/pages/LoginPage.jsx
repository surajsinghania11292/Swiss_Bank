import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useToast } from '../components/common/ToastContainer.jsx';
import { api } from '../services/api.js';

export default function LoginPage() {
  const { login, verify2fa } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // 2FA state
  const [showMfa, setShowMfa] = useState(false);
  const [mfaFullName, setMfaFullName] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Registration wizard state
  const [regStep, setRegStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    panNumber: '',
    address: '',
    pin: '',
    pinConfirm: '',
    consent: false,
  });
  const [showRegPassword, setShowRegPassword] = useState(false);

  const calculatePasswordStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  };

  const pwStrength = calculatePasswordStrength(regData.password);
  const pwLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    setLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (res.mfaRequired) {
        setMfaFullName(res.fullName);
        setShowMfa(true);
        toast('Two-factor authentication required', 'info');
      } else {
        toast(`Welcome back, ${res.user.fullName}!`);
        navigate('/');
      }
    } catch (err) {
      setErrorBanner(err.message || 'Invalid email or password');
      toast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    setLoading(true);

    try {
      const user = await verify2fa(mfaCode);
      toast(`Welcome back, ${user.fullName}!`);
      navigate('/');
    } catch (err) {
      setErrorBanner(err.message || 'Invalid 2FA code');
      toast(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
    toast(`Demo credentials loaded for ${email}`, 'info');
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!regData.fullName.trim()) errors.fullName = 'Full name is required';
      if (!regData.email.trim()) errors.email = 'Email address is required';
      else if (!/\S+@\S+\.\S+/.test(regData.email)) errors.email = 'Enter a valid email';
      if (!regData.password) errors.password = 'Password is required';
      else if (regData.password.length < 8) errors.password = 'Must be at least 8 characters';
    } else if (step === 2) {
      if (!regData.phone.trim()) errors.phone = 'Phone number is required';
      if (!regData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      else {
        const dob = new Date(regData.dateOfBirth);
        const minAgeDate = new Date();
        minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
        if (dob > minAgeDate) errors.dateOfBirth = 'You must be at least 18 years old';
      }
      if (!regData.panNumber.trim()) errors.panNumber = 'Tax / ID number is required';
      if (!regData.address.trim()) errors.address = 'Residential address is required';
    } else if (step === 3) {
      if (!regData.pin) errors.pin = 'Security PIN is required';
      else if (!/^\d{4,6}$/.test(regData.pin)) errors.pin = 'PIN must be 4 to 6 digits';
      if (regData.pin !== regData.pinConfirm) errors.pinConfirm = 'PINs do not match';
      if (!regData.consent) errors.consent = 'You must agree to the Terms of Service';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(regStep)) {
      setRegStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    setRegStep((s) => Math.max(1, s - 1));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');
    setLoading(true);

    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: regData.fullName,
          email: regData.email,
          password: regData.password,
          phone: regData.phone,
          dateOfBirth: regData.dateOfBirth,
          panNumber: regData.panNumber,
          address: regData.address,
        }),
      });

      await login(regData.email, regData.password);

      await api('/api/accounts', {
        method: 'POST',
        body: JSON.stringify({
          holderName: regData.fullName,
          openingBalance: '5000.00',
          pin: regData.pin,
        }),
      });

      toast('Account opened successfully with ₹5,000 opening deposit!');
      navigate('/');
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      }
      setErrorBanner(err.message || 'Registration failed');
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* Left Brand Panel */}
      <aside className="auth-side">
        <div className="auth-side__top">
          <img src="/assets/logo.svg" alt="Swiss Bank Logo" />
          <div>
            <div className="auth-side__brand-name">Swiss Bank</div>
            <div className="auth-side__brand-sub">NETBANKING</div>
          </div>
        </div>

        <div className="auth-side__pitch">
          <h2>Banking that works as hard as you do.</h2>
          <p>
            Accounts, transfers, bill pay, cards, deposits, and loans — all in one secure dashboard.
          </p>

          <div className="auth-side__points">
            <div className="auth-side__point">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9791e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Session-secured sign-in with PIN-protected transactions</span>
            </div>
            <div className="auth-side__point">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9791e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Instant transfers with a full double-entry statement</span>
            </div>
            <div className="auth-side__point">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a9791e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>Deposit & loan calculators, bill pay, and more</span>
            </div>
          </div>

          <div className="auth-side__trust">
            <span className="trust-chip">
              <svg width="13
export default LoginPage;
