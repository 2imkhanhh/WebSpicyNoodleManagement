document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
});

async function loadCustomers() {
    try {
        // Gọi API với role=0 để chỉ lấy khách hàng
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_accounts.php?role=0', {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success) {
            const customerTableBody = document.getElementById('customerTableBody');
            if (!customerTableBody) {
                // Tạo bảng nếu chưa có
                const customerTableContainer = document.querySelector('.customer-table-container');
                customerTableContainer.innerHTML = `
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên khách hàng</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="customerTableBody"></tbody>
                    </table>
                `;
            }

            const tableBody = document.getElementById('customerTableBody');
            tableBody.innerHTML = ''; // Clear existing data

            data.data.forEach((customer, index) => {
                const row = document.createElement('tr');
                const statusText = parseInt(customer.status) === 1 ? 'Hoạt động' : 'Khóa';
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email || 'N/A'}</td>
                    <td>${customer.phone}</td>
                    <td>
                        <span class="badge ${parseInt(customer.status) === 1 ? 'bg-success' : 'bg-danger'}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
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
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function viewCustomerDetails(event) {
    const customerId = event.target.closest('.view-customer-btn').dataset.id;
    
    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_accounts.php?id=${customerId}`, {
            method: 'GET'
        });
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const customer = data.data[0];
            // Hiển thị thông tin trong modal
            document.getElementById('customerName').textContent = customer.name;
            document.getElementById('customerEmail').textContent = customer.email || 'N/A';
            document.getElementById('customerPhone').textContent = customer.phone;
            document.getElementById('customerStatus').textContent = parseInt(customer.status) === 1 ? 'Hoạt động' : 'Khóa';
            
            new bootstrap.Modal(document.getElementById('customerDetailModal')).show();
        }
    } catch (error) {
        alert('Lỗi tải thông tin khách hàng: ' + error.message);
    }
}

// Tìm kiếm khách hàng
function filterCustomers() {
    const searchTerm = document.getElementById('customerSearch')?.value.toLowerCase().trim();
    const rows = document.querySelectorAll('#customerTableBody tr');

    if (!searchTerm) {
        rows.forEach(row => row.style.display = '');
        return;
    }

    rows.forEach(row => {
        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const phone = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
        
        const match = name.includes(searchTerm) || 
                     email.includes(searchTerm) || 
                     phone.includes(searchTerm);
                     
        row.style.display = match ? '' : 'none';
    });
}

// Event listener cho tìm kiếm (nếu có input search)
const customerSearch = document.getElementById('customerSearch');
if (customerSearch) {
    customerSearch.addEventListener('keyup', filterCustomers);
}