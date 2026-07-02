let products = [];
let sales = [];
let withdrawals = [];
let invoice = [];
let selectedProduct = null;
let withdrawVerified = false;
let personalVerified = false;

let tempQty = 0;
let tempBuyPrice = 0;
let tempSellPrice = 0;

async function init() {
    products = await db.loadProducts();
    sales = await db.loadSales();
    withdrawals = await db.loadWithdrawals();
    
    if (products.length === 0) {
        products = [
            {id: 1, name: 'دفتر ۶۰ برگ', qty: 50, buyPrice: 15000, sellPrice: 25000, buyHistory: [{price: 15000, date: '۱۴۰۲/۰۱/۰۱'}]},
            {id: 2, name: 'مداد HB', qty: 100, buyPrice: 5000, sellPrice: 8000, buyHistory: [{price: 5000, date: '۱۴۰۲/۰۱/۰۱'}]},
            {id: 3, name: 'خودکار آبی', qty: 30, buyPrice: 7000, sellPrice: 12000, buyHistory: [{price: 7000, date: '۱۴۰۲/۰۱/۰۱'}]}
        ];
        for (const p of products) await db.saveProduct(p);
    }
    
    updateInvoice();
    updateInventory();
    updateHistory();
}

function saveData() {}

function getTotalInventory() { return products.reduce((sum, p) => sum + (p.qty * p.sellPrice), 0); }
function getTotalCost() { return products.reduce((sum, p) => sum + (p.qty * p.buyPrice), 0); }

function openPriceModal(varName, title) {
    const currentVal = varName === 'newProductBuyPrice' ? tempBuyPrice : tempSellPrice;
    let modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'numModal';
    modal.innerHTML = '<div class="modal-box"><h3>' + title + '</h3><p>مبلغ را به تومان وارد کنید</p>' +
        '<input type="number" id="modalInput" value="' + (currentVal || '') + '" placeholder="مثلاً 25000">' +
        '<button onclick="saveNumModal(\'' + varName + '\')" style="background:#27ae60;">تأیید</button>' +
        '<button onclick="closeNumModal()" style="background:#95a5a6;">انصراف</button></div>';
    document.body.appendChild(modal);
    setTimeout(() => { document.getElementById('modalInput').focus(); document.getElementById('modalInput').select(); }, 200);
}

function openQtyModal(varName, title) {
    let modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'numModal';
    modal.innerHTML = '<div class="modal-box"><h3>' + title + '</h3><p>تعداد را وارد کنید</p>' +
        '<input type="number" id="modalInput" value="' + (tempQty || '') + '" placeholder="مثلاً 10">' +
        '<button onclick="saveNumModal(\'' + varName + '\')" style="background:#27ae60;">تأیید</button>' +
        '<button onclick="closeNumModal()" style="background:#95a5a6;">انصراف</button></div>';
    document.body.appendChild(modal);
    setTimeout(() => { document.getElementById('modalInput').focus(); document.getElementById('modalInput').select(); }, 200);
}

function closeNumModal() { const m = document.getElementById('numModal'); if (m) m.remove(); }

function saveNumModal(varName) {
    const val = parseInt(document.getElementById('modalInput').value);
    if (!val && val !== 0) return;
    if (varName === 'newProductQty') tempQty = val;
    else if (varName === 'newProductBuyPrice') tempBuyPrice = val;
    else if (varName === 'newProductSellPrice') tempSellPrice = val;
    document.getElementById('showQty').textContent = tempQty || '-';
    document.getElementById('showBuyPrice').textContent = tempBuyPrice ? tempBuyPrice.toLocaleString('fa-IR') : '-';
    document.getElementById('showSellPrice').textContent = tempSellPrice ? tempSellPrice.toLocaleString('fa-IR') : '-';
    closeNumModal();
}

