<?php
require_once __DIR__ . '/../config/db.php';

// Disable foreign key checks
$conn->query("SET FOREIGN_KEY_CHECKS = 0");

function addColumn($conn, $table, $column, $definition) {
    $res = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    if ($res->num_rows == 0) {
        $conn->query("ALTER TABLE `$table` ADD COLUMN `$column` $definition");
        return "Added $column to $table";
    }
    return "$column already exists in $table";
}

$results = [];
try {
    $results[] = addColumn($conn, 'appointments', 'token_number', 'INT DEFAULT NULL AFTER doctor_id');
    $results[] = addColumn($conn, 'doctor_schedule', 'max_slots', 'INT DEFAULT 10 AFTER status');
    
    // Ensure waiting_list table exists
    $conn->query("CREATE TABLE IF NOT EXISTS waiting_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        doctor_id INT NOT NULL,
        position INT NOT NULL,
        appointment_purpose TEXT,
        status ENUM('waiting', 'notified', 'confirmed', 'cancelled') DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES doctor_schedule(id) ON DELETE CASCADE
    )");
    $results[] = "Checked waiting_list table";

} catch (Exception $e) {
    $results[] = "Error: " . $e->getMessage();
}

$conn->query("SET FOREIGN_KEY_CHECKS = 1");

echo json_encode(['success' => true, 'updates' => $results]);
?>
