'use client';
import { useEffect, useState, useCallback } from 'react';
import { usersApi } from '@/lib/api';
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

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await usersApi.list({ search, role, page, per_page: 15 });
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
            toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`);
        } catch { toast.error('Failed to update user'); }
    };

    const deleteUser = async (id: number) => {
        if (!confirm('Delete this user permanently?')) return;
        try {
            await usersApi.destroy(id);
            setUsers(prev => prev.filter(u => u.id !== id));
            toast.success('User deleted');
        } catch { toast.error('Failed to delete user'); }
    };

    const roleBadge = (r: string) => {
        const map: Record<string, string> = { super_admin: 'badge-blue', seller: 'badge-orange', customer: 'badge-green' };
        return map[r] || 'badge-gray';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Users</h2>
                    <p style={{ color: '#6b7280', fontSize: '.875rem' }}>{meta.total.toLocaleString()} total users</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={15} color="#9ca3af" />
                        <input placeholder="Search name or email…" value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }} />
                    </div>
                    <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
                        className="form-input form-select" style={{ width: 160 }}>
                        <option value="">All Roles</option>
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="super_admin">Admin</option>
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setRole(''); setPage(1); }}>
                        <Filter size={14} /> Clear
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center' }}>
                        <span className="spinner spinner-dark" />
                    </div>
                ) : (
                    <table className="tbl">
                        <thead>
                            <tr>
                                <th>#</th><th>Name</th><th>Email</th><th>Role</th>
                                <th>Status</th><th>Joined</th><th>Actions</th>
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
                                            {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-secondary btn-xs" onClick={() => setSelected(u)} title="View">
                                                <Eye size={12} />
                                            </button>
                                            <button className="btn btn-xs" title={u.is_active ? 'Deactivate' : 'Activate'}
                                                style={{ background: u.is_active ? '#fee2e2' : '#dcfce7', color: u.is_active ? '#dc2626' : '#15803d', border: 'none' }}
                                                onClick={() => toggleUser(u)}>
                                                {u.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                                            </button>
                                            <button className="btn btn-danger btn-xs" onClick={() => deleteUser(u.id)} title="Delete">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!users.length && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>No users found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
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

            {/* Detail Modal */}
            {selected && (
                <div className="modal-backdrop" onClick={() => setSelected(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">User Details</h3>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: '#6b7280' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[['ID', selected.id], ['Name', selected.name], ['Email', selected.email], ['Phone', selected.phone || '—'], ['Role', selected.role], ['Status', selected.is_active ? '✅ Active' : '❌ Inactive'], ['Joined', new Date(selected.created_at).toLocaleString()]].map(([k, v]) => (
                                <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
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
