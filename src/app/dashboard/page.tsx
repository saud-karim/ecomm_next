'use client';
import { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, Store, Package, ShoppingCart, DollarSign, Star, AlertCircle } from 'lucide-react';

interface DashboardData {
    kpis: {
        total_revenue: number; total_orders: number; total_users: number;
        total_sellers: number; total_products: number; pending_sellers: number;
        pending_products: number; active_subscriptions: number;
    };
    revenue_chart: { date: string; revenue: number }[];
    orders_by_status: { status: string; count: number }[];
    top_sellers: { store_name_en: string; store_name_ar: string; revenue: number; orders: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
    delivered: '#22c55e', cancelled: '#ef4444', returned: '#6b7280',
};
const PIE_COLORS = ['#FF6B00', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t, isRtl } = useI18n();

    const fetchDash = useCallback(() => {
        analyticsApi.dashboard()
            .then(r => setData(r.data.data))
            .catch(() => setError(t('failedDashboard')))
            .finally(() => setLoading(false));
    }, [t]);

    useEffect(() => {
        fetchDash();
        const interval = setInterval(fetchDash, 30000);
        const onFocus = () => fetchDash();
        window.addEventListener('focus', onFocus);
        return () => { clearInterval(interval); window.removeEventListener('focus', onFocus); };
    }, [fetchDash]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16 }}>
            <span className="spinner spinner-dark" style={{ width: 36, height: 36 }} />
            <p style={{ color: '#6b7280' }}>{t('loadingDashboard')}</p>
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#fee2e2', color: '#dc2626', padding: '16px 20px', borderRadius: 12 }}>
            <AlertCircle size={18} /> {error}
        </div>
    );

    const s = data!.kpis;

    const stats = [
        { label: t('totalRevenue'), value: `$${s.total_revenue?.toLocaleString() ?? 0}`, icon: DollarSign, color: '#FF6B00', bg: '#fff4ee', change: '+12.5%', up: true },
        { label: t('totalOrders'), value: s.total_orders?.toLocaleString() ?? 0, icon: ShoppingCart, color: '#3b82f6', bg: '#eff6ff', change: '+8.2%', up: true },
        { label: t('totalUsers'), value: s.total_users?.toLocaleString() ?? 0, icon: Users, color: '#22c55e', bg: '#f0fdf4', change: '+5.4%', up: true },
        { label: t('activeSellers'), value: s.total_sellers?.toLocaleString() ?? 0, icon: Store, color: '#8b5cf6', bg: '#f5f3ff', change: '+3.1%', up: true },
        { label: t('products2'), value: s.total_products?.toLocaleString() ?? 0, icon: Package, color: '#f59e0b', bg: '#fffbeb', change: '+15%', up: true },
        { label: t('activeSubs'), value: s.active_subscriptions?.toLocaleString() ?? 0, icon: Star, color: '#ec4899', bg: '#fdf2f8', change: '+2.9%', up: true },
        { label: t('pendingSellers'), value: s.pending_sellers ?? 0, icon: Store, color: '#ef4444', bg: '#fee2e2', change: t('needsReview'), up: false },
        { label: t('pendingProducts'), value: s.pending_products ?? 0, icon: Package, color: '#f97316', bg: '#fff7ed', change: t('needsReview'), up: false },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>{t('welcomeBack')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{t('platformOverview')}</p>
            </div>

            {/* KPI Grid */}
            <div className="grid-4">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg }}>
                            <s.icon size={20} color={s.color} />
                        </div>
                        <div>
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value">{s.value}</div>
                            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.up ? '↑' : '⚠'} {s.change}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid-2">
                {/* Revenue Chart */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <h3 style={{ fontWeight: 700 }}>{t('revenueOverview')}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: '.8rem', fontWeight: 600 }}>
                            <TrendingUp size={14} /> +12.5% {t('thisMonth')}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data?.revenue_chart || []}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} reversed={isRtl} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={50} tickFormatter={v => `$${v}`} orientation={isRtl ? 'right' : 'left'} />
                            <Tooltip formatter={(v) => [`$${v}`, t('totalRevenue')]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                            <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} fill="url(#revGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Orders by Status Pie */}
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{t('ordersByStatus')}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, direction: 'ltr' }}>
                        <ResponsiveContainer width={180} height={200}>
                            <PieChart>
                                <Pie data={data?.orders_by_status || []} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={3}>
                                    {(data?.orders_by_status || []).map((entry, i) => (
                                        <Cell key={i} fill={STATUS_COLORS[entry.status] || PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(data?.orders_by_status || []).map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[item.status] || PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                                    <span style={{ flex: 1, textTransform: 'capitalize', color: '#374151' }}>{item.status}</span>
                                    <span style={{ fontWeight: 700, color: '#0f1117' }}>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Sellers Bar Chart */}
            {data?.top_sellers && data.top_sellers.length > 0 && (
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{t('topSellersByRev')}</h3>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data.top_sellers.map(s => ({ ...s, store_name: isRtl ? (s.store_name_ar || s.store_name_en) : s.store_name_en }))} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                            <YAxis type="category" dataKey="store_name" tick={{ fontSize: 12, fill: '#374151' }} tickLine={false} axisLine={false} width={120} orientation={isRtl ? 'right' : 'left'} />
                            <Tooltip formatter={(v) => [`$${v}`, t('totalRevenue')]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                            <Bar dataKey="revenue" fill="#FF6B00" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
