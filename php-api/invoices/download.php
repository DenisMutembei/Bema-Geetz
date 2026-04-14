<?php
/**
 * Invoice Download Endpoint
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/invoice-generator.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = requireAuth();

$invoiceNumber = isset($_GET['id']) ? $_GET['id'] : null;

if (!$invoiceNumber) {
    sendError('Invoice ID required');
}

// Get invoice by number
$stmt = $pdo->prepare("
    SELECT i.*, b.user_id as booking_user_id
    FROM invoices i
    JOIN bookings b ON i.booking_id = b.id
    WHERE i.invoice_number = ? OR b.invoice_id = ?
");
$stmt->execute([$invoiceNumber, $invoiceNumber]);
$invoice = $stmt->fetch();

if (!$invoice) {
    sendError('Invoice not found', 404);
}

// Check authorization (owner or admin)
if ($invoice['booking_user_id'] !== $user['sub'] && $user['role'] !== 'admin') {
    sendError('Unauthorized', 403);
}

// Generate and output invoice
$generator = new InvoiceGenerator();
$generator->downloadInvoice($invoice['id']);
?>
