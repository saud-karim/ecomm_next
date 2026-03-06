'use client';
import { useEffect, useState, useCallback } from 'react';
import { productsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Search, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
    id: number; name: string; price: number;
    status: string; quantity: number; created_at: string; sku: string;
    seller?: { store_name: string };
    category?: { name: string; };
    primary_image?: { url: string };
}

const STATUS_CLASS: Record<string, string> = {
    approved: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red', draft: 'badge-gray',
};

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Product | null>(null);
    const [rejectModal, setRejectModal] = useState<Product | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const { t } = useI18n();

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await productsApi.list({ search, status, page, per_page: 15 });
            setProducts(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    }, [search, status, page]);

    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 30000);
        const onFocus = () => fetchProducts();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetchProducts]);

    const approve = async (id: number) => {
        try {
            await productsApi.approve(id);
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
            toast.success(`${t('approved')}!`);
        } catch { toast.error('Failed'); }
    };

    const reject = async () => {
        if (!rejectModal) return;
        try {
            await productsApi.reject(rejectModal.id, rejectReason);
            setProducts(prev => prev.map(p => p.id === rejectModal.id ? { ...p, status: 'rejected' } : p));
            toast.success(t('rejected'));
            setRejectModal(null); setRejectReason('');
        } catch { toast.error('Failed'); }
    };

    const destroy = async (id: number) => {
        if (!confirm(t('deletePlanConfirm'))) return;
        try {
            await productsApi.destroy(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success(t('productDeleted'));
        } catch { toast.error('Failed'); }
    };

    const pName = (p: Product) => p.name || '—';
    const cName = (p: Product) => p.category?.name || '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('products')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} {t('totalProductsLabel')}</p>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder={t('searchProduct')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 160 }}>
                        <option value="">{t('allStatus')}</option>
                        <option value="pending">{t('pending')}</option>
                        <option value="approved">{t('approved')}</option>
                        <option value="rejected">{t('rejected')}</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr><th>#</th><th>{t('product')}</th><th>{t('sellers')}</th><th>{t('category')}</th><th>{t('price')}</th><th>{t('stock')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{p.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {p.primary_image?.url ? (
                                                <img src={p.primary_image.url.startsWith('http') ? p.primary_image.url : `http://127.0.0.1:8000${p.primary_image.url}`} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>📦</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{pName(p)}</div>
                                                <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{p.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '.85rem', color: '#374151' }}>{p.seller?.store_name || '—'}</td>
                                    <td><span className="badge-pill badge-blue">{cName(p)}</span></td>
                                    <td style={{ fontWeight: 700 }}>${p.price}</td>
                                    <td style={{ fontWeight: 600, color: p.quantity < 5 ? '#ef4444' : '#374151' }}>{p.quantity}</td>
                                    <td><span className={`badge-pill ${STATUS_CLASS[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(p)}><Eye size={12} /></button>
                                            {p.status === 'pending' && <>
                                                <button className="btn btn-success btn-xs" onClick={() => approve(p.id)}><CheckCircle size={12} /></button>
                                                <button className="btn btn-danger btn-xs" onClick={() => setRejectModal(p)}><XCircle size={12} /></button>
                                            </>}
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(p.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!products.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noProductsFound')}</td></tr>}
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{pName(selected)}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        {selected.primary_image?.url && <img src={selected.primary_image.url.startsWith('http') ? selected.primary_image.url : `http://127.0.0.1:8000${selected.primary_image.url}`} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} />}
                        {([[t('product'), selected.name], ['SKU', selected.sku], [t('price'), `$${selected.price}`], [t('stock'), selected.quantity], [t('sellers'), selected.seller?.store_name || '—'], [t('category'), cName(selected)], [t('status'), selected.status]] as [string, string | number][]).map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '.85rem' }}>{k}</span>
                                <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{String(v)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {rejectModal && (
                <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
                    <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ color: '#ef4444' }}>{t('rejectProduct')}</h3>
                            <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '.875rem', marginBottom: 16 }}>{t('provideReason')} <strong>{pName(rejectModal)}</strong>:</p>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <textarea className="form-input" rows={3} placeholder={t('reasonProductReject')} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>{t('cancel')}</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={reject}>{t('rejectProduct')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
