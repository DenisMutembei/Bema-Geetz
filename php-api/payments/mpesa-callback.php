<?php
/**
 * M-Pesa Callback Handler
 * Receives payment confirmation from Safaricom
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/notifications.php';

// Log raw callback for debugging
$rawData = file_get_contents('php://input');
error_log("M-Pesa Callback: " . $rawData);

$data = json_decode($rawData, true);

if (!$data || !isset($data['Body']['stkCallback'])) {
    error_log("Invalid M-Pesa callback data");
    http_response_code(400);
    exit();
}

$callback = $data['Body']['stkCallback'];
$resultCode = $callback['ResultCode'];
$resultDesc = $callback['ResultDesc'];
$merchantRequestId = $callback['MerchantRequestID'];
$checkoutRequestId = $callback['CheckoutRequestID'];

// Find payment by checkout request ID
$stmt = $pdo->prepare("
    SELECT p.*, b.id as booking_id, b.user_id, b.customer_name, b.customer_email, b.listing_id
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    WHERE p.mpesa_checkout_request_id = ?
");
$stmt->execute([$checkoutRequestId]);
$payment = $stmt->fetch();

if (!$payment) {
    error_log("Payment not found for checkout request: $checkoutRequestId");
    http_response_code(200); // Acknowledge receipt to avoid retries
    exit();
}

$paymentId = $payment['id'];
$bookingId = $payment['booking_id'];
$userId = $payment['user_id'];

try {
    if ($resultCode === 0) {
        // Payment successful
        $mpesaReceipt = $callback['CallbackMetadata']['Item'][1]['Value'] ?? null;
        $transactionDate = $callback['CallbackMetadata']['Item'][3]['Value'] ?? null;
        $phoneNumber = $callback['CallbackMetadata']['Item'][4]['Value'] ?? null;
        
        // Update payment as completed
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET payment_status = 'completed',
                mpesa_receipt = ?,
                transaction_code = ?,
                paid_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$mpesaReceipt, $mpesaReceipt, $paymentId]);
        
        // Update booking payment status
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
            VALUES (?, ?, 'pending', 'confirmed', 'Payment received via M-Pesa')
        ");
        $stmt->execute([$historyId, $bookingId]);
        
        // Generate receipt
        $receiptNumber = 'RCP' . date('Ymd') . strtoupper(substr(uniqid(), -6));
        $receiptId = bin2hex(random_bytes(16));
        
        $stmt = $pdo->prepare("
            INSERT INTO receipts (id, receipt_number, payment_id, booking_id, user_id,
                customer_name, amount, payment_method, transaction_reference, created_at)
            SELECT ?, ?, p.id, b.id, b.user_id, b.customer_name, p.amount, 
                'mpesa', p.mpesa_receipt, NOW()
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.id = ?
        ");
        $stmt->execute([$receiptId, $receiptNumber, $paymentId]);
        
        // Send notifications
        $notifier = new NotificationService();
        
        // Email receipt to customer
        $notifier->sendPaymentReceipt($bookingId, $receiptId);
        
        // SMS notification
        if ($phoneNumber) {
            $notifier->sendSMS(
                $phoneNumber,
                "Your payment of KES {$payment['amount']} has been received. Receipt: $receiptNumber. Thank you for choosing Bema Geetz!",
                'payment_received',
                $bookingId
            );
        }
        
        // Admin notification
        $notifier->notifyAdmin('payment_received', [
            'amount' => $payment['amount'],
            'customer' => $payment['customer_name'],
            'receipt' => $receiptNumber
        ]);
        
        error_log("Payment $paymentId completed successfully. Receipt: $receiptNumber");
        
    } else {
        // Payment failed
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET payment_status = 'failed'
            WHERE id = ?
        ");
        $stmt->execute([$paymentId]);
        
        error_log("Payment $paymentId failed: $resultDesc");
    }
    
    // Acknowledge receipt
    http_response_code(200);
    echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Success']);
    
} catch (Exception $e) {
    error_log("Callback processing error: " . $e->getMessage());
    http_response_code(500);
}
?>
