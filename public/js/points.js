document.addEventListener('DOMContentLoaded', () => {
    loadPointsRules();
    loadVoucherRules();

    // Xử lý form quy định tích điểm
    document.getElementById('pointsRuleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const minAmount = parseFloat(document.getElementById('minAmount').value);
        const maxAmount = document.getElementById('maxAmount').value ? parseFloat(document.getElementById('maxAmount').value) : null;
        const pointsEarned = parseInt(document.getElementById('pointsEarned').value);

        if (isNaN(minAmount) || isNaN(pointsEarned)) {
            alert('Vui lòng nhập số tiền tối thiểu và số điểm hợp lệ!');
            return;
        }
        if (maxAmount !== null && minAmount >= maxAmount) {
            alert('Số tiền tối thiểu phải nhỏ hơn số tiền tối đa!');
            return;
        }

        const data = {
            min_amount: minAmount,
            max_amount: maxAmount,
            points_earned: pointsEarned
        };

        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/point_rules.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
            alert(result.message || 'Có lỗi xảy ra!');
            return;
        }
        loadPointsRules();
        document.getElementById('pointsRuleForm').reset(); // Reset form sau khi thêm
    });

    // Xử lý form quy định voucher
    document.getElementById('voucherRuleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            voucher_code: document.getElementById('voucherCode').value.trim(),
            point_require: parseInt(document.getElementById('pointRequire').value),
            discount_percent: parseInt(document.getElementById('discountPercent').value)
        };
        if (!data.voucher_code || isNaN(data.point_require) || isNaN(data.discount_percent) || data.discount_percent < 1 || data.discount_percent > 100) {
            alert('Vui lòng điền đầy đủ thông tin hợp lệ (mã voucher, số điểm, và phần trăm giảm từ 1-100)!');
            return;
        }
        const response = await fetch('http://localhost:81/SpicyNoodleProject/api/voucher_rules.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
            alert(result.message || 'Có lỗi xảy ra!');
            return;
        }
        loadVoucherRules();
        document.getElementById('voucherRuleForm').reset(); // Reset form sau khi thêm
    });

    // Load quy định tích điểm
    async function loadPointsRules() {
        const res = await fetch('http://localhost:81/SpicyNoodleProject/api/point_rules.php');
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            return;
        }
        const result = await res.json();
        const table = document.getElementById('pointsTable');
        table.innerHTML = '';
        result.data.forEach(rule => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rule.min_amount?.toLocaleString('vi-VN') || 'N/A'} VNĐ</td>
                <td>${rule.max_amount ? rule.max_amount.toLocaleString('vi-VN') : '∞'} VNĐ</td>
                <td>${rule.points_earned || 'N/A'} điểm</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${rule.rule_id}">Sửa</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePointRule(${rule.rule_id})">Xóa</button>
                </td>
            `;
            table.appendChild(row);
        });

        // Thêm sự kiện cho nút Sửa
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                editPointRule(id);
            });
        });
    }

    // Load quy định voucher
    async function loadVoucherRules() {
        const res = await fetch('http://localhost:81/SpicyNoodleProject/api/voucher_rules.php');
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            return;
        }
        const result = await res.json();
        const table = document.getElementById('voucherTable');
        table.innerHTML = '';
        result.data.forEach(rule => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rule.points_require || 'N/A'} điểm</td>
                <td>${rule.discount_percent || 'N/A'}%</td>
                <td>${rule.voucher_code || 'N/A'}</td>
                <td>
                    <button class="btn btn-warning btn-sm edit-btn" data-id="${rule.voucher_id}">Sửa</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteVoucherRule(${rule.voucher_id})">Xóa</button>
                </td>
            `;
            table.appendChild(row);
        });

        // Thêm sự kiện cho nút Sửa
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                editVoucherRule(id);
            });
        });
    }

    // Sửa quy định tích điểm
    async function editPointRule(id) {
        const res = await fetch(`http://localhost:81/SpicyNoodleProject/api/point_rules.php?id=${id}`);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            return;
        }
        const result = await res.json();
        const rule = result.data;

        document.getElementById('minAmount').value = rule.min_amount || '';
        document.getElementById('maxAmount').value = rule.max_amount || '';
        document.getElementById('pointsEarned').value = rule.points_earned || '';

        // Kiểm tra minAmount < maxAmount khi sửa
        const minAmount = parseFloat(document.getElementById('minAmount').value);
        const maxAmount = document.getElementById('maxAmount').value ? parseFloat(document.getElementById('maxAmount').value) : null;
        if (maxAmount !== null && minAmount >= maxAmount) {
            alert('Số tiền tối thiểu phải nhỏ hơn số tiền tối đa!');
            return;
        }

        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/point_rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                min_amount: minAmount,
                max_amount: maxAmount,
                points_earned: parseInt(document.getElementById('pointsEarned').value)
            })
        });
        const resultUpdate = await response.json();
        if (!response.ok) {
            alert(resultUpdate.message || 'Có lỗi xảy ra!');
            return;
        }
        loadPointsRules();
    }

    // Xóa quy định tích điểm
    async function deletePointRule(id) {
        if (confirm('Bạn có chắc muốn xóa quy định này?')) {
            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/point_rules.php?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                return;
            }
            loadPointsRules();
        }
    }

    // Sửa quy định voucher
    async function editVoucherRule(id) {
        const res = await fetch(`http://localhost:81/SpicyNoodleProject/api/voucher_rules.php?id=${id}`);
        if (!res.ok) {
            const errorText = await res.text();
            console.error('API Error:', errorText);
            return;
        }
        const result = await res.json();
        const rule = result.data;

        document.getElementById('pointRequire').value = rule.point_require || '';
        document.getElementById('discountPercent').value = rule.discount_percent || '';
        document.getElementById('voucherCode').value = rule.voucher_code || '';

        const data = {
            voucher_code: document.getElementById('voucherCode').value.trim(),
            point_require: parseInt(document.getElementById('pointRequire').value),
            discount_percent: parseInt(document.getElementById('discountPercent').value)
        };
        if (!data.voucher_code || isNaN(data.point_require) || isNaN(data.discount_percent) || data.discount_percent < 1 || data.discount_percent > 100) {
            alert('Vui lòng điền đầy đủ thông tin hợp lệ (mã voucher, số điểm, và phần trăm giảm từ 1-100)!');
            return;
        }

        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/voucher_rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const resultUpdate = await response.json();
        if (!response.ok) {
            alert(resultUpdate.message || 'Có lỗi xảy ra!');
            return;
        }
        loadVoucherRules();
    }

    // Xóa quy định voucher
    async function deleteVoucherRule(id) {
        if (confirm('Bạn có chắc muốn xóa voucher này?')) {
            const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/voucher_rules.php?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                return;
            }
            loadVoucherRules();
        }
    }
});