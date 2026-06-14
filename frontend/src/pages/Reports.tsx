import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Download, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();
  
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    setSuccess(false);

    try {
      const response = await fetchWithAuth('/drugs/report');
      if (response.ok) {
        // Handle binary PDF blob download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MediGuard_AI_Health_Report_${new Date().toISOString().slice(0,10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setSuccess(true);
      } else {
        alert("Failed to compile PDF. Ensure you have added active reminders/medications.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error generating PDF report.");
    } finally {
      setDownloading(false);
    }
  };

  const reportItems = [
    "List of all active scheduled medications and strengths",
    "ML-classified overall safety risk score",
    "Pairwise drug-drug adverse interaction warnings",
    "Duplicate active ingredient consumption alerts",
    "Allergy matching alerts from your profile",
    "Medication calendar schedules (Morning, Noon, Night)",
    "Dietary restrictions and food warnings (e.g. Grapefruit)",
    "Detailed alcohol compatibility and risks"
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up pb-8">
      <div className="p-10 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm flex flex-col items-center justify-center text-center min-h-[380px]">
        {/* Animated Badge */}
        <div className="p-5 bg-[#ff5224]/10 text-[#ff5224] border border-[#ff5224]/15 rounded-full mb-6">
          <FileText size={42} className="animate-pulse" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Medicine Safety Report</h2>
        <p className="text-xs text-slate-400 font-semibold mt-3 max-w-md">
          Download a comprehensive, print-ready PDF health summary. Take this document to your next doctor or pharmacist appointment.
        </p>

        {/* Action Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="mt-8 flex items-center justify-center gap-2 px-8 py-3.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition shadow-sm disabled:opacity-50"
        >
          {downloading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Compiling PDF Report...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Download PDF Safety Report</span>
            </>
          )}
        </button>

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold mt-4">
            <CheckCircle2 size={14} />
            <span>PDF compiled and downloaded successfully!</span>
          </div>
        )}
      </div>

      {/* Report Features Checklist */}
      <div className="p-8 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
          <ShieldCheck className="text-[#ff5224]" size={16} />
          <h3 className="font-extrabold text-slate-800 text-xs">Included in the PDF Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportItems.map((item, idx) => (
            <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-500 font-semibold">
              <span className="text-[#ff5224] select-none font-bold">✔</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Alert */}
      <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
        <Info className="text-slate-400 flex-shrink-0" size={18} />
        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
          <strong>Tip:</strong> The generated report updates dynamically as you add or remove medication reminders, edit schedules, or alter your allergy log.
        </p>
      </div>
    </div>
  );
};
