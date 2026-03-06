'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Tag, Ticket, User, BarChart3, LogOut, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { authApi } from '@/lib/api';
import { clearAuth, getUser } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import toast from 'react-hot-toast';

export default function SellerSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = getUser();
    const { t, isRtl } = useI18n();

    const NAV = [
        { section: t('overview') },
        { href: '/seller-dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { href: '/seller-dashboard/analytics', icon: BarChart3, label: t('analytics') },
        { section: t('manage') },
        { href: '/seller-dashboard/products', icon: Package, label: t('products') },
        { href: '/seller-dashboard/orders', icon: ShoppingCart, label: t('orders') },
        { href: '/seller-dashboard/offers', icon: Tag, label: t('sellerOffers') },
        { href: '/seller-dashboard/coupons', icon: Ticket, label: t('sellerCoupons') },
        { section: t('billing') },
        { href: '/seller-dashboard/subscription', icon: CreditCard, label: t('subscriptions') },
        { section: t('account') },
        { href: '/seller-dashboard/profile', icon: User, label: t('sellerProfile') },
    ];

    const handleLogout = async () => {
        try { await authApi.logout(); } catch { }
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
                    <div className="badge">{t('seller')}</div>
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
                        {user?.name?.[0]?.toUpperCase() ?? 'S'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div suppressHydrationWarning style={{ color: '#fff', fontSize: '.83rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? 'Seller'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.72rem' }}>{t('seller')}</div>
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
