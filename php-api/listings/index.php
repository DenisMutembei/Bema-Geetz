<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get single listing or list
            if (isset($_GET['id'])) {
                // Single listing
                $stmt = $pdo->prepare("
                    SELECT l.*, u.name as host_name 
                    FROM listings l 
                    LEFT JOIN users u ON l.host_id = u.id 
                    WHERE l.id = ?
                ");
                $stmt->execute([$_GET['id']]);
                $listing = $stmt->fetch();
                
                if (!$listing) {
                    sendError('Listing not found', 404);
                }
                
                // Convert images from JSON or comma-separated
                $listing['images'] = parseImages($listing['images']);
                $listing['available'] = (bool)$listing['available'];
                $listing['requires_verification'] = (bool)$listing['requires_verification'];
                
                sendResponse($listing);
            } else {
                // List with filters
                $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 12;
                $offset = ($page - 1) * $limit;
                
                $where = ["l.available = 1"];
                $params = [];
                
                if (isset($_GET['type']) && in_array($_GET['type'], ['car', 'house'])) {
                    $where[] = "l.type = ?";
                    $params[] = $_GET['type'];
                }
                
                if (isset($_GET['location']) && $_GET['location']) {
                    $where[] = "l.location LIKE ?";
                    $params[] = '%' . $_GET['location'] . '%';
                }
                
                if (isset($_GET['minPrice']) && is_numeric($_GET['minPrice'])) {
                    $where[] = "l.price >= ?";
                    $params[] = $_GET['minPrice'];
                }
                
                if (isset($_GET['maxPrice']) && is_numeric($_GET['maxPrice'])) {
                    $where[] = "l.price <= ?";
                    $params[] = $_GET['maxPrice'];
                }
                
                if (isset($_GET['search']) && $_GET['search']) {
                    $where[] = "(l.title LIKE ? OR l.description LIKE ? OR l.location LIKE ?)";
                    $search = '%' . $_GET['search'] . '%';
                    $params[] = $search;
                    $params[] = $search;
                    $params[] = $search;
                }
                
                $whereClause = implode(' AND ', $where);
                
                // Count total
                $countStmt = $pdo->prepare("SELECT COUNT(*) FROM listings l WHERE $whereClause");
                $countStmt->execute($params);
                $totalItems = $countStmt->fetchColumn();
                $totalPages = ceil($totalItems / $limit);
                
                // Get listings
                $sql = "SELECT l.*, u.name as host_name 
                        FROM listings l 
                        LEFT JOIN users u ON l.host_id = u.id 
                        WHERE $whereClause 
                        ORDER BY l.created_at DESC 
                        LIMIT ? OFFSET ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array_merge($params, [$limit, $offset]));
                $listings = $stmt->fetchAll();
                
                foreach ($listings as &$listing) {
                    $listing['images'] = parseImages($listing['images']);
                    $listing['available'] = (bool)$listing['available'];
                    $listing['requires_verification'] = (bool)$listing['requires_verification'];
                }
                
                sendResponse([
                    'listings' => $listings,
                    'pagination' => [
                        'currentPage' => $page,
                        'totalPages' => $totalPages,
                        'totalItems' => $totalItems,
                        'limit' => $limit
                    ]
                ]);
            }
            break;
            
        case 'POST':
            // Create listing - require auth
            $user = requireAuth();
            
            $data = getJsonInput();
            
            // Validate required fields
            if (empty($data['title']) || empty($data['type']) || !isset($data['price']) || empty($data['location'])) {
                sendError('Title, type, price, and location are required');
            }
            
            if (!in_array($data['type'], ['car', 'house'])) {
                sendError('Type must be car or house');
            }
            
            $id = bin2hex(random_bytes(16));
            $images = isset($data['images']) ? json_encode($data['images']) : '[]';
            
            $stmt = $pdo->prepare("
                INSERT INTO listings (id, title, type, price, location, description, host_id, 
                    make, model, year, bedrooms, bathrooms, images, available, requires_verification, verification_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            ");
            
            $stmt->execute([
                $id,
                $data['title'],
                $data['type'],
                $data['price'],
                $data['location'],
                isset($data['description']) ? $data['description'] : '',
                $user['sub'],
                isset($data['make']) ? $data['make'] : null,
                isset($data['model']) ? $data['model'] : null,
                isset($data['year']) ? $data['year'] : null,
                isset($data['bedrooms']) ? $data['bedrooms'] : null,
                isset($data['bathrooms']) ? $data['bathrooms'] : null,
                $images,
                isset($data['requiresVerification']) ? (int)$data['requiresVerification'] : 0,
                isset($data['verificationType']) ? $data['verificationType'] : null
            ]);
            
            // Return created listing
            $stmt = $pdo->prepare("SELECT * FROM listings WHERE id = ?");
            $stmt->execute([$id]);
            $listing = $stmt->fetch();
            $listing['images'] = parseImages($listing['images']);
            
            sendResponse($listing, 201);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (PDOException $e) {
    error_log("Listings error: " . $e->getMessage());
    sendError('Server error', 500);
}

function parseImages($images) {
    if (empty($images)) return [];
    if (is_array($images)) return $images;
    
    // Try JSON decode first
    $decoded = json_decode($images, true);
    if ($decoded !== null) return $decoded;
    
    // Fallback to comma-separated
    return array_filter(explode(',', $images));
}
?>
