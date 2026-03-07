'use client';
import { useEffect, useState, useCallback } from 'react';
import { adminTicketsApi } from '@/lib/api';
import { MessageSquare, AlertCircle, Clock, CheckCircle, Send, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';

import { useI18n } from '@/lib/i18n';

interface Ticket {
    id: number;
    user_id: number;
    subject: string;
    status: 'open' | 'pending' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at: string;
    messages_count: number;
    user: { id: number; name: string; role: string; email?: string };
    messages?: TicketMessage[];
}

interface TicketMessage {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: { id: number; name: string; role: string };
}

export default function AdminTicketsPage() {
    const { t } = useI18n();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>('');

    // View Ticket Modal State
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const fetchTickets = useCallback(() => {
        setLoading(true);
        const params: any = { page, per_page: 15 };
        if (statusFilter) params.status = statusFilter;

        adminTicketsApi.list(params)
            .then(res => {
                setTickets(res.data.data.data);
                setTotalPages(res.data.data.last_page);
                setPage(res.data.data.current_page);
            })
            .catch(() => toast.error('Failed to load tickets'))
            .finally(() => setLoading(false));
    }, [page, statusFilter]);

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 30000);
        const onFocus = () => fetchTickets();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [fetchTickets]);

    const viewTicket = async (id: number) => {
        setMessagesLoading(true);
        setSelectedTicket({ id } as Ticket); // placeholder to open modal
        try {
            const res = await adminTicketsApi.show(id);
            setSelectedTicket(res.data.data);
        } catch {
            toast.error('Failed to load ticket details');
            setSelectedTicket(null);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !selectedTicket) return;
        setReplying(true);
        try {
            const res = await adminTicketsApi.reply(selectedTicket.id, replyText);
            const newMessage = res.data.data;
            setSelectedTicket({
                ...selectedTicket,
                status: selectedTicket.status === 'open' ? 'pending' : selectedTicket.status,
                messages: [...(selectedTicket.messages || []), newMessage]
            });
            setReplyText('');
            toast.success('Reply sent');
            fetchTickets(); // refresh list silently
        } catch {
            toast.error('Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const updateStatus = async (status: 'open' | 'pending' | 'closed') => {
        if (!selectedTicket) return;
        try {
            await adminTicketsApi.updateStatus(selectedTicket.id, status);
            setSelectedTicket({ ...selectedTicket, status });
            toast.success(`Ticket marked as ${status}`);
            fetchTickets();
        } catch {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return { bg: '#fee2e2', text: '#ef4444', icon: AlertCircle };
            case 'pending': return { bg: '#fef3c7', text: '#f59e0b', icon: Clock };
            case 'closed': return { bg: '#d1fae5', text: '#10b981', icon: CheckCircle };
            default: return { bg: '#f3f4f6', text: '#6b7280', icon: MessageSquare };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#3b82f6';
            default: return '#6b7280';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>{t('supportTickets')}</h1>

                <div style={{ display: 'flex', gap: 8 }}>
                    {['', 'open', 'pending', 'closed'].map(status => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setPage(1); }}
                            style={{
                                padding: '6px 12px', borderRadius: 20, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer',
                                border: statusFilter === status ? 'none' : '1px solid #e5e7eb',
                                background: statusFilter === status ? '#111827' : '#fff',
                                color: statusFilter === status ? '#fff' : '#374151'
                            }}
                        >
                            {status === '' ? t('allTickets') : status === 'open' ? t('open') : status === 'pending' ? t('pendingWait') : t('closed')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="tbl">
                    <thead>
                        <tr>
                            <th>{t('supportTickets')}</th>
                            <th>{t('user')}</th>
                            <th>{t('priority')}</th>
                            <th>{t('status')}</th>
                            <th>{t('lastUpdate')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark"></span></td></tr>
                        ) : tickets.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                    <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    {t('noTicketsFound')}
                                </td>
                            </tr>
                        ) : (
                            tickets.map(ticket => {
                                const statusUI = getStatusColor(ticket.status);
                                const StatusIcon = statusUI.icon;
                                return (
                                    <tr key={ticket.id} onClick={() => viewTicket(ticket.id)} style={{ cursor: 'pointer' }} className="table-row-hover">
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                                                {ticket.subject}
                                            </div>
                                            <div style={{ fontSize: '.75rem', color: '#6b7280', display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <span>#{ticket.id}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={12} /> {ticket.messages_count} msgs</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                                                    {ticket.user?.name.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#111827' }}>{ticket.user?.name}</div>
                                                    <div style={{ fontSize: '.75rem', color: '#6b7280', textTransform: 'capitalize' }}>
                                                        {ticket.user?.role === 'seller' ? t('seller') : t('customer')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', color: getPriorityColor(ticket.priority) }}>
                                                {ticket.priority === 'low' ? t('priorityLow').split('-')[0].trim() : ticket.priority === 'medium' ? t('priorityMedium').split('-')[0].trim() : t('priorityHigh').split('-')[0].trim()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge" style={{ background: statusUI.bg, color: statusUI.text, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                <StatusIcon size={12} /> {ticket.status === 'open' ? t('open') : ticket.status === 'pending' ? t('pendingWait') : t('closed')}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '.85rem', color: '#6b7280' }}>
                                            {formatDate(ticket.updated_at)}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {/* Pagination (Simplified) */}
                {totalPages > 1 && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'center' }}>
                        <div className="pagination">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Ticket Modalll */}
            {selectedTicket && (
                <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
                    <div className="modal" style={{ maxWidth: 800, padding: 0, height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

                        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111827' }}>{selectedTicket.subject || 'Loading...'}</h2>
                                        {selectedTicket.status && (
                                            <span className="badge" style={{ background: getStatusColor(selectedTicket.status).bg, color: getStatusColor(selectedTicket.status).text }}>
                                                {selectedTicket.status === 'open' ? t('open') : selectedTicket.status === 'pending' ? t('pendingWait') : t('closed')}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 16, fontSize: '.85rem', color: '#6b7280' }}>
                                        <span>{t('id')}: #{selectedTicket.id}</span>
                                        <span>•</span>
                                        <span>{t('user')}: {selectedTicket.user?.name} ({selectedTicket.user?.role === 'seller' ? t('seller') : t('customer')})</span>
                                        <span>•</span>
                                        <span style={{ color: getPriorityColor(selectedTicket.priority), fontWeight: 600, textTransform: 'uppercase' }}>{selectedTicket.priority === 'low' ? t('priorityLow').split('-')[0].trim() : selectedTicket.priority === 'medium' ? t('priorityMedium').split('-')[0].trim() : t('priorityHigh').split('-')[0].trim()}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6b7280' }}>×</button>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                {selectedTicket.status !== 'closed' ? (
                                    <button onClick={() => updateStatus('closed')} className="btn" style={{ fontSize: '.8rem', padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle size={14} /> {t('closeTicket')}
                                    </button>
                                ) : (
                                    <button onClick={() => updateStatus('open')} className="btn" style={{ fontSize: '.8rem', padding: '6px 12px', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <AlertCircle size={14} /> {t('reopenTicket')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: 24, flex: 1, overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {messagesLoading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark"></span></div>
                            ) : (
                                selectedTicket.messages?.map(msg => {
                                    const isAdmin = msg.user.role === 'admin' || msg.user.role === 'super_admin';
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                fontSize: '.75rem', color: '#9ca3af', marginBottom: 4, padding: '0 4px',
                                                display: 'flex', gap: 8, flexDirection: isAdmin ? 'row-reverse' : 'row'
                                            }}>
                                                <span style={{ fontWeight: 600, color: '#4b5563' }}>{isAdmin ? 'Admin' : msg.user.name}</span>
                                                <span>{formatDate(msg.created_at)}</span>
                                            </div>
                                            <div style={{
                                                background: isAdmin ? '#111827' : '#f3f4f6',
                                                color: isAdmin ? '#fff' : '#1f2937',
                                                padding: '12px 16px', borderRadius: 12,
                                                borderBottomRightRadius: isAdmin ? 0 : 12,
                                                borderTopLeftRadius: isAdmin ? 12 : 0,
                                                maxWidth: '85%', fontSize: '.9rem', lineHeight: 1.5,
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {msg.message}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {selectedTicket.status !== 'closed' ? (
                            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <textarea
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder={t('replyPlaceholder')}
                                        style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '12px 16px', resize: 'none', height: 60, fontFamily: 'inherit', fontSize: '.9rem' }}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                                    ></textarea>
                                    <button
                                        onClick={handleReply}
                                        disabled={replying || !replyText.trim()}
                                        style={{
                                            background: '#111827', color: '#fff', border: 'none', borderRadius: 8,
                                            padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                            fontWeight: 600, opacity: (!replyText.trim() || replying) ? 0.6 : 1
                                        }}
                                    >
                                        {replying ? <span className="spinner"></span> : <><Send size={18} /> {t('sendReply')}</>}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 12 }}>
                                    <button
                                        onClick={() => updateStatus('closed')}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
                                    >
                                        {t('closeTicket')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: 20, borderTop: '1px solid #e5e7eb', background: '#fef2f2', textAlign: 'center' }}>
                                <p style={{ margin: 0, color: '#ef4444', fontWeight: 600, fontSize: '.9rem' }}>{t('ticketClosedMsg')}</p>
                                <button
                                    onClick={() => updateStatus('open')}
                                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '.85rem', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}
                                >
                                    {t('reopenTicket')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
