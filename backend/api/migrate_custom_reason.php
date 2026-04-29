<?php
require_once __DIR__ . '/../config/db.php';

echo "Adding custom_reason field to appointments and waiting_list...\n";

$queries = [
    "ALTER TABLE appointments ADD COLUMN custom_reason TEXT AFTER notes",
    "ALTER TABLE waiting_list ADD COLUMN custom_reason TEXT AFTER position"
];

foreach ($queries as $query) {
    if ($conn->query($query)) {
        echo "Successfully executed: " . substr($query, 0, 50) . "...\n";
    } else {
        echo "Error or already exists: " . $conn->error . "\n";
    }
}

echo "Migration completed.\n";
?>