function openPriceEditModal(productId) {
    const product = products.find(p => p.id === productId);
    let modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'priceEditModal';
    modal.innerHTML = '<div class="modal-box"><h3>تغییر قیمت</h3><p><strong>' + product.name + '</strong></p>' +
        '<p>قیمت فعلی: ' + product.sellPrice.toLocaleString('fa-IR') + ' تومان</p>' +
        '<input type="number" id="modalPriceInput" value="' + product.sellPrice + '" placeholder="قیمت جدید">' +
        '<button onclick="savePriceFromModal(' + productId + ')" style="background:#27ae60;">ذخیره</button>' +
        '<button onclick="closePriceEditModal()" style="background:#95a5a6;">انصراف</button></div>';
    document.body.appendChild(modal);
    setTimeout(() => { document.getElementById('modalPriceInput').focus(); document.getElementById('modalPriceInput').select(); }, 200);
}

function closePriceEditModal() { const m = document.getElementById('priceEditModal'); if (m) m.remove(); }

async function savePriceFromModal(productId) {
    const product = products.find(p => p.id === productId);
    const newPrice = parseInt(document.getElementById('modalPriceInput').value);
    if (newPrice) { product.sellPrice = newPrice; await db.saveProduct(product); }
    closePriceEditModal();
    searchProduct('price');
}

function openExistingModal(productId) {
    const product = products.find(p => p.id === productId);
    let modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'existingModal';
    modal.innerHTML = '<div class="modal-box"><h3>افزایش موجودی</h3><p><strong>' + product.name + '</strong></p>' +
        '<p>موجودی فعلی: ' + product.qty + '</p>' +
        '<input type="number" id="modalExistingQty" placeholder="تعداد اضافه شده">' +
        '<input type="number" id="modalExistingPrice" placeholder="قیمت خرید جدید (تومان)" value="' + product.buyPrice + '">' +
        '<button onclick="saveExistingModal(' + productId + ')" style="background:#27ae60;">ثبت</button>' +
        '<button onclick="closeExistingModal()" style="background:#95a5a6;">انصراف</button></div>';
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('modalExistingQty').focus(), 200);
}

function closeExistingModal() { const m = document.getElementById('existingModal'); if (m) m.remove(); }

async function saveExistingModal(productId) {
    const product = products.find(p => p.id === productId);
    const qty = parseInt(document.getElementById('modalExistingQty').value);
    const price = parseInt(document.getElementById('modalExistingPrice').value);
    if (!qty || !price) return alert('همه موارد را پر کنید');
    product.qty += qty;
    product.buyPrice = price;
    product.buyHistory.push({price: price, date: new Date().toLocaleDateString('fa-IR')});
    await db.saveProduct(product);
    alert('موجودی افزایش یافت');
    closeExistingModal();
    searchProduct('existing');
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'inventory') updateInventory();
    if (pageId === 'history') updateHistory();
    if (pageId === 'withdraw') {
        withdrawVerified = false;
        document.getElementById('withdrawPin').value = '';
        document.getElementById('withdrawSection').classList.add('hidden');
    }
    if (pageId === 'personal') {
        personalVerified = false;
        document.getElementById('personalPin').value = '';
        document.getElementById('personalSection').classList.add('hidden');
    }
}

function verifyWithdrawPin() {
    if (document.getElementById('withdrawPin').value === PIN) {
        withdrawVerified = true;
        document.getElementById('withdrawSection').classList.remove('hidden');
    } else { alert('رمز اشتباه است'); }
}

function verifyPersonalPin() {
    if (document.getElementById('personalPin').value === PIN) {
        personalVerified = true;
        document.getElementById('personalSection').classList.remove('hidden');
        showPersonalPage('summary');
    } else { alert('رمز اشتباه است'); }
}

function requirePin(title, callback) {
    const pin = prompt(title + '\nرمز ۴ رقمی:');
    if (pin === PIN) callback();
    else if (pin !== null) alert('رمز اشتباه است');
}

