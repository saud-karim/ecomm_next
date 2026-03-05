'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated()) router.replace('/login');
    }, [router]);

    // Title map
    const titles: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/dashboard/users': 'Users',
        '/dashboard/sellers': 'Sellers',
        '/dashboard/products': 'Products',
        '/dashboard/orders': 'Orders',
        '/dashboard/plans': 'Subscription Plans',
        '/dashboard/subscriptions': 'Subscriptions',
        '/dashboard/analytics': 'Analytics',
    };
    const title = titles[pathname] || 'Admin Panel';

    return (
        <div>
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
