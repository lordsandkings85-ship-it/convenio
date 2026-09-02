<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['error' => 'Invalid JSON input']);
    exit();
}

// Load API key securely from environment variable or .env file
$resendApiKey = getenv('RESEND_API_KEY') ?: (getenv('VITE_RESEND_API_KEY') ?: ($_ENV['RESEND_API_KEY'] ?? ($_ENV['VITE_RESEND_API_KEY'] ?? '')));

if (!$resendApiKey && file_exists(__DIR__ . '/../../.env')) {
    $envLines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            if (trim($key) === 'RESEND_API_KEY' || trim($key) === 'VITE_RESEND_API_KEY') {
                $resendApiKey = trim($val);
                break;
            }
        }
    }
}

$to = $data['to'] ?? 'conveniomart@lordsandkingsagro.com';
$subject = $data['subject'] ?? 'New AI Chatbot Lead';
$lead = $data['leadData'] ?? [];
$transcript = $data['transcript'] ?? '';

$html = "<h3>New AI Chatbot Lead</h3>"
      . "<p><strong>Name:</strong> " . htmlspecialchars($lead['name'] ?? 'N/A') . "</p>"
      . "<p><strong>Phone:</strong> " . htmlspecialchars($lead['phone'] ?? 'N/A') . "</p>"
      . "<p><strong>Area:</strong> " . htmlspecialchars($lead['area'] ?? 'N/A') . "</p>"
      . "<p><strong>Budget:</strong> " . htmlspecialchars($lead['budget'] ?? 'N/A') . "</p>"
      . "<hr/>"
      . "<h4>Chat Transcript:</h4>"
      . "<pre style='white-space: pre-wrap; font-family: sans-serif;'>" . htmlspecialchars($transcript) . "</pre>";

$payload = [
    'from' => 'Convenio Mart AI Bot <info@atyourdoor.life>',
    'to' => [$to],
    'subject' => $subject,
    'html' => $html
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $resendApiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode ?: 200);
echo $response ?: json_encode(['success' => true]);
