<?php
// ===============================================
// BULLETPROOF GOOGLE OAUTH MIGRATION HELPER
// ===============================================

header('Content-Type: text/html');
require_once __DIR__ . '/config/db.php';

echo "<body style='font-family: sans-serif; padding: 40px; line-height: 1.6;'>";
echo "<h2 style='color: #2563eb;'>🔐 SafeSpace Migration Helper (Final Setup)</h2>";
echo "<hr style='border: 0; border-top: 1px solid #eee; margin-bottom: 20px;'>";

/**
 * Helper to check if a column exists
 */
function columnExists($conn, $table, $column) {
    $result = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    return $result->num_rows > 0;
}

/**
 * Helper to check if an index exists
 */
function indexExists($conn, $table, $index) {
    $result = $conn->query("SHOW INDEX FROM `$table` WHERE Key_name = '$index'");
    return $result->num_rows > 0;
}

$columnsToAdd = [
    'oauth_provider' => "ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(50) DEFAULT NULL AFTER campus",
    'oauth_id' => "ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255) UNIQUE DEFAULT NULL AFTER oauth_provider",
    'oauth_profile_image' => "ALTER TABLE users ADD COLUMN oauth_profile_image VARCHAR(500) DEFAULT NULL AFTER oauth_id",
    'last_active' => "ALTER TABLE users ADD COLUMN last_active DATETIME DEFAULT NULL AFTER is_active"
];

echo "<h3>🔍 Finalizing Database Configuration...</h3>";
echo "<ul>";

foreach ($columnsToAdd as $col => $sql) {
    if (columnExists($conn, 'users', $col)) {
        echo "<li>✅ Column <code>$col</code>: Verified.</li>";
    } else {
        echo "<li>⏳ Adding column <code>$col</code>... ";
        if ($conn->query($sql)) {
            echo "<span style='color: #166534;'>Done.</span></li>";
        } else {
            echo "<span style='color: #dc2626;'>Failed: " . $conn->error . "</span></li>";
        }
    }
}

// Check and Add Indexes
$indexes = [
    'idx_oauth_id' => "CREATE INDEX idx_oauth_id ON users(oauth_id)",
    'idx_oauth_provider' => "CREATE INDEX idx_oauth_provider ON users(oauth_provider)"
];

foreach ($indexes as $idx => $sql) {
    if (indexExists($conn, 'users', $idx)) {
        echo "<li>✅ Index <code>$idx</code>: Verified.</li>";
    } else {
        echo "<li>⏳ Creating index <code>$idx</code>... ";
        if ($conn->query($sql)) {
            echo "<span style='color: #166534;'>Done.</span></li>";
        } else {
            echo "<span style='color: #dc2626;'>Failed: " . $conn->error . "</span></li>";
        }
    }
}

echo "</ul>";

echo "<div style='background: #f0fdf4; color: #166534; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0; margin-top: 20px;'>";
echo "<h3>✨ Configuration Complete!</h3>";
echo "<p>Your database is now fully verified and configured for Google OAuth.</p>";
echo "</div>";

echo "<p style='margin-top: 20px;'>🚀 <b>Ready!</b> Visit the login page to test: <br><br> <a href='http://localhost:5173/login' style='background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;'>Go to Login Page</a></p>";

echo "</body>";
?>
