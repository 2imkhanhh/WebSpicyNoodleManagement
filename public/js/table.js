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
    const tableStatus = "Trống";

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

            const statusDiv = statusSelect.parentElement;

            if (table.status === 'Có khách') {
                statusSelect.disabled = true;
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
let originalTotal = 0;
let discountedTotal = 0;

async function openPaymentModal(tableId) {
    try {
        currentPaymentTableId = tableId;
        
        const tableResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_table.php?id=${tableId}`);
        const tableData = await tableResponse.json();
        
        if (tableData.success && tableData.data.length > 0) {
            const table = tableData.data[0];
            document.getElementById('paymentTableName').textContent = `Bàn ${table.name}`;
            document.getElementById('paymentTableStatus').textContent = table.status;
            
            const orderId = table.order_id;
            currentPaymentOrderId = orderId;
            
            if (orderId) {
                const orderResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_orders.php?id=${orderId}`);
                const orderData = await orderResponse.json();
                
                if (orderData.success && orderData.data.length > 0) {
                    const order = orderData.data[0];
                    
                    originalTotal = parseFloat(order.totalPrice);
                    discountedTotal = originalTotal;
                    document.getElementById('paymentTotal').textContent = originalTotal.toLocaleString('vi-VN') + ' VNĐ';
                    document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
                    
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
                        
                        if (calculatedTotal !== originalTotal) {
                            originalTotal = calculatedTotal;
                            discountedTotal = calculatedTotal;
                            document.getElementById('paymentTotal').textContent = originalTotal.toLocaleString('vi-VN') + ' VNĐ';
                            document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
                        }
                    }
                    
                    document.getElementById('orderDetails').style.display = 'block';
                    
                    document.getElementById('paymentMethod').value = 'cash';
                    document.getElementById('cashAmount').value = '';
                    document.getElementById('cashAmountDiv').style.display = 'block';
                    document.getElementById('confirmPaymentBtn').disabled = true;
                    document.getElementById('changeAmount').innerHTML = '';
                    document.getElementById('customerPhone').value = '';
                    document.getElementById('customerMessage').innerHTML = '';
                    document.getElementById('voucherSelect').innerHTML = '<option value="">Chọn voucher</option>';
                    
                    const paymentMethodSelect = document.getElementById('paymentMethod');
                    const cashInput = document.getElementById('cashAmount');
                    const phoneInput = document.getElementById('customerPhone');
                    const voucherSelect = document.getElementById('voucherSelect');
                    
                    paymentMethodSelect.removeEventListener('change', handlePaymentMethodChange);
                    cashInput.removeEventListener('input', handleCashInput);
                    phoneInput.removeEventListener('input', handlePhoneInput);
                    voucherSelect.removeEventListener('change', handleVoucherChange);
                    
                    paymentMethodSelect.addEventListener('change', handlePaymentMethodChange);
                    cashInput.addEventListener('input', handleCashInput);
                    phoneInput.addEventListener('input', handlePhoneInput);
                    voucherSelect.addEventListener('change', handleVoucherChange);
                    
                    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
                    modal.show();
                    
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
    const cashInput = document.getElementById('cashAmount');
    
    if (method === 'cash') {
        cashDiv.style.display = 'block';
        confirmBtn.disabled = true;
        cashInput.value = '';
        document.getElementById('changeAmount').innerHTML = '';
        cashInput.addEventListener('input', handleCashInput);
    } else {
        cashDiv.style.display = 'none';
        confirmBtn.disabled = false;
        cashInput.removeEventListener('input', handleCashInput);
    }
}

function handleCashInput(event) {
    const cashAmount = parseFloat(event.target.value) || 0;
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const changeDiv = document.getElementById('changeAmount');
    
    const change = cashAmount - discountedTotal;
    
    if (cashAmount >= discountedTotal) {
        changeDiv.innerHTML = `<span class="text-success">Tiền thừa: ${change.toLocaleString('vi-VN')} VNĐ</span>`;
        confirmBtn.disabled = false;
    } else {
        changeDiv.innerHTML = `<span class="text-danger">Thiếu: ${Math.abs(change).toLocaleString('vi-VN')} VNĐ</span>`;
        confirmBtn.disabled = true;
    }
}

async function handlePhoneInput(event) {
    const phone = event.target.value;
    const customerMessage = document.getElementById('customerMessage');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const voucherSelect = document.getElementById('voucherSelect');
    
    if (!phone) {
        customerMessage.innerHTML = '';
        voucherSelect.innerHTML = '<option value="">Chọn voucher</option>';
        discountedTotal = originalTotal;
        document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
        confirmBtn.disabled = document.getElementById('paymentMethod').value === 'cash';
        return;
    }
    
    if (!phone.match(/^\d{10}$/)) {
        customerMessage.innerHTML = `<span class="text-danger">Vui lòng nhập số điện thoại hợp lệ (10 chữ số).</span>`;
        voucherSelect.innerHTML = '<option value="">Chọn voucher</option>';
        discountedTotal = originalTotal;
        document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
        confirmBtn.disabled = document.getElementById('paymentMethod').value === 'cash';
        return;
    }
    
    try {
        const accountResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_accounts.php?role=0&search=${phone}`, {
            method: 'GET'
        });
        // Log raw response for debugging
        const accountResponseText = await accountResponse.text();
        console.log('get_accounts.php response:', accountResponseText);
        
        let accountData;
        try {
            accountData = JSON.parse(accountResponseText);
        } catch (e) {
            console.error('Invalid JSON from get_accounts.php:', e, accountResponseText);
            throw new Error('Invalid JSON response from get_accounts.php');
        }
        
        if (accountData.success && accountData.data.length > 0) {
            const accountId = accountData.data[0].account_id;
            const customerResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_customer.php?account_id=${accountId}`, {
                method: 'GET'
            });
            // Log raw response for debugging
            const customerResponseText = await customerResponse.text();
            console.log('get_customer.php response:', customerResponseText);
            
            let customerData;
            try {
                customerData = JSON.parse(customerResponseText);
            } catch (e) {
                console.error('Invalid JSON from get_customer.php:', e, customerResponseText);
                throw new Error('Invalid JSON response from get_customer.php');
            }
            
            if (customerData.success) {
                const points = customerData.data.points || 0;
                const vouchers = customerData.data.vouchers || [];
                let voucherText = '';
                voucherSelect.innerHTML = '<option value="">Chọn voucher</option>';
                
                if (vouchers.length > 0) {
                    voucherText = '<br>Có thể đổi:<br>' + vouchers.map(v => 
                        ` - ${v.voucher_code} (${v.discount_percent}% giảm, ${v.points_require} điểm)`
                    ).join('<br>');
                    vouchers.forEach(v => {
                        const option = document.createElement('option');
                        option.value = v.voucher_id;
                        option.dataset.discount = v.discount_percent;
                        option.dataset.points = v.points_require;
                        option.textContent = `${v.voucher_code} (${v.discount_percent}% giảm, ${v.points_require} điểm)`;
                        voucherSelect.appendChild(option);
                    });
                } else {
                    voucherText = '<br>Không có voucher nào đủ điều kiện đổi.';
                }
                customerMessage.innerHTML = `<span class="text-success">Khách hàng đã đăng ký. Số điểm: ${points}${voucherText}</span>`;
                discountedTotal = originalTotal;
                document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
            } else {
                customerMessage.innerHTML = `<span class="text-warning">Không tìm thấy thông tin điểm của khách hàng.</span>`;
                voucherSelect.innerHTML = '<option value="">Chọn voucher</option>';
                discountedTotal = originalTotal;
                document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
            }
        } else {
            customerMessage.innerHTML = `<span class="text-warning">Khách hàng chưa đăng ký.</span>`;
            voucherSelect.innerHTML = '<option value="">Chọn voucher</option>';
            discountedTotal = originalTotal;
            document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
        }
        confirmBtn.disabled = document.getElementById('paymentMethod').value === 'cash';
    } catch (error) {
        console.error('Lỗi kiểm tra khách hàng:', error);
        customerMessage.innerHTML = `<span class="text-danger">Lỗi kiểm tra khách hàng: ${error.message}</span>`;
        voucherSelect.innerHTML = '<option value="">Chọn voucher</option>';
        discountedTotal = originalTotal;
        document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
        confirmBtn.disabled = document.getElementById('paymentMethod').value === 'cash';
    }
}

