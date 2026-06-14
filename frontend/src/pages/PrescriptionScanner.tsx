import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CalendarClock, 
  Plus, 
  Check, 
  Info,
  Sparkles,
  ArrowRight,
  Video
} from 'lucide-react';

interface PrescriptionSchedule {
  drug_name: string;
  dosage: string;
  time_of_day: string;
  instructions: string;
}

export const PrescriptionScanner: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);
  const [remindersSaved, setRemindersSaved] = useState(false);
  
  const [results, setResults] = useState<{
    schedule: PrescriptionSchedule[];
    raw_text: string[];
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setRemindersSaved(false);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Failed to access camera", err);
      alert("Could not open camera. Please check permissions or upload a photo instead.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Match dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured_prescription.png", { type: "image/png" });
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      }, 'image/png');
    }
    
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setRemindersSaved(false);
      stopCamera();
    }
  };

  const handleScanPrescription = async () => {
    if (!selectedFile) {
      alert("Please choose or capture a prescription image first.");
      return;
    }

    setLoading(true);
    setResults(null);
    setRemindersSaved(false);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetchWithAuth('/drugs/prescription', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResults({
          schedule: data.schedule,
          raw_text: data.raw_text
        });
      } else {
        const err = await response.json();
        alert(err.detail || "Prescription scanning failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed. Make sure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminders = async () => {
    if (!results || results.schedule.length === 0) return;

    setSavingReminders(true);
    try {
      for (const item of results.schedule) {
        await fetchWithAuth('/drugs/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drug_name: item.drug_name,
            dosage: item.dosage,
            time_of_day: item.time_of_day,
            days_of_week: "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
            active: true
          })
        });
      }
      setRemindersSaved(true);
      setTimeout(() => {
        navigate('/reminders');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to save calendar reminders.");
    } finally {
      setSavingReminders(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up pb-8">
      {/* Upload Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-8 premium-card bg-white border border-[#f1f5f9] min-h-[580px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
              <FileText className="text-[#ff5224]" size={16} />
              <h3 className="font-extrabold text-slate-800 text-sm">Upload Rx</h3>
            </div>

            <div className="space-y-5">
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-slate-50/30 min-h-[260px] overflow-hidden">
                {isCameraActive ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full max-h-[220px] rounded-xl object-cover border border-slate-200" 
                    />
                    <div className="flex gap-2 mt-3 w-full">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-lg transition"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-2.5 px-3 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Doctor's Prescription Preview" 
                    className="max-h-[220px] rounded-xl object-contain border border-slate-200" 
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-slate-100 border border-slate-200/50 text-slate-400 rounded-2xl mb-3">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Select Doctor's Prescription</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-semibold">Take photo or browse JPEG, PNG</span>
                  </div>
                )}
                
                {!isCameraActive && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                )}
              </div>

              {/* Hidden canvas for capturing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            {!isCameraActive && (
              <button
                type="button"
                onClick={startCamera}
                className="flex-1 py-3.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition flex justify-center items-center gap-1.5"
              >
                <Video size={14} />
                <span>Use Camera</span>
              </button>
            )}

            <button
              onClick={handleScanPrescription}
              disabled={loading || !selectedFile}
              className="flex-1 py-3.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing OCR...' : 'Scan Prescription'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Columns */}
      <div className="lg:col-span-3 space-y-6">
        {!results && !loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm text-center min-h-[580px]">
            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-4">
              <Info size={36} />
            </div>
            <h4 className="text-slate-800 font-extrabold text-sm">Awaiting Rx scan</h4>
            <p className="text-xs text-slate-400 font-medium mt-2 max-w-sm">
              Use your device camera or upload an image of a doctor's prescription list (with drug names like Metformin, Lisinopril, or Amoxicillin) to build an automatic calendar.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm text-center min-h-[580px]">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ff5224] rounded-full animate-spin mb-4"></div>
            <h4 className="text-slate-800 font-extrabold text-xs">Parsing Prescription...</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">EasyOCR is reading written scripts and mapping daily daily timing patterns.</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Parsed Schedule Card */}
            <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="text-[#ff5224]" size={16} />
                  <h4 className="font-extrabold text-slate-800 text-xs">Parsed Dosage Calendar</h4>
                </div>
                
                {/* Save Schedule to Reminders Action */}
                <button
                  onClick={handleCreateReminders}
                  disabled={savingReminders || remindersSaved || results.schedule.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] disabled:opacity-60 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {savingReminders ? (
                    <Loader2 className="animate-spin" size={12} />
                  ) : remindersSaved ? (
                    <Check size={12} />
                  ) : (
                    <Plus size={12} />
                  )}
                  <span>{remindersSaved ? 'Reminders Created!' : 'Add to Reminders'}</span>
                </button>
              </div>

              <div className="space-y-3">
                {results.schedule.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.drug_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Dosage: {item.dosage} | Timing: <span className="capitalize">{item.time_of_day}</span></p>
                      <p className="text-[10px] text-[#ff5224] mt-0.5 font-bold">Instruction: {item.instructions}</p>
                    </div>
                    <span className="text-[9px] px-2.5 py-1 bg-white text-slate-500 border border-slate-200 rounded-full font-bold">
                      Rx Match
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw lines logged */}
            <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
              <h4 className="font-extrabold text-slate-800 mb-2 text-xs">Raw Prescription OCR lines</h4>
              <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl max-h-[150px] overflow-y-auto">
                {results.raw_text.map((line, idx) => (
                  <p key={idx} className="text-slate-500 font-mono text-[10px] leading-relaxed mb-1">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
