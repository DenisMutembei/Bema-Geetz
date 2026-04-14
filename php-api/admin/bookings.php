<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAdmin();

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT b.*, l.title as listing_title, l.price as listing_price
                FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                ORDER BY b.created_at DESC
            ");
            sendResponse($stmt->fetchAll());
            break;
            
        case 'PATCH':
            $data = getJsonInput();
            
            if (empty($data['id']) || empty($data['status'])) {
                sendError('ID and status required');
            }
            
            if (!in_array($data['status'], ['pending', 'confirmed', 'cancelled'])) {
                sendError('Invalid status');
            }
            
            $stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $data['id']]);
            
            sendResponse(['message' => 'Status updated']);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (PDOException $e) {
    sendError('Server error', 500);
}
?>
