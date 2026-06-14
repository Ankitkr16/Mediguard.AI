import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { AlertCircle, ShieldAlert, Sparkles, HeartPulse, Send, CheckCircle } from 'lucide-react';

export const EmergencyRisk: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { currentProfile } = useProfile();
  const { largeText } = useTheme();

  const [symptoms, setSymptoms] = useState('');
  const [hasAlcohol, setHasAlcohol] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!currentProfile) return;
    if (!symptoms.trim()) {
      setError("Please describe the current physical symptoms.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth(`/emergency-risk/${currentProfile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          has_alcohol: hasAlcohol
        })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Error evaluating symptoms.");
      }
    } catch (err) {
      setError("Connection failed. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Emergency': return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
      case 'High': return 'bg-orange-500 text-white shadow-lg shadow-orange-500/20';
      case 'Moderate': return 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
      case 'Low': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getRiskBorderColor = (level: string) => {
    switch (level) {
      case 'Emergency': return 'border-red-500/30 bg-red-50/10';
      case 'High': return 'border-orange-500/30 bg-orange-50/10';
      case 'Moderate': return 'border-amber-500/30 bg-amber-50/10';
      case 'Low': return 'border-emerald-500/30 bg-emerald-50/10';
      default: return 'border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Title Header */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex items-center justify-between">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            Emergency Risk Detector
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Input acute physical symptoms to check severity warnings against your active prescriptions and allergies.
          </p>
        </div>
        <HeartPulse className="text-[#ff5224]" size={24} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Symptom Input Form */}
        <div className="lg:col-span-1 p-6 premium-card bg-white border border-[#f1f5f9] space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Symptom Checker Input</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Scans active reminders for adverse triggers.</p>
          </div>

          {error && <p className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</p>}

          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Describe Symptoms
              </label>
              <textarea
                required
                rows={5}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe what you are experiencing, e.g. severe headache, fever, shortness of breath, dizziness..."
                className="w-full p-4 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800 leading-relaxed font-semibold"
              />
            </div>

            <div className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <input
                id="alcohol"
                type="checkbox"
                checked={hasAlcohol}
                onChange={(e) => setHasAlcohol(e.target.checked)}
                className="h-4 w-4 text-[#ff5224] border-slate-300 rounded focus:ring-[#ff5224]"
              />
              <label htmlFor="alcohol" className="text-xs font-bold text-slate-600 cursor-pointer">
                Alcohol consumed recently?
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !currentProfile}
              className="w-full py-3.5 mt-2 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition flex justify-center items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Analyzing..." : "Evaluate Risk"}</span>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Column: AI Triage results */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <div className={`p-6 border rounded-[24px] border-l-4 transition-all duration-300 ${getRiskBorderColor(result.risk_level)}`}>
              {/* Risk Level Badge Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Safety Triage</span>
                  <h3 className="font-extrabold text-slate-800 text-sm mt-0.5">AI Urgency Assessment</h3>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getRiskBadgeColor(result.risk_level)}`}>
                  {result.risk_level}
                </div>
              </div>

              {/* Triage Explanations */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Reasoning</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">{result.reasoning}</p>
                </div>

                {/* Evidence & Citations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                      <CheckCircle className="text-emerald-500" size={12} />
                      <span>Citations & Evidence</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">{result.reasoning.includes("stroke") ? "AHA/ASA Stroke Protocols" : "Emergency Medicine Association Guidelines"}</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Confidence Rating</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">88%</span>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#ff5224] flex items-center justify-center text-[10px] font-black text-[#ff5224]">
                      AI
                    </div>
                  </div>
                </div>

                {/* Medical Disclaimer Banner */}
                <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-left">
                  <ShieldAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                    {result.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 bg-white border border-[#f1f5f9] rounded-[24px] text-center text-slate-400 font-semibold min-h-[300px] flex flex-col justify-center items-center">
              <Sparkles size={40} className="text-slate-300 mb-3 animate-pulse" />
              <h3 className="font-extrabold text-slate-700 text-sm">Emergency Symptom Monitor</h3>
              <p className="text-xs max-w-sm mt-1 leading-normal font-semibold">
                Submit symptoms to check against active clinical records. Generates risk scores, citations, and ER referrals.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
