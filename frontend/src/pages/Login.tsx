import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    const success = await login(email, password);
    setIsSubmitting(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8f9fb] px-6 py-12">
      <div className="w-full max-w-md p-8 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff5224] to-[#ff7a59] text-white shadow-md shadow-[#ff5224]/20 mb-3">
            <Shield size={22} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Sign In to MediGuard<span className="text-[#ff5224]">.AI</span></h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Protect your medication safety</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#ff5224] focus:ring-1 focus:ring-[#ff5224] outline-none transition text-slate-800"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Password reset requires SMTP configs. Please create a new account."); }} className="text-[10px] font-bold text-[#ff5224] hover:underline">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#ff5224] focus:ring-1 focus:ring-[#ff5224] outline-none transition text-slate-800"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center w-full py-3.5 mt-4 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mr-2" size={14} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 font-semibold">
          Don't have an account?{' '}
          <Link to="/signup" className="font-bold text-[#ff5224] hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};
