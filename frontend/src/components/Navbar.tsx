import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, Sun, Moon, Type, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  toggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const { darkMode, largeText, toggleDarkMode, toggleLargeText } = useTheme();
  const location = useLocation();

  // Get Page Title from path
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/scanner': return 'Medicine Strip Scanner';
      case '/prescription': return 'Prescription Scheduler';
      case '/checker': return 'Interaction Checker';
      case '/allergies': return 'Allergy Manager';
      case '/reminders': return 'Medication Reminders';
      case '/chat': return 'AI Medicine Safety Chatbot';
      case '/reports': return 'Health Safety Reports';
      case '/settings': return 'Preferences & Settings';
      default: return 'MediGuard AI';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-[#f8f9fb]/80 border-b border-[#f1f5f9] backdrop-blur-md">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className={`font-extrabold text-slate-800 tracking-tight ${largeText ? 'text-xl' : 'text-base'}`}>
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* Right side: Settings & Profile */}
      <div className="flex items-center gap-3">
        {/* Large Text / Accessibility Button */}
        <button
          onClick={toggleLargeText}
          title={largeText ? "Normal Text Size" : "Larger Text (Accessibility)"}
          className={`p-2 rounded-xl transition-all duration-200 border ${
            largeText 
              ? 'bg-[#ff5224]/10 text-[#ff5224] border-[#ff5224]/30' 
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 border-transparent'
          }`}
        >
          <Type size={18} />
        </button>

        {/* Light/Dark Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-transparent transition-all duration-200"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User profile avatar or Login link */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ff5224] text-white font-extrabold text-sm">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-xs font-semibold text-slate-600 sm:inline truncate max-w-[100px]">
              {user.full_name || user.email}
            </span>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition-all"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
