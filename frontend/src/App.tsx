import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ProfileProvider } from './context/ProfileContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { InteractionChecker } from './pages/InteractionChecker';
import { Scanner } from './pages/Scanner';
import { PrescriptionScanner } from './pages/PrescriptionScanner';
import { AllergyManager } from './pages/AllergyManager';
import { ReminderCenter } from './pages/ReminderCenter';
import { ChatAssistant } from './pages/ChatAssistant';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { FamilyHub } from './pages/FamilyHub';
import { LabReports } from './pages/LabReports';
import { KnowledgeGraph } from './pages/KnowledgeGraph';
import { EmergencyRisk } from './pages/EmergencyRisk';
import { Timeline } from './pages/Timeline';
import { InsuranceAssistant } from './pages/InsuranceAssistant';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fb] text-slate-700">
        <div className="w-10 h-10 border-2 border-[#ff5224]/20 border-t-[#ff5224] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { largeText } = useTheme();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-700">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* App main area */}
      <div className="lg:pl-64 flex flex-col min-h-screen justify-between">
        <div className="flex-1 flex flex-col">
          <Navbar toggleSidebar={toggleSidebar} />
          
          {/* Render page inside */}
          <main className={`flex-1 p-6 ${largeText ? 'large-text-styles' : ''}`}>
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>

        {/* Console Footer */}
        <footer className="py-6 px-8 border-t border-[#e2e8f0]/40 bg-white/70 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5224] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5224]"></span>
              </span>
              <span className="text-xs font-bold text-slate-800 tracking-tight">MediGuard.AI</span>
              <span className="text-[10px] text-slate-400 font-semibold border-l border-slate-200 pl-2">
                Cognitive Medicine Safety System
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Security: SSL Encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ML Classifier: v2.4 Active
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Speech Sync: Bilingual EN/HI
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/checker" element={<ProtectedRoute><MainLayout><InteractionChecker /></MainLayout></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><MainLayout><Scanner /></MainLayout></ProtectedRoute>} />
      <Route path="/prescription" element={<ProtectedRoute><MainLayout><PrescriptionScanner /></MainLayout></ProtectedRoute>} />
      <Route path="/allergies" element={<ProtectedRoute><MainLayout><AllergyManager /></MainLayout></ProtectedRoute>} />
      <Route path="/reminders" element={<ProtectedRoute><MainLayout><ReminderCenter /></MainLayout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><MainLayout><ChatAssistant /></MainLayout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
      <Route path="/family" element={<ProtectedRoute><MainLayout><FamilyHub /></MainLayout></ProtectedRoute>} />
      <Route path="/labs" element={<ProtectedRoute><MainLayout><LabReports /></MainLayout></ProtectedRoute>} />
      <Route path="/graph" element={<ProtectedRoute><MainLayout><KnowledgeGraph /></MainLayout></ProtectedRoute>} />
      <Route path="/emergency" element={<ProtectedRoute><MainLayout><EmergencyRisk /></MainLayout></ProtectedRoute>} />
      <Route path="/timeline" element={<ProtectedRoute><MainLayout><Timeline /></MainLayout></ProtectedRoute>} />
      <Route path="/insurance" element={<ProtectedRoute><MainLayout><InsuranceAssistant /></MainLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
