import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Settings as SettingsIcon, 
  User, 
  Accessibility, 
  Volume2, 
  Lock,
  Globe,
  Sun,
  Moon,
  Info
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { darkMode, largeText, toggleDarkMode, toggleLargeText } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-slide-up pb-8">
      {/* Account Settings */}
      {user && (
        <div className="p-8 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-6">
            <User className="text-[#ff5224]" size={16} />
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Account Profile</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                <p className="text-xs font-bold text-slate-800 mt-1">{user.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</span>
                <p className="text-xs font-bold text-slate-800 mt-1">{user.full_name || 'Guest User'}</p>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Account Created</span>
              <p className="text-[10px] text-slate-500 mt-1 font-bold">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility & Visual Preferences */}
      <div className="p-8 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Accessibility className="text-[#ff5224]" size={16} />
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Accessibility & Preferences</h3>
        </div>

        <div className="space-y-5">
          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <span className="block text-xs font-bold text-slate-700">Light / Dark Theme</span>
              <span className="text-[10px] text-slate-400 font-semibold">Toggle dark-mode colors for medical screens</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="px-4 py-2 text-xs bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 font-bold transition shadow-sm"
            >
              {darkMode ? 'Switch to Light' : 'Switch to Dark'}
            </button>
          </div>

          {/* Text Scaling */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <span className="block text-xs font-bold text-slate-700">Enlarge Text Scale</span>
              <span className="text-[10px] text-slate-400 font-semibold">Scale font sizes (highly recommended for elderly patients)</span>
            </div>
            <button
              onClick={toggleLargeText}
              className={`px-4 py-2 text-xs rounded-lg border font-bold transition shadow-sm ${
                largeText 
                  ? 'bg-[#ff5224]/10 text-[#ff5224] border-[#ff5224]/30' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {largeText ? 'Large Fonts Active' : 'Enable Large Fonts'}
            </button>
          </div>

          {/* Speech Helper language info */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <span className="block text-xs font-bold text-slate-700">Voice Assistant Language</span>
              <span className="text-[10px] text-slate-400 font-semibold">Dual language voice reading support</span>
            </div>
            <span className="text-[10px] px-3.5 py-1.5 bg-white text-[#ff5224] border border-[#ff5224]/20 rounded-lg font-bold">
              Hindi & English
            </span>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
        <Info className="text-slate-400 flex-shrink-0" size={18} />
        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
          Need custom settings or specific dosage alerts? Contact MediGuard AI administration at <code className="text-slate-600 font-bold">support@mediguard.ai</code>.
        </p>
      </div>
    </div>
  );
};
