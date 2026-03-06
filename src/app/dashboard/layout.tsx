'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { I18nProvider, useI18n, TKey } from '@/lib/i18n';

const TITLE_KEYS: Record<string, TKey> = {
    '/dashboard': 'titleDashboard',
    '/dashboard/users': 'titleUsers',
    '/dashboard/sellers': 'titleSellers',
    '/dashboard/products': 'titleProducts',
    '/dashboard/orders': 'titleOrders',
    '/dashboard/plans': 'titlePlans',
    '/dashboard/subscriptions': 'titleSubscriptions',
    '/dashboard/analytics': 'titleAnalytics',
};

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { t, isRtl } = useI18n();

    useEffect(() => {
        if (!isAuthenticated()) router.replace('/login');
    }, [router]);

    const titleKey = TITLE_KEYS[pathname] || 'titleAdminPanel';
    const title = t(titleKey);

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} style={{ fontFamily: isRtl ? "'Cairo', 'Inter', sans-serif" : "'Inter', 'Cairo', sans-serif" }}>
            <Sidebar />
            <div className="main-layout">
                <Topbar title={title} />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </I18nProvider>
    );
}
