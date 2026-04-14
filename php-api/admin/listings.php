<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAdmin();

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("
                SELECT l.*, u.name as host_name 
                FROM listings l 
                LEFT JOIN users u ON l.host_id = u.id 
                ORDER BY l.created_at DESC
            ");
            $listings = $stmt->fetchAll();
            
            foreach ($listings as &$listing) {
                $listing['images'] = json_decode($listing['images']) ?: [];
                $listing['available'] = (bool)$listing['available'];
            }
            
            sendResponse($listings);
            break;
            
        case 'DELETE':
            if (empty($_GET['id'])) {
                sendError('Listing ID required');
            }
            
            $stmt = $pdo->prepare("DELETE FROM listings WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            
            sendResponse(['message' => 'Listing deleted']);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
} catch (PDOException $e) {
    sendError('Server error', 500);
}
?>
