<?php
require_once __DIR__ . '/../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$user = requireAuth();

// Create uploads directory if not exists
$uploadDir = __DIR__ . '/../../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$urls = [];
$allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
$maxFileSize = 10 * 1024 * 1024; // 10MB

if (isset($_FILES['files'])) {
    $files = $_FILES['files'];
    
    // Handle multiple files
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;
    
    for ($i = 0; $i < $fileCount; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $type = is_array($files['type']) ? $files['type'][$i] : $files['type'];
        $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        
        if ($error !== UPLOAD_ERR_OK) {
            continue;
        }
        
        if ($size > $maxFileSize) {
            continue;
        }
        
        // Validate file type
        $allowedTypes = array_merge($allowedImageTypes, $allowedVideoTypes);
        if (!in_array($type, $allowedTypes)) {
            continue;
        }
        
        // Generate unique filename
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $newName = uniqid() . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $targetPath = $uploadDir . $newName;
        
        if (move_uploaded_file($tmpName, $targetPath)) {
            $urls[] = '/uploads/' . $newName;
        }
    }
}

if (empty($urls)) {
    sendError('No files uploaded successfully');
}

sendResponse(['urls' => $urls]);
?>
