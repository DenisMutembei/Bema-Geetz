<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $user = requireAuth();
            
            // Get user's bookings
            $stmt = $pdo->prepare("
                SELECT b.*, l.title as listing_title, l.type as listing_type
                FROM bookings b
                JOIN listings l ON b.listing_id = l.id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
            ");
            $stmt->execute([$user['sub']]);
            $bookings = $stmt->fetchAll();
            
            sendResponse(['bookings' => $bookings]);
            break;
            
        case 'POST':
            $user = requireAuth();
            $data = getJsonInput();
            
            // Validation
            if (empty($data['listingId']) || empty($data['customerName']) || empty($data['phone']) || empty($data['email'])) {
                sendError('Listing ID, customer name, phone, and email are required');
            }
            
            // Check listing exists
            $stmt = $pdo->prepare("SELECT * FROM listings WHERE id = ? AND available = 1");
            $stmt->execute([$data['listingId']]);
            $listing = $stmt->fetch();
            
            if (!$listing) {
                sendError('Listing not found or unavailable', 404);
            }
            
            // Generate invoice ID
            $invoiceId = 'BG' . date('Ymd') . strtoupper(substr(uniqid(), -6));
            
            $id = bin2hex(random_bytes(16));
            
            $stmt = $pdo->prepare("
                INSERT INTO bookings (id, user_id, customer_name, phone, email, listing_id, 
                    invoice_id, check_in, check_out, message, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            ");
            
            $stmt->execute([
                $id,
                $user['sub'],
                $data['customerName'],
                $data['phone'],
                $data['email'],
                $data['listingId'],
                $invoiceId,
                isset($data['checkIn']) ? $data['checkIn'] : null,
                isset($data['checkOut']) ? $data['checkOut'] : null,
                isset($data['message']) ? $data['message'] : null
            ]);
            
            sendResponse([
                'message' => 'Booking created successfully',
                'booking' => [
                    'id' => $id,
                    'invoiceId' => $invoiceId,
                    'status' => 'pending'
                ]
            ], 201);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (PDOException $e) {
    error_log("Booking error: " . $e->getMessage());
    sendError('Server error: ' . $e->getMessage(), 500);
}
?>
