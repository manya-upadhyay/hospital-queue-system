-- ============================================
-- DEMO SEED DATA - Hospital Queue System
-- Run this AFTER 001_initial_schema.sql
-- ============================================

-- ─── 1. ADMIN (password: Admin@1234) ────────────────────────────────────────
INSERT INTO admins (name, email, password_hash, hospital_name, role) VALUES
(
  'Dr. Rajesh Kumar',
  'admin@hospital.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewwGLX4Z9B5Gm.Iu',
  'City General Hospital',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ─── 2. DOCTORS (password for all: Doctor@1234) ──────────────────────────────
INSERT INTO doctors (name, email, password_hash, specialization, department, avg_consultation_minutes, is_available, shift_start, shift_end, role) VALUES
('Priya Sharma',    'priya.sharma@hospital.com',    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'General Physician',         'General',       10, true,  '08:00', '16:00', 'doctor'),
('Arjun Mehta',     'arjun.mehta@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'General Physician',         'General',       12, true,  '10:00', '18:00', 'doctor'),
('Kavya Reddy',     'kavya.reddy@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emergency Medicine',        'Emergency',      8, true,  '00:00', '23:59', 'doctor'),
('Rohit Verma',     'rohit.verma@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emergency Medicine',        'Emergency',      7, true,  '00:00', '23:59', 'doctor'),
('Sunita Patel',    'sunita.patel@hospital.com',    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cardiologist',              'Cardiology',    20, true,  '09:00', '17:00', 'doctor'),
('Vikram Singh',    'vikram.singh@hospital.com',    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Interventional Cardiology', 'Cardiology',    25, false, '09:00', '17:00', 'doctor'),
('Ananya Iyer',     'ananya.iyer@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pediatrician',              'Pediatrics',    15, true,  '09:00', '17:00', 'doctor'),
('Deepak Nair',     'deepak.nair@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pediatric Specialist',      'Pediatrics',    12, true,  '10:00', '18:00', 'doctor'),
('Sanjay Gupta',    'sanjay.gupta@hospital.com',    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Orthopedic Surgeon',        'Orthopedics',   20, true,  '08:00', '16:00', 'doctor'),
('Meera Krishnan',  'meera.krishnan@hospital.com',  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Joint Replacement',         'Orthopedics',   30, true,  '09:00', '17:00', 'doctor'),
('Aditya Bansal',   'aditya.bansal@hospital.com',   '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Neurologist',               'Neurology',     25, true,  '09:00', '17:00', 'doctor'),
('Pooja Desai',     'pooja.desai@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dermatologist',             'Dermatology',   10, true,  '10:00', '18:00', 'doctor'),
('Rajan Chopra',    'rajan.chopra@hospital.com',    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ENT Specialist',            'ENT',           12, true,  '09:00', '17:00', 'doctor'),
('Nalini Rao',      'nalini.rao@hospital.com',      '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Gynecologist',              'Gynecology',    15, true,  '09:00', '17:00', 'doctor'),
('Kiran Joshi',     'kiran.joshi@hospital.com',     '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ophthalmologist',           'Ophthalmology', 10, true,  '09:00', '17:00', 'doctor')
ON CONFLICT (email) DO NOTHING;


-- ─── 3. DEMO PATIENTS ────────────────────────────────────────────────────────
INSERT INTO patients (name, phone, age, gender, blood_group) VALUES
('Rahul Sharma',   '9876543201', 35, 'male',   'O+'),
('Preethi Nair',   '9876543202', 72, 'female', 'A+'),
('Arun Kumar',     '9876543203',  8, 'male',   'B+'),
('Fatima Sheikh',  '9876543204', 45, 'female', 'AB+'),
('Suresh Babu',    '9876543205', 60, 'male',   'O-'),
('Divya Menon',    '9876543206', 28, 'female', 'A-'),
('Harish Pillai',  '9876543207', 55, 'male',   'B-'),
('Sneha Kulkarni', '9876543208', 32, 'female', 'O+'),
('Manoj Tiwari',   '9876543209', 42, 'male',   'A+'),
('Lakshmi Venkat', '9876543210', 67, 'female', 'B+')
ON CONFLICT (phone) DO NOTHING;


-- ─── 4. LIVE DEMO QUEUE ───────────────────────────────────────────────────────
DO $$
DECLARE
  v_doc_gen1   UUID;
  v_doc_gen2   UUID;
  v_doc_emg1   UUID;
  v_doc_card1  UUID;
  v_doc_ped1   UUID;

  v_p1  UUID; v_p2  UUID; v_p3  UUID; v_p4  UUID; v_p5  UUID;
  v_p6  UUID; v_p7  UUID; v_p8  UUID; v_p9  UUID; v_p10 UUID;
BEGIN
  SELECT id INTO v_doc_gen1  FROM doctors WHERE email = 'priya.sharma@hospital.com';
  SELECT id INTO v_doc_gen2  FROM doctors WHERE email = 'arjun.mehta@hospital.com';
  SELECT id INTO v_doc_emg1  FROM doctors WHERE email = 'kavya.reddy@hospital.com';
  SELECT id INTO v_doc_card1 FROM doctors WHERE email = 'sunita.patel@hospital.com';
  SELECT id INTO v_doc_ped1  FROM doctors WHERE email = 'ananya.iyer@hospital.com';

  SELECT id INTO v_p1  FROM patients WHERE phone = '9876543201';
  SELECT id INTO v_p2  FROM patients WHERE phone = '9876543202';
  SELECT id INTO v_p3  FROM patients WHERE phone = '9876543203';
  SELECT id INTO v_p4  FROM patients WHERE phone = '9876543204';
  SELECT id INTO v_p5  FROM patients WHERE phone = '9876543205';
  SELECT id INTO v_p6  FROM patients WHERE phone = '9876543206';
  SELECT id INTO v_p7  FROM patients WHERE phone = '9876543207';
  SELECT id INTO v_p8  FROM patients WHERE phone = '9876543208';
  SELECT id INTO v_p9  FROM patients WHERE phone = '9876543209';
  SELECT id INTO v_p10 FROM patients WHERE phone = '9876543210';

  -- ── Dr. Priya Sharma - General ─────────────────────────────────────────────
  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p2, v_doc_gen1, 'GN-001', 'General', 'Chest pain and difficulty breathing', true, 155.0, 5, 'waiting', NOW() - INTERVAL '40 minutes');

  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p10, v_doc_gen1, 'GN-002', 'General', 'High fever and severe body ache', false, 48.0, 10, 'waiting', NOW() - INTERVAL '30 minutes');

  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p1, v_doc_gen1, 'GN-003', 'General', 'Routine checkup and follow-up', false, 25.0, 20, 'waiting', NOW() - INTERVAL '20 minutes');

  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at, called_at)
  VALUES (v_p6, v_doc_gen1, 'GN-000', 'General', 'Cough and cold for 3 days', false, 12.0, 0, 'in_consultation', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '5 minutes');

  -- ── Dr. Arjun Mehta - General ──────────────────────────────────────────────
  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p5, v_doc_gen2, 'GN-004', 'General', 'Severe abdominal pain', false, 55.0, 12, 'waiting', NOW() - INTERVAL '25 minutes');

  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p9, v_doc_gen2, 'GN-005', 'General', 'Headache and nausea', false, 18.0, 24, 'waiting', NOW() - INTERVAL '15 minutes');

  -- ── Dr. Kavya Reddy - Emergency ────────────────────────────────────────────
  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p4, v_doc_emg1, 'EM-001', 'Emergency', 'Road accident - head injury', true, 162.0, 3, 'waiting', NOW() - INTERVAL '10 minutes');

  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at, called_at)
  VALUES (v_p7, v_doc_emg1, 'EM-000', 'Emergency', 'Severe chest pain - possible heart attack', true, 158.0, 0, 'in_consultation', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '8 minutes');

  -- ── Dr. Sunita Patel - Cardiology ──────────────────────────────────────────
  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p8, v_doc_card1, 'CA-001', 'Cardiology', 'Irregular heartbeat and shortness of breath', false, 42.0, 20, 'waiting', NOW() - INTERVAL '35 minutes');

  -- ── Dr. Ananya Iyer - Pediatrics ───────────────────────────────────────────
  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, status, registered_at)
  VALUES (v_p3, v_doc_ped1, 'PE-001', 'Pediatrics', 'High fever 103F and vomiting', false, 62.0, 15, 'waiting', NOW() - INTERVAL '20 minutes');

  -- ── Completed entries (fills analytics charts) ─────────────────────────────
  INSERT INTO queues (patient_id, doctor_id, token_number, department, symptoms, is_emergency, priority_score, estimated_wait_minutes, actual_wait_minutes, status, registered_at, called_at, completed_at) VALUES
  (v_p1,  v_doc_gen1,  'GN-C01', 'General',    'Fever and cold',               false, 18.0, 15, 18,  'completed', NOW() - INTERVAL '3 hours',    NOW() - INTERVAL '2 hours 40 minutes', NOW() - INTERVAL '2 hours 30 minutes'),
  (v_p2,  v_doc_gen1,  'GN-C02', 'General',    'Back pain',                    false, 22.0, 12, 14,  'completed', NOW() - INTERVAL '3 hours',    NOW() - INTERVAL '2 hours 20 minutes', NOW() - INTERVAL '2 hours 10 minutes'),
  (v_p3,  v_doc_gen2,  'GN-C03', 'General',    'Routine checkup',              false, 10.0, 20, 22,  'completed', NOW() - INTERVAL '2 hours',    NOW() - INTERVAL '1 hour 35 minutes',  NOW() - INTERVAL '1 hour 25 minutes'),
  (v_p4,  v_doc_card1, 'CA-C01', 'Cardiology', 'Chest tightness',              false, 35.0, 25, 28,  'completed', NOW() - INTERVAL '4 hours',    NOW() - INTERVAL '3 hours 30 minutes', NOW() - INTERVAL '3 hours 5 minutes'),
  (v_p5,  v_doc_emg1,  'EM-C01', 'Emergency',  'Severe allergic reaction',     true,  148.0, 5,  6,  'completed', NOW() - INTERVAL '5 hours',    NOW() - INTERVAL '4 hours 55 minutes', NOW() - INTERVAL '4 hours 48 minutes'),
  (v_p6,  v_doc_ped1,  'PE-C01', 'Pediatrics', 'Child ear infection',          false, 38.0, 10, 12,  'completed', NOW() - INTERVAL '2 hours',    NOW() - INTERVAL '1 hour 45 minutes',  NOW() - INTERVAL '1 hour 33 minutes'),
  (v_p7,  v_doc_gen1,  'GN-C04', 'General',    'Migraine',                     false, 20.0, 15, 17,  'completed', NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '70 minutes',         NOW() - INTERVAL '60 minutes'),
  (v_p8,  v_doc_gen2,  'GN-C05', 'General',    'Diabetes follow-up',           false, 15.0, 18, 20,  'completed', NOW() - INTERVAL '60 minutes', NOW() - INTERVAL '40 minutes',         NOW() - INTERVAL '28 minutes'),
  (v_p9,  v_doc_gen1,  'GN-C06', 'General',    'Skin rash',                    false, 12.0, 25, NULL,'no_show',   NOW() - INTERVAL '2 hours',    NULL,                                   NULL),
  (v_p10, v_doc_card1, 'CA-C02', 'Cardiology', 'High blood pressure checkup',  false, 30.0, 20, 24,  'completed', NOW() - INTERVAL '3 hours',    NOW() - INTERVAL '2 hours 35 minutes', NOW() - INTERVAL '2 hours 15 minutes');

