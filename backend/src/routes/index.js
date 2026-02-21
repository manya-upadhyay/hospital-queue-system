const express = require('express');
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const queueController = require('../controllers/queueController');
const doctorController = require('../controllers/doctorController');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// ═══════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════
router.post('/auth/login',
  [body('email').isEmail(), body('password').notEmpty(), body('role').isIn(['admin', 'doctor'])],
  authController.login
);
router.post('/auth/register-admin',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 8 }), body('hospitalName').notEmpty()],
  authController.registerAdmin
);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ═══════════════════════════════════════
// QUEUE ROUTES
// ═══════════════════════════════════════
router.post('/queue/register',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('phone').trim().notEmpty().withMessage('Phone required'),
    body('age').isInt({ min: 0, max: 150 }),
    body('doctorId').isUUID(),
    body('department').notEmpty(),
    body('symptoms').trim().notEmpty().withMessage('Symptoms required'),
    body('isEmergency').isBoolean(),
  ],
  queueController.registerPatient
);
router.get('/queue/status/:queueId', queueController.getQueueStatus);
router.get('/queue/doctor/:doctorId', authenticate, queueController.getDoctorQueue);
router.patch('/queue/:queueId/call', authenticate, authorize('doctor', 'admin'), queueController.callPatient);
router.patch('/queue/:queueId/complete', authenticate, authorize('doctor', 'admin'), queueController.completeConsultation);
router.patch('/queue/:queueId/no-show', authenticate, authorize('doctor', 'admin'), queueController.markNoShow);

// ═══════════════════════════════════════
// DOCTOR ROUTES
// ═══════════════════════════════════════
router.get('/doctors', doctorController.getAllDoctors);
router.get('/doctors/departments', doctorController.getDepartments);
router.get('/doctors/:id', doctorController.getDoctorById);
router.post('/doctors',
  authenticate, authorize('admin', 'super_admin'),
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('specialization').notEmpty(),
    body('department').notEmpty(),
  ],
  doctorController.createDoctor
);
router.patch('/doctors/:id/availability',
  authenticate, authorize('admin', 'super_admin', 'doctor'),
  doctorController.updateDoctorAvailability
);

// ═══════════════════════════════════════
// ANALYTICS ROUTES (admin only)
// ═══════════════════════════════════════
router.get('/analytics/dashboard', authenticate, authorize('admin', 'super_admin'), analyticsController.getDashboardStats);
router.get('/analytics/peak-hours', authenticate, authorize('admin', 'super_admin'), analyticsController.getPeakHours);
router.get('/analytics/doctor/:doctorId', authenticate, analyticsController.getDoctorAnalytics);

// ═══════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
