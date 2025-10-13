<?php
header("Content-Type: application/json");

require_once '../config/connect.php';
$database = new Database();
$db = $database->getConnection();

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        "success" => false, 
        "error" => "Invalid JSON: " . json_last_error_msg(),
        "raw_input" => $input ? substr($input, 0, 100) : "EMPTY"
    ]);
    exit;
}

try {
    // Validate required fields
    if (empty($data['name']) || empty($data['phone']) || empty($data['password'])) {
        throw new Exception("Missing required fields");
    }
    
    $stmt = $db->prepare("INSERT INTO accounts (role, name, email, phone, password, status) VALUES (0, ?, ?, ?, ?, 1)");
    $email = empty($data['email']) ? '' : $data['email']; // ✅ Empty string thay vì NULL
    $password = password_hash($data['password'], PASSWORD_BCRYPT);
    
    $result = $stmt->execute([$data['name'], $email, $data['phone'], $password]);
    
    if ($result) {
        $account_id = $db->lastInsertId();
        
        $stmt2 = $db->prepare("INSERT INTO customers (account_id, points, order_id) VALUES (?, 0, NULL)");
        $customer_result = $stmt2->execute([$account_id]);
        
        echo json_encode([
            "success" => true,
            "message" => "Success",
            "account_id" => $account_id,
            "customer_result" => $customer_result
        ]);
    } else {
        echo json_encode(["success" => false, "error" => $db->errorInfo()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>