END $$;


-- ─── 5. VERIFY ────────────────────────────────────────────────────────────────
SELECT '===== DOCTORS =====' as info;
SELECT name, department, is_available FROM doctors ORDER BY department;

SELECT '===== LIVE QUEUE =====' as info;
SELECT q.token_number, p.name AS patient, d.name AS doctor,
       q.department, q.is_emergency, q.priority_score, q.status
FROM queues q
JOIN patients p ON p.id = q.patient_id
JOIN doctors  d ON d.id = q.doctor_id
WHERE q.status IN ('waiting','in_consultation')
ORDER BY q.priority_score DESC;

SELECT '===== TODAY STATS =====' as info;
SELECT
  COUNT(*)                                           AS total,
  COUNT(*) FILTER (WHERE status='waiting')           AS waiting,
  COUNT(*) FILTER (WHERE status='in_consultation')   AS in_consultation,
  COUNT(*) FILTER (WHERE status='completed')         AS completed,
  COUNT(*) FILTER (WHERE status='no_show')           AS no_show,
  COUNT(*) FILTER (WHERE is_emergency=true)          AS emergencies,
  ROUND(AVG(actual_wait_minutes) FILTER (WHERE status='completed'),1) AS avg_wait_min
FROM queues
WHERE DATE(registered_at) = CURRENT_DATE;