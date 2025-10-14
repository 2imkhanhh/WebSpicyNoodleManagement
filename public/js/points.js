document.addEventListener('DOMContentLoaded', () => {
    loadPointsRules();
    loadVoucherRules();

    document.getElementById('pointsRuleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            min_amount: parseFloat(document.getElementById('minAmount').value),
            max_amount: document.getElementById('maxAmount').value ? parseFloat(document.getElementById('maxAmount').value) : null,
            points_earned: parseInt(document.getElementById('pointsEarned').value)
        };
        await fetch('http://localhost:81/SpicyNoodleProject/api/points/rules.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        loadPointsRules();
    });

    document.getElementById('voucherRuleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            voucher_code: document.getElementById('voucherCode').value,
            point_require: parseInt(document.getElementById('pointRequire').value),
            discount_percent: parseInt(document.getElementById('discountPercent').value)
        };
        await fetch('http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        loadVoucherRules();
    });
});

async function loadPointsRules() {
    const res = await fetch('http://localhost:81/SpicyNoodleProject/api/points/rules.php');
    const result = await res.json();
    const tbody = document.getElementById('pointsTable');
    tbody.innerHTML = '';
    result.data.forEach(rule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rule.min_amount.toLocaleString('vi-VN')} VNĐ</td>
            <td>${rule.max_amount ? rule.max_amount.toLocaleString('vi-VN') : '∞'} VNĐ</td>
            <td>${rule.points_earned} điểm</td>
            <td>
                <button class="btn btn-sm btn-warning edit-btn" onclick="editPointRule(${rule.rule_id})">Sửa</button>
                <button class="btn btn-sm btn-danger delete-btn" onclick="deletePointRule(${rule.rule_id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadVoucherRules() {
    const res = await fetch('http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php');
    const result = await res.json();
    const tbody = document.getElementById('voucherTable');
    tbody.innerHTML = '';
    result.data.forEach(rule => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${rule.point_require} điểm</td>
            <td>${rule.discount_percent}%</td>
            <td>${rule.voucher_code}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-btn" onclick="editVoucherRule(${rule.voucher_id})">Sửa</button>
                <button class="btn btn-sm btn-danger delete-btn" onclick="deleteVoucherRule(${rule.voucher_id})">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Placeholder functions (to be implemented)
async function editPointRule(id) {
    const minAmount = prompt('Nhập số tiền tối thiểu (VNĐ):');
    const maxAmount = prompt('Nhập số tiền tối đa (VNĐ, để trống nếu không giới hạn):');
    const pointsEarned = prompt('Nhập số điểm tích được:');
    if (minAmount && pointsEarned) {
        await fetch(`http://localhost:81/SpicyNoodleProject/api/points/rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                min_amount: parseFloat(minAmount),
                max_amount: maxAmount ? parseFloat(maxAmount) : null,
                points_earned: parseInt(pointsEarned)
            })
        });
        loadPointsRules();
    }
}

async function deletePointRule(id) {
    if (confirm('Bạn có chắc muốn xóa quy định này?')) {
        await fetch(`http://localhost:81/SpicyNoodleProject/api/points/rules.php?id=${id}`, {
            method: 'DELETE'
        });
        loadPointsRules();
    }
}

async function editVoucherRule(id) {
    const pointRequire = prompt('Nhập số điểm cần đổi:');
    const discountPercent = prompt('Nhập phần trăm giảm giá (%):');
    const voucherCode = prompt('Nhập mã voucher:');
    if (pointRequire && discountPercent && voucherCode) {
        await fetch(`http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                point_require: parseInt(pointRequire),
                discount_percent: parseInt(discountPercent),
                voucher_code: voucherCode
            })
        });
        loadVoucherRules();
    }
}

async function deleteVoucherRule(id) {
    if (confirm('Bạn có chắc muốn xóa voucher này?')) {
        await fetch(`http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php?id=${id}`, {
            method: 'DELETE'
        });
        loadVoucherRules();
    }
}