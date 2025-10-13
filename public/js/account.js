document.addEventListener('DOMContentLoaded', () => {
    const saveAccountBtn = document.getElementById('saveAccountBtn');
    const saveEditAccountBtn = document.getElementById('saveEditAccountBtn');
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener('click', addAccount);
    }
    if (saveEditAccountBtn) {
        saveEditAccountBtn.addEventListener('click', updateAccount);
    }
    loadAccounts();
});

async function loadAccounts() {
    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/get_accounts.php', {
            method: 'GET'
        });
        const data = await response.json();

        if (data.success) {
            const accountGrid = document.querySelector('.account-grid');
            accountGrid.innerHTML = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên tài khoản</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody id="accountTableBody"></tbody>
                </table>
            `;

            const accountTableBody = document.getElementById('accountTableBody');
            data.data.forEach((account, index) => {
                const row = document.createElement('tr');
                let roleText = 'Không xác định';
                switch (parseInt(account.role)) { 
                    case 0:
                        roleText = 'Khách hàng';
                        break;
                    case 1:
                        roleText = 'Nhân viên';
                        break;
                    case 2:
                        roleText = 'Quản lý';
                        break;
                }
                const statusText = parseInt(account.status) === 1 ? 'Hoạt động' : 'Khóa'; 
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${account.name}</td>
                    <td>${account.email || 'N/A'}</td>
                    <td>${account.phone}</td>
                    <td>${roleText}</td>
                    <td><span class="badge ${parseInt(account.status) === 1 ? 'bg-success' : 'bg-danger'}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-warning btn-sm edit-account-btn" data-id="${account.account_id}">Sửa</button>
                        <button class="btn btn-danger btn-sm delete-account-btn" data-id="${account.account_id}">Xóa</button>
                    </td>
                `;
                accountTableBody.appendChild(row);
            });

            document.querySelectorAll('.edit-account-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const accountId = button.dataset.id;
                    try {
                        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/get_accounts.php?id=${accountId}`, {
                            method: 'GET'
                        });
                        const data = await response.json();
                        if (data.success && data.data.length > 0) {
                            const account = data.data[0];
                            document.getElementById('editAccountId').value = account.account_id;
                            document.getElementById('editAccountName').value = account.name;
                            document.getElementById('editAccountEmail').value = account.email || '';
                            document.getElementById('editAccountPhone').value = account.phone;
                            document.getElementById('editAccountRole').value = account.role; // Sử dụng giá trị role trực tiếp
                            document.getElementById('editAccountStatus').value = account.status;
                            new bootstrap.Modal(document.getElementById('editAccountModal')).show();
                        } else {
                            alert('Lỗi: ' + data.message);
                        }
                    } catch (error) {
                        alert('Lỗi kết nối: ' + error.message);
                    }
                });
            });

            document.querySelectorAll('.delete-account-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const accountId = button.dataset.id;
                    if (confirm('Bạn có chắc muốn xóa tài khoản này?')) {
                        try {
                            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/delete_account.php?id=${accountId}`, {
                                method: 'DELETE'
                            });
                            const data = await response.json();
                            if (data.success) {
                                alert(data.message);
                                loadAccounts();
                            } else {
                                alert('Lỗi: ' + data.message);
                            }
                        } catch (error) {
                            alert('Lỗi kết nối: ' + error.message);
                        }
                    }
                });
            });
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Lỗi kết nối: ' + error.message);
    }
}

async function addAccount() {
    const form = document.getElementById('addAccountForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        password: form.password.value,
        role: form.role.value,
        status: 1
    };

    try {
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (result.success) {
            alert(result.message);
            bootstrap.Modal.getInstance(document.getElementById('addAccountModal')).hide();
            form.reset();
            loadAccounts();
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}


async function updateAccount() {
    const form = document.getElementById('editAccountForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const accountId = document.getElementById('editAccountId').value;

    try {
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/update_account.php?id=${accountId}`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.success) {
            alert(data.message);
            bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
            loadAccounts();
        } else {
            alert('Lỗi: ' + data.message);
        }
    } catch (error) {
        alert('Lỗi kết nối: ' + error.message);
    }
}

function filterAccounts() {
    const searchTerm = document.getElementById('accountSearch').value.toLowerCase().trim();
    const criteria = document.getElementById('searchCriteria').value;
    const rows = document.querySelectorAll('#accountTableBody tr');

    if (!searchTerm) {
        rows.forEach(row => row.style.display = '');
        return;
    }

    rows.forEach(row => {
        let match = false;
        switch (criteria) {
            case 'name':
                match = row.querySelector('td:nth-child(2)').textContent.toLowerCase().includes(searchTerm);
                break;
            case 'email':
                match = row.querySelector('td:nth-child(3)').textContent.toLowerCase().includes(searchTerm);
                break;
            case 'phone':
                match = row.querySelector('td:nth-child(4)').textContent.toLowerCase().includes(searchTerm);
                break;
            case 'role':
                match = row.querySelector('td:nth-child(5)').textContent.toLowerCase().includes(searchTerm);
                break;
            case 'status':
                match = row.querySelector('td:nth-child(6) .badge').textContent.toLowerCase().includes(searchTerm);
                break;
        }
        row.style.display = match ? '' : 'none';
    });
}
document.getElementById('accountSearch').addEventListener('keyup', filterAccounts);
