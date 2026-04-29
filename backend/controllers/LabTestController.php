<?php
require_once __DIR__ . '/../config/db.php';

class LabTestController {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function createRequest($userId, $data) {
        $today = date('Y-m-d');
        $preferredDate = $data['preferred_date'] ?? '';
        
        if ($preferredDate && $preferredDate < $today) {
            return ['success' => false, 'message' => 'Cannot request lab test for a past date.'];
        }

        $query = "INSERT INTO lab_test_requests 
                  (user_id, student_name, roll_number, phone, test_type, preferred_date, preferred_time_slot, prescription_name, prescription_data, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested')";
        
        $stmt = $this->conn->prepare($query);
        $studentName = $data['student_name'] ?? '';
        $rollNumber = $data['roll_number'] ?? '';
        $phone = $data['phone'] ?? '';
        $testType = $data['test_type'] ?? '';
        $timeSlot = $data['preferred_time_slot'] ?? '';
        $prescName = $data['prescription_name'] ?? null;
        $prescData = $data['prescription_data'] ?? null;

        $stmt->bind_param("issssssss", 
            $userId, $studentName, $rollNumber, $phone, $testType, 
            $preferredDate, $timeSlot, $prescName, $prescData
        );

        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Lab test request submitted successfully',
                'request_id' => $this->conn->insert_id
            ];
        }
        return ['success' => false, 'message' => 'Failed to submit request: ' . $stmt->error];
    }

    public function getMyRequests($userId) {
        $query = "SELECT * FROM lab_test_requests WHERE user_id = ? ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    }

    public function getAllRequests($status = null) {
        if ($status) {
            $query = "SELECT lr.*, u.email, u.first_name, u.last_name 
                      FROM lab_test_requests lr 
                      JOIN users u ON lr.user_id = u.id 
                      WHERE lr.status = ?
                      ORDER BY lr.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("s", $status);
            $stmt->execute();
            return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        }

        $query = "SELECT lr.*, u.email, u.first_name, u.last_name 
                  FROM lab_test_requests lr 
                  JOIN users u ON lr.user_id = u.id 
                  ORDER BY lr.created_at DESC";
        $result = $this->conn->query($query);
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    public function updateRequest($id, $data) {
        $validStatuses = ['requested','approved','sample_collected','sent_to_lab','report_ready','completed','cancelled'];
        
        $fields = [];
        $types = '';
        $values = [];

        if (isset($data['status'])) {
            if (!in_array($data['status'], $validStatuses)) {
                return ['success' => false, 'message' => 'Invalid status'];
            }
            $fields[] = 'status = ?';
            $types .= 's';
            $values[] = $data['status'];
        }
        if (isset($data['assigned_date'])) {
            $fields[] = 'assigned_date = ?';
            $types .= 's';
            $values[] = $data['assigned_date'];
        }
        if (isset($data['assigned_time'])) {
            $fields[] = 'assigned_time = ?';
            $types .= 's';
            $values[] = $data['assigned_time'];
        }
        if (isset($data['report_link'])) {
            $fields[] = 'report_link = ?';
            $types .= 's';
            $values[] = $data['report_link'];
        }
        if (isset($data['admin_notes'])) {
            $fields[] = 'admin_notes = ?';
            $types .= 's';
            $values[] = $data['admin_notes'];
        }

        if (empty($fields)) {
            return ['success' => false, 'message' => 'No fields to update'];
        }

        $query = "UPDATE lab_test_requests SET " . implode(', ', $fields) . " WHERE id = ?";
        $types .= 'i';
        $values[] = $id;

        $stmt = $this->conn->prepare($query);
        $stmt->bind_param($types, ...$values);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Lab test request updated'];
        }
        return ['success' => false, 'message' => 'Failed to update: ' . $stmt->error];
    }
}
