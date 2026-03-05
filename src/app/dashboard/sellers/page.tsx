'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellersApi } from '@/lib/api';
import { Search, CheckCircle, XCircle, Trash2, Eye, Store } from 'lucide-react';
import toast from 'react-hot-toast';

interface Seller {
    id: number; store_name_en: string; store_name_ar: string;
    store_slug: string; is_approved: boolean; is_active: boolean;
    user: { id: number; name: string; email: string };
    plan?: { name_en: string };
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
            toast.success('Seller approved!');
        } catch { toast.error('Failed to approve'); }
    };

    const reject = async () => {
        if (!rejectModal) return;
        try {
            await sellersApi.reject(rejectModal.id, rejectReason);
            setSellers(prev => prev.map(s => s.id === rejectModal.id ? { ...s, is_approved: false } : s));
            toast.success('Seller rejected');
            setRejectModal(null); setRejectReason('');
        } catch { toast.error('Failed to reject'); }
    };

    const destroy = async (id: number) => {
        if (!confirm('Delete this seller permanently?')) return;
        try {
            await sellersApi.destroy(id);
            setSellers(prev => prev.filter(s => s.id !== id));
            toast.success('Seller deleted');
        } catch { toast.error('Failed to delete'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Sellers</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} total sellers</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder="Search store or email…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 180 }}>
                        <option value="">All Sellers</option>
                        <option value="0">Pending Approval</option>
                        <option value="1">Approved</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>#</th><th>Store</th><th>Owner</th><th>Plan</th>
                                <th>Products</th><th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sellers.map(s => (
                                <tr key={s.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{s.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff4ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Store size={16} color="#FF6B00" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{s.store_name_en}</div>
                                                <div style={{ fontSize: '.75rem', color: '#9ca3af' }}>{s.store_slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{s.user?.name}</div>
                                        <div style={{ fontSize: '.75rem', color: '#9ca3af' }}>{s.user?.email}</div>
                                    </td>
                                    <td><span className="badge-pill badge-blue">{s.plan?.name_en || '—'}</span></td>
                                    <td style={{ fontWeight: 600 }}>{s.products_count ?? '—'}</td>
                                    <td>
                                        <span className={`badge-pill ${s.is_approved ? 'badge-green' : 'badge-yellow'}`}>
                                            {s.is_approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(s)}><Eye size={12} /></button>
                                            {!s.is_approved && (
                                                <>
                                                    <button className="btn btn-success btn-xs" onClick={() => approve(s.id)} title="Approve">
                                                        <CheckCircle size={12} />
                                                    </button>
                                                    <button className="btn btn-danger btn-xs" onClick={() => setRejectModal(s)} title="Reject">
                                                        <XCircle size={12} />
                                                    </button>
                                                </>
                                            )}
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(s.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!sellers.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No sellers found</td></tr>}
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

            {/* Detail Modal */}
            {selected && (
                <div className="modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Seller Details — {selected.store_name_en}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#6b7280' }}>×</button>
                        </div>
                        {[['Store (EN)', selected.store_name_en], ['Store (AR)', selected.store_name_ar], ['Slug', selected.store_slug], ['Owner', selected.user?.name], ['Email', selected.user?.email], ['Plan', selected.plan?.name_en || '—'], ['Status', selected.is_approved ? '✅ Approved' : '⏳ Pending'], ['Products', selected.products_count ?? '—']].map(([k, v]) => (
                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '.85rem' }}>{k}</span>
                                <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{String(v)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
                    <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title" style={{ color: '#ef4444' }}>Reject Seller</h3>
                            <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#6b7280' }}>×</button>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '.875rem', marginBottom: 16 }}>
                            Rejecting <strong>{rejectModal.store_name_en}</strong>. Please provide a reason:
                        </p>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <textarea className="form-input" rows={3} placeholder="Reason for rejection…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={reject}>Reject Seller</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
