<?php
require_once __DIR__ . '/config/db.php';

$tables = [
    "CREATE TABLE IF NOT EXISTS feedback_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tracking_id VARCHAR(20) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        is_anonymous TINYINT(1) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Submitted',
        user_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )",
    "CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        is_urgent TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )"
];

foreach ($tables as $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "Table created successfully\n";
    } else {
        echo "Error creating table: " . $conn->error . "\n";
    }
}

// Seed announcements if empty
$check = $conn->query("SELECT COUNT(*) as count FROM announcements");
$row = $check->fetch_assoc();
if ($row['count'] == 0) {
    $seed = "INSERT INTO announcements (title, description, category, is_urgent) VALUES 
    ('Measles Outbreak Warning', 'Multiple cases of measles reported on campus. Please ensure your vaccinations are up to date.', 'health', 1),
    ('North Gate Maintenance', 'The North Gate will be closed for maintenance tomorrow from 10 PM to 4 AM.', 'safety', 0),
    ('Flu Shots Available', 'Free flu shots are now available at the campus clinic for all students.', 'health', 0)";
    $conn->query($seed);
    echo "Announcements seeded\n";
}

$conn->close();
?>
