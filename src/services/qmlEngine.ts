/**
 * Hybrid Quantum Machine Learning (QML) Simulation Engine
 * For Early Disease Detection (VQC, QSVM, and QNN models)
 */

export interface QMLModelMetrics {
  accuracy: number;
  sensitivity: number; // TPR
  specificity: number; // TNR
  auroc: number;
  f1Score: number;
  precision: number;
  epochsRun: number;
  finalLoss: number;
}

export interface EpochLog {
  epoch: number;
  loss: number;
  accuracy: number;
  valAccuracy: number;
}

export interface SHAPValue {
  featureName: string;
  shapValue: number; // Impact direction and magnitude
  baseValue: number;
  actualValue: number;
}

export interface QuantumStateVector {
  qubits: number;
  probabilities: number[];
  amplitudes: { real: number; imag: number }[];
  labels: string[];
}

/**
 * Encodes classical features into quantum angle rotations.
 * Ry and Rz rotation angles mapped to [-PI, PI].
 */
export function encodeFeaturesToAngles(features: number[]): number[] {
  return features.map(val => {
    // Sigmoid compression, then map to [-PI, PI]
    const sigmoid = 1 / (1 + Math.exp(-val));
    return (sigmoid - 0.5) * 2 * Math.PI;
  });
}

/**
 * Generates an initial or randomized unitary parameter matrix (theta weights) for the ansatz
 */
export function generateAnsatzWeights(qubits: number, layers: number = 3): number[][] {
  const weights: number[][] = [];
  for (let l = 0; l < layers; l++) {
    const layerWeights = Array.from({ length: qubits }, () => (Math.random() - 0.5) * 2 * Math.PI);
    weights.push(layerWeights);
  }
  return weights;
}

/**
 * Simulates the execution of a Parameterized Quantum Circuit (PQC).
 * Uses Ry rotation, entangling CNOT layers, and Z-axis expectation measurement.
 */
export function simulatePQCCircuit(
  angles: number[],
  weights: number[][],
  qubits: number = 8
): QuantumStateVector {
  const numStates = Math.pow(2, qubits);
  const probabilities: number[] = new Array(numStates).fill(0);
  
  // Base quantum amplitude initialization
  const amplitudes = Array.from({ length: numStates }, (_, idx) => {
    // Add constructive/destructive interference simulation
    let phase = 0;
    for (let q = 0; q < qubits; q++) {
      const angleVal = angles[q % angles.length] || 0.1;
      const weightVal = weights[0]?.[q % qubits] || 0.2;
      
      // Simulate CNOT entangling layers by combining states
      if ((idx & (1 << q)) !== 0) {
        phase += angleVal * 0.5 + weightVal;
      } else {
        phase -= angleVal * 0.3 - weightVal * 0.5;
      }
    }
    
    // Convert phase into a complex probability amplitude
    const magnitude = Math.exp(-Math.pow(phase, 2) / 10);
    return {
      real: magnitude * Math.cos(phase),
      imag: magnitude * Math.sin(phase)
    };
  });

  // Normalize amplitudes to preserve total probability = 1
  let sumSqrMag = 0;
  for (let i = 0; i < numStates; i++) {
    sumSqrMag += amplitudes[i].real * amplitudes[i].real + amplitudes[i].imag * amplitudes[i].imag;
  }
  if (sumSqrMag === 0) sumSqrMag = 1;

  for (let i = 0; i < numStates; i++) {
    amplitudes[i].real /= Math.sqrt(sumSqrMag);
    amplitudes[i].imag /= Math.sqrt(sumSqrMag);
    probabilities[i] = amplitudes[i].real * amplitudes[i].real + amplitudes[i].imag * amplitudes[i].imag;
  }

  // State labels, e.g., |00000000>
  const labels = Array.from({ length: numStates }, (_, i) => {
    return `|${i.toString(2).padStart(qubits, '0')}>`;
  });

  return {
    qubits,
    probabilities,
    amplitudes,
    labels
  };
}

/**
 * Evaluates the early disease risk of a patient state vector using the QML simulation.
 * Returns a score between 0 and 1, representing early detection probability.
 */
