document.addEventListener('DOMContentLoaded', () => {
    loadInvoices();
});

async function loadInvoices() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_orders.php?status=paid', {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success) {
            const invoiceTableBody = document.getElementById('invoiceTableBody');
            invoiceTableBody.innerHTML = '';

            data.data.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${order.orderDate}</td>
                    <td>${parseFloat(order.totalPrice).toLocaleString('vi-VN')} VNĐ</td>
                    <td><span class="badge bg-success">Đã thanh toán</span></td>
                    <td>${order.tableName || 'Bàn ' + order.tableID}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewInvoice('${order.order_id}')">Xem</button>
                    </td>
                `;
                invoiceTableBody.appendChild(row);
            });
        } else {
            alert('Lỗi tải danh sách hóa đơn: ' + (data.message || 'Không có dữ liệu'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function viewInvoice(orderId) {
    try {
        // Lấy thông tin đơn hàng
        const orderResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_orders.php?id=${orderId}`, {
            method: 'GET'
        });
        const orderData = await orderResponse.json();

        if (orderData.success && orderData.data.length > 0) {
            const order = orderData.data[0];
            document.getElementById('viewOrderId').textContent = order.order_id;
            document.getElementById('viewOrderDate').textContent = order.orderDate;
            document.getElementById('viewTableName').textContent = order.tableName || 'Bàn ' + order.tableID;
            document.getElementById('viewCustomerPhone').textContent = order.phone || 'Không có';
            document.getElementById('viewTotalPrice').textContent = parseFloat(order.totalPrice).toLocaleString('vi-VN');

            // Lấy chi tiết đơn hàng
            const detailsResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_order_details.php?order_id=${orderId}`, {
                method: 'GET'
            });
            const detailsData = await detailsResponse.json();

            const itemsTableBody = document.querySelector('#viewOrderItemsTable tbody');
            itemsTableBody.innerHTML = '';

            if (detailsData.success) {
                detailsData.data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.name}</td>
                        <td>${parseFloat(item.price).toLocaleString('vi-VN')} VNĐ</td>
                        <td>${item.quantity}</td>
                        <td>${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
                    `;
                    itemsTableBody.appendChild(row);
                });
            } else {
                itemsTableBody.innerHTML = '<tr><td colspan="4">Không có chi tiết món ăn.</td></tr>';
            }

            // Mở modal
            const modal = new bootstrap.Modal(document.getElementById('viewInvoiceModal'));
            modal.show();
        } else {
            alert('Lỗi tải thông tin hóa đơn: ' + (orderData.message || 'Không tìm thấy hóa đơn'));
        }
    } catch (error) {
        console.error('Lỗi viewInvoice:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}