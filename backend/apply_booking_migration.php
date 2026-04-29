<?php
// =====================================================
// BOOKING & QUEUE MIGRATION HELPER (Idempotent)
// =====================================================

header('Content-Type: text/html; charset=UTF-8');
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/db.php';

echo "<body style='font-family: system-ui, sans-serif; padding: 40px; line-height: 1.8; max-width: 800px; margin: 0 auto;'>";
echo "<h2 style='color: #1e40af;'>🏥 Booking & Queue Migration</h2>";
echo "<hr style='border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;'>";

function colExists($conn, $table, $column) {
    $r = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $r && $r->num_rows > 0;
}

function tableExists($conn, $table) {
    $r = $conn->query("SHOW TABLES LIKE '$table'");
    return $r && $r->num_rows > 0;
}

function indexExists($conn, $table, $index) {
    $r = $conn->query("SHOW INDEX FROM `$table` WHERE Key_name = '$index'");
    return $r && $r->num_rows > 0;
}

function run($conn, $label, $sql) {
    echo "<li>$label ... ";
    try {
        if ($conn->query($sql)) {
            echo "<span style='color: #166534;'>✅ Done</span></li>";
            return true;
        } else {
            echo "<span style='color: #dc2626;'>❌ " . $conn->error . "</span></li>";
            return false;
        }
    } catch (Throwable $e) {
        echo "<span style='color: #dc2626;'>❌ " . $e->getMessage() . "</span></li>";
        return false;
    }
}

echo "<h3>1️⃣ Alter doctor_schedule</h3><ul>";

$dsCols = [
    'cabin_number' => "ALTER TABLE doctor_schedule ADD COLUMN cabin_number VARCHAR(20) DEFAULT NULL",
    'joining_date' => "ALTER TABLE doctor_schedule ADD COLUMN joining_date DATE DEFAULT NULL",
    'timings' => "ALTER TABLE doctor_schedule ADD COLUMN timings VARCHAR(100) DEFAULT '9:00 AM - 4:00 PM'",
    'is_coming_soon' => "ALTER TABLE doctor_schedule ADD COLUMN is_coming_soon TINYINT(1) DEFAULT 0",
];

foreach ($dsCols as $col => $sql) {
    if (colExists($conn, 'doctor_schedule', $col)) {
        echo "<li>Column <code>$col</code>: ✅ Already exists</li>";
    } else {
        run($conn, "Adding <code>$col</code>", $sql);
    }
}
echo "</ul>";

// --- Remove Orthopedic ---
echo "<h3>2️⃣ Remove Orthopedic</h3><ul>";
$conn->query("DELETE FROM appointments WHERE doctor_id IN (SELECT id FROM doctor_schedule WHERE specialization = 'Orthopedic')");
$conn->query("DELETE FROM waiting_list WHERE doctor_id IN (SELECT id FROM doctor_schedule WHERE specialization = 'Orthopedic')");
run($conn, "Removing Orthopedic from doctor_schedule", "DELETE FROM doctor_schedule WHERE specialization = 'Orthopedic'");
echo "</ul>";

// --- Alter appointments ---
echo "<h3>3️⃣ Alter appointments table</h3><ul>";

if (!colExists($conn, 'appointments', 'appointment_date')) {
    run($conn, "Adding <code>appointment_date</code> DATE column", "ALTER TABLE appointments ADD COLUMN appointment_date DATE DEFAULT NULL AFTER appointment_day");
} else {
    echo "<li>Column <code>appointment_date</code>: ✅ Already exists</li>";
}

// Expand status ENUM
run($conn, "Expanding status ENUM", "ALTER TABLE appointments MODIFY COLUMN status ENUM('Confirmed','Pending','Cancelled','Completed','waiting','in_consultation','expired') DEFAULT 'Confirmed'");

// Add purpose_category etc.
$aptCols = [
    'purpose_category' => "ALTER TABLE appointments ADD COLUMN purpose_category VARCHAR(100) DEFAULT NULL",
    'purpose_detail' => "ALTER TABLE appointments ADD COLUMN purpose_detail VARCHAR(255) DEFAULT NULL",
    'priority_level' => "ALTER TABLE appointments ADD COLUMN priority_level INT DEFAULT 3",
    'custom_reason' => "ALTER TABLE appointments ADD COLUMN custom_reason TEXT DEFAULT NULL",
];

foreach ($aptCols as $col => $sql) {
    if (colExists($conn, 'appointments', $col)) {
        echo "<li>Column <code>$col</code>: ✅ Already exists</li>";
    } else {
        run($conn, "Adding <code>$col</code>", $sql);
    }
}

if (!indexExists($conn, 'appointments', 'idx_apt_date')) {
    run($conn, "Adding index <code>idx_apt_date</code>", "CREATE INDEX idx_apt_date ON appointments(appointment_date)");
} else {
    echo "<li>Index <code>idx_apt_date</code>: ✅ Already exists</li>";
}
echo "</ul>";

// --- Expire old appointments ---
echo "<h3>4️⃣ Expire old appointments</h3><ul>";
$expireResult = $conn->query("UPDATE appointments SET status = 'expired' WHERE appointment_date IS NOT NULL AND appointment_date < CURDATE() AND status IN ('Confirmed', 'Pending', 'waiting')");
$affected = $conn->affected_rows;
echo "<li>Expired <strong>$affected</strong> old appointments ✅</li>";
echo "</ul>";

