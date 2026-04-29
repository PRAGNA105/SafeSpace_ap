<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/medical_security.php';

class AdminController
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    // Get all users with their basic info
    public function getAllUsers()
    {
        try {
            $query = "SELECT 
                        u.id,
                        u.email,
                        u.first_name,
                        u.last_name,
                        u.phone,
                        u.hostel,
                        u.oauth_provider,
                        u.oauth_profile_image,
                        u.introduction,
                        u.preferences,
                        u.emergency_contact_name,
                        u.emergency_contact_phone,
                        u.created_at,
                        u.updated_at,
                        (SELECT COUNT(*) FROM user_activity_logs WHERE user_id = u.id) as total_interactions
                     FROM users u
                     GROUP BY u.id
                     ORDER BY u.created_at DESC";

            $result = $this->conn->query($query);
            
            if (!$result) {
                throw new Exception("Query failed: " . $this->conn->error);
            }

            $users = [];
            while ($row = $result->fetch_assoc()) {
                // Parse preferences JSON if it exists
                if ($row['preferences']) {
                    $row['preferences'] = json_decode($row['preferences'], true);
                }
                $users[] = $row;
            }

            return [
                'success' => true,
                'data' => $users,
                'count' => count($users)
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    // Get specific user with all interactions
    public function getUserDetails($userId)
    {
        try {
            // Get user basic info
            $query = "SELECT * FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            $userResult = $stmt->get_result();
            
            if ($userResult->num_rows === 0) {
                throw new Exception("User not found");
            }

            $user = $userResult->fetch_assoc();

            // Parse JSON fields
            if ($user['preferences']) {
                $user['preferences'] = json_decode($user['preferences'], true);
            } else {
                $user['preferences'] = [];
            }

            if ($user['trusted_contacts']) {
                $user['trusted_contacts'] = json_decode($user['trusted_contacts'], true);
            } else {
                $user['trusted_contacts'] = [];
            }

            // Fetch Medical Profile
            $medicalProfile = null;
            $medQuery = "SELECT * FROM medical_profiles WHERE user_id = ?";
            $medStmt = $this->conn->prepare($medQuery);
            $medStmt->bind_param("i", $userId);
            $medStmt->execute();
            $medResult = $medStmt->get_result();
            if ($medResult->num_rows > 0) {
                $medRow = $medResult->fetch_assoc();
                $medicalProfile = [
                    'blood_group' => $medRow['blood_group'] ?? '',
                    'allergies' => decryptMedicalValue($medRow['allergies_encrypted'], true),
                    'chronic_conditions' => decryptMedicalValue($medRow['chronic_conditions_encrypted'], true),
                    'current_medications' => decryptMedicalValue($medRow['current_medications_encrypted'], true),
                    'emergency_contact_name' => decryptMedicalValue($medRow['emergency_contact_name_encrypted']),
                    'emergency_contact_phone' => decryptMedicalValue($medRow['emergency_contact_phone_encrypted']),
                    'medical_notes' => decryptMedicalValue($medRow['medical_notes_encrypted']),
                    'updated_at' => $medRow['updated_at']
                ];
            }

            // Fetch Medicine Records
            $medicineRecords = [];
            $medRecQuery = "SELECT * FROM medicine_records WHERE user_id = ? ORDER BY created_at DESC";
            $medRecStmt = $this->conn->prepare($medRecQuery);
            $medRecStmt->bind_param("i", $userId);
            $medRecStmt->execute();
            $medRecResult = $medRecStmt->get_result();
            while ($mRow = $medRecResult->fetch_assoc()) {
                $medicineRecords[] = [
                    'id' => $mRow['id'],
                    'name' => decryptMedicalValue($mRow['name_encrypted']),
                    'dosage' => decryptMedicalValue($mRow['dosage_encrypted']),
                    'frequency' => decryptMedicalValue($mRow['frequency_encrypted']),
                    'instructions' => decryptMedicalValue($mRow['instructions_encrypted']),
                    'status' => $mRow['status'],
                    'start_date' => $mRow['start_date'],
                    'end_date' => $mRow['end_date']
                ];
            }

            // Fetch Appointments
            $appointments = [];
            $aptQuery = "SELECT * FROM appointments WHERE user_id = ? ORDER BY created_at DESC";
            $aptStmt = $this->conn->prepare($aptQuery);
            $aptStmt->bind_param("i", $userId);
            $aptStmt->execute();
            $aptResult = $aptStmt->get_result();
            while ($aRow = $aptResult->fetch_assoc()) {
                $appointments[] = $aRow;
            }

            return [
                'success' => true,
                'user' => $user,
                'trusted_contacts' => $user['trusted_contacts'],
                'medical_profile' => $medicalProfile,
                'medicine_records' => $medicineRecords,
                'appointments' => $appointments
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }


    // Get user activity timeline (all interactions)
    public function getUserActivityTimeline($userId, $limit = 50)
    {
        try {
            // Combine all user activities
            $activities = [];

            // Activity logs
            $activityQuery = "SELECT 'activity' as type, id, activity_type, activity_description as description, 
                             metadata, created_at
                             FROM user_activity_logs WHERE user_id = ?
                             ORDER BY created_at DESC LIMIT ?";
            $stmt = $this->conn->prepare($activityQuery);
            $stmt->bind_param("ii", $userId, $limit);
            $stmt->execute();
            $result = $stmt->get_result();
            while ($row = $result->fetch_assoc()) {
                if ($row['metadata']) {
                    $row['metadata'] = json_decode($row['metadata'], true);
                }
                $row['icon'] = $this->getActivityIcon($row['activity_type']);
                $activities[] = $row;
            }


            // Sort by date
            usort($activities, function ($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            // Limit results
            $activities = array_slice($activities, 0, $limit);

            return [
                'success' => true,
                'activities' => $activities,
                'count' => count($activities)
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    // Helper function to get activity icons
    private function getActivityIcon($activityType)
    {
        $icons = [
            'registration' => '✅',
            'login' => '🔐',
            'logout' => '👋',
            'profile_update' => '✏️',
            'safety_feature' => '🛡️',
            'wellness_activity' => '💚',
            'resource_view' => '📚'
        ];
        return $icons[$activityType] ?? '📝';
    }

    // Get dashboard summary
    public function getDashboardSummary()
    {
        try {
            $summary = [];

            // Total users
            $usersQuery = "SELECT COUNT(*) as total FROM users";
            $summary['total_users'] = $this->conn->query($usersQuery)->fetch_assoc()['total'];

            // Active users today (users who have been active in the last 24 hours)
            $activeTodayQuery = "SELECT COUNT(*) as total FROM users 
                                WHERE last_active IS NOT NULL 
                                AND last_active >= DATE_SUB(NOW(), INTERVAL 24 HOUR)";
            $summary['active_users_today'] = $this->conn->query($activeTodayQuery)->fetch_assoc()['total'];

            // Trusted Contacts Statistics - NEW
            $contactsQuery = "SELECT COUNT(*) as users_with_contacts FROM users WHERE trusted_contacts IS NOT NULL AND trusted_contacts != '[]' AND trusted_contacts != ''";
            $summary['users_with_contacts'] = $this->conn->query($contactsQuery)->fetch_assoc()['users_with_contacts'];

            // Total number of contacts across all users - NEW
            $totalContactsQuery = "SELECT SUM(JSON_LENGTH(trusted_contacts)) as total FROM users WHERE trusted_contacts IS NOT NULL AND trusted_contacts != '[]'";
            $contactsResult = $this->conn->query($totalContactsQuery)->fetch_assoc();
            $summary['total_contacts'] = $contactsResult['total'] ?? 0;

            return [
                'success' => true,
                'summary' => $summary
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}

?>
