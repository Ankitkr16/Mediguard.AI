import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  CalendarClock, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  Clock, 
  Sun, 
  CloudSun, 
  Moon,
  Info
} from 'lucide-react';

interface Reminder {
  id: number;
  drug_name: string;
  dosage: string | null;
  time_of_day: string;
  days_of_week: string;
  active: boolean;
  last_taken: string | null;
}

export const ReminderCenter: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [showAddForm, setShowAddForm] = useState(false);

  const loadReminders = async () => {
    try {
      const response = await fetchWithAuth('/drugs/reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (err) {
      console.error("Failed to load reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetchWithAuth('/drugs/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug_name: drugName.trim(),
          dosage: dosage.trim() || null,
          time_of_day: timeOfDay,
          days_of_week: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
          active: true
        })
      });

      if (response.ok) {
        setDrugName('');
        setDosage('');
        setTimeOfDay('morning');
        setShowAddForm(false);
        await loadReminders();
      } else {
        alert("Failed to save medication reminder.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckin = async (id: number) => {
    try {
      const response = await fetchWithAuth(`/drugs/reminders/${id}/checkin`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadReminders();
      }
    } catch (err) {
      console.error("Checkin failed:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this medication reminder?")) return;

    try {
      const response = await fetchWithAuth(`/drugs/reminders/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadReminders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check if taken today
  const isTakenToday = (lastTakenStr: string | null) => {
    if (!lastTakenStr) return false;
    const lastTaken = new Date(lastTakenStr);
    const today = new Date();
    return lastTaken.toDateString() === today.toDateString();
  };

  // Group reminders
  const morningReminders = reminders.filter(r => r.time_of_day === 'morning');
  const afternoonReminders = reminders.filter(r => r.time_of_day === 'afternoon' || r.time_of_day === 'noon');
  const nightReminders = reminders.filter(r => r.time_of_day === 'night' || r.time_of_day === 'hs' || r.time_of_day === 'multiple');

  // Adherence tracking calculations
  const totalToday = reminders.length;
  const takenToday = reminders.filter(r => isTakenToday(r.last_taken)).length;
  const progressPercent = totalToday > 0 ? Math.round((takenToday / totalToday) * 100) : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Adherence Header Card */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">Medication Checklist Progress</h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Confirm dosage ingestion daily to maintain records.</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-2xl font-black text-slate-800">{takenToday}</span>
            <span className="text-slate-400 text-xs font-bold uppercase">of {totalToday} doses taken today</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full md:w-64">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-1">
            <span>Daily Adherence</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-50 border border-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ff5224] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Blocks grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Morning Block */}
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-4 min-h-[480px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sun className="text-amber-500" size={18} />
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Morning Routine</h4>
          </div>
          {morningReminders.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold py-4">No morning medications scheduled.</p>
          ) : (
            <div className="space-y-3">
              {morningReminders.map(rem => (
                <ReminderCard key={rem.id} rem={rem} onCheckin={handleCheckin} onDelete={handleDelete} isTaken={isTakenToday(rem.last_taken)} />
              ))}
            </div>
          )}
        </div>

        {/* Afternoon Block */}
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-4 min-h-[480px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <CloudSun className="text-[#ff5224]" size={18} />
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Afternoon Routine</h4>
          </div>
          {afternoonReminders.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold py-4">No afternoon medications scheduled.</p>
          ) : (
            <div className="space-y-3">
              {afternoonReminders.map(rem => (
                <ReminderCard key={rem.id} rem={rem} onCheckin={handleCheckin} onDelete={handleDelete} isTaken={isTakenToday(rem.last_taken)} />
              ))}
            </div>
          )}
        </div>

        {/* Night Block */}
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-4 min-h-[480px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Moon className="text-violet-500" size={18} />
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Night Routine</h4>
          </div>
          {nightReminders.length === 0 ? (
            <p className="text-xs text-slate-400 font-semibold py-4">No night medications scheduled.</p>
          ) : (
            <div className="space-y-3">
              {nightReminders.map(rem => (
                <ReminderCard key={rem.id} rem={rem} onCheckin={handleCheckin} onDelete={handleDelete} isTaken={isTakenToday(rem.last_taken)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Trigger & Modal */}
      <div className="flex justify-end pt-4">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-3 font-bold text-xs text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition shadow-sm"
          >
            <Plus size={16} />
            <span>Add Medication Reminder</span>
          </button>
        ) : (
          <div className="w-full max-w-xl p-6 premium-card bg-white border border-[#f1f5f9] text-left">
            <h3 className="font-extrabold text-slate-800 text-xs mb-4 pb-2 border-b border-slate-100 uppercase tracking-wider">
              Add New Medicine Reminder
            </h3>
            
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    required
                    value={drugName}
                    onChange={(e) => setDrugName(e.target.value)}
                    placeholder="e.g. Metformin, Lisinopril"
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#ff5224] focus:ring-1 focus:ring-[#ff5224] outline-none transition text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Dosage (Strength / Quantity)
                  </label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 500mg, 1 tablet"
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#ff5224] focus:ring-1 focus:ring-[#ff5224] outline-none transition text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Time of Day
                </label>
                <select
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#ff5224] cursor-pointer"
                >
                  <option value="morning">Morning Routine</option>
                  <option value="afternoon">Afternoon Routine</option>
                  <option value="night">Night Routine</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReminderCardProps {
  rem: Reminder;
  onCheckin: (id: number) => void;
  onDelete: (id: number) => void;
  isTaken: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ rem, onCheckin, onDelete, isTaken }) => {
  return (
    <div className={`p-4 border rounded-xl flex items-center justify-between transition-all duration-300 ${
      isTaken 
        ? 'bg-emerald-50/40 border-emerald-100 opacity-80' 
        : 'bg-slate-50 border border-slate-100'
    }`}>
      <div>
        <h5 className={`font-bold text-xs text-slate-800 ${isTaken ? 'line-through text-slate-400' : ''}`}>
          {rem.drug_name}
        </h5>
        <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Dose: {rem.dosage || '1 tablet'}</p>
        {isTaken && rem.last_taken && (
          <span className="text-[9px] text-emerald-600 block mt-1 font-bold">
            Taken at {new Date(rem.last_taken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Adherence Check-In Button */}
        <button
          onClick={() => onCheckin(rem.id)}
          disabled={isTaken}
          title={isTaken ? "Medication Ingested" : "Check-in Dose Taken"}
          className={`p-2 rounded-lg border transition-all ${
            isTaken 
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 cursor-default' 
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 border-slate-200 bg-white'
          }`}
        >
          {isTaken ? <Check size={12} /> : <Clock size={12} />}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(rem.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};