function showPersonalPage(page) {
    if (!personalVerified) return;
    const content = document.getElementById('personalContent');
    content.innerHTML = '';
    
    if (page === 'summary') {
        const ti = getTotalInventory(), tc = getTotalCost(), tp = ti - tc;
        content.innerHTML = '<div class="summary-box"><h4>خلاصه مالی</h4>' +
            '<p><strong>موجودی کل (قیمت فروش):</strong> ' + ti.toLocaleString('fa-IR') + ' تومان</p>' +
            '<p><strong>سرمایه کل (قیمت خرید):</strong> ' + tc.toLocaleString('fa-IR') + ' تومان</p>' +
            '<p><strong>سود خالص:</strong> ' + tp.toLocaleString('fa-IR') + ' تومان</p>' +
            '<p style="font-size:12px;">تعداد اقلام: ' + products.length + ' | کل تعداد: ' + products.reduce((s,p) => s+p.qty, 0) + '</p></div>';
    } else if (page === 'dailyProfit') {
        const today = new Date().toISOString().split('T')[0];
        const ts = sales.filter(s => s.date === today);
        const tls = ts.reduce((s, x) => s + x.total, 0);
        const tcs = ts.reduce((s, x) => s + x.items.reduce((is, i) => { const p = products.find(pp => pp.id === i.id); return is + (p ? p.buyPrice * i.qty : 0); }, 0), 0);
        content.innerHTML = '<div class="profit">سود امروز: ' + (tls - tcs).toLocaleString('fa-IR') + ' تومان</div>';
    } else if (page === 'monthlyProfit') {
        const n = new Date(), m = n.getMonth()+1, y = n.getFullYear();
        const ms = sales.filter(s => { const d = new Date(s.date); return d.getMonth()+1 === m && d.getFullYear() === y; });
        const tls = ms.reduce((s, x) => s + x.total, 0);
        const tcs = ms.reduce((s, x) => s + x.items.reduce((is, i) => { const p = products.find(pp => pp.id === i.id); return is + (p ? p.buyPrice * i.qty : 0); }, 0), 0);
        content.innerHTML = '<div class="profit">سود این ماه: ' + (tls - tcs).toLocaleString('fa-IR') + ' تومان</div>';
    } else if (page === 'yearlyProfit') {
        const y = new Date().getFullYear();
        const ys = sales.filter(s => new Date(s.date).getFullYear() === y);
        const tls = ys.reduce((s, x) => s + x.total, 0);
        const tcs = ys.reduce((s, x) => s + x.items.reduce((is, i) => { const p = products.find(pp => pp.id === i.id); return is + (p ? p.buyPrice * i.qty : 0); }, 0), 0);
        content.innerHTML = '<div class="profit">سود امسال: ' + (tls - tcs).toLocaleString('fa-IR') + ' تومان</div>';
    } else if (page === 'bulkPrice') {
        content.innerHTML = '<h4>تغییر قیمت کلی</h4><div class="summary-box">' +
            '<p>انتخاب کنید:</p>' +
            '<button onclick="openBulkPriceModal(\'amount\')" style="background:#3498db;">➕ اضافه کردن مبلغ ثابت</button>' +
            '<button onclick="openBulkPriceModal(\'percent\')" style="background:#e67e22;">📊 افزایش درصدی</button>' +
            '<button onclick="openBulkPriceModal(\'decrease\')" style="background:#e74c3c;">➖ کاهش درصدی</button></div>';
    } else if (page === 'archive') {
        let html = '<h4>بایگانی قیمت‌های خرید</h4>';
        products.forEach(p => {
            html += '<div style="margin-bottom:15px;padding:10px;background:#f9f9f9;border-radius:5px;"><strong>' + p.name + '</strong> - قیمت فروش: ' + p.sellPrice.toLocaleString('fa-IR') + ' تومان<br>تاریخچه خرید:' + p.buyHistory.map(h => '<br>' + h.date + ': ' + h.price.toLocaleString('fa-IR') + ' تومان').join('') + '<br><button onclick="editSellPriceFromArchive(' + p.id + ')" style="width:auto;padding:5px 10px;margin-top:5px;">تغییر قیمت فروش</button></div>';
        });
        content.innerHTML = html;
    } else if (page === 'buyPrice') {
        content.innerHTML = '<h4>ثبت قیمت خرید جدید</h4><input type="text" id="archiveSearch" placeholder="جستجوی کالا..." oninput="searchInArchive()"><div id="archiveSearchResults"></div>';
    }
}

