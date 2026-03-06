'use client';
import { useEffect, useState } from 'react';
import { sellerCouponsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Coupon {
    id: number; code: string; discount_type: string; discount_value: number;
    min_order_amount: number; usage_limit: number; usage_count: number;
    expires_at: string; is_active: boolean;
}

const EMPTY = { code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', usage_limit: '', expires_at: '', is_active: true };

export default function SellerCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const { t } = useI18n();

    const fetchCoupons = async () => {
        try {
            const res = await sellerCouponsApi.list();
            setCoupons(res.data.data || res.data);
        } catch { toast.error('Failed to load coupons'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setModal('create'); };
    const openEdit = (c: Coupon) => {
        setForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order_amount: c.min_order_amount, usage_limit: c.usage_limit, expires_at: c.expires_at?.slice(0, 10), is_active: c.is_active });
        setEditId(c.id); setModal('edit');
    };

    const save = async () => {
        setSaving(true);
        try {
            // Clean payload to prevent empty strings failing optional numeric/date validation
            const payload = Object.fromEntries(Object.entries(form).filter(([_, v]) => v !== ''));

            if (modal === 'create') {
                const res = await sellerCouponsApi.create(payload);
                setCoupons(prev => [...prev, res.data.data]);
                toast.success(t('addCoupon') + ' ✓');
            } else if (editId) {
                const res = await sellerCouponsApi.update(editId, payload);
                setCoupons(prev => prev.map(c => c.id === editId ? res.data.data : c));
                toast.success(t('editCoupon') + ' ✓');
            }
            setModal(null);
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const destroy = async (id: number) => {
        if (!confirm(t('deletePlanConfirm'))) return;
        try {
            await sellerCouponsApi.destroy(id);
            setCoupons(prev => prev.filter(c => c.id !== id));
            toast.success(t('couponDeleted'));
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
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('sellerCoupons')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{coupons.length} {t('activeCoupons')}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> {t('addCoupon')}</button>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark" /></div> : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="tbl">
                        <thead>
                            <tr><th>{t('couponCode')}</th><th>{t('discountType')}</th><th>{t('discountValue')}</th><th>{t('minOrder')}</th><th>{t('usageLimit')}</th><th>Used</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
                        </thead>
                        <tbody>
                            {coupons.map(c => (
                                <tr key={c.id}>
                                    <td><span className="badge-pill badge-orange" style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{c.code}</span></td>
                                    <td><span className="badge-pill badge-blue">{c.discount_type}</span></td>
                                    <td style={{ fontWeight: 700, color: '#FF6B00' }}>{(c.discount_type === 'percentage' || c.discount_type === 'percent') ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                                    <td>${c.min_order_amount || 0}</td>
                                    <td>{c.usage_limit || '∞'}</td>
                                    <td>{c.usage_count || 0}</td>
                                    <td><span className={`badge-pill ${c.is_active ? 'badge-green' : 'badge-red'}`}>{c.is_active ? t('active') : t('inactive')}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => openEdit(c)}><Pencil size={12} /></button>
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(c.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!coupons.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noCouponsFound')}</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}

            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{modal === 'create' ? t('addCoupon') : t('editCoupon')}</h3>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">{t('couponCode')}</label>
                                <input className="form-input" value={String(form.code || '')} placeholder="SUMMER20"
                                    style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">{t('discountType')}</label>
                                <select className="form-input form-select" value={String(form.discount_type)} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                                    <option value="percent">{t('percentage')}</option>
                                    <option value="fixed">{t('fixed')}</option>
                                </select>
                            </div>
                            {field('discount_value', t('discountValue'), 'number')}
                            {field('min_order_amount', t('minOrder'), 'number')}
                            {field('usage_limit', t('usageLimit'), 'number')}
                            {field('expires_at', t('endDate'), 'date')}
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
