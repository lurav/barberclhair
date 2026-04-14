<?php
header('Content-Type: application/json');

// Get POST data
$date = $_POST['date'] ?? null;
$time = $_POST['heure'] ?? null;
$name = $_POST['nom'] ?? 'Anonyme';
$service = $_POST['service'] ?? 'Non spécifié';

if (!$date || !$time) {
    echo json_encode(['error' => 'Date and time are required']);
    exit;
}

$file = 'reservations.json';
$bookings = [];

if (file_exists($file)) {
    $bookings = json_decode(file_get_contents($file), true) ?? [];
}

// Add new booking
$bookings[] = [
    'date' => $date,
    'time' => $time,
    'name' => $name,
    'service' => $service,
    'timestamp' => time()
];

file_put_contents($file, json_encode($bookings, JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
?>