function openBulkPriceModal(type) {
    let title = '', placeholder = '';
    if (type === 'amount') { title = 'افزایش مبلغ ثابت'; placeholder = 'مثلاً 5000'; }
    else if (type === 'percent') { title = 'افزایش درصدی'; placeholder = 'مثلاً 20'; }
    else { title = 'کاهش درصدی'; placeholder = 'مثلاً 10'; }
    let modal = document.createElement('div');
    modal.className = 'modal'; modal.id = 'bulkModal';
    modal.innerHTML = '<div class="modal-box"><h3>' + title + '</h3><p>روی همه ' + products.length + ' کالا</p>' +
        '<input type="number" id="bulkValue" placeholder="' + placeholder + '">' +
        '<button onclick="applyBulkPrice(\'' + type + '\')" style="background:#27ae60;">اعمال</button>' +
        '<button onclick="closeBulkModal()" style="background:#e74c3c;">انصراف</button></div>';
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('bulkValue').focus(), 200);
}

function closeBulkModal() { const m = document.getElementById('bulkModal'); if (m) m.remove(); }

async function applyBulkPrice(type) {
    const val = parseInt(document.getElementById('bulkValue').value);
    if (!val) return alert('مقدار را وارد کنید');
    requirePin('برای تغییر قیمت کلی', async function() {
        for (const p of products) {
            if (type === 'amount') p.sellPrice += val;
            else if (type === 'percent') p.sellPrice = Math.round(p.sellPrice * (1 + val/100));
            else p.sellPrice = Math.round(p.sellPrice * (1 - val/100));
            if (p.sellPrice < 0) p.sellPrice = 0;
            await db.saveProduct(p);
        }
        alert('قیمت ' + products.length + ' کالا تغییر کرد');
        closeBulkModal();
    });
}

function searchProduct(type) {
    const query = type === 'sell' ? document.getElementById('searchSell').value :
                  type === 'inventory' ? document.getElementById('searchInventory').value :
                  type === 'price' ? document.getElementById('searchPrice').value :
                  document.getElementById('searchExisting').value;
    const results = products.filter(p => p.name.includes(query));
    let html = '';
    results.forEach(p => {
        if (type === 'sell') html += '<div class="list-item"><span>' + p.name + ' (موجودی: ' + p.qty + ')</span><span>' + p.sellPrice.toLocaleString('fa-IR') + ' تومان</span><button class="small" onclick="addToInvoice(' + p.id + ')">+</button></div>';
        else if (type === 'inventory') {
            const w = p.qty <= 3 ? '<span class="warning">⚠ فقط ' + p.qty + ' عدد!</span>' : '';
            html += '<div class="list-item"><div><span>' + p.name + ' ' + w + '</span><br><small>موجودی: ' + p.qty + ' | قیمت خرید: ' + p.buyPrice.toLocaleString('fa-IR') + ' | فروش: ' + p.sellPrice.toLocaleString('fa-IR') + ' تومان</small></div><div class="action-btns"><button class="small" onclick="changeInventoryQty(' + p.id + ',1)">+</button><button class="small" onclick="changeInventoryQty(' + p.id + ',-1)">-</button><button class="small red" onclick="deleteProduct(' + p.id + ')">حذف</button></div></div>';
        } else if (type === 'price') html += '<div class="list-item" onclick="openPriceEditModal(' + p.id + ')"><span>' + p.name + '</span><span>قیمت: ' + p.sellPrice.toLocaleString('fa-IR') + ' تومان</span></div>';
        else if (type === 'existing') html += '<div class="list-item"><span>' + p.name + ' (موجودی: ' + p.qty + ')</span><button class="small green" onclick="openExistingModal(' + p.id + ')">+ افزایش</button></div>';
    });
    const target = type === 'sell' ? 'searchResultsSell' : type === 'inventory' ? 'inventoryList' : type === 'price' ? 'priceResults' : 'existingResults';
    document.getElementById(target).innerHTML = html || 'کالایی یافت نشد';
}

async function changeInventoryQty(productId, delta) {
    requirePin('برای تغییر موجودی', async function() {
        const p = products.find(pp => pp.id === productId);
        if (p) { p.qty += delta; if (p.qty < 0) p.qty = 0; await db.saveProduct(p); updateInventory(); }
    });
}

