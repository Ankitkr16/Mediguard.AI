import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { MedicalCore } from '../components/MedicalCore';
import { 
  Camera, 
  FileText, 
  AlertTriangle, 
  MessageSquare,
  Activity,
  Calendar,
  AlertCircle,
  Plus,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface DashboardData {
  total_scans: number;
  total_reminders: number;
  adherence_rate: number;
  risk_profile: { [key: string]: number };
  recent_events: Array<{
    id: number;
    event_type: string;
    created_at: string;
    metadata: any;
  }>;
}

export const Dashboard: React.FC = () => {
  const { fetchWithAuth, user } = useAuth();
  const { currentProfile, profiles, selectProfile } = useProfile();
  const { largeText } = useTheme();
  const navigate = useNavigate();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    if (!currentProfile) return;
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/dashboard/analytics?profile_id=${currentProfile.id}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to load dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentProfile]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-10 h-10">
          <div className="absolute top-0 left-0 w-full h-full border-2 border-slate-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-2 border-t-[#ff5224] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Fallback defaults if database has zero events
  const stats = data || {
    total_scans: 0,
    total_reminders: 0,
    adherence_rate: 0,
    risk_profile: { "Low": 1, "Medium": 0, "High": 0 },
    recent_events: []
  };

  // Determine Overall Risk Level
  const getOverallRisk = () => {
    if (stats.risk_profile.High && stats.risk_profile.High > 0) return { label: 'High', color: 'text-red-700 bg-red-50 border-red-100' };
    if (stats.risk_profile.Medium && stats.risk_profile.Medium > 0) return { label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-100' };
    return { label: 'Low', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
  };
  
  const overallRisk = getOverallRisk();

  const quickActions = [
    { name: 'Scan Strip', path: '/scanner', icon: Camera, color: 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/60 shadow-sm' },
    { name: 'Scan Rx', path: '/prescription', icon: FileText, color: 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/60 shadow-sm' },
    { name: 'Checker', path: '/checker', icon: AlertTriangle, color: 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/60 shadow-sm' },
    { name: 'AI Safety Chat', path: '/chat', icon: MessageSquare, color: 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200/60 shadow-sm' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Profile Switcher Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#f1f5f9] p-4 rounded-[24px]">
        <div className="flex items-center gap-2">
          <UserCheck className="text-[#ff5224]" size={18} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Profile:</span>
          <span className="text-sm font-black text-slate-800">{currentProfile?.full_name} ({currentProfile?.relation})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => selectProfile(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                currentProfile?.id === p.id 
                  ? 'bg-[#ff5224] text-white' 
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              {p.full_name}
            </button>
          ))}
          <button
            onClick={() => navigate('/family')}
            className="px-3 py-1.5 bg-[#ff5224]/10 text-[#ff5224] hover:bg-[#ff5224]/15 rounded-xl text-xs font-bold transition flex items-center gap-1"
          >
            <Plus size={14} /> Add Profile
          </button>
        </div>
      </div>

      {/* Welcome & Top Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 premium-card bg-white border border-[#f1f5f9]">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            Welcome back, {user?.full_name || 'Guest User'}
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Viewing health summary dashboard for: <strong className="text-[#ff5224]">{currentProfile?.full_name}</strong>.
          </p>
        </div>
        
        {/* Risk Status Indicator */}
        <div className={`flex items-center gap-3 px-4 py-2.5 border rounded-2xl ${overallRisk.color}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Overall Safety Status</span>
            <span className="text-xs font-extrabold uppercase tracking-wider">{overallRisk.label} Risk Level</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cognitive Core brain & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Pulsing Brain Central Console */}
        <div className="lg:col-span-2 premium-card bg-white border border-[#f1f5f9] flex flex-col justify-between items-center h-full min-h-[480px]">
          <div className="pt-6 px-6 self-start w-full border-b border-slate-100/50 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Cognitive Safety Console</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Click safety sectors to open monitoring features.</p>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5224] animate-ping" />
          </div>
          <div className="flex-grow flex items-center justify-center w-full">
            <MedicalCore />
          </div>
        </div>

        {/* Column of Metrics Cards */}
        <div className="space-y-4 flex flex-col justify-between h-full">
          {/* Total Scans Card */}
          <div className="p-5 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm flex-1 flex flex-col justify-between border-l-4 border-l-[#ff5224]">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Scans Conducted</span>
              <Camera className="text-[#ff5224]" size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{stats.total_scans}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Scanned items</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Strips, prescriptions, and boxes scanned.</p>
            </div>
          </div>

          {/* Reminders Card */}
          <div className="p-5 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm flex-1 flex flex-col justify-between border-l-4 border-l-slate-400">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Scheduled Meds</span>
              <Calendar className="text-slate-500" size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{stats.total_reminders}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Active prescriptions</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Configured reminder alert calendar items.</p>
            </div>
          </div>

          {/* Adherence Card */}
          <div className="p-5 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm flex-1 flex flex-col justify-between border-l-4 border-l-slate-600">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Adherence Rate</span>
              <Activity className="text-slate-600" size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{stats.adherence_rate}%</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Monthly compliance</span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Percentage of logs confirmed as taken.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.name}
              onClick={() => navigate(act.path)}
              className={`flex flex-col items-center justify-center p-4 border rounded-[20px] text-center gap-2.5 transition-all duration-200 ${act.color}`}
            >
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[#ff5224]">
                <Icon size={18} />
              </div>
              <span className={`font-bold text-xs uppercase tracking-wider ${largeText ? 'text-sm' : 'text-xs'}`}>{act.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Upcoming Meds & History Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left 2 Cols: Schedule & Actions */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          {/* upcoming reminders block */}
          <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-[#ff5224]" size={16} />
                <h3 className="font-extrabold text-slate-800 text-sm">Upcoming Medication Schedule</h3>
              </div>
              <Link to="/reminders" className="text-[10px] font-bold text-[#ff5224] hover:underline flex items-center gap-1">
                <span>Reminder Center</span>
                <ArrowRight size={10} />
              </Link>
            </div>
            
            {stats.total_reminders === 0 ? (
              <div className="py-8 text-center text-slate-400 font-medium text-xs">
                <p>No medication schedules registered yet.</p>
                <Link to="/reminders" className="inline-flex items-center gap-1 text-[10px] text-[#ff5224] font-bold mt-2 hover:underline">
                  <Plus size={12} /> Add First Medicine
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="p-1 rounded bg-[#ff5224]/10 text-[#ff5224] text-[9px] font-extrabold uppercase">Daily</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Active Medication Profile Loaded</p>
                      <p className="text-[10px] text-slate-400 font-medium">Please review reminders tab for complete timings chart.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* PDF Report Banner Card */}
          <div className="p-6 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-[#ff5224]">
            <div>
              <div className="flex items-center gap-1 text-[#ff5224] font-bold text-xs mb-1">
                <Sparkles size={14} />
                <span>Export Medical Files</span>
              </div>
              <h4 className="text-slate-800 font-extrabold text-sm">Generate Medicine Safety PDF Report</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Download a detailed chart of active medications, ML interaction results, and scheduled times.</p>
            </div>
            <button 
              onClick={() => navigate('/reports')}
              className="px-5 py-2.5 text-xs font-bold bg-[#ff5224] hover:bg-[#e0451e] text-white rounded-xl transition shadow-sm"
            >
              Go to Reports
            </button>
          </div>
        </div>

        {/* Right 1 Col: Recent History Log */}
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] h-full flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <Activity className="text-[#ff5224]" size={16} />
            <h3 className="font-extrabold text-slate-800 text-sm">Recent Activities</h3>
          </div>
          
          {stats.recent_events.length === 0 ? (
            <p className="text-slate-400 font-medium text-center py-6 text-xs">No recent scans or safety logs available.</p>
          ) : (
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {stats.recent_events.slice(0, 5).map((evt) => (
                <div key={evt.id} className="flex gap-3 text-xs leading-normal">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#ff5224]/50 flex-shrink-0 mt-1"></div>
                    <div className="w-[1px] flex-1 bg-slate-100 my-1"></div>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-700 capitalize text-xs">{evt.event_type.replace('_', ' ')}</p>
                    {evt.event_type === "interaction_check" && (
                      <p className="text-slate-400 font-medium text-[10px]">Checked: {evt.metadata.drugs?.join(', ')}</p>
                    )}
                    {evt.event_type === "strip_scan" && (
                      <p className="text-slate-400 font-medium text-[10px]">Scanned bottle strip: {evt.metadata.detected_drugs?.map((d: any) => d.name).join(', ')}</p>
                    )}
                    {evt.event_type === "prescription_scan" && (
                      <p className="text-slate-400 font-medium text-[10px]">Extracted {evt.metadata.schedule?.length} scheduled reminders</p>
                    )}
                    <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                      {new Date(evt.created_at).toLocaleDateString()} at {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
