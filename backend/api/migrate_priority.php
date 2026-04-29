<?php
require_once __DIR__ . '/../config/db.php';

echo "Starting priority system migration...\n";

// 1. Update appointments table
$queries = [
    "ALTER TABLE appointments MODIFY purpose VARCHAR(255)", 
    "ALTER TABLE appointments ADD COLUMN purpose_category VARCHAR(100) AFTER specialization",
    "ALTER TABLE appointments ADD COLUMN purpose_detail VARCHAR(255) AFTER purpose_category",
    "ALTER TABLE appointments ADD COLUMN priority_level INT DEFAULT 3 AFTER purpose_detail",
    "UPDATE appointments SET purpose_category = 'General Illness', purpose_detail = purpose, priority_level = 3",
    
    // 2. Update waiting_list table
    "ALTER TABLE waiting_list ADD COLUMN purpose_category VARCHAR(100) AFTER appointment_purpose",
    "ALTER TABLE waiting_list ADD COLUMN purpose_detail VARCHAR(255) AFTER purpose_category",
    "ALTER TABLE waiting_list ADD COLUMN priority_level INT DEFAULT 3 AFTER purpose_detail",
    "UPDATE waiting_list SET purpose_category = 'General Illness', purpose_detail = appointment_purpose, priority_level = 3"
];

foreach ($queries as $query) {
    if ($conn->query($query)) {
        echo "Successfully executed: " . substr($query, 0, 50) . "...\n";
    } else {
        echo "Error executing query: " . $conn->error . "\n";
    }
}

echo "Migration completed.\n";
?>
 Broadway
