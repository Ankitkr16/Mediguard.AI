import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Camera, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  Shield,
  CalendarClock, 
  MessageSquare, 
  Download, 
  Settings as SettingsIcon, 
  LogOut,
  X,
  Users,
  FileSearch,
  GitBranch,
  HeartPulse,
  History
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { largeText } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Console', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Family Hub', path: '/family', icon: Users },
    { name: 'Strip Scanner', path: '/scanner', icon: Camera },
    { name: 'Rx Scheduler', path: '/prescription', icon: FileText },
    { name: 'Lab Reports', path: '/labs', icon: FileSearch },
    { name: 'Checker', path: '/checker', icon: AlertTriangle },
    { name: 'Allergies', path: '/allergies', icon: ShieldAlert },
    { name: 'Emergency Risk', path: '/emergency', icon: HeartPulse },
    { name: 'Reminders', path: '/reminders', icon: CalendarClock },
    { name: 'Knowledge Graph', path: '/graph', icon: GitBranch },
    { name: 'AI Timeline', path: '/timeline', icon: History },
    { name: 'Insurance RAG', path: '/insurance', icon: FileSearch },
    { name: 'Safety Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Reports', path: '/reports', icon: Download },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-60 bg-white border-r border-[#e2e8f0]/40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#e2e8f0]/30">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#ff5224] to-[#ff7a59] flex items-center justify-center font-extrabold text-white shadow-md shadow-[#ff5224]/20">
              <Shield size={14} className="text-white" />
            </div>
            <span className="font-extrabold text-[#ff5224] text-sm tracking-tight">
              MediGuard<span className="text-slate-800">.AI</span>
            </span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 lg:hidden" onClick={toggleSidebar}>
            <X size={16} />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-3 mx-4 my-3 bg-slate-50 border border-slate-100 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-700 truncate">{user.full_name || 'Guest User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-[#ff5224]/5 text-[#ff5224] font-semibold border-r-2 border-[#ff5224]'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  } ${largeText ? 'text-sm py-3' : ''}`
                }
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-4 py-2 text-xs font-medium text-slate-400 hover:text-rose-500 rounded-lg transition-all ${
              largeText ? 'text-sm' : ''
            }`}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
