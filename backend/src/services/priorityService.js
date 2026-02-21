/**
 * Smart Priority Scoring Algorithm
 *
 * Priority Score =
 *   (Emergency weight * 5) +
 *   (Age factor) +
 *   (Symptom severity score) +
 *   (Waiting time weight)
 *
 * Higher score = served first
 */

const EMERGENCY_WEIGHT = 100;
const SYMPTOM_SEVERITY_MAP = {
  // Critical symptoms
  'chest pain': 10,
  'difficulty breathing': 10,
  'unconscious': 10,
  'stroke': 10,
  'heart attack': 10,
  'seizure': 9,
  'severe bleeding': 9,
  'head injury': 9,
  'poisoning': 9,
  // Urgent
  'high fever': 7,
  'severe pain': 7,
  'fracture': 7,
  'vomiting blood': 8,
  'abdominal pain': 6,
  'allergic reaction': 7,
  // Moderate
  'fever': 5,
  'pain': 4,
  'infection': 5,
  'wound': 5,
  'nausea': 4,
  // Mild
  'cough': 2,
  'cold': 2,
  'rash': 3,
  'headache': 3,
  'fatigue': 2,
  'checkup': 1,
  'follow-up': 1,
};

/**
 * Calculate age priority factor
 * Children (< 12) and elderly (> 65) get higher priority
 */
const getAgeFactor = (age) => {
  if (age < 2) return 8;      // Infants - highest
  if (age < 12) return 6;     // Children
  if (age >= 65 && age < 80) return 5;  // Senior
  if (age >= 80) return 7;    // Very elderly
  return 0;
};

/**
 * Calculate symptom severity from free text
 */
const getSymptomSeverityScore = (symptoms) => {
  if (!symptoms) return 1;
  const lowerSymptoms = symptoms.toLowerCase();
  let maxScore = 1;

  for (const [keyword, score] of Object.entries(SYMPTOM_SEVERITY_MAP)) {
    if (lowerSymptoms.includes(keyword)) {
      maxScore = Math.max(maxScore, score);
    }
  }
  return maxScore;
};

/**
 * Calculate waiting time weight (increases every 10 minutes)
 */
const getWaitingTimeWeight = (registeredAt) => {
  const waitMinutes = (Date.now() - new Date(registeredAt).getTime()) / 60000;
  return Math.min(Math.floor(waitMinutes / 10) * 2, 20); // max 20 points
};

/**
 * Main priority score calculator
 */
const calculatePriorityScore = ({ isEmergency, age, symptoms, registeredAt }) => {
  const emergencyScore = isEmergency ? EMERGENCY_WEIGHT : 0;
  const ageFactor = getAgeFactor(age);
  const symptomScore = getSymptomSeverityScore(symptoms) * 5; // scale up
  const waitScore = getWaitingTimeWeight(registeredAt);

  const totalScore = emergencyScore + ageFactor + symptomScore + waitScore;

  return {
    totalScore: parseFloat(totalScore.toFixed(2)),
    breakdown: {
      emergency: emergencyScore,
      age: ageFactor,
      symptom: symptomScore,
      waiting: waitScore,
    },
  };
};

/**
 * Sort queue by priority
 */
const sortQueueByPriority = (queueItems) => {
  return [...queueItems].sort((a, b) => b.priority_score - a.priority_score);
};

module.exports = {
  calculatePriorityScore,
  sortQueueByPriority,
  getSymptomSeverityScore,
  getAgeFactor,
};
