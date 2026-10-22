const API_BASE_URL = 'http://localhost:5129/api/v1';

// State aplikasi
let currentUser = null;
let searchResults = [];
let selectedProduct = null;
let cart = [];
let runningSequence = 1;

function formatRupiah(val) {
    if (val === null || val === undefined || isNaN(val)) return '0';
    return Number(val).toLocaleString('id-ID');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateClock() {
    const clockEl = document.getElementById('realtime-clock');
    if (!clockEl) return;
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${dateStr}, ${hours}.${minutes}.${seconds}`;
}

async function generateInvoiceNumber() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const dateCode = `${dd}${mm}${yy}`;

    const userIdStr = String(currentUser && currentUser.idUser ? currentUser.idUser : '00001');
    const userIdPadded = userIdStr.padStart(5, '0');

    const seqKey = `bm_seq_${userIdPadded}_${dateCode}`;
    let seq = parseInt(localStorage.getItem(seqKey) || '0', 10);

    if (seq === 0) {
        try {
            const todayIso = now.toISOString().split('T')[0];
            const res = await fetch(`${API_BASE_URL}/transactions?date=${todayIso}&userId=${userIdStr}`);
            if (res.ok) {
                const data = await res.json();
                const items = data.data || data.items || (Array.isArray(data) ? data : []);
                seq = items.length;
            }
        } catch (e) {
            console.warn('Could not query transactions count for invoice sequence:', e);
        }
    }

    seq += 1;
    localStorage.setItem(seqKey, seq.toString());

    const runningNumberStr = String(seq).padStart(3, '0');
    const invoiceNo = `${userIdPadded}${dateCode}${runningNumberStr}`;

    const invoiceEl = document.getElementById('invoice-no');
    if (invoiceEl) {
        invoiceEl.textContent = invoiceNo;
    }

    return invoiceNo;
}

async function loadPaymentMethods() {
    const paymentSelect = document.getElementById('payment-method');
    if (!paymentSelect) return;

    try {
        const res = await fetch(`${API_BASE_URL}/paymentmethod`);
        if (res.ok) {
            const methods = await res.json();
            if (Array.isArray(methods) && methods.length > 0) {
                paymentSelect.innerHTML = '';
                methods.forEach(pm => {
                    const opt = document.createElement('option');
                    opt.value = pm.idPaymentMethod;
                    opt.textContent = pm.methodName;
                    paymentSelect.appendChild(opt);
                });
            }
        }
    } catch (e) {
        console.warn('Gagal memuat payment methods dari API, menggunakan opsi default:', e);
    }
}

async function searchProducts(keyword) {
    const container = document.getElementById('search-result-container');
    const tbody = document.getElementById('search-table-body');

    if (!keyword) {
        if (container) container.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(keyword)}`);
        if (!res.ok) {
            alert('Gagal mengambil data produk dari server.');
            return;
        }

        searchResults = await res.json();

        const items = searchResults.slice(0, 150);

        tbody.innerHTML = '';
        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #94A3B8; padding: 14px;">
                        Barang tidak ditemukan.
                    </td>
                </tr>
            `;
        } else {
            items.forEach(prod => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${escapeHtml(prod.name)}</td>
                    <td>${prod.weight} g</td>
                    <td>${prod.stock}</td>
                    <td>Rp ${formatRupiah(prod.price)}</td>
                    <td>${prod.discount}%</td>
                    <td>
                        <button type="button" class="btn-primary btn-select" data-id="${prod.idProduct}">
                            Pilih
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        container.style.display = 'block';

        tbody.querySelectorAll('.btn-select').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const prod = searchResults.find(p => p.idProduct === id);
                if (prod) {
                    selectProduct(prod);
                }
            });
        });

    } catch (e) {
        console.error('Error saat search produk:', e);
        alert('Gagal terhubung ke API untuk pencarian barang.');
    }
}

function selectProduct(prod) {
    selectedProduct = prod;

    const selBox = document.getElementById('selected-box');
    const selName = document.getElementById('sel-name');
    const selPrice = document.getElementById('sel-price');
    const selStock = document.getElementById('sel-stock');
    const inputQty = document.getElementById('input-qty');
    const stockError = document.getElementById('stock-error');

    selName.textContent = prod.name;
    selPrice.textContent = `Rp ${formatRupiah(prod.price)}`;
    selStock.textContent = prod.stock;

    inputQty.value = '1';
    inputQty.min = '1';
    inputQty.max = prod.stock;

    stockError.style.display = 'none';
    selBox.style.display = 'block';

    inputQty.focus();
}


function addToCart() {
    if (!selectedProduct) return;

    const inputQty = document.getElementById('input-qty');
    const stockError = document.getElementById('stock-error');
    const qty = parseInt(inputQty.value, 10);

    if (isNaN(qty) || qty <= 0) {
        alert('Jumlah barang (qty) minimal 1.');
        return;
    }

    const existing = cart.find(item => item.idProduct === selectedProduct.idProduct);
    const alreadyInCart = existing ? existing.qty : 0;
    const totalQtyNeeded = alreadyInCart + qty;

    if (totalQtyNeeded > selectedProduct.stock) {
        stockError.textContent = 'Jumlah barang yang dimasukkan melebihi sisa stok.';
        stockError.style.display = 'block';
        return;
    }

    stockError.style.display = 'none';

    const discountPercent = selectedProduct.discount || 0;
    const unitPrice = selectedProduct.price;

    if (existing) {
        existing.qty = totalQtyNeeded;
        const gross = existing.price * existing.qty;
        existing.subtotal = Math.round(gross * (1 - (existing.discount / 100)));
    } else {
        const gross = unitPrice * qty;
        const subtotal = Math.round(gross * (1 - (discountPercent / 100)));
        cart.push({
            idProduct: selectedProduct.idProduct,
            name: selectedProduct.name,
            price: unitPrice,
            discount: discountPercent,
            qty: qty,
            subtotal: subtotal,
            stock: selectedProduct.stock
        });
    }

    document.getElementById('selected-box').style.display = 'none';
    selectedProduct = null;

    renderCart();
}

function renderCart() {
    const tbody = document.getElementById('cart-table-body');
    const totalDisplay = document.getElementById('total-price');

    if (cart.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #94A3B8; padding: 16px;">
                    No items in cart.
                </td>
            </tr>
        `;
        totalDisplay.textContent = 'Rp 0';
        return;
    }

    let grandTotal = 0;
    tbody.innerHTML = '';

    cart.forEach((item, index) => {
        grandTotal += item.subtotal;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>Rp ${formatRupiah(item.price)}</td>
            <td>${item.discount}%</td>
            <td>${item.qty}</td>
            <td>Rp ${formatRupiah(item.subtotal)}</td>
            <td>
                <button type="button" class="btn-danger btn-delete-cart" data-index="${index}">
                    Hapus
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    totalDisplay.textContent = `Rp ${formatRupiah(grandTotal)}`;

    // Pasang listener hapus barang
    tbody.querySelectorAll('.btn-delete-cart').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            if (!isNaN(index)) {
                cart.splice(index, 1);
                renderCart();
            }
        });
    });
}

