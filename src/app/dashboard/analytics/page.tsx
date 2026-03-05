'use client';
import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState('2026-01-01');
    const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await analyticsApi.analytics({ from_date: from, to_date: to });
            setData(res.data.data);
        } catch { toast.error('Failed to load analytics'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const stats = data ? [
        { label: 'Total Revenue', value: `$${(data.total_revenue as number)?.toLocaleString() ?? 0}`, icon: DollarSign, color: '#FF6B00', bg: '#fff4ee' },
        { label: 'Total Orders', value: (data.total_orders as number)?.toLocaleString() ?? 0, icon: ShoppingCart, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'New Users', value: (data.new_users as number)?.toLocaleString() ?? 0, icon: Users, color: '#22c55e', bg: '#f0fdf4' },
        { label: 'Avg Order Value', value: `$${(data.avg_order_value as number)?.toFixed(2) ?? 0}`, icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Analytics</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>Track performance over a date range</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="form-input" style={{ width: 160 }} />
                    <span style={{ color: '#9ca3af' }}>to</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="form-input" style={{ width: 160 }} />
                    <button className="btn btn-primary" onClick={fetchData}>Apply</button>
                </div>
            </div>

            {/* KPIs */}
            {stats.length > 0 && (
                <div className="grid-4">
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
                    {/* Revenue Chart */}
                    {Array.isArray(data.daily_revenue) && data.daily_revenue.length > 0 && (
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Daily Revenue</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={data.daily_revenue as { date: string; revenue: number }[]}>
                                    <defs>
                                        <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={60} />
                                    <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                                    <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} fill="url(#analyticsGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Top Categories */}
                    {Array.isArray(data.top_categories) && data.top_categories.length > 0 && (
                        <div className="card">
                            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Top Categories</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.top_categories as { name: string; orders: number }[]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
                                    <Bar dataKey="orders" fill="#FF6B00" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
