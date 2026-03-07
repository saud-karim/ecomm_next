'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellerTicketsApi } from '@/lib/api';
import { MessageSquare, AlertCircle, Clock, CheckCircle, Send, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import { useI18n } from '@/lib/i18n';

interface Ticket {
    id: number;
    subject: string;
    status: 'open' | 'pending' | 'closed';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    updated_at: string;
    messages_count: number;
    messages?: TicketMessage[];
}

interface TicketMessage {
    id: number;
    user_id: number;
    message: string;
    created_at: string;
    user: { id: number; name: string; role: string };
}

export default function SellerTicketsPage() {
    const { t } = useI18n();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // View/Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [messagesLoading, setMessagesLoading] = useState(false);

    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const [createForm, setCreateForm] = useState({ subject: '', priority: 'medium', message: '' });
    const [creating, setCreating] = useState(false);

    const fetchTickets = useCallback(() => {
        setLoading(true);
        sellerTicketsApi.list({ page, per_page: 15 })
            .then(res => {
                setTickets(res.data.data.data || []);
                setTotalPages(res.data.data.last_page || 1);
                setPage(res.data.data.current_page || 1);
            })
            .catch(() => toast.error('Failed to load tickets'))
            .finally(() => setLoading(false));
    }, [page]);

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
        setSelectedTicket({ id } as Ticket); // placeholder
        try {
            const res = await sellerTicketsApi.show(id);
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
            const res = await sellerTicketsApi.reply(selectedTicket.id, replyText);
            const newMessage = res.data.data;
            setSelectedTicket({
                ...selectedTicket,
                status: selectedTicket.status === 'closed' ? 'open' : selectedTicket.status,
                messages: [...(selectedTicket.messages || []), newMessage]
            });
            setReplyText('');
            toast.success('Reply sent');
            fetchTickets();
        } catch {
            toast.error('Failed to send reply');
        } finally {
            setReplying(false);
        }
    };

    const handleCreate = async () => {
        if (!createForm.subject.trim() || !createForm.message.trim()) {
            toast.error('Subject and message are required');
            return;
        }
        setCreating(true);
        try {
            await sellerTicketsApi.create(createForm);
            setIsCreateModalOpen(false);
            setCreateForm({ subject: '', priority: 'medium', message: '' });
            toast.success('Support ticket created successfully');
            fetchTickets();
        } catch {
            toast.error('Failed to create ticket');
        } finally {
            setCreating(false);
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

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{t('supportTickets')}</h1>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '.9rem' }}>{t('ticketContactAdmin')}</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    <Plus size={16} /> {t('openNewTicket')}
                </button>
            </div>

            {/* Tickets List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="tbl">
                    <thead>
                        <tr>
                            <th>{t('subjectId')}</th>
                            <th>{t('priority')}</th>
                            <th>{t('status')}</th>
                            <th>{t('lastUpdate')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark"></span></td></tr>
                        ) : tickets.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
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
                                            <span style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', color: ticket.priority === 'high' ? '#ef4444' : ticket.priority === 'medium' ? '#f59e0b' : '#3b82f6' }}>
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

            {/* Ticket Interation Modal */}
            {selectedTicket && (
                <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
                    <div className="modal" style={{ maxWidth: 700, padding: 0, height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

                        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111827' }}>{selectedTicket.subject || 'Loading...'}</h2>
                                    {selectedTicket.status && (
                                        <span className="badge" style={{ background: getStatusColor(selectedTicket.status).bg, color: getStatusColor(selectedTicket.status).text }}>
                                            {selectedTicket.status === 'open' ? t('open') : selectedTicket.status === 'pending' ? t('pendingWait') : t('closed')}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '.85rem', color: '#6b7280' }}>
                                    {t('id')}: #{selectedTicket.id}
                                </div>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: '#6b7280' }}>×</button>
                        </div>

                        <div style={{ padding: 24, flex: 1, overflowY: 'auto', background: '#fff', display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {messagesLoading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner spinner-dark"></span></div>
                            ) : (
                                selectedTicket.messages?.map(msg => {
                                    const isMe = msg.user.role === 'seller';
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                            <div style={{
                                                fontSize: '.75rem', color: '#9ca3af', marginBottom: 4, padding: '0 4px',
                                                display: 'flex', gap: 8, flexDirection: isMe ? 'row-reverse' : 'row'
                                            }}>
                                                <span style={{ fontWeight: 600, color: '#4b5563' }}>{isMe ? t('seller') || 'You' : t('admin')}</span>
                                                <span>{formatDate(msg.created_at)}</span>
                                            </div>
                                            <div style={{
                                                background: isMe ? '#FFEDD5' : '#F3F4F6',
                                                color: isMe ? '#9A3412' : '#1F2937',
                                                padding: '12px 16px', borderRadius: 12,
                                                borderBottomRightRadius: isMe ? 0 : 12,
                                                borderTopLeftRadius: isMe ? 12 : 0,
                                                maxWidth: '85%', fontSize: '.9rem', lineHeight: 1.5,
                                                border: isMe ? '1px solid #FED7AA' : '1px solid #E5E7EB',
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
                                            background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 8,
                                            padding: '0 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                                            fontWeight: 600, opacity: (!replyText.trim() || replying) ? 0.6 : 1
                                        }}
                                    >
                                        {replying ? <span className="spinner"></span> : <><Send size={18} /> {t('sendReply')}</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: 16, background: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'center', color: '#6b7280', fontSize: '.9rem' }}>
                                <AlertCircle size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} />
                                {t('ticketClosedMsg')}
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Create Ticket Modal */}
            {isCreateModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{t('openNewTicket')}</h2>
                            <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

                            <div className="form-group">
                                <label className="form-label">{t('subjectLabel')}</label>
                                <input
                                    className="form-input"
                                    value={createForm.subject}
                                    onChange={e => setCreateForm(f => ({ ...f, subject: e.target.value }))}
                                    placeholder="..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('priorityLabel')}</label>
                                <select
                                    className="form-input"
                                    value={createForm.priority}
                                    onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}
                                >
                                    <option value="low">{t('priorityLow')}</option>
                                    <option value="medium">{t('priorityMedium')}</option>
                                    <option value="high">{t('priorityHigh')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('messageLabel')}</label>
                                <textarea
                                    className="form-input"
                                    value={createForm.message}
                                    onChange={e => setCreateForm(f => ({ ...f, message: e.target.value }))}
                                    placeholder="..."
                                    style={{ height: 120, resize: 'vertical' }}
                                />
                            </div>

                        </div>
                        <div className="modal-footer" style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f9fafb' }}>
                            <button className="btn" onClick={() => setIsCreateModalOpen(false)} style={{ background: '#fff', border: '1px solid #d1d5db' }}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                                {creating ? <span className="spinner"></span> : t('submitTicket')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
