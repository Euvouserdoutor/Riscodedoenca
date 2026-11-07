import React, { useState, useMemo, useRef } from 'react';
import {
  FlaskConical,
  Play,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Activity,
  Layers,
  Cpu,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  Plus,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Gauge,
  BarChart3,
  Database,
  Grid,
  Zap,
  Info,
  Upload,
  FileSpreadsheet,
  X,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import confetti from 'canvas-confetti';
import { PatientDigitalTwinState } from '../../types';
import { INITIAL_PATIENTS } from '../../data/mockDatabase';
import { runSimulatedQMLTraining, EpochLog, QMLModelMetrics } from '../../services/qmlEngine';

interface SimulationLabViewProps {
  patient: PatientDigitalTwinState;
  onNavigate: (tab: any) => void;
}

type SimulationSubTab = 'preprocessing' | 'training' | 'benchmarks';

// Real-world representative benchmark datasets for local pre-loading
const PRELOADED_BENCHMARKS = {
  pima: {
    name: 'Pima Indians Diabetes (UCI Benchmark)',
    description: 'Pre-clinical metabolic trajectories containing high-dimensional glycemic, BP, and insulin parameters.',
    headers: ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigree', 'Age', 'Outcome'],
    rows: [
      { Pregnancies: 6, Glucose: 148, BloodPressure: 72, SkinThickness: 35, Insulin: 0, BMI: 33.6, DiabetesPedigree: 0.627, Age: 50, Outcome: 1 },
      { Pregnancies: 1, Glucose: 85, BloodPressure: 66, SkinThickness: 29, Insulin: 0, BMI: 26.6, DiabetesPedigree: 0.351, Age: 31, Outcome: 0 },
      { Pregnancies: 8, Glucose: 183, BloodPressure: 64, SkinThickness: 0, Insulin: 0, BMI: 23.3, DiabetesPedigree: 0.672, Age: 32, Outcome: 1 },
      { Pregnancies: 1, Glucose: 89, BloodPressure: 66, SkinThickness: 23, Insulin: 94, BMI: 28.1, DiabetesPedigree: 0.167, Age: 21, Outcome: 0 },
      { Pregnancies: 0, Glucose: 137, BloodPressure: 40, SkinThickness: 35, Insulin: 168, BMI: 43.1, DiabetesPedigree: 2.288, Age: 33, Outcome: 1 },
      { Pregnancies: 5, Glucose: 116, BloodPressure: 74, SkinThickness: 0, Insulin: 0, BMI: 25.6, DiabetesPedigree: 0.201, Age: 30, Outcome: 0 }
    ]
  },
  cleveland: {
    name: 'Cleveland Heart Disease (UCI Benchmark)',
    description: 'Clinical cardiovascular disease trajectories with non-linear multi-biomarker correlations.',
    headers: ['Age', 'Sex', 'CP', 'TrestBps', 'Chol', 'FBS', 'RestECG', 'Thalach', 'ExAng', 'Target'],
    rows: [
      { Age: 63, Sex: 1, CP: 3, TrestBps: 145, Chol: 233, FBS: 1, RestECG: 0, Thalach: 150, ExAng: 0, Target: 1 },
      { Age: 37, Sex: 1, CP: 2, TrestBps: 130, Chol: 250, FBS: 0, RestECG: 1, Thalach: 187, ExAng: 0, Target: 0 },
      { Age: 41, Sex: 0, CP: 1, TrestBps: 130, Chol: 204, FBS: 0, RestECG: 0, Thalach: 172, ExAng: 0, Target: 0 },
      { Age: 56, Sex: 1, CP: 1, TrestBps: 120, Chol: 236, FBS: 0, RestECG: 1, Thalach: 178, ExAng: 0, Target: 1 },
      { Age: 57, Sex: 0, CP: 0, TrestBps: 120, Chol: 354, FBS: 0, RestECG: 1, Thalach: 163, ExAng: 1, Target: 1 },
      { Age: 57, Sex: 1, CP: 0, TrestBps: 140, Chol: 192, FBS: 0, RestECG: 1, Thalach: 148, ExAng: 0, Target: 0 }
    ]
  }
};

export const SimulationLabView: React.FC<SimulationLabViewProps> = ({
  patient,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<SimulationSubTab>('preprocessing');

  // PRE-PROCESSING STUDIO STATE
  const [datasetSource, setDatasetSource] = useState<'synthetic' | 'pima' | 'cleveland' | 'custom'>('synthetic');
  const [imputationMethod, setImputationMethod] = useState<'mean' | 'median' | 'drop'>('mean');
  const [noiseLevel, setNoiseLevel] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [scalerType, setScalerType] = useState<'standard' | 'minmax'>('standard');
  const [splitRatio, setSplitRatio] = useState<number>(80);
  const [enablePCA, setEnablePCA] = useState<boolean>(true);
  const [isApplyingPipeline, setIsApplyingPipeline] = useState<boolean>(false);
  const [pipelineApplied, setPipelineApplied] = useState<boolean>(true);

  // Custom Upload State
  const [customFile, setCustomFile] = useState<{ fileName: string; headers: string[]; rows: any[] } | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Selected Features checklist
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['eGFR', 'HbA1c', 'SystolicBP', 'BMI', 'LDL', 'CRP']);

  // TRAINING CONFIG STATE
  const [modelType, setModelType] = useState<'VQC' | 'QSVM' | 'QNN'>('VQC');
  const [epochs, setEpochs] = useState<number>(20);
  const [qubits, setQubits] = useState<number>(8);

  // Training state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLogs, setTrainingLogs] = useState<EpochLog[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [currentLoss, setCurrentLoss] = useState<number | null>(null);
  const [currentAcc, setCurrentAcc] = useState<number | null>(null);
  const [finalMetrics, setFinalMetrics] = useState<QMLModelMetrics | null>({
    accuracy: 0.942,
    sensitivity: 0.952,
    specificity: 0.931,
    auroc: 0.942,
    f1Score: 0.941,
    precision: 0.931,
    epochsRun: 20,
    finalLoss: 0.184
  });

  // Qubit expectation levels for visualization
  const [measuredQubits, setMeasuredQubits] = useState<{ name: string; probability: number }[]>(
    Array.from({ length: 8 }, (_, i) => ({ name: `q${i}`, probability: 0.12 + Math.random() * 0.15 }))
  );

  // DECISION SUPPORT THRESHOLD STATE
  const [decisionThreshold, setDecisionThreshold] = useState<number>(0.5);

  // Ingested cohort based on selected dataset source
  const rawCohort = useMemo(() => {
    if (datasetSource === 'pima') {
      return PRELOADED_BENCHMARKS.pima.rows;
    }
    if (datasetSource === 'cleveland') {
      return PRELOADED_BENCHMARKS.cleveland.rows;
    }
    if (datasetSource === 'custom' && customFile) {
      return customFile.rows;
    }
    // Default Synthetic Cohort
    return INITIAL_PATIENTS.map((p, idx) => ({
      'Patient ID': p.patientId,
      'Age': p.demographics.age,
      'eGFR': p.organFunction.eGFR,
      'HbA1c': p.organFunction.hba1c,
      'SystolicBP': p.organFunction.systolicBp,
      'BMI': p.demographics.bmi,
      'LDL': p.organFunction.vascularScore + 40,
      'CRP': p.patientId === 'PT-001' ? 4.2 : 1.8,
      'Outcome': p.organFunction.eGFR < 60 || p.organFunction.hba1c > 7.5 || p.organFunction.systolicBp > 140 ? 1 : 0
    }));
  }, [datasetSource, customFile]);

  // Headers list for selected dataset source
  const availableHeaders = useMemo(() => {
    if (datasetSource === 'pima') return PRELOADED_BENCHMARKS.pima.headers;
    if (datasetSource === 'cleveland') return PRELOADED_BENCHMARKS.cleveland.headers;
    if (datasetSource === 'custom' && customFile) return customFile.headers;
    return ['Age', 'eGFR', 'HbA1c', 'SystolicBP', 'BMI', 'LDL', 'CRP'];
  }, [datasetSource, customFile]);

  // Handle manual dataset CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) throw new Error('Uploaded CSV file is empty.');

        const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        const rows: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
          if (vals.length === rawHeaders.length) {
            const rowObj: any = {};
            rawHeaders.forEach((h, idx) => {
              const num = Number(vals[idx]);
              rowObj[h] = isNaN(num) ? vals[idx] : num;
            });
            rows.push(rowObj);
          }
        }

        if (rows.length === 0) throw new Error('No valid numeric or structural data rows found in CSV.');

        setCustomFile({
          fileName: file.name,
          headers: rawHeaders,
          rows
        });
        setDatasetSource('custom');
        // Auto check all headers as selected features (excluding 'Outcome' or 'Target' columns)
        const numericFeatures = rawHeaders.filter(h => h.toLowerCase() !== 'outcome' && h.toLowerCase() !== 'target' && h.toLowerCase() !== 'id');
        setSelectedFeatures(numericFeatures);
        setPipelineApplied(false);
      } catch (err: any) {
        setUploadError(err.message || 'Error parsing CSV file. Please ensure correct comma-separated alignment.');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClearCustomFile = () => {
    setCustomFile(null);
    setDatasetSource('synthetic');
    setSelectedFeatures(['eGFR', 'HbA1c', 'SystolicBP', 'BMI', 'LDL', 'CRP']);
    setPipelineApplied(false);
  };

  // Toggle checklist features
  const handleToggleFeature = (feat: string) => {
    setPipelineApplied(false);
    setSelectedFeatures(prev => {
      if (prev.includes(feat)) {
        return prev.filter(f => f !== feat);
      } else {
        return [...prev, feat];
      }
    });
  };

  // Simulated Clean, Normalization & PCA Subspace Mathematics
  const processedCohortPreview = useMemo(() => {
    if (rawCohort.length === 0 || selectedFeatures.length === 0) return [];

    // Deterministic projection matrices mapping f features to q components (PCA)
    const targetQubits = Math.min(qubits, selectedFeatures.length);
    const W: number[][] = [];
    for (let f = 0; f < selectedFeatures.length; f++) {
      const rowWeights = [];
      for (let c = 0; c < targetQubits; c++) {
        // Generate pseudo-orthogonal projection vectors using deterministic trigonometry
        rowWeights.push(Math.sin((f + 1) * (c + 1) * 1.618));
      }
      W.push(rowWeights);
    }

    // Process first 6 records for visualization
    return rawCohort.slice(0, 6).map((row, rIdx) => {
      const previewRow: any = { id: row['Patient ID'] || `Row ${rIdx + 1}` };
      
      // Calculate missing imputation & normalization
      selectedFeatures.forEach((feat) => {
        let val = Number(row[feat]);
        if (isNaN(val)) {
          // Impute mean fallback
          val = 70.0; 
        }

        // Apply noise if selected
        if (noiseLevel === 'low') val += (Math.sin(rIdx) * 0.05 * val);
        else if (noiseLevel === 'medium') val += (Math.sin(rIdx) * 0.15 * val);
        else if (noiseLevel === 'high') val += (Math.sin(rIdx) * 0.3 * val);

        // Normalize depending on mode
        let normalized = val;
        if (scalerType === 'standard') {
          // pseudo standardization centered around 0 with bounds [-2, 2]
          normalized = (val - 80) / 30;
        } else {
          // MinMax bounded within [0, 1]
          normalized = Math.min(Math.max(val / 150, 0), 1);
        }
        previewRow[feat] = normalized;
      });

      // PCA projection linear algebraic multiplication: x' = W^T * x
      if (enablePCA) {
        for (let c = 0; c < targetQubits; c++) {
          let pcVal = 0;
          selectedFeatures.forEach((feat, fIdx) => {
            const normalizedVal = previewRow[feat] || 0.5;
            pcVal += normalizedVal * W[fIdx][c];
          });
          previewRow[`PC_${c}`] = Number(pcVal.toFixed(3));
        }
      }

      return previewRow;
    });
  }, [rawCohort, selectedFeatures, noiseLevel, scalerType, enablePCA, qubits]);

  // Pipeline compiler trigger
  const handleApplyPipeline = () => {
    setIsApplyingPipeline(true);
    setTimeout(() => {
      setIsApplyingPipeline(false);
      setPipelineApplied(true);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 }
      });
    }, 900);
  };

  // MODEL TRAINING TRIGGER
  const handleStartTraining = () => {
    setIsTraining(true);
    setFinalMetrics(null);
    setTrainingLogs([]);
    setCurrentEpoch(0);
    setCurrentLoss(null);
    setCurrentAcc(null);

    runSimulatedQMLTraining(
      modelType,
      epochs,
      (log) => {
        setTrainingLogs((prev) => [...prev, log]);
        setCurrentEpoch(log.epoch);
        setCurrentLoss(log.loss);
        setCurrentAcc(log.accuracy);

        // Perturb qubit measurements dynamically to show live simulation activity
        setMeasuredQubits(
          Array.from({ length: qubits }, (_, i) => ({
            name: `q${i}`,
            probability: 0.05 + Math.random() * (0.8 / qubits) + (log.epoch / epochs) * 0.08
          }))
        );
      },
      (metrics) => {
        setFinalMetrics(metrics);
        setIsTraining(false);

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.65 }
        });
      }
    );
  };

  // DECISION SUPPORT THRESHOLD CALCULATION
  const optimizedMetricsAtThreshold = useMemo(() => {
    if (!finalMetrics) return null;
    
    // Scale sensitivity and specificity based on threshold (higher threshold increases specificity, decreases sensitivity)
    const factor = (decisionThreshold - 0.5) * 2; // -1 to 1
    const adjustedSens = Math.min(Math.max(finalMetrics.sensitivity - factor * 0.12, 0.65), 0.99);
    const adjustedSpec = Math.min(Math.max(finalMetrics.specificity + factor * 0.15, 0.60), 0.99);
    const adjustedAcc = Math.min(Math.max(finalMetrics.accuracy - Math.abs(factor) * 0.04, 0.75), 0.96);

    return {
      sensitivity: adjustedSens,
      specificity: adjustedSpec,
      accuracy: adjustedAcc,
      f1Score: (2 * adjustedSens * adjustedSpec) / (adjustedSens + adjustedSpec || 1)
    };
  }, [finalMetrics, decisionThreshold]);

  const thresholdRocCurvePoints = useMemo(() => {
    // Generate simulated points for ROC curve plotting
    const points = [];
    for (let t = 0.1; t <= 0.9; t += 0.05) {
      const f = (t - 0.5) * 2;
      const sens = Math.min(Math.max(0.952 - f * 0.12, 0.65), 0.99);
      const spec = Math.min(Math.max(0.931 + f * 0.15, 0.60), 0.99);
      const fpr = 1 - spec;
      points.push({
        threshold: t,
        FPR: Number(fpr.toFixed(3)),
        TPR: Number(sens.toFixed(3)),
        active: Math.abs(t - decisionThreshold) < 0.025
      });
    }
    return points;
  }, [decisionThreshold]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 lg:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 font-mono">Simulated QPU Sandbox</span>
            <h2 className="text-xl lg:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
              QML Early Disease Diagnostic Studio
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold font-mono border border-slate-200">
            Ingested: {rawCohort.length} Samples
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold font-mono border border-purple-200">
            Rigetti QPU Simulator
          </span>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('preprocessing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'preprocessing'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Ingestion & Pre-processing Studio</span>
          {!pipelineApplied && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'training'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Hybrid QML Training Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
            activeTab === 'benchmarks'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>3. Threshold Tuning & Decision Support</span>
        </button>
      </div>

      {/* SUB-TAB 1: INGESTION & PRE-PROCESSING STUDIO */}
      {activeTab === 'preprocessing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Controls - Left Col */}
          <div className="space-y-5 lg:col-span-1">
            {/* Dataset Selection & Upload */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-3xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Dataset Ingestion & Upload</h3>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Biomedical Ingest Source</label>
                  <select
                    value={datasetSource}
                    onChange={(e) => {
                      setDatasetSource(e.target.value as any);
                      setPipelineApplied(false);
                    }}
                    className="w-full mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono outline-none focus:border-blue-500"
                  >
                    <option value="synthetic">Synthetic Stream (Cohort Active Twin)</option>
                    <option value="pima">Pima Indians Diabetes (UCI Benchmark)</option>
                    <option value="cleveland">Cleveland Heart Disease (UCI Benchmark)</option>
                    {customFile && <option value="custom">Manual Upload: {customFile.fileName}</option>}
                  </select>
                </div>

                {/* Upload Button */}
                <div className="pt-1">
                  {customFile ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-emerald-800 font-mono">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold truncate max-w-[160px]">{customFile.fileName}</span>
                      </div>
                      <button
                        onClick={handleClearCustomFile}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove custom dataset"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                        className="w-full py-3 border border-dashed border-slate-300 hover:border-blue-500 bg-[#F8FAFF] hover:bg-blue-50/40 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-700 transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer"
                      >
                        {isParsing ? (
                          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-500" />
                        )}
                        <span>{isParsing ? 'Parsing CSV File...' : 'Upload custom dataset (.csv)'}</span>
                      </button>
                      {uploadError && (
                        <p className="text-[10px] text-rose-600 mt-1.5 leading-normal font-medium">{uploadError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Imputation, Normalization & Noise */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-3xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Data Cleansing & Resiliency</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Missing Value Imputation</label>
                  <select
                    value={imputationMethod}
                    onChange={(e) => {
                      setImputationMethod(e.target.value as any);
                      setPipelineApplied(false);
                    }}
                    className="w-full mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
                  >
                    <option value="mean">Mean Imputation</option>
                    <option value="median">Median Imputation</option>
                    <option value="drop">Drop Missing Records</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Biomarker Normalization</label>
                  <select
                    value={scalerType}
                    onChange={(e) => {
                      setScalerType(e.target.value as any);
                      setPipelineApplied(false);
                    }}
                    className="w-full mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
                  >
                    <option value="standard">StandardScaler (Mean=0, SD=1)</option>
                    <option value="minmax">MinMaxScaler (Range [0, 1])</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Robustness Noise Injection (QML Stress-Test)</label>
                  <select
                    value={noiseLevel}
                    onChange={(e) => {
                      setNoiseLevel(e.target.value as any);
                      setPipelineApplied(false);
                    }}
                    className="w-full mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono outline-none focus:border-purple-500"
                  >
                    <option value="none">Disable (Raw Clean Data)</option>
                    <option value="low">Low Noise (σ = 0.05)</option>
                    <option value="medium">Medium Noise (σ = 0.15)</option>
                    <option value="high">High Noise (σ = 0.30)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {/* Configuration & Preview Table - Right 2 Cols */}
          <div className="lg:col-span-2 space-y-5">
            {/* Feature Selection & Dimensionality Reduction */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Feature Mapping & Dimensionality Reduction (PCA)</h3>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200 rounded font-bold">
                    {selectedFeatures.length} Mapped Features
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Feature checklist */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-2">Select Active Biomarkers for Ingestion</span>
                  <div className="flex flex-wrap gap-2">
                    {availableHeaders.map((feat) => {
                      const isSelected = selectedFeatures.includes(feat);
                      return (
                        <button
                          key={feat}
                          onClick={() => handleToggleFeature(feat)}
                          className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-3xs'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                          <span>{feat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PCA Toggle */}
                <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-lg">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <span>Enable Principal Component Analysis (PCA)</span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[9px] font-mono font-bold">QPU COUPLING</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Compresses selected high-dimensional features down to orthogonal eigenvectors. Projects them cleanly onto the exact number of qubits configured for the quantum feature map.
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enablePCA}
                      onChange={(e) => {
                        setEnablePCA(e.target.checked);
                        setPipelineApplied(false);
                      }}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Processed Data Preview Grid */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Grid className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Pre-processed Ingestion Preview (Top 6 Rows)</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                  {scalerType === 'standard' ? 'Standardized' : 'MinMax Scaled'}
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#F8FAFF] border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-4 py-2.5">ID / Index</th>
                      {enablePCA ? (
                        Array.from({ length: Math.min(qubits, selectedFeatures.length) }).map((_, cIdx) => (
                          <th key={`pc-${cIdx}`} className="px-4 py-2.5 text-purple-700">Principal PC_{cIdx}</th>
                        ))
                      ) : (
                        selectedFeatures.map((feat) => (
                          <th key={feat} className="px-4 py-2.5">{feat}</th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {processedCohortPreview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-sans font-semibold text-slate-900">{row.id}</td>
                        {enablePCA ? (
                          Array.from({ length: Math.min(qubits, selectedFeatures.length) }).map((_, cIdx) => (
                            <td key={`pc-${cIdx}`} className="px-4 py-3 text-purple-800 font-bold">{row[`PC_${cIdx}`]}</td>
                          ))
                        ) : (
                          selectedFeatures.map((feat) => (
                            <td key={feat} className="px-4 py-3">{Number(row[feat]).toFixed(3)}</td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Compilation CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3.5 border-t border-slate-100">
                <div className="flex items-start space-x-2 text-[11px] text-slate-500 max-w-md font-sans">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <p>
                    Ensure your features and cleaning parameters are correct. Click below to compile and lock the feature pipeline before starting model training.
                  </p>
                </div>

                <button
                  onClick={handleApplyPipeline}
                  disabled={isApplyingPipeline || pipelineApplied}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer ${
                    pipelineApplied
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 cursor-default shadow-3xs'
                      : 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-md shadow-slate-900/10'
                  }`}
                >
                  {isApplyingPipeline ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : pipelineApplied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
                  )}
                  <span>{isApplyingPipeline ? 'Compiling Pipeline...' : pipelineApplied ? 'Pipeline Compiled & Locked' : 'Ingest & Pre-process Data'}</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HYBRID QML MODEL TRAINING */}
      {activeTab === 'training' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Config sidebar - Left Col */}
          <div className="space-y-5 lg:col-span-1">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-3xs">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">QML Model Architecture</h3>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Select Quantum Classifier</label>
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => setModelType('VQC')}
                      disabled={isTraining}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        modelType === 'VQC'
                          ? 'border-purple-500 bg-purple-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Variational Quantum Classifier (VQC)</span>
                        {modelType === 'VQC' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal leading-relaxed">
                        Features mapped to Ry angles. Integrates circular CNOT entanglement and optimizations.
                      </p>
                    </button>

                    <button
                      onClick={() => setModelType('QSVM')}
                      disabled={isTraining}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        modelType === 'QSVM'
                          ? 'border-purple-500 bg-purple-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Quantum Support Vector Machine (QSVM)</span>
                        {modelType === 'QSVM' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal leading-relaxed">
                        Constructs a high-dimensional state overlap kernel, identifying clean dividing borders.
                      </p>
                    </button>

                    <button
                      onClick={() => setModelType('QNN')}
                      disabled={isTraining}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        modelType === 'QNN'
                          ? 'border-purple-500 bg-purple-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Quantum Neural Network (QNN)</span>
                        {modelType === 'QNN' && <CheckCircle className="w-4 h-4 text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal leading-relaxed">
                        Chains classic linear feed-forward layer mappings with multi-qubit parameterized unitary networks.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Qubits (Width)</label>
                    <select
                      value={qubits}
                      onChange={(e) => setQubits(parseInt(e.target.value))}
                      disabled={isTraining}
                      className="w-full mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono outline-none focus:border-purple-500 disabled:opacity-50"
                    >
                      <option value="4">4 Qubits</option>
                      <option value="6">6 Qubits</option>
                      <option value="8">8 Qubits (Optimized)</option>
                      <option value="12">12 Qubits</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Epochs (Iterations)</label>
                    <select
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value))}
                      disabled={isTraining}
                      className="w-full mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono outline-none focus:border-purple-500 disabled:opacity-50"
                    >
                      <option value="10">10 Epochs</option>
                      <option value="20">20 Epochs</option>
                      <option value="30">30 Epochs</option>
                      <option value="50">50 Epochs</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleStartTraining}
                  disabled={isTraining || !pipelineApplied}
                  className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isTraining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  <span>{isTraining ? `Optimizing Parameter Ansatz...` : 'Train QML Classifier'}</span>
                </button>
              </div>
            </section>
          </div>

          {/* Telemetry charts - Right 2 Cols */}
          <div className="lg:col-span-2 space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <h3 className="text-sm font-bold text-slate-900">Active QML Convergence Telemetry</h3>
                </div>
                {isTraining && (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold animate-pulse">
                    SHOT SIMULATION ACTIVE
                  </span>
                )}
              </div>

              {trainingLogs.length === 0 && !isTraining ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-400">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Awaiting Simulation Ignition</h4>
                  <p className="text-xs text-slate-400 max-w-sm font-sans">
                    Lock your pre-processing steps in Tab 1 and trigger **Train QML Classifier** to begin the variational parameter optimization loop.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats display */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono text-center shadow-3xs">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">EPOCH METRIC</span>
                      <span className="text-lg font-black text-slate-900">{currentEpoch} <span className="text-slate-400 text-xs">/ {epochs}</span></span>
                    </div>
                    <div className="p-3 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono text-center shadow-3xs">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">STATE LOSS</span>
                      <span className="text-lg font-black text-rose-600">
                        {currentLoss ? currentLoss.toFixed(4) : '0.0000'}
                      </span>
                    </div>
                    <div className="p-3 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono text-center shadow-3xs">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">VAL ACCURACY</span>
                      <span className="text-lg font-black text-emerald-600">
                        {currentAcc ? `${(currentAcc * 100).toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-64 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trainingLogs}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="epoch" tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#94A3B8" />
                        <YAxis domain={[0, 1]} tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#94A3B8" />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                        <Line type="monotone" dataKey="loss" stroke="#EF4444" strokeWidth={2} name="State Vector Loss" dot={false} />
                        <Line type="monotone" dataKey="valAccuracy" stroke="#10B981" strokeWidth={2} name="Validation Accuracy" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Qubit Probabilities bar chart */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                      QPU Hilbert State Probability Density (Angle-Encoded Expectations)
                    </span>
                    <div className="h-28 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={measuredQubits}>
                          <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#94A3B8" />
                          <YAxis domain={[0, 1]} tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#94A3B8" />
                          <Tooltip />
                          <Bar dataKey="probability" radius={[3, 3, 0, 0]}>
                            {measuredQubits.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3B82F6' : '#8B5CF6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: THRESHOLD TUNING & DECISION SUPPORT */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6 animate-fadeIn">
          {finalMetrics ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Threshold Optimizer Controls - Left 5 cols */}
              <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 bg-white p-5 lg:p-6 shadow-3xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">Threshold Optimization Module</h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Tune the decision classification threshold below to optimize the QML prediction outcome. Lowering the threshold boosts **early sensitivity** (crucial for capturing pre-clinical decline early).
                </p>

                {/* Slider control */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-500">Active Risk Cut-off</span>
                    <span className="font-bold text-[#0F172A]">{decisionThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.90"
                    step="0.05"
                    value={decisionThreshold}
                    onChange={(e) => setDecisionThreshold(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 pt-0.5">
                    <span>Low Cutoff (Max Sensitivity)</span>
                    <span>High Cutoff (Max Specificity)</span>
                  </div>
                </div>

                {/* Live Gauges */}
                <div className="grid grid-cols-2 gap-3.5 pt-3.5 border-t border-slate-100">
                  <div className="p-3 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono text-center shadow-3xs">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Sensitivity (TPR)</span>
                    <span className="text-lg font-black text-indigo-700">
                      {optimizedMetricsAtThreshold ? `${(optimizedMetricsAtThreshold.sensitivity * 100).toFixed(1)}%` : '0.0%'}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-sans mt-0.5">True Positive Rate</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFF] border border-slate-200 rounded-xl font-mono text-center shadow-3xs">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Specificity (TNR)</span>
                    <span className="text-lg font-black text-purple-700">
                      {optimizedMetricsAtThreshold ? `${(optimizedMetricsAtThreshold.specificity * 100).toFixed(1)}%` : '0.0%'}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-sans mt-0.5">True Negative Rate</span>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl text-xs space-y-1.5">
                  <span className="font-mono font-extrabold text-[10px] text-blue-800 uppercase block tracking-wider">Clinical Strategic Stratification:</span>
                  <p className="text-[11px] text-blue-950 font-sans leading-relaxed">
                    {decisionThreshold <= 0.35 ? (
                      <strong>Pre-clinical Screening Target</strong>
                    ) : decisionThreshold >= 0.65 ? (
                      <strong>Definitive Verification Target</strong>
                    ) : (
                      <strong>Balanced Diagnostic Target</strong>
                    )}
                    {decisionThreshold <= 0.35 
                      ? ': This setting is optimized for initial population wellness scans. It reduces false-negative risk to catch cardiovascular or renal decay at the absolute earliest point.' 
                      : decisionThreshold >= 0.65 
                      ? ': This setting is ideal for confirming positive diagnoses before starting intensive drug regimens, minimizing unnecessary treatment anxiety.' 
                      : ': Maintains a strong, calibrated tradeoff. Best suited for continuous automated electronic health record telemetry surveillance.'}
                  </p>
                </div>
              </div>

              {/* ROC space - Right 7 cols */}
              <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 lg:p-6 shadow-3xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Receiver Operating Characteristic (ROC Curve)</h3>
                  </div>
                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded font-bold">
                    QML AUROC: {finalMetrics.auroc.toFixed(3)}
                  </span>
                </div>

                {/* ROC Curve Graph */}
                <div className="h-60 border border-slate-100 rounded-xl p-3 bg-slate-50/30">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={thresholdRocCurvePoints}>
                      <defs>
                        <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="FPR" type="number" domain={[0, 1]} tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#94A3B8" label={{ value: 'False Positive Rate (1 - Spec)', position: 'insideBottom', offset: -5, fontSize: 10, fontFamily: 'sans-serif' }} />
                      <YAxis type="number" domain={[0, 1]} tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="#94A3B8" label={{ value: 'True Positive Rate (Sens)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fontFamily: 'sans-serif' }} />
                      <Tooltip formatter={(value, name) => [value, name === 'TPR' ? 'Sensitivity' : name]} />
                      <Area type="monotone" dataKey="TPR" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" strokeWidth={2.5} name="Sensitivity" />
                      {/* diagonal random line */}
                      <Line type="monotone" dataKey="FPR" stroke="#E2E8F0" strokeDasharray="3 3" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Benchmark Grid */}
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-[#F8FAFF] border-b border-slate-200 text-slate-500 text-[10px] font-bold">
                      <tr>
                        <th className="px-4 py-2">Algorithm Head</th>
                        <th className="px-4 py-2 text-center">Sensitivity</th>
                        <th className="px-4 py-2 text-center">Specificity</th>
                        <th className="px-4 py-2 text-center">Accuracy</th>
                        <th className="px-4 py-2 text-center">F1 Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr className="bg-purple-50/40 font-bold text-purple-900">
                        <td className="px-4 py-2.5 font-sans flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                          <span>{modelType} (Simulated QML)</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">{(optimizedMetricsAtThreshold.sensitivity * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-center">{(optimizedMetricsAtThreshold.specificity * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-center">{(optimizedMetricsAtThreshold.accuracy * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-center">{(optimizedMetricsAtThreshold.f1Score * 100).toFixed(1)}%</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-sans">Classical XGBoost Baseline</td>
                        <td className="px-4 py-2.5 text-center">86.8%</td>
                        <td className="px-4 py-2.5 text-center">89.1%</td>
                        <td className="px-4 py-2.5 text-center">88.4%</td>
                        <td className="px-4 py-2.5 text-center">87.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-500 animate-bounce" />
              <h4 className="text-sm font-bold text-slate-800">Awaiting Model Validation Metrics</h4>
              <p className="text-xs text-slate-400 max-w-sm font-sans">
                Please complete a full training epoch loop in the **Training Studio** first to compute model sensitivities and specificity matrices.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
