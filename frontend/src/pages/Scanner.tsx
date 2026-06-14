import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Camera, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Info,
  StopCircle,
  Video
} from 'lucide-react';

interface ScannedDrug {
  name: string;
  strength: string;
}

interface ExpiryDetails {
  mfg_date: string;
  exp_date: string;
  status: 'Valid' | 'Expiring Soon' | 'Expired';
}

export const Scanner: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const { largeText } = useTheme();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const [results, setResults] = useState<{
    detected_drugs: ScannedDrug[];
    expiry: ExpiryDetails;
    raw_text: string[];
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
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
    
    // Match canvas dimensions to video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "captured_medicine_strip.png", { type: "image/png" });
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
      stopCamera();
    }
  };

  const handleScanPack = async () => {
    if (!selectedFile) {
      alert("Please upload or take an image first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetchWithAuth('/drugs/scan', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setResults({
          detected_drugs: data.detected_drugs,
          expiry: data.expiry,
          raw_text: data.raw_text
        });
      } else {
        const err = await response.json();
        alert(err.detail || "Scanning failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server connection failed. Make sure FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToChecker = () => {
    if (!results) return;
    const drugNames = results.detected_drugs.map(d => d.name);
    navigate('/checker', { state: { prefilledDrugs: drugNames } });
  };

  const getExpiryStyle = (status: string) => {
    switch (status) {
      case 'Expired': return 'border-red-200 text-red-700 bg-red-50/70';
      case 'Expiring Soon': return 'border-amber-200 text-amber-700 bg-amber-50/70 animate-pulse';
      default: return 'border-emerald-200 text-emerald-700 bg-emerald-50/70';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slide-up pb-8">
      {/* Upload Zone: Left 2 cols */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-8 premium-card bg-white border border-[#f1f5f9] min-h-[580px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
              <Camera className="text-[#ff5224]" size={16} />
              <h3 className="font-extrabold text-slate-800 text-sm">Capture or Upload</h3>
            </div>

            <div className="space-y-5">
              {/* Image Preview / Video Stream Zone */}
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
                    alt="Medicine packaging preview" 
                    className="max-h-[220px] rounded-xl object-contain border border-slate-200" 
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-slate-100 border border-slate-200/50 text-slate-400 rounded-2xl mb-3">
                      <Upload size={20} />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Upload Strip / Packaging</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-semibold">Take photo or browse JPG, PNG</span>
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

              {/* Hidden canvas for video captures */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          {/* Action buttons at bottom */}
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
              onClick={handleScanPack}
              disabled={loading || !selectedFile}
              className="flex-1 py-3.5 text-xs font-bold text-white bg-[#ff5224] hover:bg-[#e0451e] rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing OCR...' : 'Scan Packing'}
            </button>
          </div>
        </div>
      </div>

      {/* OCR Outputs: Right 3 cols */}
      <div className="lg:col-span-3 space-y-6">
        {!results && !loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm text-center min-h-[580px]">
            <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-4">
              <Info size={36} />
            </div>
            <h4 className="text-slate-800 font-extrabold text-sm">Awaiting Upload</h4>
            <p className="text-xs text-slate-400 font-medium mt-2 max-w-sm">
              Use your device camera or upload a clear photo of your medicine strip (front text showing brand name) or expiry stamp, then click Scan.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-12 bg-white border border-[#f1f5f9] rounded-[24px] shadow-sm text-center min-h-[580px]">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#ff5224] rounded-full animate-spin mb-4"></div>
            <h4 className="text-slate-800 font-extrabold text-xs">Processing OCR Extractor...</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Reading characters and identifying brand databases.</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Expiry Banner */}
            <div className={`p-4 border rounded-2xl flex items-center justify-between ${getExpiryStyle(results.expiry.status)}`}>
              <div className="flex items-center gap-3">
                <Calendar className="flex-shrink-0" size={22} />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Expiry Date Assessment</span>
                  <p className="font-bold text-xs">
                    Status: <span className="uppercase">{results.expiry.status}</span> (Expires: {results.expiry.exp_date || 'N/A'})
                  </p>
                </div>
              </div>
              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                results.expiry.status === 'Expired' ? 'bg-red-500 text-white' : 
                results.expiry.status === 'Expiring Soon' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                {results.expiry.status}
              </span>
            </div>

            {/* Extracted medicine profile */}
            <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h4 className="font-extrabold text-slate-800 text-xs">Detected Medications</h4>
                <button
                  onClick={handleAddToChecker}
                  className="flex items-center gap-1 text-[10px] text-[#ff5224] hover:underline font-bold"
                >
                  <span>Verify Interactions</span>
                  <ArrowRight size={10} />
                </button>
              </div>

              <div className="space-y-3">
                {results.detected_drugs.map((drug, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{drug.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Strength: {drug.strength}</p>
                    </div>
                    <span className="text-[9px] px-2.5 py-1 bg-white text-[#ff5224] border border-[#ff5224]/30 rounded-full font-bold">
                      Verified Match
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Text Log */}
            <div className="p-6 premium-card bg-white border border-[#f1f5f9]">
              <h4 className="font-extrabold text-slate-800 mb-2 text-xs">Raw OCR Text Output</h4>
              <p className="text-[10px] text-slate-400 font-semibold mb-3">Extracted lines from EasyOCR bounding boxes:</p>
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
