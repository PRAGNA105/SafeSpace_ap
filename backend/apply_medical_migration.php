<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/db.php';

$sql = file_get_contents(__DIR__ . '/database/medical_records_migration.sql');

if ($conn->multi_query($sql)) {
    do {
        if ($result = $conn->store_result()) {
            $result->free();
        }
    } while ($conn->more_results() && $conn->next_result());
    echo "Migration applied successfully.\n";
} else {
    echo "Error applying migration: " . $conn->error . "\n";
}
