'use client';
import { useEffect, useState } from 'react';
import { sellerSubscriptionApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { CreditCard, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Plan { id: number; name: string; price: number; billing_cycle: string; max_products: number; max_offers: number; is_featured: boolean; }
interface Subscription { id: number; status: string; starts_at: string; expires_at: string; plan?: Plan; }

export default function SellerSubscriptionPage() {
    const [current, setCurrent] = useState<Subscription | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [history, setHistory] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState<number | null>(null);
    const { t } = useI18n();

    useEffect(() => {
        Promise.all([
            sellerSubscriptionApi.current().catch(() => ({ data: { data: null } })),
            sellerSubscriptionApi.plans(),
            sellerSubscriptionApi.history().catch(() => ({ data: { data: [] } })),
        ]).then(([cur, pl, hist]) => {
            setCurrent(cur.data.data?.subscription || null);
            setPlans(pl.data.data || pl.data);
            setHistory(hist.data.data || []);
        }).catch(() => toast.error('Failed to load subscription data'))
            .finally(() => setLoading(false));
    }, []);

    const subscribe = async (planId: number) => {
        setSubscribing(planId);
        try {
            const res = await sellerSubscriptionApi.subscribe(planId);
            setCurrent(res.data.data);
            toast.success(t('subscribeNow') + ' ✓');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed';
            toast.error(msg);
        } finally { setSubscribing(null); }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-dark" /></div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Current Plan */}
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('subscriptions')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{t('currentPlan')}</p>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 24px' }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: current ? '#FF6B0018' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={24} color={current ? '#FF6B00' : '#9ca3af'} />
                </div>
                <div style={{ flex: 1 }}>
                    {current ? (
                        <>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{current.plan?.name}</div>
                            <div style={{ color: '#6b7280', fontSize: '.85rem' }}>
                                {t('expiresOn')}: {current.expires_at ? new Date(current.expires_at).toLocaleDateString() : '—'} ·
                                <span className={`badge-pill ${current.status === 'active' ? 'badge-green' : 'badge-red'}`} style={{ marginLeft: 8 }}>{current.status}</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ color: '#6b7280' }}>{t('noPlan')}</div>
                    )}
                </div>
                {current && <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FF6B00' }}>${current.plan?.price}<span style={{ fontSize: '.8rem', fontWeight: 500, color: '#9ca3af' }}>/{current.plan?.billing_cycle}</span></div>}
            </div>

            {/* Available Plans */}
            <div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>{t('choosePlan')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {plans.map(p => {
                        const isCurrent = current?.plan?.id === p.id;
                        return (
                            <div key={p.id} className="card" style={{ border: isCurrent ? '2px solid #FF6B00' : undefined, position: 'relative' }}>
                                {isCurrent && (
                                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                        <CheckCircle size={18} color="#FF6B00" />
                                    </div>
                                )}
                                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{p.name}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF6B00', marginBottom: 12 }}>
                                    ${p.price}<span style={{ fontSize: '.8rem', fontWeight: 500, color: '#9ca3af' }}>/{p.billing_cycle}</span>
                                </div>
                                <div style={{ fontSize: '.82rem', color: '#374151', marginBottom: 4 }}>📦 {t('maxProducts2')}: <strong>{p.max_products}</strong></div>
                                <div style={{ fontSize: '.82rem', color: '#374151', marginBottom: 16 }}>🏷️ Max Offers: <strong>{p.max_offers}</strong></div>
                                <button
                                    className={`btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}`}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    disabled={isCurrent || subscribing === p.id}
                                    onClick={() => !isCurrent && subscribe(p.id)}
                                >
                                    {subscribing === p.id ? <span className="spinner" /> : isCurrent ? `✓ ${t('currentPlan')}` : t('subscribeNow')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* History */}
            {history.length > 0 && (
                <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>{t('planHistory')}</h3>
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="tbl">
                            <thead>
                                <tr><th>{t('plan')}</th><th>{t('starts')}</th><th>{t('ends')}</th><th>{t('status')}</th></tr>
                            </thead>
                            <tbody>
                                {history.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.plan?.name || '—'}</td>
                                        <td style={{ fontSize: '.8rem' }}>{new Date(s.starts_at).toLocaleDateString()}</td>
                                        <td style={{ fontSize: '.8rem' }}>{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</td>
                                        <td><span className={`badge-pill ${s.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{s.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
