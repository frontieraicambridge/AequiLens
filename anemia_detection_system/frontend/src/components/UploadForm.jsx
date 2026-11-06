import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, Eye, Hand, FileText, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000/api/records/';

export default function UploadForm({ onUploadSuccess }) {
  const [formData, setFormData] = useState({
    patient_id: '',
    sample_id: '',
    symptoms: '',
    diagnosis_codes: 'D50.0, D50.9',
  });

  const [conjunctivaFile, setConjunctivaFile] = useState(null);
  const [conjunctivaPreview, setConjunctivaPreview] = useState(null);

  const [fingernailFile, setFingernailFile] = useState(null);
  const [fingernailPreview, setFingernailPreview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Dropzone for conjunctiva image
  const onDropConjunctiva = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setConjunctivaFile(file);
      setConjunctivaPreview(URL.createObjectURL(file));
    }
  }, []);

  const {
    getRootProps: getConjunctivaRootProps,
    getInputProps: getConjunctivaInputProps,
    isDragActive: isConjunctivaDragActive,
  } = useDropzone({
    onDrop: onDropConjunctiva,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  // Dropzone for fingernail image
  const onDropFingernail = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFingernailFile(file);
      setFingernailPreview(URL.createObjectURL(file));
    }
  }, []);

  const {
    getRootProps: getFingernailRootProps,
    getInputProps: getFingernailInputProps,
    isDragActive: isFingernailDragActive,
  } = useDropzone({
    onDrop: onDropFingernail,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.patient_id.trim() || !formData.sample_id.trim()) {
      setErrorMessage('Patient ID and Sample ID are required.');
      return;
    }

    if (!conjunctivaFile || !fingernailFile) {
      setErrorMessage('Please upload both Conjunctiva and Fingernail images.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse diagnosis codes comma-separated string to array
      const parsedCodes = formData.diagnosis_codes
        .split(',')
        .map((code) => code.trim())
        .filter((code) => code.length > 0);

      const payload = new FormData();
      payload.append('patient_id', formData.patient_id.trim());
      payload.append('sample_id', formData.sample_id.trim());
      payload.append('symptoms', formData.symptoms.trim());
      payload.append('diagnosis_codes', JSON.stringify(parsedCodes));
      payload.append('conjunctiva_img', conjunctivaFile);
      payload.append('fingernail_img', fingernailFile);

      const response = await axios.post(API_BASE_URL, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.id) {
        onUploadSuccess(response.data.id);
      } else {
        throw new Error('Invalid response structure received from API.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      const serverDetail =
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : null);
      setErrorMessage(serverDetail || err.message || 'Failed to submit record. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Patient & Multimodal Data Submission
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Provide patient clinical indicators and upload conjunctiva & fingernail photography for deep learning assessment.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Grid: Patient & Clinical details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Patient ID *
          </label>
          <input
            type="text"
            name="patient_id"
            value={formData.patient_id}
            onChange={handleInputChange}
            placeholder="e.g. PAT-2026-0042"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Sample ID *
          </label>
          <input
            type="text"
            name="sample_id"
            value={formData.sample_id}
            onChange={handleInputChange}
            placeholder="e.g. SMP-01"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Diagnosis ICD-10 Codes (comma-separated)
          </label>
          <input
            type="text"
            name="diagnosis_codes"
            value={formData.diagnosis_codes}
            onChange={handleInputChange}
            placeholder="D50.0, D50.9"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
          />
          <span className="text-xs text-slate-400 mt-1 block">
            Codes will be parsed and mapped to the 128-d clinical feature embedding.
          </span>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Reported Symptoms & Clinical Notes
          </label>
          <textarea
            name="symptoms"
            rows="3"
            value={formData.symptoms}
            onChange={handleInputChange}
            placeholder="Fatigue, pale conjunctiva, shortness of breath on mild exertion, dizziness..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
          />
        </div>
      </div>

      {/* Grid: Image Dropzones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        {/* Conjunctiva Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-indigo-600" />
            Palpebral Conjunctiva Image *
          </label>

          <div
            {...getConjunctivaRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative min-h-[190px] flex flex-col justify-center items-center ${
              isConjunctivaDragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : conjunctivaFile
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <input {...getConjunctivaInputProps()} />

            {conjunctivaPreview ? (
              <div className="space-y-2">
                <img
                  src={conjunctivaPreview}
                  alt="Conjunctiva preview"
                  className="w-24 h-24 object-cover rounded-lg mx-auto shadow-md border"
                />
                <p className="text-xs font-medium text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {conjunctivaFile.name}
                </p>
                <span className="text-[11px] text-slate-400">Click or drag to replace</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">Drag & drop conjunctiva image</p>
                <p className="text-[11px] text-slate-400">PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Fingernail Dropzone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-indigo-600" />
            Fingernail Bed Image *
          </label>

          <div
            {...getFingernailRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition relative min-h-[190px] flex flex-col justify-center items-center ${
              isFingernailDragActive
                ? 'border-indigo-500 bg-indigo-50/50'
                : fingernailFile
                ? 'border-emerald-400 bg-emerald-50/20'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
            }`}
          >
            <input {...getFingernailInputProps()} />

            {fingernailPreview ? (
              <div className="space-y-2">
                <img
                  src={fingernailPreview}
                  alt="Fingernail preview"
                  className="w-24 h-24 object-cover rounded-lg mx-auto shadow-md border"
                />
                <p className="text-xs font-medium text-emerald-700 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {fingernailFile.name}
                </p>
                <span className="text-[11px] text-slate-400">Click or drag to replace</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">Drag & drop fingernail image</p>
                <p className="text-[11px] text-slate-400">PNG, JPG up to 10MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting & Queuing Prediction...
            </>
          ) : (
            <>
              Analyze Anemia Risk
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

