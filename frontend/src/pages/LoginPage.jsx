import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Clock, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import Toast from '../components/common/Toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Validation and error states
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState(null);

  const validateForm = () => {
    const tempErrors = {};
    if (!username.trim()) {
      tempErrors.username = 'Username is required';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setErrors({});

    // Validate inputs
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await authService.login(username, password);
      login(res.user);
      setToast({ message: `Welcome back, ${res.user.name}!`, type: 'success' });
      
      const targetRoute = res.user.role.toLowerCase() === 'admin' ? '/admin' : '/employee';
      setTimeout(() => navigate(targetRoute), 500);
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password');
      setToast({ message: err.message || 'Invalid username or password', type: 'error' });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 font-sans text-white relative overflow-hidden">
      {/* Background Subtle Gradient & Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#111111] via-black to-[#111111] z-0"></div>
      
      {/* Ambient Blur Circles */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF7A00]/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#FF7A00]/3 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-md w-full flex flex-col gap-8 relative z-10">
        
        {/* Login Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#FF7A00]/20 flex items-center justify-center shadow-lg shadow-[#FF7A00]/5 mx-auto mb-4">
            <Clock size={28} className="text-[#FF7A00]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Vergil Tempo</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">Workforce Time Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111111] border border-[#1A1A1A] p-8 rounded-2xl shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            
            {/* Invalid Credentials Alert Banner */}
            {loginError && (
              <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-username" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>👤 Username</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  disabled={submitting}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  placeholder="Enter your username"
                  className={`w-full bg-[#1A1A1A] border text-white rounded-xl py-3.5 pl-11 pr-4 text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.username 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-[#333333] focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00]'
                  }`}
                />
              </div>
              {errors.username && (
                <span className="text-xs text-red-400 font-semibold mt-0.5">{errors.username}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔒 Password</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  disabled={submitting}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#1A1A1A] border text-white rounded-xl py-3.5 pl-11 pr-4 text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.password 
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-[#333333] focus:border-[#FF7A00] focus:ring-1 focus:ring-[#FF7A00]'
                  }`}
                />
              </div>
              {errors.password && (
                <span className="text-xs text-red-400 font-semibold mt-0.5">{errors.password}</span>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-4 bg-[#FF7A00] hover:bg-[#E06C00] active:bg-[#C55F00] disabled:bg-[#FF7A00]/50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#FF7A00]/10 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="tracking-wide">{submitting ? 'Authenticating...' : 'Sign In'}</span>
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
