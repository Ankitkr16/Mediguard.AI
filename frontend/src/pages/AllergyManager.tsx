import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface Allergy {
  id: number;
  allergen_name: string;
  severity: string;
}

export const AllergyManager: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();

  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [allergenName, setAllergenName] = useState('');
  const [severity, setSeverity] = useState('Medium');

  const loadAllergies = async () => {
    try {
      const response = await fetchWithAuth('/drugs/allergies');
      if (response.ok) {
        const data = await response.json();
        setAllergies(data);
      }
    } catch (err) {
      console.error("Failed to load allergies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllergies();
  }, []);

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergenName.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetchWithAuth('/drugs/allergies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allergen_name: allergenName.trim(),
          severity: severity
        })
      });

      if (response.ok) {
        setAllergenName('');
        setSeverity('Medium');
        await loadAllergies();
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to add allergy.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAllergy = async (id: number) => {
    if (!confirm("Are you sure you want to delete this allergy from your profile?")) return;

    try {
      const response = await fetchWithAuth(`/drugs/allergies/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadAllergies();
      } else {
        alert("Failed to delete allergy.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up items-stretch">
      {/* Configure Panel: Left 2 Cols */}
      <div className="lg:col-span-2 flex flex-col gap-6 justify-between min-h-[580px]">
        <div className="p-8 premium-card bg-white border border-[#f1f5f9] flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
              <Plus className="text-[#ff5224]" size={16} />
              <h3 className="font-extrabold text-slate-800 text-sm">Add Allergy Profile</h3>
            </div>

            <form onSubmit={handleAddAllergy} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Allergen Name (Drug / Class)
                </label>
                <input
                  type="text"
                  required
                  value={allergenName}
                  onChange={(e) => setAllergenName(e.target.value)}
                  placeholder="e.g. Penicillin, Aspirin, Sulfa"
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#ff5224] focus:ring-1 focus:ring-[#ff5224] outline-none transition text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Reaction Severity
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#ff5224] cursor-pointer"
                >
                  <option value="Low">Low (Mild rash or itching)</option>
                  <option value="Medium">Medium (Hives, swelling, wheezing)</option>
                  <option value="High">High (Anaphylaxis, breathing blockage)</option>
                </select>
              </div>
            </form>
          </div>

          <div className="pt-6">
            <button
              onClick={handleAddAllergy}
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center w-full py-3.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                'Save Allergen'
              )}
            </button>
          </div>
        </div>

        {/* Informative Help Guide */}
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-[20px] space-y-2.5">
          <h4 className="flex items-center gap-1 text-slate-700 font-bold text-xs uppercase tracking-wider">
            <Info size={14} className="text-[#ff5224]" />
            <span>Medication Allergies Guide</span>
          </h4>
          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
            Many patients have drug allergies that trigger dangerous symptoms. Common classes include:
          </p>
          <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4 font-semibold">
            <li><strong>Penicillins:</strong> Amoxicillin, Ampicillin, Penicillin G.</li>
            <li><strong>NSAIDs:</strong> Aspirin, Ibuprofen, Naproxen.</li>
            <li><strong>Sulfa Drugs:</strong> Sulfamethoxazole (in Bactrim).</li>
          </ul>
        </div>
      </div>

      {/* Allergies List: Right 3 Cols */}
      <div className="lg:col-span-3 flex flex-col min-h-[580px]">
        <div className="p-8 premium-card bg-white border border-[#f1f5f9] flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
              <ShieldAlert className="text-[#ff5224]" size={16} />
              <h3 className="font-extrabold text-slate-800 text-sm">Active Allergy Log</h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#ff5224]" size={20} />
              </div>
            ) : allergies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-xs font-bold text-slate-700">No allergies registered.</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-2 font-semibold">Configure drug allergies on the left to activate alerts during scans.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allergies.map((alg) => (
                  <div key={alg.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100">
                        <ShieldAlert size={18} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{alg.allergen_name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Reaction Category: Allergy</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getSeverityBadge(alg.severity)}`}>
                        {alg.severity}
                      </span>
                      <button
                        onClick={() => handleRemoveAllergy(alg.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
