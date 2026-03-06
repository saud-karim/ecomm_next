'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Locale = 'en' | 'ar';

export const translations = {
    en: {
        // Layout
        admin: 'Admin',
        superAdmin: 'Super Admin',
        logout: 'Logout',
        quickSearch: 'Quick search…',

        // Nav
        overview: 'Overview',
        dashboard: 'Dashboard',
        analytics: 'Analytics',
        manage: 'Manage',
        users: 'Users',
        sellers: 'Sellers',
        products: 'Products',
        orders: 'Orders',
        billing: 'Billing',
        plans: 'Plans',
        subscriptions: 'Subscriptions',

        // Page Titles
        titleDashboard: 'Dashboard',
        titleUsers: 'Users',
        titleSellers: 'Sellers',
        titleProducts: 'Products',
        titleOrders: 'Orders',
        titlePlans: 'Subscription Plans',
        titleSubscriptions: 'Subscriptions',
        titleAnalytics: 'Analytics',
        titleAdminPanel: 'Admin Panel',

        // Dashboard page
        welcomeBack: 'Welcome back, Admin 👋',
        platformOverview: "Here's what's happening on Safqa today.",
        totalRevenue: 'Total Revenue',
        totalOrders: 'Total Orders',
        totalUsers: 'Total Users',
        activeSellers: 'Active Sellers',
        products2: 'Products',
        activeSubs: 'Active Subs',
        pendingSellers: 'Pending Sellers',
        pendingProducts: 'Pending Products',
        needsReview: 'Needs review',
        revenueOverview: 'Revenue Overview',
        thisMonth: 'this month',
        ordersByStatus: 'Orders by Status',
        topSellersByRev: 'Top Sellers by Revenue',
        loadingDashboard: 'Loading dashboard…',
        failedDashboard: 'Failed to load dashboard data.',

        // Users page
        totalUsersLabel: 'total users',
        searchNameEmail: 'Search name or email…',
        allRoles: 'All Roles',
        customer: 'Customer',
        seller: 'Seller',
        admin2: 'Admin',
        clear: 'Clear',
        name: 'Name',
        email: 'Email',
        role: 'Role',
        status: 'Status',
        joined: 'Joined',
        actions: 'Actions',
        active: 'Active',
        inactive: 'Inactive',
        noUsersFound: 'No users found',
        userDetails: 'User Details',
        id: 'ID',
        phone: 'Phone',
        deleteUserConfirm: 'Delete this user permanently?',
        userDeleted: 'User deleted',
        userActivated: 'activated',
        userDeactivated: 'deactivated',

        // Sellers page
        totalSellersLabel: 'total sellers',
        searchStore: 'Search store or email…',
        allSellers: 'All Sellers',
        pendingApproval: 'Pending Approval',
        approved: 'Approved',
        store: 'Store',
        owner: 'Owner',
        plan: 'Plan',
        noSellersFound: 'No sellers found',
        sellerDetails: 'Seller Details',
        storeEn: 'Store (EN)',
        storeAr: 'Store (AR)',
        slug: 'Slug',
        rejectSeller: 'Reject Seller',
        rejectingMsg: 'Rejecting',
        provideReason: 'Please provide a reason:',
        reason: 'Reason for rejection…',
        cancel: 'Cancel',
        pending: 'Pending',

        // Products page
        totalProductsLabel: 'total products',
        searchProduct: 'Search product name…',
        allStatus: 'All Status',
        rejected: 'Rejected',
        product: 'Product',
        category: 'Category',
        price: 'Price',
        stock: 'Stock',
        noProductsFound: 'No products found',
        rejectProduct: 'Reject Product',
        reasonProductReject: 'Reason…',

        // Orders page
        totalOrdersLabel: 'total orders',
        searchOrder: 'Search order ID or customer…',
        allStatuses: 'All Statuses',
        order: 'Order',
        items: 'Items',
        total: 'Total',
        date: 'Date',
        noOrdersFound: 'No orders found',
        updateStatus: 'Update Status:',
        discount: 'Discount',

        // Plans page
        plansSubtitle: 'Manage subscription plans',
        addPlan: 'Add Plan',
        features: 'Features',
        maxProducts2: 'Max Products',
        billCycle: 'Billing Cycle',
        noPlansFound: 'No plans found',
        createPlan: 'Create New Plan',
        editPlan: 'Edit Plan',
        planNameEn: 'Plan Name (EN)',
        planNameAr: 'Plan Name (AR)',
        monthly: 'monthly',
        yearly: 'yearly',
        maxProducts3: 'Max Products',
        enterFeature: 'Enter feature…',
        addFeature: '+ Add',
        save: 'Save',
        saving: 'Saving…',
        deletePlanConfirm: 'Delete this plan?',
        noPlansMapped: 'No plans',

        // Subscriptions page
        totalSubsLabel: 'total subscriptions',
        allStatuses2: 'All Statuses',
        starts: 'Starts',
        ends: 'Ends',
        noSubsFound: 'No subscriptions found',

        // Analytics page
        analyticsSubtitle: 'Track performance over a date range',
        periodRevenue: 'Period Revenue',
        periodOrders: 'Period Orders',
        avgDailyRevenue: 'Avg Daily Revenue',
        apply: 'Apply',
        dailyRevenue: 'Daily Revenue',
        topSellers: 'Top Sellers (By Revenue)',
        revenueByPlan: 'Revenue By Subscription Plan',
        to: 'to',
    },
    ar: {
        // Layout
        admin: 'المشرف',
        superAdmin: 'المشرف الأعلى',
        logout: 'تسجيل الخروج',
        quickSearch: 'بحث سريع…',

        // Nav
        overview: 'نظرة عامة',
        dashboard: 'لوحة التحكم',
        analytics: 'التحليلات',
        manage: 'الإدارة',
        users: 'المستخدمون',
        sellers: 'البائعون',
        products: 'المنتجات',
        orders: 'الطلبات',
        billing: 'الفواتير',
        plans: 'الخطط',
        subscriptions: 'الاشتراكات',

        // Page Titles
        titleDashboard: 'لوحة التحكم',
        titleUsers: 'المستخدمون',
        titleSellers: 'البائعون',
        titleProducts: 'المنتجات',
        titleOrders: 'الطلبات',
        titlePlans: 'خطط الاشتراك',
        titleSubscriptions: 'الاشتراكات',
        titleAnalytics: 'التحليلات',
        titleAdminPanel: 'لوحة الإدارة',

        // Dashboard page
        welcomeBack: 'أهلاً، المشرف 👋',
        platformOverview: 'هذا ما يحدث على صفقة اليوم.',
        totalRevenue: 'إجمالي الإيرادات',
        totalOrders: 'إجمالي الطلبات',
        totalUsers: 'إجمالي المستخدمين',
        activeSellers: 'البائعون النشطون',
        products2: 'المنتجات',
        activeSubs: 'الاشتراكات النشطة',
        pendingSellers: 'البائعون المعلقون',
        pendingProducts: 'المنتجات المعلقة',
        needsReview: 'يحتاج مراجعة',
        revenueOverview: 'نظرة عامة على الإيرادات',
        thisMonth: 'هذا الشهر',
        ordersByStatus: 'الطلبات حسب الحالة',
        topSellersByRev: 'أفضل البائعين بالإيرادات',
        loadingDashboard: 'جارٍ تحميل لوحة التحكم…',
        failedDashboard: 'فشل تحميل بيانات لوحة التحكم.',

        // Users page
        totalUsersLabel: 'إجمالي المستخدمين',
        searchNameEmail: 'ابحث بالاسم أو البريد…',
        allRoles: 'جميع الأدوار',
        customer: 'عميل',
        seller: 'بائع',
        admin2: 'مشرف',
        clear: 'مسح',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        role: 'الدور',
        status: 'الحالة',
        joined: 'تاريخ الانضمام',
        actions: 'الإجراءات',
        active: 'نشط',
        inactive: 'غير نشط',
        noUsersFound: 'لا يوجد مستخدمون',
        userDetails: 'تفاصيل المستخدم',
        id: 'المعرّف',
        phone: 'الهاتف',
        deleteUserConfirm: 'حذف هذا المستخدم نهائياً؟',
        userDeleted: 'تم حذف المستخدم',
        userActivated: 'تم التفعيل',
        userDeactivated: 'تم التعطيل',

        // Sellers page
        totalSellersLabel: 'إجمالي البائعين',
        searchStore: 'ابحث بالمتجر أو البريد…',
        allSellers: 'جميع البائعين',
        pendingApproval: 'بانتظار الموافقة',
        approved: 'موافق عليه',
        store: 'المتجر',
        owner: 'المالك',
        plan: 'الخطة',
        noSellersFound: 'لا يوجد بائعون',
        sellerDetails: 'تفاصيل البائع',
        storeEn: 'المتجر (إنجليزي)',
        storeAr: 'المتجر (عربي)',
        slug: 'الرابط المختصر',
        rejectSeller: 'رفض البائع',
        rejectingMsg: 'رفض',
        provideReason: 'الرجاء تقديم سبب:',
        reason: 'سبب الرفض…',
        cancel: 'إلغاء',
        pending: 'معلق',

        // Products page
        totalProductsLabel: 'إجمالي المنتجات',
        searchProduct: 'ابحث باسم المنتج…',
        allStatus: 'جميع الحالات',
        rejected: 'مرفوض',
        product: 'المنتج',
        category: 'الفئة',
        price: 'السعر',
        stock: 'المخزون',
        noProductsFound: 'لا توجد منتجات',
        rejectProduct: 'رفض المنتج',
        reasonProductReject: 'السبب…',

        // Orders page
        totalOrdersLabel: 'إجمالي الطلبات',
        searchOrder: 'ابحث برقم الطلب أو العميل…',
        allStatuses: 'جميع الحالات',
        order: 'الطلب',
        items: 'المنتجات',
        total: 'الإجمالي',
        date: 'التاريخ',
        noOrdersFound: 'لا توجد طلبات',
        updateStatus: 'تحديث الحالة:',
        discount: 'الخصم',

        // Plans page
        plansSubtitle: 'إدارة خطط الاشتراك',
        addPlan: 'إضافة خطة',
        features: 'المميزات',
        maxProducts2: 'أقصى منتجات',
        billCycle: 'دورة الفوترة',
        noPlansFound: 'لا توجد خطط',
        createPlan: 'إنشاء خطة جديدة',
        editPlan: 'تعديل الخطة',
        planNameEn: 'اسم الخطة (إنجليزي)',
        planNameAr: 'اسم الخطة (عربي)',
        monthly: 'شهري',
        yearly: 'سنوي',
        maxProducts3: 'أقصى منتجات',
        enterFeature: 'أدخل ميزة…',
        addFeature: '+ إضافة',
        save: 'حفظ',
        saving: 'جارٍ الحفظ…',
        deletePlanConfirm: 'حذف هذه الخطة؟',
        noPlansMapped: 'لا توجد خطط',

        // Subscriptions page
        totalSubsLabel: 'إجمالي الاشتراكات',
        allStatuses2: 'جميع الحالات',
        starts: 'يبدأ',
        ends: 'ينتهي',
        noSubsFound: 'لا توجد اشتراكات',

        // Analytics page
        analyticsSubtitle: 'تتبع الأداء خلال نطاق زمني',
        periodRevenue: 'إيرادات الفترة',
        periodOrders: 'طلبات الفترة',
        avgDailyRevenue: 'متوسط الإيرادات اليومية',
        apply: 'تطبيق',
        dailyRevenue: 'الإيرادات اليومية',
        topSellers: 'أفضل البائعين بالإيرادات',
        revenueByPlan: 'الإيرادات حسب خطة الاشتراك',
        to: 'إلى',
    },
} as const;

export type TKey = keyof typeof translations.en;

interface I18nContextType {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: TKey) => string;
    isRtl: boolean;
}

const I18nContext = createContext<I18nContextType>({
    locale: 'en',
    setLocale: () => { },
    t: (k) => k,
    isRtl: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en');

    useEffect(() => {
        const saved = localStorage.getItem('admin_locale') as Locale | null;
        if (saved === 'ar' || saved === 'en') setLocaleState(saved);
    }, []);

    const setLocale = (l: Locale) => {
        setLocaleState(l);
        localStorage.setItem('admin_locale', l);
    };

    const t = (key: TKey): string => translations[locale][key] as string;
    const isRtl = locale === 'ar';

    return (
        <I18nContext.Provider value={{ locale, setLocale, t, isRtl }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
