<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/medical_security.php';

class MedicalRecordsController
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    private function currentUserId(): int
    {
        $user = requireAuth();
        return (int) $user['id'];
    }

    private function encodeUpload(?array $upload): array
    {
        if (!$upload || empty($upload['data'])) {
            return [
                'name' => null,
                'mime_type' => null,
                'data' => null,
            ];
        }

        return [
            'name' => $upload['name'] ?? 'prescription',
            'mime_type' => $upload['mime_type'] ?? 'application/octet-stream',
            'data' => $upload['data'],
        ];
    }

    private function getProfileByUserId(int $userId): array
    {
        $query = "SELECT * FROM medical_profiles WHERE user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        if (!$row) {
            return [
                'blood_group' => '',
                'allergies' => [],
                'chronic_conditions' => [],
                'current_medications' => [],
                'emergency_contact_name' => '',
                'emergency_contact_phone' => '',
                'emergency_contact_relation' => '',
                'medical_notes' => '',
                'pin_enabled' => false,
                'biometric_enabled' => false,
                'location_access_enabled' => false,
                'updated_at' => null,
            ];
        }

        return [
            'blood_group' => $row['blood_group'] ?? '',
            'allergies' => decryptMedicalValue($row['allergies_encrypted'], true),
            'chronic_conditions' => decryptMedicalValue($row['chronic_conditions_encrypted'], true),
            'current_medications' => decryptMedicalValue($row['current_medications_encrypted'], true),
            'emergency_contact_name' => decryptMedicalValue($row['emergency_contact_name_encrypted']),
            'emergency_contact_phone' => decryptMedicalValue($row['emergency_contact_phone_encrypted']),
            'emergency_contact_relation' => decryptMedicalValue($row['emergency_contact_relation_encrypted']),
            'medical_notes' => decryptMedicalValue($row['medical_notes_encrypted']),
            'pin_enabled' => (bool) $row['pin_enabled'],
            'biometric_enabled' => (bool) $row['biometric_enabled'],
            'location_access_enabled' => (bool) $row['location_access_enabled'],
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }

    public function getDashboard(): array
    {
        $userId = $this->currentUserId();

        return [
            'success' => true,
            'data' => [
                'profile' => $this->getProfileByUserId($userId),
                'medicines' => $this->getMedicinesData($userId),
                'pharmacies' => [
                    'preferred' => $this->getPharmaciesData($userId),
                    'purchases' => $this->getPurchaseHistoryData($userId),
                    'nearby' => $this->getNearbyPharmaciesData(),
                ],
                'reminders' => $this->getRemindersData($userId),
                'history' => $this->buildHistory($userId),
            ],
            'meta' => [
                'encryption' => 'application-layer AES-256',
                'access_lock' => 'PIN / biometric-ready',
                'summary_export' => 'print-to-PDF',
            ],
        ];
    }

    public function getProfile(): array
    {
        $userId = $this->currentUserId();

        return [
            'success' => true,
            'data' => $this->getProfileByUserId($userId),
        ];
    }

    public function saveProfile(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];

        $bloodGroup = $data['blood_group'] ?? '';
        $allergies = $data['allergies'] ?? [];
        $chronicConditions = $data['chronic_conditions'] ?? [];
        $currentMedications = $data['current_medications'] ?? [];
        $emergencyContactName = $data['emergency_contact_name'] ?? '';
        $emergencyContactPhone = $data['emergency_contact_phone'] ?? '';
        $emergencyContactRelation = $data['emergency_contact_relation'] ?? '';
        $medicalNotes = $data['medical_notes'] ?? '';
        $pinEnabled = !empty($data['pin_enabled']) ? 1 : 0;
        $biometricEnabled = !empty($data['biometric_enabled']) ? 1 : 0;
        $locationAccessEnabled = !empty($data['location_access_enabled']) ? 1 : 0;

        $query = "
            INSERT INTO medical_profiles (
                user_id,
                blood_group,
                allergies_encrypted,
                chronic_conditions_encrypted,
                current_medications_encrypted,
                emergency_contact_name_encrypted,
                emergency_contact_phone_encrypted,
                emergency_contact_relation_encrypted,
                medical_notes_encrypted,
                pin_enabled,
                biometric_enabled,
                location_access_enabled
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                blood_group = VALUES(blood_group),
                allergies_encrypted = VALUES(allergies_encrypted),
                chronic_conditions_encrypted = VALUES(chronic_conditions_encrypted),
                current_medications_encrypted = VALUES(current_medications_encrypted),
                emergency_contact_name_encrypted = VALUES(emergency_contact_name_encrypted),
                emergency_contact_phone_encrypted = VALUES(emergency_contact_phone_encrypted),
                emergency_contact_relation_encrypted = VALUES(emergency_contact_relation_encrypted),
                medical_notes_encrypted = VALUES(medical_notes_encrypted),
                pin_enabled = VALUES(pin_enabled),
                biometric_enabled = VALUES(biometric_enabled),
                location_access_enabled = VALUES(location_access_enabled),
                updated_at = CURRENT_TIMESTAMP
        ";

        $stmt = $this->conn->prepare($query);
        $allergiesEncrypted = encryptMedicalValue($allergies);
        $chronicEncrypted = encryptMedicalValue($chronicConditions);
        $currentMedsEncrypted = encryptMedicalValue($currentMedications);
        $emergencyNameEncrypted = encryptMedicalValue($emergencyContactName);
        $emergencyPhoneEncrypted = encryptMedicalValue($emergencyContactPhone);
        $emergencyRelationEncrypted = encryptMedicalValue($emergencyContactRelation);
        $medicalNotesEncrypted = encryptMedicalValue($medicalNotes);

        $stmt->bind_param(
            "issssssssiii",
            $userId,
            $bloodGroup,
            $allergiesEncrypted,
            $chronicEncrypted,
            $currentMedsEncrypted,
            $emergencyNameEncrypted,
            $emergencyPhoneEncrypted,
            $emergencyRelationEncrypted,
            $medicalNotesEncrypted,
            $pinEnabled,
            $biometricEnabled,
            $locationAccessEnabled
        );
        $stmt->execute();

        return [
            'success' => true,
            'message' => 'Medical profile saved successfully',
            'data' => $this->getProfileByUserId($userId),
        ];
    }

    private function mapMedicine(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => decryptMedicalValue($row['name_encrypted']),
            'dosage' => decryptMedicalValue($row['dosage_encrypted']),
            'frequency' => decryptMedicalValue($row['frequency_encrypted']),
            'instructions' => decryptMedicalValue($row['instructions_encrypted']),
            'start_date' => $row['start_date'],
            'end_date' => $row['end_date'],
            'refill_date' => $row['refill_date'],
            'expiry_date' => $row['expiry_date'],
            'status' => $row['status'],
            'prescription' => [
                'name' => $row['prescription_name'],
                'mime_type' => $row['prescription_mime_type'],
                'data' => $row['prescription_data'],
            ],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    private function getMedicinesData(int $userId): array
    {
        $query = "SELECT * FROM medicine_records WHERE user_id = ? ORDER BY COALESCE(start_date, created_at) DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $this->mapMedicine($row);
        }

        return $items;
    }

    public function getMedicines(): array
    {
        $userId = $this->currentUserId();
        return [
            'success' => true,
            'data' => $this->getMedicinesData($userId),
        ];
    }

    public function saveMedicine(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $medicineId = isset($data['id']) ? (int) $data['id'] : 0;

        $upload = $this->encodeUpload($data['prescription'] ?? null);
        $nameEncrypted = encryptMedicalValue($data['name'] ?? '');
        $dosageEncrypted = encryptMedicalValue($data['dosage'] ?? '');
        $frequencyEncrypted = encryptMedicalValue($data['frequency'] ?? '');
        $instructionsEncrypted = encryptMedicalValue($data['instructions'] ?? '');
        $startDate = !empty($data['start_date']) ? $data['start_date'] : null;
        $endDate = !empty($data['end_date']) ? $data['end_date'] : null;
        $refillDate = !empty($data['refill_date']) ? $data['refill_date'] : null;
        $expiryDate = !empty($data['expiry_date']) ? $data['expiry_date'] : null;
        $status = $data['status'] ?? 'active';

        if ($medicineId > 0) {
            $query = "
                UPDATE medicine_records
                SET
                    name_encrypted = ?,
                    dosage_encrypted = ?,
                    frequency_encrypted = ?,
                    instructions_encrypted = ?,
                    start_date = ?,
                    end_date = ?,
                    refill_date = ?,
                    expiry_date = ?,
                    status = ?,
                    prescription_name = ?,
                    prescription_mime_type = ?,
                    prescription_data = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "ssssssssssssii",
                $nameEncrypted,
                $dosageEncrypted,
                $frequencyEncrypted,
                $instructionsEncrypted,
                $startDate,
                $endDate,
                $refillDate,
                $expiryDate,
                $status,
                $upload['name'],
                $upload['mime_type'],
                $upload['data'],
                $medicineId,
                $userId
            );
            $stmt->execute();
        } else {
            $query = "
                INSERT INTO medicine_records (
                    user_id,
                    name_encrypted,
                    dosage_encrypted,
                    frequency_encrypted,
                    instructions_encrypted,
                    start_date,
                    end_date,
                    refill_date,
                    expiry_date,
                    status,
                    prescription_name,
                    prescription_mime_type,
                    prescription_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "issssssssssss",
                $userId,
                $nameEncrypted,
                $dosageEncrypted,
                $frequencyEncrypted,
                $instructionsEncrypted,
                $startDate,
                $endDate,
                $refillDate,
                $expiryDate,
                $status,
                $upload['name'],
                $upload['mime_type'],
                $upload['data']
            );
            $stmt->execute();
            $medicineId = (int) $this->conn->insert_id;
        }

        return [
            'success' => true,
            'message' => 'Medicine record saved successfully',
            'data' => $this->getMedicineById($userId, $medicineId),
        ];
    }

    private function getMedicineById(int $userId, int $medicineId): ?array
    {
        $query = "SELECT * FROM medicine_records WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $medicineId, $userId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        return $row ? $this->mapMedicine($row) : null;
    }

    public function deleteMedicine(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $medicineId = isset($data['id']) ? (int) $data['id'] : 0;

        $query = "DELETE FROM medicine_records WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $medicineId, $userId);
        $stmt->execute();

        return [
            'success' => true,
            'message' => 'Medicine record deleted successfully',
        ];
    }

    private function mapPharmacy(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'name' => decryptMedicalValue($row['name_encrypted']),
            'address' => decryptMedicalValue($row['address_encrypted']),
            'phone' => decryptMedicalValue($row['phone_encrypted']),
            'notes' => decryptMedicalValue($row['notes_encrypted']),
            'is_preferred' => (bool) $row['is_preferred'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    private function getPharmaciesData(int $userId): array
    {
        $query = "SELECT * FROM pharmacy_preferences WHERE user_id = ? ORDER BY is_preferred DESC, updated_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $this->mapPharmacy($row);
        }

        return $items;
    }

    public function getPharmacies(): array
    {
        $userId = $this->currentUserId();
        return [
            'success' => true,
            'data' => $this->getPharmaciesData($userId),
            'nearby' => $this->getNearbyPharmaciesData(),
        ];
    }

    public function savePharmacy(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $pharmacyId = isset($data['id']) ? (int) $data['id'] : 0;
        $isPreferred = !empty($data['is_preferred']) ? 1 : 0;

        if ($isPreferred) {
            $resetQuery = "UPDATE pharmacy_preferences SET is_preferred = 0 WHERE user_id = ?";
            $resetStmt = $this->conn->prepare($resetQuery);
            $resetStmt->bind_param("i", $userId);
            $resetStmt->execute();
        }

        $nameEncrypted = encryptMedicalValue($data['name'] ?? '');
        $addressEncrypted = encryptMedicalValue($data['address'] ?? '');
        $phoneEncrypted = encryptMedicalValue($data['phone'] ?? '');
        $notesEncrypted = encryptMedicalValue($data['notes'] ?? '');

        if ($pharmacyId > 0) {
            $query = "
                UPDATE pharmacy_preferences
                SET
                    name_encrypted = ?,
                    address_encrypted = ?,
                    phone_encrypted = ?,
                    notes_encrypted = ?,
                    is_preferred = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "ssssiii",
                $nameEncrypted,
                $addressEncrypted,
                $phoneEncrypted,
                $notesEncrypted,
                $isPreferred,
                $pharmacyId,
                $userId
            );
            $stmt->execute();
        } else {
            $query = "
                INSERT INTO pharmacy_preferences (
                    user_id,
                    name_encrypted,
                    address_encrypted,
                    phone_encrypted,
                    notes_encrypted,
                    is_preferred
                ) VALUES (?, ?, ?, ?, ?, ?)
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "issssi",
                $userId,
                $nameEncrypted,
                $addressEncrypted,
                $phoneEncrypted,
                $notesEncrypted,
                $isPreferred
            );
            $stmt->execute();
        }

        return [
            'success' => true,
            'message' => 'Preferred pharmacy saved successfully',
            'data' => $this->getPharmaciesData($userId),
        ];
    }

    public function deletePharmacy(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $pharmacyId = isset($data['id']) ? (int) $data['id'] : 0;

        $query = "DELETE FROM pharmacy_preferences WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $pharmacyId, $userId);
        $stmt->execute();

        return [
            'success' => true,
            'message' => 'Pharmacy removed successfully',
        ];
    }

    private function mapPurchase(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'pharmacy_id' => $row['pharmacy_id'] ? (int) $row['pharmacy_id'] : null,
            'medicine_name' => decryptMedicalValue($row['medicine_name_encrypted']),
            'quantity' => $row['quantity'],
            'purchase_date' => $row['purchase_date'],
            'amount' => $row['amount'],
            'notes' => decryptMedicalValue($row['notes_encrypted']),
            'created_at' => $row['created_at'],
        ];
    }

    private function getPurchaseHistoryData(int $userId): array
    {
        $query = "SELECT * FROM pharmacy_purchase_history WHERE user_id = ? ORDER BY purchase_date DESC, created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $this->mapPurchase($row);
        }

        return $items;
    }

    public function getPurchases(): array
    {
        $userId = $this->currentUserId();
        return [
            'success' => true,
            'data' => $this->getPurchaseHistoryData($userId),
        ];
    }

    public function savePurchase(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $purchaseId = isset($data['id']) ? (int) $data['id'] : 0;
        $pharmacyId = isset($data['pharmacy_id']) && $data['pharmacy_id'] !== '' ? (int) $data['pharmacy_id'] : null;
        $quantity = isset($data['quantity']) ? (int) $data['quantity'] : null;
        $amount = isset($data['amount']) && $data['amount'] !== '' ? (float) $data['amount'] : null;

        $medicineNameEncrypted = encryptMedicalValue($data['medicine_name'] ?? '');
        $notesEncrypted = encryptMedicalValue($data['notes'] ?? '');
        $purchaseDate = !empty($data['purchase_date']) ? $data['purchase_date'] : date('Y-m-d');

        if ($purchaseId > 0) {
            $query = "
                UPDATE pharmacy_purchase_history
                SET
                    pharmacy_id = ?,
                    medicine_name_encrypted = ?,
                    quantity = ?,
                    purchase_date = ?,
                    amount = ?,
                    notes_encrypted = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "isisdsii",
                $pharmacyId,
                $medicineNameEncrypted,
                $quantity,
                $purchaseDate,
                $amount,
                $notesEncrypted,
                $purchaseId,
                $userId
            );
            $stmt->execute();
        } else {
            $query = "
                INSERT INTO pharmacy_purchase_history (
                    user_id,
                    pharmacy_id,
                    medicine_name_encrypted,
                    quantity,
                    purchase_date,
                    amount,
                    notes_encrypted
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "iiisids",
                $userId,
                $pharmacyId,
                $medicineNameEncrypted,
                $quantity,
                $purchaseDate,
                $amount,
                $notesEncrypted
            );
            $stmt->execute();
        }

        return [
            'success' => true,
            'message' => 'Purchase history saved successfully',
            'data' => $this->getPurchaseHistoryData($userId),
        ];
    }

    public function deletePurchase(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $purchaseId = isset($data['id']) ? (int) $data['id'] : 0;

        $query = "DELETE FROM pharmacy_purchase_history WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $purchaseId, $userId);
        $stmt->execute();

        return [
            'success' => true,
            'message' => 'Purchase removed successfully',
        ];
    }

    private function mapReminder(array $row): array
    {
        return [
            'id' => (int) $row['id'],
            'medicine_id' => $row['medicine_id'] ? (int) $row['medicine_id'] : null,
            'title' => decryptMedicalValue($row['title_encrypted']),
            'reminder_type' => $row['reminder_type'],
            'schedule_type' => $row['schedule_type'],
            'days_of_week' => json_decode($row['days_of_week'] ?? '[]', true) ?: [],
            'reminder_time' => $row['reminder_time'],
            'start_date' => $row['start_date'],
            'end_date' => $row['end_date'],
            'next_trigger_at' => $row['next_trigger_at'],
            'notes' => decryptMedicalValue($row['notes_encrypted']),
            'is_enabled' => (bool) $row['is_enabled'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        ];
    }

    private function getRemindersData(int $userId): array
    {
        $query = "SELECT * FROM medical_reminders WHERE user_id = ? ORDER BY is_enabled DESC, reminder_time ASC, created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $this->mapReminder($row);
        }

        return $items;
    }

    public function getReminders(): array
    {
        $userId = $this->currentUserId();
        return [
            'success' => true,
            'data' => $this->getRemindersData($userId),
        ];
    }

    public function saveReminder(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $reminderId = isset($data['id']) ? (int) $data['id'] : 0;
        $medicineId = isset($data['medicine_id']) && $data['medicine_id'] !== '' ? (int) $data['medicine_id'] : null;
        $titleEncrypted = encryptMedicalValue($data['title'] ?? '');
        $notesEncrypted = encryptMedicalValue($data['notes'] ?? '');
        $reminderType = $data['reminder_type'] ?? 'medicine';
        $scheduleType = $data['schedule_type'] ?? 'daily';
        $daysOfWeek = json_encode($data['days_of_week'] ?? []);
        $reminderTime = $data['reminder_time'] ?? '09:00:00';
        $startDate = $data['start_date'] ?? date('Y-m-d');
        $endDate = $data['end_date'] ?? null;
        $nextTrigger = $data['next_trigger_at'] ?? null;
        $isEnabled = !array_key_exists('is_enabled', $data) || $data['is_enabled'] ? 1 : 0;

        if ($reminderId > 0) {
            $query = "
                UPDATE medical_reminders
                SET
                    medicine_id = ?,
                    title_encrypted = ?,
                    reminder_type = ?,
                    schedule_type = ?,
                    days_of_week = ?,
                    reminder_time = ?,
                    start_date = ?,
                    end_date = ?,
                    next_trigger_at = ?,
                    notes_encrypted = ?,
                    is_enabled = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "isssssssssiii",
                $medicineId,
                $titleEncrypted,
                $reminderType,
                $scheduleType,
                $daysOfWeek,
                $reminderTime,
                $startDate,
                $endDate,
                $nextTrigger,
                $notesEncrypted,
                $isEnabled,
                $reminderId,
                $userId
            );
            $stmt->execute();
        } else {
            $query = "
                INSERT INTO medical_reminders (
                    user_id,
                    medicine_id,
                    title_encrypted,
                    reminder_type,
                    schedule_type,
                    days_of_week,
                    reminder_time,
                    start_date,
                    end_date,
                    next_trigger_at,
                    notes_encrypted,
                    is_enabled
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param(
                "iisssssssssi",
                $userId,
                $medicineId,
                $titleEncrypted,
                $reminderType,
                $scheduleType,
                $daysOfWeek,
                $reminderTime,
                $startDate,
                $endDate,
                $nextTrigger,
                $notesEncrypted,
                $isEnabled
            );
            $stmt->execute();
        }

        return [
            'success' => true,
            'message' => 'Reminder saved successfully',
            'data' => $this->getRemindersData($userId),
        ];
    }

    public function deleteReminder(): array
    {
        $userId = $this->currentUserId();
        $data = json_decode(file_get_contents("php://input"), true) ?: [];
        $reminderId = isset($data['id']) ? (int) $data['id'] : 0;

        $query = "DELETE FROM medical_reminders WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $reminderId, $userId);
        $stmt->execute();

        return [
            'success' => true,
            'message' => 'Reminder deleted successfully',
        ];
    }

    private function getNearbyPharmaciesData(): array
    {
        return [
            [
                'name' => 'Campus Care Pharmacy',
                'distance_km' => 0.8,
                'address' => 'Near North Gate, SafeSpace Campus',
                'open_now' => true,
            ],
            [
                'name' => 'CityMed Pharmacy',
                'distance_km' => 1.6,
                'address' => '12 Wellness Avenue',
                'open_now' => true,
            ],
            [
                'name' => '24x7 Relief Drugs',
                'distance_km' => 2.4,
                'address' => '88 Emergency Road',
                'open_now' => false,
            ],
        ];
    }

    private function buildHistory(int $userId): array
    {
        $search = trim((string) ($_GET['search'] ?? ''));
        $filter = trim((string) ($_GET['filter'] ?? 'all'));

        $history = [];

        foreach ($this->getMedicinesData($userId) as $medicine) {
            $history[] = [
                'id' => 'med-' . $medicine['id'],
                'type' => 'medicine',
                'title' => $medicine['name'],
                'subtitle' => trim(($medicine['dosage'] ?: '') . ' • ' . ($medicine['frequency'] ?: '')),
                'status' => $medicine['status'],
                'date' => $medicine['start_date'] ?: substr((string) $medicine['created_at'], 0, 10),
                'details' => $medicine['instructions'] ?: 'Medicine record saved',
            ];
        }

        foreach ($this->getPurchaseHistoryData($userId) as $purchase) {
            $history[] = [
                'id' => 'purchase-' . $purchase['id'],
                'type' => 'purchase',
                'title' => $purchase['medicine_name'],
                'subtitle' => 'Pharmacy purchase',
                'status' => 'completed',
                'date' => $purchase['purchase_date'],
                'details' => $purchase['notes'] ?: 'Added from pharmacy purchase history',
            ];
        }

        foreach ($this->getRemindersData($userId) as $reminder) {
            $history[] = [
                'id' => 'reminder-' . $reminder['id'],
                'type' => 'reminder',
                'title' => $reminder['title'],
                'subtitle' => ucfirst($reminder['reminder_type']) . ' reminder',
                'status' => $reminder['is_enabled'] ? 'upcoming' : 'paused',
                'date' => $reminder['start_date'] ?: substr((string) $reminder['created_at'], 0, 10),
                'details' => $reminder['notes'] ?: 'Reminder configured',
            ];
        }

        usort($history, function ($a, $b) {
            return strcmp((string) $b['date'], (string) $a['date']);
        });

        $filtered = array_values(array_filter($history, function ($item) use ($search, $filter) {
            if ($filter !== '' && $filter !== 'all' && $item['type'] !== $filter) {
                return false;
            }

            if ($search === '') {
                return true;
            }

            $haystack = strtolower($item['title'] . ' ' . $item['subtitle'] . ' ' . $item['details']);
            return str_contains($haystack, strtolower($search));
        }));

        return $filtered;
    }

    public function getHistory(): array
    {
        $userId = $this->currentUserId();
        return [
            'success' => true,
            'data' => $this->buildHistory($userId),
        ];
    }

    public function getSummary(): array
    {
        $userId = $this->currentUserId();
        $profile = $this->getProfileByUserId($userId);
        $medicines = $this->getMedicinesData($userId);
        $reminders = $this->getRemindersData($userId);
        $pharmacies = $this->getPharmaciesData($userId);
        $history = array_slice($this->buildHistory($userId), 0, 10);

        return [
            'success' => true,
            'data' => [
                'generated_at' => date('c'),
                'profile' => $profile,
                'medicines' => $medicines,
                'reminders' => $reminders,
                'pharmacies' => $pharmacies,
                'history' => $history,
            ],
        ];
    }
}
