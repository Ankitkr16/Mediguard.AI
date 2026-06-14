import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Pill, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: string;
  title: string;
  description: string;
}

export const Timeline: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { currentProfile } = useProfile();
  const { largeText } = useTheme();

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTimeline = async () => {
    if (!currentProfile) return;
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/timeline/${currentProfile.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [currentProfile]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication_started': return <Pill className="text-emerald-500" size={16} />;
      case 'lab_report_uploaded': return <Sparkles className="text-[#ff5224]" size={16} />;
      case 'safety_check': return <ShieldAlert className="text-amber-500" size={16} />;
      default: return <CheckCircle2 className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Title Header */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex items-center justify-between">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            AI Medication Timeline
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Chronological medication adjustments, interaction updates, and diagnostic changes for: <strong className="text-[#ff5224]">{currentProfile?.full_name}</strong>
          </p>
        </div>
        <Calendar className="text-[#ff5224]" size={24} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ff5224] rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="p-10 bg-white border border-[#f1f5f9] rounded-[24px] text-center text-slate-400 font-semibold min-h-[260px] flex flex-col justify-center items-center">
          <Pill size={40} className="text-slate-300 mb-3" />
          <p>No timeline events registered yet.</p>
          <p className="text-[10px] text-slate-400 mt-1">Add reminders or check drug safety to build history logs.</p>
        </div>
      ) : (
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] relative">
          {/* Timeline Vertical Guide Line */}
          <div className="absolute left-[29px] top-8 bottom-8 w-[1.5px] bg-slate-100 hidden sm:block" />

          <div className="space-y-6 relative">
            {events.map((evt, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start gap-4 text-xs">
                {/* Date marker block */}
                <div className="w-24 text-[10px] text-slate-400 font-extrabold uppercase pt-1.5 hidden sm:block text-right pr-2">
                  {new Date(evt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Vertical bullet marker */}
                <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center z-10 flex-shrink-0">
                  {getIcon(evt.type)}
                </div>

                {/* Event text card */}
                <div className="flex-1 p-4 bg-slate-50 border border-slate-100/50 rounded-2xl">
                  {/* Mobile Date indicator */}
                  <span className="text-[9px] text-[#ff5224] font-bold uppercase tracking-wider block sm:hidden mb-1">
                    {evt.date}
                  </span>
                  <h4 className="font-extrabold text-slate-800 text-sm leading-tight">{evt.title}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
