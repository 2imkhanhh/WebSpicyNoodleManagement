document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
});

async function loadCustomers(search = '') {
    try {
        // Hiển thị loading spinner
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) loadingSpinner.classList.remove('d-none');

        // Gọi API với role=0 và tham số search (nếu có)
        const url = search 
            ? `http://localhost:81/SpicyNoodleProject/api/get_accounts.php?role=0&search=${encodeURIComponent(search)}`
            : 'http://localhost:81/SpicyNoodleProject/api/get_accounts.php?role=0';
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include' // Thêm để gửi cookie nếu cần xác thực
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Ẩn loading spinner
        if (loadingSpinner) loadingSpinner.classList.add('d-none');

        const customerTableBody = document.getElementById('customerTableBody');
        if (!customerTableBody) {
            // Tạo bảng nếu chưa có
            const customerTableContainer = document.querySelector('.customer-table-container');
            customerTableContainer.innerHTML = `
                <div class="table-responsive">
                    <table class="table table-hover customer-table" id="customerTable">
                        <thead class="table-header">
                            <tr>
                                <th class="text-center" style="width: 60px;">STT</th>
                                <th>Tên khách hàng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th class="text-center" style="width: 120px;">Trạng thái</th>
                                <th class="text-center" style="width: 150px;">Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="customerTableBody"></tbody>
                    </table>
                </div>
            `;
        }

        const tableBody = document.getElementById('customerTableBody');
        tableBody.innerHTML = ''; // Xóa dữ liệu cũ

        if (data.success && data.data.length > 0) {
            data.data.forEach((customer, index) => {
                const row = document.createElement('tr');
                const statusText = parseInt(customer.status) === 1 ? 'Hoạt động' : 'Khóa';
                row.innerHTML = `
                    <td class="text-center">${index + 1}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone}</td>
                    <td class="text-center">
                        <span class="badge ${parseInt(customer.status) === 1 ? 'status-active' : 'status-inactive'}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-view btn-sm view-customer-btn" data-id="${customer.account_id}">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Thêm event listener cho nút xem chi tiết
            document.querySelectorAll('.view-customer-btn').forEach(button => {
                button.addEventListener('click', viewCustomerDetails);
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-3x mb-3 opacity-50"></i>
                        <p>Không tìm thấy khách hàng.</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
        const tableBody = document.getElementById('customerTableBody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
                    <p>Lỗi tải danh sách khách hàng: ${error.message}</p>
                </td>
            </tr>
        `;
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
    }
}

async function viewCustomerDetails(event) {
    const customerId = event.target.closest('.view-customer-btn').dataset.id;
    
    try {
        // Lấy thông tin khách hàng
        const customerResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_accounts.php?id=${customerId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!customerResponse.ok) {
            throw new Error(`HTTP error! status: ${customerResponse.status}`);
        }

        const customerData = await customerResponse.json();
        
        if (customerData.success && customerData.data.length > 0) {
            const customer = customerData.data[0];
            // Hiển thị thông tin cơ bản
            document.getElementById('modalCustomerName').textContent = customer.name;
            document.getElementById('modalCustomerEmail').textContent = customer.email || 'N/A';
            document.getElementById('modalCustomerPhone').textContent = customer.phone;
            document.getElementById('modalCustomerStatus').textContent = parseInt(customer.status) === 1 ? 'Hoạt động' : 'Khóa';
            document.getElementById('modalCustomerStatus').className = `badge fs-6 ${parseInt(customer.status) === 1 ? 'status-active' : 'status-inactive'}`;
            
            // Cập nhật thanh tiến trình (giả lập)
            document.getElementById('customerActivity').style.width = parseInt(customer.status) === 1 ? '100%' : '0%';
            document.getElementById('lastActivity').textContent = 'Chưa có dữ liệu';

            // Lấy lịch sử đơn hàng
            const orderResponse = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_orders.php?account_id=${customerId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!orderResponse.ok) {
                throw new Error(`HTTP error! status: ${orderResponse.status}`);
            }

            const orderData = await orderResponse.json();
            const orderHistory = document.getElementById('orderHistory');
            orderHistory.innerHTML = ''; // Xóa dữ liệu cũ

            if (orderData.success && orderData.data.length > 0) {
                orderData.data.forEach(order => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${order.order_id}</td>
                        <td>${new Date(order.orderDate).toLocaleString('vi-VN', { dateStyle: 'short'})}</td>
                        <td>${parseFloat(order.totalPrice).toLocaleString('vi-VN')} VNĐ</td>
                        <td>
                            <span class="badge ${order.status === 'paid' ? 'status-active' : 'status-inactive'}">
                                ${order.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                        </td>
                    `;
                    orderHistory.appendChild(row);
                });
            } else {
                orderHistory.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-muted">Không có đơn hàng nào</td>
                    </tr>
                `;
            }

            // Hiển thị modal
            new bootstrap.Modal(document.getElementById('customerDetailModal')).show();
        } else {
            alert('Lỗi: ' + (customerData.message || 'Không tìm thấy khách hàng'));
        }
    } catch (error) {
        console.error('Lỗi tải thông tin khách hàng:', error);
        const orderHistory = document.getElementById('orderHistory');
        orderHistory.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">Lỗi tải lịch sử đơn hàng: ${error.message}</td>
            </tr>
        `;
        new bootstrap.Modal(document.getElementById('customerDetailModal')).show();
    }
}

// Tìm kiếm khách hàng
function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch')?.value.trim();
    
    // Gọi lại loadCustomers với tham số tìm kiếm
    loadCustomers(searchTerm);
}

// Event listener cho tìm kiếm
const customerSearch = document.getElementById('customerSearch');
if (customerSearch) {
    customerSearch.addEventListener('input', () => {
        // Debounce để tránh gọi API quá nhiều
        clearTimeout(customerSearch.dataset.timeout);
        customerSearch.dataset.timeout = setTimeout(filterCustomers, 300);
    });
}

// Event listener cho lọc trạng thái
const statusFilter = document.getElementById('statusFilter');
if (statusFilter) {
    statusFilter.addEventListener('change', () => {
        const searchTerm = document.getElementById('customerSearch')?.value.trim() || '';
        loadCustomers(searchTerm);
    });
}