<?php
require_once __DIR__ . "/../../config/connect.php";
require_once __DIR__ . "/../core/Response.php";

class DashboardController {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getStats() {
        try {
            $today = date('Y-m-d');
            // Lấy số đơn hàng hôm nay
            $queryOrders = "SELECT COUNT(*) as order_count 
                           FROM orders 
                           WHERE DATE(orderDate) = :today AND status = 'paid'";
            $stmtOrders = $this->conn->prepare($queryOrders);
            $stmtOrders->bindParam(':today', $today);
            $stmtOrders->execute();
            $orderCount = $stmtOrders->fetch(PDO::FETCH_ASSOC)['order_count'];

            // Lấy doanh thu hôm nay
            $queryRevenue = "SELECT SUM(totalPrice) as total_revenue 
                            FROM orders 
                            WHERE DATE(orderDate) = :today";
            $stmtRevenue = $this->conn->prepare($queryRevenue);
            $stmtRevenue->bindParam(':today', $today);
            $stmtRevenue->execute();
            $totalRevenue = $stmtRevenue->fetch(PDO::FETCH_ASSOC)['total_revenue'];

            //lấy tổng số món
            $queryMenu = "SELECT COUNT(*) as menu_count 
                         FROM menu";
            $stmtMenu = $this->conn->prepare($queryMenu);
            $stmtMenu->execute();
            $menuCount = $stmtMenu->fetch(PDO::FETCH_ASSOC)['menu_count'];

            // Xử lý trường hợp total_revenue là NULL (không có đơn hàng)
            $totalRevenue = $totalRevenue ?: 0;

            return [
                'success' => true,
                'message' => 'Lấy dữ liệu thống kê thành công',
                'data' => [
                    'order_count' => (int)$orderCount,
                    'total_revenue' => (float)$totalRevenue,
                    'menu_count' => (int)$menuCount
                ]
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Lỗi khi lấy dữ liệu thống kê: ' . $e->getMessage(),
                'data' => [
                    'order_count' => 0,
                    'total_revenue' => 0,
                    'menu_count' => 0
                ]
            ];
        }
    }
}
?>