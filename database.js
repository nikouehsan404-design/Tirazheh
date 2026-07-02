// Database Functions (نسخه دیباگ - خطاها رو نشون میده)
const db = {
    async loadProducts() {
        const { data, error } = await supabase.from('products').select('*');
        if (error) alert('خطای بارگذاری کالاها: ' + error.message);
        return data || [];
    },

    async saveProduct(p) {
        const { error } = await supabase.from('products').upsert({
            id: p.id,
            name: p.name,
            qty: p.qty,
            buy_price: p.buyPrice,
            sell_price: p.sellPrice,
            buy_history: p.buyHistory
        });
        if (error) alert('خطای ذخیره کالا: ' + error.message);
    },

    async deleteProduct(id) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert('خطای حذف کالا: ' + error.message);
    },

    async loadSales() {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('id', { ascending: false });
        if (error) alert('خطای بارگذاری فروش‌ها: ' + error.message);
        return data || [];
    },

    async saveSale(s) {
        const { error } = await supabase.from('sales').insert({
            id: s.id,
            date: s.date,
            time: s.time,
            items: s.items,
            total: s.total
        });
        if (error) alert('خطای ذخیره فروش: ' + error.message);
    },

    async deleteSale(id) {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) alert('خطای حذف فروش: ' + error.message);
    },

    async loadWithdrawals() {
        const { data, error } = await supabase.from('withdrawals').select('*');
        if (error) alert('خطای بارگذاری برداشت‌ها: ' + error.message);
        return data || [];
    },

    async saveWithdrawal(w) {
        const { error } = await supabase.from('withdrawals').insert({
            id: w.id,
            product_id: w.productId,
            product_name: w.productName,
            qty: w.qty,
            reason: w.reason,
            date: w.date,
            time: w.time
        });
        if (error) alert('خطای ذخیره برداشت: ' + error.message);
    }
};

// چک اولیه که آیا کتابخانه Supabase و متغیرها درست لود شدن
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.supabase === 'undefined') {
            alert('خطا: کتابخانه Supabase لود نشد! (احتمالاً اینترنت وصل نیست یا لینک CDN مشکل داره)');
        } else if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_KEY === 'undefined') {
            alert('خطا: فایل config.js لود نشد!');
        } else if (typeof supabase === 'undefined' || !supabase.from) {
            alert('خطا: اتصال supabase ساخته نشد! فایل supabase.js رو چک کن.');
        }
    }, 1500);
});
