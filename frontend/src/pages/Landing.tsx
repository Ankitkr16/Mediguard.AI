import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Shield,
  Camera, 
  FileCheck2, 
  MessageSquareHeart, 
  Volume2, 
  ShieldAlert, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: ShieldAlert,
      title: "Drug-Drug Interaction Checker",
      desc: "Instantly detect adverse reactions between multiple medicines with risk severity levels (Low, Medium, High) driven by our ML risk model."
    },
    {
      icon: Camera,
      title: "Smart Medicine Scanner",
      desc: "Scan strips or boxes with your camera. EasyOCR identifies names, dosages, active ingredients, and checks packaging expiry dates automatically."
    },
    {
      icon: FileCheck2,
      title: "Prescription OCR Scheduler",
      desc: "Upload handwritten or digital doctor prescriptions. Extracts medicines and schedules them into customized calendar reminders."
    },
    {
      icon: MessageSquareHeart,
      title: "AI RAG Chatbot",
      desc: "An intelligent healthcare assistant fed with verified medical monographs. Answers usage, precautions, and storage queries safely."
    },
    {
      icon: Volume2,
      title: "Voice Assistant (Hindi & English)",
      desc: "Perfect for elderly users. Input medications via voice and hear safety summaries read back aloud in either language."
    },
    {
      icon: ShieldCheck,
      title: "Duplicate & Allergy Alerts",
      desc: "Flag duplicate active ingredients across different brand names, and check allergen compatibility against your medical profile."
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#1e293b] flex flex-col justify-between overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-base text-slate-800 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#ff5224] to-[#ff7a59] flex items-center justify-center font-extrabold text-white shadow-md shadow-[#ff5224]/20">
            <Shield size={14} className="text-white" />
          </div>
          <span className="tracking-tight text-[#ff5224]">MediGuard<span className="text-slate-800">.AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              to="/dashboard" 
              className="px-5 py-2 text-xs font-bold bg-[#ff5224] text-white hover:bg-[#e0451e] rounded-xl transition-all shadow-sm"
            >
              Enter Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                Sign In
              </Link>
              <Link 
                to="/signup" 
                className="px-5 py-2 text-xs font-bold bg-[#ff5224] hover:bg-[#e0451e] text-white rounded-xl transition-all shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
        {/* Glow Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-[10px] font-bold tracking-wider text-[#ff5224] uppercase bg-[#ff5224]/10 border border-[#ff5224]/20 rounded-full">
          <Sparkles size={12} />
          <span>Intelligent Medicine Safety</span>
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-4xl md:text-6xl font-black tracking-tight text-slate-800 leading-tight md:leading-none">
          Your Intelligent Shield Against <br />
          <span className="text-[#ff5224]">
            Medication Risks & Side Effects
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mt-6 text-sm md:text-base text-slate-500 leading-relaxed font-medium">
          MediGuard AI helps you and your family use medicines safely. Scan prescription slips, check for dangerous interactions, track dosage schedules, and query our chatbot using your voice.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center w-full max-w-sm">
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="flex-1 px-8 py-3.5 font-bold text-center bg-[#ff5224] text-white hover:bg-[#e0451e] rounded-xl transition-all shadow-sm text-sm"
          >
            Create Free Account
          </Link>
          <Link
            to={user ? "/checker" : "/login"}
            className="flex-1 px-8 py-3.5 font-bold text-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all text-sm"
          >
            Check Interactions
          </Link>
        </div>

        {/* Features grid */}
        <section className="mt-24 w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800">Full-Stack Safety Features</h2>
            <p className="text-slate-500 font-medium text-sm mt-2">Comprehensive protection layers designed for chronic patients, elderly, and caregivers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="premium-card p-6 text-left flex flex-col justify-between bg-white border border-slate-100 rounded-[24px]">
                  <div>
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#ff5224]/10 text-[#ff5224] border border-[#ff5224]/15 mb-4">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Disclaimer strip */}
        <div className="mt-20 p-4 border border-amber-200/60 bg-amber-50/50 rounded-2xl max-w-3xl flex items-start gap-3.5 text-left">
          <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Important Medical Disclaimer:</strong> MediGuard AI is a medicine risk scanner and educational advisor. It does not prescribe medications, calculate medical doses, or replace the diagnosis and treatment recommendations of a qualified medical practitioner.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        <p>© 2026 MediGuard AI – Smart Medicine Safety Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
};
