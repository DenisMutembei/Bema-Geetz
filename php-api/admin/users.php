<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAdmin();

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT id, name, email, phone, role, is_verified, created_at 
                FROM users 
                ORDER BY created_at DESC
            ");
            $users = $stmt->fetchAll();
            
            foreach ($users as &$u) {
                $u['is_verified'] = (bool)$u['is_verified'];
            }
            
            sendResponse($users);
            break;
            
        case 'DELETE':
            if (empty($_GET['id'])) {
                sendError('User ID required');
            }
            
            // Prevent deleting self
            if ($_GET['id'] === $user['sub']) {
                sendError('Cannot delete yourself');
            }
            
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ? AND role != 'admin'");
            $stmt->execute([$_GET['id']]);
            
            if ($stmt->rowCount() === 0) {
                sendError('Cannot delete admin users', 403);
            }
            
            sendResponse(['message' => 'User deleted']);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (PDOException $e) {
    sendError('Server error', 500);
}
?>
