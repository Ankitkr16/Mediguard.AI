import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FileSearch, Sparkles, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const InsuranceAssistant: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();

  const [policyText, setPolicyText] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!policyText.trim() || !query.trim()) {
      setError("Please input both the policy summary and your coverage question.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('policy_text', policyText.trim());
      formData.append('query', query.trim());

      const res = await fetchWithAuth('/insurance/check', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const errData = await res.json();
        setError(errData.detail || "Failed to analyze coverage.");
      }
    } catch (err) {
      setError("Connection failure. Check backend service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Title Header */}
      <div className="p-6 premium-card bg-white border border-[#f1f5f9] flex items-center justify-between">
        <div>
          <h2 className={`font-extrabold text-slate-800 leading-tight ${largeText ? 'text-2xl' : 'text-lg'}`}>
            Health Insurance Assistant
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Analyze policy benefits, covered procedures, copays, and exclusions using RAG intelligence.
          </p>
        </div>
        <FileSearch className="text-[#ff5224]" size={24} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Input Panel */}
        <div className="lg:col-span-1 p-6 premium-card bg-white border border-[#f1f5f9] space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Policy Details</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Paste policy clauses to inspect coverage parameters.</p>
          </div>

          {error && <p className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{error}</p>}

          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Policy Document Context
              </label>
              <textarea
                required
                rows={6}
                value={policyText}
                onChange={(e) => setPolicyText(e.target.value)}
                placeholder="Paste insurance policy text or summary contract parameters here..."
                className="w-full p-4 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800 leading-relaxed font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Coverage Query
              </label>
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Is MRI or chemotherapy covered?"
                className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-[#ff5224] text-slate-800 font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition flex justify-center items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>{loading ? "Checking Policy..." : "Check Coverage"}</span>
              <Send size={14} />
            </button>
          </form>
        </div>

        {/* Right Column: Search Results */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <div className="p-6 premium-card bg-white border border-[#f1f5f9] space-y-5">
              {/* Coverage Badge */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Coverage Status</span>
                  <h3 className="font-extrabold text-slate-800 text-sm mt-0.5">Insurance Claim Policy Analysis</h3>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${
                  result.covered 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {result.covered ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  <span>{result.covered ? "Covered" : "Excluded"}</span>
                </div>
              </div>

              {/* Claims explanations */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Claims Advisor Assessment</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">{result.explanation}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Copays & Deductibles</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">{result.deductible_copay || "None indicated under policy sections."}</p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100/50 pt-3 text-[10px] text-slate-400 font-bold uppercase">
                  <span>Confidence Rating: {result.confidence_score}%</span>
                  <span>AI Claims Analyst v1.0</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 bg-white border border-[#f1f5f9] rounded-[24px] text-center text-slate-400 font-semibold min-h-[340px] flex flex-col justify-center items-center">
              <FileSearch size={40} className="text-slate-300 mb-3 animate-pulse" />
              <h3 className="font-extrabold text-slate-700 text-sm">Policy Claims Assessor</h3>
              <p className="text-xs max-w-sm mt-1 leading-normal font-semibold">
                Submit claim queries against insurance terms. Explains deductible margins, coverage limits, and authorization necessities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
