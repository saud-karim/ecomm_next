'use client';
import { useEffect, useState } from 'react';
import { sellerReviewsApi } from '@/lib/api';
import { Star, MessageCircle, ShoppingBag, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    is_approved: boolean;
    created_at: string;
    product: { id: number; name_en: string; name_ar: string; sku: string };
    customer: { id: number; name: string; email: string };
}

export default function SellerReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchReviews = (p = 1) => {
        setLoading(true);
        sellerReviewsApi.list({ page: p, per_page: 20 })
            .then(res => {
                setReviews(res.data.data.data || []);
                setTotalPages(res.data.data.last_page || 1);
                setPage(res.data.data.current_page || 1);
            })
            .catch(() => toast.error('Failed to load reviews'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchReviews(page); }, [page]);

    // Format Date helper
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Product Reviews</h1>
            </div>

            {loading ? (
                <div style={{ padding: 60, textAlign: 'center' }}><span className="spinner spinner-dark"></span></div>
            ) : reviews.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #f3f4f6' }}>
                    <Star size={48} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>No reviews yet</h3>
                    <p style={{ color: '#6b7280', fontSize: '.9rem', margin: 0 }}>You haven't received any product reviews from customers.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                    {reviews.map(review => (
                        <div key={review.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
                            {/* Header: Rating & Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ display: 'flex', gap: 2 }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={18}
                                            color={star <= review.rating ? '#fbbf24' : '#e5e7eb'}
                                            fill={star <= review.rating ? '#fbbf24' : 'transparent'}
                                        />
                                    ))}
                                </div>
                                <span style={{ fontSize: '.75rem', color: '#9ca3af', fontWeight: 500 }}>
                                    {formatDate(review.created_at)}
                                </span>
                            </div>

                            {/* Comment */}
                            <div style={{ flex: 1, marginBottom: 16 }}>
                                {review.comment ? (
                                    <p style={{ fontSize: '.9rem', color: '#374151', lineHeight: 1.5, margin: 0 }}>
                                        "{review.comment}"
                                    </p>
                                ) : (
                                    <p style={{ fontSize: '.85rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                                        No text comment provided.
                                    </p>
                                )}
                            </div>

                            {/* Footer Info: Customer & Product */}
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.8rem', color: '#4b5563' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 600 }}>
                                        {review.customer.name[0].toUpperCase()}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{review.customer.name}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '.8rem', color: '#6b7280', background: '#f9fafb', padding: '8px 10px', borderRadius: 6 }}>
                                    <ShoppingBag size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#374151' }}>{review.product.name_en || review.product.name_ar}</div>
                                        <div style={{ fontSize: '.7rem', marginTop: 2 }}>SKU: {review.product.sku}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: p === page ? '#FF6B00' : '#fff',
                                color: p === page ? '#fff' : '#374151',
                                fontWeight: 700, fontSize: '.9rem',
                                boxShadow: p === page ? '0 4px 10px rgba(255, 107, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
