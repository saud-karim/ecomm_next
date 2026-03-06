'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/auth';
import SellerSidebar from '@/components/SellerSidebar';
import Topbar from '@/components/Topbar';
import { I18nProvider, useI18n, TKey } from '@/lib/i18n';

const TITLE_KEYS: Record<string, TKey> = {
    '/seller-dashboard': 'dashboard',
    '/seller-dashboard/products': 'myProducts',
    '/seller-dashboard/orders': 'orders',
    '/seller-dashboard/offers': 'sellerOffers',
    '/seller-dashboard/coupons': 'sellerCoupons',
    '/seller-dashboard/analytics': 'analytics',
    '/seller-dashboard/subscription': 'subscriptions',
    '/seller-dashboard/profile': 'sellerProfile',
};

function SellerLayoutInner({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { t, isRtl } = useI18n();

    useEffect(() => {
        if (!isAuthenticated()) { router.replace('/login'); return; }
        const user = getUser();
        if (user?.role !== 'seller') router.replace('/login');
    }, [router]);

    const titleKey = TITLE_KEYS[pathname] || 'dashboard';
    const title = t(titleKey);

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ fontFamily: isRtl ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif" }}>
            <SellerSidebar />
            <div className="main-layout">
                <Topbar title={title} />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <SellerLayoutInner>{children}</SellerLayoutInner>
        </I18nProvider>
    );
}
