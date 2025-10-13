<?php
header("Content-Type: text/plain");
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

echo "=== DETAILED DEBUG ===\n\n";

try {
    require_once '../config/connect.php';
    $database = new Database();
    $db = $database->getConnection();
    
    require_once '../app/models/account.php';
    $account = new Account($db);
    
    // Test 1: Set data
    $account->name = "Debug Test User";
    $account->email = "debug@test.com";
    $account->phone = "0987654321";
    $account->password = "123456";
    
    echo "✓ Data set: " . $account->name . "\n";
    
    // Test 2: Check exists method
    $exists = $account->exists("debug@test.com", "0987654321");
    echo "Account exists check: " . ($exists ? "EXISTS" : "NOT EXISTS") . "\n";
    
    // Test 3: Manual INSERT account
    echo "\n--- MANUAL ACCOUNT INSERT ---\n";
    $query = "INSERT INTO accounts (role, name, email, phone, password, status) 
              VALUES (0, 'Manual Test', 'manual@test.com', '0123456780', '" . password_hash('test', PASSWORD_BCRYPT) . "', 1)";
    
    $result = $db->exec($query);
    if ($result === false) {
        $error = $db->errorInfo();
        throw new Exception("Manual insert failed: " . json_encode($error));
    }
    $manual_id = $db->lastInsertId();
    echo "Manual account insert: SUCCESS, ID = $manual_id\n";
    
    // Test 4: Test registerWithCustomer step by step
    echo "\n--- registerWithCustomer STEPS ---\n";
    $account->name = "Step Test";
    $account->email = null;
    $account->phone = "0123456782";
    $account->password = "step123";
    
    // Bắt đầu transaction
    $db->beginTransaction();
    echo "Step 1: Transaction started\n";
    
    // Prepare account insert
    $account_query = "INSERT INTO accounts (role, name, email, phone, password, status) 
                      VALUES (0, ?, ?, ?, ?, 1)";
    $account_stmt = $db->prepare($account_query);
    if (!$account_stmt) {
        throw new Exception("Account prepare failed");
    }
    echo "Step 2: Account prepare OK\n";
    
    // Execute account insert
    $name = htmlspecialchars("Step Test User");
    $email = null;
    $phone = "0123456782";
    $password = password_hash("step123", PASSWORD_BCRYPT);
    
    $account_result = $account_stmt->execute([$name, $email, $phone, $password]);
    if (!$account_result) {
        $error = $account_stmt->errorInfo();
        throw new Exception("Account execute failed: " . json_encode($error));
    }
    $step_id = $db->lastInsertId();
    echo "Step 3: Account insert OK, ID = $step_id\n";
    
    // Test customer insert
    echo "\n--- CUSTOMER INSERT TEST ---\n";
    require_once '../app/models/customer.php';
    $customer = new Customer($db);
    
    $customer_result = $customer->createFromAccount($step_id);
    if (!$customer_result) {
        $error = $db->errorInfo();
        throw new Exception("Customer insert failed: " . json_encode($error));
    }
    echo "Step 4: Customer insert OK\n";
    
    // Commit
    $db->commit();
    echo "Step 5: Transaction committed\n";
    echo "\n✓ ALL TESTS PASSED!\n";
    
} catch (Exception $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    if ($db && $db->inTransaction()) {
        $db->rollBack();
        echo "Transaction rolled back\n";
    }
}

// Manual cleanup
try {
    $db->exec("DELETE FROM accounts WHERE phone IN ('0123456780', '0123456782')");
    $db->exec("DELETE FROM customers WHERE account_id NOT IN (SELECT account_id FROM accounts)");
    echo "\nCleanup completed\n";
} catch (Exception $e) {
    echo "Cleanup error: " . $e->getMessage() . "\n";
}
?>