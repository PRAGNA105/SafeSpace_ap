<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../controllers/LabTestController.php';

$user = requireAuth();
$controller = new LabTestController($conn);

$action = $_GET['action'] ?? '';

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'POST':
            if ($action === 'create') {
                $data = json_decode(file_get_contents("php://input"), true);
                if (!$data) {
                    echo json_encode(['success' => false, 'message' => 'Invalid data']);
                    break;
                }
                echo json_encode($controller->createRequest($user['id'], $data));
            }
            break;

        case 'GET':
            if ($action === 'my') {
                $requests = $controller->getMyRequests($user['id']);
                echo json_encode(['success' => true, 'data' => $requests]);
            } elseif ($action === 'admin_all') {
                $statusFilter = $_GET['status'] ?? null;
                $requests = $controller->getAllRequests($statusFilter);
                echo json_encode(['success' => true, 'data' => $requests]);
            }
            break;

        case 'PUT':
            if ($action === 'update') {
                $data = json_decode(file_get_contents("php://input"), true);
                if (!$data || !isset($data['id'])) {
                    echo json_encode(['success' => false, 'message' => 'Missing request ID']);
                    break;
                }
                $id = $data['id'];
                unset($data['id']);
                echo json_encode($controller->updateRequest($id, $data));
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
