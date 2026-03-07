'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellerOrdersApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Search, Eye, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

interface Order {
    id: number; total: number; status: string; created_at: string;
    customer?: { name: string; email: string };
    items?: { id: number; product_name: string; product_image?: string; quantity: number; price: number; subtotal: number }[];
}

interface OrderDetail extends Order {
    subtotal?: number;
    discount?: number;
    address?: { line1: string; city: string; country: string };
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'badge-yellow', processing: 'badge-blue', shipped: 'badge-orange',
    delivered: 'badge-green', cancelled: 'badge-red', returned: 'badge-gray',
};
const NEXT_STATUS: Record<string, string[]> = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: [], cancelled: [], returned: [],
};

export default function SellerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<OrderDetail | null>(null);
    const [loadingOrder, setLoadingOrder] = useState(false);
    const { t } = useI18n();

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await sellerOrdersApi.list({ search, status, page, per_page: 15 });
            const d = res.data.data;
            setOrders(d.data || d);
            setMeta(d.meta || { current_page: d.current_page, last_page: d.last_page, total: d.total });
        } catch { toast.error('Failed to load orders'); }
        finally { setLoading(false); }
    }, [search, status, page]);

    useEffect(() => {
        fetch();
        const interval = setInterval(fetch, 30000);
        const onFocus = () => fetch();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetch]);

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await sellerOrdersApi.updateStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
            if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
            toast.success(`Order → ${newStatus}`);
        } catch { toast.error('Failed'); }
    };

    const handleDownloadInvoice = async (id: number) => {
        try {
            const toastId = toast.loading('Downloading Invoice...');
            const response = await sellerOrdersApi.downloadInvoice(id);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.success('Invoice Downloaded', { id: toastId });
        } catch (error) {
            console.error('Invoice Download Failed:', error);
            toast.error('Failed to download invoice');
        }
    };

    const viewOrder = async (o: Order) => {
        setSelected(o as OrderDetail);
        setLoadingOrder(true);
        try {
            const res = await sellerOrdersApi.show(o.id);
            setSelected(res.data.data);
        } catch { /* keep existing data */ }
        finally { setLoadingOrder(false); }
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
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="form-input form-select" style={{ width: 160 }}>
                        <option value="">{t('allStatuses')}</option>
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div> : (
                    <table className="tbl">
                        <thead>
                            <tr><th>{t('order')}</th><th>{t('customer')}</th><th>{t('items')}</th><th>{t('total')}</th><th>{t('status')}</th><th>{t('date')}</th><th>{t('actions')}</th></tr>
                        </thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o.id}>
                                    <td style={{ fontWeight: 700, color: '#FF6B00' }}>#{o.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{o.customer?.name || '—'}</div>
                                        <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{o.customer?.email}</div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{o.items?.length ?? '—'}</td>
                                    <td style={{ fontWeight: 700 }}>${o.total}</td>
                                    <td><span className={`badge-pill ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => viewOrder(o)}><Eye size={12} /></button>
                                            {(NEXT_STATUS[o.status] || []).map(ns => (
                                                <button key={ns} className="btn btn-xs"
                                                    style={{ background: ns === 'cancelled' || ns === 'returned' ? '#fee2e2' : '#dcfce7', color: ns === 'cancelled' || ns === 'returned' ? '#dc2626' : '#15803d', border: 'none', textTransform: 'capitalize' }}
                                                    onClick={() => updateStatus(o.id, ns)}>{ns}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!orders.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noOrdersFound')}</td></tr>}
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
                    <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('order')} #{selected.id}</h3>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button
                                    onClick={() => handleDownloadInvoice(selected.id)}
                                    className="btn btn-secondary btn-sm"
                                    title="Download Invoice"
                                >
                                    <Printer size={16} /> Receipt
                                </button>
                                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                            </div>
                        </div>
                        {loadingOrder ? (
                            <div style={{ textAlign: 'center', padding: 20 }}><span className="spinner spinner-dark" /></div>
                        ) : (
                            <>
                                {([[t('customer'), selected.customer?.name], [t('email'), selected.customer?.email], [t('total'), `$${selected.total}`], [t('status'), selected.status], [t('date'), new Date(selected.created_at).toLocaleString()]] as [string, string | undefined][]).map(([k, v]) => (
                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                        <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '.85rem' }}>{k}</span>
                                        <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{String(v || '—')}</span>
                                    </div>
                                ))}
                                {selected.items && selected.items.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <p style={{ fontWeight: 700, fontSize: '.875rem', marginBottom: 10 }}>{t('items')}</p>
                                        {selected.items.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                                                {item.product_image && <img src={item.product_image} alt={item.product_name} style={{ width: 30, height: 30, objectFit: 'cover', marginRight: 10, borderRadius: 4 }} />}
                                                <span style={{ fontSize: '.82rem', fontWeight: 500, flex: 1 }}>{item.product_name}</span>
                                                <span style={{ fontSize: '.82rem', color: '#6b7280', marginRight: 12 }}>×{item.quantity}</span>
                                                <span style={{ fontSize: '.85rem', fontWeight: 700 }}>${item.subtotal}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {(NEXT_STATUS[selected.status] || []).length > 0 && (
                            <div style={{ marginTop: 20 }}>
                                <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '.875rem' }}>{t('updateStatus')}</p>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {(NEXT_STATUS[selected.status] || []).map(ns => (
                                        <button key={ns} className="btn btn-primary btn-sm"
                                            style={{ background: ns === 'cancelled' || ns === 'returned' ? '#ef4444' : '#FF6B00', textTransform: 'capitalize' }}
                                            onClick={() => updateStatus(selected.id, ns)}>→ {ns}
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