// --- waiting_list columns ---
echo "<h3>5️⃣ Alter waiting_list</h3><ul>";
$wlCols = [
    'purpose_category' => "ALTER TABLE waiting_list ADD COLUMN purpose_category VARCHAR(100) DEFAULT NULL",
    'purpose_detail' => "ALTER TABLE waiting_list ADD COLUMN purpose_detail VARCHAR(255) DEFAULT NULL",
    'priority_level' => "ALTER TABLE waiting_list ADD COLUMN priority_level INT DEFAULT 3",
    'custom_reason' => "ALTER TABLE waiting_list ADD COLUMN custom_reason TEXT DEFAULT NULL",
];
foreach ($wlCols as $col => $sql) {
    if (colExists($conn, 'waiting_list', $col)) {
        echo "<li>Column <code>$col</code>: ✅ Already exists</li>";
    } else {
        run($conn, "Adding <code>$col</code>", $sql);
    }
}
echo "</ul>";

// --- lab_test_requests ---
echo "<h3>6️⃣ Create lab_test_requests table</h3><ul>";
if (tableExists($conn, 'lab_test_requests')) {
    echo "<li>Table <code>lab_test_requests</code>: ✅ Already exists</li>";
} else {
    run($conn, "Creating <code>lab_test_requests</code>", "
        CREATE TABLE lab_test_requests (
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
        )
    ");
}
echo "</ul>";

// --- medical_updates ---
echo "<h3>7️⃣ Create medical_updates table</h3><ul>";
if (tableExists($conn, 'medical_updates')) {
    echo "<li>Table <code>medical_updates</code>: ✅ Already exists</li>";
} else {
    run($conn, "Creating <code>medical_updates</code>", "
        CREATE TABLE medical_updates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'general',
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
}
echo "</ul>";

// --- Re-seed doctor_schedule ---
echo "<h3>8️⃣ Re-seed doctor_schedule</h3><ul>";

// Check if we already have the new data
$checkNew = $conn->query("SELECT id FROM doctor_schedule WHERE specialization = 'General Doctor' LIMIT 1");
if ($checkNew && $checkNew->num_rows > 0) {
    echo "<li>New doctor schedule data: ✅ Already seeded</li>";
} else {
    // Remove old General/Gynecologist/N/A data
    $conn->query("DELETE FROM doctor_schedule WHERE specialization IN ('General', 'Gynecologist', 'N/A')");
    
    $seeds = [
        // General Doctor
        "('Monday','Dr. John','General Doctor','Available',10,'Cabin 1','9:00 AM - 4:00 PM',0)",
        "('Wednesday','Dr. John','General Doctor','Available',10,'Cabin 1','9:00 AM - 4:00 PM',0)",
        "('Friday','Dr. John','General Doctor','Available',10,'Cabin 1','9:00 AM - 4:00 PM',0)",
        "('Saturday','Dr. John','General Doctor','Available',10,'Cabin 1','9:00 AM - 12:00 PM',0)",
        // Gynaecologist
        "('Tuesday','Dr. Priya','Gynaecologist','Available',8,'Cabin 2','10:00 AM - 3:00 PM',1)",
        "('Thursday','Dr. Priya','Gynaecologist','Available',8,'Cabin 2','10:00 AM - 3:00 PM',1)",
        // Psychiatrist
        "('Wednesday','Dr. Meera','Psychiatrist','Available',6,'Cabin 3','11:00 AM - 3:00 PM',1)",
        "('Friday','Dr. Meera','Psychiatrist','Available',6,'Cabin 3','11:00 AM - 3:00 PM',1)",
        // Lab Test
        "('Monday','Lab Technician','Lab Test','Available',15,'Lab Room','9:00 AM - 1:00 PM',0)",
        "('Tuesday','Lab Technician','Lab Test','Available',15,'Lab Room','9:00 AM - 1:00 PM',0)",
        "('Wednesday','Lab Technician','Lab Test','Available',15,'Lab Room','9:00 AM - 1:00 PM',0)",
        "('Thursday','Lab Technician','Lab Test','Available',15,'Lab Room','9:00 AM - 1:00 PM',0)",
        "('Friday','Lab Technician','Lab Test','Available',15,'Lab Room','9:00 AM - 1:00 PM',0)",
        "('Saturday','Lab Technician','Lab Test','Available',15,'Lab Room','9:00 AM - 12:00 PM',0)",
        // Sunday
        "('Sunday','No Doctor Available','N/A','Offline',0,NULL,NULL,0)",
    ];
    
    $insertSql = "INSERT INTO doctor_schedule (day_name, doctor_name, specialization, status, max_slots, cabin_number, timings, is_coming_soon) VALUES " . implode(",\n", $seeds);
    run($conn, "Seeding new doctor schedule", $insertSql);
}
echo "</ul>";

echo "<div style='background: #f0fdf4; color: #166534; padding: 20px; border-radius: 12px; border: 1px solid #bbf7d0; margin-top: 30px;'>";
echo "<h3>✅ Migration Complete!</h3>";
echo "<p>Your database is now configured for the new booking & queue system.</p>";
echo "</div>";

echo "<p style='margin-top: 20px;'>🚀 <a href='http://localhost:5174/' style='background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;'>Go to App</a></p>";
echo "</body>";
?>
