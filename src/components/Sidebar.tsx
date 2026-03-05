'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Store, Package, ShoppingCart, CreditCard, Tag, BarChart3, LogOut, ChevronRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import { clearAuth, getUser } from '@/lib/auth';
import toast from 'react-hot-toast';

const NAV = [
    { section: 'Overview' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { section: 'Manage' },
    { href: '/dashboard/users', icon: Users, label: 'Users' },
    { href: '/dashboard/sellers', icon: Store, label: 'Sellers' },
    { href: '/dashboard/products', icon: Package, label: 'Products' },
    { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders' },
    { section: 'Billing' },
    { href: '/dashboard/plans', icon: Tag, label: 'Plans' },
    { href: '/dashboard/subscriptions', icon: CreditCard, label: 'Subscriptions' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const user = getUser();

    const handleLogout = async () => {
        try { await authApi.logout(); } catch { }
        clearAuth();
        toast.success('Logged out');
        router.push('/login');
    };

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                </div>
                <div>
                    <span>Saf<em>qa</em></span>
                    <div className="badge">Admin</div>
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
                            {isActive && <ChevronRight size={14} />}
                        </Link>
                    );
                })}
            </nav>

            {/* User info + logout */}
            <div style={{ borderTop: '1px solid #1e2130', padding: '16px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, marginBottom: 6 }}>
                    <div className="avatar" suppressHydrationWarning style={{ width: 34, height: 34, fontSize: '.8rem' }}>
                        {user?.name?.[0]?.toUpperCase() ?? 'A'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div suppressHydrationWarning style={{ color: '#fff', fontSize: '.83rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name ?? 'Admin'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.72rem' }}>Super Admin</div>
                    </div>
                </div>
                <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <LogOut className="icon" size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
