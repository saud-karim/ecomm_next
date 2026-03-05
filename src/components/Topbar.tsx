'use client';
import { Bell, Search } from 'lucide-react';
import { getUser } from '@/lib/auth';

interface TopbarProps { title: string; }

export default function Topbar({ title }: TopbarProps) {
    const user = getUser();
    return (
        <header className="topbar">
            <span className="topbar-title">{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Search */}
                <div className="search-bar" style={{ width: 220 }}>
                    <Search size={15} color="#9ca3af" />
                    <input placeholder="Quick search…" />
                </div>
                {/* Bell */}
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 6 }}>
                    <Bell size={20} color="#6b7280" />
                    <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#FF6B00', border: '2px solid #fff' }} />
                </button>
                {/* Avatar */}
                <div className="avatar" suppressHydrationWarning style={{ width: 36, height: 36, fontSize: '.85rem', background: '#ffedd5', color: '#FF6B00', cursor: 'pointer' }}>
                    {user?.name?.[0]?.toUpperCase() ?? 'A'}
                </div>
            </div>
        </header>
    );
}
