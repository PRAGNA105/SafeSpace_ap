<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/MedicalRecordsController.php';

$method = $_SERVER['REQUEST_METHOD'];
$controller = new MedicalRecordsController($conn);
$action = $_GET['action'] ?? 'dashboard';

switch ($method) {
    case 'GET':
        switch ($action) {
            case 'dashboard':
                $response = $controller->getDashboard();
                break;
            case 'profile':
                $response = $controller->getProfile();
                break;
            case 'medicines':
                $response = $controller->getMedicines();
                break;
            case 'pharmacies':
                $response = $controller->getPharmacies();
                break;
            case 'purchases':
                $response = $controller->getPurchases();
                break;
            case 'reminders':
                $response = $controller->getReminders();
                break;
            case 'history':
                $response = $controller->getHistory();
                break;
            case 'summary':
                $response = $controller->getSummary();
                break;
            default:
                http_response_code(400);
                $response = [
                    'success' => false,
                    'message' => 'Invalid action',
                ];
        }
        break;
    case 'POST':
        switch ($action) {
            case 'profile':
                $response = $controller->saveProfile();
                break;
            case 'medicine':
                $response = $controller->saveMedicine();
                break;
            case 'pharmacy':
                $response = $controller->savePharmacy();
                break;
            case 'purchase':
                $response = $controller->savePurchase();
                break;
            case 'reminder':
                $response = $controller->saveReminder();
                break;
            case 'medicine-delete':
                $response = $controller->deleteMedicine();
                break;
            case 'pharmacy-delete':
                $response = $controller->deletePharmacy();
                break;
            case 'purchase-delete':
                $response = $controller->deletePurchase();
                break;
            case 'reminder-delete':
                $response = $controller->deleteReminder();
                break;
            default:
                http_response_code(400);
                $response = [
                    'success' => false,
                    'message' => 'Invalid action',
                ];
        }
        break;
    default:
        http_response_code(405);
        $response = [
            'success' => false,
            'message' => 'Method not allowed',
        ];
}

echo json_encode($response);
