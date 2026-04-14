<?php
/**
 * Notification Service - Emails and SMS
 */

require_once __DIR__ . '/../config/database.php';

class NotificationService {
    private $pdo;
    private $settings;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
        
        // Load settings
        $stmt = $this->pdo->query("SELECT setting_key, setting_value FROM settings");
        $this->settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }
    
    /**
     * Send Email using SMTP
     */
    public function sendEmail($to, $toName, $subject, $body, $template = 'default') {
        $smtpHost = $this->settings['smtp_host'] ?? 'smtp.gmail.com';
        $smtpPort = $this->settings['smtp_port'] ?? 587;
        $smtpUser = $this->settings['smtp_username'] ?? '';
        $smtpPass = $this->settings['smtp_password'] ?? '';
        $fromName = $this->settings['smtp_from_name'] ?? 'Bema Geetz';
        $fromEmail = $this->settings['company_email'] ?? 'bookings@bemageetz.com';
        
        if (empty($smtpUser) || empty($smtpPass)) {
            error_log("SMTP not configured");
            return false;
        }
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: $fromName <$fromEmail>" . "\r\n";
        $headers .= "Reply-To: $fromEmail" . "\r\n";
        
        // Use PHPMailer if available, otherwise mail()
        $sent = mail($to, $subject, $body, $headers);
        
        // Log email
        $emailId = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare("
            INSERT INTO email_notifications (id, recipient_email, recipient_name, email_type, subject, template, sent_at, status)
            VALUES (?, ?, ?, 'general', ?, ?, NOW(), ?)
        ");
        $stmt->execute([$emailId, $to, $toName, $subject, $template, $sent ? 'sent' : 'failed']);
        
        return $sent;
    }
    
    /**
     * Send Booking Confirmation Email
     */
    public function sendBookingConfirmation($bookingId) {
        $stmt = $this->pdo->prepare("
            SELECT b.*, l.title as listing_title, l.type as listing_type, l.location
            FROM bookings b
            JOIN listings l ON b.listing_id = l.id
            WHERE b.id = ?
        ");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();
        
        if (!$booking) return false;
        
        $subject = "Booking Confirmation - {$booking['invoice_id']}";
        
        $body = $this->getEmailTemplate('booking_confirmation', [
            'customer_name' => $booking['customer_name'],
            'invoice_id' => $booking['invoice_id'],
            'listing_title' => $booking['listing_title'],
            'listing_type' => $booking['listing_type'],
            'location' => $booking['location'],
            'check_in' => $booking['check_in'],
            'check_out' => $booking['check_out'],
            'amount' => $booking['total_amount'] ?? 'TBD',
            'status' => $booking['status']
        ]);
        
        return $this->sendEmail(
            $booking['email'],
            $booking['customer_name'],
            $subject,
            $body,
            'booking_confirmation'
        );
    }
    
    /**
     * Send Payment Receipt
     */
    public function sendPaymentReceipt($bookingId, $receiptId) {
        $stmt = $this->pdo->prepare("
            SELECT r.*, b.customer_name, b.customer_email, b.invoice_id, p.mpesa_receipt
            FROM receipts r
            JOIN bookings b ON r.booking_id = b.id
            JOIN payments p ON r.payment_id = p.id
            WHERE r.id = ? AND b.id = ?
        ");
        $stmt->execute([$receiptId, $bookingId]);
        $receipt = $stmt->fetch();
        
        if (!$receipt) return false;
        
        $subject = "Payment Receipt - {$receipt['receipt_number']}";
        
        $body = $this->getEmailTemplate('receipt', [
            'customer_name' => $receipt['customer_name'],
            'receipt_number' => $receipt['receipt_number'],
            'invoice_id' => $receipt['invoice_id'],
            'amount' => $receipt['amount'],
            'payment_method' => $receipt['payment_method'],
            'transaction_ref' => $receipt['transaction_reference'],
            'date' => date('F j, Y', strtotime($receipt['created_at']))
        ]);
        
        $sent = $this->sendEmail(
            $receipt['customer_email'],
            $receipt['customer_name'],
            $subject,
            $body,
            'receipt'
        );
        
        if ($sent) {
            $stmt = $this->pdo->prepare("UPDATE receipts SET sent_at = NOW() WHERE id = ?");
            $stmt->execute([$receiptId]);
        }
        
        return $sent;
    }
    
    /**
     * Send Invoice
     */
    public function sendInvoice($invoiceId) {
        $stmt = $this->pdo->prepare("SELECT * FROM invoices WHERE id = ?");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch();
        
        if (!$invoice) return false;
        
        $subject = "Invoice {$invoice['invoice_number']} - Bema Geetz";
        
        $body = $this->getEmailTemplate('invoice', [
            'customer_name' => $invoice['customer_name'],
            'invoice_number' => $invoice['invoice_number'],
            'item_description' => $invoice['item_description'],
            'amount' => $invoice['amount'],
            'tax_amount' => $invoice['tax_amount'],
            'total_amount' => $invoice['total_amount'],
            'due_date' => $invoice['due_date'],
            'company_name' => $this->settings['company_name'] ?? 'Bema Geetz',
            'company_email' => $this->settings['company_email'] ?? ''
        ]);
        
        $sent = $this->sendEmail(
            $invoice['customer_email'],
            $invoice['customer_name'],
            $subject,
            $body,
            'invoice'
        );
        
        if ($sent) {
            $stmt = $this->pdo->prepare("UPDATE invoices SET sent_at = NOW(), status = 'sent' WHERE id = ?");
            $stmt->execute([$invoiceId]);
        }
        
        return $sent;
    }
    
    /**
     * Send SMS using Africa's Talking or other provider
     */
    public function sendSMS($phoneNumber, $message, $type = 'general', $bookingId = null) {
        $apiKey = $this->settings['sms_api_key'] ?? '';
        $username = $this->settings['sms_username'] ?? '';
        
        if (empty($apiKey) || empty($username)) {
            error_log("SMS not configured");
            return false;
        }
        
        // Format phone number
        $phoneNumber = preg_replace('/^\+?0?/', '+254', $phoneNumber);
        
        // Africa's Talking API
        $url = 'https://api.africastalking.com/version1/messaging';
        
        $data = [
            'username' => $username,
            'to' => $phoneNumber,
            'message' => $message,
            'from' => $this->settings['company_name'] ?? 'BemaGeetz'
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'apikey: ' . $apiKey
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $result = json_decode($response, true);
        $sent = isset($result['SMSMessageData']['Recipients'][0]['status']) && 
                $result['SMSMessageData']['Recipients'][0]['status'] === 'Success';
        
        // Log SMS
        $smsId = bin2hex(random_bytes(16));
        $stmt = $this->pdo->prepare("
            INSERT INTO sms_notifications (id, phone_number, message, sms_type, booking_id, sent_at, status, provider_response)
            VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        ");
        $stmt->execute([$smsId, $phoneNumber, $message, $type, $bookingId, $sent ? 'sent' : 'failed', $response]);
        
        return $sent;
    }
    
    /**
     * Notify Admin
     */
    public function notifyAdmin($type, $data) {
        $adminEmail = $this->settings['company_email'] ?? 'admin@bemageetz.com';
        
        switch ($type) {
            case 'new_booking':
                $subject = "New Booking Received";
                $body = "A new booking has been received from {$data['customer']} for {$data['listing']}. Invoice: {$data['invoice']}";
                break;
                
            case 'payment_received':
                $subject = "Payment Received - KES {$data['amount']}";
                $body = "Payment of KES {$data['amount']} received from {$data['customer']}. Receipt: {$data['receipt']}";
                break;
                
            default:
                return false;
        }
        
        return $this->sendEmail($adminEmail, 'Admin', $subject, $body, 'admin_alert');
    }
    
    /**
     * Get HTML Email Template
     */
    private function getEmailTemplate($template, $data) {
        $companyName = $this->settings['company_name'] ?? 'Bema Geetz';
        $companyEmail = $this->settings['company_email'] ?? '';
        $companyPhone = $this->settings['company_phone'] ?? '';
        
        $commonHeader = "
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: #1a1a2e; color: #d4af37; padding: 20px; text-align: center;'>
                    <h1 style='margin: 0;'>$companyName</h1>
                    <p style='margin: 5px 0 0; color: #fff;'>Premium Car Hire & Accommodations</p>
                </div>
                <div style='padding: 20px; background: #f9f9f9;'>
        ";
        
        $commonFooter = "
                </div>
                <div style='background: #1a1a2e; color: #fff; padding: 20px; text-align: center; font-size: 12px;'>
                    <p>Questions? Contact us:<br>
                    Email: $companyEmail<br>
                    Phone: $companyPhone</p>
                    <p>&copy; " . date('Y') . " $companyName. All rights reserved.</p>
                </div>
            </div>
        ";
        
        switch ($template) {
            case 'booking_confirmation':
                $content = "
                    <h2 style='color: #1a1a2e;'>Booking Confirmed!</h2>
                    <p>Dear {$data['customer_name']},</p>
                    <p>Your booking has been confirmed. Here are the details:</p>
                    
                    <table style='width: 100%; background: #fff; border-collapse: collapse;'>
                        <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Invoice ID:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{$data['invoice_id']}</td></tr>
                        <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Item:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>{$data['listing_title']}</td></tr>
                        <tr><td style='padding: 10px; border: 1px solid #ddd;'><strong>Type:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>
