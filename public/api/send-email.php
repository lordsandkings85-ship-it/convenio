<?php
// Suppress any PHP warnings/notices from polluting JSON output
ini_set('display_errors', '0');
error_reporting(0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'ok']);
    exit();
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Invalid JSON input']]);
    exit();
}

// Load API key securely from environment variable or .env file
$resendApiKey = getenv('RESEND_API_KEY') ?: (getenv('VITE_RESEND_API_KEY') ?: ($_ENV['RESEND_API_KEY'] ?? ($_ENV['VITE_RESEND_API_KEY'] ?? '')));

$possibleEnvPaths = [
    __DIR__ . '/../../.env',
    __DIR__ . '/../.env',
    __DIR__ . '/.env',
    dirname(__DIR__, 2) . '/.env',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/../.env'
];

if (!$resendApiKey) {
    foreach ($possibleEnvPaths as $envPath) {
        if ($envPath && file_exists($envPath) && is_readable($envPath)) {
            $envLines = @file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($envLines) {
                foreach ($envLines as $line) {
                    if (strpos(trim($line), '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($key, $val) = explode('=', $line, 2);
                        $key = trim($key);
                        $val = trim($val, " \t\n\r\0\x0B\"'");
                        if ($key === 'RESEND_API_KEY' || $key === 'VITE_RESEND_API_KEY') {
                            $resendApiKey = $val;
                            break 2;
                        }
                    }
                }
            }
        }
    }
}

// Validate that an API key is available
if (!$resendApiKey) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'RESEND_API_KEY is not configured on server or in .env file']]);
    exit();
}

$to = $data['to'] ?? 'conveniomart@lordsandkingsagro.com';
$subject = $data['subject'] ?? 'New AI Chatbot Lead';
$lead = $data['leadData'] ?? [];
$transcript = $data['transcript'] ?? '';

if (!empty($data['html'])) {
    $html = $data['html'];
} else {
    $html = "<h3>New AI Chatbot Lead</h3>"
          . "<p><strong>Name:</strong> " . htmlspecialchars($lead['name'] ?? 'N/A') . "</p>"
          . "<p><strong>Phone:</strong> " . htmlspecialchars($lead['phone'] ?? 'N/A') . "</p>"
          . "<p><strong>Area / Location:</strong> " . htmlspecialchars($lead['area'] ?? ($lead['location'] ?? 'N/A')) . "</p>"
          . "<p><strong>Budget / Investment:</strong> " . htmlspecialchars($lead['budget'] ?? ($lead['investment_capacity'] ?? 'Not Specified')) . "</p>"
          . "<p><strong>Source:</strong> AI Franchise Chatbot</p>"
          . "<hr/>"
          . "<h4>Chat Transcript:</h4>"
          . "<pre style='white-space: pre-wrap; font-family: sans-serif; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;'>" . htmlspecialchars($transcript) . "</pre>";
}

$payload = [
    'from' => 'Convenio Mart AI Bot <info@atyourdoor.life>',
    'to' => is_array($to) ? $to : [$to],
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
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

$response = curl_exec($ch);
$curlErr = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response === false || !empty($curlErr)) {
    http_response_code(502);
    echo json_encode(['error' => ['message' => 'PHP cURL Error: ' . $curlErr]]);
    exit();
}

http_response_code($httpCode ?: 200);
echo $response ?: json_encode(['success' => true]);

