import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import ResultsDisplay from './components/ResultsDisplay';
import { Stethoscope, Activity, Layers, ShieldCheck, HeartPulse } from 'lucide-react';

export default function App() {
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [view, setView] = useState('upload'); // 'upload' | 'results'

  const handleUploadSuccess = (recordId) => {
    setActiveRecordId(recordId);
    setView('results');
  };

  const handleReset = () => {
    setActiveRecordId(null);
    setView('upload');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                AequiLens
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Multimodal AI
                </span>
              </h1>
              <p className="text-xs text-slate-500">Iron Deficiency Anemia Risk Detection System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                view === 'upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upload & Scan
            </button>
            <button
              onClick={() => setView('results')}
              disabled={!activeRecordId}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                view === 'results'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : activeRecordId
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              Inference Results {activeRecordId ? `(Active)` : ''}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-grow">
        {/* Architecture Pill Banner */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 font-medium">
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span>Dual ResNet-50 Feature Extractor</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span>128-d Clinical & ICD-10 Tabular MLP</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Celery Async Background Inference</span>
          </div>
        </div>

        {/* Dynamic View Display */}
        {view === 'upload' ? (
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        ) : (
          <ResultsDisplay recordId={activeRecordId} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>AequiLens Medical AI Research Prototype</span>
          <span>Django REST • PyTorch • Celery • Redis • Vite + React</span>
        </div>
      </footer>
    </div>
  );
}