async function deleteProduct(productId) {
    requirePin('برای حذف کالا', async function() {
        if (confirm('حذف شود؟')) { products = products.filter(p => p.id !== productId); await db.deleteProduct(productId); updateInventory(); }
    });
}

function addToInvoice(productId) {
    const p = products.find(pp => pp.id === productId);
    const existing = invoice.find(i => i.id === productId);
    if (existing) existing.qty++; else invoice.push({id: productId, name: p.name, price: p.sellPrice, qty: 1});
    updateInvoice();
}

function removeFromInvoice(productId) { invoice = invoice.filter(i => i.id !== productId); updateInvoice(); }

function changeInvoiceQty(productId, delta) {
    const item = invoice.find(i => i.id === productId);
    if (item) { item.qty += delta; if (item.qty <= 0) removeFromInvoice(productId); else updateInvoice(); }
}

function updateInvoice() {
    let html = '', total = 0;
    invoice.forEach(item => {
        html += '<div class="invoice-item"><span>' + item.name + '</span><div class="qty-control"><button class="small" onclick="changeInvoiceQty(' + item.id + ',-1)">-</button><span>' + item.qty + '</span><button class="small" onclick="changeInvoiceQty(' + item.id + ',1)">+</button></div><span>' + (item.price*item.qty).toLocaleString('fa-IR') + ' تومان</span><button class="small red" onclick="removeFromInvoice(' + item.id + ')">✕</button></div>';
        total += item.price * item.qty;
    });
    document.getElementById('invoice').innerHTML = html || 'خالی';
    document.getElementById('totalPrice').textContent = total.toLocaleString('fa-IR');
}

async function submitSale() {
    if (invoice.length === 0) return alert('فاکتور خالی است');
    const total = invoice.reduce((s, i) => s + i.price*i.qty, 0);
    const sale = { id: Date.now(), date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString('fa-IR'), items: invoice.map(i => ({id:i.id, name:i.name, price:i.price, qty:i.qty})), total };
    sales.unshift(sale);
    for (const i of invoice) { const p = products.find(pp => pp.id === i.id); if (p) { p.qty -= i.qty; await db.saveProduct(p); } }
    await db.saveSale(sale);
    invoice = [];
    updateInvoice();
    alert('فروش ثبت شد');
}

async function addNewProduct() {
    const name = document.getElementById('newProductName').value;
    if (!name) return alert('نام را وارد کنید');
    if (!tempQty || !tempBuyPrice || !tempSellPrice) return alert('همه موارد را وارد کنید');
    if (products.find(p => p.name === name)) return alert('کالا تکراری است');
    const p = { id: Date.now(), name, qty: tempQty, buyPrice: tempBuyPrice, sellPrice: tempSellPrice, buyHistory: [{price: tempBuyPrice, date: new Date().toLocaleDateString('fa-IR')}] };
    products.push(p);
    await db.saveProduct(p);
    alert('کالا اضافه شد');
    document.getElementById('newProductName').value = '';
    tempQty = 0; tempBuyPrice = 0; tempSellPrice = 0;
    document.getElementById('showQty').textContent = '-';
    document.getElementById('showBuyPrice').textContent = '-';
    document.getElementById('showSellPrice').textContent = '-';
}

function searchWithdrawProduct() {
    if (!withdrawVerified) return;
    const query = document.getElementById('searchWithdraw').value;
    const results = products.filter(p => p.name.includes(query));
    let html = '';
    results.forEach(p => { html += '<div class="list-item"><span>' + p.name + ' (موجودی: ' + p.qty + ')</span><button class="small orange" onclick="withdrawProduct(' + p.id + ')">برداشت</button></div>'; });
    document.getElementById('withdrawResults').innerHTML = html || 'کالایی یافت نشد';
}

