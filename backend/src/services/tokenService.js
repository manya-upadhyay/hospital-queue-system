const { query } = require('../config/database');

const DEPT_PREFIXES = {
  'Emergency': 'EM',
  'Cardiology': 'CA',
  'Orthopedics': 'OR',
  'Pediatrics': 'PE',
  'General': 'GN',
  'Neurology': 'NE',
  'Oncology': 'ON',
  'Dermatology': 'DE',
  'ENT': 'EN',
  'Gynecology': 'GY',
  'Ophthalmology': 'OP',
  'Psychiatry': 'PS',
  'Radiology': 'RA',
  'Urology': 'UR',
};

/**
 * Generate unique token number for a department
 * Format: [DEPT_PREFIX]-[DATE]-[SEQUENCE]
 * Example: GN-250121-042
 */
const generateToken = async (department) => {
  const prefix = DEPT_PREFIXES[department] || department.substring(0, 2).toUpperCase();
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, '');

  // Get today's count for this department
  const result = await query(
    `SELECT COUNT(*) as count FROM queues 
     WHERE department = $1 
     AND DATE(registered_at) = CURRENT_DATE`,
    [department]
  );

  const sequence = parseInt(result.rows[0].count) + 1;
  const tokenNumber = `${prefix}-${today}-${String(sequence).padStart(3, '0')}`;

  return tokenNumber;
};

/**
 * Estimate wait time based on current queue
 */
const estimateWaitTime = async (doctorId, priorityScore) => {
  // Count patients ahead in queue (with higher priority)
  const result = await query(
    `SELECT 
       COUNT(*) as patients_ahead,
       d.avg_consultation_minutes
     FROM queues q
     JOIN doctors d ON d.id = q.doctor_id
     WHERE q.doctor_id = $1 
     AND q.status = 'waiting'
     AND q.priority_score >= $2
     GROUP BY d.avg_consultation_minutes`,
    [doctorId, priorityScore]
  );

  if (result.rows.length === 0) return 0;

  const { patients_ahead, avg_consultation_minutes } = result.rows[0];
  // Add 20% buffer for realistic estimate
  return Math.ceil(parseInt(patients_ahead) * parseInt(avg_consultation_minutes) * 1.2);
};

module.exports = { generateToken, estimateWaitTime };
