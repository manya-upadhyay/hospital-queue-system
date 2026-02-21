const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { validationResult } = require('express-validator');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/**
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password, role } = req.body;

  let userResult;
  if (role === 'admin') {
    userResult = await query('SELECT * FROM admins WHERE email = $1 AND is_active = true', [email]);
  } else if (role === 'doctor') {
    userResult = await query('SELECT * FROM doctors WHERE email = $1 AND is_active = true', [email]);
  } else {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  const user = userResult.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // doctors don't have a role column — assign it from the login request
  const userRole = user.role || role;
  const token = signToken({ id: user.id, email: user.email, role: userRole });

  const { password_hash, ...safeUser } = user;
  safeUser.role = userRole;

  res.json({ success: true, message: 'Login successful', token, user: safeUser });
};

/**
 * @route POST /api/auth/register-admin
 */
const registerAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, hospitalName } = req.body;

  // Check if email already exists
  const existing = await query('SELECT id FROM admins WHERE email = $1', [email]);
  if (existing.rows[0]) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO admins (name, email, password_hash, hospital_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, hospital_name, created_at`,
    [name, email, passwordHash, hospitalName]
  );

  const admin = result.rows[0];
  const token = signToken({ id: admin.id, email: admin.email, role: 'admin' });

  res.status(201).json({ success: true, message: 'Admin registered', token, user: { ...admin, role: 'admin' } });
};

/**
 * @route GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/**
 * @route POST /api/auth/change-password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const table = ['admin', 'super_admin'].includes(req.user.role) ? 'admins' : 'doctors';

  const result = await query(`SELECT password_hash FROM ${table} WHERE id = $1`, [req.user.id]);
  const user = result.rows[0];

  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await query(`UPDATE ${table} SET password_hash = $1 WHERE id = $2`, [newHash, req.user.id]);

  res.json({ success: true, message: 'Password changed successfully' });
};

module.exports = { login, registerAdmin, getMe, changePassword };