async function submitTransaction() {
    if (cart.length === 0) {
        alert('Keranjang belanja masih kosong! Silakan pilih barang terlebih dahulu.');
        return;
    }

    const invoiceNo = document.getElementById('invoice-no').textContent.trim();
    const paymentMethodEl = document.getElementById('payment-method');
    const paymentMethodId = parseInt(paymentMethodEl.value, 10);
    const totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);

    const payload = {
        invoiceNo: invoiceNo,
        transactionDate: new Date().toISOString(),
        idUser: currentUser.idUser,
        idPaymentMethod: paymentMethodId,
        totalPrice: totalPrice,
        details: cart.map(item => ({
            idProduct: item.idProduct,
            qty: item.qty,
            price: item.price,
            discount: item.discount,
            subTotal: item.subtotal
        }))
    };

    try {
        const res = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.message || 'Gagal menyimpan transaksi.');
            return;
        }

        alert('Transaksi berhasil disimpan!');

        cart = [];
        renderCart();

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        const searchContainer = document.getElementById('search-result-container');
        if (searchContainer) searchContainer.style.display = 'none';

        const searchBody = document.getElementById('search-table-body');
        if (searchBody) searchBody.innerHTML = '';

        const selBox = document.getElementById('selected-box');
        if (selBox) selBox.style.display = 'none';

        selectedProduct = null;

        await generateInvoiceNumber();

    } catch (e) {
        console.error('Submit transaction error:', e);
        alert('Terjadi kesalahan jaringan saat menyimpan transaksi.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const userRaw = sessionStorage.getItem('bee_user');
    if (!userRaw) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userRaw);
    } catch {
        currentUser = {};
    }

    if (!currentUser.username) {
        window.location.href = 'login.html';
        return;
    }

    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
        userDisplay.textContent = `Role: ${currentUser.role || 'Cashier'} | Login: ${currentUser.username}`;
    }

    updateClock();
    setInterval(updateClock, 1000);

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('bee_user');
            window.location.href = 'login.html';
        });
    }

    await loadPaymentMethods();

    await generateInvoiceNumber();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchProducts(searchInput.value.trim());
            }
        });
    }

    const btnAddCart = document.getElementById('btn-add-cart');
    if (btnAddCart) {
        btnAddCart.addEventListener('click', addToCart);
    }


    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', submitTransaction);
    }
});
