<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/config/db.php';

$result = $conn->query("SHOW COLUMNS FROM medicine_records");
$columns = [];
while ($row = $result->fetch_assoc()) {
    $columns[] = $row;
}
echo json_encode($columns, JSON_PRETTY_PRINT);
