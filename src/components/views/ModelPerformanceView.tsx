import React from 'react';
import {
  BarChart3,
  Cpu,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Server,
  ShieldCheck,
  TrendingUp,
  LineChart,
  GitBranch,
  Gauge
} from 'lucide-react';
import { MetricCard } from '../common/MetricCard';

export const ModelPerformanceView: React.FC = () => {
  // Production QML and Classical Models
  const qmlModels = [
    {
      id: 'm1',
      name: 'Variational Quantum Classifier (VQC)',
      purpose: 'Cardiometabolic Risk Early Detection',
      type: 'QML / Parameterized Circuit',
      backend: 'cuQuantum Sim / NVIDIA TensorRT',
      auroc: 0.942,
      sensitivity: 0.952,
      specificity: 0.931,
      f1Score: 0.941,
      latency: '14.8 ms',
      trainingCorpus: 'TCGA + MIMIC-IV Sync (N=4,850)'
    },
    {
      id: 'm2',
      name: 'Quantum Support Vector Machine (QSVM)',
      purpose: 'Oncological Pathway Classification',
      type: 'QML / Hilbert Kernel Mapping',
      backend: 'cuQuantum Kernel / NVIDIA CUDA',
      auroc: 0.928,
      sensitivity: 0.918,
      specificity: 0.938,
      f1Score: 0.925,
      latency: '18.4 ms',
      trainingCorpus: 'GENIE Genomic Cohort (N=3,200)'
    },
    {
      id: 'm3',
      name: 'Quantum Neural Network (QNN)',
      purpose: 'Neurological Cognitive Decline Risk',
      type: 'QML / Unitary Multilayer',
      backend: 'Cirq Hybrid Simulator / PyTorch',
      auroc: 0.919,
      sensitivity: 0.924,
      specificity: 0.905,
      f1Score: 0.914,
      latency: '22.1 ms',
      trainingCorpus: 'ADNI Synthetic Trajectories (N=5,100)'
    },
    {
      id: 'm4',
      name: 'Classical XGBoost Gradient Forest',
      purpose: 'Multi-biomarker Tree Classification',
      type: 'Classical ML / GBDT',
      backend: 'NVIDIA RAPIDS / XGBoost',
      auroc: 0.884,
      sensitivity: 0.868,
      specificity: 0.891,
      f1Score: 0.875,
      latency: '1.2 ms',
      trainingCorpus: 'Standard Electronic Health Records'
    },
    {
      id: 'm5',
      name: 'Classical Linear Support Vector Machine',
      purpose: 'Multi-biomarker Hyperplane Classifier',
      type: 'Classical ML / LibSVM',
      backend: 'NVIDIA RAPIDS / cuML',
      auroc: 0.841,
      sensitivity: 0.812,
      specificity: 0.853,
      f1Score: 0.825,
      latency: '0.8 ms',
      trainingCorpus: 'Standard Electronic Health Records'
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 lg:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>NVIDIA & CUQUANTUM TELEMETRY REGISTRY</span>
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-extrabold text-[#0F172A] mt-1 tracking-tight">
            Diagnostic Model Validation & <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">Telemetry Registry</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl font-normal">
            Empirical benchmark metrics, cross-validation receiver-operating characteristics (ROC), and state-vector processing latency
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 font-mono text-xs">
          <span className="px-3.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-bold flex items-center space-x-2 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
            <span>cuQuantum GPU Accel ONLINE</span>
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Mean QML Inference Latency"
          value="14.8 ms"
          subValue="VQC circuit shots"
          icon={Cpu}
          accentColor="blue"
          trend={{ text: '28.4x Accelerated via cuQuantum', type: 'positive' }}
        />
        <MetricCard
          label="Top Cohort AUROC"
          value="0.942"
          subValue="VQC Classifier"
          icon={Activity}
          accentColor="purple"
          trend={{ text: 'Outperforms classical XGBoost (+5.8%)', type: 'positive' }}
        />
        <MetricCard
          label="Clinical Target Pathways"
          value="14 Core Paths"
          subValue="Genomics & Metabolism"
          icon={Layers}
          accentColor="purple"
          trend={{ text: 'CYP, GFR, Glycemic pathways mapped', type: 'positive' }}
        />
        <MetricCard
          label="Simulator Memory Load"
          value="3.2 GB"
          subValue="/ 40.0 GB cuAlloc"
          icon={Server}
          accentColor="blue"
          trend={{ text: 'H200 Tensor Core Load 24%', type: 'neutral' }}
        />
      </div>

      {/* Model Performance Comparison Registry */}
      <div className="rounded-2xl bg-white border border-slate-200/90 p-5 lg:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Hybrid Quantum-Classical Model Benchmarking Matrix</span>
          </h3>
          <span className="text-xs font-mono text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
            {qmlModels.length} Production Heads Configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                <th className="pb-3 font-semibold">Model Name & Objective</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Inference Latency</th>
                <th className="pb-3 font-semibold text-center">Sensitivity</th>
                <th className="pb-3 font-semibold text-center">Specificity</th>
                <th className="pb-3 font-semibold text-center">AUROC</th>
                <th className="pb-3 font-semibold text-center">F1 Score</th>
                <th className="pb-3 font-semibold">Backend Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qmlModels.map((mod) => {
                const isQML = mod.id.startsWith('m') && parseInt(mod.id.slice(1)) <= 3;
                return (
                  <tr key={mod.id} className={`hover:bg-slate-50/85 transition-colors ${isQML ? 'bg-purple-50/10 font-medium' : ''}`}>
                    <td className="py-3.5 font-bold text-[#0F172A] font-sans">
                      <div className="flex items-center space-x-1">
                        {isQML && <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                        <span>{mod.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{mod.purpose}</span>
                    </td>
                    <td className="py-3.5 text-slate-700 font-sans">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] ${
                        isQML ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}>
                        {mod.type}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-700 font-bold">
                      {mod.latency}
                    </td>
                    <td className="py-3.5 text-center text-indigo-700 font-black">
                      {(mod.sensitivity * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 text-center text-purple-700 font-black">
                      {(mod.specificity * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 text-center text-emerald-700 font-black">
                      {mod.auroc.toFixed(3)}
                    </td>
                    <td className="py-3.5 text-center text-blue-700 font-bold">
                      {mod.f1Score.toFixed(3)}
                    </td>
                    <td className="py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F8FAFF] border border-slate-200 text-slate-600 text-[10px]">
                        {mod.backend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
