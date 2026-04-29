-- =====================================================
-- BOOKING & QUEUE SYSTEM OVERHAUL MIGRATION
-- Safe to run multiple times (idempotent via PHP helper)
-- =====================================================

USE safespace;

-- -------------------------------------------------------
-- 1. ALTER doctor_schedule: add new columns
-- -------------------------------------------------------
ALTER TABLE doctor_schedule
  ADD COLUMN IF NOT EXISTS cabin_number VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS joining_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS timings VARCHAR(100) DEFAULT '9:00 AM - 4:00 PM',
  ADD COLUMN IF NOT EXISTS is_coming_soon TINYINT(1) DEFAULT 0;

-- -------------------------------------------------------
-- 2. Remove Orthopedic rows
-- -------------------------------------------------------
DELETE FROM appointments WHERE doctor_id IN (SELECT id FROM doctor_schedule WHERE specialization = 'Orthopedic');
DELETE FROM waiting_list WHERE doctor_id IN (SELECT id FROM doctor_schedule WHERE specialization = 'Orthopedic');
DELETE FROM doctor_schedule WHERE specialization = 'Orthopedic';

-- -------------------------------------------------------
-- 3. ALTER appointments table
-- -------------------------------------------------------
-- Add appointment_date column (actual date)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS appointment_date DATE DEFAULT NULL AFTER appointment_day;

-- Expand status ENUM
ALTER TABLE appointments
  MODIFY COLUMN status ENUM('Confirmed','Pending','Cancelled','Completed','waiting','in_consultation','expired') DEFAULT 'Confirmed';

-- Expand purpose to allow all categories
ALTER TABLE appointments
  MODIFY COLUMN purpose ENUM('General illness','Injury','Follow-up','Medical certificate','General Illness','Serious Illness','Medical Certificate') DEFAULT 'General illness';

-- Add purpose_category, purpose_detail, priority_level, custom_reason if missing
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS purpose_category VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purpose_detail VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS custom_reason TEXT DEFAULT NULL;

-- Add index on appointment_date
CREATE INDEX IF NOT EXISTS idx_apt_date ON appointments(appointment_date);

-- -------------------------------------------------------
-- 4. Expire old pending/waiting appointments
-- -------------------------------------------------------
UPDATE appointments
SET status = 'expired'
WHERE appointment_date IS NOT NULL
  AND appointment_date < CURDATE()
  AND status IN ('Confirmed', 'Pending', 'waiting');

-- -------------------------------------------------------
-- 5. Add purpose_category etc. to waiting_list if missing
-- -------------------------------------------------------
ALTER TABLE waiting_list
  ADD COLUMN IF NOT EXISTS purpose_category VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS purpose_detail VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 3,
  ADD COLUMN IF NOT EXISTS custom_reason TEXT DEFAULT NULL;

-- -------------------------------------------------------
-- 6. Create lab_test_requests table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_test_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(50) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    test_type VARCHAR(100) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time_slot VARCHAR(50) DEFAULT NULL,
    prescription_name VARCHAR(255) DEFAULT NULL,
    prescription_data LONGTEXT DEFAULT NULL,
    assigned_date DATE DEFAULT NULL,
    assigned_time VARCHAR(50) DEFAULT NULL,
    report_link VARCHAR(500) DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL,
    status ENUM('requested','approved','sample_collected','sent_to_lab','report_ready','completed','cancelled') DEFAULT 'requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lab_test_user ON lab_test_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_status ON lab_test_requests(status);

-- -------------------------------------------------------
-- 7. Create medical_updates table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- 8. Re-seed doctor_schedule with proper data
-- -------------------------------------------------------
-- Clear existing seed data (we'll re-insert)
DELETE FROM doctor_schedule WHERE specialization IN ('General', 'Gynecologist', 'N/A');

-- Insert proper doctors per specialization
INSERT INTO doctor_schedule (day_name, doctor_name, specialization, status, max_slots, cabin_number, timings, is_coming_soon) VALUES
-- General Doctor - Dr. John (Mon, Wed, Fri, Sat)
('Monday',    'Dr. John',       'General Doctor',    'Available', 10, 'Cabin 1', '9:00 AM - 4:00 PM', 0),
('Wednesday', 'Dr. John',       'General Doctor',    'Available', 10, 'Cabin 1', '9:00 AM - 4:00 PM', 0),
('Friday',    'Dr. John',       'General Doctor',    'Available', 10, 'Cabin 1', '9:00 AM - 4:00 PM', 0),
('Saturday',  'Dr. John',       'General Doctor',    'Available', 10, 'Cabin 1', '9:00 AM - 12:00 PM', 0),

-- Gynaecologist - Dr. Priya (Tue, Thu) - Coming Soon
('Tuesday',   'Dr. Priya',      'Gynaecologist',     'Available', 8,  'Cabin 2', '10:00 AM - 3:00 PM', 1),
('Thursday',  'Dr. Priya',      'Gynaecologist',     'Available', 8,  'Cabin 2', '10:00 AM - 3:00 PM', 1),

-- Psychiatrist - Dr. Meera (Wed, Fri) - Coming Soon
('Wednesday', 'Dr. Meera',      'Psychiatrist',      'Available', 6,  'Cabin 3', '11:00 AM - 3:00 PM', 1),
('Friday',    'Dr. Meera',      'Psychiatrist',      'Available', 6,  'Cabin 3', '11:00 AM - 3:00 PM', 1),

-- Lab Test Sample Collection (Mon-Sat)
('Monday',    'Lab Technician',  'Lab Test',          'Available', 15, 'Lab Room', '9:00 AM - 1:00 PM', 0),
('Tuesday',   'Lab Technician',  'Lab Test',          'Available', 15, 'Lab Room', '9:00 AM - 1:00 PM', 0),
('Wednesday', 'Lab Technician',  'Lab Test',          'Available', 15, 'Lab Room', '9:00 AM - 1:00 PM', 0),
('Thursday',  'Lab Technician',  'Lab Test',          'Available', 15, 'Lab Room', '9:00 AM - 1:00 PM', 0),
('Friday',    'Lab Technician',  'Lab Test',          'Available', 15, 'Lab Room', '9:00 AM - 1:00 PM', 0),
('Saturday',  'Lab Technician',  'Lab Test',          'Available', 15, 'Lab Room', '9:00 AM - 12:00 PM', 0),

-- Sunday - Closed
('Sunday',    'No Doctor Available', 'N/A',           'Offline',   0,  NULL,       NULL,                 0);
