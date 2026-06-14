import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface InteractionResult {
  overall_risk: string;
  predicted_risk_score: number;
  interactions: Array<{
    drug_a: string;
    drug_b: string;
    risk_level: string;
    description: string;
    precautions: string;
  }>;
  duplicates: Array<{
    ingredient: string;
    drugs: string[];
    warning: string;
  }>;
  allergy_alerts: string[];
  food_interactions: Array<{
    drug: string;
    foods_to_avoid: string[];
    description: string;
    precautions: string;
  }>;
  alcohol_interactions: Array<{
    drug: string;
    risk_level: string;
    description: string;
    precautions: string;
  }>;
  precautions: string[];
  side_effects: {
    [key: string]: {
      common: string[];
      rare: string[];
      serious: string[];
      emergency: string[];
    };
  };
}

export const InteractionChecker: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();
  
  const [drugs, setDrugs] = useState<string[]>(['', '']);
  const [ageGroup, setAgeGroup] = useState<number>(1); // Default Adult
  const [alcohol, setAlcohol] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);

  const handleAddDrug = () => {
    setDrugs([...drugs, '']);
  };

  const handleRemoveDrug = (index: number) => {
    const newDrugs = [...drugs];
    newDrugs.splice(index, 1);
    setDrugs(newDrugs);
  };

  const handleDrugChange = (index: number, val: string) => {
    const newDrugs = [...drugs];
    newDrugs[index] = val;
    setDrugs(newDrugs);
  };

  const handleCheckSafety = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredDrugs = drugs.filter(d => d.trim() !== '');
    if (filteredDrugs.length === 0) {
      alert("Please enter at least one medication name.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fetchWithAuth('/drugs/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugs: filteredDrugs,
          age_group: ageGroup,
          alcohol: alcohol
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const err = await response.json();
        alert(err.detail || "Interaction check failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed. Make sure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'border-red-200 text-red-700 bg-red-50/70';
      case 'Medium': return 'border-amber-200 text-amber-700 bg-amber-50/70';
      default: return 'border-emerald-200 text-emerald-700 bg-emerald-50/70';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up pb-8">
      {/* Inputs Form: Left 2 cols */}
      <div className="lg:col-span-2 space-y-6 h-full">
        <div className="p-8 premium-card bg-white border border-[#f1f5f9] min-h-[580px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
              <Sparkles className="text-[#ff5224]" size={18} />
              <h3 className="font-extrabold text-slate-800 text-sm">Enter Medications</h3>
            </div>

            <form onSubmit={handleCheckSafety} className="space-y-5">
              {/* Dynamic Drug Input List */}
              <div className="space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Medication Names
                </label>
                {drugs.map((drug, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={drug}
                      onChange={(e) => handleDrugChange(idx, e.target.value)}
                      placeholder={`e.g. ${idx === 0 ? 'Paracetamol' : idx === 1 ? 'Ibuprofen' : 'Warfarin'}`}
                      className="flex-1 px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#ff5224] focus:ring-1 focus:ring-[#ff5224] outline-none transition text-slate-800"
                    />
                    {drugs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDrug(idx)}
                        className="p-3 text-red-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 rounded-xl transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={handleAddDrug}
                  className="flex items-center gap-1.5 text-[10px] text-[#ff5224] font-bold hover:underline pt-1"
                >
                  <Plus size={12} />
                  <span>Add Another Medication</span>
                </button>
              </div>

              {/* Age Group Selector */}
              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Patient Age Group
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(Number(e.target.value))}
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#ff5224] cursor-pointer"
                >
                  <option value={0}>Child (Under 12 years)</option>
                  <option value={1}>Adult (12 - 65 years)</option>
                  <option value={2}>Elderly (Over 65 years)</option>
                </select>
              </div>

              {/* Alcohol Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                <div>
                  <span className="block text-xs font-bold text-slate-700">Alcohol Consumption</span>
                  <span className="text-[9px] text-slate-400 font-semibold">Enable if alcohol is recently consumed</span>
                </div>
                <input
                  type="checkbox"
                  checked={alcohol}
                  onChange={(e) => setAlcohol(e.target.checked)}
                  className="w-4 h-4 text-[#ff5224] accent-[#ff5224] bg-white border-slate-200 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </div>
            </form>
          </div>

          {/* Submit Button shifted to bottom of card */}
          <div className="pt-6">
            <button
              onClick={handleCheckSafety}
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-3.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Run Safety Analysis'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Display: Right 3 cols */}
      <div className="lg:col-span-3 space-y-6">
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm text-center min-h-[580px]">
            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-4">
              <Info size={36} />
            </div>
            <h4 className="text-slate-800 font-extrabold text-sm">Awaiting Safety Input</h4>
            <p className="text-xs text-slate-400 font-medium mt-2 max-w-sm">
              Enter multiple medications on the left (e.g. Paracetamol & Aspirin) and click check to run ML evaluation.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm text-center min-h-[580px]">
            <div className="relative w-8 h-8 mb-4">
              <div className="absolute w-full h-full border-2 border-slate-200 rounded-full"></div>
              <div className="absolute w-full h-full border-2 border-t-[#ff5224] rounded-full animate-spin"></div>
            </div>
            <h4 className="text-slate-800 font-extrabold text-xs">Evaluating Medicine Safety...</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Cross-referencing database and training weights.</p>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            {/* Risk Gauge Header */}
            <div className={`p-6 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 ${getRiskColor(result.overall_risk)}`}>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Safety Risk Classifier Level</span>
                <h3 className="text-xl font-black mt-1 uppercase tracking-tight">
                  {result.overall_risk} Risk ({result.predicted_risk_score}%)
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">
                  Classifier evaluation based on active ingredients combination, side effects, age group, and alcohol flags.
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-wider ${getRiskBadge(result.overall_risk)}`}>
                {result.overall_risk} Risk
              </div>
            </div>

            {/* Allergy Red Alert (if any) */}
            {result.allergy_alerts && result.allergy_alerts.map((alertText, index) => (
              <div key={index} className="p-4 bg-red-50 border border-red-200/60 rounded-2xl flex gap-3 text-left">
                <ShieldAlert className="text-red-500 flex-shrink-0" size={20} />
                <div>
                  <h4 className="text-red-700 font-bold text-xs">Allergy Warning</h4>
                  <p className="text-xs text-red-600/90 mt-1 font-semibold">{alertText}</p>
                </div>
              </div>
            ))}

            {/* Duplicate Ingredient Warnings */}
            {result.duplicates && result.duplicates.map((dup, index) => (
              <div key={index} className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex gap-3 text-left">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <div>
                  <h4 className="text-amber-700 font-bold text-xs">Duplicate Active Ingredients Warning</h4>
                  <p className="text-xs text-amber-600/90 mt-1 font-semibold">
                    {dup.warning} (Medicines containing <strong>{dup.ingredient}</strong>: {dup.drugs.join(', ')})
                  </p>
                </div>
              </div>
            ))}

            {/* Interaction details */}
            <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
              <h3 className="font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100 text-xs">
                Drug-Drug Interactions ({result.interactions.length})
              </h3>
              
              {result.interactions.length === 0 ? (
                <div className="flex gap-2 items-center text-xs text-slate-400 bg-slate-50 p-4 border border-slate-200/50 rounded-xl">
                  <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={16} />
                  <span className="font-semibold text-[11px]">No drug-drug interactions detected between the entered medicines.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.interactions.map((inter, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-slate-800">
                          {inter.drug_a} + {inter.drug_b}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getRiskBadge(inter.risk_level)}`}>
                          {inter.risk_level}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold"><strong className="text-slate-600 font-bold">Reaction:</strong> {inter.description}</p>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 font-semibold"><strong className="text-slate-600 font-bold">Precautions:</strong> {inter.precautions}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Food & Alcohol interactions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Food Warnings */}
              <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
                <h4 className="font-extrabold text-slate-800 mb-3 text-xs">Dietary Restrictions</h4>
                <div className="space-y-3">
                  {result.food_interactions.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold">No food restriction alerts.</p>
                  ) : (
                    result.food_interactions.map((food, idx) => (
                      <div key={idx} className="text-xs">
                        <p className="font-bold text-slate-700 mb-1">{food.drug}</p>
                        {food.foods_to_avoid.map((item, fidx) => (
                          <p key={fidx} className="text-slate-500 text-xs pl-2 border-l border-[#ff5224] mb-1 font-semibold">
                            Avoid: <strong>{item}</strong>
                          </p>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Alcohol Warnings */}
              <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
                <h4 className="font-extrabold text-slate-800 mb-3 text-xs">Alcohol Compatibility</h4>
                <div className="space-y-3">
                  {result.alcohol_interactions.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold">No alcohol warnings recorded.</p>
                  ) : (
                    result.alcohol_interactions.map((alc, idx) => (
                      <div key={idx} className="text-xs">
                        <p className="font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>{alc.drug}</span>
                          <span className={`text-[8px] px-1.5 rounded font-bold uppercase ${getRiskBadge(alc.risk_level)}`}>
                            {alc.risk_level} Risk
                          </span>
                        </p>
                        <p className="text-slate-400 leading-relaxed text-[10px] font-semibold">{alc.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Side Effects Monograph */}
            <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
              <h3 className="font-extrabold text-slate-800 mb-4 pb-2 border-b border-slate-100 text-xs">
                Known Side Effects
              </h3>
              <div className="space-y-5">
                {Object.keys(result.side_effects).map((drugName) => {
                  const se = result.side_effects[drugName];
                  return (
                    <div key={drugName} className="space-y-2">
                      <h4 className="text-xs font-bold text-[#ff5224]">{drugName} Side Effects</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 p-3 border border-slate-100 rounded-xl">
                          <p className="font-bold text-slate-700 mb-1 text-xs">Common Symptoms</p>
                          <ul className="list-disc pl-3 space-y-0.5 text-slate-500 font-semibold">
                            {se.common.slice(0, 3).map((s, idx) => <li key={idx}>{s}</li>)}
                          </ul>
                        </div>
                        <div className="bg-red-50/55 p-3 border border-red-100 rounded-xl">
                          <p className="font-bold text-red-700 mb-1 text-xs">Serious Symptoms</p>
                          <ul className="list-disc pl-3 space-y-0.5 text-red-600/90 font-semibold">
                            {se.serious.slice(0, 3).map((s, idx) => <li key={idx}>{s}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Medical Consultation Alert */}
            <div className="p-4 border border-red-200/60 bg-red-50 rounded-2xl flex items-center gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 animate-bounce" size={20} />
              <p className="text-[10px] text-red-700 leading-relaxed font-semibold">
                <strong>IMPORTANT:</strong> High risk interaction or dosage overlaps require medical clearance. Do not adjust your medicine dosages without consulting a certified physician or pharmacist.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