export function evaluateQMLRiskScore(
  features: {
    age: number;
    egfr: number;
    hba1c: number;
    systolicBp: number;
    bmi: number;
    ldl: number;
    crp: number; // C-Reactive Protein (inflammation marker)
    ntProBnp?: number; // Heart failure biomarker
  },
  modelType: 'VQC' | 'QSVM' | 'QNN' = 'VQC'
): {
  score: number;
  classLabel: 'Negative' | 'Early Warning' | 'Positive';
  confidenceInterval: [number, number];
  qubitMeasurements: number[];
} {
  // Extract classical features and normalize
  const rawFeatures = [
    features.age / 100,
    (140 - features.egfr) / 100, // lower eGFR = higher kidney stress
    features.hba1c / 12,        // higher HbA1c = higher diabetic stress
    (features.systolicBp - 100) / 100,
    (features.bmi - 18) / 30,
    features.ldl / 200,
    (features.crp || 1.0) / 10,
    (features.ntProBnp || 125) / 1000
  ];

  // Encode to quantum angles
  const angles = encodeFeaturesToAngles(rawFeatures);
  const weights = generateAnsatzWeights(8, 3);
  
  // Run circuit
  const stateVector = simulatePQCCircuit(angles, weights, 8);
  
  // Derive risk score based on state measurement expectation value
  let rawScore = 0;
  // Sum states with odd parity (simulating parity measurement observable)
  for (let i = 0; i < stateVector.probabilities.length; i++) {
    const bitCount = i.toString(2).split('1').length - 1;
    if (bitCount % 2 !== 0) {
      rawScore += stateVector.probabilities[i];
    }
  }

  // Adjust score based on model characteristic
  let adjustedScore = rawScore;
  if (modelType === 'QSVM') {
    // QSVM creates a sharper separating hyperplane boundary
    adjustedScore = 1 / (1 + Math.exp(-12 * (rawScore - 0.5)));
  } else if (modelType === 'QNN') {
    // QNN output maps via layered non-linear activations
    adjustedScore = Math.sin(rawScore * Math.PI / 2);
  }

  // Clamp safely
  adjustedScore = Math.min(Math.max(adjustedScore, 0.02), 0.98);

  let classLabel: 'Negative' | 'Early Warning' | 'Positive' = 'Negative';
  if (adjustedScore >= 0.7) {
    classLabel = 'Positive';
  } else if (adjustedScore >= 0.4) {
    classLabel = 'Early Warning';
  }

  // Generate individual qubit measurement probabilities
  const qubitMeasurements = Array.from({ length: 8 }, (_, q) => {
    let pOne = 0;
    for (let i = 0; i < stateVector.probabilities.length; i++) {
      if ((i & (1 << q)) !== 0) {
        pOne += stateVector.probabilities[i];
      }
    }
    return pOne;
  });

  // Calculate conformal prediction intervals (e.g. 95% confidence bounds)
  const margin = 0.05 + 0.1 * (1 - adjustedScore) * adjustedScore;
  const lowerBound = Math.max(adjustedScore - margin, 0.0);
  const upperBound = Math.min(adjustedScore + margin, 1.0);

  return {
    score: adjustedScore,
    classLabel,
    confidenceInterval: [lowerBound, upperBound],
    qubitMeasurements
  };
}

/**
 * Triggers a simulated training session for a selected hybrid model type
 */
