import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, Upload, AlertCircle, TrendingUp, Sparkles, Plus, Calendar, Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

export const LabReports: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { currentProfile } = useProfile();
  const { largeText } = useTheme();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form uploader states
  const [testType, setTestType] = useState('Lipid Profile');
  const [rawText, setRawText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected parameter for plotting trends
  const [selectedParam, setSelectedParam] = useState('');

  const loadReports = async () => {
    if (!currentProfile) return;
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/lab-reports/profile/${currentProfile.id}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
        
        // Auto-select first parameter for trend graph if available
        if (data.length > 0) {
          const firstReport = data[0];
          const params = Object.keys(firstReport.extracted_data || {});
          if (params.length > 0) {
            setSelectedParam(params[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentProfile) return;
    if (!rawText.trim()) {
      setError("Please paste raw report text or lab readings.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('profile_id', currentProfile.id.toString());
      formData.append('ocr_text', rawText);
      formData.append('test_type', testType);

      const res = await fetchWithAuth('/lab-reports/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSuccess('Report analyzed and saved successfully!');
        setRawText('');
        setShowAddForm(false);
        await loadReports();
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to analyze report.');
      }
    } catch (err) {
      setError('Connection error. Failed to send data.');
    } finally {
      setSubmitting(false);
    }
  };

  // Compile data for trend graph based on selected parameter
  const getTrendData = () => {
    if (!selectedParam || reports.length === 0) return [];
    
    // Sort reports chronologically
    const sorted = [...reports].sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());
    
    return sorted
      .map(r => {
        const item = r.extracted_data[selectedParam];
        return {
          date: new Date(r.test_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          value: item ? parseFloat(item.value) : null,
          unit: item ? item.unit : ''
        };
      })
      .filter(d => d.value !== null);
  };

  const trendData = getTrendData();

  // Get list of all unique parameters across all reports for the selector
  const getAllParameters = () => {
    const params = new Set<string>();
    reports.forEach(r => {
      Object.keys(r.extracted_data || {}).forEach(k => params.add(k));
    });
    return Array.from(params);
  };

  const allParams = getAllParameters();

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header card */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            Lab Report Intelligence
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Currently viewing reports for: <strong className="text-[#ff5224]">{currentProfile?.full_name}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 text-xs font-bold bg-[#ff5224] text-white hover:bg-[#e0451e] rounded-xl transition flex items-center gap-1.5 self-start shadow-sm"
        >
          <Plus size={16} />
          <span>Upload Lab Report</span>
        </button>
      </div>

      {/* Add Report Panel */}
      {showAddForm && (
        <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Analyze New Diagnostic Report</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Paste blood lab readings (CBC, Lipid, LFT, Thyroid) for clinical evaluation.</p>
          </div>

          {error && <p className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Report Category
                </label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-700 cursor-pointer"
                >
                  <option value="Lipid Profile">Lipid Profile (Cholesterol, LDL, HDL)</option>
                  <option value="CBC">Complete Blood Count (CBC / Hb)</option>
                  <option value="LFT">Liver Function Test (LFT / ALT / AST)</option>
                  <option value="Thyroid">Thyroid Profile (TSH / T3 / T4)</option>
                  <option value="Diabetes">Diabetes Check (HbA1c / FBG)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Raw Report Text / Lab Readings
              </label>
              <textarea
                required
                rows={5}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste OCR text, e.g. 'LDL Cholesterol: 160 mg/dL (Reference Range: <100), Total Cholesterol: 240 mg/dL...'"
                className="w-full p-4 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800 font-mono"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {submitting ? "Analyzing..." : "Analyze Report"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ff5224] rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-10 bg-white border border-[#f1f5f9] rounded-[24px] text-center text-slate-400 font-semibold min-h-[260px] flex flex-col justify-center items-center">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p>No lab reports registered for {currentProfile?.full_name} yet.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 text-[10px] text-[#ff5224] font-bold uppercase hover:underline"
          >
            Upload your first lab file
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trend Chart Widget */}
          {allParams.length > 0 && (
            <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100/50 pb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-[#ff5224]" size={16} />
                  <h3 className="font-extrabold text-slate-800 text-sm">Longitudinal Health Trends</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Parameter:</span>
                  <select
                    value={selectedParam}
                    onChange={(e) => setSelectedParam(e.target.value)}
                    className="px-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-700 cursor-pointer"
                  >
                    {allParams.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {trendData.length > 1 ? (
                <div className="h-[280px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '11px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={selectedParam} 
                        stroke="#ff5224" 
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 1.5, fill: '#fff' }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  <Activity className="mx-auto text-slate-300 mb-2" size={24} />
                  Upload 2 or more reports to visualize longitudinal parameter trends.
                </div>
              )}
            </div>
          )}

          {/* List of Reports */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Diagnostic Report History</h3>
            
            {reports.map((rep) => (
              <div key={rep.id} className="p-6 premium-card bg-white border border-[#f1f5f9] grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Meta & Summary */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-3">
                    <Calendar className="text-[#ff5224]" size={16} />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rep.test_type}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{rep.test_date}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#ff5224]/5 border border-[#ff5224]/10 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-[#ff5224] text-[10px] font-bold uppercase mb-1">
                      <Sparkles size={12} />
                      <span>AI Advisory Summary</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{rep.summary}</p>
                  </div>
                </div>

                {/* Middle: Extracted Parameters */}
                <div className="lg:col-span-1 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1">Metrics Table</h4>
                  <div className="space-y-1.5">
                    {Object.entries(rep.extracted_data || {}).map(([param, details]: any) => {
                      const isAbnormal = details.status !== 'Normal';
                      return (
                        <div key={param} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100/50 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-slate-700 block">{param}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Range: {details.range}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-extrabold ${isAbnormal ? 'text-red-600' : 'text-slate-800'}`}>
                              {details.value} {details.unit}
                            </span>
                            <span className={`block text-[9px] font-bold uppercase ${
                              isAbnormal ? 'text-red-500' : 'text-emerald-600'
                            }`}>{details.status}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Warnings/Abnormalities */}
                <div className="lg:col-span-1 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100/50 pt-4 lg:pt-0 lg:pl-6">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 mb-1">Abnormal Alert Flags</h4>
                  {rep.abnormalities_found && rep.abnormalities_found.length > 0 ? (
                    <div className="space-y-2">
                      {rep.abnormalities_found.map((ab: string, idx: number) => (
                        <div key={idx} className="flex gap-2 text-xs leading-normal p-2.5 bg-red-50/50 border border-red-100/40 rounded-xl">
                          <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                          <span className="text-red-700 font-bold">{ab}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                      All tested values are in the normal physiological range.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
