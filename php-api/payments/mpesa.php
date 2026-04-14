<?php
/**
 * M-Pesa Integration - STK Push for Bema Geetz
 * Supports both Safaricom Daraja API (Sandbox and Production)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class MpesaAPI {
    private $consumerKey;
    private $consumerSecret;
    private $passkey;
    private $shortcode;
    private $environment;
    private $accessToken;
    
    public function __construct() {
        global $pdo;
        
        // Get settings from database
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_group = 'payment'");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $this->consumerKey = $settings['mpesa_consumer_key'] ?? '';
        $this->consumerSecret = $settings['mpesa_consumer_secret'] ?? '';
        $this->passkey = $settings['mpesa_passkey'] ?? 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
        $this->shortcode = $settings['mpesa_shortcode'] ?? '174379';
        $this->environment = $settings['mpesa_environment'] ?? 'sandbox';
    }
    
    private function getBaseUrl() {
        return $this->environment === 'production' 
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }
    
    private function getAccessToken() {
        $url = $this->getBaseUrl() . '/oauth/v1/generate?grant_type=client_credentials';
        
        $credentials = base64_encode($this->consumerKey . ':' . $this->consumerSecret);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . $credentials]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        return $result['access_token'] ?? null;
    }
    
    public function stkPush($phone, $amount, $accountReference, $transactionDesc) {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['error' => 'Failed to get access token'];
        }
        
        $timestamp = date('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);
        
        $url = $this->getBaseUrl() . '/mpesa/stkpush/v1/processrequest';
        
        // Format phone number (remove + or 0 prefix, add 254)
        $phone = preg_replace('/^\+?0?/', '254', $phone);
        
        $callbackUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/api/payments/mpesa-callback';
        
        $data = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => $amount,
            'PartyA' => $phone,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $phone,
            'CallBackURL' => $callbackUrl,
            'AccountReference' => $accountReference,
            'TransactionDesc' => $transactionDesc
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && isset($result['ResponseCode']) && $result['ResponseCode'] === '0') {
            return [
                'success' => true,
                'merchant_request_id' => $result['MerchantRequestID'],
                'checkout_request_id' => $result['CheckoutRequestID'],
                'customer_message' => $result['CustomerMessage'] ?? 'Enter M-Pesa PIN on your phone'
            ];
        }
        
        return [
            'success' => false,
            'error' => $result['errorMessage'] ?? $result['ResponseDescription'] ?? 'STK Push failed'
        ];
    }
    
    public function queryStatus($checkoutRequestId) {
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            return ['error' => 'Failed to get access token'];
        }
        
        $timestamp = date('YmdHis');
        $password = base64_encode($this->shortcode . $this->passkey . $timestamp);
        
        $url = $this->getBaseUrl() . '/mpesa/stkpushquery/v1/query';
        
        $data = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'CheckoutRequestID' => $checkoutRequestId
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}

// API Endpoints
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        // Initiate payment
        $user = requireAuth();
        $data = getJsonInput();
        
        if (empty($data['booking_id']) || empty($data['phone']) || empty($data['amount'])) {
            sendError('Booking ID, phone number, and amount are required');
        }
        
        $bookingId = $data['booking_id'];
        $phone = $data['phone'];
        $amount = floatval($data['amount']);
        
        // Validate booking exists
        $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?");
        $stmt->execute([$bookingId, $user['sub']]);
        $booking = $stmt->fetch();
        
        if (!$booking) {
            sendError('Booking not found', 404);
        }
        
        // Create payment record
        $paymentId = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("
            INSERT INTO payments (id, booking_id, amount, currency, payment_method, 
                payment_status, mpesa_phone, created_at)
            VALUES (?, ?, ?, 'KES', 'mpesa', 'pending', ?, NOW())
        ");
        $stmt->execute([$paymentId, $bookingId, $amount, $phone]);
        
        // Initiate M-Pesa STK Push
        $mpesa = new MpesaAPI();
        $result = $mpesa->stkPush(
            $phone,
            ceil($amount), // M-Pesa needs whole numbers
            $booking['invoice_id'] ?? 'BG' . substr($paymentId, 0, 8),
            'Bema Geetz Booking Payment'
        );
        
        if ($result['success']) {
            // Update payment with M-Pesa request IDs
            $stmt = $pdo->prepare("
                UPDATE payments 
                SET mpesa_merchant_request_id = ?,
                    mpesa_checkout_request_id = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $result['merchant_request_id'],
                $result['checkout_request_id'],
                $paymentId
            ]);
            
            sendResponse([
                'success' => true,
                'payment_id' => $paymentId,
                'message' => $result['customer_message'],
                'checkout_request_id' => $result['checkout_request_id']
            ]);
        } else {
            // Update payment as failed
            $stmt = $pdo->prepare("UPDATE payments SET payment_status = 'failed' WHERE id = ?");
            $stmt->execute([$paymentId]);
            
            sendError($result['error'] ?? 'Payment initiation failed');
        }
        break;
        
    case 'GET':
        // Check payment status
        $user = requireAuth();
        
        if (empty($_GET['checkout_request_id'])) {
            sendError('Checkout request ID required');
        }
        
        $checkoutRequestId = $_GET['checkout_request_id'];
        
        // Get payment from database
        $stmt = $pdo->prepare("
            SELECT p.*, b.user_id 
            FROM payments p
            JOIN bookings b ON p.booking_id = b.id
            WHERE p.mpesa_checkout_request_id = ?
        ");
        $stmt->execute([$checkoutRequestId]);
        $payment = $stmt->fetch();
        
        if (!$payment || $payment['user_id'] !== $user['sub']) {
            sendError('Payment not found', 404);
        }
        
        // Query M-Pesa for status
        $mpesa = new MpesaAPI();
        $status = $mpesa->queryStatus($checkoutRequestId);
        
        sendResponse([
            'payment_status' => $payment['payment_status'],
            'mpesa_status' => $status
        ]);
        break;
        
    default:
        sendError('Method not allowed', 405);
}
?>
