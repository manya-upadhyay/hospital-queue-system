const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { validationResult } = require('express-validator');

const getAllDoctors = async (req, res) => {
  const { department, available } = req.query;
  let sql = 'SELECT id, name, email, specialization, department, avg_consultation_minutes, is_available, shift_start, shift_end FROM doctors WHERE is_active = true';
  const params = [];

  if (department) { params.push(department); sql += ` AND department = $${params.length}`; }
  if (available !== undefined) { params.push(available === 'true'); sql += ` AND is_available = $${params.length}`; }
  sql += ' ORDER BY department, name';

  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
};

const getDoctorById = async (req, res) => {
  const result = await query(
    'SELECT id, name, email, specialization, department, avg_consultation_minutes, is_available, shift_start, shift_end FROM doctors WHERE id = $1 AND is_active = true',
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Doctor not found' });
  res.json({ success: true, data: result.rows[0] });
};

const createDoctor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, specialization, department, avgConsultationMinutes, shiftStart, shiftEnd } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await query(
    `INSERT INTO doctors (name, email, password_hash, specialization, department, avg_consultation_minutes, shift_start, shift_end, admin_id, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'doctor')
     RETURNING id, name, email, specialization, department, avg_consultation_minutes`,
    [name, email, passwordHash, specialization, department, avgConsultationMinutes || 10, shiftStart || '09:00', shiftEnd || '17:00', req.user.id]
  );

  res.status(201).json({ success: true, data: result.rows[0] });
};

const updateDoctorAvailability = async (req, res) => {
  const { isAvailable } = req.body;
  const result = await query(
    'UPDATE doctors SET is_available = $1 WHERE id = $2 RETURNING id, name, is_available',
    [isAvailable, req.params.id]
  );
  
  const io = req.app.get('io');
  if (io) io.emit('doctor-availability-changed', result.rows[0]);
  
  res.json({ success: true, data: result.rows[0] });
};

const getDepartments = async (req, res) => {
  const result = await query(
    'SELECT DISTINCT department FROM doctors WHERE is_active = true ORDER BY department',
    []
  );
  res.json({ success: true, data: result.rows.map(r => r.department) });
};

module.exports = { getAllDoctors, getDoctorById, createDoctor, updateDoctorAvailability, getDepartments };
