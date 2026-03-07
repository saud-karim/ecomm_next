'use client';
import { useEffect, useState } from 'react';
import { adminProfileApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface Profile {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
}

export default function AdminProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', phone: '' });
    const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [saving, setSaving] = useState(false);
    const [savingPw, setSavingPw] = useState(false);
    const { t } = useI18n();

    useEffect(() => {
        adminProfileApi.get()
            .then(res => {
                const p: Profile = res.data.data;
                setProfile(p);
                setForm({ name: p.name, phone: p.phone || '' });
            })
            .catch(() => toast.error(t('failedLoadProfile') || 'Failed to load profile'))
            .finally(() => setLoading(false));
    }, []);

    const saveProfile = async () => {
        setSaving(true);
        try {
            await adminProfileApi.update(form);
            toast.success(t('profileUpdated'));
            setProfile(prev => prev ? { ...prev, name: form.name, phone: form.phone } : null);
        } catch { toast.error(t('failedToSave') || 'Failed to save'); }
        finally { setSaving(false); }
    };

    const savePassword = async () => {
        if (pwForm.password !== pwForm.password_confirmation) {
            toast.error(t('passwordsMatchError') || 'Passwords do not match');
            return;
        }
        setSavingPw(true);
        try {
            await adminProfileApi.changePassword(pwForm);
            toast.success(t('passwordChanged'));
            setPwForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
            toast.error(msg);
        } finally { setSavingPw(false); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-dark" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('profileTitle') || 'My Profile'}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{profile?.email} &bull; <span style={{ textTransform: 'capitalize' }}>{profile?.role?.replace('_', ' ')}</span></p>
            </div>

            {/* Avatar Block */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B00, #ff9240)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                    {profile?.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1f2937' }}>{profile?.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '.875rem', marginTop: 4 }}>{profile?.email}</div>
                    <div style={{ marginTop: 6 }}>
                        <span style={{ background: '#fff7ed', color: '#FF6B00', fontSize: '.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize' }}>
                            {profile?.role?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('personalInfo') || 'Personal Information'}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                        <label className="form-label">{t('name')}</label>
                        <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('email') || 'Email'}</label>
                        <input className="form-input" value={profile?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('phone') || 'Phone'}</label>
                        <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                </div>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                        {saving ? <span className="spinner" /> : t('save')}
                    </button>
                </div>
            </div>

            {/* Change Password */}
            <div className="card">
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('changePassword') || 'Change Password'}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {([
                        { key: 'current_password', label: t('currentPassword') || 'Current Password' },
                        { key: 'password', label: t('newPassword') || 'New Password' },
                        { key: 'password_confirmation', label: t('confirmNewPassword') || 'Confirm New Password' },
                    ] as const).map(({ key, label }) => (
                        <div className="form-group" key={key}>
                            <label className="form-label">{label}</label>
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
