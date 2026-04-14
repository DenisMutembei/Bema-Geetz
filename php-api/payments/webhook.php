<?php
/**
 * Flutterwave Payment Webhook Handler
 * Handles all payment confirmations (Card, M-Pesa, Bank, USSD)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/notifications.php';

// Log raw webhook for debugging
$rawData = file_get_contents('php://input');
error_log("Flutterwave Webhook: " . $rawData);

$payload = json_decode($rawData, true);

if (!$payload || !isset($payload['event'])) {
    error_log("Invalid webhook payload");
    http_response_code(400);
    exit();
}

try {
    $event = $payload['event'];
    $data = $payload['data'] ?? [];
    
    // Only process charge.completed events
    if ($event !== 'charge.completed') {
        http_response_code(200);
        echo json_encode(['status' => 'ignored', 'event' => $event]);
        exit();
    }
    
    $txRef = $data['tx_ref'] ?? '';
    $status = $data['status'] ?? '';
    $amount = $data['amount'] ?? 0;
    $currency = $data['currency'] ?? 'KES';
    $transactionId = $data['id'] ?? '';
    $paymentType = $data['payment_type'] ?? 'card'; // card, mobilemoney, bank_transfer, etc.
    
    // Find payment by transaction reference
    $stmt = $pdo->prepare("
        SELECT p.*, b.id as booking_id, b.user_id, b.customer_name, b.customer_email, b.customer_phone
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        WHERE p.transaction_code = ?
    ");
    $stmt->execute([$txRef]);
    $payment = $stmt->fetch();
    
    if (!$payment) {
        error_log("Payment not found for tx_ref: $txRef");
        http_response_code(200);
        exit();
    }
    
    $paymentId = $payment['id'];
    $bookingId = $payment['booking_id'];
    
    // Process based on status
    if ($status === 'successful') {
        // Update payment as completed
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET payment_status = 'completed',
                payment_method = ?,
                paid_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$paymentType, $paymentId]);
        
        // Update booking
        $stmt = $pdo->prepare("
            UPDATE bookings 
            SET payment_status = 'paid',
                status = 'confirmed'
            WHERE id = ?
        ");
        $stmt->execute([$bookingId]);
        
        // Log status change
        $historyId = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("
            INSERT INTO booking_status_history (id, booking_id, old_status, new_status, notes)
            VALUES (?, ?, 'pending', 'confirmed', ?)
        ");
        $notes = "Payment received via " . ucfirst($paymentType);
        $stmt->execute([$historyId, $bookingId, $notes]);
        
        // Generate receipt
        $receiptNumber = 'RCP' . date('Ymd') . strtoupper(substr(uniqid(), -6));
        $receiptId = bin2hex(random_bytes(16));
        
        $stmt = $pdo->prepare("
            INSERT INTO receipts (id, receipt_number, payment_id, booking_id, user_id,
                customer_name, amount, payment_method, transaction_reference, created_at)
            SELECT ?, ?, p.id, b.id, b.user_id, b.customer_name, p.amount, 
                ?, ?, NOW()
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.id = ?
        ");
        $stmt->execute([$receiptId, $receiptNumber, $paymentType, $transactionId, $paymentId]);
        
        // Send notifications
        $notifier = new NotificationService();
        
        // Email receipt
        $notifier->sendPaymentReceipt($bookingId, $receiptId);
        
        // SMS notification
        if ($payment['customer_phone']) {
            $methodName = str_replace('_', ' ', $paymentType);
            $notifier->sendSMS(
                $payment['customer_phone'],
                "Your payment of $currency $amount has been received via $methodName. Receipt: $receiptNumber. Thank you!",
                'payment_received',
                $bookingId
            );
        }
        
        // Admin notification
        $notifier->notifyAdmin('payment_received', [
            'amount' => $amount,
            'customer' => $payment['customer_name'],
            'receipt' => $receiptNumber,
            'method' => $paymentType
        ]);
        
        error_log("Payment completed for payment $paymentId. Receipt: $receiptNumber");
        
    } else {
        // Payment failed
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET payment_status = 'failed'
            WHERE id = ?
        ");
        $stmt->execute([$paymentId]);
        
        error_log("Payment failed for payment $paymentId: $status");
    }
    
    // Acknowledge receipt
    http_response_code(200);
    echo json_encode(['status' => 'success']);
    
} catch (Exception $e) {
    error_log("Webhook processing error: " . $e->getMessage());
    http_response_code(500);
}
?>
