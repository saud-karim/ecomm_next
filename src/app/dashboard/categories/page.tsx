'use client';
import { useEffect, useState, useCallback } from 'react';
import { categoriesApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Category {
    id: number;
    name_en: string;
    name_ar: string;
    slug: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
    products_count?: number;
}

const EMPTY = { name_en: '', name_ar: '', icon: '', sort_order: 1, is_active: true };

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>(EMPTY);
    const [saving, setSaving] = useState(false);
    const { t } = useI18n();

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const res = await categoriesApi.list();
            setCategories(res.data.data);
        } catch { toast.error('Failed to load categories'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setModal('create'); };
    const openEdit = (c: Category) => {
        setForm({
            name_en: c.name_en, name_ar: c.name_ar, icon: c.icon, sort_order: c.sort_order, is_active: c.is_active
        });
        setEditId(c.id); setModal('edit');
    };

    const save = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => {
                // Don't send the icon if it's just the existing URL string
                if (key === 'icon' && typeof val === 'string') return;

                // Convert boolean to 1/0 for backend
                if (typeof val === 'boolean') {
                    formData.append(key, val ? '1' : '0');
                } else if (val !== null && val !== '') {
                    formData.append(key, val as string | Blob);
                }
            });

            if (modal === 'create') {
                const res = await categoriesApi.create(formData);
                setCategories(prev => [...prev, res.data.data].sort((a, b) => a.sort_order - b.sort_order));
                toast.success('Category created');
            } else if (editId) {
                formData.append('_method', 'PUT'); // Laravel requires this when sending FormData via POST
                const res = await categoriesApi.update(editId, formData);
                setCategories(prev => prev.map(c => c.id === editId ? res.data.data : c).sort((a, b) => a.sort_order - b.sort_order));
                toast.success('Category updated');
            }
            setModal(null);
        } catch (e: unknown) {
            toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to save category');
        }
        finally { setSaving(false); }
    };

    const destroy = async (id: number, name: string) => {
        if (name.toLowerCase() === 'others') {
            toast.error('The "Others" category cannot be deleted.');
            return;
        }
        if (!confirm('Are you sure you want to delete this category? Any associated products will be moved to the "Others" category.')) return;
        try {
            await categoriesApi.destroy(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Category deleted');
            fetchCategories(); // Refresh to get updated product counts
        } catch (e: unknown) {
            toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete category');
        }
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
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('categories')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{categories.length} {t('totalCategoriesLabel') as string}</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> {t('addCategory') as string}</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div> : (
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t('category')} (EN)</th>
                                <th>{t('category')} (AR)</th>
                                <th>{t('icon') as string}</th>
                                <th>{t('products')}</th>
                                <th>{t('sortOrder') as string}</th>
                                <th>{t('status')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{c.id}</td>
                                    <td style={{ fontWeight: 600 }}>{c.name_en}</td>
                                    <td style={{ fontWeight: 600 }}>{c.name_ar}</td>
                                    <td style={{ fontSize: '1.5rem' }}>
                                        {c.icon && c.icon.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) ? (
                                            <img src={c.icon.startsWith('http') ? c.icon : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${c.icon.replace(/^\/storage\//, '')}`} alt={c.name_en} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                                        ) : (
                                            <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                                        )}
                                    </td>
                                    <td><span className="badge-gray">{c.products_count || 0}</span></td>
                                    <td>{c.sort_order}</td>
                                    <td>
                                        <span className={`badge-pill ${c.is_active ? 'badge-green' : 'badge-red'}`}>
                                            {c.is_active ? t('active') : t('inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => openEdit(c)}><Pencil size={12} /></button>
                                            <button className="btn btn-danger btn-xs" onClick={() => destroy(c.id, c.name_en)} disabled={c.name_en.toLowerCase() === 'others'}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!categories.length && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noCategoriesFound') as string}</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>

            {modal && (
                <div className="modal-backdrop" onClick={() => setModal(null)}>
                    <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{modal === 'create' ? (t('addCategory') || 'Add Category') : (t('editCategory') || 'Edit Category')}</h3>
                            <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem' }}>×</button>
                        </div>
                        <div style={{ display: 'grid', gap: 14 }}>
                            {field('name_en', t('categoryNameEn') || 'Category Name (EN)')}
                            {field('name_ar', t('categoryNameAr') || 'Category Name (AR)')}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">{t('icon') as string}</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-input"
                                        onChange={e => {
                                            if (e.target.files && e.target.files[0]) {
                                                setForm(f => ({ ...f, icon: e.target.files![0] }));
                                            }
                                        }}
                                    />
                                    {Boolean(form.icon) && typeof form.icon === 'string' && (form.icon as string).match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) && (
                                        <img src={(form.icon as string).startsWith('http') ? (form.icon as string) : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${(form.icon as string).replace(/^\/storage\//, '')}`} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} />
                                    )}
                                    {Boolean(form.icon) && form.icon instanceof File && (
                                        <img src={URL.createObjectURL(form.icon as File)} alt="Preview" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, marginTop: 10 }} />
                                    )}
                                </div>
                                {field('sort_order', t('sortOrder') as string, 'number')}
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                                <input type="checkbox" id="is_active" checked={Boolean(form.is_active)} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#FF6B00' }} />
                                <label htmlFor="is_active" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>{t('active')}</label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>{t('cancel')}</button>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? <span className="spinner" /> : t('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
