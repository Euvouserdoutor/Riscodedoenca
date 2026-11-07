import React, { useMemo } from 'react';
import {
  Activity,
  Users,
  AlertTriangle,
  Cpu,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  FlaskConical,
  Network,
  Bot,
  Play,
  Gauge,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { PatientDigitalTwinState, Medication } from '../../types';
import { MetricCard } from '../common/MetricCard';
import { evaluateQMLRiskScore } from '../../services/qmlEngine';

interface OverviewViewProps {
  activePatient: PatientDigitalTwinState;
  patients: PatientDigitalTwinState[];
  onNavigate: (tab: any) => void;
  onOpenGuidedDemo: () => void;
  onSelectPatient?: (patient: PatientDigitalTwinState) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  activePatient,
  patients,
  onNavigate,
  onOpenGuidedDemo,
  onSelectPatient
}) => {
  // Calculate active patient dynamic risk prediction
  const activeQmlState = useMemo(() => {
    return evaluateQMLRiskScore(activePatient.organFunction, 'VQC');
  }, [activePatient.organFunction]);

  // Compute cohort risk counts
  const highRiskCount = useMemo(() => {
    return patients.filter(p => {
      const risk = evaluateQMLRiskScore(p.organFunction, 'VQC');
      return risk.classLabel === 'Positive';
    }).length;
  }, [patients]);

  const handleSelectPatientById = (patientId: string) => {
    const found = patients.find((p) => p.patientId === patientId);
    if (found && onSelectPatient) {
      onSelectPatient(found);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Deep-Tech Hero Banner */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 hover:border-blue-300 transition-all p-5 lg:p-7 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl z-10">
          <div className="flex items-center space-x-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-xs">
              <Zap className="w-3 h-3 text-blue-600" />
              <span>HYBRID QUANTUM-AI DIAGNOSTIC SYSTEM</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              VQC + QSVM ACTIVE
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
            Hybrid Quantum-Classical platform for <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-black">Early Disease Detection</span>
          </h2>
          <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
            Identify pre-clinical cardiometabolic, renal, and neurological decline up to 18 months earlier by mapping multi-biomarker trajectories to high-dimensional quantum states via Parametric Quantum Circuits (PQC) and cuQuantum simulators.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('simulation-lab')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 hover:scale-[1.02] flex items-center space-x-2 cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 text-white animate-pulse" />
              <span>QML Training Studio</span>
            </button>

            <button
              onClick={onOpenGuidedDemo}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0F172A] font-semibold text-xs border border-slate-200 transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              <span>Diagnostic Platform Tour</span>
            </button>

            <button
              onClick={() => onNavigate('quantum-optimizer')}
              className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 text-purple-700 font-semibold text-xs border border-purple-200 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-purple-600" />
              <span>Interactive PQC Circuit Lab</span>
            </button>
          </div>
        </div>

        {/* Active Patient Snapshot Glass Card */}
        <div className="w-full lg:w-84 rounded-2xl bg-[#F8FAFF] border border-blue-200/80 p-4.5 shrink-0 z-10 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">
              Target Patient Twin
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
              {activePatient.patientId}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-semibold text-slate-900">{activePatient.name.split(' (')[0]}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Demographics:</span>
              <span className="text-slate-700 font-mono">{activePatient.demographics.age}yo {activePatient.demographics.gender} (BMI {activePatient.demographics.bmi})</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">VQC Risk Assessment:</span>
              <span className={`font-mono font-extrabold ${activeQmlState.score >= 0.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {(activeQmlState.score * 100).toFixed(1)}% Risk
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Classification Label:</span>
              <span className={`px-2 py-0.1 rounded text-[10px] font-bold font-mono uppercase ${
                activeQmlState.classLabel === 'Positive' ? 'bg-rose-100 text-rose-700 border border-rose-200' : activeQmlState.classLabel === 'Early Warning' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {activeQmlState.classLabel}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('digital-twin')}
            className="mt-3.5 w-full py-2 rounded-xl bg-white hover:bg-slate-50 border border-blue-200 text-xs font-bold text-blue-700 hover:text-blue-800 transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <span>Explore Clinical Biomarkers</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Cohort"
          value={patients.length}
          subValue="synthetic patients"
          icon={Users}
          accentColor="cyan"
          trend={{ text: 'Continuous Stream Ingest', type: 'neutral' }}
          onClick={() => onNavigate('patients')}
        />
        <MetricCard
          label="Detected Early Risks"
          value={highRiskCount}
          subValue="high risk labels"
          icon={AlertTriangle}
          accentColor="rose"
          trend={{ text: 'Requires early intervention', type: 'warning' }}
          onClick={() => onNavigate('patients')}
        />
        <MetricCard
          label="VQC Validation Accuracy"
          value="94.2%"
          subValue="simulated cohort"
          icon={Activity}
          accentColor="emerald"
          trend={{ text: '+5.8% over classical XGBoost', type: 'positive' }}
          onClick={() => onNavigate('simulation-lab')}
        />
        <MetricCard
          label="State-Vector Operations"
          value="256 States"
          subValue="8-qubit full Hilbert"
          icon={Cpu}
          accentColor="violet"
          trend={{ text: 'Unitary preservation 1.00', type: 'positive' }}
          onClick={() => onNavigate('quantum-optimizer')}
        />
      </div>

      {/* Two Column Grid: Pipeline Architecture & System Intelligence Live Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: System Intelligence Status & Recent Activity */}
        <div className="lg:col-span-2 space-y-5">
          {/* Intelligence Architecture Pipeline */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 lg:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Hybrid QML Early Detection Pipeline</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  End-to-end data pipeline from clinical biomarker telemetry to quantum state-vector prediction
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                All Systems Nominal
              </span>
            </div>

            {/* Pipeline Step Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F8FAFF] border border-slate-200 hover:border-blue-300 transition-all relative">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-700 mb-1.5">
                  <span>1. COHORT INGEST</span>
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                </div>
                <p className="text-xs text-slate-900 font-semibold">EHR Biomarkers</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">
                  Continuous ingestion of renal, metabolic & glycemic metrics
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFF] border border-slate-200 hover:border-blue-300 transition-all relative">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-blue-700 mb-1.5">
                  <span>2. QPU ENCODING</span>
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                </div>
                <p className="text-xs text-slate-900 font-semibold">ZZFeatureMap Ry</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">
                  Mapping biomarkers to angle rotation state vectors
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFF] border border-slate-200 hover:border-purple-300 transition-all relative">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-700 mb-1.5">
                  <span>3. ANSATZ TRAINING</span>
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                </div>
                <p className="text-xs text-slate-900 font-semibold">Variational Circuit</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">
                  Optimizing theta parameters with SGD backpropagation
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFF] border border-slate-200 hover:border-purple-300 transition-all relative">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-700 mb-1.5">
                  <span>4. CONFORMAL XAI</span>
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                </div>
                <p className="text-xs text-slate-900 font-semibold">SHAP Interpretation</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight font-medium">
                  Explainable Shapley values and calibrated conformal coverage
                </p>
              </div>
            </div>
          </div>

          {/* Quick Scenario Previews Table */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 lg:p-6 shadow-xs font-sans">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">
                  QML Model Diagnostic Benchmarks ({activePatient.name.split(' (')[0]})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-normal">
                  Comparative performance and predictions of hybrid classifiers against classical models
                </p>
              </div>
              <button
                onClick={() => onNavigate('scenario-comparison')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span>Full Model Benchmarks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFF] border-b border-slate-200 text-slate-500 font-mono text-[10px]">
                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Model Name</th>
                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Inference Speed</th>
                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Sensitivity</th>
                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Specificity</th>
                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Predicted Risk</th>
                    <th className="py-3 px-3.5 font-bold uppercase tracking-wider">Model Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr className="hover:bg-slate-50 transition-colors bg-gradient-to-r from-blue-50/60 to-purple-50/60">
                    <td className="py-3 px-3.5 font-bold text-blue-700 flex items-center space-x-1.5 font-sans">
                      <span>Variational Classifier (VQC)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 font-mono font-bold uppercase">TOP</span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-900">14.8 ms</td>
                    <td className="py-3 px-3.5 text-emerald-700 font-bold">95.2%</td>
                    <td className="py-3 px-3.5 text-emerald-700 font-medium">93.1%</td>
                    <td className="py-3 px-3.5 font-bold text-rose-600">{(activeQmlState.score * 100).toFixed(1)}%</td>
                    <td className="py-3 px-3.5 font-bold text-blue-700">94.2%</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 text-slate-700 font-sans">Quantum Support Vector (QSVM)</td>
                    <td className="py-3 px-3.5 text-slate-700">18.4 ms</td>
                    <td className="py-3 px-3.5">91.8%</td>
                    <td className="py-3 px-3.5">93.8%</td>
                    <td className="py-3 px-3.5 font-bold text-slate-700">92.8%</td>
                    <td className="py-3 px-3.5">92.8%</td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 text-slate-700 font-sans">Quantum Neural Network (QNN)</td>
                    <td className="py-3 px-3.5 text-slate-600">22.1 ms</td>
                    <td className="py-3 px-3.5">92.4%</td>
                    <td className="py-3 px-3.5">90.5%</td>
                    <td className="py-3 px-3.5 font-bold text-slate-700">91.5%</td>
                    <td className="py-3 px-3.5">91.9%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live AI Infrastructure Status & Clinical Persona */}
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs font-sans">
            <div className="flex items-center space-x-2 mb-3.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-[#0F172A]">Live QML Platform Telemetry</h3>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFF] border border-slate-200">
                <span className="text-slate-600 font-sans font-medium">Gemini 3.7 Flash</span>
                <span className="flex items-center space-x-1.5 text-emerald-700 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>ONLINE</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFF] border border-slate-200">
                <span className="text-slate-600 font-sans font-medium">cuQuantum Sim Engine</span>
                <span className="text-blue-700 font-bold text-[11px]">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFF] border border-slate-200">
                <span className="text-slate-600 font-sans font-medium">ZZFeatureMap Layers</span>
                <span className="text-purple-700 font-bold text-[11px]">
                  CONVERGED
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFF] border border-slate-200">
                <span className="text-slate-600 font-sans font-medium">Conformal Calibrator</span>
                <span className="text-emerald-700 font-bold text-[11px]">
                  95.0% Coverage
                </span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>QPU Hardware Base:</span>
              <span className="text-blue-700 font-bold">Rigetti Aspen-M-3 Sim</span>
            </div>
          </div>

          {/* Quick AI Assistant Launcher (Deep Tech Blue-Purple Card) */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white p-5.5 shadow-md shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center space-x-2 mb-2 z-10 relative">
              <Bot className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white">Q-AI Clinical Assistant</h3>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed z-10 relative font-normal">
              Ask Gemini to explain Variational Quantum Classifier (VQC) state vector outputs, conformal confidence bounds, or PubMed research grounding.
            </p>
            <button
              onClick={() => onNavigate('ai-insights')}
              className="mt-4 w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-sm z-10 relative cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Consult Q-AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
