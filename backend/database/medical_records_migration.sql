CREATE TABLE IF NOT EXISTS medical_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    blood_group VARCHAR(10) DEFAULT NULL,
    allergies_encrypted LONGTEXT DEFAULT NULL,
    chronic_conditions_encrypted LONGTEXT DEFAULT NULL,
    current_medications_encrypted LONGTEXT DEFAULT NULL,
    emergency_contact_name_encrypted LONGTEXT DEFAULT NULL,
    emergency_contact_phone_encrypted LONGTEXT DEFAULT NULL,
    emergency_contact_relation_encrypted LONGTEXT DEFAULT NULL,
    medical_notes_encrypted LONGTEXT DEFAULT NULL,
    pin_enabled BOOLEAN DEFAULT FALSE,
    biometric_enabled BOOLEAN DEFAULT FALSE,
    location_access_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medicine_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name_encrypted LONGTEXT NOT NULL,
    dosage_encrypted LONGTEXT DEFAULT NULL,
    frequency_encrypted LONGTEXT DEFAULT NULL,
    instructions_encrypted LONGTEXT DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    refill_date DATE DEFAULT NULL,
    expiry_date DATE DEFAULT NULL,
    status ENUM('active', 'upcoming', 'expired', 'completed') DEFAULT 'active',
    prescription_name VARCHAR(255) DEFAULT NULL,
    prescription_mime_type VARCHAR(100) DEFAULT NULL,
    prescription_data LONGTEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacy_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name_encrypted LONGTEXT NOT NULL,
    address_encrypted LONGTEXT DEFAULT NULL,
    phone_encrypted LONGTEXT DEFAULT NULL,
    notes_encrypted LONGTEXT DEFAULT NULL,
    is_preferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacy_purchase_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pharmacy_id INT DEFAULT NULL,
    medicine_name_encrypted LONGTEXT NOT NULL,
    quantity INT DEFAULT NULL,
    purchase_date DATE DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT NULL,
    notes_encrypted LONGTEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacy_preferences(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS medical_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    medicine_id INT DEFAULT NULL,
    title_encrypted LONGTEXT NOT NULL,
    reminder_type ENUM('medicine', 'refill', 'appointment') DEFAULT 'medicine',
    schedule_type ENUM('daily', 'weekly', 'custom') DEFAULT 'daily',
    days_of_week JSON DEFAULT NULL,
    reminder_time TIME DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    next_trigger_at DATETIME DEFAULT NULL,
    notes_encrypted LONGTEXT DEFAULT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine_records(id) ON DELETE SET NULL
);

CREATE INDEX idx_medical_profile_user ON medical_profiles(user_id);
CREATE INDEX idx_medicine_records_user_status ON medicine_records(user_id, status);
CREATE INDEX idx_pharmacy_preferences_user ON pharmacy_preferences(user_id);
CREATE INDEX idx_purchase_history_user_date ON pharmacy_purchase_history(user_id, purchase_date);
CREATE INDEX idx_medical_reminders_user_enabled ON medical_reminders(user_id, is_enabled);
