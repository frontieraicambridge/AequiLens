import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  PlusCircle,
  FileText,
  Eye,
  Hand,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/records/';

export default function ResultsDisplay({ recordId, onReset }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}${recordId}/`);
        if (!isMounted) return;

        setRecord(response.data);
        setFetchError(null);
        setLoading(false);

        // If status is still PENDING or PROCESSING, continue polling
        if (response.data.status === 'PENDING' || response.data.status === 'PROCESSING') {
          setPollCount((prev) => prev + 1);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error polling status:', err);
        setFetchError('Unable to connect to backend server or record not found.');
        setLoading(false);
      }
    };

    // Immediate initial fetch
    fetchStatus();

    // Setup 3-second interval polling while in PENDING or PROCESSING
    const intervalId = setInterval(() => {
      if (!record || record.status === 'PENDING' || record.status === 'PROCESSING') {
        fetchStatus();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [recordId, record?.status]);

  // Compute risk level categories and gauge parameters
  const getRiskMetadata = (score) => {
    if (score === null || score === undefined) {
      return {
        label: 'Awaiting Computation',
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        icon: Clock,
        advice: 'ML model inference is processing...',
      };
    }

    const pct = Math.round(score * 100);

    if (score < 0.35) {
      return {
        pct,
        label: 'Low Risk of Iron Deficiency Anemia',
        badge: 'Low Risk',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        barColor: 'bg-emerald-500',
        icon: ShieldCheck,
        advice: 'Microvascular conjunctival perfusion and nail bed capillary indicators are within standard physiologic margins.',
      };
    } else if (score < 0.70) {
      return {
        pct,
        label: 'Moderate / Borderline Anemia Risk',
        badge: 'Moderate Risk',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        barColor: 'bg-amber-500',
        icon: Shield,
        advice: 'Pallor characteristics detected. Supplemental complete blood count (CBC) and serum ferritin testing recommended.',
      };
    } else {
      return {
        pct,
        label: 'High Probability of Iron Deficiency Anemia',
        badge: 'High Risk',
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        barColor: 'bg-rose-500',
        icon: ShieldAlert,
        advice: 'Severe mucosal pallor and digital nail bed patterns detected. Immediate clinical assessment and serum iron panels advised.',
      };
    }
  };

  if (loading && !record) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-12 text-center space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
        <h3 className="text-lg font-semibold text-slate-700">Connecting to Assessment Service...</h3>
        <p className="text-sm text-slate-400">Record ID: {recordId}</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 space-y-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="w-8 h-8" />
          <h3 className="text-lg font-bold">Network / Retrieval Error</h3>
        </div>
        <p className="text-sm text-slate-600">{fetchError}</p>
        <button
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-900 transition"
        >
          Return to Submission Form
        </button>
      </div>
    );
  }

  const isPending = record.status === 'PENDING' || record.status === 'PROCESSING';
  const isFailed = record.status === 'FAILED';
  const isCompleted = record.status === 'COMPLETED';
  const riskInfo = getRiskMetadata(record.risk_score);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Multimodal Assessment Record
          </span>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">
            Patient: {record.patient_id} <span className="text-slate-400 font-normal">/ {record.sample_id}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">UUID: {record.id}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          {isPending && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{record.status} (Polling #{pollCount})</span>
            </div>
          )}

          {isFailed && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>INFERENCE FAILED</span>
            </div>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>COMPLETED</span>
            </div>
          )}

          <button
            onClick={onReset}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            New Assessment
          </button>
        </div>
      </div>

      {/* Pending / Processing State */}
      {isPending && (
        <div className="py-12 px-6 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-white shadow-md mx-auto flex items-center justify-center text-indigo-600">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Deep Learning Inference in Progress</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            The Celery worker is preprocessing dual ResNet-50 branches for fingernail and conjunctival pallor
            and executing the fusion head. Status refreshes automatically every 3 seconds.
          </p>
        </div>
      )}

      {/* Failed State */}
      {isFailed && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <AlertTriangle className="w-5 h-5" />
            Analysis encountered an execution fault
          </div>
          <p className="text-sm">
            The worker failed while evaluating the image tensor or executing PyTorch forward pass. Check Celery task logs.
          </p>
        </div>
      )}

      {/* Completed State: Risk Gauge and Detailed Metrics */}
      {isCompleted && (
        <div className="space-y-6">
          {/* Main Risk Score Card */}
          <div className={`p-8 rounded-2xl border ${riskInfo.bg} ${riskInfo.border} space-y-6`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center ${riskInfo.color}`}>
                  <riskInfo.icon className="w-9 h-9" />
                </div>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white border shadow-sm ${riskInfo.color}`}>
                    {riskInfo.badge}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 mt-2">{riskInfo.label}</h3>
                  <p className="text-sm text-slate-600 mt-1 max-w-xl">{riskInfo.advice}</p>
                </div>
              </div>

              {/* Numerical Score */}
              <div className="text-center md:text-right bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 min-w-[150px]">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Risk Score</span>
                <div className={`text-4xl font-extrabold ${riskInfo.color}`}>{riskInfo.pct}%</div>
                <span className="text-[11px] text-slate-400 font-mono">raw: {record.risk_score?.toFixed(4)}</span>
              </div>
            </div>

            {/* Visual Risk Gauge Meter Bar */}
            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>0% (Low)</span>
                <span>35% (Borderline)</span>
                <span>70% (Elevated)</span>
                <span>100% (High)</span>
              </div>
              <div className="w-full h-4 bg-white/80 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${riskInfo.barColor}`}
                  style={{ width: `${Math.min(Math.max(riskInfo.pct, 3), 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Multimodal Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Conjunctiva Evidence */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Eye className="w-4 h-4 text-indigo-600" />
                Conjunctiva Evidence
              </div>
              {record.conjunctiva_img ? (
                <img
                  src={record.conjunctiva_img}
                  alt="Conjunctiva sample"
                  className="w-full h-48 object-cover rounded-xl border bg-white"
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400 bg-white rounded-xl border">
                  No image available
                </div>
              )}
            </div>

            {/* Fingernail Evidence */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                <Hand className="w-4 h-4 text-indigo-600" />
                Fingernail Bed Evidence
              </div>
              {record.fingernail_img ? (
                <img
                  src={record.fingernail_img}
                  alt="Fingernail sample"
                  className="w-full h-48 object-cover rounded-xl border bg-white"
                />
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400 bg-white rounded-xl border">
                  No image available
                </div>
              )}
            </div>
          </div>

          {/* Clinical Parameters */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <FileText className="w-4 h-4 text-indigo-600" />
              Tabular & Clinical Context
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white p-4 rounded-xl border">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">ICD-10 Codes</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(record.diagnosis_codes) && record.diagnosis_codes.length > 0 ? (
                    record.diagnosis_codes.map((code, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold">
                        {code}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 font-mono">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Symptoms Summary</span>
                <p className="text-slate-700 text-xs">{record.symptoms || 'No symptoms noted.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

