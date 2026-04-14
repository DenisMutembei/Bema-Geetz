<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all active services (public)
            $stmt = $pdo->query("SELECT * FROM airport_services WHERE is_active = 1 ORDER BY price ASC");
            $services = $stmt->fetchAll();
            sendResponse($services);
            break;
            
        case 'POST':
            // Create new service (admin only)
            $user = requireAuth();
            if ($user['role'] !== 'admin') {
                sendError('Admin access required', 403);
            }
            
            $data = getJsonInput();
            
            if (empty($data['name']) || !isset($data['price']) || empty($data['vehicle_type'])) {
                sendError('Name, price, and vehicle type are required');
            }
            
            $id = bin2hex(random_bytes(16));
            
            $stmt = $pdo->prepare("
                INSERT INTO airport_services (id, name, description, vehicle_type, price, 
                    max_passengers, max_luggage, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ");
            
            $stmt->execute([
                $id,
                $data['name'],
                isset($data['description']) ? $data['description'] : '',
                $data['vehicle_type'],
                $data['price'],
                isset($data['max_passengers']) ? $data['max_passengers'] : 4,
                isset($data['max_luggage']) ? $data['max_luggage'] : 2
            ]);
            
            // Return created service
            $stmt = $pdo->prepare("SELECT * FROM airport_services WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse($stmt->fetch(), 201);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (PDOException $e) {
    error_log("Airport services error: " . $e->getMessage());
    sendError('Server error', 500);
}
?>
