<?php
/**
 * PDF Invoice Generator
 * Creates professional invoices as PDF files
 */

require_once __DIR__ . '/../config/database.php';

class InvoiceGenerator {
    private $pdo;
    private $settings;
    
    public function __construct() {
        global $pdo;
        $this->pdo = $pdo;
        
        $stmt = $this->pdo->query("SELECT setting_key, setting_value FROM settings");
        $this->settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }
    
    /**
     * Generate Invoice HTML (can be converted to PDF using libraries like mPDF or TCPDF)
     */
    public function generateInvoiceHTML($invoiceId) {
        $stmt = $this->pdo->prepare("
            SELECT i.*, b.check_in, b.check_out, l.title as listing_title, l.location, l.type
            FROM invoices i
            JOIN bookings b ON i.booking_id = b.id
            JOIN listings l ON b.listing_id = l.id
            WHERE i.id = ?
        ");
        $stmt->execute([$invoiceId]);
        $invoice = $stmt->fetch();
        
        if (!$invoice) return false;
        
        $companyName = $this->settings['company_name'] ?? 'Bema Geetz Limited';
        $companyEmail = $this->settings['company_email'] ?? '';
        $companyPhone = $this->settings['company_phone'] ?? '';
        $companyAddress = $this->settings['company_address'] ?? 'Nairobi, Kenya';
        $kraPin = $this->settings['company_kra_pin'] ?? '';
        
        $html = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Invoice {$invoice['invoice_number']}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { background: #1a1a2e; color: #d4af37; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; }
        .invoice-details { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items th { background: #1a1a2e; color: #d4af37; padding: 12px; text-align: left; }
        .items td { padding: 12px; border-bottom: 1px solid #ddd; }
        .total { background: #f9f9f9; padding: 20px; text-align: right; font-size: 18px; }
        .total-amount { color: #d4af37; font-size: 24px; font-weight: bold; }
        .footer { margin-top: 40px; padding: 20px; background: #f9f9f9; font-size: 12px; text-align: center; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
        .status-paid { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-overdue { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class='header'>
        <h1>$companyName</h1>
        <p style='color: #fff; margin: 10px 0 0;'>Premium Car Hire & Accommodations</p>
    </div>
    
    <div style='text-align: right; margin: 20px 0;'>
        <h2 style='margin: 0; color: #1a1a2e;'>INVOICE</h2>
        <p style='margin: 5px 0; font-size: 18px; color: #d4af37;'>#{$invoice['invoice_number']}</p>
        <span class='status status-" . ($invoice['status'] === 'paid' ? 'paid' : ($invoice['status'] === 'overdue' ? 'overdue' : 'pending')) . "'>
            " . strtoupper($invoice['status']) . "
        </span>
    </div>
    
    <div class='invoice-details'>
        <div class='row'>
            <div>
                <p class='label'>Billed To:</p>
                <p class='value' style='font-size: 16px; font-weight: bold;'>{$invoice['customer_name']}</p>
                <p class='value'>{$invoice['customer_email']}</p>
                <p class='value'>{$invoice['customer_phone']}</p>
            </div>
            <div style='text-align: right;'>
                <p class='label'>Invoice Date:</p>
                <p class='value'>" . date('F j, Y', strtotime($invoice['created_at'])) . "</p>
                <p class='label' style='margin-top: 10px;'>Due Date:</p>
                <p class='value'>" . date('F j, Y', strtotime($invoice['due_date'])) . "</p>
            </div>
        </div>
    </div>
    
    <table class='items'>
        <thead>
            <tr>
                <th>Description</th>
                <th>Details</th>
                <th style='text-align: right;'>Amount (KES)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <strong>{$invoice['listing_title']}</strong><br>
                    <small style='color: #666;'>{$invoice['type']} in {$invoice['location']}</small>
                </td>
                <td>
                    Check-in: " . ($invoice['check_in'] ? date('M j, Y', strtotime($invoice['check_in'])) : 'N/A') . "<br>
                    Check-out: " . ($invoice['check_out'] ? date('M j, Y', strtotime($invoice['check_out'])) : 'N/A') . "
                </td>
                <td style='text-align: right;'>" . number_format($invoice['amount'], 2) . "</td>
            </tr>
        </tbody>
    </table>
    
    <div class='total'>
        <div class='row'>
            <span>Subtotal:</span>
            <span>KES " . number_format($invoice['amount'], 2) . "</span>
        </div>
        <div class='row'>
            <span>Tax ({$this->settings['tax_rate'] ?? 0}%):</span>
            <span>KES " . number_format($invoice['tax_amount'], 2) . "</span>
        </div>
        <div class='row' style='margin-top: 10px; padding-top: 10px; border-top: 2px solid #d4af37;'>
            <span class='total-amount'>TOTAL:</span>
            <span class='total-amount'>KES " . number_format($invoice['total_amount'], 2) . "</span>
        </div>
    </div>
    
    <div style='margin: 30px 0; padding: 20px; background: #fff3cd; border-left: 4px solid #d4af37;'>
        <h3 style='margin-top: 0; color: #856404;'>Payment Instructions</h3>
        <p><strong>M-Pesa (Paybill):</strong></p>
        <p>Business Number: <strong>{$this->settings['mpesa_shortcode'] ?? 'XXXXXX'}</strong></p>
        <p>Account Number: <strong>{$invoice['invoice_number']}</strong></p>
        <p>Amount: <strong>KES " . number_format($invoice['total_amount'], 2) . "</strong></p>
    </div>
    
    <div class='footer'>
        <p><strong>$companyName</strong></p>
        <p>$companyAddress | Email: $companyEmail | Phone: $companyPhone</p>
        <p style='margin-top: 10px;'>KRA PIN: $kraPin</p>
        <p style='margin-top: 20px; color: #666;'>Thank you for choosing Bema Geetz!</p>
    </div>
</body>
</html>
        ";
        
        return $html;
    }
    
    /**
     * Save invoice HTML to file (for PDF conversion later)
     */
    public function saveInvoice($bookingId) {
        // Get booking details
        $stmt = $this->pdo->prepare("
            SELECT b.*, l.title as listing_title, l.type, l.location, l.price
            FROM bookings b
            JOIN listings l ON b.listing_id = l.id
            WHERE b.id = ?
        ");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();
        
        if (!$booking) return false;
        
        // Calculate amounts
        $amount = $booking['price'];
        $taxRate = floatval($this->settings['tax_rate'] ?? 0);
        $taxAmount = $amount * ($taxRate / 100);
        $totalAmount = $amount + $taxAmount;
        
        // Generate invoice number
        $invoiceNumber = 'INV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
        $invoiceId = bin2hex(random_bytes(16));
        
        // Due date (7 days from now)
        $dueDate = date('Y-m-d', strtotime('+7 days'));
        
        // Insert invoice
        $stmt = $this->pdo->prepare("
            INSERT INTO invoices (id, invoice_number, booking_id, user_id, customer_name, 
                customer_email, customer_phone, item_description, amount, tax_amount, 
                total_amount, due_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())
        ");
        
        $stmt->execute([
            $invoiceId,
            $invoiceNumber,
            $bookingId,
            $booking['user_id'],
            $booking['customer_name'],
            $booking['email'],
            $booking['phone'],
            $booking['listing_title'] . ' (' . $booking['type'] . ')',
            $amount,
            $taxAmount,
            $totalAmount,
            $dueDate
        ]);
        
        return [
            'invoice_id' => $invoiceId,
            'invoice_number' => $invoiceNumber,
            'amount' => $totalAmount
        ];
    }
    
    /**
     * Generate PDF from HTML (requires mPDF or TCPDF library)
     * For now, returns HTML that can be printed to PDF by browser
     */
    public function downloadInvoice($invoiceId) {
        $html = $this->generateInvoiceHTML($invoiceId);
        
        if (!$html) {
            http_response_code(404);
            echo "Invoice not found";
            return;
        }
        
        // For now, output as printable HTML
        // In production, use mPDF: $mpdf->WriteHTML($html); $mpdf->Output();
        
        header('Content-Type: text/html');
        echo $html;
        echo "<script>window.print();</script>";
    }
}
?>
