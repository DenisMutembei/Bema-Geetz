<?php
require_once __DIR__ . '/../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $user = requireAuth();
            
            // Get user's airport bookings
            $stmt = $pdo->prepare("
                SELECT ab.*, aps.name as service_name, aps.vehicle_type
                FROM airport_bookings ab
                JOIN airport_services aps ON ab.service_id = aps.id
                WHERE ab.user_id = ?
                ORDER BY ab.booking_date DESC, ab.booking_time DESC
            ");
            $stmt->execute([$user['sub']]);
            sendResponse($stmt->fetchAll());
            break;
            
        case 'POST':
            $user = requireAuth();
            $data = getJsonInput();
            
            if (empty($data['serviceId']) || empty($data['airportName'])) {
                sendError('Service ID and airport name are required');
            }
            
            // Check service exists
            $stmt = $pdo->prepare("SELECT * FROM airport_services WHERE id = ? AND is_active = 1");
            $stmt->execute([$data['serviceId']]);
            $service = $stmt->fetch();
            
            if (!$service) {
                sendError('Service not found', 404);
            }
            
            // Validate passenger and luggage limits
            $passengers = isset($data['passengerCount']) ? intval($data['passengerCount']) : 1;
            $luggage = isset($data['luggageCount']) ? intval($data['luggageCount']) : 0;
            
            if ($passengers > $service['max_passengers']) {
                sendError("Maximum {$service['max_passengers']} passengers allowed");
            }
            
            if ($luggage > $service['max_luggage']) {
                sendError("Maximum {$service['max_luggage']} luggage items allowed");
            }
            
            $id = bin2hex(random_bytes(16));
            
            $stmt = $pdo->prepare("
                INSERT INTO airport_bookings (id, user_id, service_id, flight_number, airport_name,
                    pickup_address, dropoff_address, booking_date, booking_time, passenger_count,
                    luggage_count, special_requests, total_price, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
            ");
            
            $stmt->execute([
                $id,
                $user['sub'],
                $data['serviceId'],
                isset($data['flightNumber']) ? $data['flightNumber'] : null,
                $data['airportName'],
                isset($data['pickupAddress']) ? $data['pickupAddress'] : null,
                isset($data['dropoffAddress']) ? $data['dropoffAddress'] : null,
                isset($data['bookingDate']) ? $data['bookingDate'] : null,
                isset($data['bookingTime']) ? $data['bookingTime'] : null,
                $passengers,
                $luggage,
                isset($data['specialRequests']) ? $data['specialRequests'] : null,
                $service['price']
            ]);
            
            sendResponse([
                'message' => 'Airport transfer booked successfully',
                'booking' => ['id' => $id, 'status' => 'pending']
            ], 201);
            break;
            
        default:
            sendError('Method not allowed', 405);
    }
    
} catch (PDOException $e) {
    error_log("Airport booking error: " . $e->getMessage());
    sendError('Server error', 500);
}
?>
