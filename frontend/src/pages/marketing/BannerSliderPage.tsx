import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import type { BannerDto, CreateBannerRequest, UpdateBannerRequest } from '../../api/types';
import { Modal } from '../../components/common/Modal';
import { theme } from '../../theme/tokens';

const PRESET_IMAGES = [
  { label: 'Köy Kahvaltısı Bento', url: '/images/hero-bento-showcase.png' },
  { label: 'Anadolu Sofrası', url: '/images/hero-anadolu-sofrasi.jpg' },
  { label: 'Doğal Köy Lezzetleri', url: '/images/anadolu-sofrasi.jpg' },
];

export const BannerSliderPage: React.FC = () => {
  const [banners, setBanners] = useState<BannerDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Canlı Önizleme İndeksi
  const [previewIndex, setPreviewIndex] = useState(0);

  // Modal Durumları
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Verileri
  const [formData, setFormData] = useState<CreateBannerRequest>({
    title: '',
    subtitle: '',
    badgeText: 'Doğrudan Üreticisinden & Katkısız',
    features: '%100 Katkısız, Geleneksel Taş Değirmen, Soğuk Sıkım',
    imageUrl: '/images/hero-bento-showcase.png',
    buttonText: 'Ürünleri Keşfet',
    targetUrl: '/products',
    secondaryButtonText: 'Hikâyemizi Tanıyın',
    secondaryTargetUrl: '/hikayemiz',
    displayOrder: 1,
    isActive: true,
  });

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.getBanners();
      setBanners(data);
      if (data.length > 0 && previewIndex >= data.length) {
        setPreviewIndex(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Bannerlar yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [previewIndex]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenCreateModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      badgeText: 'Doğrudan Üreticisinden & Katkısız',
      features: '%100 Katkısız, Geleneksel Taş Değirmen, Soğuk Sıkım',
      imageUrl: '/images/hero-bento-showcase.png',
      buttonText: 'Ürünleri Keşfet',
      targetUrl: '/products',
      secondaryButtonText: 'Hikâyemizi Tanıyın',
      secondaryTargetUrl: '/hikayemiz',
      displayOrder: (banners.length + 1),
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: BannerDto) => {
    setEditingBanner(b);
    setFormData({
      title: b.title,
      subtitle: b.subtitle || '',
      badgeText: b.badgeText || '',
      features: b.features || '',
      imageUrl: b.imageUrl,
      buttonText: b.buttonText || '',
      targetUrl: b.targetUrl || '',
      secondaryButtonText: b.secondaryButtonText || '',
      secondaryTargetUrl: b.secondaryTargetUrl || '',
      displayOrder: b.displayOrder,
      isActive: b.isActive,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (banner: BannerDto) => {
    try {
      const nextStatus = !banner.isActive;
      await adminApi.updateBannerStatus(banner.id, nextStatus);
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, isActive: nextStatus } : b))
      );
      setSuccessMessage(`'${banner.title}' slayt durumu ${nextStatus ? 'Aktif' : 'Pasif'} yapıldı.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Durum güncellenirken hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteBanner(id);
      setDeleteConfirmId(null);
      setSuccessMessage('Slayt başarıyla silindi.');
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchBanners();
    } catch (err: any) {
      alert(err?.message || 'Slayt silinirken hata oluştu.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminApi.uploadBannerImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
      setSuccessMessage('Görsel başarıyla yüklendi.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || 'Görsel yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Lütfen slayt başlığını giriniz.');
      return;
    }
    if (!formData.imageUrl.trim()) {
      alert('Lütfen bir görsel seçin veya yükleyin.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingBanner) {
        const updatePayload: UpdateBannerRequest = {
          title: formData.title.trim(),
          subtitle: formData.subtitle?.trim() || null,
          badgeText: formData.badgeText?.trim() || null,
          features: formData.features?.trim() || null,
          imageUrl: formData.imageUrl.trim(),
          buttonText: formData.buttonText?.trim() || null,
          targetUrl: formData.targetUrl?.trim() || null,
          secondaryButtonText: formData.secondaryButtonText?.trim() || null,
          secondaryTargetUrl: formData.secondaryTargetUrl?.trim() || null,
          displayOrder: Number(formData.displayOrder) || 0,
          isActive: Boolean(formData.isActive),
        };
        await adminApi.updateBanner(editingBanner.id, updatePayload);
        setSuccessMessage(`'${formData.title}' slaytı başarıyla güncellendi.`);
      } else {
        await adminApi.createBanner({
          ...formData,
          title: formData.title.trim(),
          subtitle: formData.subtitle?.trim() || null,
          badgeText: formData.badgeText?.trim() || null,
          features: formData.features?.trim() || null,
          imageUrl: formData.imageUrl.trim(),
          buttonText: formData.buttonText?.trim() || null,
          targetUrl: formData.targetUrl?.trim() || null,
          secondaryButtonText: formData.secondaryButtonText?.trim() || null,
          secondaryTargetUrl: formData.secondaryTargetUrl?.trim() || null,
          displayOrder: Number(formData.displayOrder) || 1,
          isActive: Boolean(formData.isActive),
        });
        setSuccessMessage(`'${formData.title}' slaytı başarıyla oluşturuldu.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchBanners();
    } catch (err: any) {
      alert(err?.message || 'İşlem kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBanners = banners.filter((b) => b.isActive);
  const currentPreviewBanner: BannerDto | null =
    banners.length > 0
      ? banners[previewIndex] ?? banners[0]
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0, maxWidth: '100%' }}>
      {/* 1. Başlık & Aksiyon Butonu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, letterSpacing: '-0.3px', margin: 0 }}>
            Ana Sayfa Slider & Hero Vitrin Yönetimi
          </h1>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '4px', marginBottom: 0 }}>
            Köy Kokusu vitrin ana sayfasında yer alan büyük karşılama slaytlarını, başlık, görsel, rozet ve yönlendirme butonlarını dinamik olarak yönetin.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: theme.colors.primary,
            color: theme.colors.textInverse,
            padding: '10px 18px',
            borderRadius: theme.radii.md,
            fontSize: '13.5px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            boxShadow: theme.shadows.subtle,
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
          <span>Yeni Slayt Ekle</span>
        </button>
      </div>

      {/* Başarı & Hata Bildirimleri */}
      {successMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.statusSuccessBg,
            border: '1px solid #C8E3CA',
            color: theme.colors.statusSuccess,
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.statusSuccess, fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.statusDangerBg,
            border: `1px solid ${theme.colors.statusDanger}`,
            color: theme.colors.statusDanger,
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={fetchBanners}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.statusDanger}`,
              color: theme.colors.statusDanger,
              padding: '4px 10px',
              borderRadius: theme.radii.xs,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* 2. CANLI MAĞAZA ÖNİZLEMESİ (Bento Vitrin Önizleme Kutusu) */}
      {currentPreviewBanner && (
        <div
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.lg,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.subtle,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>👁️</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Canlı Mağaza Önizlemesi (Hero Bento Slider)
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: theme.radii.full,
                  backgroundColor: currentPreviewBanner.isActive ? theme.colors.statusSuccessBg : theme.colors.statusWarningBg,
                  color: currentPreviewBanner.isActive ? theme.colors.statusSuccess : theme.colors.statusWarning,
                  border: `1px solid ${currentPreviewBanner.isActive ? '#C8E3CA' : '#F1D4B8'}`,
                }}
              >
                {currentPreviewBanner.isActive ? 'Yayında (Aktif)' : 'Yayında Değil (Pasif)'}
              </span>
            </div>

            {/* Slider Kontrolleri */}
            {banners.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: theme.colors.taupe, marginRight: '4px' }}>
                  Slayt {previewIndex + 1} / {banners.length}
                </span>
                <button
                  onClick={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : banners.length - 1))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.bgSurface,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title="Önceki Slayt"
                >
                  ← Önceki
                </button>
                <button
                  onClick={() => setPreviewIndex((prev) => (prev < banners.length - 1 ? prev + 1 : 0))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.bgSurface,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                  title="Sonraki Slayt"
                >
                  Sonraki →
                </button>
              </div>
            )}
          </div>

          {/* Mağaza Hero Kartı Tasarımı */}
          <div
            style={{
              padding: 'clamp(20px, 4vw, 42px)',
              backgroundColor: '#F7F6F2',
              backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(45,90,39,0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(162,123,92,0.06) 0%, transparent 40%)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {/* Sol: Metin ve Değer Blokları */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
              {currentPreviewBanner.badgeText && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: theme.radii.full,
                    backgroundColor: '#EAE6DF',
                    border: '1px solid #D8D2C5',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#654E38',
                  }}
                >
                  <span>🌿</span>
                  <span>{currentPreviewBanner.badgeText}</span>
                </div>
              )}

              <h2
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  fontWeight: 800,
                  color: theme.colors.primary,
                  lineHeight: 1.15,
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                {currentPreviewBanner.title}
              </h2>

              {currentPreviewBanner.subtitle && (
                <p
                  style={{
                    fontSize: '14.5px',
                    lineHeight: 1.6,
                    color: theme.colors.espresso,
                    opacity: 0.85,
                    margin: 0,
                    maxWidth: '520px',
                  }}
                >
                  {currentPreviewBanner.subtitle}
                </p>
              )}

              {/* Değer Çipleri */}
              {currentPreviewBanner.features && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
                  {currentPreviewBanner.features
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: theme.radii.full,
                          backgroundColor: '#EDE9E1',
                          border: '1px solid #DFD9CC',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: theme.colors.espresso,
                        }}
                      >
                        <span style={{ color: theme.colors.primary }}>✓</span>
                        {feat}
                      </span>
                    ))}
                </div>
              )}

              {/* CTA Butonları */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '10px' }}>
                {currentPreviewBanner.buttonText && (
                  <button
                    type="button"
                    style={{
                      padding: '11px 22px',
                      borderRadius: theme.radii.md,
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.textInverse,
                      border: 'none',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 8px rgba(45, 90, 39, 0.25)',
                    }}
                  >
                    <span>{currentPreviewBanner.buttonText}</span>
                    <span>→</span>
                  </button>
                )}

                {currentPreviewBanner.secondaryButtonText && (
                  <button
                    type="button"
                    style={{
                      padding: '11px 20px',
                      borderRadius: theme.radii.md,
                      backgroundColor: '#EAE6DF',
                      border: '1.5px solid #8A6848',
                      color: '#654E38',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {currentPreviewBanner.secondaryButtonText}
                  </button>
                )}
              </div>
            </div>

            {/* Sağ: Hero Görseli */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: theme.radii.lg,
                  overflow: 'hidden',
                  border: '3px solid #EAE6DF',
                  boxShadow: '0 12px 32px rgba(45, 36, 30, 0.12)',
                  backgroundColor: theme.colors.bgSurface,
                }}
              >
                <img
                  src={currentPreviewBanner.imageUrl}
                  alt={currentPreviewBanner.title}
                  style={{ width: '100%', height: 'auto', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    // Kırık görsel yerine placeholder
                    (e.currentTarget as HTMLImageElement).src = '/images/hero-bento-showcase.png';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLAYT LİSTESİ VE YÖNETİM TABLOSU */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
          boxShadow: theme.shadows.subtle,
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <span style={{ fontSize: '14.5px', fontWeight: 700, color: theme.colors.espresso }}>
              Tanımlı Slaytlar ({banners.length})
            </span>
            <span style={{ fontSize: '12px', color: theme.colors.taupe, marginLeft: '8px' }}>
              ({activeBanners.length} aktif, {banners.length - activeBanners.length} pasif)
            </span>
          </div>

          <button
            onClick={fetchBanners}
            style={{
              padding: '6px 12px',
              borderRadius: theme.radii.sm,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            🔄 Yenile
          </button>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: theme.colors.bgSurface,
                  borderBottom: `1px solid ${theme.colors.border}`,
                  color: theme.colors.taupe,
                  fontSize: '11.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <th style={{ padding: '12px 18px', width: '90px' }}>Görsel</th>
                <th style={{ padding: '12px 18px' }}>Slayt Bilgileri</th>
                <th style={{ padding: '12px 18px', width: '170px' }}>Butonlar & Linkler</th>
                <th style={{ padding: '12px 18px', textAlign: 'center', width: '80px' }}>Sıra</th>
                <th style={{ padding: '12px 18px', textAlign: 'center', width: '100px' }}>Durum</th>
                <th style={{ padding: '12px 18px', textAlign: 'right', width: '160px' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: theme.colors.taupe }}>
                    Slaytlar yükleniyor...
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: theme.colors.taupe }}>
                    Henüz tanımlı bir slider afişi bulunmuyor. Yeni eklemek için üstteki butonu kullanabilirsiniz.
                  </td>
                </tr>
              ) : (
                banners.map((b, idx) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                      backgroundColor: previewIndex === idx ? '#FAF8F5' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Thumbnail */}
                    <td style={{ padding: '12px 18px' }}>
                      <div
                        style={{
                          width: '74px',
                          height: '48px',
                          borderRadius: theme.radii.sm,
                          overflow: 'hidden',
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.bgSurface,
                        }}
                      >
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/hero-bento-showcase.png';
                          }}
                        />
                      </div>
                    </td>

                    {/* Bilgiler */}
                    <td style={{ padding: '12px 18px' }}>
                      {b.badgeText && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#654E38',
                            backgroundColor: '#EAE6DF',
                            padding: '1px 7px',
                            borderRadius: theme.radii.xs,
                            marginBottom: '4px',
                          }}
                        >
                          🌿 {b.badgeText}
                        </span>
                      )}
                      <div style={{ fontWeight: 700, color: theme.colors.espresso, fontSize: '14px' }}>
                        {b.title}
                      </div>
                      {b.subtitle && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: theme.colors.taupe,
                            marginTop: '2px',
                            maxWidth: '380px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={b.subtitle}
                        >
                          {b.subtitle}
                        </div>
                      )}
                      {b.features && (
                        <div style={{ fontSize: '11px', color: theme.colors.primary, marginTop: '3px', fontWeight: 500 }}>
                          ✓ {b.features}
                        </div>
                      )}
                    </td>

                    {/* Butonlar */}
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.espresso }}>
                        1: {b.buttonText || '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: theme.colors.taupe, fontFamily: 'monospace' }}>
                        {b.targetUrl || '/'}
                      </div>
                      {b.secondaryButtonText && (
                        <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#654E38' }}>
                          2: {b.secondaryButtonText} ({b.secondaryTargetUrl || '/'})
                        </div>
                      )}
                    </td>

                    {/* Sıra */}
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: theme.radii.xs,
                          backgroundColor: theme.colors.bgSurface,
                          border: `1px solid ${theme.colors.border}`,
                          fontWeight: 700,
                          fontSize: '12px',
                        }}
                      >
                        #{b.displayOrder}
                      </span>
                    </td>

                    {/* Aktiflik */}
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(b)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: theme.radii.full,
                          border: `1px solid ${b.isActive ? '#C8E3CA' : '#E0D0C0'}`,
                          backgroundColor: b.isActive ? theme.colors.statusSuccessBg : theme.colors.bgSurface,
                          color: b.isActive ? theme.colors.statusSuccess : theme.colors.taupe,
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {b.isActive ? 'Aktif ✓' : 'Pasif'}
                      </button>
                    </td>

                    {/* İşlemler */}
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => setPreviewIndex(idx)}
                          title="Üstteki vitrin önizlemesinde göster"
                          style={{
                            padding: '5px 8px',
                            borderRadius: theme.radii.xs,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: previewIndex === idx ? theme.colors.primarySubtle : theme.colors.bgSurface,
                            color: previewIndex === idx ? theme.colors.primary : theme.colors.espresso,
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: 600,
                          }}
                        >
                          👁️ Gör
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(b)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: theme.radii.xs,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: theme.colors.bgSurface,
                            color: theme.colors.cedar,
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: 600,
                          }}
                        >
                          Düzenle
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(b.id)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: theme.radii.xs,
                            border: '1px solid #F5D3CE',
                            backgroundColor: theme.colors.statusDangerBg,
                            color: theme.colors.statusDanger,
                            cursor: 'pointer',
                            fontSize: '11.5px',
                            fontWeight: 600,
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. YENİ SLAYT EKLE / DÜZENLE MODALI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBanner ? 'Slaytı Düzenle' : 'Yeni Hero Slayt Ekle'}
        maxWidth="640px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
              Ana Slayt Başlığı *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Köyün Bereketi, Sofranızın Lezzeti"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13.5px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Üst Rozet Metni (Provenance Badge)
              </label>
              <input
                type="text"
                value={formData.badgeText || ''}
                onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                placeholder="Doğrudan Üreticisinden & Katkısız"
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Öne Çıkan Değer Çipleri (virgülle ayırın)
              </label>
              <input
                type="text"
                value={formData.features || ''}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="%100 Katkısız, Geleneksel Taş Değirmen, Soğuk Sıkım"
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
              Açıklama / Alt Metin
            </label>
            <textarea
              rows={3}
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Anadolu'nun bereketli topraklarından gelen doğal, geleneksel ve yöresel lezzetlerle sofranıza doğallık katın..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '13px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Görsel Seçimi & Yükleme Bloğu */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.bgSurface,
              border: `1px solid ${theme.colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: theme.colors.espresso }}>
                Hero Slayt Görseli *
              </span>
              {isUploading && (
                <span style={{ fontSize: '11px', color: theme.colors.primary, fontWeight: 600 }}>
                  ⏳ Görsel yükleniyor...
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Thumbnail */}
              <div
                style={{
                  width: '80px',
                  height: '52px',
                  borderRadius: theme.radii.sm,
                  overflow: 'hidden',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: '#EAE6DF',
                  flexShrink: 0,
                }}
              >
                <img
                  src={formData.imageUrl || '/images/hero-bento-showcase.png'}
                  alt="Seçili Görsel"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/hero-bento-showcase.png';
                  }}
                />
              </div>

              {/* URL Alanı */}
              <input
                type="text"
                required
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="/images/hero-bento-showcase.png"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  backgroundColor: theme.colors.bgCard,
                }}
              />

              {/* Bilgisayardan Yükle Butonu */}
              <label
                style={{
                  padding: '8px 14px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgCard,
                  color: theme.colors.espresso,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                📁 Dosya Seç
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Hazır Görsel Çipleri */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '2px' }}>
              <span style={{ fontSize: '11px', color: theme.colors.taupe }}>Hazır Seç:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                  style={{
                    padding: '2px 8px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${formData.imageUrl === preset.url ? theme.colors.primary : theme.colors.border}`,
                    backgroundColor: formData.imageUrl === preset.url ? theme.colors.primarySubtle : theme.colors.bgCard,
                    color: formData.imageUrl === preset.url ? theme.colors.primary : theme.colors.taupe,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buton 1 (Birincil CTA) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Birincil Buton Metni
              </label>
              <input
                type="text"
                value={formData.buttonText || ''}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                placeholder="Ürünleri Keşfet"
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Birincil Buton Hedef URL
              </label>
              <input
                type="text"
                value={formData.targetUrl || ''}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder="/products"
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Buton 2 (İkincil CTA) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                İkincil Buton Metni (Opsiyonel)
              </label>
              <input
                type="text"
                value={formData.secondaryButtonText || ''}
                onChange={(e) => setFormData({ ...formData, secondaryButtonText: e.target.value })}
                placeholder="Hikâyemizi Tanıyın"
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                İkincil Buton Hedef URL
              </label>
              <input
                type="text"
                value={formData.secondaryTargetUrl || ''}
                onChange={(e) => setFormData({ ...formData, secondaryTargetUrl: e.target.value })}
                placeholder="/hikayemiz"
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Sıra & Aktiflik */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Gösterim Sırası
              </label>
              <input
                type="number"
                min={0}
                value={formData.displayOrder ?? 1}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px 11px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ paddingTop: '18px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.colors.espresso,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(formData.isActive)}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ accentColor: theme.colors.primary, width: '16px', height: '16px' }}
                />
                <span>Bu Slaytı Yayında Tut (Aktif)</span>
              </label>
            </div>
          </div>

          {/* Modal Butonları */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '9px 16px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              style={{
                padding: '9px 20px',
                borderRadius: theme.radii.sm,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                fontSize: '13px',
                fontWeight: 600,
                cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || isUploading ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Kaydediliyor...' : editingBanner ? 'Değişiklikleri Kaydet' : 'Slaytı Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 5. SİLME ONAY MODALI */}
      {deleteConfirmId && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirmId(null)}
          title="Slaytı Sil"
          maxWidth="440px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '13.5px', color: theme.colors.espresso, lineHeight: 1.5 }}>
              Bu hero slider afişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgSurface,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radii.sm,
                  border: 'none',
                  backgroundColor: theme.colors.statusDanger,
                  color: theme.colors.textInverse,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
