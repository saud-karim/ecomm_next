'use client';
import { useEffect, useState, useRef } from 'react';
import { bannersApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '@/lib/i18n';

interface Banner {
    id: number;
    title_en: string | null;
    title_ar: string | null;
    subtitle_en: string | null;
    subtitle_ar: string | null;
    image_url: string;
    link_url: string | null;
    is_active: boolean;
    sort_order: number;
}

export default function BannersPage() {
    const { t, isRtl } = useI18n();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMultiSyncing, setIsMultiSyncing] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBanner, setCurrentBanner] = useState<Banner | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const [form, setForm] = useState({ title_en: '', title_ar: '', subtitle_en: '', subtitle_ar: '', link_url: '', sort_order: 0 });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchBanners = () => {
        setLoading(true);
        bannersApi.list()
            .then(res => setBanners(res.data.data))
            .catch(() => toast.error('Failed to load banners'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBanners(); }, []);

    const openModal = (banner: Banner | null = null) => {
        setCurrentBanner(banner);
        setForm({
            title_en: banner?.title_en || '',
            title_ar: banner?.title_ar || '',
            subtitle_en: banner?.subtitle_en || '',
            subtitle_ar: banner?.subtitle_ar || '',
            link_url: banner?.link_url || '',
            sort_order: banner?.sort_order || 0,
        });
        setImageFile(null);
        setImagePreview(banner ? banner.image_url : null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const saveBanner = async () => {
        if (!currentBanner && !imageFile) {
            toast.error(t('imageRequiredNewBanner'));
            return;
        }

        setFormLoading(true);
        const formData = new FormData();
        if (form.title_en) formData.append('title_en', form.title_en);
        if (form.title_ar) formData.append('title_ar', form.title_ar);
        if (form.subtitle_en) formData.append('subtitle_en', form.subtitle_en);
        if (form.subtitle_ar) formData.append('subtitle_ar', form.subtitle_ar);
        if (form.link_url) formData.append('link_url', form.link_url);
        formData.append('sort_order', form.sort_order.toString());
        if (imageFile) formData.append('image', imageFile);

        try {
            if (currentBanner) {
                await bannersApi.update(currentBanner.id, formData);
                toast.success(t('bannerUpdated'));
            } else {
                await bannersApi.create(formData);
                toast.success(t('bannerCreated'));
            }
            setIsModalOpen(false);
            fetchBanners();
        } catch {
            toast.error(t('failedSaveBanner'));
        } finally {
            setFormLoading(false);
        }
    };

    const toggleBanner = async (id: number) => {
        setIsMultiSyncing(true);
        try {
            await bannersApi.toggle(id);
            setBanners(banners.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b));
            toast.success(t('bannerStatusUpdated'));
        } catch {
            toast.error('Failed to update status');
        } finally {
            setIsMultiSyncing(false);
        }
    };

    const deleteBanner = async (id: number) => {
        if (!confirm(t('confirmDeleteBanner'))) return;
        setIsMultiSyncing(true);
        try {
            await bannersApi.destroy(id);
            setBanners(banners.filter(b => b.id !== id));
            toast.success(t('bannerDeleted'));
        } catch {
            toast.error('Failed to delete banner');
        } finally {
            setIsMultiSyncing(false);
        }
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>{t('homepageBanners')}</h1>
                <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus size={16} /> {t('addBanner')}
                </button>
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-dark"></span></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {banners.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6' }}>
                            <ImageIcon size={40} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>{t('noBannersYet')}</h3>
                            <p style={{ color: '#6b7280', fontSize: '.9rem', marginTop: 4 }}>{t('clickToAddBanner')}</p>
                        </div>
                    ) : (
                        banners.map(banner => (
                            <div key={banner.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Banner Image Box */}
                                <div style={{ height: 160, background: '#f3f4f6', position: 'relative' }}>
                                    <img
                                        src={banner.image_url.startsWith('http') ? banner.image_url : `http://127.0.0.1:8000${banner.image_url}`}
                                        alt={banner.title_en || 'Banner'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                                        <button
                                            onClick={() => toggleBanner(banner.id)}
                                            disabled={isMultiSyncing}
                                            style={{
                                                background: banner.is_active ? '#10b981' : '#f3f4f6',
                                                color: banner.is_active ? '#fff' : '#6b7280',
                                                border: 'none', padding: '4px 10px', borderRadius: 20,
                                                fontSize: '.75rem', fontWeight: 700, cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {banner.is_active ? t('active') : t('hidden')}
                                        </button>
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '.7rem', fontWeight: 600 }}>
                                        {t('order')}: {banner.sort_order}
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: '#1f2937' }}>
                                        {isRtl ? (banner.title_ar || banner.title_en || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{t('noTitle')}</span>) : (banner.title_en || banner.title_ar || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{t('noTitle')}</span>)}
                                    </h3>
                                    <p style={{ fontSize: '.85rem', color: '#6b7280', margin: 0, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {isRtl ? (banner.subtitle_ar || banner.subtitle_en || t('noSubtitle')) : (banner.subtitle_en || banner.subtitle_ar || t('noSubtitle'))}
                                    </p>

                                    {banner.link_url && (
                                        <div style={{ fontSize: '.75rem', color: '#3b82f6', marginTop: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            🔗 {banner.link_url}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
                                        <button
                                            onClick={() => openModal(banner)}
                                            style={{ flex: 1, background: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px', borderRadius: 6, color: '#374151', fontSize: '.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}
                                        >
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => deleteBanner(banner.id)}
                                            disabled={isMultiSyncing}
                                            style={{ width: 36, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: 500, padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{currentBanner ? t('editBanner') : t('addNewBanner')}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6b7280' }}>×</button>
                        </div>
                        <div style={{ padding: 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                                {/* Image Upload */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: '#374151', marginBottom: 8 }}>{t('bannerImage')} {!currentBanner && '*'}</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            height: 160, border: '2px dashed #d1d5db', borderRadius: 8, background: '#f9fafb',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden',
                                            position: 'relative'
                                        }}
                                    >
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview.startsWith('http') || imagePreview.startsWith('data:') ? imagePreview : `http://127.0.0.1:8000${imagePreview}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt=""
                                            />
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                                                <ImageIcon size={32} style={{ margin: '0 auto 8px' }} />
                                                <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{t('clickUploadImage')}</div>
                                                <div style={{ fontSize: '.7rem' }}>{t('imgSizeLimit')}</div>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">{t('titleOptional')} (EN)</label>
                                        <input className="form-input" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} placeholder="Grand Summer Sale" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('titleOptional')} (AR)</label>
                                        <input className="form-input" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="اكتب العنوان بالعربي" />
                                    </div>
                                </div>

                                <div className="grid-2">
                                    <div className="form-group">
                                        <label className="form-label">{t('subtitleOptional')} (EN)</label>
                                        <input className="form-input" value={form.subtitle_en} onChange={e => setForm(f => ({ ...f, subtitle_en: e.target.value }))} placeholder="Up to 50% off on electronics" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('subtitleOptional')} (AR)</label>
                                        <input className="form-input" value={form.subtitle_ar} onChange={e => setForm(f => ({ ...f, subtitle_ar: e.target.value }))} placeholder="خصم يصل إلى 50% على الإلكترونيات" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">{t('linkUrlOptional')}</label>
                                        <input className="form-input" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('sortOrder')}</label>
                                        <input type="number" className="form-input" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} min="0" />
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f9fafb' }}>
                            <button className="btn" onClick={() => setIsModalOpen(false)} style={{ background: '#fff', border: '1px solid #d1d5db' }}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={saveBanner} disabled={formLoading}>
                                {formLoading ? <span className="spinner"></span> : t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
