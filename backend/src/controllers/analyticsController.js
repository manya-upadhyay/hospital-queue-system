const { query } = require('../config/database');

/**
 * @route GET /api/analytics/dashboard
 * @desc Admin dashboard summary
 */
const getDashboardStats = async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;

  const [todayStats, doctorStats, hourlyStats, weeklyTrend] = await Promise.all([
    // Today's overview
    query(
      `SELECT 
         COUNT(*) FILTER (WHERE status != 'cancelled') as total_patients,
         COUNT(*) FILTER (WHERE is_emergency = true) as emergency_count,
         COUNT(*) FILTER (WHERE status = 'waiting') as waiting_count,
         COUNT(*) FILTER (WHERE status = 'in_consultation') as in_consultation,
         COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
         COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
         ROUND(AVG(actual_wait_minutes) FILTER (WHERE status = 'completed'), 1) as avg_wait_minutes,
         ROUND(AVG(actual_wait_minutes) FILTER (WHERE status = 'completed' AND is_emergency = false), 1) as avg_regular_wait
       FROM queues
       WHERE DATE(registered_at) = $1`,
      [date]
    ),

    // Per-doctor stats
    query(
      `SELECT 
         d.id,
         d.name,
         d.department,
         d.is_available,
         COUNT(q.id) FILTER (WHERE q.status = 'waiting') as waiting,
         COUNT(q.id) FILTER (WHERE q.status = 'in_consultation') as in_consultation,
         COUNT(q.id) FILTER (WHERE q.status = 'completed') as completed,
         ROUND(AVG(q.actual_wait_minutes) FILTER (WHERE q.status = 'completed'), 1) as avg_wait,
         d.avg_consultation_minutes
       FROM doctors d
       LEFT JOIN queues q ON q.doctor_id = d.id AND DATE(q.registered_at) = $1
       WHERE d.is_active = true
       GROUP BY d.id, d.name, d.department, d.is_available, d.avg_consultation_minutes
       ORDER BY waiting DESC`,
      [date]
    ),

    // Hourly patient distribution
    query(
      `SELECT 
         EXTRACT(HOUR FROM registered_at) as hour,
         COUNT(*) as patient_count,
         COUNT(*) FILTER (WHERE is_emergency = true) as emergency_count
       FROM queues
       WHERE DATE(registered_at) = $1
       GROUP BY hour
       ORDER BY hour`,
      [date]
    ),

    // 7-day trend
    query(
      `SELECT 
         DATE(registered_at) as date,
         COUNT(*) as total_patients,
         COUNT(*) FILTER (WHERE status = 'no_show') as no_shows,
         ROUND(AVG(actual_wait_minutes) FILTER (WHERE status = 'completed'), 1) as avg_wait
       FROM queues
       WHERE registered_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(registered_at)
       ORDER BY date`,
      []
    ),
  ]);

  const stats = todayStats.rows[0];
  const noShowRate = stats.total_patients > 0
    ? parseFloat(((stats.no_show_count / stats.total_patients) * 100).toFixed(1))
    : 0;

  res.json({
    success: true,
    data: {
      today: { ...stats, no_show_rate: noShowRate },
      doctors: doctorStats.rows,
      hourly: hourlyStats.rows,
      weeklyTrend: weeklyTrend.rows,
    },
  });
};

/**
 * @route GET /api/analytics/peak-hours
 */
const getPeakHours = async (req, res) => {
  const result = await query(
    `SELECT 
       EXTRACT(HOUR FROM registered_at) as hour,
       EXTRACT(DOW FROM registered_at) as day_of_week,
       COUNT(*) as patient_count,
       ROUND(AVG(actual_wait_minutes), 1) as avg_wait
     FROM queues
     WHERE registered_at >= NOW() - INTERVAL '30 days'
     GROUP BY hour, day_of_week
     ORDER BY patient_count DESC`,
    []
  );
  res.json({ success: true, data: result.rows });
};

/**
 * @route GET /api/analytics/doctor/:doctorId
 */
const getDoctorAnalytics = async (req, res) => {
  const { doctorId } = req.params;
  const { days = 7 } = req.query;

  const result = await query(
    `SELECT 
       DATE(registered_at) as date,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'completed') as completed,
       COUNT(*) FILTER (WHERE status = 'no_show') as no_shows,
       ROUND(AVG(actual_wait_minutes) FILTER (WHERE status = 'completed'), 1) as avg_wait,
       COUNT(*) FILTER (WHERE is_emergency = true) as emergencies
     FROM queues
     WHERE doctor_id = $1 AND registered_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(registered_at)
     ORDER BY date DESC`,
    [doctorId]
  );

  res.json({ success: true, data: result.rows });
};

module.exports = { getDashboardStats, getPeakHours, getDoctorAnalytics };
