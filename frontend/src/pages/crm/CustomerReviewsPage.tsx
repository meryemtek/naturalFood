import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../../theme/tokens';
import { Modal } from '../../components/common/Modal';
import { AdminPagination } from '../../components/common/AdminPagination';
import {
  reviewService,
  AdminReviewItemDto,
} from '../../services/reviewService';

export const CustomerReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewItemDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 20;
  const [avgRating, setAvgRating] = useState<number>(0);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [negativeUnresolvedCount, setNegativeUnresolvedCount] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('all'); // 'all' | '5' | '4' | 'negative'
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Response Modal
  const [selectedReview, setSelectedReview] = useState<AdminReviewItemDto | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [markAsReviewed, setMarkAsReviewed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await reviewService.getAllReviews({
        rating: ratingFilter === '5' ? 5 : ratingFilter === '4' ? 4 : undefined,
        onlyNegative: ratingFilter === 'negative' ? true : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm.trim() || undefined,
        page,
        pageSize,
      });

      setReviews(res.items);
      setTotalCount(res.totalCount);
      setAvgRating(res.averageRating);
      setPendingCount(res.pendingCount);
      setNegativeUnresolvedCount(res.negativeUnresolvedCount);
    } catch (err: any) {
      setErrorMessage(err.message || 'Müşteri değerlendirmeleri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [ratingFilter, statusFilter, searchTerm, page]);

  useEffect(() => {
    setPage(1);
  }, [ratingFilter, statusFilter, searchTerm]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const openRespondModal = (review: AdminReviewItemDto) => {
    setSelectedReview(review);
    setResponseText(review.adminResponse || '');
    setMarkAsReviewed(true);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      setIsSubmitting(true);
      await reviewService.quickRespond(selectedReview.id, {
        responseText: responseText.trim() || null,
        markAsReviewed,
      });

      setSelectedReview(null);
      showToast('Değerlendirme yanıtı ve inceleme durumu kaydedildi.');
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Yanıt kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (review: AdminReviewItemDto, newStatus: string) => {
    try {
      await reviewService.updateStatus(review.id, newStatus);
      showToast(`Yorum durumu "${newStatus}" olarak güncellendi.`);
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Durum güncellenemedi.');
    }
  };

  const renderStars = (rating: number) => {
    const filled = '★'.repeat(rating);
    const empty = '☆'.repeat(Math.max(0, 5 - rating));
    const color =
      rating <= 2
        ? theme.colors.statusDanger
        : rating === 3
        ? theme.colors.statusWarning
        : '#D97706';

    return (
      <span style={{ color, fontSize: '15px', letterSpacing: '1px', fontWeight: 700 }}>
        {filled}
        <span style={{ color: theme.colors.stoneMuted, opacity: 0.45 }}>{empty}</span>
      </span>
    );
  };

  const getStatusBadge = (r: AdminReviewItemDto) => {
    if (r.hasResponse || r.status === 'Reviewed') {
      return {
        label: '✓ İncelendi & Yanıtlandı',
        bg: theme.colors.statusSuccessBg,
        color: theme.colors.statusSuccess,
        border: '#C9E2CB',
      };
    }
    if (r.status === 'Approved') {
      return {
        label: 'Yayında (Onaylı)',
        bg: theme.colors.primarySubtle,
        color: theme.colors.primary,
        border: '#D5E5D4',
      };
    }
    if (r.status === 'Hidden') {
      return {
        label: 'Gizlendi',
        bg: theme.colors.bgSurface,
        color: theme.colors.taupe,
        border: theme.colors.border,
      };
    }
    return {
      label: r.rating <= 3 ? 'İnceleme Bekliyor' : 'Onay Bekliyor',
      bg: theme.colors.statusWarningBg,
      color: theme.colors.statusWarning,
      border: '#F1D4B8',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: theme.colors.espresso,
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: theme.radii.md,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
          }}
        >
          <span style={{ color: '#4ADE80', fontSize: '16px' }}>✓</span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
              Müşteri Değerlendirmeleri ve Yorum Yönetimi
            </h1>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: theme.radii.full,
                backgroundColor: theme.colors.primarySubtle,
                color: theme.colors.primary,
                border: '1px solid #D5E5D4',
              }}
            >
              CRM & Müşteri Memnuniyeti
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
            Mağazamızdaki tüm 1–5 yıldız müşteri yorumları, olumlu geri bildirimler ve olumsuz yorum çözüm kayıtları.
          </p>
        </div>

        <button
          onClick={() => loadReviews()}
          disabled={isLoading}
          style={{
            padding: '8px 14px',
            backgroundColor: theme.colors.bgCard,
            color: theme.colors.espresso,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.sm,
            fontSize: '13px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>↻</span> Yenile
        </button>
      </div>

      {/* KPI Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
        <div style={{ backgroundColor: theme.colors.bgCard, padding: '18px', borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.taupe, textTransform: 'uppercase' }}>
            Mağaza Ortalama Puanı
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: theme.colors.espresso }}>⭐ {avgRating.toFixed(1)}</span>
            <span style={{ fontSize: '13px', color: theme.colors.taupe }}>/ 5.0</span>
          </div>
        </div>

        <div style={{ backgroundColor: theme.colors.bgCard, padding: '18px', borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.taupe, textTransform: 'uppercase' }}>
            Listelenen Yorum
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: theme.colors.espresso }}>{totalCount}</span>
            <span style={{ fontSize: '13px', color: theme.colors.taupe }}>değerlendirme</span>
          </div>
        </div>

        <div style={{ backgroundColor: theme.colors.bgCard, padding: '18px', borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.taupe, textTransform: 'uppercase' }}>
            İnceleme Bekleyen (1–3 ★)
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: negativeUnresolvedCount > 0 ? theme.colors.statusWarning : theme.colors.statusSuccess }}>
              {negativeUnresolvedCount}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: theme.radii.xs,
                backgroundColor: negativeUnresolvedCount > 0 ? theme.colors.statusWarningBg : theme.colors.statusSuccessBg,
                color: negativeUnresolvedCount > 0 ? theme.colors.statusWarning : theme.colors.statusSuccess,
              }}
            >
              {negativeUnresolvedCount > 0 ? 'İlgi Bekliyor' : 'Tümü İncelendi'}
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: theme.colors.bgCard, padding: '18px', borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.taupe, textTransform: 'uppercase' }}>
            Moderasyon Bekleyen
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: theme.colors.espresso }}>{pendingCount}</span>
            <span style={{ fontSize: '13px', color: theme.colors.taupe }}>yorum</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <input
          type="text"
          placeholder="Müşteri, ürün adı veya yorum içinde ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1 1 220px',
            maxWidth: '100%',
            padding: '8px 12px',
            borderRadius: theme.radii.sm,
            border: `1px solid ${theme.colors.border}`,
            backgroundColor: theme.colors.bgSurface,
            fontSize: '13px',
            color: theme.colors.espresso,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tümü (1–5 ★)' },
            { id: 'negative', label: '⚠️ Olumsuzlar (1–3 ★)' },
            { id: '5', label: '5 Yıldız' },
            { id: '4', label: '4 Yıldız' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRatingFilter(btn.id)}
              style={{
                padding: '7px 12px',
                borderRadius: theme.radii.sm,
                border: ratingFilter === btn.id ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                backgroundColor: ratingFilter === btn.id ? theme.colors.primarySubtle : theme.colors.bgSurface,
                color: ratingFilter === btn.id ? theme.colors.primary : theme.colors.cedar,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {btn.label}
            </button>
          ))}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: theme.radii.sm,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              fontSize: '12.5px',
              color: theme.colors.espresso,
              outline: 'none',
            }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Pending">Beklemede</option>
            <option value="Reviewed">İncelendi / Yanıtlandı</option>
            <option value="Approved">Onaylı (Yayında)</option>
            <option value="Hidden">Gizli</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: theme.colors.statusDangerBg,
            border: '1px solid #F5D3CE',
            borderRadius: theme.radii.md,
            color: theme.colors.statusDanger,
            fontSize: '13px',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {isLoading ? (
          <div style={{ backgroundColor: theme.colors.bgCard, padding: '40px', borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, textAlign: 'center', color: theme.colors.taupe }}>
            Müşteri değerlendirmeleri yükleniyor...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ backgroundColor: theme.colors.bgCard, padding: '40px', borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, textAlign: 'center', color: theme.colors.taupe }}>
            Filtrelere uygun müşteri değerlendirmesi bulunamadı.
          </div>
        ) : (
          reviews.map((r) => {
            const badge = getStatusBadge(r);
            return (
              <div
                key={r.id}
                style={{
                  backgroundColor: theme.colors.bgCard,
                  borderRadius: theme.radii.md,
                  border: r.rating <= 3 && !r.hasResponse ? '1px solid #EBD3B8' : `1px solid ${theme.colors.border}`,
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Top Meta Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {renderStars(r.rating)}
                    <span style={{ fontWeight: 700, fontSize: '14px', color: theme.colors.espresso }}>
                      {r.customerName}
                    </span>
                    <span style={{ fontSize: '12px', color: theme.colors.taupe }}>
                      ({r.customerEmail})
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: theme.radii.xs,
                        backgroundColor: theme.colors.bgSurface,
                        border: `1px solid ${theme.colors.border}`,
                        color: theme.colors.cedar,
                      }}
                    >
                      🌿 {r.productName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', color: theme.colors.stoneMuted }}>
                      {new Date(r.createdAtUtc).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: theme.radii.full,
                        backgroundColor: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Comment Text */}
                <p style={{ margin: 0, fontSize: '13.5px', color: theme.colors.espresso, lineHeight: 1.55 }}>
                  "{r.commentText}"
                </p>

                {/* Admin Response Box if present */}
                {r.adminResponse && (
                  <div
                    style={{
                      backgroundColor: theme.colors.statusSuccessBg,
                      borderLeft: `3px solid ${theme.colors.primary}`,
                      padding: '10px 14px',
                      borderRadius: theme.radii.sm,
                      fontSize: '12.5px',
                      color: theme.colors.espresso,
                    }}
                  >
                    <strong style={{ color: theme.colors.primary }}>💬 Satıcı Yanıtınız:</strong> {r.adminResponse}
                  </div>
                )}

                {/* Action Row */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', paddingTop: '6px', borderTop: `1px solid ${theme.colors.borderSubtle}` }}>
                  {r.status !== 'Approved' && (
                    <button
                      onClick={() => handleStatusChange(r, 'Approved')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.bgSurface,
                        color: theme.colors.primary,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Yayına Al (Onayla)
                    </button>
                  )}

                  <button
                    onClick={() => openRespondModal(r)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: theme.radii.sm,
                      border: `1px solid ${theme.colors.primary}`,
                      backgroundColor: r.hasResponse ? theme.colors.bgSurface : theme.colors.primary,
                      color: r.hasResponse ? theme.colors.primary : '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {r.adminResponse ? '✏️ Yanıtı Düzenle' : '💬 Müşteriyi Yanıtla / İncele'}
                  </button>
                </div>
              </div>
            );
          })
        )}
        <div style={{ borderRadius: theme.radii.md, overflow: 'hidden', border: `1px solid ${theme.colors.border}` }}>
          <AdminPagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            itemCount={reviews.length}
            onPageChange={setPage}
            label="yorum"
          />
        </div>
      </div>

      {/* Quick Response Modal */}
      <Modal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Müşteri Değerlendirmesini Yanıtla"
      >
        {selectedReview && (
          <form onSubmit={handleSaveResponse} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: theme.colors.bgSurface, padding: '12px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ fontSize: '13.5px', color: theme.colors.espresso }}>{selectedReview.customerName}</strong>
                {renderStars(selectedReview.rating)}
              </div>
              <div style={{ fontSize: '12px', color: theme.colors.primary, fontWeight: 600, marginBottom: '6px' }}>
                {selectedReview.productName}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: theme.colors.taupe, fontStyle: 'italic' }}>
                "{selectedReview.commentText}"
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
                Mağaza / Satıcı Yanıtınız
              </label>
              <textarea
                rows={4}
                placeholder="Müşterimize nazik ve çözüm odaklı bir yanıt yazınız (örn: Paketleme hassasiyeti için özür diler, telafi kuponunuzu tanımladığımızı iletmek isteriz)..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  fontSize: '13px',
                  color: theme.colors.espresso,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="markReviewedPage"
                checked={markAsReviewed}
                onChange={(e) => setMarkAsReviewed(e.target.checked)}
              />
              <label htmlFor="markReviewedPage" style={{ fontSize: '12.5px', color: theme.colors.espresso, cursor: 'pointer' }}>
                Durumu <strong>'İncelendi' (Çözümlendi)</strong> olarak işaretle
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  color: theme.colors.espresso,
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  backgroundColor: theme.colors.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Kaydet ve İncelendi Yap'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
