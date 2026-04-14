<?php
header('Content-Type: application/json');

$date = $_GET['date'] ?? null;
if (!$date) {
    echo json_encode([]);
    exit;
}

$file = 'reservations.json';
$busy_slots = [];

if (file_exists($file)) {
    $bookings = json_decode(file_get_contents($file), true) ?? [];
    foreach ($bookings as $booking) {
        if ($booking['date'] === $date) {
            $busy_slots[] = $booking['time'];
        }
    }
}

echo json_encode($busy_slots);
?>
