'use client';
import { useEffect, useState } from 'react';
import { sellerProfileApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface Profile {
    id: number; name: string; email: string;
    seller?: { store_name_en: string; store_name_ar: string; store_slug: string; store_description_en: string; store_description_ar: string; };
}

export default function SellerProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<Record<string, string>>({});
    const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
    const [saving, setSaving] = useState(false);
    const [savingPw, setSavingPw] = useState(false);
    const { t } = useI18n();

    useEffect(() => {
        sellerProfileApi.get()
            .then(res => {
                const p: Profile = res.data.data;
                setProfile(p);
                setForm({
                    name: p.name,
                    store_name_en: p.seller?.store_name_en || '',
                    store_name_ar: p.seller?.store_name_ar || '',
                    store_description_en: p.seller?.store_description_en || '',
                    store_description_ar: p.seller?.store_description_ar || '',
                });
            })
            .catch(() => toast.error('Failed to load profile'))
            .finally(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            await sellerProfileApi.update(form);
            toast.success(t('profileUpdated'));
        } catch { toast.error('Failed to save'); }
        finally { setSaving(false); }
    };

    const savePassword = async () => {
        setSavingPw(true);
        try {
            await sellerProfileApi.changePassword(pwForm);
            toast.success(t('passwordChanged'));
            setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
            toast.error(msg);
        } finally { setSavingPw(false); }
    };

    const field = (key: keyof typeof form, label: string, textarea = false) => (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {textarea
                ? <textarea className="form-input" rows={3} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                : <input className="form-input" value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            }
        </div>
    );

    if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-dark" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('sellerProfile')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{profile?.email}</p>
            </div>

            {/* Profile & Store Info */}
            <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('storeInfo')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {field('name', t('name'))}
                    {field('store_name_en', t('storeEn'))}
                    {field('store_name_ar', t('storeAr'))}
                    <div />
                    {field('store_description_en', t('descriptionEn'), true)}
                    {field('store_description_ar', t('descriptionAr'), true)}
                </div>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                        {saving ? <span className="spinner" /> : t('save')}
                    </button>
                </div>
            </div>

            {/* Change Password */}
            <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('newPassword')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {(['current_password', 'new_password', 'new_password_confirmation'] as const).map(key => (
                        <div className="form-group" key={key}>
                            <label className="form-label">
                                {key === 'current_password' ? t('currentPassword') : key === 'new_password' ? t('newPassword') : `${t('newPassword')} (Confirm)`}
                            </label>
                            <input type="password" className="form-input" value={pwForm[key]}
                                onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} />
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={savePassword} disabled={savingPw}>
                        {savingPw ? <span className="spinner" /> : t('changePassword')}
                    </button>
                </div>
            </div>
        </div>
    );
}
