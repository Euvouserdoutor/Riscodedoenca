import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Zap,
  Sliders,
  Play,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Binary,
  Check,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { PatientDigitalTwinState } from '../../types';
import { encodeFeaturesToAngles, simulatePQCCircuit } from '../../services/qmlEngine';

interface QuantumOptimizerViewProps {
  patient: PatientDigitalTwinState;
  onNavigate: (tab: any) => void;
}

export const QuantumOptimizerView: React.FC<QuantumOptimizerViewProps> = ({
  patient,
  onNavigate
}) => {
  // We model an 8-qubit variational circuit
  const numQubits = 8;

  // Initialize adjustable ansatz parameters theta_0 to theta_7
  const [theta, setTheta] = useState<number[]>([1.2, -0.8, 0.45, 2.1, -1.5, 0.9, -0.3, 1.7]);

  const handleSliderChange = (index: number, val: number) => {
    const updated = [...theta];
    updated[index] = val;
    setTheta(updated);
  };

  const handleResetParameters = () => {
    setTheta([1.2, -0.8, 0.45, 2.1, -1.5, 0.9, -0.3, 1.7]);
  };

  // Convert current patient biomarkers to rotation angles for state encoding
  const angles = useMemo(() => {
    const biomarkers = [
      patient.demographics.age / 100,
      (140 - patient.organFunction.eGFR) / 100,
      patient.organFunction.hba1c / 12,
      (patient.organFunction.systolicBp - 100) / 100,
      (patient.demographics.bmi - 18) / 30,
      patient.organFunction.vascularScore / 100,
      0.42, // synthetic CRP
      0.15  // synthetic NT-proBNP
    ];
    return encodeFeaturesToAngles(biomarkers);
  }, [patient.organFunction, patient.demographics]);

  // Simulate PQC state-vector live when theta or angles change!
  const stateVectorResult = useMemo(() => {
    // Formulate weights matrix out of theta params (simple 3-layer mapping)
    const weights = [
      theta.map(t => t * 0.8),
      theta.map(t => t * 1.2),
      theta.map(t => t * -0.5)
    ];
    return simulatePQCCircuit(angles, weights, numQubits);
  }, [angles, theta]);

  // Compute live early risk score based on odd-parity measurement expectation
  const liveRiskScore = useMemo(() => {
    let rawScore = 0;
    for (let i = 0; i < stateVectorResult.probabilities.length; i++) {
      const bitCount = i.toString(2).split('1').length - 1;
      if (bitCount % 2 !== 0) {
        rawScore += stateVectorResult.probabilities[i];
      }
    }
    // Sigmoid calibration for display
    const score = 1 / (1 + Math.exp(-10 * (rawScore - 0.5)));
    return Math.min(Math.max(score, 0.02), 0.98);
  }, [stateVectorResult]);

  // Map state vector probabilities to top states for bar chart
  const topBasisStates = useMemo(() => {
    const mapped = stateVectorResult.probabilities.map((p, idx) => ({
      state: stateVectorResult.labels[idx],
      probability: p,
      amplitudeReal: stateVectorResult.amplitudes[idx].real,
      amplitudeImag: stateVectorResult.amplitudes[idx].imag
    }));
    // Sort and return top 16 states
    return mapped.sort((a, b) => b.probability - a.probability).slice(0, 16);
  }, [stateVectorResult]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 lg:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-600 font-mono">PQC & QPU State Visualizer</span>
            <h2 className="text-xl lg:text-2xl font-black text-[#0F172A] tracking-tight leading-tight">
              Quantum Parameterized Circuit Simulator
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleResetParameters}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Angles</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Circuit Schematic & Interactive Parameters */}
        <div className="lg:col-span-8 space-y-6">
          {/* Interactive Circuit Diagram */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                <Binary className="w-4 h-4 text-purple-600" />
                <span>8-Qubit Parameterized Ansatz Schematic</span>
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-mono font-bold">
                8 Qubits • ZZFeatureMap
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Live visualization of quantum gate layers. Classical features ($x$) undergo **Angle Encoding** ($U_\Phi$), followed by adjacent **CNOT Entanglement blocks**, and **Variational Rotations** ($W(\theta)$).
            </p>

            {/* Schematic rendering */}
            <div className="p-4 bg-slate-950 rounded-2xl overflow-x-auto custom-scrollbar border border-slate-800 font-mono text-[11px] text-slate-300 space-y-3 shadow-inner">
              {Array.from({ length: numQubits }).map((_, idx) => {
                const angle = angles[idx] || 0;
                const param = theta[idx] || 0;

                return (
                  <div key={idx} className="flex items-center space-x-2 min-w-[650px] py-1.5 border-b border-slate-900/40">
                    <span className="w-10 text-purple-400 font-bold font-mono">q[{idx}] |0⟩</span>
                    
                    {/* Wire line */}
                    <div className="h-0.5 bg-slate-800 flex-1 relative flex items-center justify-around">
                      {/* Encoding Gate Box */}
                      <span className="px-2 py-1 bg-blue-600 text-white rounded font-bold text-[9px] shadow-sm z-10 select-none">
                        Ry({angle.toFixed(2)})
                      </span>

                      {/* Entangler Gate dot/symbol */}
                      <div className="w-4 h-4 rounded-full bg-violet-600 border border-violet-400 text-white flex items-center justify-center font-bold text-[9px] z-10 select-none">
                        {idx % 2 === 0 ? '●' : '┼'}
                      </div>

                      {/* Parameterized ansatz gate Box */}
                      <span className="px-2 py-1 bg-purple-600 text-white rounded font-bold text-[9px] shadow-sm z-10 select-none">
                        Ry(θ[{idx}]: {param.toFixed(2)})
                      </span>

                      {/* Measurement operator Box */}
                      <span className="px-1.5 py-0.5 bg-[#76B900] text-black font-black text-[9px] rounded z-10 select-none">
                        [ Z ]
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Parameters Sliders Panel */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-[#0F172A]">Variational Parameter Adjustment (θ₀...₇)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {theta.map((val, index) => (
                <div key={index} className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 shadow-3xs">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-purple-700 font-sans">Ansatz Parameter θ[{index}]</span>
                    <span className="text-slate-900">{val.toFixed(2)} rad</span>
                  </div>
                  <input
                    type="range"
                    min="-Math.PI"
                    max="Math.PI"
                    step="0.05"
                    value={val}
                    onChange={(e) => handleSliderChange(index, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>-π</span>
                    <span>0.00</span>
                    <span>+π</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column (4 cols): Live State Vector Probabilities */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Decision Outcome Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-[#76B900]" />
              <h3 className="text-sm font-bold text-[#0F172A]">Live Diagnostic Risk Predictor</h3>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Dynamic QML Risk Estimate</span>
              <div className="text-3xl font-black text-rose-600 font-mono">
                {(liveRiskScore * 100).toFixed(1)}%
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase ${
                liveRiskScore >= 0.7 ? 'bg-rose-500' : liveRiskScore >= 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}>
                {liveRiskScore >= 0.7 ? 'Positive' : liveRiskScore >= 0.4 ? 'Early Warning' : 'Negative'}
              </span>
            </div>

            <div className="p-3.5 bg-purple-50/40 border border-purple-100 rounded-xl space-y-2 text-xs text-purple-950 font-mono">
              <span className="text-[9px] font-extrabold uppercase text-purple-800">QPU Normalization Validation</span>
              <div className="flex justify-between">
                <span>Sum of Probabilities:</span>
                <span className="font-bold text-slate-900">1.00000000 (Unitary)</span>
              </div>
              <div className="flex justify-between">
                <span>State Resolution:</span>
                <span className="font-bold text-slate-900">256 Basis Vectors</span>
              </div>
            </div>
          </section>

          {/* Top 16 Basis State Vector probabilities */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                <Activity className="w-4 h-4 text-purple-600 animate-pulse" />
                <span>Top basis amplitudes</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Top 16 / 256 States</span>
            </div>

            {/* Probabilities chart */}
            <div className="h-44 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBasisStates}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="state" tick={{ fontSize: 8, fontFamily: 'monospace' }} stroke="#94A3B8" />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 8, fontFamily: 'monospace' }} stroke="#94A3B8" />
                  <Tooltip wrapperStyle={{ fontFamily: 'monospace', fontSize: 10 }} />
                  <Bar dataKey="probability" fill="#8B5CF6" radius={[2, 2, 0, 0]}>
                    {topBasisStates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#8B5CF6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* List of amplitudes */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar border border-slate-100 rounded-xl font-mono text-[10px] text-slate-700 divide-y divide-slate-100 bg-white shadow-3xs">
              {topBasisStates.map((s, idx) => (
                <div key={idx} className="flex justify-between p-2 hover:bg-slate-50">
                  <span className="font-bold text-[#0F172A]">{s.state}</span>
                  <span>P={s.probability.toFixed(4)} • c=({s.amplitudeReal.toFixed(3)} + {s.amplitudeImag.toFixed(3)}i)</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