function handleVoucherChange(event) {
    const voucherId = event.target.value;
    const discountPercent = parseFloat(event.target.selectedOptions[0].dataset.discount) || 0;
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const cashInput = document.getElementById('cashAmount');
    
    if (voucherId) {
        discountedTotal = originalTotal * (1 - discountPercent / 100);
    } else {
        discountedTotal = originalTotal;
    }
    
    document.getElementById('discountedTotal').textContent = discountedTotal.toLocaleString('vi-VN') + ' VNĐ';
    
    if (document.getElementById('paymentMethod').value === 'cash') {
        const cashAmount = parseFloat(cashInput.value) || 0;
        const change = cashAmount - discountedTotal;
        const changeDiv = document.getElementById('changeAmount');
        
        if (cashAmount >= discountedTotal) {
            changeDiv.innerHTML = `<span class="text-success">Tiền thừa: ${change.toLocaleString('vi-VN')} VNĐ</span>`;
            confirmBtn.disabled = false;
        } else {
            changeDiv.innerHTML = `<span class="text-danger">Thiếu: ${Math.abs(change).toLocaleString('vi-VN')} VNĐ</span>`;
            confirmBtn.disabled = true;
        }
    } else {
        confirmBtn.disabled = false;
    }
}

async function confirmPayment() {
    if (!currentPaymentTableId || !currentPaymentOrderId) {
        alert('Lỗi: Không tìm thấy thông tin thanh toán');
        return;
    }
    
    const paymentMethod = document.getElementById('paymentMethod').value;
    const phone = document.getElementById('customerPhone').value;
    const voucherSelect = document.getElementById('voucherSelect');
    const voucherId = voucherSelect.value;
    
    try {
        let accountId = null;
        let pointsEarned = 0;
        
        // Kiểm tra số điện thoại và lấy account_id
        if (phone && phone.match(/^\d{10}$/)) {
            const accountResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_accounts.php?role=0&search=${phone}`);
            const accountData = await accountResponse.json();
            
            if (accountData.success && accountData.data.length > 0) {
                accountId = accountData.data[0].account_id;
                
                // Xử lý đổi voucher nếu có
                if (voucherId) {
                    const redeemResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/redeem_voucher.php`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            account_id: accountId,
                            voucher_id: voucherId,
                            order_id: currentPaymentOrderId
                        })
                    });
                    const redeemData = await redeemResponse.json();
                    
                    if (!redeemData.success) {
                        alert('Lỗi đổi voucher: ' + redeemData.message);
                        return;
                    }
                } else {
                    // Nếu không sử dụng voucher, tính điểm tích lũy
                    const pointRulesResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/point_rules.php`, {
                        method: 'GET'
                    });
                    const pointRulesData = await pointRulesResponse.json();
                    
                    if (pointRulesData.success && pointRulesData.data) {
                        const totalPrice = discountedTotal;
                        const rule = pointRulesData.data.find(r => 
                            totalPrice >= parseFloat(r.min_amount) && 
                            (!r.max_amount || totalPrice <= parseFloat(r.max_amount))
                        );
                        if (rule) {
                            pointsEarned = parseInt(rule.points_earned);
                        }
                    }
                }
            }
        }
        
        // Cập nhật đơn hàng và xử lý tích điểm trong update_customer.php
        const updateOrderResponse = await fetch(
            `http://localhost:81/SpicyNoodleProject/api/update_customer.php`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    order_id: currentPaymentOrderId,
                    status: 'paid',
                    account_id: accountId,
                    total_price: discountedTotal,
                    voucher_id: voucherId || null,
                    points_earned: pointsEarned
                })
            }
        );
        
        const orderResult = await updateOrderResponse.json();
        
        if (!orderResult.success) {
            alert('Lỗi cập nhật đơn hàng: ' + orderResult.message);
            return;
        }
        
        // Cập nhật trạng thái bàn
        const updateTableResponse = await fetch(
            `http://localhost:81/SpicyNoodleProject/api/update_table.php?id=${currentPaymentTableId}`, 
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ 
                    status: 'Trống', 
                    order_id: null 
                })
            }
        );
        
        const tableResult = await updateTableResponse.json();
        
        if (!tableResult.success) {
            alert('Lỗi cập nhật bàn: ' + tableResult.message);
            return;
        }
        
        // Thông báo thành công
        let message = `Thanh toán thành công bằng ${paymentMethod === 'cash' ? 'tiền mặt' : paymentMethod}!`;
        if (voucherId) {
            message += `\nVoucher đã được áp dụng.`;
        } else if (pointsEarned > 0) {
            message += `\nĐã tích ${pointsEarned} điểm cho khách hàng.`;
        }
        alert(message);
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        loadTables();
        
    } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert('Lỗi thanh toán: ' + error.message);
    }
}