let menuItems = [];

document.addEventListener('DOMContentLoaded', () => {
    const saveAddOrderBtn = document.getElementById('saveAddOrderBtn');
    const addAddItemBtn = document.getElementById('addAddItemBtn');
    const saveEditOrderBtn = document.getElementById('saveEditOrderBtn');
    const addEditItemBtn = document.getElementById('addEditItemBtn');

    if (saveAddOrderBtn) saveAddOrderBtn.addEventListener('click', addOrder);
    if (addAddItemBtn) addAddItemBtn.addEventListener('click', addOrderItemRow);
    if (saveEditOrderBtn) saveEditOrderBtn.addEventListener('click', updateOrder);
    if (addEditItemBtn) addEditItemBtn.addEventListener('click', addEditOrderItemRow);

    loadMenu();
    loadOrders();
});

async function loadMenu() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_food.php', {
            method: 'GET'
        });
        const data = await response.json();
        if (data.success) {
            menuItems = data.data;
        } else {
            alert('Lỗi tải menu: ' + (data.message || 'Không có dữ liệu'));
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

function addOrderItemRow() {
    const tbody = document.querySelector('#addOrderItemsTable tbody');
    if (!tbody) {
        console.error('Không tìm thấy tbody của #addOrderItemsTable');
        return;
    }
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="form-select food-select">
                <option value="">Chọn món</option>
                ${menuItems.map(item => `<option value="${item.food_id}" data-price="${item.price}">${item.name}</option>`).join('')}
            </select>
        </td>
        <td><input type="number" class="form-control price" readonly></td>
        <td><input type="number" class="form-control quantity" min="1" value="1"></td>
        <td><input type="number" class="form-control subtotal" readonly></td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item">Xóa</button></td>
    `;
    tbody.appendChild(row);

    row.querySelector('.food-select').addEventListener('change', updateItemRow);
    row.querySelector('.quantity').addEventListener('input', updateItemRow);
    row.querySelector('.remove-item').addEventListener('click', () => {
        row.remove();
        calculateTotal();
    });
}

function addEditOrderItemRow() {
    const tbody = document.querySelector('#editOrderItemsTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <select class="form-select food-select">
                <option value="">Chọn món</option>
                ${menuItems.map(item => `<option value="${item.food_id}" data-price="${item.price}">${item.name}</option>`).join('')}
            </select>
        </td>
        <td><input type="number" class="form-control price" readonly></td>
        <td><input type="number" class="form-control quantity" min="1" value="1"></td>
        <td><input type="number" class="form-control subtotal" readonly></td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item">Xóa</button></td>
    `;
    tbody.appendChild(row);

    row.querySelector('.food-select').addEventListener('change', updateEditItemRow);
    row.querySelector('.quantity').addEventListener('input', updateEditItemRow);
    row.querySelector('.remove-item').addEventListener('click', () => {
        row.remove();
        calculateEditTotal();
    });
}

function updateItemRow(event) {
    const row = event.target.closest('tr');
    const select = row.querySelector('.food-select');
    const priceInput = row.querySelector('.price');
    const quantityInput = row.querySelector('.quantity');
    const subtotalInput = row.querySelector('.subtotal');

    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption ? selectedOption.dataset.price : 0;
    priceInput.value = price;

    const quantity = quantityInput.value || 1;
    subtotalInput.value = price * quantity;

    calculateTotal();
}

function updateEditItemRow(event) {
    const row = event.target.closest('tr');
    const select = row.querySelector('.food-select');
    const priceInput = row.querySelector('.price');
    const quantityInput = row.querySelector('.quantity');
    const subtotalInput = row.querySelector('.subtotal');

    const selectedOption = select.options[select.selectedIndex];
    const price = selectedOption ? selectedOption.dataset.price : 0;
    priceInput.value = price;

    const quantity = quantityInput.value || 1;
    subtotalInput.value = price * quantity;

    calculateEditTotal();
}

function calculateTotal() {
    const subtotals = document.querySelectorAll('#addOrderItemsTable .subtotal');
    let total = 0;
    subtotals.forEach(sub => total += parseFloat(sub.value) || 0);
    document.getElementById('addTotalPrice').value = total.toFixed(2);
}

function calculateEditTotal() {
    const subtotals = document.querySelectorAll('#editOrderItemsTable .subtotal');
    let total = 0;
    subtotals.forEach(sub => total += parseFloat(sub.value) || 0);
    document.getElementById('editTotalPrice').value = total.toFixed(2);
}

async function loadOrders() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_orders.php', {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success) {
            const orderTableBody = document.getElementById('orderTableBody');
            orderTableBody.innerHTML = '';

            data.data.forEach(order => {
                console.log(order);
                const row = document.createElement('tr');
                
                // Xác định nút action: 
                let actionButtons = '';
                if (order.status !== 'paid') {
                    actionButtons = `
                        <button class="btn btn-warning btn-sm" onclick="editOrder('${order.order_id}')">Sửa</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteOrder('${order.order_id}')">Xóa</button>
                    `;
                }
                
                const statusBadgeClass = order.status === 'paid' ? 'bg-success' : 'bg-warning';
                const statusText = order.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
                
                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${order.orderDate}</td>
                    <td>${parseFloat(order.totalPrice).toLocaleString('vi-VN')} VNĐ</td>
                    <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                    <td>${order.tableName || 'Bàn ' + order.tableID}</td>
                    <td>${actionButtons}</td>
                `;
                orderTableBody.appendChild(row);
            });
        } else {
            alert('Lỗi tải danh sách đơn hàng: ' + (data.message || 'Không có dữ liệu'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function addOrder() {
    const form = document.getElementById('addOrderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const items = [];
    document.querySelectorAll('#addOrderItemsTable tbody tr').forEach(row => {
        const foodId = row.querySelector('.food-select').value;
        const quantity = row.querySelector('.quantity').value;
        const price = row.querySelector('.price').value;
        if (foodId && quantity && price) {
            items.push({ food_id: foodId, quantity: quantity, price: price });
        }
    });

    if (items.length === 0) {
        alert('Vui lòng thêm ít nhất một món ăn.');
        return;
    }

    const formData = new FormData(form);
    formData.append('items', JSON.stringify(items));
    formData.append('status', 'unpaid');

    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/add_order.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            // Lấy tableID từ form sau khi thêm thành công
            const tableId = document.getElementById('addTableID').value;
            if (tableId && data.order_id) {
                // Gọi API để cập nhật trạng thái bàn thành "Có khách" và lưu order_id
                await fetch(`http://localhost:81/SpicyNoodleProject/api/update_table.php?id=${tableId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'Có khách', order_id: data.order_id })
                });
            }
            closeAddModal();
            form.reset();
            document.querySelector('#addOrderItemsTable tbody').innerHTML = '';
            loadOrders();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function editOrder(orderId) {
    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_orders.php?id=${orderId}`, {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success && data.data.length > 0) {
            const order = data.data[0];
            const statusSelect = document.getElementById('editStatus');
            statusSelect.value = order.status;
            statusSelect.disabled = true; 
            
            // Điền thông tin đơn hàng
            document.getElementById('editOrderId').value = order.order_id;
            document.getElementById('editOrderDate').value = order.orderDate;
            document.getElementById('editStatus').value = order.status;
            document.getElementById('editTotalPrice').value = order.totalPrice;
            
            // Lưu thông tin để xử lý sau
            window.currentEditingOrderId = order.order_id;
            window.currentEditingOrderTableId = order.tableID;
            
            // Xóa chi tiết món cũ
            const editItemsTable = document.getElementById('editOrderItemsTable');
            editItemsTable.querySelector('tbody').innerHTML = '';

            // Tải chi tiết món ăn
            const detailsResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_order_details.php?order_id=${orderId}`, {
                method: 'GET'
            });
            const detailsData = await detailsResponse.json();

            // Trong editOrder(), sau khi tạo row cho mỗi item:
            if (detailsData.success) {
                detailsData.data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <select class="form-select food-select" data-initial-value="${item.food_id}">
                                <option value="">Chọn món</option>
                                ${menuItems.map(menuItem => 
                                    `<option value="${menuItem.food_id}" 
                                            data-price="${menuItem.price}" 
                                            ${menuItem.food_id == item.food_id ? 'selected' : ''}>
                                        ${menuItem.name}
                                    </option>`
                                ).join('')}
                            </select>
                        </td>
                        <td><input type="number" class="form-control price" value="${item.price}" readonly></td>
                        <td><input type="number" class="form-control quantity" value="${item.quantity}" min="1"></td>
                        <td><input type="number" class="form-control subtotal" value="${item.price * item.quantity}" readonly></td>
                        <td><button type="button" class="btn btn-danger btn-sm remove-item">Xóa</button></td>
                    `;
                    editItemsTable.querySelector('tbody').appendChild(row);

                    // Thêm event listeners NGAY LẬP TỨC
                    const foodSelect = row.querySelector('.food-select');
                    const quantityInput = row.querySelector('.quantity');
                    const removeBtn = row.querySelector('.remove-item');
                    const subtotalInput = row.querySelector('.subtotal');
                    
                    // Trigger change để cập nhật price nếu cần
                    foodSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    foodSelect.addEventListener('change', updateEditItemRow);
                    quantityInput.addEventListener('input', updateEditItemRow);
                    removeBtn.addEventListener('click', () => {
                        row.remove();
                        calculateEditTotal();
                    });
                });
                calculateEditTotal();
            }

            // Mở modal và tải danh sách bàn
            openEditModal();
            
            // Tải danh sách bàn có thể chọn (bàn hiện tại + bàn trống)
            await loadEditAvailableTables('editTableID', order.tableID);
            
        } else {
            alert('Lỗi tải thông tin đơn hàng: ' + (data.message || 'Không tìm thấy đơn hàng'));
        }
    } catch (error) {
        console.error('Lỗi editOrder:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function loadEditAvailableTables(selectId, currentTableId) {
    try {
        // Lấy danh sách bàn trống
        const emptyTablesResponse = await fetch('http://localhost:81/SpicyNoodleProject/api/get_table.php?status=Trống', {
            method: 'GET'
        });
        const emptyTablesData = await emptyTablesResponse.json();

        // Lấy thông tin bàn hiện tại
        const currentTableResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_table.php?id=${currentTableId}`, {
            method: 'GET'
        });
        const currentTableData = await currentTableResponse.json();

        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Chọn bàn</option>';
        
        // Thêm bàn hiện tại (luôn hiển thị)
        if (currentTableData.success && currentTableData.data.length > 0) {
            const currentTable = currentTableData.data[0];
            const currentOption = document.createElement('option');
            currentOption.value = currentTable.table_id;
            currentOption.textContent = `Bàn ${currentTable.name} (Sức chứa: ${currentTable.quantity}) - Hiện tại`;
            currentOption.selected = true; // Mặc định chọn bàn hiện tại
            select.appendChild(currentOption);
        }

        // Thêm các bàn trống khác (không bao gồm bàn hiện tại)
        if (emptyTablesData.success) {
            emptyTablesData.data.forEach(table => {
                if (table.table_id != currentTableId) { // Không thêm bàn hiện tại
                    const option = document.createElement('option');
                    option.value = table.table_id;
                    option.textContent = `Bàn ${table.name} (Sức chứa: ${table.quantity})`;
                    select.appendChild(option);
                }
            });
        }

        // Lắng nghe sự thay đổi để cập nhật trạng thái bàn
        select.addEventListener('change', handleTableChange);
        
    } catch (error) {
        alert('Lỗi tải danh sách bàn: ' + error.message);
    }
}

