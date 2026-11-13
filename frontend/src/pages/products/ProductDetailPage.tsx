import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { request, money, type Product, type ProductDetail } from '../../api/storefront/storefrontApi';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { cartApi } from '../../api/storefront/cartApi';
import { useWishlist } from '../../api/storefront/useWishlist';
import { authFetch, authStorage } from '../../api/authApi';

interface ReviewItem {
  id: string;
  name: string;
  initials: string;
  location: string;
  variant: string;
  rating: number;
  comment: string;
  date: string;
  avatarColor: string;
}

interface CrossSellProduct {
  id: string;
  name: string;
  slug: string;
  location: string;
  packaging: string;
  price: number;
  imageUrl: string;
  badge: string;
  badgeBg: string;
}

const DEFAULT_IMAGES = [
  {
    url: '/images/products/zeytinyagi-main.jpg',
    alt: 'Taş Baskı Erken Hasat Zeytinyağı Şişesi'
  },
  {
    url: '/images/products/zeytinyagi-thumb-1.jpg',
    alt: 'Etiket ve Hasat Detayı'
  },
  {
    url: '/images/products/zeytinyagi-thumb-3.jpg',
    alt: 'Tarihi Granit Taş Değirmen Sıkımı'
  },
  {
    url: '/images/products/zeytinyagi-thumb-4.jpg',
    alt: 'Zeytin Hasadı ve Emek'
  },
  {
    url: '/images/products/zeytinyagi-thumb-6.jpg',
    alt: 'Özel Ahşap Sandıklı Güvenli Paketleme'
  }
];

