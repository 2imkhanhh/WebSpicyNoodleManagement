<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../models/orders.php";

class OrderController
{
    private $conn;
    private $order;

    public function __construct($db)
    {
        $this->conn = $db;
        $this->order = new Order($db);
    }

    public function create()
    {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Phương thức không được phép.", "success" => false, "status" => 405);
        }

        $input_data = array(
            "orderDate" => $_POST['orderDate'] ?? '',
            "status" => 'unpaid',
            "tableID" => $_POST['tableID'] ?? '',
            "items" => json_decode($_POST['items'] ?? '[]', true),
            "account_id" => $_POST['account_id'] ?? null
        );

        if (empty($input_data['orderDate']) || empty($input_data['tableID']) || empty($input_data['items'])) {
            return array("message" => "Các trường không được để trống.", "success" => false, "status" => 400);
        }

        $totalPrice = 0;
        foreach ($input_data['items'] as $item) {
            $totalPrice += $item['price'] * $item['quantity'];
        }

        $this->order->orderDate = $input_data['orderDate'];
        $this->order->totalPrice = $totalPrice;
        $this->order->status = $input_data['status'];
        $this->order->tableID = $input_data['tableID'];
        $this->order->account_id = $input_data['account_id'];

        $order_id = $this->order->create();
        if ($order_id) {
            foreach ($input_data['items'] as $item) {
                $this->order->addDetail($order_id, $item['food_id'], $item['quantity'], $item['price']);
            }
            return array("message" => "Đơn hàng được thêm thành công.", "success" => true, "status" => 201, "order_id" => $order_id);
        }
        return array("message" => "Không thể thêm đơn hàng.", "success" => false, "status" => 400);
    }

    public function update()
    {
        if ($_SERVER['REQUEST_METHOD'] != "POST") {
            return array("message" => "Phương thức không được phép.", "success" => false, "status" => 405);
        }

        $order_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($order_id)) {
            return array("message" => "ID đơn hàng không hợp lệ.", "success" => false, "status" => 400);
        }

        $input_data = json_decode(file_get_contents("php://input"), true) ?: $_POST;
        
        $hasChanges = false;
        
        if (isset($input_data['status'])) {
            $status = strtolower(htmlspecialchars(strip_tags($input_data['status'])));
            $validStatuses = ['paid', 'unpaid'];
            if (!in_array($status, $validStatuses)) {
                return array("message" => "Trạng thái không hợp lệ.", "success" => false, "status" => 400);
            }
            $this->order->status = $status;
            $hasChanges = true;
        }
        
        if (isset($input_data['orderDate']) && !empty($input_data['orderDate'])) {
            $this->order->orderDate = htmlspecialchars(strip_tags($input_data['orderDate']));
            $hasChanges = true;
        }
        
        if (isset($input_data['tableID']) && !empty($input_data['tableID'])) {
            $this->order->tableID = intval($input_data['tableID']);
            $hasChanges = true;
        }
        
        if (isset($input_data['totalPrice'])) {
            $this->order->totalPrice = floatval($input_data['totalPrice']);
            $hasChanges = true;
        }
        
        if (isset($input_data['account_id'])) {
            $this->order->account_id = $input_data['account_id'] ? intval($input_data['account_id']) : null;
            $hasChanges = true;
        }
        
        $itemsToUpdate = null;
        if (isset($input_data['items'])) {
            $items = is_string($input_data['items']) ? json_decode($input_data['items'], true) : $input_data['items'];
            if (is_array($items) && !empty($items)) {
                $itemsToUpdate = $items;
                $hasChanges = true;
                
                if (!isset($input_data['totalPrice'])) {
                    $totalPrice = 0;
                    foreach ($items as $item) {
                        $totalPrice += floatval($item['price']) * intval($item['quantity']);
                    }
                    $this->order->totalPrice = $totalPrice;
                }
            }
        }

        if (!$hasChanges) {
            return array("message" => "Không có trường nào để cập nhật.", "success" => false, "status" => 400);
        }

        if ($this->order->update($order_id)) {
            if ($itemsToUpdate !== null) {
                $this->order->updateDetails($order_id);
                foreach ($itemsToUpdate as $item) {
                    $this->order->addDetail($order_id, $item['food_id'], $item['quantity'], $item['price']);
                }
            }
            return array("message" => "Cập nhật thành công.", "success" => true, "status" => 200);
        }
        
        return array("message" => "Không thể cập nhật.", "success" => false, "status" => 400);
    }

    public function get()
    {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Phương thức không được phép.", "success" => false, "status" => 405);
        }

        $order_id = isset($_GET['id']) ? $_GET['id'] : null;
        $account_id = isset($_GET['account_id']) ? $_GET['account_id'] : null;
        $status = isset($_GET['status']) ? strtolower($_GET['status']) : null;

        if ($order_id) {
            $orders = $this->order->get($order_id);
        } elseif ($account_id) {
            $orders = $this->order->getByAccountId($account_id);
        } else {
            $orders = $this->order->get();
            if ($status) {
                $orders = array_filter($orders, function($order) use ($status) {
                    return $order['status'] === $status;
                });
            }
        }

        // Thêm tableName và phone từ bảng accounts vào dữ liệu trả về
        foreach ($orders as &$order) {
            // Lấy tableName
            $table_query = "SELECT name FROM tablefood WHERE table_id = :table_id";
            $table_stmt = $this->conn->prepare($table_query);
            $table_stmt->bindParam(':table_id', $order['tableID'], PDO::PARAM_INT);
            $table_stmt->execute();
            $table = $table_stmt->fetch(PDO::FETCH_ASSOC);
            $order['tableName'] = $table ? $table['name'] : null;

            // Lấy phone từ bảng accounts
            if ($order['account_id']) {
                $account_query = "SELECT phone FROM accounts WHERE account_id = :account_id";
                $account_stmt = $this->conn->prepare($account_query);
                $account_stmt->bindParam(':account_id', $order['account_id'], PDO::PARAM_INT);
                $account_stmt->execute();
                $account = $account_stmt->fetch(PDO::FETCH_ASSOC);
                $order['phone'] = $account ? $account['phone'] : null;
            } else {
                $order['phone'] = null;
            }
        }

        return array("message" => "Danh sách đơn hàng", "success" => true, "status" => 200, "data" => array_values($orders));
    }

    public function getDetails()
    {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Phương thức không được phép.", "success" => false, "status" => 405);
        }

        $order_id = isset($_GET['order_id']) ? $_GET['order_id'] : '';
        if (empty($order_id)) {
            return array("message" => "ID đơn hàng không hợp lệ.", "success" => false, "status" => 400);
        }

        $details = $this->order->getDetails($order_id);
        return array("message" => "Chi tiết đơn hàng", "success" => true, "status" => 200, "data" => $details);
    }

    public function delete()
    {
        if ($_SERVER['REQUEST_METHOD'] != "DELETE") {
            return array("message" => "Phương thức không được phép.", "success" => false, "status" => 405);
        }

        $order_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($order_id)) {
            return array("message" => "ID đơn hàng không hợp lệ.", "success" => false, "status" => 400);
        }

        if ($this->order->delete($order_id)) {
            return array("message" => "Đơn hàng đã được xóa thành công.", "success" => true, "status" => 200);
        }
        return array("message" => "Không thể xóa đơn hàng.", "success" => false, "status" => 400);
    }
}
?>