<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/DoctorController.php';

$action = $_GET['action'] ?? '';
$doctorController = new DoctorController($conn);

try {
    switch ($action) {
        case 'get-schedule':
            echo json_encode($doctorController->getSchedule());
            break;

        case 'get-services':
            echo json_encode($doctorController->getServices());
            break;

        case 'get-schedule-by-service':
            $service = $_GET['service'] ?? '';
            if (!$service) {
                throw new Exception('Service parameter is required');
            }
            echo json_encode($doctorController->getScheduleByService($service));
            break;

        case 'update-status':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = $input['id'] ?? null;
            $status = $input['status'] ?? null;
            
            if (!$id || !$status) {
                throw new Exception('ID and status are required');
            }
            
            echo json_encode($doctorController->updateStatus($id, $status));
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action',
                'available_actions' => ['get-schedule', 'get-services', 'get-schedule-by-service', 'update-status']
            ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
