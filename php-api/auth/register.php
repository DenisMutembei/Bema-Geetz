<?php
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$data = getJsonInput();
$name = isset($data['name']) ? trim($data['name']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';

// Validation
if (!$name || !$email || !$password) {
    sendError('Name, email and password required');
}

if (strlen($password) < 6) {
    sendError('Password must be at least 6 characters');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

try {
    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendError('Email already registered');
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Insert user
    $id = bin2hex(random_bytes(16)); // Generate UUID-like ID
    $stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, phone, role, is_verified) VALUES (?, ?, ?, ?, ?, 'customer', 0)");
    $stmt->execute([$id, $name, $email, $hashedPassword, $phone]);
    
    $token = generateJWT($id, $email, 'customer');
    
    sendResponse([
        'token' => $token,
        'user' => [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'role' => 'customer',
            'is_verified' => false,
            'phone' => $phone
        ]
    ], 201);
    
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    sendError('Server error', 500);
}
?>
