<?php
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    sendError('Method not allowed', 405);
}

$user = requireAuth();
$data = getJsonInput();

if (empty($data['id'])) {
    sendError('Listing ID required');
}

$id = $data['id'];

// Check ownership
$stmt = $pdo->prepare("SELECT host_id FROM listings WHERE id = ?");
$stmt->execute([$id]);
$listing = $stmt->fetch();

if (!$listing) {
    sendError('Listing not found', 404);
}

// Only owner or admin can update
if ($listing['host_id'] !== $user['sub'] && $user['role'] !== 'admin') {
    sendError('Unauthorized', 403);
}

// Build update fields
$updates = [];
$params = [];

$fields = ['title', 'type', 'price', 'location', 'description', 'make', 'model', 'year', 'bedrooms', 'bathrooms', 'available', 'requires_verification', 'verification_type'];

foreach ($fields as $field) {
    if (isset($data[$field])) {
        $updates[] = "$field = ?";
        $params[] = $data[$field];
    }
}

if (isset($data['images'])) {
    $updates[] = "images = ?";
    $params[] = json_encode($data['images']);
}

if (empty($updates)) {
    sendError('No fields to update');
}

$params[] = $id;

$sql = "UPDATE listings SET " . implode(', ', $updates) . " WHERE id = ?";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

sendResponse(['message' => 'Listing updated']);
?>
