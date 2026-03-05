'use client';
import { useEffect, useState, useCallback } from 'react';
import { ordersApi } from '@/lib/api';
import { Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
    id: number; total_amount: number; status: string; created_at: string;
    customer?: { name: string; email: string };
    seller?: { store_name_en: string };
    items_count?: number; coupon_discount?: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'badge-yellow', processing: 'badge-blue', shipped: 'badge-orange',
    delivered: 'badge-green', cancelled: 'badge-red', returned: 'badge-gray',
};
const NEXT_STATUS: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: [],
    cancelled: [],
    returned: [],
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Order | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ordersApi.list({ search, status, page, per_page: 15 });
            setOrders(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load orders'); }
        finally { setLoading(false); }
    }, [search, status, page]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await ordersApi.updateStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
            if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
            toast.success(`Order marked as ${newStatus}`);
        } catch { toast.error('Failed to update status'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Orders</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} total orders</p>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder="Search order ID or customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 160 }}>
                        <option value="">All Statuses</option>
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map(s => (
                            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr><th>Order</th><th>Customer</th><th>Seller</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: 700, color: '#FF6B00' }}>#{o.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{o.customer?.name || '—'}</div>
                                        <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{o.customer?.email}</div>
                                    </td>
                                    <td style={{ fontSize: '.85rem' }}>{o.seller?.store_name_en || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>{o.items_count ?? '—'}</td>
                                    <td style={{ fontWeight: 700 }}>${o.total_amount}</td>
                                    <td><span className={`badge-pill ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(o)}><Eye size={12} /></button>
                                            {(NEXT_STATUS[o.status] || []).map(ns => (
                                                <button key={ns} className={`btn btn-xs`}
                                                    style={{ background: ns === 'cancelled' || ns === 'returned' ? '#fee2e2' : '#dcfce7', color: ns === 'cancelled' || ns === 'returned' ? '#dc2626' : '#15803d', border: 'none', textTransform: 'capitalize' }}
                                                    onClick={() => updateStatus(o.id, ns)}>{ns}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!orders.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No orders found</td></tr>}
                        </tbody>
                    </table>
                )}
                {meta.last_page > 1 && (
                    <div style={{ padding: '16px 20px' }}>
                        <div className="pagination">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selected && (
                <div className="modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Order #{selected.id}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        {[['Customer', selected.customer?.name], ['Email', selected.customer?.email], ['Seller', selected.seller?.store_name_en],
                        ['Total', `$${selected.total_amount}`], ['Discount', selected.coupon_discount ? `$${selected.coupon_discount}` : '—'],
                        ['Status', selected.status], ['Date', new Date(selected.created_at).toLocaleString()]].map(([k, v]) => (
                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '.85rem' }}>{k}</span>
                                <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{String(v || '—')}</span>
                            </div>
                        ))}
                        {(NEXT_STATUS[selected.status] || []).length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '.875rem' }}>Update Status:</p>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {(NEXT_STATUS[selected.status] || []).map(ns => (
                                        <button key={ns} className="btn btn-primary btn-sm" style={{ background: ns === 'cancelled' || ns === 'returned' ? '#ef4444' : '#FF6B00', textTransform: 'capitalize' }}
                                            onClick={() => updateStatus(selected.id, ns)}>
                                            → {ns}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
