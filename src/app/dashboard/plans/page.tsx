'use client';
import { useEffect, useState } from 'react';
import { plansApi } from '@/lib/api';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan {
    id: number; name_en: string; name_ar: string; price: number;
    billing_cycle: string; max_products: number; max_offers: number;
    is_featured: boolean; is_active: boolean; sort_order: number;
    features?: string[];
}

const EMPTY_PLAN = { name_en: '', name_ar: '', price: '', billing_cycle: 'monthly', max_products: 50, max_offers: 5, is_featured: false, is_active: true, sort_order: 0 };

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>(EMPTY_PLAN);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const fetchPlans = async () => {
        try {
            const res = await plansApi.list();
            setPlans(res.data.data || res.data);
        } catch { toast.error('Failed to load plans'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPlans(); }, []);

    const openCreate = () => { setForm(EMPTY_PLAN); setEditId(null); setModal('create'); };
    const openEdit = (p: Plan) => {
        setForm({ name_en: p.name_en, name_ar: p.name_ar, price: p.price, billing_cycle: p.billing_cycle, max_products: p.max_products, max_offers: p.max_offers, is_featured: p.is_featured, is_active: p.is_active, sort_order: p.sort_order });
        setEditId(p.id); setModal('edit');
    };

    const save = async () => {
        setSaving(true);
        try {
            if (modal === 'create') {
                const res = await plansApi.create(form);
                setPlans(prev => [...prev, res.data.data]);
                toast.success('Plan created!');
            } else if (editId) {
                const res = await plansApi.update(editId, form);
                setPlans(prev => prev.map(p => p.id === editId ? res.data.data : p));
                toast.success('Plan updated!');
            }
            setModal(null);
        } catch { toast.error('Failed to save plan'); }
        finally { setSaving(false); }
    };

    const destroy = async (id: number) => {
        if (!confirm('Delete this plan?')) return;
        try {
            await plansApi.destroy(id);
            setPlans(prev => prev.filter(p => p.id !== id));
            toast.success('Plan deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const field = (key: string, label: string, type = 'text', extra?: Record<string, unknown>) => (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <input type={type} value={String(form[key] || '')} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))}
                className="form-input" {...extra} />
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Subscription Plans</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{plans.length} plans configured</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Plan</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark" /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
                    {plans.map(p => (
                        <div key={p.id} className="card" style={{ position: 'relative', border: p.is_featured ? '2px solid #FF6B00' : undefined }}>
                            {p.is_featured && (
                                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                                    <span className="badge-pill badge-orange"><Star size={10} /> Featured</span>
                                </div>
                            )}
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{p.name_en}</div>
                                <div style={{ color: '#9ca3af', fontSize: '.8rem' }}>{p.name_ar}</div>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FF6B00', marginBottom: 4 }}>
                                ${p.price}<span style={{ fontSize: '.85rem', color: '#9ca3af', fontWeight: 500 }}>/{p.billing_cycle}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14, marginBottom: 18 }}>
                                <div style={{ fontSize: '.82rem', color: '#374151' }}>📦 Up to <strong>{p.max_products}</strong> products</div>
                                <div style={{ fontSize: '.82rem', color: '#374151' }}>🏷️ Up to <strong>{p.max_offers}</strong> offers</div>
                                {(Array.isArray(p.features) ? p.features : (p.features as any)?.en || [])?.map((f: string, i: number) => <div key={i} style={{ fontSize: '.82rem', color: '#374151' }}>✓ {f}</div>)}
                            </div>
                            <span className={`badge-pill ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}><Pencil size={13} /> Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => destroy(p.id)}><Trash2 size={13} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{modal === 'create' ? 'New Plan' : 'Edit Plan'}</h3>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            {field('name_en', 'Name (English)')}
                            {field('name_ar', 'Name (Arabic)')}
                            {field('price', 'Price ($)', 'number')}
                            <div className="form-group">
                                <label className="form-label">Billing Cycle</label>
                                <select value={String(form.billing_cycle)} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))}
                                    className="form-input form-select">
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            {field('max_products', 'Max Products', 'number')}
                            {field('max_offers', 'Max Offers', 'number')}
                            {field('sort_order', 'Sort Order', 'number')}
                        </div>
                        <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.875rem' }}>
                                <input type="checkbox" checked={Boolean(form.is_featured)} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                                Featured
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.875rem' }}>
                                <input type="checkbox" checked={Boolean(form.is_active)} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                                Active
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                                {saving ? <span className="spinner" /> : (modal === 'create' ? 'Create Plan' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
