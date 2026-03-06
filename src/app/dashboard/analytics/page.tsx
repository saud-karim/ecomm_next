'use client';
import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState('2026-01-01');
    const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
    const { t, isRtl } = useI18n();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await analyticsApi.analytics({ from_date: from, to_date: to });
            setData(res.data.data);
        } catch {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    const dailyRevArr = Array.isArray(data?.daily_revenue) ? (data!.daily_revenue as Record<string, string | number>[]) : [];
    const totalRev = dailyRevArr.reduce((sum, item) => sum + Number(item.revenue), 0);
    const totalOrd = dailyRevArr.reduce((sum, item) => sum + Number(item.orders), 0);
    const avgRev = dailyRevArr.length ? totalRev / dailyRevArr.length : 0;

    const stats = data ? [
        { label: t('periodRevenue'), value: `$${totalRev.toLocaleString()}`, icon: DollarSign, color: '#FF6B00', bg: '#fff4ee' },
        { label: t('periodOrders'), value: totalOrd.toLocaleString(), icon: ShoppingCart, color: '#3b82f6', bg: '#eff6ff' },
        { label: t('avgDailyRevenue'), value: `$${avgRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: '#22c55e', bg: '#f0fdf4' },
    ] : [];

    const topSellersArr = Array.isArray(data?.top_sellers) ? (data!.top_sellers as { store_name_ar?: string; store_name_en?: string; orders_sum_total?: number }[]).map(s => ({
        ...s,
        seller_name: isRtl ? s.store_name_ar : s.store_name_en
    })) : [];

    const revenueByPlanArr = Array.isArray(data?.revenue_by_plan) ? (data!.revenue_by_plan as { plan?: { name_ar?: string; name_en?: string }; total_revenue?: number }[]).map(r => ({
        ...r,
        plan_name: isRtl ? r.plan?.name_ar : r.plan?.name_en
    })) : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('analytics')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{t('analyticsSubtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="form-input" style={{ width: 160 }} />
                    <span style={{ color: '#9ca3af' }}>{t('to')}</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="form-input" style={{ width: 160 }} />
                    <button className="btn btn-primary" onClick={fetchData}>{t('apply')}</button>
                </div>
            </div>

            {stats.length > 0 && (
                <div className="grid-3">
                    {stats.map((s, i) => (
                        <div key={i} className="stat-card">
                            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={20} color={s.color} /></div>
                            <div>
                                <div className="stat-label">{s.label}</div>
                                <div className="stat-value">{s.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-dark" style={{ width: 32, height: 32 }} /></div>
            ) : data ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {dailyRevArr.length > 0 && (
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{t('dailyRevenue')}</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={dailyRevArr}>
                                    <defs>
                                        <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} reversed={isRtl} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={60} orientation={isRtl ? 'right' : 'left'} />
                                    <Tooltip formatter={(v) => [`$${v}`, t('periodRevenue')]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} fill="url(#analyticsGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="grid-2">
                        {topSellersArr.length > 0 && (
                            <div className="card">
                                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{t('topSellers')}</h3>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={topSellersArr} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                                        <YAxis dataKey="seller_name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} orientation={isRtl ? 'right' : 'left'} />
                                        <Tooltip formatter={(v) => [`$${v}`, t('totalRevenue')]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                                        <Bar dataKey="orders_sum_total" fill="#FF6B00" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {revenueByPlanArr.length > 0 && (
                            <div className="card">
                                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{t('revenueByPlan')}</h3>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={revenueByPlanArr}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="plan_name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} reversed={isRtl} />
                                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} orientation={isRtl ? 'right' : 'left'} />
                                        <Tooltip formatter={(v) => [`$${v}`, t('revenueByPlan')]} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                                        <Bar dataKey="total_revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
