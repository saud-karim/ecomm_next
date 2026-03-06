'use client';
import { useEffect, useState, useCallback } from 'react';
import { subscriptionsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import toast from 'react-hot-toast';

interface Sub {
    id: number; status: string; starts_at: string; ends_at: string; created_at: string;
    seller?: { store_name: string };
    plan?: { name: string; price: number };
}

const STATUS_CLASS: Record<string, string> = {
    active: 'badge-green', expired: 'badge-red', cancelled: 'badge-gray', pending: 'badge-yellow',
};

export default function SubscriptionsPage() {
    const [subs, setSubs] = useState<Sub[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const { t } = useI18n();

    const fetchSubs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await subscriptionsApi.list({ status, page, per_page: 20 });
            setSubs(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load subscriptions'); }
        finally { setLoading(false); }
    }, [status, page]);

    useEffect(() => { fetchSubs(); }, [fetchSubs]);

    const storeName = (s: Sub) => s.seller?.store_name || '—';
    const planName = (s: Sub) => s.plan?.name || '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('subscriptions')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} {t('totalSubsLabel')}</p>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 200 }}>
                        <option value="">{t('allStatuses2')}</option>
                        <option value="active">{t('active')}</option>
                        <option value="expired">{t('rejected')}</option>
                        <option value="cancelled">{t('cancel')}</option>
                    </select>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr><th>#</th><th>{t('sellers')}</th><th>{t('plan')}</th><th>{t('price')}</th><th>{t('status')}</th><th>{t('starts')}</th><th>{t('ends')}</th></tr>
                        </thead>
                        <tbody>
                            {subs.map(s => (
                                <tr key={s.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{s.id}</td>
                                    <td style={{ fontWeight: 600 }}>{storeName(s)}</td>
                                    <td><span className="badge-pill badge-blue">{planName(s)}</span></td>
                                    <td style={{ fontWeight: 700, color: '#FF6B00' }}>${s.plan?.price ?? '—'}</td>
                                    <td><span className={`badge-pill ${STATUS_CLASS[s.status] || 'badge-gray'}`}>{s.status}</span></td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{s.starts_at ? new Date(s.starts_at).toLocaleDateString() : '—'}</td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{s.ends_at ? new Date(s.ends_at).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                            {!subs.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noSubsFound')}</td></tr>}
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
        </div>
    );
}
