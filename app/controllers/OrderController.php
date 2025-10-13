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
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $input_data = array(
            "orderDate" => $_POST['orderDate'] ?? '',
            "status" => 'unpaid',
            "tableID" => $_POST['tableID'] ?? '',
            "items" => json_decode($_POST['items'] ?? '[]', true)
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
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $order_id = isset($_GET['id']) ? $_GET['id'] : '';
        if (empty($order_id)) {
            return array("message" => "ID đơn hàng không hợp lệ.", "success" => false, "status" => 400);
        }

        $input_data = json_decode(file_get_contents("php://input"), true) ?: $_POST;
        
        // Kiểm tra và gán từng trường
        $hasChanges = false;
        
        // Status - trường bắt buộc cho thanh toán
        if (isset($input_data['status'])) {
            $status = strtolower(htmlspecialchars(strip_tags($input_data['status'])));
            $validStatuses = ['paid', 'unpaid'];
            if (!in_array($status, $validStatuses)) {
                return array("message" => "Trạng thái không hợp lệ.", "success" => false, "status" => 400);
            }
            $this->order->status = $status;
            $hasChanges = true;
        }
        
        // Các trường khác (tùy chọn)
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
        
        // XỬ LÝ ITEMS - CHỈ KHI CÓ GỬI ITEMS
        $itemsToUpdate = null;
        if (isset($input_data['items'])) {
            $items = is_string($input_data['items']) ? json_decode($input_data['items'], true) : $input_data['items'];
            if (is_array($items) && !empty($items)) {
                $itemsToUpdate = $items;
                $hasChanges = true;
                
                // Tính totalPrice từ items nếu không có
                if (!isset($input_data['totalPrice'])) {
                    $totalPrice = 0;
                    foreach ($items as $item) {
                        $totalPrice += floatval($item['price']) * intval($item['quantity']);
                    }
                    $this->order->totalPrice = $totalPrice;
                }
            }
        }

        // Phải có ít nhất 1 thay đổi
        if (!$hasChanges) {
            return array("message" => "Không có trường nào để cập nhật.", "success" => false, "status" => 400);
        }

        // Cập nhật thông tin chính
        if ($this->order->update($order_id)) {
            // CHỈ XỬ LÝ ITEMS KHI CÓ itemsToUpdate
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
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
        }

        $order_id = isset($_GET['id']) ? $_GET['id'] : null;

        // Query JOIN với bảng tablefood để lấy tên bàn
        $query = "SELECT o.order_id, o.orderDate, o.totalPrice, o.status, o.tableID, t.name AS tableName
                    FROM orders o
                    LEFT JOIN tablefood t ON o.tableID = t.table_id";
        if ($order_id) {
            $query .= " WHERE o.order_id = :order_id";
        }
        $query .= " ORDER BY o.orderDate DESC";

        $stmt = $this->conn->prepare($query);
        if ($order_id) {
            $stmt->bindParam(":order_id", $order_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array("message" => "Danh sách đơn hàng", "success" => true, "status" => 200, "data" => $orders);
    }

    public function getDetails()
    {
        if ($_SERVER['REQUEST_METHOD'] != "GET") {
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
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
            return array("message" => "Method not allowed.", "success" => false, "status" => 405);
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