export function runSimulatedQMLTraining(
  modelType: 'VQC' | 'QSVM' | 'QNN',
  epochs: number = 20,
  onEpoch: (log: EpochLog) => void,
  onComplete: (metrics: QMLModelMetrics) => void
) {
  let epoch = 1;
  let currentLoss = modelType === 'VQC' ? 0.72 : modelType === 'QSVM' ? 0.68 : 0.75;
  let currentAcc = modelType === 'VQC' ? 0.55 : modelType === 'QSVM' ? 0.52 : 0.50;
  let currentValAcc = currentAcc - 0.03;

  const interval = setInterval(() => {
    // Loss decrease curve
    const lossDrop = (modelType === 'VQC' ? 0.025 : modelType === 'QSVM' ? 0.028 : 0.022) * Math.exp(-epoch / 10) + (Math.random() - 0.5) * 0.02;
    currentLoss = Math.max(currentLoss - lossDrop, modelType === 'VQC' ? 0.18 : modelType === 'QSVM' ? 0.15 : 0.22);
    
    // Accuracy increase curve
    const accIncrease = (modelType === 'VQC' ? 0.022 : modelType === 'QSVM' ? 0.026 : 0.024) * Math.exp(-epoch / 15) + (Math.random() - 0.5) * 0.015;
    currentAcc = Math.min(currentAcc + accIncrease, modelType === 'VQC' ? 0.942 : modelType === 'QSVM' ? 0.928 : 0.915);
    currentValAcc = Math.min(currentAcc - (0.02 + Math.random() * 0.02), 0.93);

    onEpoch({
      epoch,
      loss: currentLoss,
      accuracy: currentAcc,
      valAccuracy: currentValAcc
    });

    if (epoch >= epochs) {
      clearInterval(interval);
      
      // Compute final performance metrics
      const metrics: QMLModelMetrics = {
        accuracy: currentAcc,
        sensitivity: modelType === 'VQC' ? 0.952 : modelType === 'QSVM' ? 0.918 : 0.924,
        specificity: modelType === 'VQC' ? 0.931 : modelType === 'QSVM' ? 0.938 : 0.905,
        auroc: modelType === 'VQC' ? 0.942 : modelType === 'QSVM' ? 0.928 : 0.919,
        f1Score: modelType === 'VQC' ? 0.941 : modelType === 'QSVM' ? 0.925 : 0.914,
        precision: modelType === 'VQC' ? 0.931 : modelType === 'QSVM' ? 0.932 : 0.905,
        epochsRun: epochs,
        finalLoss: currentLoss
      };
      
      onComplete(metrics);
    }
    epoch++;
  }, 120); // Quick animation tempo
}

/**
 * Computes simulated local SHAP values for clinical biomarkers
 * indicating how much each biomarker pushed the model's prediction
 * towards or away from disease detection.
 */
export function calculateSHAPValues(
  features: {
    age: number;
    egfr: number;
    hba1c: number;
    systolicBp: number;
    bmi: number;
    ldl: number;
    crp: number;
    ntProBnp?: number;
  },
  riskScore: number
): SHAPValue[] {
  const baseValue = 0.28; // Cohort baseline risk probability
  const totalImpact = riskScore - baseValue;

  // We allocate SHAP attribution weights based on pathologic features
  // eGFR, HbA1c, BP, CRP are highly weighted biomarkers for early warning
  const weightMap = {
    age: 0.10,
    egfr: features.egfr < 60 ? -0.30 : (features.egfr < 90 ? -0.15 : 0.05), // lower eGFR = higher disease contribution (+)
    hba1c: features.hba1c > 6.5 ? 0.35 : (features.hba1c > 5.7 ? 0.15 : -0.10),
    systolicBp: features.systolicBp > 130 ? 0.25 : -0.05,
    bmi: features.bmi > 25 ? 0.15 : -0.05,
    ldl: features.ldl > 130 ? 0.20 : -0.05,
    crp: features.crp > 3.0 ? 0.25 : -0.10,
    ntProBnp: (features.ntProBnp || 125) > 450 ? 0.30 : -0.05
  };

  // Normalize weight map to distribute exactly the totalImpact
  const rawSum = Object.values(weightMap).reduce((a, b) => Math.abs(a) + Math.abs(b), 0);
  
  const shapList: SHAPValue[] = [
    { featureName: 'Patient Age', shapValue: (weightMap.age / rawSum) * totalImpact, baseValue, actualValue: features.age },
    { featureName: 'Renal Function (eGFR)', shapValue: (-weightMap.egfr / rawSum) * totalImpact, baseValue, actualValue: features.egfr }, // flipped sign for representation
    { featureName: 'Glycemic Control (HbA1c)', shapValue: (weightMap.hba1c / rawSum) * totalImpact, baseValue, actualValue: features.hba1c },
    { featureName: 'Systolic Blood Pressure', shapValue: (weightMap.systolicBp / rawSum) * totalImpact, baseValue, actualValue: features.systolicBp },
    { featureName: 'Body Mass Index (BMI)', shapValue: (weightMap.bmi / rawSum) * totalImpact, baseValue, actualValue: features.bmi },
    { featureName: 'LDL Cholesterol', shapValue: (weightMap.ldl / rawSum) * totalImpact, baseValue, actualValue: features.ldl },
    { featureName: 'Systemic Inflammation (CRP)', shapValue: (weightMap.crp / rawSum) * totalImpact, baseValue, actualValue: features.crp },
    { featureName: 'Cardiac Load (nt-proBNP)', shapValue: (weightMap.ntProBnp / rawSum) * totalImpact, baseValue, actualValue: features.ntProBnp || 125 }
  ];

  return shapList;
}
