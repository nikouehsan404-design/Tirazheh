// Database Functions
const db = {
    async loadProducts() {
        const { data } = await supabase.from('products').select('*');
        return data || [];
    },

    async saveProduct(p) {
        await supabase.from('products').upsert({
            id: p.id,
            name: p.name,
            qty: p.qty,
            buy_price: p.buyPrice,
            sell_price: p.sellPrice,
            buy_history: p.buyHistory
        });
    },

    async deleteProduct(id) {
        await supabase.from('products').delete().eq('id', id);
    },

    async loadSales() {
        const { data } = await supabase
            .from('sales')
            .select('*')
            .order('id', { ascending: false });

        return data || [];
    },

    async saveSale(s) {
        await supabase.from('sales').insert({
            id: s.id,
            date: s.date,
            time: s.time,
            items: s.items,
            total: s.total
        });
    },

    async deleteSale(id) {
        await supabase.from('sales').delete().eq('id', id);
    },

    async loadWithdrawals() {
        const { data } = await supabase.from('withdrawals').select('*');
        return data || [];
    },

    async saveWithdrawal(w) {
        await supabase.from('withdrawals').insert({
            id: w.id,
            product_id: w.productId,
            product_name: w.productName,
            qty: w.qty,
            reason: w.reason,
            date: w.date,
            time: w.time
        });
    }
};