'use client';
import { useEffect, useState, useCallback } from 'react';
import { ordersApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
    id: number; total: number; status: string; created_at: string;
    customer?: { name: string; email: string };
    seller?: { store_name: string };
    items_count?: number; coupon_discount?: number;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'badge-yellow', processing: 'badge-blue', shipped: 'badge-orange',
    delivered: 'badge-green', cancelled: 'badge-red', refunded: 'badge-gray',
};
const ALL_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Order | null>(null);
    const { t } = useI18n();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ordersApi.list({ search, status, page, per_page: 15 });
            setOrders(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load orders'); }
        finally { setLoading(false); }
    }, [search, status, page]);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        const onFocus = () => fetchOrders();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetchOrders]);

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await ordersApi.updateStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
            if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
            toast.success(`Order → ${newStatus}`);
        } catch { toast.error('Failed to update status'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('orders')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} {t('totalOrdersLabel')}</p>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder={t('searchOrder')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 160 }}>
                        <option value="">{t('allStatuses')}</option>
                        {ALL_STATUSES.map(s => (
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
                            <tr><th>{t('order')}</th><th>{t('customer')}</th><th>{t('sellers')}</th><th>{t('items')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('date')}</th><th>{t('actions')}</th></tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: 700, color: '#FF6B00' }}>#{o.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{o.customer?.name || '—'}</div>
                                        <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{o.customer?.email}</div>
                                    </td>
                                    <td style={{ fontSize: '.85rem' }}>{o.seller?.store_name || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>{o.items_count ?? '—'}</td>
                                    <td style={{ fontWeight: 700 }}>${o.total}</td>
                                    <td><span className={`badge-pill ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(o)} title="View details"><Eye size={12} /></button>
                                            <select
                                                value={o.status}
                                                onChange={e => updateStatus(o.id, e.target.value)}
                                                style={{
                                                    fontSize: '.75rem', fontWeight: 600, padding: '3px 6px',
                                                    border: '1.5px solid #e5e7eb', borderRadius: 6,
                                                    background: '#f9fafb', color: '#374151', cursor: 'pointer',
                                                    outline: 'none', maxWidth: 120,
                                                }}
                                            >
                                                {ALL_STATUSES.map(s => (
                                                    <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!orders.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noOrdersFound')}</td></tr>}
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

            {selected && (
                <div className="modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('order')} #{selected.id}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        {([[t('customer'), selected.customer?.name], [t('email'), selected.customer?.email], [t('sellers'), selected.seller?.store_name],
                        [t('total'), `$${selected.total}`], [t('discount'), selected.coupon_discount ? `$${selected.coupon_discount}` : '—'],
                        [t('status'), selected.status], [t('date'), new Date(selected.created_at).toLocaleString()]] as [string, string | undefined][]).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '.85rem' }}>{k}</span>
                                <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{String(v || '—')}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: 20, padding: '16px', background: '#f9fafb', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontWeight: 700, fontSize: '.875rem', color: '#374151', whiteSpace: 'nowrap' }}>{t('updateStatus')}:</span>
                            <select
                                defaultValue={selected.status}
                                id="modal-status-select"
                                style={{
                                    flex: 1, fontSize: '.85rem', fontWeight: 600, padding: '7px 10px',
                                    border: '1.5px solid #e5e7eb', borderRadius: 8,
                                    background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                {ALL_STATUSES.map(s => (
                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                            </select>
                            <button
                                className="btn btn-primary btn-sm"
                                style={{ whiteSpace: 'nowrap' }}
                                onClick={() => {
                                    const sel = (document.getElementById('modal-status-select') as HTMLSelectElement)?.value;
                                    if (sel && sel !== selected.status) updateStatus(selected.id, sel);
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
