<?php
/**
 * Enhanced Booking Creation with Invoice Generation
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/notifications.php';
require_once __DIR__ . '/../utils/invoice-generator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth();
$data = getJsonInput();

// Validation
if (empty($data['listingId']) || empty($data['customerName']) || empty($data['phone']) || empty($data['email'])) {
    sendError('Listing ID, customer name, phone, and email are required');
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    sendError('Invalid email format');
}

try {
    // Check listing exists and is available
    $stmt = $pdo->prepare("SELECT * FROM listings WHERE id = ? AND available = 1");
    $stmt->execute([$data['listingId']]);
    $listing = $stmt->fetch();
    
    if (!$listing) {
        sendError('Listing not found or unavailable', 404);
    }
    
    // Generate invoice ID
    $invoiceId = 'BG' . date('Ymd') . strtoupper(substr(uniqid(), -6));
    
    $id = bin2hex(random_bytes(16));
    
    // Calculate amounts
    $totalAmount = $listing['price'];
    $depositPercent = floatval($settings['booking_deposit_percent'] ?? 100);
    $depositAmount = $totalAmount * ($depositPercent / 100);
    $balanceAmount = $totalAmount - $depositAmount;
    
    $stmt = $pdo->prepare("
        INSERT INTO bookings (id, user_id, customer_name, phone, email, listing_id, 
            invoice_id, check_in, check_out, message, status, total_amount, 
            deposit_amount, balance_amount, payment_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, 'unpaid', NOW())
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
        isset($data['message']) ? $data['message'] : null,
        $totalAmount,
        $depositAmount,
        $balanceAmount
    ]);
    
    // Generate invoice
    $invoiceGen = new InvoiceGenerator();
    $invoiceData = $invoiceGen->saveInvoice($id);
    
    // Send notifications
    $notifier = new NotificationService();
    
    // Email booking confirmation
    $notifier->sendBookingConfirmation($id);
    
    // SMS confirmation
    $notifier->sendSMS(
        $data['phone'],
        "Thank you {$data['customerName']}! Your booking {$invoiceId} has been received. Please check your email for payment instructions. Total: KES $totalAmount",
        'booking_confirmation',
        $id
    );
    
    // Admin notification
    $notifier->notifyAdmin('new_booking', [
        'customer' => $data['customerName'],
        'listing' => $listing['title'],
        'invoice' => $invoiceId,
        'amount' => $totalAmount
    ]);
    
    // Log booking creation
    $historyId = bin2hex(random_bytes(16));
    $stmt = $pdo->prepare("
        INSERT INTO booking_status_history (id, booking_id, new_status, notes, created_at)
        VALUES (?, ?, 'pending', 'Booking created', NOW())
    ");
    $stmt->execute([$historyId, $id]);
    
    sendResponse([
        'message' => 'Booking created successfully',
        'booking' => [
            'id' => $id,
            'invoiceId' => $invoiceId,
            'status' => 'pending',
            'paymentStatus' => 'unpaid',
            'totalAmount' => $totalAmount,
            'depositAmount' => $depositAmount,
            'balanceAmount' => $balanceAmount,
            'invoice' => [
                'invoiceId' => $invoiceData['invoice_id'] ?? null,
                'invoiceNumber' => $invoiceData['invoice_number'] ?? null,
                'amount' => $invoiceData['amount'] ?? $totalAmount
            ]
        ]
    ], 201);
    
} catch (PDOException $e) {
    error_log("Booking creation error: " . $e->getMessage());
    sendError('Server error: ' . $e->getMessage(), 500);
}
?>
