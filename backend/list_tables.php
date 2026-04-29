<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/db.php';

$result = $conn->query("SHOW TABLES");
$tables = [];
while ($row = $result->fetch_row()) {
    $tables[] = $row[0];
}

echo json_encode($tables);
