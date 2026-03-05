export type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
};

export const getToken = (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('safqa_token') : null;

export const getUser = (): AdminUser | null => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('safqa_user');
    return raw ? JSON.parse(raw) : null;
};

export const setAuth = (token: string, user: AdminUser) => {
    localStorage.setItem('safqa_token', token);
    localStorage.setItem('safqa_user', JSON.stringify(user));
};

export const clearAuth = () => {
    localStorage.removeItem('safqa_token');
    localStorage.removeItem('safqa_user');
};

export const isAuthenticated = () => !!getToken();