const DEFAULT_VARIANTS = [
  { id: 'v1', name: '500 ml Şişe', price: 275, discountPrice: null, note: 'Deneme Boy', badge: null },
  { id: 'v2', name: '1 Litre Cam', price: 540, discountPrice: 485, note: 'Taş Baskı Şişe', badge: 'Çok Satan' },
  { id: 'v3', name: '5 Litre Teneke', price: 2400, discountPrice: 2150, note: '%15 Avantajlı', badge: null }
];

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // State
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [productError, setProductError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('v2');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'storage' | 'farmer' | 'reviews'>('desc');
  const [toastMessage, setToastMessage] = useState<string>('');
  const { ids: wishlist, toggle: toggleFavorite } = useWishlist();
  const isWishlist = !!product && wishlist.includes(product.id);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState('Yorum yapabilmek için üye girişi yapmanız ve ürünü satın almış olmanız gerekir.');

  // Fetch product detail if slug is present in backend API
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setProduct(null);
    setProductError(false);
    request<ProductDetail>(`/api/catalog/products/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(res => {
        if (res) {
          setProduct(res);
          if (res.variants && res.variants.length > 0) {
            setSelectedVariantId(res.variants[0].id);
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setProductError(true);
      });

    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!product) {
      setReviewsList([]);
      setRelatedProducts([]);
      setCanReview(false);
      return;
    }
    const controller = new AbortController();
    request<{ id: string; rating: number; text: string; createdAtUtc: string }[]>(`/api/products/${product.id}/reviews`, { signal: controller.signal })
      .then(items => setReviewsList(items.map(item => ({ id: item.id, name: 'Müşteri', initials: 'M', location: '', variant: '', rating: item.rating, comment: item.text, date: new Date(item.createdAtUtc).toLocaleDateString('tr-TR'), avatarColor: 'bg-primary text-on-primary' }))))
      .catch(() => { if (!controller.signal.aborted) setReviewsList([]); });

    request<Product[]>(`/api/catalog/products/${product.id}/related?count=4`, { signal: controller.signal })
      .then(async items => {
        if (controller.signal.aborted) return;
        if (items && items.length > 0) {
          setRelatedProducts(items.slice(0, 4));
        } else {
          const fallback = await request<{ items: Product[] }>('/api/catalog/products?pageSize=5', { signal: controller.signal });
          if (!controller.signal.aborted) {
            setRelatedProducts((fallback?.items ?? []).filter(p => p.id !== product.id).slice(0, 4));
          }
        }
      })
      .catch(() => { if (!controller.signal.aborted) setRelatedProducts([]); });

    if (authStorage.getAccessToken()) {
      authFetch<{ canReview: boolean; reason?: string }>(`/api/products/${product.id}/can-review`, { signal: controller.signal })
        .then(res => {
          setCanReview(res.canReview);
          setCanReviewReason(res.reason || 'Bu ürüne yalnızca ürünü satın almış müşteriler yorum yapabilir.');
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setCanReview(false);
            setCanReviewReason('Bu ürüne yalnızca ürünü satın almış müşteriler yorum yapabilir.');
          }
        });
    } else {
      setCanReview(false);
      setCanReviewReason('Yorum yapabilmek için üye girişi yapmanız ve ürünü satın almış olmanız gerekir.');
    }

    return () => controller.abort();
  }, [product]);
  const reviewAverage = reviewsList.length ? (reviewsList.reduce((sum, review) => sum + review.rating, 0) / reviewsList.length).toFixed(1) : '—';

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleWishlist = async () => {
    if (!product) { setToastMessage('Bu ürün henüz favorilere eklenemiyor.'); return; }
    try { const added = await toggleFavorite(product.id); setToastMessage(added ? 'Ürün favorilerinize eklendi.' : 'Ürün favorilerinizden çıkarıldı.'); }
    catch (error) { setToastMessage(error instanceof Error ? error.message : 'Favori işlemi tamamlanamadı.'); }
  };

  // Determine current active gallery images
  const galleryImages = product?.images && product.images.length > 0
    ? product.images.map(img => ({ url: img.imageUrl, alt: img.altText || product.name }))
    : DEFAULT_IMAGES;

  // Determine current variants
  const variants = product?.variants && product.variants.length > 0
    ? product.variants.map((v, i) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        discountPrice: v.discountPrice,
        note: v.unitInfo,
        badge: i === 1 ? 'Çok Satan' : null
      }))
    : product ? [{ id: '', name: product.unitInfo || 'Standart', price: product.basePrice, discountPrice: product.discountPrice, note: product.unitInfo, badge: null }] : DEFAULT_VARIANTS;

  const currentVariant = variants.find(v => v.id === selectedVariantId) || variants[0];
  const currentPrice = currentVariant.discountPrice ?? currentVariant.price;
  const originalPrice = currentVariant.discountPrice ? currentVariant.price : null;
  const discountRate = originalPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
  const selectedVariantObj = product?.variants?.find(v => v.id === selectedVariantId);
  const activeStock = selectedVariantObj ? selectedVariantObj.stockQuantity : (product?.stockQuantity ?? 0);
  const isOutOfStock = !!product && activeStock <= 0;
  const isLowStock = !!product && activeStock > 0 && activeStock <= 5;

  // Seçilen ürün ve varyant sunucudaki sepete eklenir.
  const handleAddToCart = async () => {
    if (!product) { setToastMessage('Bu ürün henüz sepete eklenemiyor.'); return false; }
    if (isOutOfStock) { setToastMessage('Bu ürün şu an stokta bulunmamaktadır.'); return false; }
    try {
      await cartApi.add(product.id, currentVariant.id || null, quantity);
      setToastMessage(`${currentVariant.name} (${quantity} adet) sepetinize eklendi.`);
      return true;
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Ürün sepete eklenemedi.');
      return false;
    }
  };

  // Fast Buy
  const handleFastBuy = async () => {
    if (await handleAddToCart()) navigate('/sepetim');
  };

  const openReviewModal = () => {
    if (!canReview) {
      setToastMessage(canReviewReason);
      return;
    }
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authStorage.getAccessToken()) { setToastMessage('Yorum yapmak için giriş yapın.'); return; }
    if (!product) { setToastMessage('Bu ürün için yorum gönderilemiyor.'); return; }
    try {
      await authFetch(`/api/products/${product.id}/reviews`, { method: 'POST', body: JSON.stringify({ rating: newReviewRating, text: newReviewComment }) });
      setReviewModalOpen(false);
      setNewReviewComment('');
      setCanReview(false);
      setCanReviewReason('Bu ürün için yorumunuz zaten mevcut.');
      setToastMessage('Yorumunuz alındı ve admin onayına gönderildi.');
    } catch (error) { setToastMessage(error instanceof Error ? error.message : 'Yorum gönderilemedi.'); }
  };

  if (!product) return <div className="min-h-screen bg-background"><StorefrontHeader /><main className="mx-auto max-w-4xl p-8"><p role="status">{productError || !slug ? 'Ürün bulunamadı veya yüklenemedi.' : 'Ürün yükleniyor...'}</p><Link className="mt-4 inline-block underline" to="/products">Ürünlere dön</Link></main></div>;

  return (
    <div className="bg-background text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in text-label-md">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed" data-icon="check_circle">check_circle</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-80">
            <span className="material-symbols-outlined text-[16px]" data-icon="close">close</span>
          </button>
        </div>
      )}

      <StorefrontHeader />

      {/* MAIN CANVAS CONTAINER */}
      <main className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6 flex-1 flex flex-col gap-6 sm:gap-8 overflow-x-hidden">
        {/* 2. BREADCRUMBS */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-label-sm font-label-sm text-on-surface-variant">
          <Link className="hover:text-primary transition-colors" to="/">Ana Sayfa</Link>
          <span className="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
          <Link className="hover:text-primary transition-colors" to="/products">Tüm Ürünler</Link>
          <span className="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
          <Link className="hover:text-primary transition-colors" to={`/products?category=${encodeURIComponent(product?.categorySlug || 'zeytinyaglari')}`}>{product?.categoryName || 'Zeytinyağları & Zeytin'}</Link>
          <span className="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
          <span className="text-primary font-bold">{product?.name || 'Hatay Taş Baskı Erken Hasat Zeytinyağı'}</span>
        </nav>

        {/* 3. ANA ÜRÜN VİTRİNİ (2 Kolonlu Düzen) */}
        <section className="grid grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* SOL KOLON: Zengin Görsel Galerisi */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4">
            {/* Ana Görsel Çerçevesi */}
            <div className="relative w-full aspect-square bg-surface-container-high rounded-xl overflow-hidden border border-secondary/20 shadow-sm group">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={galleryImages[activeImageIndex]?.alt || 'Ürün görseli'}
                src={galleryImages[activeImageIndex]?.url}
              />

              {/* Provenance and Technical Badges */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5 sm:gap-2 z-10 max-w-[calc(100%-4.5rem)]">
                {product?.isNew && (
                  <span className="bg-primary text-on-primary px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-label-sm font-label-sm shadow-sm flex items-center gap-1.5 w-fit">
                    <span className="material-symbols-outlined text-[14px]" data-icon="eco">eco</span>
                    Yeni Mahsul
                  </span>
                )}
                {!product?.isNew && product?.isBestSeller && (
                  <span className="bg-primary text-on-primary px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-label-sm font-label-sm shadow-sm flex items-center gap-1.5 w-fit">
                    <span className="material-symbols-outlined text-[14px]" data-icon="workspace_premium">workspace_premium</span>
                    Çok Satan
                  </span>
                )}
                {product?.origin && (
                  <span className="bg-primary-container text-surface px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-label-sm font-label-sm shadow-sm flex items-center gap-1.5 border border-primary-fixed-dim/20 w-fit">
                    <span className="material-symbols-outlined text-[14px]" data-icon="location_on">location_on</span>
                    {product.origin}
                  </span>
                )}
                {product?.categoryName && (
                  <span className="bg-surface-container-lowest text-secondary border border-secondary/30 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-label-sm font-label-sm shadow-sm font-bold w-fit">
                    {product.categoryName}
                  </span>
                )}
              </div>

              {/* Wishlist Floating Toggle */}
              <button
                onClick={toggleWishlist}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-surface-container-lowest/90 hover:bg-surface-container-lowest text-secondary flex items-center justify-center border border-secondary/20 shadow-md transition-all active:translate-y-px z-10"
                title="Favorilere Ekle"
              >
                <span className={`material-symbols-outlined text-[22px] ${isWishlist ? 'text-tertiary fill-icon' : 'hover:text-error'}`} style={isWishlist ? { fontVariationSettings: '"FILL" 1' } : {}} data-icon="favorite">
                  favorite
                </span>
              </button>
            </div>

            {/* Thumbnail Slider Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square rounded-lg overflow-hidden transition-all bg-surface-container-high ${activeImageIndex === idx ? 'border-2 border-primary ring-2 ring-primary/20 opacity-100 scale-105' : 'border border-secondary/20 opacity-70 hover:opacity-100'}`}
                >
                  <img className="w-full h-full object-cover" alt={img.alt} src={img.url} />
                </button>
              ))}
            </div>
          </div>

          {/* SAĞ KOLON: Satın Alma, Varyant & Detay Kartı */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 sm:gap-5 bg-surface-container-low p-4 sm:p-6 lg:p-8 rounded-xl border border-secondary/20 shadow-sm min-w-0">
            {/* Yöre ve Menşei Çipi */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 bg-surface-container-highest px-3 py-1 rounded-full text-label-md font-label-md text-secondary border border-secondary/20">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container" data-icon="location_on">location_on</span>
                <span>{product?.origin || 'Hatay / Altınözü - Hacıpaşa Köyü Zeytinliği'}</span>
              </div>
              <div className="flex items-center gap-1 text-tertiary font-bold text-label-md">
                <span className="material-symbols-outlined text-[16px] fill-icon text-secondary-container" style={{ fontVariationSettings: '"FILL" 1' }} data-icon="star">star</span>
                <span>{reviewsList.length ? `${reviewAverage} (${reviewsList.length} gösterilen yorum)` : 'Henüz yorum yok'}</span>
              </div>
            </div>

            {/* Ürün Başlığı */}
            <div>
              <h1 className="text-headline-lg font-headline-lg font-bold text-primary tracking-tight">
                {product?.name || 'Taş Baskı Erken Hasat Soğuk Sıkım Zeytinyağı'}
              </h1>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                {product?.shortDescription || 'Ekim ayında erken toplanan zeytinlerden soğuk sıkımla elde edilen en yüksek polifenollü saf zeytinyağı.'}
              </p>
            </div>

            {/* Fiyatlandırma Paneli */}
            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-headline-xl font-headline-xl text-primary font-extrabold">{money(currentPrice)}</span>
              {originalPrice && (
                <span className="text-headline-sm font-headline-sm text-outline line-through">{money(originalPrice)}</span>
              )}
              {discountRate > 0 && (
                <span className="bg-tertiary-container text-on-tertiary px-2.5 py-0.5 rounded text-label-md font-label-md font-bold">
                  %{discountRate} İndirim
                </span>
              )}
            </div>

            {/* Hacim / Varyant Seçimi */}
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-label-md font-label-md text-on-surface font-bold flex flex-wrap items-center justify-between gap-1">
                <span>Ambalaj / Hacim Seçiniz:</span>
                <span className="text-body-sm text-secondary font-normal">Seçili: {currentVariant.name}</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {variants.map(v => {
                  const isSelected = v.id === selectedVariantId;
                  const vPrice = v.discountPrice ?? v.price;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`flex flex-col text-left p-3 rounded-lg relative transition-all active:translate-y-px ${isSelected ? 'border-2 border-primary bg-primary/5 shadow-sm' : 'border border-secondary/20 bg-surface hover:border-primary'}`}
                    >
                      {v.badge && (
                        <span className="absolute -top-2 right-2 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                          {v.badge}
                        </span>
                      )}
                      <span className={`text-label-md font-label-md font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {v.name}
                      </span>
                      <span className={`text-body-sm font-body-sm mt-1 ${isSelected ? 'text-primary font-bold' : 'text-secondary'}`}>
                        {money(vPrice)}
                      </span>
                      <span className="text-label-sm font-label-sm text-outline mt-1">
                        {v.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stok & Tazelik Uyarısı */}
            <div className="flex flex-wrap items-center gap-2 bg-surface-container-high/60 px-3.5 py-2 rounded-lg border border-secondary/15 text-body-sm font-body-sm text-on-surface">
              <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-error' : isLowStock ? 'bg-tertiary-container animate-pulse' : 'bg-primary-container animate-pulse'}`}></span>
              <span className={`font-bold ${isOutOfStock ? 'text-error' : isLowStock ? 'text-tertiary' : 'text-primary'}`}>
                {isOutOfStock ? 'Tükendi' : isLowStock ? `Son ${activeStock} adet` : 'Stokta Var'}
              </span>
              <span className="text-outline">·</span>
              <span className="text-on-surface-variant">
                {isOutOfStock
                  ? 'Bu ürün geçici olarak stokta bulunmamaktadır.'
                  : product?.origin
                    ? `${product.origin} yöresinden taze tedarik edilmiştir.`
                    : 'Doğal üretim taze mahsul olarak hazırlanmıştır.'}
              </span>
            </div>

            {/* Adet Seçici & Eylemler */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 pt-2">
              {/* Stepper */}
              <div className="flex items-center border border-secondary/30 rounded-lg bg-surface shrink-0">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={isOutOfStock}
                  className="w-10 sm:w-11 h-12 flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors rounded-l-lg font-bold text-lg active:translate-y-px disabled:opacity-40"
                >
                  -
                </button>
                <input
                  className="w-10 sm:w-12 text-center bg-transparent border-0 font-bold text-on-surface text-body-md focus:ring-0"
                  readOnly
                  type="text"
                  value={quantity}
                />
                <button
                  onClick={() => setQuantity(prev => (activeStock > 0 ? Math.min(activeStock, prev + 1) : prev + 1))}
                  disabled={isOutOfStock}
                  className="w-10 sm:w-11 h-12 flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors rounded-r-lg font-bold text-lg active:translate-y-px disabled:opacity-40"
                >
                  +
                </button>
              </div>

              {/* Sepete Ekle Butonu */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 min-w-[180px] h-12 bg-primary-container text-on-primary hover:bg-primary transition-all duration-150 rounded-lg font-bold text-sm sm:text-label-lg flex items-center justify-center gap-2 px-4 shadow-md active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]" data-icon="shopping_basket">shopping_basket</span>
                <span>{isOutOfStock ? 'Stokta Yok' : `Sepete Ekle (${money(currentPrice * quantity)})`}</span>
              </button>

              {/* Hemen Al Butonu */}
              <button
                onClick={handleFastBuy}
                disabled={isOutOfStock}
                className="w-full sm:w-auto px-6 h-12 bg-tertiary-container text-on-tertiary hover:opacity-95 transition-all duration-150 rounded-lg font-bold text-label-lg font-label-lg active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hemen Al
              </button>
            </div>

            {/* Güven & Teslimat Özellikleri (Grid Kutulu Liste) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-secondary/20">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-secondary/15">
                <span className="material-symbols-outlined text-primary text-[22px]" data-icon="local_shipping">local_shipping</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md font-bold text-on-surface">Aynı Gün Kargo</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant text-[12px] leading-tight">Saat 15:00'e kadar siparişlerde</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-secondary/15">
                <span className="material-symbols-outlined text-primary text-[22px]" data-icon="inventory_2">inventory_2</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md font-bold text-on-surface">Kırılmaz Ambalaj</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant text-[12px] leading-tight">Hava yastıklı koruyucu koli</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-secondary/15">
                <span className="material-symbols-outlined text-primary text-[22px]" data-icon="verified_user">verified_user</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md font-bold text-on-surface">%100 Doğallık Garantisi</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant text-[12px] leading-tight">Beğenmezseniz sorgusuz iade</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface border border-secondary/15">
                <span className="material-symbols-outlined text-primary text-[22px]" data-icon="nest_eco_leaf">nest_eco_leaf</span>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md font-bold text-on-surface">Katkısız &amp; İlaçsız</span>
                  <span className="text-body-sm font-body-sm text-on-surface-variant text-[12px] leading-tight">Rafine edilmemiş köy mahsulü</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. DETAYLI BİLGİ SEKME ALANI */}
        <section className="mt-4 bg-surface rounded-xl border border-secondary/20 shadow-sm overflow-hidden">
          {/* Sekme Başlıkları */}
          <div className="flex items-center border-b border-secondary/20 bg-surface-container-high/40 px-3 sm:px-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('desc')}
              className={`py-3 sm:py-4 px-3.5 sm:px-5 text-sm sm:text-label-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'desc' ? 'text-primary border-b-2 border-primary -mb-px' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="history_edu">history_edu</span>
              <span>Ürün Açıklaması &amp; Hasat Hikâyesi</span>
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`py-3 sm:py-4 px-3.5 sm:px-5 text-sm sm:text-label-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'storage' ? 'text-primary border-b-2 border-primary -mb-px' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="shelves">shelves</span>
              <span>Saklama Koşulları &amp; Kullanım</span>
            </button>
            <button
              onClick={() => setActiveTab('farmer')}
              className={`py-3 sm:py-4 px-3.5 sm:px-5 text-sm sm:text-label-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'farmer' ? 'text-primary border-b-2 border-primary -mb-px' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="cottage">cottage</span>
              <span>Üretici &amp; Köyümüz Hakkında</span>
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 sm:py-4 px-3.5 sm:px-5 text-sm sm:text-label-lg font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'reviews' ? 'text-primary border-b-2 border-primary -mb-px' : 'text-on-surface-variant hover:text-primary'}`}
            >
              <span className="material-symbols-outlined text-[18px]" data-icon="reviews">reviews</span>
              <span>Müşteri Değerlendirmeleri</span>
            </button>
          </div>

          {/* Sekme İçerikleri */}
          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'desc' && (
              <div className="grid grid-cols-12 gap-8 items-start">
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-5">
                  <h2 className="text-headline-md font-headline-md font-bold text-primary">
                    {product?.name || 'Ürün Detayı'}
                  </h2>
                  {(product?.description || product?.shortDescription || 'Anadolu’nun yerel üreticilerinden doğal yöntemlerle hazırlanmıştır.')
                    .split(/\n{2,}/)
                    .map((para, i) => (
                      <p key={i} className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                        {para}
                      </p>
                    ))}
                  {(product?.ingredients || product?.allergens) && (
                    <div className="bg-surface-container p-4 rounded-lg border-l-4 border-primary flex items-start gap-3 mt-2">
                      <span className="material-symbols-outlined text-primary text-[24px]" data-icon="verified">verified</span>
                      <div className="text-body-sm font-body-sm text-on-surface space-y-1">
                        {product?.ingredients && (
                          <div><strong>İçindekiler:</strong> {product.ingredients}</div>
                        )}
                        {product?.allergens && (
                          <div><strong>Alerjen Uyarısı:</strong> {product.allergens}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-12 lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-secondary/20 flex flex-col gap-4">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]" data-icon="lab_profile">lab_profile</span>
                    Ürün Özellikleri &amp; Künyesi
                  </h3>
                  <div className="space-y-3 font-label-md text-label-md">
                    {product?.categoryName && (
                      <div className="flex justify-between gap-3 border-b border-secondary/15 pb-2">
                        <span className="text-on-surface-variant">Kategori</span>
                        <strong className="text-primary font-bold text-right">{product.categoryName}</strong>
                      </div>
                    )}
                    {product?.origin && (
                      <div className="flex justify-between gap-3 border-b border-secondary/15 pb-2">
                        <span className="text-on-surface-variant">Menşei / Yöre</span>
                        <strong className="text-primary font-bold text-right">{product.origin}</strong>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 border-b border-secondary/15 pb-2">
                      <span className="text-on-surface-variant">Birim / Ambalaj</span>
                      <strong className="text-primary font-bold text-right">{currentVariant.note || product?.unitInfo || 'Standart'}</strong>
                    </div>
                    {product?.shelfLife && (
                      <div className="flex justify-between gap-3 border-b border-secondary/15 pb-2">
                        <span className="text-on-surface-variant">Raf Ömrü</span>
                        <strong className="text-primary font-bold text-right">{product.shelfLife}</strong>
                      </div>
                    )}
                    {product?.sku && (
                      <div className="flex justify-between gap-3 border-b border-secondary/15 pb-2">
                        <span className="text-on-surface-variant">Ürün Kodu</span>
                        <strong className="text-primary font-bold text-right">{product.sku}</strong>
                      </div>
                    )}
                    {product?.attributes?.map((attr, idx) => (
                      <div key={`${attr.name}-${idx}`} className="flex justify-between gap-3 border-b border-secondary/15 pb-2 last:border-b-0 last:pb-0">
                        <span className="text-on-surface-variant">{attr.name}</span>
                        <strong className="text-primary font-bold text-right">{attr.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-headline-md font-headline-md font-bold text-primary">Saklama Talimatı</h3>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {product?.storageConditions || 'Doğrudan güneş ışığı almayan, serin ve kuru bir ortamda muhafaza ediniz. Açıldıktan sonra ambalajını sıkıca kapatarak tazeliğini koruyabilirsiniz.'}
                  </p>
                  <ul className="space-y-2 font-label-md text-label-md text-on-surface">
                    {product?.shelfLife && (
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]" data-icon="check">check</span>
                        <span>Tavsiye edilen raf ömrü: <strong>{product.shelfLife}</strong></span>
                      </li>
                    )}
                    {product?.allergens && (
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]" data-icon="info">info</span>
                        <span>Alerjen bilgisi: <strong>{product.allergens}</strong></span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]" data-icon="check">check</span>
                      <span>Doğal yapısı gereği koruyucu ve yapay katkı maddesi içermez.</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-surface-container p-6 rounded-xl border border-secondary/20 space-y-4">
                  <h3 className="text-headline-sm font-headline-sm font-bold text-primary">Ürün &amp; Ambalaj Bilgileri</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {product?.shortDescription || 'Köyden sofranıza taze ve güvenli ambalaj ile ulaştırılır.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-label-md font-label-md">
                    <div className="p-3 bg-surface rounded-lg border border-secondary/20">
                      <span className="text-xs text-outline block">Ambalaj / Gramaj</span>
                      <strong className="text-primary">{currentVariant.note || product?.unitInfo || 'Standart'}</strong>
                    </div>
                    <div className="p-3 bg-surface rounded-lg border border-secondary/20">
                      <span className="text-xs text-outline block">Menşei</span>
                      <strong className="text-primary">{product?.origin || 'Anadolu'}</strong>
                    </div>
                    {product?.ingredients && (
                      <div className="p-3 bg-surface rounded-lg border border-secondary/20 sm:col-span-2">
                        <span className="text-xs text-outline block">İçindekiler</span>
                        <strong className="text-primary">{product.ingredients}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'farmer' && (
              <div className="space-y-4">
                <h3 className="text-headline-md font-headline-md font-bold text-primary">
                  {product?.origin ? `${product.origin} Yerel Üreticileri` : 'Anadolu Köy Üreticileri'}
                </h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {product?.name || 'Bu ürün'}, {product?.origin || 'Anadolu'} yöresindeki sözleşmeli aile çiftlikleri ve yerel üretici kooperatiflerimiz tarafından geleneksel yöntemlerle üretilmektedir.
                </p>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  Aracı olmadan doğrudan üreticiden tedarik edilen mahsullerimiz, hijyenik koşullarda paketlenerek tazeliğini kaybetmeden sofranıza ulaştırılır.
                </p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-secondary/20">
                  <h3 className="text-headline-sm font-bold text-primary">Gösterilen Değerlendirmeler ({reviewsList.length})</h3>
                  <button
                    onClick={openReviewModal}
                    className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold"
                  >
                    Yorum Yaz
                  </button>
                </div>
                <div className="space-y-4">
                  {reviewsList.map(rev => (
                    <div key={rev.id} className="p-4 rounded-xl bg-surface-container-low border border-secondary/15 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-label-sm ${rev.avatarColor}`}>
                            {rev.initials}
                          </div>
                          <div>
                            <span className="font-bold text-label-md text-on-surface block">{rev.name}</span>
                            <span className="text-label-sm text-outline">{rev.date}</span>
                          </div>
                        </div>
                        <span className="text-label-sm text-primary flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[16px]" data-icon="check_circle">check_circle</span>
                          Yayınlanan Yorum
                        </span>
                      </div>
                      <div className="flex text-tertiary-container">
                        {[...Array(rev.rating)].map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[16px] fill-icon" style={{ fontVariationSettings: '"FILL" 1' }} data-icon="star">star</span>
                        ))}
                      </div>
                      <p className="text-body-md text-on-surface">{rev.comment}</p>
                      <span className="text-label-sm text-outline mt-1">{rev.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. ÜRETİCİ PROFİLİ & KÖYÜN HİKAYESİ KARTI */}
        <section className="bg-surface-container-high/60 rounded-xl p-4 sm:p-6 lg:p-8 border border-secondary/20 grid grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="col-span-12 lg:col-span-4 rounded-xl overflow-hidden shadow-sm aspect-4/3 bg-surface-container">
            <img
              className="w-full h-full object-cover"
              alt="Mehmet Ali Dayı - Hatay Hacıpaşa Köyü"
              src="/images/products/mehmet-ali-dayi.jpg"
            />
          </div>
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary text-on-primary text-label-sm font-label-sm px-3 py-1 rounded-full">Toprağın Emekçisi</span>
              <span className="text-label-md font-label-md text-secondary">Hacıpaşa Köyü Üretici Dayanışması</span>
            </div>
            <h3 className="text-headline-lg font-headline-lg font-bold text-primary">
              Üreticimiz: Mehmet Ali Dayı &amp; Hacıpaşa Köyü Kooperatifi
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
              "Biz dedemizden ne gördüysek onu yaparız. Kimyasal gübre zeytinin kalbini kırar. Ağaçlarımızı kuyu suyuyla, toprağımızı hayvan gübresiyle besleriz. Bu yağ soframıza koyduğumuz, çocuklarımıza içirdiğimiz yağdır." Mehmet Ali Dayı ve kooperatif üyesi 14 aile, 3 kuşaktır Altınözü'nün yerel Halhalı ve Saurani cinsi zeytinlerini koruyup geleneksel taş baskı yöntemiyle üretime devam ediyor.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-label-md font-label-md text-primary font-bold">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-tertiary-container" data-icon="verified">verified</span>
                <span>Doğrudan Çiftçiden Tedarik</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-tertiary-container" data-icon="compost">compost</span>
                <span>İlaçsız &amp; Doğal Tarım</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-tertiary-container" data-icon="handshake">handshake</span>
                <span>Adil Ticaret Fiyatlandırması</span>
              </div>
            </div>
          </div>
        </section>

        {/* 6. MÜŞTERİ YORUMLARI & DEĞERLENDİRME BÖLÜMÜ */}
        <section className="bg-surface rounded-xl p-4 sm:p-6 lg:p-8 border border-secondary/20 shadow-sm flex flex-col gap-6 sm:gap-8" id="yorumlar">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-secondary/20">
            <div>
              <h3 className="text-headline-lg font-headline-lg font-bold text-primary">Müşteri Değerlendirmeleri</h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant">Üye yorumları onaylandıktan sonra yayınlanır.</p>
            </div>
            <button
              onClick={openReviewModal}
              className="bg-surface-container-high border border-secondary/30 text-on-surface hover:bg-surface-container-highest px-5 py-2.5 rounded-lg text-label-md font-label-md font-bold transition-all active:translate-y-px"
            >
              Yorum Yap
            </button>
          </div>

          {/* Puan Dağılım Bento */}
          <div className="grid grid-cols-12 gap-6 sm:gap-8 items-center bg-surface-container-low p-4 sm:p-6 rounded-xl border border-secondary/15">
            <div className="col-span-12 md:col-span-4 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-secondary/20 pb-6 md:pb-0">
              <span className="text-display-lg font-display-lg text-primary font-extrabold leading-none">{reviewAverage}</span>
              <div className="flex items-center text-tertiary-container my-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: `"FILL" ${i <= Math.round(Number(reviewAverage)) ? 1 : 0}` }} data-icon="star">star</span>
                ))}
              </div>
              <span className="text-label-md font-label-md text-on-surface-variant">{reviewsList.length} gösterilen değerlendirme</span>
            </div>

            <div className="col-span-12 md:col-span-8 flex flex-col gap-2">
              <div className="flex items-center gap-3 text-label-sm font-label-sm">
                <span className="w-12 text-on-surface">5 Yıldız</span>
                <div className="flex-1 bg-surface-container-highest h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 5).length / reviewsList.length * 100) : 0}%` }}></div>
                </div>
                <span className="w-10 text-right text-on-surface-variant">%{reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 5).length / reviewsList.length * 100) : 0}</span>
              </div>
              <div className="flex items-center gap-3 text-label-sm font-label-sm">
                <span className="w-12 text-on-surface">4 Yıldız</span>
                <div className="flex-1 bg-surface-container-highest h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 4).length / reviewsList.length * 100) : 0}%` }}></div>
                </div>
                <span className="w-10 text-right text-on-surface-variant">%{reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 4).length / reviewsList.length * 100) : 0}</span>
              </div>
              <div className="flex items-center gap-3 text-label-sm font-label-sm">
                <span className="w-12 text-on-surface">3 Yıldız</span>
                <div className="flex-1 bg-surface-container-highest h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 3).length / reviewsList.length * 100) : 0}%` }}></div>
                </div>
                <span className="w-10 text-right text-on-surface-variant">%{reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 3).length / reviewsList.length * 100) : 0}</span>
              </div>
              <div className="flex items-center gap-3 text-label-sm font-label-sm">
                <span className="w-12 text-on-surface">2 Yıldız</span>
                <div className="flex-1 bg-surface-container-highest h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 2).length / reviewsList.length * 100) : 0}%` }}></div>
                </div>
                <span className="w-10 text-right text-on-surface-variant">%{reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 2).length / reviewsList.length * 100) : 0}</span>
              </div>
              <div className="flex items-center gap-3 text-label-sm font-label-sm">
                <span className="w-12 text-on-surface">1 Yıldız</span>
                <div className="flex-1 bg-surface-container-highest h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: `${reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 1).length / reviewsList.length * 100) : 0}%` }}></div>
                </div>
                <span className="w-10 text-right text-on-surface-variant">%{reviewsList.length ? Math.round(reviewsList.filter(review => review.rating === 1).length / reviewsList.length * 100) : 0}</span>
              </div>
            </div>
          </div>

          {/* Örnek Gerçek Yorumlar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewsList.slice(0, 2).map(rev => (
              <div key={rev.id} className="p-5 rounded-xl bg-surface-container-low border border-secondary/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-label-md ${rev.avatarColor}`}>
                      {rev.initials}
                    </div>
                    <div>
                      <span className="font-bold text-label-md text-on-surface block">{rev.name}</span>
                      <span className="text-label-sm text-outline">{rev.date}</span>
                    </div>
                  </div>
                  <span className="text-label-sm text-primary flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[16px]" data-icon="check_circle">check_circle</span>
                    Yayınlanan Yorum
                  </span>
                </div>
                <div className="flex text-tertiary-container">
                  {[...Array(rev.rating)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[16px] fill-icon" style={{ fontVariationSettings: '"FILL" 1' }} data-icon="star">star</span>
                  ))}
                </div>
                <p className="text-body-md font-body-md text-on-surface">
                  "{rev.comment}"
                </p>
                <span className="text-label-sm text-outline mt-auto">{rev.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. BİRLİKTE İYİ GİDEN YÖRESEL LEZZETLER (Cross-Sell Ürün Kartları) */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-headline-lg font-headline-lg font-bold text-primary">Bu Ürünle Birlikte İyi Gider</h3>
            </div>
            <Link className="text-label-lg font-label-lg text-secondary hover:text-primary font-bold flex items-center gap-1" to="/products">
              <span>Tüm Yöresel Kileri Gör</span>
              <span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(cp => {
              const cpPrice = cp.discountPrice ?? cp.basePrice;
              const cpBadge = cp.isBestSeller ? 'Çok Satan' : cp.isNew ? 'Yeni' : cp.categoryName || 'Önerilen';
              return (
              <div key={cp.id} className="bg-surface rounded-xl border border-secondary/20 overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="relative aspect-square bg-surface-container-high overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={cp.name}
                    src={cp.mainImageUrl || '/images/products/prod-ceviz-ici.jpg'}
                  />
                  <span className="absolute top-2 left-2 bg-primary text-on-primary text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
                    {cpBadge}
                  </span>
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <span className="text-label-sm font-label-sm text-secondary">{cp.origin || cp.categoryName || 'Yöresel Ürün'}</span>
                  <Link to={`/products/${cp.slug}`}>
                    <h4 className="font-bold text-headline-sm text-primary leading-snug group-hover:text-primary-container transition-colors line-clamp-1">
                      {cp.name}
                    </h4>
                  </Link>
                  <span className="text-body-sm font-body-sm text-outline">{cp.unitInfo}</span>
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-secondary/15">
                    <span className="text-headline-sm font-headline-sm font-bold text-on-surface">{money(cpPrice)}</span>
                    <Link to={`/products/${cp.slug}`}
                      className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center hover:bg-primary active:translate-y-px transition-colors shadow-sm"
                      title="Ürünü Gör"
                    >
                      <span className="material-symbols-outlined text-[18px]" data-icon="add_shopping_cart">add_shopping_cart</span>
                    </Link>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-secondary/20 shadow-2xl relative">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined text-[24px]" data-icon="close">close</span>
            </button>

            <h3 className="text-headline-md font-bold text-primary mb-1">Değerlendirmenizi Yazın</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">
              Ürünle ilgili deneyiminiz diğer doğal gıda severler için çok değerlidir.
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Puanınız</label>
                <div className="flex gap-2 text-tertiary-container cursor-pointer">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <span
                        className={`material-symbols-outlined text-[28px] ${star <= newReviewRating ? 'fill-icon text-secondary-container' : 'text-outline-variant'}`}
                        style={star <= newReviewRating ? { fontVariationSettings: '"FILL" 1' } : {}}
                        data-icon="star"
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-label-md font-bold text-on-surface mb-1">Yorumunuz</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ürünün kokusu, tadı ve tazeliği hakkında düşünceleriniz..."
                  value={newReviewComment}
                  onChange={e => setNewReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-secondary/30 bg-surface-container-low text-on-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 border border-secondary/30 rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container-high"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-bold hover:bg-primary-container"
                >
                  Yorumu Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARED COMPONENT: Footer */}
      <footer className="w-full mt-auto bg-primary text-on-primary border-t border-primary-container">
        <div className="w-full px-6 lg:px-12 max-w-[1320px] mx-auto py-12 flex flex-col gap-10">
          <div className="grid grid-cols-12 gap-8 items-start border-b border-primary-container/80 pb-10">
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-fixed text-[36px]" data-icon="eco">eco</span>
                <span className="text-headline-lg font-headline-lg font-extrabold text-on-primary tracking-tight">Köyden Sofraya</span>
              </div>
              <p className="text-body-sm font-body-sm text-surface-container-high max-w-md leading-relaxed">
                Anadolu'nun kadim köylerinde bin yıllık geleneklerle toprağı işleyen üreticilerimizi doğrudan sofranızla buluşturuyoruz. Aracısız, katkısız ve toprağın özüyle beslenen gerçek gıda.
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-secondary-fixed">
                <span className="flex items-center gap-1.5 text-label-sm font-label-sm">
                  <span className="material-symbols-outlined text-[18px]" data-icon="verified">verified</span>
                  Sözleşmeli Köy Kooperatifleri
                </span>
                <span className="flex items-center gap-1.5 text-label-sm font-label-sm">
                  <span className="material-symbols-outlined text-[18px]" data-icon="ac_unit">ac_unit</span>
                  Soğuk Zincir Lojistik
                </span>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-7 flex flex-col sm:flex-row gap-6 justify-between lg:pl-10">
              <div className="flex flex-col gap-2.5">
                <span className="text-label-lg font-label-lg font-bold text-on-primary">Ürün Kategorileri</span>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/products?category=kahvaltiliklar">Köy Kahvaltılıkları</Link>
                <Link className="text-secondary-fixed font-semibold underline text-body-sm font-body-sm" to="/products?category=zeytinyaglari">Zeytinyağları</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/products?category=salca-ve-soslar">Salça &amp; Soslar</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/products?category=bal-ve-receller">Bal &amp; Reçel</Link>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-label-lg font-label-lg font-bold text-on-primary">Kurumsal &amp; Destek</span>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/hikayemiz">Hakkımızda</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/products">Kargo ve Teslimat</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/siparis-takip">Sipariş Takibi</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/hikayemiz">İletişim</Link>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-label-lg font-label-lg font-bold text-on-primary">Yasal Bilgiler</span>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/hikayemiz">Mesafeli Satış Sözleşmesi</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/hikayemiz">Gizlilik ve Güvenlik</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/hikayemiz">İade &amp; Değişim Koşulları</Link>
                <Link className="text-surface-container-high hover:text-on-primary transition-colors text-body-sm font-body-sm" to="/hikayemiz">KVKK Aydınlatma Metni</Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm font-body-sm text-surface-container-high">
            <div>
              © 2025 Köyden Sofraya Doğal Gıda A.Ş. Tüm hakları saklıdır. Anadolu'nun bereketli topraklarından sofranıza.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="px-2.5 py-1 bg-surface-container-lowest/10 rounded text-[11px] font-bold text-surface-container-high border border-surface-container-high/20">TROY</span>
              <span className="px-2.5 py-1 bg-surface-container-lowest/10 rounded text-[11px] font-bold text-surface-container-high border border-surface-container-high/20">VISA</span>
              <span className="px-2.5 py-1 bg-surface-container-lowest/10 rounded text-[11px] font-bold text-surface-container-high border border-surface-container-high/20">Mastercard</span>
              <span className="px-2.5 py-1 bg-surface-container-lowest/10 rounded text-[11px] font-bold text-surface-container-high border border-surface-container-high/20">256-Bit SSL</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
