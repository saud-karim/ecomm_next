'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellerAnalyticsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Package, ShoppingCart, Tag, Ticket, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashData {
    kpis: {
        total_revenue: number;
        total_orders: number;
        total_products: number;
        pending_orders: number;
    };
    daily_revenue: { date: string; revenue: number; orders: number }[];
    top_products: { id: number; name_en: string; name_ar: string; price: number; total_sold: number; revenue: number }[];
}

export default function SellerDashboardPage() {
    const [data, setData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const { t, locale, isRtl } = useI18n();

    const fetchDash = useCallback(() => {
        sellerAnalyticsApi.dashboard()
            .then(res => setData(res.data.data))
            .catch(() => toast.error('Failed to load dashboard'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchDash();
        const interval = setInterval(fetchDash, 30000);
        const onFocus = () => fetchDash();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetchDash]);

    if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-dark" /></div>;
    if (!data) return null;

    const stats = [
        { label: t('totalRevenue2'), value: `$${Number(data.kpis.total_revenue).toLocaleString()}`, icon: DollarSign, color: '#FF6B00' },
        { label: t('totalOrders'), value: data.kpis.total_orders, icon: ShoppingCart, color: '#3b82f6' },
        { label: t('products'), value: data.kpis.total_products, icon: Package, color: '#8b5cf6' },
        { label: t('pendingOrders'), value: data.kpis.pending_orders, icon: TrendingUp, color: '#f59e0b' },
        // Backend analytics endpoint currently does not return active_offers and active_coupons, so we hide them for now or set to 0
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('welcomeBack')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{t('platformOverview')}</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {stats.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div>
                            <div style={{ fontSize: '.75rem', color: '#6b7280', fontWeight: 500 }}>{label}</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f1117' }}>{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Monthly Revenue */}
                <div className="card">
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('sellerRevenue')}</h3>
                    {data.daily_revenue?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.daily_revenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} reversed={isRtl} />
                                <YAxis tick={{ fontSize: 11 }} orientation={isRtl ? 'right' : 'left'} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (<div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No revenue data yet</div>)}
                </div>

                {/* Top Products */}
                <div className="card">
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('topProducts')}</h3>
                    {data.top_products?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data.top_products.map((p, i) => (
                                <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#FF6B00', fontSize: '.9rem' }}>{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{locale === 'ar' ? p.name_ar : p.name_en}</div>
                                        <div style={{ fontSize: '.75rem', color: '#6b7280' }}>${p.price}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, fontSize: '.95rem' }}>${p.revenue}</div>
                                        <div style={{ fontSize: '.75rem', color: '#6b7280' }}>{p.total_sold} sold</div>
                                    </div>
                                </div>
                            ))}    </div>
                    ) : <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No sales data yet</div>}
                </div>
            </div>
        </div>
    );
}
