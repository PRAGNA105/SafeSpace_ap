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
require_once __DIR__ . '/../controllers/AppointmentController.php';

$user = requireAuth();
$controller = new AppointmentController($conn);

$action = $_GET['action'] ?? '';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        if ($action === 'create') {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$data) {
                echo json_encode(['success' => false, 'message' => 'Invalid data']);
                break;
            }
            
            $result = $controller->createAppointment(
                $user['id'],
                $data['doctor_id'],
                $data['student_name'] ?? ($user['first_name'] . ' ' . $user['last_name']),
                $data['doctor_name'],
                $data['specialization'],
                $data['appointment_day'] ?? '',
                $data['purpose_category'] ?? 'General Illness',
                $data['purpose_detail'] ?? ($data['purpose'] ?? ''),
                $data['priority_level'] ?? 3,
                $data['notes'] ?? '',
                $data['custom_reason'] ?? '',
                $data['appointment_date'] ?? null
            );
            echo json_encode($result);
        }
        break;

    case 'GET':
        if ($action === 'my') {
            $appointments = $controller->getStudentAppointments($user['id']);
            echo json_encode(['success' => true, 'data' => $appointments]);
        } elseif ($action === 'admin_all') {
            $filter = $_GET['filter'] ?? 'all';
            $appointments = $controller->getAllAppointments($filter);
            echo json_encode(['success' => true, 'data' => $appointments]);
        } elseif ($action === 'today_queue') {
            $appointments = $controller->getAllAppointments('today');
            echo json_encode(['success' => true, 'data' => $appointments]);
        }
        break;

    case 'PUT':
        if ($action === 'update_status') {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!$data || !isset($data['id']) || !isset($data['status'])) {
                echo json_encode(['success' => false, 'message' => 'Missing parameters']);
                break;
            }
            
            $result = $controller->updateStatus($data['id'], $data['status']);
            echo json_encode($result);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