async function withdrawProduct(productId) {
    if (!withdrawVerified) return;
    const p = products.find(pp => pp.id === productId);
    const qty = prompt('چند عدد؟ (موجودی: ' + p.qty + ')');
    if (!qty || parseInt(qty) <= 0) return;
    if (parseInt(qty) > p.qty) return alert('موجودی کافی نیست');
    const reason = prompt('علت:');
    p.qty -= parseInt(qty);
    const w = { id: Date.now(), productId, productName: p.name, qty: parseInt(qty), reason: reason || 'بدون علت', date: new Date().toLocaleDateString('fa-IR'), time: new Date().toLocaleTimeString('fa-IR') };
    withdrawals.push(w);
    await db.saveProduct(p);
    await db.saveWithdrawal(w);
    alert('برداشت ثبت شد');
    searchWithdrawProduct();
}

function updateInventory() { searchProduct('inventory'); }

function updateHistory() {
    const filterDate = document.getElementById('filterDate').value;
    let filtered = filterDate ? sales.filter(s => s.date === filterDate) : sales;
    let html = '';
    if (filtered.length === 0) html = '<p style="text-align:center;color:#95a5a6;">موردی یافت نشد</p>';
    else filtered.slice(0,100).forEach(s => {
        html += '<div class="sale-detail" onclick="toggleSaleDetail(' + s.id + ')"><strong>' + s.date + ' - ' + s.time + '</strong><br>' + s.items.map(i => i.name + ' (' + i.qty + ')').join('، ') + '<br><span style="color:#27ae60;">مبلغ: ' + s.total.toLocaleString('fa-IR') + ' تومان</span></div><div class="detail-popup hidden" id="saleDetail' + s.id + '"><strong>جزئیات:</strong><br>' + s.items.map(i => '<div>' + i.name + ': ' + i.qty + ' × ' + i.price.toLocaleString('fa-IR') + ' = ' + (i.qty*i.price).toLocaleString('fa-IR') + ' تومان</div>').join('') + '<br><button class="small red" onclick="event.stopPropagation();deleteSale(' + s.id + ')">🗑 حذف</button></div>';
    });
    document.getElementById('salesHistory').innerHTML = html;
}

function clearDateFilter() { document.getElementById('filterDate').value = ''; updateHistory(); }

function toggleSaleDetail(saleId) {
    const d = document.getElementById('saleDetail' + saleId);
    document.querySelectorAll('.detail-popup').forEach(x => x.classList.add('hidden'));
    if (d.classList.contains('hidden')) d.classList.remove('hidden'); else d.classList.add('hidden');
}

async function deleteSale(saleId) {
    requirePin('برای حذف فروش', async function() {
        if (confirm('حذف شود؟')) {
            const sale = sales.find(s => s.id === saleId);
            if (sale) { for (const i of sale.items) { const p = products.find(pp => pp.id === i.id); if (p) { p.qty += i.qty; await db.saveProduct(p); } } }
            sales = sales.filter(s => s.id !== saleId);
            await db.deleteSale(saleId);
            updateHistory();
            alert('حذف شد و موجودی برگشت');
        }
    });
}

function searchInArchive() {
    if (!personalVerified) return;
    const query = document.getElementById('archiveSearch').value;
    const results = products.filter(p => p.name.includes(query));
    let html = '';
    results.forEach(p => { html += '<div class="list-item" onclick="addBuyPrice(' + p.id + ')"><span>' + p.name + '</span><span>آخرین خرید: ' + p.buyPrice.toLocaleString('fa-IR') + ' تومان</span></div>'; });
    document.getElementById('archiveSearchResults').innerHTML = html || 'یافت نشد';
}

async function addBuyPrice(productId) {
    const p = products.find(pp => pp.id === productId);
    const price = prompt('قیمت خرید جدید:', p.buyPrice);
    if (price) { p.buyPrice = parseInt(price); p.buyHistory.push({price: parseInt(price), date: new Date().toLocaleDateString('fa-IR')}); await db.saveProduct(p); }
}

async function editSellPriceFromArchive(productId) {
    const p = products.find(pp => pp.id === productId);
    const price = prompt('قیمت فروش جدید:', p.sellPrice);
    if (price) { p.sellPrice = parseInt(price); await db.saveProduct(p); showPersonalPage('archive'); }
}

init();