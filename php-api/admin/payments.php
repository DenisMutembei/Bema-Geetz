<?php
/**
 * Admin Payments API
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAdmin();

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT 
                    p.*,
                    b.invoice_id,
                    b.customer_name,
                    b.customer_phone,
                    b.customer_email
                FROM payments p
                LEFT JOIN bookings b ON p.booking_id = b.id
                ORDER BY p.created_at DESC
            ");
            $payments = $stmt->fetchAll();
            
            sendResponse(['payments' => $payments]);
            break;
            
        case 'PATCH':
            $data = getJsonInput();
            
            if (empty($data['id']) || empty($data['status'])) {
                sendError('ID and status required');
            }
            
            $validStatuses = ['pending', 'processing', 'completed', 'failed', 'refunded'];
            if (!in_array($data['status'], $validStatuses)) {
                sendError('Invalid status');
            }
            
            $stmt = $pdo->prepare("UPDATE payments SET payment_status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $data['id']]);
            
            sendResponse(['message' => 'Payment status updated']);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (PDOException $e) {
    sendError('Server error', 500);
}
?>