function handleTableChange(event) {
    const selectedTableId = event.target.value;
    const currentTableId = window.currentEditingOrderTableId;
    
    if (selectedTableId && selectedTableId != currentTableId) {
        // Cập nhật bàn cũ về trạng thái Trống
        if (currentTableId) {
            updateTableStatus(currentTableId, 'Trống', null);
        }
        // Cập nhật bàn mới thành Có khách
        updateTableStatus(selectedTableId, 'Có khách', window.currentEditingOrderId);
    }
}

async function updateTableStatus(tableId, status, orderId = null) {
    try {
        const updateData = { status: status };
        if (orderId) {
            updateData.order_id = orderId;
        }
        
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/update_table.php?id=${tableId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        if (!result.success) {
            console.error('Lỗi cập nhật trạng thái bàn:', result.message);
        }
    } catch (error) {
        console.error('Lỗi kết nối khi cập nhật bàn:', error);
    }
}

async function updateOrder() {
    const form = document.getElementById('editOrderForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const orderId = document.getElementById('editOrderId').value;
    const items = [];
    
    // Lấy danh sách món từ table
    const rows = document.querySelectorAll('#editOrderItemsTable tbody tr');
    let hasValidItems = false;
    
    rows.forEach(row => {
        const foodSelect = row.querySelector('.food-select');
        const quantityInput = row.querySelector('.quantity');
        const priceInput = row.querySelector('.price');
        
        const foodId = foodSelect ? foodSelect.value : '';
        const quantity = quantityInput ? quantityInput.value : '';
        const price = priceInput ? priceInput.value : '';
        
        // Chỉ thêm item nếu tất cả các trường đều có giá trị hợp lệ
        if (foodId && quantity && price && parseInt(quantity) > 0) {
            items.push({ 
                food_id: foodId, 
                quantity: quantity, 
                price: price 
            });
            hasValidItems = true;
        }
    });

    // Kiểm tra có ít nhất 1 món hợp lệ không
    if (!hasValidItems) {
        alert('Vui lòng thêm ít nhất một món ăn hợp lệ.');
        return;
    }

    const formData = new FormData(form);
    formData.append('items', JSON.stringify(items));
    formData.append('orderId', orderId);

    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/update_order.php?id=${orderId}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            // Xử lý thay đổi bàn nếu có
            const selectedTableId = document.getElementById('editTableID').value;
            const currentTableId = window.currentEditingOrderTableId;
            
            if (selectedTableId && selectedTableId != currentTableId) {
                // Cập nhật bàn mới thành Có khách
                await updateTableStatus(selectedTableId, 'Có khách', orderId);
                // Cập nhật bàn cũ về Trống
                if (currentTableId && currentTableId != selectedTableId) {
                    await updateTableStatus(currentTableId, 'Trống', null);
                }
            }
            
            alert(data.message);
            closeEditModal();
            loadOrders();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function deleteOrder(orderId) {
    if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
        try {
            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/delete_order.php?id=${orderId}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                alert(data.message);
                loadOrders();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (error) {
            alert('Lỗi kết nối: ' + error.message);
        }
    }
}

async function loadAvailableTables(selectId) {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_table.php?status=Trống', {
            method: 'GET'
        });
        const data = await response.json();
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Chọn bàn trống</option>';
        if (data.success) {
            data.data.forEach(table => {
                const option = document.createElement('option');
                option.value = table.table_id;
                option.textContent = `Bàn ${table.name} (Sức chứa: ${table.quantity})`;
                select.appendChild(option);
            });
        } else {
            alert('Lỗi tải danh sách bàn trống: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}