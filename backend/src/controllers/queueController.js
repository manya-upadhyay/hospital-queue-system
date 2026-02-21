const { query, getClient } = require('../config/database');
const { calculatePriorityScore } = require('../services/priorityService');
const { generateToken, estimateWaitTime } = require('../services/tokenService');
const { getMLPrediction } = require('../services/mlService');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

/**
 * @route POST /api/queue/register
 */
const registerPatient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { name, phone, age, gender, bloodGroup, doctorId, department, symptoms, isEmergency } = req.body;

    // Check if patient exists by phone, insert or update manually (no ON CONFLICT)
    const existingPatient = await client.query(
      'SELECT * FROM patients WHERE phone = $1', [phone]
    );

    let patient;
    if (existingPatient.rows[0]) {
      // Update existing
      const updated = await client.query(
        'UPDATE patients SET name = $1, age = $2 WHERE phone = $3 RETURNING *',
        [name, age, phone]
      );
      patient = updated.rows[0];
    } else {
      // Insert new
      const inserted = await client.query(
        'INSERT INTO patients (name, phone, age, gender, blood_group) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, phone, age, gender || 'male', bloodGroup || null]
      );
      patient = inserted.rows[0];
    }

    // Check doctor exists and is active
    const doctorResult = await client.query(
      'SELECT * FROM doctors WHERE id = $1 AND is_active = true', [doctorId]
    );
    if (!doctorResult.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Doctor not found or unavailable' });
    }

    // Generate token
    const tokenNumber = await generateToken(department);

    // Calculate priority score
    const registeredAt = new Date();
    const { totalScore } = calculatePriorityScore({ isEmergency, age, symptoms, registeredAt });

    // Get current queue length
    const currentQueueResult = await client.query(
      "SELECT COUNT(*) as count FROM queues WHERE doctor_id = $1 AND status = 'waiting'",
      [doctorId]
    );
    const queueLength = parseInt(currentQueueResult.rows[0].count);

    // ML prediction with fallback
    let estimatedWait;
    try {
      const mlPrediction = await getMLPrediction({
        queue_length: queueLength,
        avg_consultation_time: doctorResult.rows[0].avg_consultation_minutes,
        hour_of_day: new Date().getHours(),
        emergency_count: isEmergency ? 1 : 0,
        day_of_week: new Date().getDay(),
      });
      estimatedWait = mlPrediction.predicted_wait_minutes;
    } catch {
      estimatedWait = await estimateWaitTime(doctorId, totalScore);
    }

    // Insert queue entry
    const queueId = uuidv4();
    const queueResult = await client.query(
      `INSERT INTO queues 
       (id, patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, registered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [queueId, patient.id, doctorId, tokenNumber, department, symptoms, isEmergency, totalScore, estimatedWait, registeredAt]
    );

    await client.query('COMMIT');

    const queueEntry = queueResult.rows[0];

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`doctor-${doctorId}`).emit('queue-updated', {
        type: 'NEW_PATIENT',
        data: { ...queueEntry, patientName: patient.name },
      });
      if (isEmergency) {
        io.to(`doctor-${doctorId}`).emit('emergency-alert', {
          patient: patient.name, token: tokenNumber, symptoms,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        token: tokenNumber,
        estimatedWaitMinutes: estimatedWait,
        priorityScore: totalScore,
        position: queueLength + 1,
        queueId: queueEntry.id,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * @route GET /api/queue/doctor/:doctorId
 */
const getDoctorQueue = async (req, res) => {
  const { doctorId } = req.params;
  const { status = 'waiting' } = req.query;

  const result = await query(
    `SELECT q.*, p.name as patient_name, p.age, p.phone, p.gender,
            d.name as doctor_name, d.avg_consultation_minutes
     FROM queues q
     JOIN patients p ON p.id = q.patient_id
     JOIN doctors  d ON d.id = q.doctor_id
     WHERE q.doctor_id = $1 AND q.status = $2
     ORDER BY q.priority_score DESC, q.registered_at ASC`,
    [doctorId, status]
  );

  res.json({ success: true, data: result.rows, count: result.rowCount });
};

/**
 * @route PATCH /api/queue/:queueId/call
 */
const callPatient = async (req, res) => {
  const { queueId } = req.params;

  const result = await query(
    `UPDATE queues SET status = 'in_consultation', called_at = NOW()
     WHERE id = $1 AND status = 'waiting'
     RETURNING *`,
    [queueId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ success: false, message: 'Queue entry not found or already called' });
  }

  const entry = result.rows[0];
  const io = req.app.get('io');
  if (io) {
    io.to(`queue-${queueId}`).emit('patient-called', { token: entry.token_number, message: 'Please proceed to the consultation room' });
    io.to(`doctor-${entry.doctor_id}`).emit('queue-updated', { type: 'PATIENT_CALLED', data: entry });
  }

  res.json({ success: true, message: 'Patient called', data: entry });
};

/**
 * @route PATCH /api/queue/:queueId/complete
 */
const completeConsultation = async (req, res) => {
  const { queueId } = req.params;
  const { notes, actualConsultationMinutes } = req.body;

  const result = await query(
    `UPDATE queues 
     SET status = 'completed', completed_at = NOW(), notes = $1,
         actual_wait_minutes = EXTRACT(EPOCH FROM (NOW() - registered_at))/60
     WHERE id = $2 AND status = 'in_consultation'
     RETURNING *`,
    [notes || null, queueId]
  );

  if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Queue entry not found' });

  if (actualConsultationMinutes) {
    await query(
      `UPDATE doctors SET avg_consultation_minutes = ROUND((avg_consultation_minutes * 0.7 + $1 * 0.3))
       WHERE id = $2`,
      [actualConsultationMinutes, result.rows[0].doctor_id]
    );
  }

  const io = req.app.get('io');
  if (io) io.to(`doctor-${result.rows[0].doctor_id}`).emit('queue-updated', { type: 'COMPLETED', data: result.rows[0] });

  res.json({ success: true, data: result.rows[0] });
};

/**
 * @route GET /api/queue/status/:queueId
 */
const getQueueStatus = async (req, res) => {
  const { queueId } = req.params;

  const result = await query(
    `SELECT q.token_number, q.status, q.estimated_wait_minutes, q.priority_score,
            q.registered_at, q.called_at, q.is_emergency,
            d.name as doctor_name, d.department,
            (SELECT COUNT(*) FROM queues q2 
             WHERE q2.doctor_id = q.doctor_id 
             AND q2.status = 'waiting' 
             AND q2.priority_score > q.priority_score) + 1 as position_in_queue
     FROM queues q
     JOIN doctors d ON d.id = q.doctor_id
     WHERE q.id = $1`,
    [queueId]
  );

  if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Queue entry not found' });
  res.json({ success: true, data: result.rows[0] });
};

/**
 * @route PATCH /api/queue/:queueId/no-show
 */
const markNoShow = async (req, res) => {
  const result = await query(
    "UPDATE queues SET status = 'no_show' WHERE id = $1 AND status = 'waiting' RETURNING *",
    [req.params.queueId]
  );
  if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Queue entry not found' });
  res.json({ success: true, data: result.rows[0] });
};

module.exports = { registerPatient, getDoctorQueue, callPatient, completeConsultation, getQueueStatus, markNoShow };