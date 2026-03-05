'use client';
import { useEffect, useState, useCallback } from 'react';
import { productsApi } from '@/lib/api';
import { Search, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
    id: number; name_en: string; name_ar: string; price: number;
    status: string; quantity: number; created_at: string; sku: string;
    seller?: { store_name_en: string };
    category?: { name_en: string };
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

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await productsApi.list({ search, status, page, per_page: 15 });
            setProducts(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    }, [search, status, page]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const approve = async (id: number) => {
        try {
            await productsApi.approve(id);
            setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
            toast.success('Product approved!');
        } catch { toast.error('Failed'); }
    };

    const reject = async () => {
        if (!rejectModal) return;
        try {
            await productsApi.reject(rejectModal.id, rejectReason);
            setProducts(prev => prev.map(p => p.id === rejectModal.id ? { ...p, status: 'rejected' } : p));
            toast.success('Product rejected');
            setRejectModal(null); setRejectReason('');
        } catch { toast.error('Failed'); }
    };

    const destroy = async (id: number) => {
        if (!confirm('Delete product?')) return;
        try {
            await productsApi.destroy(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success('Product deleted');
        } catch { toast.error('Failed'); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Products</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} total products</p>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder="Search product name…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 160 }}>
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr><th>#</th><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{p.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {p.primary_image ? (
                                                <img src={p.primary_image.url} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📦</div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{p.name_en}</div>
                                                <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{p.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '.85rem', color: '#374151' }}>{p.seller?.store_name_en || '—'}</td>
                                    <td><span className="badge-pill badge-blue">{p.category?.name_en || '—'}</span></td>
                                    <td style={{ fontWeight: 700 }}>${p.price}</td>
                                    <td style={{ fontWeight: 600, color: p.quantity < 5 ? '#ef4444' : '#374151' }}>{p.quantity}</td>
                                    <td><span className={`badge-pill ${STATUS_CLASS[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 5 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(p)}><Eye size={12} /></button>
                                            {p.status === 'pending' && <>
                                                <button className="btn btn-success btn-xs" onClick={() => approve(p.id)} title="Approve"><CheckCircle size={12} /></button>
                                                <button className="btn btn-danger btn-xs" onClick={() => setRejectModal(p)} title="Reject"><XCircle size={12} /></button>
                                            </>}
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(p.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!products.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No products found</td></tr>}
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
                            <h3 className="modal-title">{selected.name_en}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        {selected.primary_image && <img src={selected.primary_image.url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, marginBottom: 16 }} />}
                        {[['Name (EN)', selected.name_en], ['Name (AR)', selected.name_ar], ['SKU', selected.sku], ['Price', `$${selected.price}`], ['Stock', selected.quantity], ['Seller', selected.seller?.store_name_en || '—'], ['Category', selected.category?.name_en || '—'], ['Status', selected.status]].map(([k, v]) => (
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
                            <h3 className="modal-title" style={{ color: '#ef4444' }}>Reject Product</h3>
                            <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <p style={{ color: '#6b7280', fontSize: '.875rem', marginBottom: 16 }}>Provide reason for rejecting <strong>{rejectModal.name_en}</strong>:</p>
                        <div className="form-group" style={{ marginBottom: 20 }}>
                            <textarea className="form-input" rows={3} placeholder="Reason…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModal(null)}>Cancel</button>
                            <button className="btn btn-danger" style={{ flex: 1 }} onClick={reject}>Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
