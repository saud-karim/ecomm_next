'use client';
import { useEffect, useState, useRef } from 'react';
import { Bell, Search, CheckCircle, Package } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { notificationsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface TopbarProps { title: string; }

export default function Topbar({ title }: TopbarProps) {
    const { locale, setLocale, t } = useI18n();

    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async (currentUser: any) => {
        if (!currentUser) return;
        const apiPrefix = currentUser.role === 'super_admin' ? 'admin' : currentUser.role;
        try {
            const res = await notificationsApi.list(apiPrefix);
            setNotifications(res.data.data.notifications.data || []);
            setUnreadCount(res.data.data.unread_count || 0);
        } catch (e) { console.error('Failed to load notifications'); }
    };

    useEffect(() => {
        const currentUser = getUser();
        setUser(currentUser);
        if (currentUser) {
            fetchNotifications(currentUser);
            // Poll every 30 seconds
            const interval = setInterval(() => fetchNotifications(currentUser), 30000);
            const onFocus = () => fetchNotifications(currentUser);
            window.addEventListener('focus', onFocus);

            return () => {
                clearInterval(interval);
                window.removeEventListener('focus', onFocus);
            };
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string, url?: string) => {
        if (!user) return;
        const apiPrefix = user.role === 'super_admin' ? 'admin' : user.role;
        try {
            await notificationsApi.markAsRead(apiPrefix, id);
            fetchNotifications(user);
            setIsMenuOpen(false);
            if (url) router.push(url);
        } catch (e) { console.error(e); }
    };

    const getNotificationLink = (n: any) => {
        if (!user) return '#';
        if (user.role === 'super_admin') {
            if (n.data.type === 'new_product_submitted') return '/dashboard/products';
            return '/dashboard';
        } else if (user.role === 'seller') {
            if (n.data.type === 'product_approved' || n.data.type === 'product_rejected') return '/seller-dashboard/products';
            return '/seller-dashboard/orders';
        }
        return '/customer/orders';
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const apiPrefix = user.role === 'super_admin' ? 'admin' : user.role;
        try {
            await notificationsApi.markAllAsRead(apiPrefix);
            fetchNotifications(user);
            setIsMenuOpen(false);
        } catch (e) { console.error(e); }
    };

    return (
        <header className="topbar">
            <span className="topbar-title">{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Search */}
                <div className="search-bar" style={{ width: 220 }}>
                    <Search size={15} color="#9ca3af" />
                    <input placeholder={t('quickSearch')} />
                </div>

                {/* Language Toggle */}
                <button
                    onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
                    suppressHydrationWarning
                    style={{
                        background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
                        padding: '4px 10px', fontSize: '.78rem', fontWeight: 700, color: '#FF6B00',
                        letterSpacing: '0.04em', lineHeight: 1.6, transition: 'border-color 150ms', minWidth: 42, textAlign: 'center'
                    }}
                    title={locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                >
                    {locale === 'en' ? 'عربي' : 'EN'}
                </button>

                {/* Bell */}
                {user && (
                    <div style={{ position: 'relative' }} ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 150ms' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <Bell size={20} color="#6b7280" />
                            {unreadCount > 0 && <span style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#FF6B00', border: '2px solid #fff' }} />}
                        </button>

                        {isMenuOpen && (
                            <div className="card" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: -10, width: 320, padding: 0, zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                                    <h4 style={{ margin: 0, fontSize: '.95rem', fontWeight: 800, color: '#1f2937' }}>Notifications</h4>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
                                    )}
                                </div>
                                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id, getNotificationLink(n))}
                                            style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', gap: 12, background: n.read_at ? '#fff' : '#fff7f0', transition: 'background 150ms' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseOut={(e) => e.currentTarget.style.background = n.read_at ? '#fff' : '#fff7f0'}
                                        >
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.read_at ? '#f3f4f6' : '#FF6B0018', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {n.data.type === 'new_order' ? <Package size={16} color={n.read_at ? '#9ca3af' : '#FF6B00'} /> : <CheckCircle size={16} color={n.read_at ? '#9ca3af' : '#FF6B00'} />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '.85rem', fontWeight: n.read_at ? 600 : 700, color: '#1f2937', marginBottom: 2 }}>{n.data.title}</div>
                                                <div style={{ fontSize: '.8rem', color: '#6b7280', lineHeight: 1.4 }}>{n.data.message}</div>
                                                <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>No notifications yet</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Avatar */}
                <div className="avatar" suppressHydrationWarning style={{ width: 36, height: 36, fontSize: '.85rem', background: '#ffedd5', color: '#FF6B00', cursor: 'pointer' }}>
                    {user?.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
            </div>
        </header>
    );
}
