document.addEventListener('DOMContentLoaded', () => {
    const saveTableBtn = document.querySelector('#addTableModal .btn-primary');
    if (saveTableBtn) {
        saveTableBtn.addEventListener('click', addTable);
    }
    loadTables();
    document.getElementById('confirmPaymentBtn').addEventListener('click', confirmPayment);
});

async function loadTables() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_table.php', {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success) {
            const tableList = document.getElementById('tableList');
            tableList.innerHTML = '';

            data.data.forEach(table => {
                let badgeClass = 'success';
                let badgeText = table.status;
                
                if (table.status === 'Trống') {
                    badgeClass = 'success';
                } else if (table.status === 'Có khách') {
                    badgeClass = 'warning';
                } else if (table.status === 'Bàn khách đặt') {
                    badgeClass = 'info'; 
                }
                
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${table.name}</td>
                    <td>${table.quantity} người</td>
                    <td><span class="badge bg-${badgeClass}">${badgeText}</span></td>
                    <td>
                        ${table.status === 'Có khách' ? 
                            `<button class="btn btn-sm btn-success" onclick="openPaymentModal('${table.table_id}')">Thanh toán</button>` : 
                            ''
                        }
                        <button class="btn btn-sm btn-warning" onclick="editTable('${table.table_id}')">Sửa</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTable('${table.table_id}')">Xóa</button>
                    </td>
                `;
                tableList.appendChild(newRow);
            });
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function addTable() {
    const form = document.getElementById('addTableModal').querySelector('form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const tableNumber = document.getElementById('tableNumber').value;
    const tableCapacity = document.getElementById('tableCapacity').value;
    const tableStatus = "Trống"; // Mặc định là "Trống"

    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/add_table.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: tableNumber,
                quantity: tableCapacity,
                status: tableStatus
            })
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            bootstrap.Modal.getInstance(document.getElementById('addTableModal')).hide();
            form.reset();
            loadTables();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function editTable(tableId) {
    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_table.php?id=${tableId}`, {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const table = data.data[0];
            document.getElementById('editTableId').value = table.table_id;
            document.getElementById('editTableNumber').value = table.name;
            document.getElementById('editTableCapacity').value = table.quantity;
            
            const statusSelect = document.getElementById('editTableStatus');
            statusSelect.value = table.status;

            // Sửa lỗi: Định nghĩa statusDiv trước
            const statusDiv = statusSelect.parentElement;

            // Disable trạng thái nếu bàn đang "Có khách"
            if (table.status === 'Có khách') {
                statusSelect.disabled = true;
                // Thêm thông báo
                let warning = statusDiv.querySelector('.status-warning');
                if (!warning) {
                    warning = document.createElement('div');
                    warning.className = 'status-warning';
                    warning.style.color = 'red';
                    warning.style.fontSize = '0.875rem';
                    warning.style.marginTop = '0.25rem';
                    warning.textContent = 'Bàn đang có khách không thể thay đổi trạng thái';
                    statusDiv.appendChild(warning);
                }
            } else {
                statusSelect.disabled = false;
                // Xóa warning nếu có
                const warning = statusDiv.querySelector('.status-warning');
                if (warning) {
                    warning.remove();
                }
            }

            const modal = new bootstrap.Modal(document.getElementById('editTableModal'));
            modal.show();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function saveEditTable() {
    const form = document.getElementById('editTableForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const tableId = document.getElementById('editTableId').value;
    const tableNumber = document.getElementById('editTableNumber').value;
    const tableCapacity = document.getElementById('editTableCapacity').value;
    const statusSelect = document.getElementById('editTableStatus');
    
    // Kiểm tra nếu bàn "Có khách" và cố thay đổi trạng thái
    if (statusSelect.disabled) {
        alert('Bàn đang có khách không thể thay đổi trạng thái!');
        return;
    }

    const tableStatus = statusSelect.value;

    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/update_table.php?id=${tableId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: tableNumber,
                quantity: tableCapacity,
                status: tableStatus
            })
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            bootstrap.Modal.getInstance(document.getElementById('editTableModal')).hide();
            loadTables();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function deleteTable(tableId) {
    if (confirm(`Bạn có chắc muốn xóa bàn ${tableId}?`)) {
        try {
            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/delete_table.php?id=${tableId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                alert(data.message);
                loadTables();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (error) {
            alert('Lỗi kết nối: ' + error.message);
        }
    }
}

document.getElementById('saveEditTableBtn').addEventListener('click', saveEditTable);

let currentPaymentTableId = null;
let currentPaymentOrderId = null;

async function openPaymentModal(tableId) {
    try {
        currentPaymentTableId = tableId;
        
        // Lấy thông tin bàn
        const tableResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_table.php?id=${tableId}`);
        const tableData = await tableResponse.json();
        
        if (tableData.success && tableData.data.length > 0) {
            const table = tableData.data[0];
            document.getElementById('paymentTableName').textContent = `Bàn ${table.name}`;
            document.getElementById('paymentTableStatus').textContent = table.status;
            
            const orderId = table.order_id;
            currentPaymentOrderId = orderId;
            
            if (orderId) {
                // Lấy chi tiết đơn hàng
                const orderResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_orders.php?id=${orderId}`);
                const orderData = await orderResponse.json();
                
                if (orderData.success && orderData.data.length > 0) {
                    const order = orderData.data[0];
                    
                    // Hiển thị tổng tiền
                    const totalAmount = parseFloat(order.totalPrice);
                    document.getElementById('paymentTotal').textContent = totalAmount.toLocaleString('vi-VN');
                    
                    // Lấy chi tiết món
                    const detailsResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_order_details.php?order_id=${orderId}`);
                    const detailsData = await detailsResponse.json();
                    
                    const orderItemsDiv = document.getElementById('paymentOrderItems');
                    orderItemsDiv.innerHTML = '';
                    
                    let calculatedTotal = 0;
                    if (detailsData.success) {
                        detailsData.data.forEach(item => {
                            const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
                            calculatedTotal += itemTotal;
                            
                            const itemDiv = document.createElement('div');
                            itemDiv.className = 'mb-2';
                            itemDiv.innerHTML = `
                                <div class="d-flex justify-content-between">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>${itemTotal.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                            `;
                            orderItemsDiv.appendChild(itemDiv);
                        });
                        
                        // Cập nhật tổng tiền từ chi tiết
                        if (calculatedTotal !== totalAmount) {
                            document.getElementById('paymentTotal').textContent = calculatedTotal.toLocaleString('vi-VN');
                        }
                    }
                    
                    document.getElementById('orderDetails').style.display = 'block';
                    
                    // Reset form thanh toán
                    document.getElementById('paymentMethod').value = 'cash';
                    document.getElementById('cashAmount').value = '';
                    document.getElementById('cashAmountDiv').style.display = 'block';
                    document.getElementById('confirmPaymentBtn').disabled = true;
                    document.getElementById('changeAmount').innerHTML = '';
                    
                    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
                    modal.show();
                    
                    // Attach event listeners
                    const paymentMethodSelect = document.getElementById('paymentMethod');
                    const cashInput = document.getElementById('cashAmount');
                    
                    paymentMethodSelect.removeEventListener('change', handlePaymentMethodChange); // Xóa cũ
                    cashInput.removeEventListener('input', handleCashInput); // Xóa cũ
                    
                    paymentMethodSelect.addEventListener('change', handlePaymentMethodChange);
                    cashInput.addEventListener('input', handleCashInput);
                    
                } else {
                    alert('Không tìm thấy đơn hàng cho bàn này');
                }
            } else {
                alert('Bàn này không có đơn hàng');
            }
        } else {
            alert('Không tìm thấy thông tin bàn');
        }
    } catch (error) {
        console.error('Lỗi openPaymentModal:', error);
        alert('Lỗi: ' + error.message);
    }
}

function handlePaymentMethodChange(event) {
    const method = event.target.value;
    const cashDiv = document.getElementById('cashAmountDiv');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    
    if (method === 'cash') {
        cashDiv.style.display = 'block';
        confirmBtn.disabled = true;
        
        const cashInput = document.getElementById('cashAmount');
        cashInput.value = '';
        document.getElementById('changeAmount').innerHTML = '';
        
        // Attach listener cho cash input
        cashInput.addEventListener('input', handleCashInput);
    } else {
        cashDiv.style.display = 'none';
        confirmBtn.disabled = false;
        
        const cashInput = document.getElementById('cashAmount');
        cashInput.removeEventListener('input', handleCashInput);
    }
}

function handleCashInput(event) {
    const cashAmount = parseFloat(event.target.value.replace(/[^\d]/g, '')) || 0;
    const totalText = document.getElementById('paymentTotal').textContent;
    
    // Parse tổng tiền chính xác
    const totalTextClean = totalText.replace(/\D/g, ''); // Xoá mọi ký tự không phải số
    const total = parseFloat(totalTextClean) || 0;
    const change = cashAmount - total;
    
    const changeDiv = document.getElementById('changeAmount');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    
    if (change >= 0) {
        changeDiv.innerHTML = `<span class="text-success">Tiền thừa: ${change.toLocaleString('vi-VN')} VNĐ</span>`;
        confirmBtn.disabled = false;
    } else {
        changeDiv.innerHTML = `<span class="text-danger">Thiếu: ${Math.abs(change).toLocaleString('vi-VN')} VNĐ</span>`;
        confirmBtn.disabled = true;
    }
}

async function confirmPayment() {
    if (!currentPaymentTableId || !currentPaymentOrderId) {
        alert('Lỗi: Không tìm thấy thông tin thanh toán');
        return;
    }
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    try {
        // 1. Cập nhật đơn hàng thành "paid"
        const updateOrderResponse = await fetch(
            `http://localhost:81/SpicyNoodleProject/api/update_order.php?id=${currentPaymentOrderId}`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid' })
            }
        );
        
        const orderResult = await updateOrderResponse.json();
        
        if (!orderResult.success) {
            alert('Lỗi cập nhật đơn hàng: ' + orderResult.message);
            return;
        }
        
        // 2. Cập nhật bàn về "Trống" và xóa order_id
        const updateTableResponse = await fetch(
            `http://localhost:81/SpicyNoodleProject/api/update_table.php?id=${currentPaymentTableId}`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'Trống', 
                    order_id: null 
                })
            }
        );
        
        const tableResult = await updateTableResponse.json();
        
        if (tableResult.success) {
            alert(`Thanh toán thành công bằng ${paymentMethod === 'cash' ? 'tiền mặt' : paymentMethod}!`);
            bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
            loadTables(); // Reload danh sách bàn
        } else {
            alert('Lỗi cập nhật bàn: ' + tableResult.message);
        }
        
    } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert('Lỗi thanh toán: ' + error.message);
    }
}