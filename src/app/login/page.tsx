'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authApi.login(email, password);
            const { token, user } = res.data.data;
            if (user.role !== 'super_admin' && user.role !== 'seller') {
                toast.error('Access denied.');
                return;
            }
            setAuth(token, user);
            toast.success('Welcome back!');
            if (user.role === 'seller') {
                router.push('/seller-dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 50%, #0f1117 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        </div>
                        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Saf<em style={{ color: '#FF6B00', fontStyle: 'normal' }}>qa</em></span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>Safqa Admin &amp; Seller Portal</p>
                </div>

                {/* Card */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '36px', boxShadow: '0 25px 60px rgba(0,0,0,.3)' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px', color: '#0f1117' }}>Sign in to your account</h1>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                type="email" required autoFocus value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="form-input" placeholder="admin@safqa.com"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password" required value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="form-input" placeholder="••••••••"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '4px' }}>
                            {loading ? <span className="spinner" /> : 'Sign in'}
                        </button>
                    </form>
                </div>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#4b5563', fontSize: '.8rem' }}>
                    Safqa © 2026 — Admin &amp; Seller Access
                </p>
            </div>
        </div>
    );
}
