'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellerProductsApi, productsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
    id: number; name: string; price: number; quantity: number;
    status: string; sku: string; created_at: string; category_id?: number;
    primary_image?: { url: string };
    images?: { id: number; url: string; is_primary: boolean }[];
}

const EMPTY = { name_en: '', name_ar: '', category_id: '', description_en: '', description_ar: '', price: '', quantity: '', sku: '', status: 'draft' };
const STATUS_CLASS: Record<string, string> = { approved: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red', draft: 'badge-gray' };

export default function SellerProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const [existingImages, setExistingImages] = useState<Product['images']>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const { t } = useI18n();

    useEffect(() => {
        productsApi.categories().then(res => setCategories(res.data.data)).catch(() => { });
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await sellerProductsApi.list({ search, page, per_page: 15 });
            const d = res.data.data;
            setProducts(d.data || d);
            setMeta(d.meta || { current_page: d.current_page, last_page: d.last_page, total: d.total });
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    }, [search, page]);

    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 30000);
        const onFocus = () => fetchProducts();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetchProducts]);

    const openCreate = () => {
        setForm(EMPTY); setEditId(null); setModal('create');
        setExistingImages([]); setSelectedFiles([]);
    };

    const openEdit = async (p: Product) => {
        setForm({ name_en: p.name, name_ar: '', category_id: p.category_id || '', price: p.price, quantity: p.quantity, sku: p.sku, status: p.status });
        setEditId(p.id); setModal('edit');
        setExistingImages([]); setSelectedFiles([]);
        try {
            const res = await sellerProductsApi.show(p.id);
            const fullP = res.data.data;
            setForm({ name_en: fullP.name_en, name_ar: fullP.name_ar, category_id: fullP.category_id, price: fullP.price, quantity: fullP.quantity, sku: fullP.sku, status: fullP.status, description_en: fullP.description_en, description_ar: fullP.description_ar });
            setExistingImages(fullP.images || []);
        } catch { toast.error('Failed to load product details'); }
    };

    const save = async () => {
        setSaving(true);
        try {
            let productId = editId;
            if (modal === 'create') {
                const res = await sellerProductsApi.create(form);
                productId = res.data.data.id;
                toast.success(t('addProduct') + ' ✓');
            } else if (editId) {
                await sellerProductsApi.update(editId, form);
                toast.success(t('editProduct') + ' ✓');
            }

            if (productId && selectedFiles.length > 0) {
                const fd = new FormData();
                selectedFiles.forEach(f => fd.append('images[]', f));
                await sellerProductsApi.uploadImages(productId, fd);
                toast.success('Images uploaded');
            }

            fetchProducts();
            setModal(null);
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save';
            toast.error(msg);
        } finally { setSaving(false); }
    };

    const deleteExistingImage = async (imgId: number) => {
        if (!editId || !confirm('Delete image?')) return;
        try {
            await sellerProductsApi.deleteImage(editId, imgId);
            setExistingImages(prev => prev?.filter(i => i.id !== imgId));
            toast.success('Image deleted');
        } catch { toast.error('Failed to delete image'); }
    };

    const destroy = async (id: number) => {
        if (!confirm(t('deletePlanConfirm'))) return;
        try {
            await sellerProductsApi.destroy(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            toast.success(t('productDeleted'));
        } catch { toast.error('Failed'); }
    };

    const field = (key: string, label: string, type = 'text') => (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <input type={type} value={String(form[key] || '')} className="form-input"
                onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))} />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('myProducts')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total} {t('totalProductsLabel')}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> {t('addProduct')}</button>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div className="search-bar">
                    <Search size={15} color="#9ca3af" />
                    <input placeholder={t('searchProduct')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div> : (
                    <table className="tbl">
                        <thead>
                            <tr><th>#</th><th>{t('product')}</th><th>{t('price')}</th><th>{t('stock')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{p.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {p.primary_image?.url ? <img src={p.primary_image.url.startsWith('http') ? p.primary_image.url : `http://127.0.0.1:8000${p.primary_image.url}`} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>}
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{p.name}</div>
                                                <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{p.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>${p.price}</td>
                                    <td style={{ fontWeight: 600, color: p.quantity < 5 ? '#ef4444' : '#374151' }}>{p.quantity}</td>
                                    <td><span className={`badge-pill ${STATUS_CLASS[p.status] || 'badge-gray'}`}>{p.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => openEdit(p)}><Pencil size={12} /></button>
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(p.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!products.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noProductsFound')}</td></tr>}
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

            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{modal === 'create' ? t('addProduct') : t('editProduct')}</h3>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '10px 0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {field('name_en', t('productNameEn'))}
                                {field('name_ar', t('productNameAr'))}
                                <div className="form-group">
                                    <label className="form-label">{t('category') || 'Category'}</label>
                                    <select value={String(form.category_id || '')} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="form-input form-select">
                                        <option value="">Choose...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{t('status')}</label>
                                    <select value={String(form.status)} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="form-input form-select">
                                        <option value="draft">Draft</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                                {field('price', t('price'), 'number')}
                                {field('quantity', t('quantity'), 'number')}
                                {field('sku', t('sku'))}
                            </div>
                            <div className="form-group" style={{ marginTop: 14 }}>
                                <label className="form-label">{t('descriptionEn')}</label>
                                <textarea className="form-input" rows={2} value={String(form.description_en || '')} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('descriptionAr')}</label>
                                <textarea className="form-input" rows={2} value={String(form.description_ar || '')} onChange={e => setForm(f => ({ ...f, description_ar: e.target.value }))} />
                            </div>

                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Images</span>
                                    <label style={{ cursor: 'pointer', color: '#FF6B00', fontWeight: 600, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Upload size={14} /> Upload More
                                        <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => {
                                            if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                        }} />
                                    </label>
                                </label>

                                {(existingImages && existingImages.length > 0) || selectedFiles.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                                        {existingImages?.map(img => (
                                            <div key={img.id} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                                {img.url && <img src={img.url.startsWith('http') ? img.url : `http://127.0.0.1:8000${img.url.startsWith('/') ? '' : '/'}${img.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                <button onClick={() => deleteExistingImage(img.id)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px dashed #FF6B00' }}>
                                                <img src={URL.createObjectURL(file)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => setSelectedFiles(prev => prev.filter((_, index) => index !== i))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: 20, border: '1px dashed #e5e7eb', borderRadius: 8, textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>
                                        No images uploaded yet.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>{t('cancel')}</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : t('save')}</button>
                        </div>
                    </div>
                </div >
            )
            }
        </div >
    );
}
