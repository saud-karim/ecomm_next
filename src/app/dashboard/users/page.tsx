'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Search, ToggleLeft, ToggleRight, Trash2, Eye, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
    id: number; name: string; email: string; phone: string;
    role: string; is_active: boolean; created_at: string; avatar?: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<User | null>(null);
    const { t } = useI18n();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, unknown> = { search, page, per_page: 15 };
            if (role) params.role = role;
            const res = await usersApi.list(params);
            setUsers(res.data.data.data || res.data.data);
            setMeta(res.data.data.meta || { current_page: res.data.data.current_page, last_page: res.data.data.last_page, total: res.data.data.total });
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    }, [search, role, page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const toggleUser = async (user: User) => {
        try {
            await usersApi.toggle(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
            toast.success(`User ${user.is_active ? t('userDeactivated') : t('userActivated')}`);
        } catch { toast.error('Failed to update user'); }
    };

    const deleteUser = async (id: number) => {
        if (!confirm(t('deleteUserConfirm'))) return;
        try {
            await usersApi.destroy(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            toast.success(t('userDeleted'));
        } catch { toast.error('Failed to delete user'); }
    };

    const roleBadge = (r: string) => {
        const map: Record<string, string> = { super_admin: 'badge-blue', seller: 'badge-orange', customer: 'badge-green' };
        return map[r] || 'badge-gray';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{t('users')}</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} {t('totalUsersLabel')}</p>
                </div>
            </div>

            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder={t('searchNameEmail')} value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 160 }}>
                        <option value="">{t('allRoles')}</option>
                        <option value="customer">{t('customer')}</option>
                        <option value="seller">{t('seller')}</option>
                        <option value="super_admin">{t('admin2')}</option>
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setRole(''); setPage(1); }}>
                        <Filter size={14} /> {t('clear')}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark" /></div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>#</th><th>{t('name')}</th><th>{t('email')}</th><th>{t('role')}</th>
                                <th>{t('status')}</th><th>{t('joined')}</th><th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ color: '#9ca3af', fontSize: '.8rem' }}>{u.id}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="avatar" style={{ width: 32, height: 32, fontSize: '.78rem' }}>{u.name[0]}</div>
                                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#6b7280' }}>{u.email}</td>
                                    <td><span className={`badge-pill ${roleBadge(u.role)}`}>{u.role}</span></td>
                                    <td>
                                        <span className={`badge-pill ${u.is_active ? 'badge-green' : 'badge-red'}`}>
                                            {u.is_active ? t('active') : t('inactive')}
                                        </span>
                                    </td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(u)} title="View"><Eye size={12} /></button>
                                            <button className="btn btn-xs" title={u.is_active ? t('inactive') : t('active')}
                                                style={{ background: u.is_active ? '#fee2e2' : '#dcfce7', color: u.is_active ? '#dc2626' : '#15803d', border: 'none' }}
                                                onClick={() => toggleUser(u)}>
                                                {u.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                            </button>
                                            <button className="btn btn-danger btn-xs" onClick={() => deleteUser(u.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!users.length && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>{t('noUsersFound')}</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
                {meta.last_page > 1 && (
                    <div style={{ padding: '16px 20px' }}>
                        <div className="pagination">
                            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {selected && (
                <div className="modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('userDetails')}</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#6b7280' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {([[t('id'), selected.id], [t('name'), selected.name], [t('email'), selected.email], [t('phone'), selected.phone || '—'], [t('role'), selected.role], [t('status'), selected.is_active ? `✅ ${t('active')}` : `❌ ${t('inactive')}`], [t('joined'), new Date(selected.created_at).toLocaleString()]] as [string, string | number][]).map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <span style={{ color: '#6b7280', fontWeight: 500, fontSize: '.85rem' }}>{k}</span>
                                    <span style={{ fontWeight: 600, fontSize: '.85rem' }}>{String(v)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
