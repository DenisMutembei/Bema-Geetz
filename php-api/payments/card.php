<?php
/**
 * Card Payment Integration - Flutterwave
 * Supports: Visa, Mastercard, Amex, Bank Transfer
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class FlutterwaveAPI {
    private $publicKey;
    private $secretKey;
    private $encryptionKey;
    private $environment;
    private $baseUrl;
    
    public function __construct() {
        global $pdo;
        
        // Get settings from database
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'payment'");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $this->publicKey = $settings['flutterwave_public_key'] ?? '';
        $this->secretKey = $settings['flutterwave_secret_key'] ?? '';
        $this->encryptionKey = $settings['flutterwave_encryption_key'] ?? '';
        $this->environment = $settings['flutterwave_environment'] ?? 'sandbox';
        
        $this->baseUrl = $this->environment === 'production' 
            ? 'https://api.flutterwave.com/v3'
            : 'https://api.flutterwave.com/v3'; // Same URL, uses sandbox keys
    }
    
    /**
     * Initialize Card Payment
     */
    public function initializePayment($data) {
        $url = $this->baseUrl . '/payments';
        
        $payload = [
            'tx_ref' => $data['tx_ref'],
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? 'KES',
            'redirect_url' => $data['redirect_url'],
            'payment_options' => 'card,mpesa',
            'meta' => [
                'booking_id' => $data['booking_id'],
                'customer_id' => $data['customer_id']
            ],
            'customer' => [
                'email' => $data['customer_email'],
                'phonenumber' => $data['customer_phone'],
                'name' => $data['customer_name']
            ],
            'customizations' => [
                'title' => 'Bema Geetz Payment',
                'description' => 'Payment for ' . $data['item_description'],
                'logo' => 'https://' . $_SERVER['HTTP_HOST'] . '/logo.png'
            ]
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->secretKey,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    /**
     * Verify Transaction
     */
    public function verifyTransaction($transactionId) {
        $url = $this->baseUrl . '/transactions/' . $transactionId . '/verify';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->secretKey
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    /**
     * Process Webhook
     */
    public function processWebhook($payload) {
        // Verify webhook signature
        $signature = $_SERVER['HTTP_VERIF_HASH'] ?? '';
        $expectedSignature = $this->secretKey;
        
        if ($signature !== $expectedSignature) {
            return ['error' => 'Invalid signature'];
        }
        
        return $payload;
    }
}

// API Endpoints
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            // Initialize card payment
            $user = requireAuth();
            $data = getJsonInput();
            
            if (empty($data['booking_id']) || empty($data['amount'])) {
                sendError('Booking ID and amount are required');
            }
            
            $bookingId = $data['booking_id'];
            $amount = floatval($data['amount']);
            
            // Get booking details
            $stmt = $pdo->prepare("
                SELECT b.*, l.title as listing_title 
                FROM bookings b 
                JOIN listings l ON b.listing_id = l.id 
                WHERE b.id = ? AND b.user_id = ?
            ");
            $stmt->execute([$bookingId, $user['sub']]);
            $booking = $stmt->fetch();
            
            if (!$booking) {
                sendError('Booking not found', 404);
            }
            
            // Create payment record
            $paymentId = bin2hex(random_bytes(16));
            $txRef = 'BG-CARD-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
            
            $stmt = $pdo->prepare("
                INSERT INTO payments (id, booking_id, amount, currency, payment_method, 
                    payment_status, transaction_code, created_at)
                VALUES (?, ?, ?, 'KES', 'card', 'pending', ?, NOW())
            ");
            $stmt->execute([$paymentId, $bookingId, $amount, $txRef]);
            
            // Initialize Flutterwave
            $flutterwave = new FlutterwaveAPI();
            $result = $flutterwave->initializePayment([
                'tx_ref' => $txRef,
                'amount' => $amount,
                'currency' => 'KES',
                'redirect_url' => 'https://' . $_SERVER['HTTP_HOST'] . '/payment/callback',
                'booking_id' => $bookingId,
                'customer_id' => $user['sub'],
                'customer_email' => $booking['email'],
                'customer_phone' => $booking['phone'],
                'customer_name' => $booking['customer_name'],
                'item_description' => $booking['listing_title']
            ]);
            
            if ($result['status'] === 'success') {
                sendResponse([
                    'success' => true,
                    'payment_link' => $result['data']['link'],
                    'payment_id' => $paymentId,
                    'tx_ref' => $txRef,
                    'message' => 'Redirect to payment page'
                ]);
            } else {
                // Update payment as failed
                $stmt = $pdo->prepare("UPDATE payments SET payment_status = 'failed' WHERE id = ?");
                $stmt->execute([$paymentId]);
                
                sendError($result['message'] ?? 'Failed to initialize payment');
            }
            break;
            
        case 'GET':
            // Verify transaction
            $user = requireAuth();
            
            if (empty($_GET['transaction_id']) && empty($_GET['tx_ref'])) {
                sendError('Transaction ID or reference required');
            }
            
            $flutterwave = new FlutterwaveAPI();
            
            if (!empty($_GET['transaction_id'])) {
                $result = $flutterwave->verifyTransaction($_GET['transaction_id']);
            } else {
                // Get payment by tx_ref
                $stmt = $pdo->prepare("
                    SELECT p.*, b.user_id 
                    FROM payments p
                    JOIN bookings b ON p.booking_id = b.id
                    WHERE p.transaction_code = ?
                ");
                $stmt->execute([$_GET['tx_ref']]);
                $payment = $stmt->fetch();
                
                if (!$payment || $payment['user_id'] !== $user['sub']) {
                    sendError('Payment not found', 404);
                }
                
                // Try to find transaction ID from payment metadata
                $result = ['status' => 'success', 'data' => ['status' => $payment['payment_status']]];
            }
            
            sendResponse([
                'verified' => $result['status'] === 'success',
                'payment_status' => $result['data']['status'] ?? 'unknown',
                'amount' => $result['data']['amount'] ?? null,
                'currency' => $result['data']['currency'] ?? null,
                'transaction_id' => $result['data']['id'] ?? null
            ]);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (Exception $e) {
    error_log("Card payment error: " . $e->getMessage());
    sendError('Server error', 500);
}
?>
