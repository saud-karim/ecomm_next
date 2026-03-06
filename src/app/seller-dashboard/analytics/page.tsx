'use client';
import { useEffect, useState } from 'react';
import { sellerAnalyticsApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RevenueData { date: string; revenue: number; orders: number; }
interface Summary { gross: number; total_orders: number; discounts: number; }

export default function SellerAnalyticsPage() {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [daily, setDaily] = useState<RevenueData[]>([]);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState(() => {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        return d.toISOString().slice(0, 10);
    });
    const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
    const { t } = useI18n();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await sellerAnalyticsApi.revenue({ from, to });
            const d = res.data.data;
            setSummary(d.summary || d);
            setDaily(d.daily || d.data || []);
        } catch { toast.error('Failed to load analytics'); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData(); }, []);

    const days = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 3600 * 24)));
    const stats = summary ? [
        { label: t('totalRevenue2'), value: `$${Number(summary.gross || 0).toLocaleString()}`, color: '#FF6B00' },
        { label: t('totalOrders'), value: summary.total_orders || 0, color: '#3b82f6' },
        { label: t('avgDailyRevenue'), value: `$${Number((summary.gross || 0) / days).toFixed(0)}`, color: '#10b981' },
    ] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('analytics')}</h2>
                <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{t('analyticsSubtitle')}</p>
            </div>

            {/* Date filter */}
            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="form-input" style={{ width: 160 }} />
                    <span style={{ color: '#6b7280' }}>{t('to')}</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="form-input" style={{ width: 160 }} />
                    <button className="btn btn-primary btn-sm" onClick={fetchData} disabled={loading}>{t('apply')}</button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner spinner-dark" /></div>
            ) : (
                <>
                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {stats.map(({ label, value, color }) => (
                            <div key={label} className="card">
                                <div style={{ fontSize: '.75rem', color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Revenue chart */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('dailyRevenue')}</h3>
                        {daily.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={daily}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v) => [`$${v}`, t('totalRevenue2')]} />
                                    <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No data for this period</div>}
                    </div>

                    {/* Orders chart */}
                    <div className="card">
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>{t('orders')}</h3>
                        {daily.length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={daily}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No data for this period</div>}
                    </div>
                </>
            )}
        </div>
    );
}
