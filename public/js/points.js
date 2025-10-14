document.addEventListener('DOMContentLoaded', () => {
    loadPointsRules();
    loadVoucherRules();

    document.getElementById('savePointRuleBtn').addEventListener('click', async () => {
        const data = {
            min_amount: parseFloat(document.getElementById('minAmount').value),
            max_amount: document.getElementById('maxAmount').value ? parseFloat(document.getElementById('maxAmount').value) : null,
            points_earned: parseInt(document.getElementById('pointsEarned').value)
        };
        await fetch('http://localhost:81/SpicyNoodleProject/api/points/rules.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => {
            loadPointsRules();
            $('#addPointRuleModal').modal('hide');
        });
    });

    document.getElementById('saveVoucherRuleBtn').addEventListener('click', async () => {
        const data = {
            voucher_code: document.getElementById('voucherCode').value,
            point_require: parseInt(document.getElementById('pointRequire').value),
            discount_percent: parseInt(document.getElementById('discountPercent').value)
        };
        await fetch('http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => {
            loadVoucherRules();
            $('#addVoucherRuleModal').modal('hide');
        });
    });

    document.getElementById('saveEditPointRuleBtn').addEventListener('click', async () => {
        const id = document.getElementById('editRuleId').value;
        const data = {
            min_amount: parseFloat(document.getElementById('editMinAmount').value),
            max_amount: document.getElementById('editMaxAmount').value ? parseFloat(document.getElementById('editMaxAmount').value) : null,
            points_earned: parseInt(document.getElementById('editPointsEarned').value)
        };
        await fetch(`http://localhost:81/SpicyNoodleProject/api/points/rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => {
            loadPointsRules();
            $('#editPointRuleModal').modal('hide');
        });
    });

    document.getElementById('saveEditVoucherRuleBtn').addEventListener('click', async () => {
        const id = document.getElementById('editVoucherId').value;
        const data = {
            voucher_code: document.getElementById('editVoucherCode').value,
            point_require: parseInt(document.getElementById('editPointRequire').value),
            discount_percent: parseInt(document.getElementById('editDiscountPercent').value)
        };
        await fetch(`http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(() => {
            loadVoucherRules();
            $('#editVoucherRuleModal').modal('hide');
        });
    });
});

async function loadPointsRules() {
    const res = await fetch('http://localhost:81/SpicyNoodleProject/api/points/rules.php');
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
    const res = await fetch('http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php');
    const result = await res.json();
    const grid = document.getElementById('vouchersGrid');
    grid.innerHTML = '';
    result.data.forEach(rule => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <h5>Mã: ${rule.voucher_code}</h5>
            <p>Điểm: ${rule.point_require} - Giảm: ${rule.discount_percent}%</p>
            <div class="actions">
                <button class="btn btn-warning btn-sm btn-action" onclick="editVoucherRule(${rule.voucher_id})">Sửa</button>
                <button class="btn btn-danger btn-sm btn-action" onclick="deleteVoucherRule(${rule.voucher_id})">Xóa</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function editPointRule(id) {
    const res = await fetch(`http://localhost:81/SpicyNoodleProject/api/points/rules.php?id=${id}`);
    const result = await res.json();
    const rule = result.data;
    document.getElementById('editRuleId').value = id;
    document.getElementById('editMinAmount').value = rule.min_amount;
    document.getElementById('editMaxAmount').value = rule.max_amount || '';
    document.getElementById('editPointsEarned').value = rule.points_earned;
    $('#editPointRuleModal').modal('show');
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
    const res = await fetch(`http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php?id=${id}`);
    const result = await res.json();
    const rule = result.data;
    document.getElementById('editVoucherId').value = id;
    document.getElementById('editVoucherCode').value = rule.voucher_code;
    document.getElementById('editPointRequire').value = rule.point_require;
    document.getElementById('editDiscountPercent').value = rule.discount_percent;
    $('#editVoucherRuleModal').modal('show');
}

async function deleteVoucherRule(id) {
    if (confirm('Bạn có chắc muốn xóa voucher này?')) {
        await fetch(`http://localhost:81/SpicyNoodleProject/api/vouchers/rules.php?id=${id}`, {
            method: 'DELETE'
        });
        loadVoucherRules();
    }
}