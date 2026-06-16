import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Clock, User, Lock, ArrowRight, Info, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center px-4 font-sans text-white">
      <div className="max-w-md w-full flex flex-col gap-8">
        
        {/* Login Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-4 animate-pulse-slow">
            <Clock size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Vergil Tempo</h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to manage your timesheets and track your work hours.</p>
        </div>

        {/* Login Card */}
        <div className="glass p-8 rounded-2xl border border-white/5 bg-[#121826]/60 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            
            {/* Invalid Credentials Alert Banner */}
            {loginError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-username" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Username</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  placeholder="Enter your username"
                  className={`w-full bg-[#1a2336] border text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                    errors.username ? 'border-rose-500/40 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.username && (
                <span className="text-[10px] text-rose-400 font-semibold mt-0.5">{errors.username}</span>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                  }}
                  placeholder="Enter your password"
                  className={`w-full bg-[#1a2336] border text-white rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                    errors.password ? 'border-rose-500/40 focus:border-rose-500' : 'border-white/5 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.password && (
                <span className="text-[10px] text-rose-400 font-semibold mt-0.5">{errors.password}</span>
              )}
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition duration-200 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Demo Info */}
          <div className="mt-6 p-4 rounded-xl border border-white/5 bg-white/[0.01] text-xs">
            <div className="font-bold flex items-center gap-1.5 text-white mb-2">
              <Info size={14} className="text-indigo-400" />
              <span>Quick Demo Access</span>
            </div>
            <div className="flex flex-col gap-1.5 text-gray-400">
              <div><strong>Admin:</strong> <code className="bg-[#1a2336] text-indigo-300 px-1 py-0.5 rounded font-mono">admin</code> / <code className="bg-[#1a2336] text-indigo-300 px-1 py-0.5 rounded font-mono">admin123</code></div>
              <div><strong>Candidate:</strong> <code className="bg-[#1a2336] text-indigo-300 px-1 py-0.5 rounded font-mono">employee1</code> / <code className="bg-[#1a2336] text-indigo-300 px-1 py-0.5 rounded font-mono">emp123</code></div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
