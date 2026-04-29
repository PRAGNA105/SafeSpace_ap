<?php
// ===============================================
// HUGGING FACE NATIVE OAUTH ENDPOINT
// ===============================================

require_once __DIR__ . '/../cors.php';          // CORS FIRST
require_once __DIR__ . '/../bootstrap.php';     // env + helpers
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$authController = new AuthController($conn);
$method = $_SERVER['REQUEST_METHOD'];

// HuggingFace Space domain detection for dynamic redirect_uri
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
if (isset($_SERVER['HTTP_X_FORWARDED_HOST'])) {
    $host = $_SERVER['HTTP_X_FORWARDED_HOST']; // Handles render
}
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $originHost = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    if ($originHost && str_contains($originHost, '.hf.space')) {
        $host = $originHost;
        $protocol = "https://";
    }
}
$redirect_uri = $protocol . $host . "/api/oauth.php"; 

if (isset($_GET['code'])) {
    // We are receiving the OAuth callback from Hugging Face
    $code = $_GET['code'];
    $client_id = getenv('OAUTH_CLIENT_ID');
    $client_secret = getenv('OAUTH_CLIENT_SECRET');

    if (!$client_id || !$client_secret) {
        die("Server misconfigured: HF OAUTH variables missing.");
    }

    // Exchange code for token
    $ch = curl_init('https://huggingface.co/oauth/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'authorization_code',
        'code' => $code,
        'client_id' => $client_id,
        'client_secret' => $client_secret,
        'redirect_uri' => $redirect_uri
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $tokenData = json_decode($response, true);
    
    if ($httpCode !== 200 || !isset($tokenData['access_token'])) {
        die("OAuth token exchange failed: " . htmlspecialchars($response));
    }
    
    // Fetch user info from Hugging Face
    $ch = curl_init('https://huggingface.co/oauth/userinfo');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $tokenData['access_token']
    ]);
    $userResponse = curl_exec($ch);
    curl_close($ch);
    
    $hfUserData = json_decode($userResponse, true);
    
    if (!isset($hfUserData['sub'])) {
        die("Failed to fetch Hugging Face user profile.");
    }
    
    // Auto-provision or login using AuthController
    // We reuse the google logic for auto-provisioning
    try {
        $email = $hfUserData['email'] ?? ($hfUserData['preferred_username'] . '@huggingface.co');
        $firstName = $hfUserData['name'] ?? $hfUserData['preferred_username'] ?? 'HF User';
        $lastName = ''; 
        $picture = $hfUserData['picture'] ?? '';
        $oauthId = $hfUserData['sub'];

        $user = $authController->handleGoogleLogin(
            $oauthId,
            $email,
            $firstName,
            $lastName,
            $picture
        );
        
        $token = $user['token'];
        $userData = json_encode($user['data']);
        
        // Redirect back to frontend
        $frontendRedir = "http://localhost:5173";
        if (str_contains($host, '.hf.space')) {
            $frontendRedir = "https://" . $host;
        } elseif (getenv('VITE_API_URL') || getenv('FRONTEND_URL')) {
            $frontendRedir = getenv('FRONTEND_URL') ?: str_replace('/api', '', getenv('VITE_API_URL'));
        }
        
        header("Location: " . $frontendRedir . "/login?token=" . urlencode($token) . "&user=" . urlencode($userData));
        exit;
    } catch (Exception $e) {
        die("Login failed: " . $e->getMessage());
    }
}

if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'login') {
    // Generate OAuth URL
    $client_id = getenv('OAUTH_CLIENT_ID');
    if (!$client_id) {
        die("Server misconfigured: OAUTH_CLIENT_ID missing");
    }
    // Using space frontend redirect URI dynamically if origin header was present
    if (isset($_GET['frontend_url'])) {
        // Optional: save frontend url in state
    }
    $url = "https://huggingface.co/oauth/authorize?client_id=" . urlencode($client_id) . "&redirect_uri=" . urlencode($redirect_uri) . "&scope=openid%20profile%20email&response_type=code&state=hfauth";
    header("Location: $url");
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['credential'])) {
        // Verify Google ID Token (JWT)
        $idToken = $input['credential'];
        $verifyUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($idToken);
        
        $ch = curl_init($verifyUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $verifyResponse = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $googleData = json_decode($verifyResponse, true);
            
            $oauthId = $googleData['sub'];
            $email = $googleData['email'];
            $firstName = $googleData['given_name'] ?? '';
            $lastName = $googleData['family_name'] ?? '';
            $picture = $googleData['picture'] ?? '';
            
            try {
                $userSession = $authController->handleGoogleLogin($oauthId, $email, $firstName, $lastName, $picture);
                jsonResponse(200, [
                    'success' => true,
                    'message' => 'Google login successful',
                    'token' => $userSession['token'],
                    'user' => $userSession['data'],
                    'needs_profile_setup' => $userSession['needs_profile_setup']
                ]);
            } catch (Exception $e) {
                jsonResponse(500, [
                    'success' => false,
                    'message' => 'Login processing failed: ' . $e->getMessage()
                ]);
            }
        } else {
            jsonResponse(401, [
                'success' => false,
                'message' => 'Invalid Google credential provided'
            ]);
        }
    }
}

jsonResponse(400, [
    'success' => false,
    'message' => 'Invalid OAuth request'
]);
