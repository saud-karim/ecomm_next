'use client';
import { useEffect, useState, useCallback } from 'react';
import { sellerReviewsApi } from '@/lib/api';
import { Star, MessageCircle, ShoppingBag, User } from 'lucide-react';
import toast from 'react-hot-toast';

import { useI18n } from '@/lib/i18n';

interface Review {
    id: number;
    product_id: number;
    user_id: number;
    rating: number;
    comment: string;
    created_at: string;
    customer: { id: number; name: string };
    product: { id: number; name: string; primary_image?: { url: string } };
}

export default function SellerReviewsPage() {
    const { t, isRtl } = useI18n();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [meta, setMeta] = useState({ total: 0 });

    const fetchReviews = useCallback(() => {
        setLoading(true);
        sellerReviewsApi.list({ page, per_page: 15 })
            .then(res => {
                setReviews(res.data.data.data || []);
                setTotalPages(res.data.data.last_page || 1);
                setPage(res.data.data.current_page || 1);
                setMeta({ total: res.data.data.total || 0 });
            })
            .catch(() => toast.error('Failed to load reviews'))
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        size={16}
                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                        color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                    />
                ))}
            </div>
        );
    };

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>{t('customerReview')}</h1>
                <p style={{ color: '#6b7280', margin: 0, fontSize: '.9rem' }}>
                    {meta.total} {t('reviews').toLowerCase()}
                </p>
            </div>

            {/* Reviews List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="tbl">
                    <thead>
                        <tr>
                            <th>{t('productReview')}</th>
                            <th>{t('customer')}</th>
                            <th>{t('reviews')}</th>
                            <th>{t('date')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center' }}><span className="spinner spinner-dark"></span></td></tr>
                        ) : reviews.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                                    <Star size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    {t('noReviewsFound')}
                                </td>
                            </tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
                                                {review.product?.primary_image ? (
                                                    <img src={review.product.primary_image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                        <Star size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontWeight: 600, color: '#111827', fontSize: '.9rem' }}>
                                                {review.product?.name || 'Unknown Product'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                                                {review.customer?.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: 500, color: '#374151' }}>{review.customer?.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {renderStars(review.rating)}
                                            {review.comment && (
                                                <p style={{ margin: 0, fontSize: '.85rem', color: '#4b5563', maxWidth: 350, lineHeight: 1.5 }}>
                                                    "{review.comment}"
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '.85rem', color: '#6b7280' }}>
                                        {formatDate(review.created_at)}
                                    </td>
                                </tr>
                            ))
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
        </div>
    );
}
