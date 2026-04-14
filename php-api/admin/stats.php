<?php
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$user = requireAdmin();

try {
    $stats = [];
    
    // Total users
    $stmt = $pdo->query("SELECT COUNT(*) FROM users");
    $stats['totalUsers'] = $stmt->fetchColumn();
    
    // Total listings
    $stmt = $pdo->query("SELECT COUNT(*) FROM listings");
    $stats['totalListings'] = $stmt->fetchColumn();
    
    // Total bookings
    $stmt = $pdo->query("SELECT COUNT(*) FROM bookings");
    $stats['totalBookings'] = $stmt->fetchColumn();
    
    // Recent bookings
    $stmt = $pdo->query("
        SELECT b.*, l.title as listing_title, l.price as listing_price
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        ORDER BY b.created_at DESC
        LIMIT 5
    ");
    $stats['recentBookings'] = $stmt->fetchAll();
    
    sendResponse($stats);
    
} catch (PDOException $e) {
    sendError('Server error', 500);
}
?>
