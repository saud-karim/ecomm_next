'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Store, Package, ShoppingCart, CreditCard, Tag, LogOut, ChevronRight, ChevronLeft, User, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { authApi } from '@/lib/api';
import { clearAuth, getUser } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = getUser();
    const { t, isRtl } = useI18n();

    const NAV = [
        { section: t('overview') },
        { href: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { section: t('manage') },
        { href: '/dashboard/users', icon: Users, label: t('users') },
        { href: '/dashboard/tickets', icon: MessageSquare, label: t('supportTickets') },
        { href: '/dashboard/sellers', icon: Store, label: t('sellers') },
        { href: '/dashboard/products', icon: Package, label: t('products') },
        { href: '/dashboard/categories', icon: Tag, label: t('categories') || 'Categories' },
        { href: '/dashboard/banners', icon: ImageIcon, label: t('homepageBanners') },
        { href: '/dashboard/orders', icon: ShoppingCart, label: t('orders') },
        { section: t('billing') },
        { href: '/dashboard/plans', icon: Tag, label: t('plans') },
        { href: '/dashboard/subscriptions', icon: CreditCard, label: t('subscriptions') },
        { section: t('account') },
        { href: '/dashboard/profile', icon: User, label: t('profileTitle') },
    ];

    const handleLogout = async () => {
        try { await authApi.me(); } catch { } // keep API import used
        clearAuth();
        toast.success(t('logout'));
        router.push('/login');
    };

    const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                </div>
                <div>
                    <span>Saf<em>qa</em></span>
                    <div className="badge">{t('admin')}</div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
                {NAV.map((item, i) => {
                    if ('section' in item) {
                        return <div key={i} className="nav-section">{item.section}</div>;
                    }
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                            <Icon className="icon" />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {isActive && <ChevronIcon size={14} />}
                        </Link>
                    );
                })}
            </nav>

            {/* User info + logout */}
            <div style={{ borderTop: '1px solid #1e2130', padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 6 }}>
                    <div className="avatar" suppressHydrationWarning style={{ width: 34, height: 34, fontSize: '.8rem', flexShrink: 0 }}>
                        {user?.name?.[0]?.toUpperCase() ?? 'A'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div suppressHydrationWarning style={{ color: '#fff', fontSize: '.83rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? 'Admin'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.72rem' }}>{t('superAdmin')}</div>
                    </div>
                </div>
                <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut className="icon" size={16} />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </aside>
    );
}
