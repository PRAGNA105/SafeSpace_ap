<?php
// Helper functions for logging user activities

require_once __DIR__ . '/../config/db.php';

function logUserActivity($conn, $userId, $activityType, $description, $metadata = [])
{
    try {
        $metadataJson = json_encode($metadata);
        $query = " 
            INSERT INTO user_activity_logs 
            (user_id, activity_type, activity_description, metadata, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ";

        $stmt = $conn->prepare($query);

        if (!$stmt) {
            die("activity_logger prepare failed: " . $conn->error . " | SQL: " . $query);
        }

        $stmt->bind_param("isss", $userId, $activityType, $description, $metadataJson);
        return $stmt->execute();
    }
    catch (Exception $e) {
        error_log("Failed to log activity: " . $e->getMessage());
        return false;
    }
}

// Activity type constants
class ActivityType
{
    const REGISTRATION = 'registration';
    const LOGIN = 'login';
    const LOGOUT = 'logout';
    const PROFILE_UPDATE = 'profile_update';
    const MOOD_LOG = 'mood_log';
    const SAFETY_FEATURE = 'safety_feature';
    const WELLNESS_ACTIVITY = 'wellness_activity';
    const RESOURCE_VIEW = 'resource_view';
    const EMERGENCY_CONTACT_ADD = 'emergency_contact_add';
    const SETTINGS_CHANGE = 'settings_change';
}
?>
