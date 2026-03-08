'use client';
import { useEffect, useState, useRef } from 'react';
import { Bell, Search, CheckCircle, Package, Users, User, KeyRound, LogOut } from 'lucide-react';
import { getUser, clearAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { notificationsApi, globalApi } from '@/lib/api';
import { useRouter } from 'next/navigation';


interface TopbarProps { title: string; }

export default function Topbar({ title }: TopbarProps) {
    const { locale, setLocale, t, isRtl } = useI18n();

    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Profile dropdown state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Global Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async (currentUser: any) => {
        if (!currentUser) return;
        const apiPrefix = currentUser.role === 'super_admin' ? 'admin' : currentUser.role;
        try {
            const res = await notificationsApi.list(apiPrefix);
            setNotifications(res.data.data.notifications.data || []);
            setUnreadCount(res.data.data.unread_count || 0);
        } catch (e) {
            console.warn('Failed to load notifications');
        }
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
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
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
        // If the notification carries an explicit url, normalize and use it
        if (n.data?.url) {
            let url: string = n.data.url;
            // Fix legacy/incorrect paths that don't have the correct dashboard prefix
            if (url.startsWith('/tickets/')) {
                url = user?.role === 'seller'
                    ? url.replace('/tickets/', '/seller-dashboard/tickets/')
                    : url.replace('/tickets/', '/dashboard/tickets/');
            }
            if (url.startsWith('/seller/tickets/')) {
                url = url.replace('/seller/tickets/', '/seller-dashboard/tickets/');
            }
            return url;
        }
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
    const getStatusLabel = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return t('statusPending');
            case 'processing': return t('statusProcessing');
            case 'shipped': return t('statusShipped');
            case 'delivered': return t('statusDelivered');
            case 'cancelled': return t('statusCancelled');
            default: return status || '';
        }
    };

    const formatMessage = (template: string, replacements: any) => {
        let msg = template;
        Object.keys(replacements).forEach(key => {
            msg = msg.replace(`{${key}}`, replacements[key]);
        });
        return msg;
    };

    const getNotificationContent = (n: any) => {
        const type = n.data.type;
        let title = n.data.title;
        let message = n.data.message;

        switch (type) {
            case 'new_order':
                title = t('notifNewOrderTitle');
                message = formatMessage(t('notifNewOrderMsg'), { id: n.data.order_id, amount: n.data.amount });
                break;
            case 'product_approved':
                title = t('notifProductApprovedTitle');
                message = formatMessage(t('notifProductApprovedMsg'), { name: isRtl ? (n.data.product_name_ar || n.data.product_name) : (n.data.product_name || n.data.product_name_ar) });
                break;
            case 'product_rejected':
                title = t('notifProductRejectedTitle');
                message = formatMessage(t('notifProductRejectedMsg'), {
                    name: isRtl ? (n.data.product_name_ar || n.data.product_name) : (n.data.product_name || n.data.product_name_ar),
                    reason: n.data.reason
                });
                break;
            case 'new_product_submitted':
                title = t('notifNewProductSubmittedTitle');
                message = formatMessage(t('notifNewProductSubmittedMsg'), {
                    name: isRtl ? (n.data.product_name_ar || n.data.product_name) : (n.data.product_name || n.data.product_name_ar)
                });
                break;
            case 'order_status_updated':
                title = t('notifOrderStatusUpdatedTitle');
                message = formatMessage(t('notifOrderStatusUpdatedMsg'), { id: n.data.order_id, status: getStatusLabel(n.data.status) });
                break;
            case 'order_status_changed':
                title = t('notifOrderStatusChangedTitle');
                if (n.data.changed_by === 'seller') {
                    message = formatMessage(t('notifOrderStatusChangedBySellerMsg'), {
                        store: isRtl ? (n.data.store_name_ar || n.data.store_name) : (n.data.store_name || n.data.store_name_ar) || 'Seller',
                        id: n.data.order_id,
                        status: getStatusLabel(n.data.status)
                    });
                } else {
                    message = formatMessage(t('notifOrderStatusChangedByAdminMsg'), { id: n.data.order_id, status: getStatusLabel(n.data.status) });
                }
                break;
        }

        return { title, message };
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim() || query.length < 2) {
            setSearchResults(null);
            setIsSearchOpen(false);
            return;
        }

        setIsSearching(true);
        setIsSearchOpen(true);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            if (!user) return;
            const apiPrefix = user.role === 'super_admin' ? 'admin' : user.role;
            try {
                const res = await globalApi.search(apiPrefix, query);
                setSearchResults(res.data.data);
            } catch (e) {
                console.error('Search failed', e);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce
    };

    const navTo = (path: string) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        router.push(path);
    };

    return (
        <header className="topbar">
            <span className="topbar-title">{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Search */}
                <div style={{ position: 'relative' }} ref={searchRef}>
                    <div className="search-bar" style={{ width: 280 }}>
                        <Search size={15} color="#9ca3af" />
                        <input
                            placeholder={t('quickSearch') || 'Search users, products, orders...'}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
                        />
                        {isSearching && <span className="spinner spinner-dark" style={{ width: 14, height: 14, position: 'absolute', right: 12 }} />}
                    </div>

                    {/* Search Dropdown */}
                    {isSearchOpen && searchResults && (
                        <div className="card" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, left: 0, padding: 0, zIndex: 60, boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden', border: '1px solid #e5e7eb', borderRadius: 12 }}>
                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>

                                {/* Users Results (Admin only) */}
                                {searchResults.users && searchResults.users.length > 0 && (
                                    <div>
                                        <div style={{ padding: '8px 12px', background: '#f9fafb', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Users & Sellers</div>
                                        {searchResults.users.map((u: any) => (
                                            <div key={`u-${u.id}`} onClick={() => navTo(u.role === 'seller' ? '/dashboard/sellers' : '/dashboard/users')} style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} className="hover-bg-gray">
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 600 }}>{u.name[0]?.toUpperCase()}</div>
                                                <div>
                                                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1f2937' }}>{u.name}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#6b7280' }}>{u.email} • {u.role}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Products Results */}
                                {searchResults.products && searchResults.products.length > 0 && (
                                    <div>
                                        <div style={{ padding: '8px 12px', background: '#f9fafb', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products</div>
                                        {searchResults.products.map((p: any) => (
                                            <div key={`p-${p.id}`} onClick={() => navTo(user?.role === 'seller' ? '/seller-dashboard/products' : '/dashboard/products')} style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} className="hover-bg-gray">
                                                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {p.primary_image?.url ? <img src={p.primary_image.url.startsWith('http') ? p.primary_image.url : `http://127.0.0.1:8000${p.primary_image.url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} /> : <Package size={14} color="#9ca3af" />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1f2937' }}>{locale === 'ar' ? (p.name_ar || p.name_en) : p.name_en}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#6b7280' }}>{p.sku}</div>
                                                </div>
                                                <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#FF6B00' }}>${p.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Orders Results */}
                                {searchResults.orders && searchResults.orders.length > 0 && (
                                    <div>
                                        <div style={{ padding: '8px 12px', background: '#f9fafb', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orders</div>
                                        {searchResults.orders.map((o: any) => (
                                            <div key={`o-${o.id}`} onClick={() => navTo(user?.role === 'seller' ? '/seller-dashboard/orders' : '/dashboard/orders')} style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} className="hover-bg-gray">
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700 }}>#{o.id}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#1f2937' }}>Customer: {o.customer?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#6b7280', textTransform: 'capitalize' }}>Status: {o.status}</div>
                                                </div>
                                                <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#10b981' }}>${o.total}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* No Results state */}
                                {(!searchResults.users?.length && !searchResults.products?.length && !searchResults.orders?.length) && (
                                    <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
                            <div className="card" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: isRtl ? 'auto' : -10, left: isRtl ? -10 : 'auto', width: 320, padding: 0, zIndex: 50, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                                    <h4 style={{ margin: 0, fontSize: '.95rem', fontWeight: 800, color: '#1f2937' }}>{t('notifications')}</h4>
                                    {unreadCount > 0 && (
                                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: '#FF6B00', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>{t('markAllRead')}</button>
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
                                            {(() => {
                                                const { title, message } = getNotificationContent(n);
                                                return (
                                                    <div>
                                                        <div style={{ fontSize: '.85rem', fontWeight: n.read_at ? 600 : 700, color: '#1f2937', marginBottom: 2 }}>{title}</div>
                                                        <div style={{ fontSize: '.8rem', color: '#6b7280', lineHeight: 1.4 }}>{message}</div>
                                                        <div style={{ fontSize: '.7rem', color: '#9ca3af', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )) : (
                                        <div style={{ padding: 30, textAlign: 'center', color: '#9ca3af', fontSize: '.85rem' }}>{t('noNotificationsYet')}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Avatar + Profile Dropdown */}
                {user && (
                    <div style={{ position: 'relative' }} ref={profileRef}>
                        <div
                            className="avatar"
                            suppressHydrationWarning
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            style={{ width: 36, height: 36, fontSize: '.85rem', background: '#ffedd5', color: '#FF6B00', cursor: 'pointer', userSelect: 'none' }}
                            title={user?.name}
                        >
                            {user?.name?.[0]?.toUpperCase() ?? 'A'}
                        </div>

                        {isProfileOpen && (
                            <div className="card" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 220, padding: 0, zIndex: 55, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                                {/* User info header */}
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#1f2937' }}>{user?.name}</div>
                                    <div style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
                                </div>

                                {/* Menu Items */}
                                {[
                                    {
                                        icon: <User size={15} />,
                                        label: 'Edit Profile',
                                        onClick: () => {
                                            setIsProfileOpen(false);
                                            router.push(user?.role === 'seller' ? '/seller-dashboard/profile' : '/dashboard/profile');
                                        }
                                    },
                                    {
                                        icon: <KeyRound size={15} />,
                                        label: 'Change Password',
                                        onClick: () => {
                                            setIsProfileOpen(false);
                                            router.push(user?.role === 'seller' ? '/seller-dashboard/profile' : '/dashboard/profile');
                                        }
                                    },
                                ].map(item => (
                                    <button
                                        key={item.label}
                                        onClick={item.onClick}
                                        style={{
                                            width: '100%', background: 'none', border: 'none', padding: '12px 16px',
                                            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                            fontSize: '.85rem', color: '#374151', fontWeight: 500,
                                            textAlign: 'left', transition: 'background 150ms',
                                            borderBottom: '1px solid #f9fafb',
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.background = '#f3f4f6')}
                                        onMouseOut={e => (e.currentTarget.style.background = 'none')}
                                    >
                                        <span style={{ color: '#6b7280' }}>{item.icon}</span>
                                        {item.label}
                                    </button>
                                ))}

                                {/* Logout */}
                                <button
                                    onClick={() => { setIsProfileOpen(false); clearAuth(); router.push('/login'); }}
                                    style={{
                                        width: '100%', background: 'none', border: 'none', padding: '12px 16px',
                                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                                        fontSize: '.85rem', color: '#dc2626', fontWeight: 600,
                                        textAlign: 'left', transition: 'background 150ms',
                                    }}
                                    onMouseOver={e => (e.currentTarget.style.background = '#fef2f2')}
                                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                                >
                                    <LogOut size={15} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
