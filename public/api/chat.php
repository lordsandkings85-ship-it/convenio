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
if (empty($input)) {
    http_response_code(400);
    echo json_encode(['error' => ['message' => 'Empty request body']]);
    exit();
}

// Load API key securely from environment variable or .env file
$groqApiKey = getenv('GROQ_API_KEY') ?: (getenv('VITE_GROQ_API_KEY') ?: ($_ENV['GROQ_API_KEY'] ?? ($_ENV['VITE_GROQ_API_KEY'] ?? '')));

$possibleEnvPaths = [
    __DIR__ . '/../../.env',
    __DIR__ . '/../.env',
    __DIR__ . '/.env',
    dirname(__DIR__, 2) . '/.env',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/.env',
    ($_SERVER['DOCUMENT_ROOT'] ?? '') . '/../.env'
];

if (!$groqApiKey) {
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
                        if ($key === 'GROQ_API_KEY' || $key === 'VITE_GROQ_API_KEY') {
                            $groqApiKey = $val;
                            break 2;
                        }
                    }
                }
            }
        }
    }
}

// Validate that an API key is available
if (!$groqApiKey) {
    http_response_code(500);
    echo json_encode(['error' => ['message' => 'GROQ_API_KEY is not configured on server or in .env file']]);
    exit();
}

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $groqApiKey
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
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
echo $response;

