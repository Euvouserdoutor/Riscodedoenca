import React, { useState } from 'react';
import {
  X,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Activity,
  Cpu,
  FlaskConical,
  Network,
  Bot,
  Zap,
  Sparkles,
  Layers,
  Database,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { PatientDigitalTwinState } from '../../types';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  activePatient: PatientDigitalTwinState;
}

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  activePatient
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      title: 'Welcome to QML-HealthTwin (Clinical Guided Tour)',
      tab: 'home',
      icon: Zap,
      description:
        'QML-HealthTwin is a state-of-the-art hybrid quantum-classical machine learning platform designed for early chronic disease risk detection. By projecting high-dimensional biomedical variables onto quantum superposition states, the platform uncovers subtle pathological trends long before traditional classifiers.',
      highlight: 'Hybrid Classical-Quantum Early Disease Identification'
    },
    {
      title: 'Step 1: Research Background & The Multi-Omic Challenge',
      tab: 'home',
      icon: Info,
      description:
        'Classical machine learning models often struggle to capture complex patterns in noisy, high-dimensional biomedical data (e.g., genetics, lipid panels, renal biomarkers). QML-HealthTwin leverages Parameterized Quantum Circuits (PQC) and Hilbert Space mappings to represent these multi-omic correlations with high mathematical precision.',
      highlight: 'Exploiting Quantum Superposition and Entanglement'
    },
    {
      title: 'Step 2: Inspect the Patient Digital Twin Vector P(t)',
      tab: 'digital-twin',
      icon: Activity,
      description:
        `Analyze the holographic digital twin profile of ${activePatient.name.split(' (')[0]} (ID: ${activePatient.patientId}). The patient state vector captures real-time clinical parameters including glycemic HbA1c (${activePatient.organFunction.hba1c}%), renal eGFR (${activePatient.organFunction.eGFR} mL/min), systolic blood pressure, metabolic BMI, and systemic inflammatory markers (CRP).`,
      highlight: 'Dynamic Multi-Biomarker Patient State Tracking'
    },
    {
      title: 'Step 3: Data Ingestion & Pre-processing Studio',
      tab: 'simulation-lab',
      icon: Database,
      description:
        'Select from active patient streams, standard UCI pre-clinical benchmarks (Pima Indians Diabetes, Cleveland Heart Disease), or upload your own CSV. Apply mean/median imputation, inject Gaussian robustness noise, and use Principal Component Analysis (PCA) to compress high-dimensional variables into qubit registers.',
      highlight: 'Interactive Data Imputation, Noise Injection & PCA'
    },
    {
      title: 'Step 4: Hybrid Quantum Model Training Studio',
      tab: 'simulation-lab',
      icon: FlaskConical,
      description:
        'Configure quantum classifier heads—including Variational Quantum Classifiers (VQC), Quantum SVM (QSVM), and Quantum Neural Networks (QNN). Select qubit registers and train your parameter ansatz over simulated quantum circuits accelerating on NVIDIA cuQuantum backends.',
      highlight: 'Variational Parameter Optimization (VQC, QSVM, QNN)'
    },
    {
      title: 'Step 5: Threshold Tuning & Conformal Prediction',
      tab: 'simulation-lab',
      icon: SlidersHorizontal,
      description:
        'Slide the decision boundary threshold from 0.10 to 0.90 to optimize sensitivity (TPR) and specificity (TNR). Lowering thresholds maximizes early detection sensitivity to capture metabolic and renal decay early. Review conformal prediction interval bounds for verified reliability.',
      highlight: 'Strategic Sensitivity-Specificity Decision Optimizer'
    },
    {
      title: 'Step 6: Local SHAP Feature Attribution & Interpretability',
      tab: 'explainability',
      icon: Network,
      description:
        'Decompose model predictions into local Shapley additive explanations (SHAP). The waterfall chart shows exactly how much each clinical biomarker (eGFR, HbA1c, CRP) pushed the early-stage probability towards or away from detection warnings.',
      highlight: 'KernelSHAP Interpretability & Counterfactual What-Ifs'
    },
    {
      title: 'Step 7: Grounded AI Clinical Assistant (Gemini 3.7)',
      tab: 'ai-insights',
      icon: Bot,
      description:
        'Interact with the Gemini 3.7 Flash co-pilot. The assistant analyzes the patient digital twin state and queries current databases (KDIGO, ADA guidelines) using real-time Google Search Grounding to formulate transparent, evidence-based recommendations.',
      highlight: 'Autonomous Clinical Copilot with Live Google Search Grounding'
    }
  ];

  const step = demoSteps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < demoSteps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      onNavigateTab(demoSteps[next].tab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      onNavigateTab(demoSteps[prev].tab);
    }
  };

  const handleJump = (idx: number) => {
    setCurrentStep(idx);
    onNavigateTab(demoSteps[idx].tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 shadow-2xl shadow-slate-900/20 space-y-6 text-[#0F172A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-50 to-purple-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <StepIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Step {currentStep + 1} of {demoSteps.length}
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">QML-HEALTHTWIN SYSTEM TOUR</span>
            </div>
            <h3 className="text-lg font-extrabold text-[#0F172A] mt-1">{step.title}</h3>
          </div>
        </div>

        {/* Highlight Banner */}
        <div className="p-3 rounded-xl bg-[#EEF4FF] border border-blue-200/80 text-xs font-mono text-blue-800 font-semibold flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Core Concept: {step.highlight}</span>
        </div>

        {/* Description */}
        <p className="text-slate-600 text-sm leading-relaxed font-sans">{step.description}</p>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center space-x-2 py-2">
          {demoSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleJump(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep ? 'w-8 bg-gradient-to-r from-[#2563EB] to-[#7C3AED]' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center space-x-2 disabled:opacity-40 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] hover:from-[#1D4ED8] hover:to-[#6D28D9] text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-purple-500/30 flex items-center space-x-2 font-mono"
          >
            <span>{currentStep === demoSteps.length - 1 ? 'Finish Guided Tour' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
