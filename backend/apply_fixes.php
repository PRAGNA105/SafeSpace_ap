<?php
/**
 * Migration: Fix appointments table + ensure user_activity_logs exists.
 * Run once: php backend/apply_fixes.php
 */
require_once __DIR__ . '/config/db.php';

$migrations = [
    // 1. Add missing columns to appointments table
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS purpose_category VARCHAR(100) DEFAULT NULL",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS purpose_detail VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS custom_reason TEXT DEFAULT NULL",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS priority_level INT DEFAULT 3",

    // 2. Modify purpose column to be nullable/flexible (original ENUM is too restrictive)
    "ALTER TABLE appointments MODIFY COLUMN purpose VARCHAR(255) DEFAULT 'General Illness'",

    // 3. Create user_activity_logs table if not exists
    "CREATE TABLE IF NOT EXISTS user_activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        activity_type VARCHAR(100) NOT NULL,
        activity_description TEXT,
        metadata JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activity_user (user_id),
        INDEX idx_activity_type (activity_type)
    )",

    // 4. Ensure last_active column exists on users
    "ALTER TABLE appointments MODIFY COLUMN status VARCHAR(50) DEFAULT 'Confirmed'",
];

echo "🔧 SafeSpace Database Fixes\n";
echo "============================\n\n";

$success = 0;
$skipped = 0;

foreach ($migrations as $sql) {
    $label = substr(trim($sql), 0, 80) . '...';
    try {
        $conn->query($sql);
        echo "  ✅ $label\n";
        $success++;
    } catch (Throwable $e) {
        $msg = $e->getMessage();
        // Skip "column already exists" or "duplicate" type errors
        if (
            stripos($msg, 'Duplicate') !== false ||
            stripos($msg, 'already exists') !== false
        ) {
            echo "  ⏭️  Already applied: $label\n";
            $skipped++;
        } else {
            echo "  ❌ FAILED: $label\n     Error: $msg\n";
        }
    }
}

echo "\n✅ Done. $success applied, $skipped skipped.\n";
