document.addEventListener('DOMContentLoaded', () => {
    loadPointsRules();
    loadVoucherRules();

    document.getElementById('savePointRuleBtn').addEventListener('click', async () => {
        const data = {
            min_amount: parseFloat(document.getElementById('minAmount').value),
            max_amount: document.getElementById('maxAmount').value ? parseFloat(document.getElementById('maxAmount').value) : null,
            points_earned: parseInt(document.getElementById('pointsEarned').value)
        };
        if (isNaN(data.min_amount) || isNaN(data.points_earned)) {
            alert('Vui lòng nhập số tiền và số điểm hợp lệ!');
            return;
        }
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
        closeModal('addPointRuleModal');
    });

    document.getElementById('saveVoucherRuleBtn').addEventListener('click', async () => {
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
        closeModal('addVoucherRuleModal');
    });

    document.getElementById('saveEditPointRuleBtn').addEventListener('click', async () => {
        const id = document.getElementById('editRuleId').value;
        const data = {
            min_amount: parseFloat(document.getElementById('editMinAmount').value),
            max_amount: document.getElementById('editMaxAmount').value ? parseFloat(document.getElementById('editMaxAmount').value) : null,
            points_earned: parseInt(document.getElementById('editPointsEarned').value)
        };
        if (isNaN(data.min_amount) || isNaN(data.points_earned)) {
            alert('Vui lòng nhập số tiền và số điểm hợp lệ!');
            return;
        }
        const response = await fetch(`http://localhost:81/SpicyNoodleProject/api/point_rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok) {
            alert(result.message || 'Có lỗi xảy ra!');
            return;
        }
        loadPointsRules();
        closeModal('editPointRuleModal');
    });

    document.getElementById('saveEditVoucherRuleBtn').addEventListener('click', async () => {
        const id = document.getElementById('editVoucherId').value;
        const data = {
            voucher_code: document.getElementById('editVoucherCode').value.trim(),
            point_require: parseInt(document.getElementById('editPointRequire').value),
            discount_percent: parseInt(document.getElementById('editDiscountPercent').value)
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
        const result = await response.json();
        if (!response.ok) {
            alert(result.message || 'Có lỗi xảy ra!');
            return;
        }
        loadVoucherRules();
        closeModal('editVoucherRuleModal');
    });
});

async function loadPointsRules() {
    const res = await fetch('http://localhost:81/SpicyNoodleProject/api/point_rules.php');
    if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        return;
    }
    const result = await res.json();
    const grid = document.getElementById('pointsGrid');
    grid.innerHTML = '';
    result.data.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <h5>Mức: ${rule.min_amount.toLocaleString('vi-VN')} - ${rule.max_amount ? rule.max_amount.toLocaleString('vi-VN') : '∞'} VNĐ</h5>
            <p>Điểm: ${rule.points_earned} điểm</p>
            <div class="actions">
                <button class="btn btn-warning btn-sm btn-action" onclick="editPointRule(${rule.rule_id})">Sửa</button>
                <button class="btn btn-danger btn-sm btn-action" onclick="deletePointRule(${rule.rule_id})">Xóa</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function loadVoucherRules() {
    const res = await fetch('http://localhost:81/SpicyNoodleProject/api/voucher_rules.php');
    if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        return;
    }
    const result = await res.json();
    const grid = document.getElementById('vouchersGrid');
    grid.innerHTML = '';
    result.data.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <h5>Mã: ${rule.voucher_code}</h5>
            <p>Điểm: ${rule.points_require} - Giảm: ${rule.discount_percent}%</p>
            <div class="actions">
                <button class="btn btn-warning btn-sm btn-action" onclick="editVoucherRule(${rule.voucher_id})">Sửa</button>
                <button class="btn btn-danger btn-sm btn-action" onclick="deleteVoucherRule(${rule.voucher_id})">Xóa</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function editPointRule(id) {
    const res = await fetch(`http://localhost:81/SpicyNoodleProject/api/point_rules.php?id=${id}`);
    if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        return;
    }
    const result = await res.json();
    const rule = result.data;
    document.getElementById('editRuleId').value = id;
    document.getElementById('editMinAmount').value = rule.min_amount;
    document.getElementById('editMaxAmount').value = rule.max_amount || '';
    document.getElementById('editPointsEarned').value = rule.points_earned;
    openModal('editPointRuleModal');
}

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

async function editVoucherRule(id) {
    const res = await fetch(`http://localhost:81/SpicyNoodleProject/api/voucher_rules.php?id=${id}`);
    if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        return;
    }
    const result = await res.json();
    const rule = result.data;
    document.getElementById('editVoucherId').value = id;
    document.getElementById('editVoucherCode').value = rule.voucher_code;
    document.getElementById('editPointRequire').value = rule.point_require;
    document.getElementById('editDiscountPercent').value = rule.discount_percent;
    openModal('editVoucherRuleModal');
}

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