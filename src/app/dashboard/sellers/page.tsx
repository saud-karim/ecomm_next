'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellersApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Search, CheckCircle, XCircle, Trash2, Eye, Store } from 'lucide-react';
import toast from 'react-hot-toast';

interface Seller {
    id: number; store_name: string;
    store_slug: string; is_approved: boolean; is_active: boolean;
    user: { id: number; name: string; email: string };
    subscription?: { plan?: { name: string } };
    products_count?: number; created_at: string;
}

export default function SellersPage() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<Seller | null>(null);
    const [rejectModal, setRejectModal] = useState<Seller | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const { t, locale } = useI18n();

    const fetchSellers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { page, per_page: 15 };
            if (search) params.search = search;
            if (filter !== '') params.is_approved = filter;
            const res = await sellersApi.list(params);
            setSellers(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load sellers'); }
        finally { setLoading(false); }
    }, [search, filter, page]);

    useEffect(() => { fetchSellers(); }, [fetchSellers]);

    const approve = async (id: number) => {
        try {
            await sellersApi.approve(id);
            setSellers(prev => prev.map(s => s.id === id ? { ...s, is_approved: true } : s));
            toast.success(`${t('approved')}!`);
        } catch { toast.error('Failed to approve'); }
    };

    const reject = async () => {
        if (!rejectModal) return;
        try {
            await sellersApi.reject(rejectModal.id, rejectReason);
            setSellers(prev => prev.map(s => s.id === rejectModal.id ? { ...s, is_approved: false } : s));
            toast.success(t('rejected'));
            setRejectModal(null); setRejectReason('');
        } catch { toast.error('Failed to reject'); }
    };

    const destroy = async (id: number) => {
        if (!confirm(t('deleteUserConfirm'))) return;
        try {
            await sellersApi.destroy(id);
            setSellers(prev => prev.filter(s => s.id !== id));
            toast.success(t('userDeleted'));
        } catch { toast.error('Failed to delete'); }
    };

    const storeName = (s: Seller) => s.store_name || '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('sellers')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} {t('totalSellersLabel')}</p>
                </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder={t('searchStore')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 200 }}>
                        <option value="">{t('allSellers')}</option>
                        <option value="0">{t('pendingApproval')}</option>
                        <option value="1">{t('approved')}</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>#</th><th>{t('store')}</th><th>{t('owner')}</th><th>{t('plan')}</th>
                                <th>{t('products2')}</th><th>{t('status')}</th><th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sellers.map(s => (
                                <tr key={s.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{s.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff4ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Store size={16} color="#FF6B00" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{storeName(s)}</div>
                                                <div style={{ fontSize: '.75rem', color: '#9ca3af' }}>{s.store_slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{s.user?.name}</div>
                                        <div style={{ fontSize: '.75rem', color: '#9ca3af' }}>{s.user?.email}</div>
                                    </td>
                                    <td><span className="badge-pill badge-blue">{s.subscription?.plan?.name || '—'}</span></td>
                                    <td style={{ fontWeight: 600 }}>{s.products_count ?? '—'}</td>
                                    <td>
                                        <span className={`badge-pill ${s.is_approved ? 'badge-green' : 'badge-yellow'}`}>
                                            {s.is_approved ? t('approved') : t('pending')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(s)}><Eye size={12} /></button>
                                            {!s.is_approved && (
                                                <>
                                                    <button className="btn btn-success btn-xs" onClick={() => approve(s.id)}><CheckCircle size={12} /></button>
                                                    <button className="btn btn-danger btn-xs" onClick={() => setRejectModal(s)}><XCircle size={12} /></button>
                                                </>
                                            )}
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(s.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!sellers.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noSellersFound')}</td></tr>}
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
                            <h3 className="modal-title">{t('sellerDetails')} — {storeName(selected)}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#6b7280' }}>×</button>
                        </div>
                        {([[t('store'), selected.store_name], [t('slug'), selected.store_slug], [t('owner'), selected.user?.name], [t('email'), selected.user?.email], [t('plan'), selected.subscription?.plan?.name || '—'], [t('status'), selected.is_approved ? `✅ ${t('approved')}` : `⏳ ${t('pending')}`], [t('products2'), selected.products_count ?? '—']] as [string, string | number][]).map(([k, v]) => (
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
                            <h3 className="modal-title" style={{ color: '#ef4444' }}>{t('rejectSeller')}</h3>
                            <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#6b7280' }}>×</button>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '.875rem', marginBottom: 16 }}>
                            {t('rejectingMsg')} <strong>{storeName(rejectModal)}</strong>. {t('provideReason')}
                        </p>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <textarea className="form-input" rows={3} placeholder={t('reason')} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>{t('cancel')}</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={reject}>{t('rejectSeller')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
