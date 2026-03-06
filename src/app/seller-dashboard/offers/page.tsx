'use client';
import { useEffect, useState } from 'react';
import { sellerOffersApi, sellerProductsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Offer {
    id: number; name: string; discount_type: string; discount_value: number;
    starts_at: string; ends_at: string; is_active: boolean; product_id?: number;
    product?: { name: string; primary_image?: { url: string } };
}

const EMPTY = { name: '', product_id: '', discount_type: 'percent', discount_value: '', starts_at: '', ends_at: '', is_active: true };

export default function SellerOffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const { t } = useI18n();

    const fetchOffers = async () => {
        try {
            const [offerRes, prodRes] = await Promise.all([
                sellerOffersApi.list(),
                sellerProductsApi.list({ per_page: 100 })
            ]);
            const o = offerRes.data.data;
            setOffers(o.data || o || []);
            const p = prodRes.data.data;
            setProducts(p.data || p || []);
        } catch { toast.error('Failed to load offers'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOffers(); }, []);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setModal('create'); };
    const openEdit = (o: Offer) => {
        setForm({ name: o.name, product_id: o.product_id || '', discount_type: o.discount_type, discount_value: o.discount_value, starts_at: o.starts_at?.slice(0, 10), ends_at: o.ends_at?.slice(0, 10), is_active: o.is_active });
        setEditId(o.id); setModal('edit');
    };

    const save = async () => {
        setSaving(true);
        try {
            // Clean payload to prevent empty strings failing optional numeric/date validation
            const payload = Object.fromEntries(Object.entries(form).filter(([_, v]) => v !== ''));

            if (modal === 'create') {
                const res = await sellerOffersApi.create(payload);
                setOffers(prev => [...prev, res.data.data]);
                toast.success(t('addOffer') + ' ✓');
            } else if (editId) {
                const res = await sellerOffersApi.update(editId, payload);
                setOffers(prev => prev.map(o => o.id === editId ? res.data.data : o));
                toast.success(t('editOffer') + ' ✓');
            }
            setModal(null);
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const destroy = async (id: number) => {
        if (!confirm(t('deletePlanConfirm'))) return;
        try {
            await sellerOffersApi.destroy(id);
            setOffers(prev => prev.filter(o => o.id !== id));
            toast.success(t('offerDeleted'));
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
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('sellerOffers')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{offers.length} {t('activeOffers')}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> {t('addOffer')}</button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark" /></div> : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="tbl">
                        <thead>
                            <tr><th>{t('product')}</th><th>{t('offerName')}</th><th>{t('discountType')}</th><th>{t('discountValue')}</th><th>{t('startDate')}</th><th>{t('endDate')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
                        </thead>
                        <tbody>
                            {offers.map(o => (
                                <tr key={o.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            {o.product?.primary_image?.url ? <img src={o.product.primary_image.url.startsWith('http') ? o.product.primary_image.url : `http://127.0.0.1:8000${o.product.primary_image.url}`} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}>📦</div>}
                                            <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{o.product?.name || '—'}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                                    <td><span className="badge-pill badge-blue">{o.discount_type}</span></td>
                                    <td style={{ fontWeight: 700, color: '#FF6B00' }}>{(o.discount_type === 'percentage' || o.discount_type === 'percent') ? `${o.discount_value}%` : `$${o.discount_value}`}</td>
                                    <td style={{ fontSize: '.8rem', color: '#6b7280' }}>{o.starts_at ? new Date(o.starts_at).toLocaleDateString() : '—'}</td>
                                    <td style={{ fontSize: '.8rem', color: '#6b7280' }}>{o.ends_at ? new Date(o.ends_at).toLocaleDateString() : '—'}</td>
                                    <td><span className={`badge-pill ${o.is_active ? 'badge-green' : 'badge-red'}`}>{o.is_active ? t('active') : t('inactive')}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => openEdit(o)}><Pencil size={12} /></button>
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(o.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!offers.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noOffersFound')}</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{modal === 'create' ? t('addOffer') : t('editOffer')}</h3>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {modal === 'create' && (
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">{t('product') || 'Product'}</label>
                                    <select className="form-input form-select" value={String(form.product_id)} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                                        <option value="">Choose a product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">{t('offerName')}</label>
                                <input className="form-input" value={String(form.name || '')} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('discountType')}</label>
                                <select className="form-input form-select" value={String(form.discount_type)} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                                    <option value="percent">{t('percentage')}</option>
                                    <option value="fixed">{t('fixed')}</option>
                                </select>
                            </div>
                            {field('discount_value', t('discountValue'), 'number')}
                            {field('starts_at', t('startDate'), 'date')}
                            {field('ends_at', t('endDate'), 'date')}
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.875rem', marginTop: 14 }}>
                            <input type="checkbox" checked={Boolean(form.is_active)} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                            {t('active')}
                        </label>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>{t('cancel')}</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : t('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
