import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HomeLoadingOverlay } from '../../components/storefront/HomeLoadingOverlay';
import { money, request, type Product } from '../../api/storefront/storefrontApi';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { cartApi } from '../../api/storefront/cartApi';
import { useWishlist } from '../../api/storefront/useWishlist';
import { matchCategory } from '../products/productsMockData';
import type { BannerDto } from '../../api/types';

interface UiCategory {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  description: string;
  imageUrl: string;
}

interface UiProduct {
  id: string;
  name: string;
  slug: string;
  category: 'kahvaltilik' | 'zeytinyagi' | 'salca' | 'bal' | 'bakliyat' | 'diger';
  price: number;
  oldPrice?: number | null;
  rating: number;
  reviewCount: number;
  badge: string;
  badgeColor: string;
  variantCount: number;
  imageUrl: string;
}

interface SeasonalProduct {
  id: string;
  name: string;
  slug: string;
  region: string;
  badge: string;
  priceInfo: string;
  price: number;
  description: string;
  variantCount: number;
  imageUrl: string;
}

const DEFAULT_CATEGORIES: UiCategory[] = [
  {
    id: 'cat-1',
    name: 'Köy Kahvaltılıkları',
    slug: 'kahvaltiliklar',
    productCount: 6,
    description: 'Köy peynirleri, petek bal, yayık tereyağı, kırık ve sele zeytinler.',
    imageUrl: '/images/products/cat-kahvaltilik.jpg',
  },
  {
    id: 'cat-2',
    name: 'Taş Baskı Zeytinyağları',
    slug: 'zeytinyaglari',
    productCount: 6,
    description: 'Erken hasat, soğuk sıkım Ayvalık ve Hatay dağ zeytinyağları.',
    imageUrl: '/images/products/cat-zeytinyagi.jpg',
  },
  {
    id: 'cat-3',
    name: 'Güneşte Kurutulmuş Salça & Soslar',
    slug: 'salca-ve-soslar',
    productCount: 6,
    description: 'Gaziantep biber salçası, Hatay domates salçası, katkısız menemenlik.',
    imageUrl: '/images/products/cat-salca.jpg',
  },
  {
    id: 'cat-4',
    name: 'Ev Yapımı Reçel & Bal',
    slug: 'bal-ve-receller',
    productCount: 6,
    description: 'Toroslar ham çam balı, karadut reçeli, odun ateşinde incir reçeli.',
    imageUrl: '/images/products/cat-bal-recel.jpg',
  },
  {
    id: 'cat-5',
    name: 'Yöresel Bakliyat & Erişte',
    slug: 'kuru-gidalar',
    productCount: 6,
    description: 'Taş değirmen unları, el kesmesi köy eriştesi, İspir kuru fasulye.',
    imageUrl: '/images/products/cat-bakliyat.jpg',
  },
  {
    id: 'cat-6',
    name: 'Kurutulmuş Meyve & Kuruyemiş',
    slug: 'kuruyemisler',
    productCount: 6,
    description: 'Malatya günkurusu kayısı, Aydın inciri, taze kırılmış köy cevizi.',
    imageUrl: '/images/products/cat-kuruyemis.jpg',
  },
];

function classifyProductCategory(categorySlug?: string, categoryName?: string, name?: string): UiProduct['category'] {
  if (categorySlug) {
    if (matchCategory(categorySlug, 'kahvaltiliklar')) return 'kahvaltilik';
    if (matchCategory(categorySlug, 'zeytinyaglari')) return 'zeytinyagi';
    if (matchCategory(categorySlug, 'salca-ve-soslar')) return 'salca';
    if (matchCategory(categorySlug, 'bal-ve-receller')) return 'bal';
    if (matchCategory(categorySlug, 'kuru-gidalar')) return 'bakliyat';
  }
  const label = `${categoryName ?? ''} ${name ?? ''}`.toLocaleLowerCase('tr-TR');
  if (label.includes('peynir') || label.includes('kaşar') || label.includes('tereyağ') || label.includes('kaymak') || label.includes('kahvaltı')) {
    return 'kahvaltilik';
  }
  if (label.includes('zeytin')) return 'zeytinyagi';
  if (label.includes('salça') || label.includes('sos') || label.includes('acuka') || label.includes('biber')) return 'salca';
  if (label.includes('bal') || label.includes('reçel') || label.includes('pekmez')) return 'bal';
  return 'diger';
}

const DEFAULT_HERO_BANNER: BannerDto = {
  id: 'default-hero',
  title: 'Köyün Bereketi, Sofranızın Lezzeti',
  subtitle: "Anadolu'nun bereketli topraklarından gelen doğal, geleneksel ve yöresel lezzetlerle sofranıza doğallık katın. Katkısız, geleneksel yöntemlerle üretilen en taze mahsuller kapınızda.",
  imageUrl: '/images/hero-bento-showcase.png',
  targetUrl: '/products',
  buttonText: 'Ürünleri Keşfet',
  displayOrder: 1,
  isActive: true,
  badgeText: 'Doğrudan Üreticisinden & Katkısız',
  features: '%100 Katkısız, Geleneksel Taş Değirmen, Soğuk Sıkım',
  secondaryButtonText: 'Hikâyemizi Tanıyın',
  secondaryTargetUrl: '/hikayemiz',
};

function getFeatureIcon(featureText: string): string {
  const lower = featureText.toLocaleLowerCase('tr-TR');
  if (lower.includes('katkısız') || lower.includes('organik') || lower.includes('doğal')) return 'verified';
  if (lower.includes('taş') || lower.includes('değirmen') || lower.includes('yağ') || lower.includes('sıkım')) return 'water_drop';
  if (lower.includes('soğuk') || lower.includes('döngü') || lower.includes('taze')) return 'autorenew';
  if (lower.includes('odun') || lower.includes('ateş')) return 'local_fire_department';
  return 'eco';
}

export function StorefrontPage() {
  const navigate = useNavigate();
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [initialDataReady, setInitialDataReady] = useState(false);
  const [openingFinished, setOpeningFinished] = useState(false);

  // Search & Filters
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'kahvaltilik' | 'zeytinyagi' | 'salca'>('all');

  // Cart & Wishlist state
  const { ids: wishlist, toggle: toggleFavorite } = useWishlist();

  // UI state
  const [toastMessage, setToastMessage] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Hero Banners Slider state
  const [banners, setBanners] = useState<BannerDto[]>([DEFAULT_HERO_BANNER]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSlidePaused, setIsSlidePaused] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadCatalogProducts = async () => {
      try {
        const result = await request<{ items: Product[] }>('/api/catalog/products?pageSize=100', { signal: controller.signal });
        setCatalogProducts(result.items);
        setToastMessage('');
      } catch {
        if (controller.signal.aborted) return;
        await new Promise(resolve => setTimeout(resolve, 800));
        if (controller.signal.aborted) return;
        try {
          const result = await request<{ items: Product[] }>('/api/catalog/products?pageSize=100', { signal: controller.signal });
          setCatalogProducts(result.items);
          setToastMessage('');
        } catch {
          if (!controller.signal.aborted) {
            setToastMessage('Ürünler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.');
          }
        }
      }
    };
    void loadCatalogProducts();

    // Fetch active hero banners from CMS / Content API
    request<BannerDto[]>('/api/content/banners', { signal: controller.signal })
      .then(items => {
        if (Array.isArray(items) && items.length > 0) {
          setBanners(items);
        }
      })
      .catch(() => {
        /* silently retain default hero */
      });

    setInitialDataReady(true);
    return () => controller.abort();
  }, []);

  // Hero carousel auto-rotate
  useEffect(() => {
    if (banners.length <= 1 || isSlidePaused) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length, isSlidePaused]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const added = await toggleFavorite(productId);
      setToastMessage(added ? 'Ürün favorilerinize eklendi.' : 'Ürün favorilerinizden çıkarıldı.');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Favori işlemi tamamlanamadı.');
    }
  };

  const handleAddToCart = async (product: { id: string; name: string; slug: string; variantCount: number }, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (product.variantCount > 0) {
      navigate(`/products/${encodeURIComponent(product.slug)}`);
      return;
    }
    try {
      await cartApi.add(product.id, null, 1);
      setToastMessage(`${product.name} sepetinize eklendi.`);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Ürün sepete eklenemedi.');
    }
  };

  const bestSellers: UiProduct[] = useMemo(() => {
    const matching = catalogProducts.filter(p => p.isBestSeller);
    const others = catalogProducts.filter(p => !p.isBestSeller);
    const combined = matching.length >= 3 ? matching : [...matching, ...others];

    const apiItems: UiProduct[] = combined
      .map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: classifyProductCategory(p.categorySlug, p.categoryName, p.name),
        price: p.discountPrice ?? p.basePrice,
        oldPrice: p.discountPrice != null ? p.basePrice : null,
        rating: 4.9,
        reviewCount: 84,
        badge: p.isBestSeller ? 'Çok Satan' : 'Tavsiye Edilen',
        badgeColor: 'bg-primary-container text-surface',
        variantCount: p.variantCount,
        imageUrl: p.mainImageUrl || '/images/products/prod-zeytinyagi-hatay.jpg',
      }));

    return apiItems;
  }, [catalogProducts]);

  const filteredBestSellers = useMemo(() => {
    const list = selectedCategoryTab === 'all'
      ? bestSellers
      : bestSellers.filter(p => p.category === selectedCategoryTab);
    return list.slice(0, 6);
  }, [bestSellers, selectedCategoryTab]);

  const seasonalProducts: SeasonalProduct[] = useMemo(() => {
    const apiSeasonal = catalogProducts.filter(p => p.isSeasonal).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      region: p.categoryName ?? 'Anadolu Hasadı',
      badge: 'Mevsimlik',
      priceInfo: `${money(p.discountPrice ?? p.basePrice)} / ${p.unitInfo}`,
      price: p.discountPrice ?? p.basePrice,
      description: p.shortDescription,
      imageUrl: p.mainImageUrl || '/images/products/prod-ceviz-ici.jpg',
      variantCount: p.variantCount,
    }));
    return apiSeasonal.slice(0, 4);
  }, [catalogProducts]);

  const activeBanner = banners[currentSlide] ?? banners[0] ?? DEFAULT_HERO_BANNER;

  const bannerFeatures = useMemo(() => {
    if (!activeBanner.features) return ['%100 Katkısız', 'Geleneksel Taş Değirmen', 'Soğuk Sıkım'];
    return activeBanner.features.split(',').map(f => f.trim()).filter(Boolean);
  }, [activeBanner.features]);

  const titleParts = useMemo(() => {
    const raw = activeBanner.title || '';
    if (raw.includes('\n')) {
      const [first, ...rest] = raw.split('\n');
      return { main: first, sub: rest.join(' ') };
    }
    if (raw.includes(',')) {
      const idx = raw.indexOf(',');
      return { main: raw.substring(0, idx + 1), sub: raw.substring(idx + 1).trim() };
    }
    return { main: raw, sub: '' };
  }, [activeBanner.title]);

  return (
    <>
      <HomeLoadingOverlay ready={initialDataReady} onFinished={() => setOpeningFinished(true)} />
      <div inert={!openingFinished} aria-hidden={!openingFinished} className="bg-background text-on-surface antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed min-h-screen flex flex-col font-body-md text-body-md">

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-surface-tint/30 transition-all duration-300">
            <span className="material-symbols-outlined text-surface-tint">check_circle</span>
            <span className="font-label-md text-label-md">{toastMessage}</span>
            <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-80">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        <StorefrontHeader wishlistCount={wishlist.length} />

        {/* 3. Immersive Hero Section */}
        <section
          className="relative bg-surface-container-high py-12 lg:py-20 border-b border-surface-container-highest overflow-hidden"
          onMouseEnter={() => setIsSlidePaused(true)}
          onMouseLeave={() => setIsSlidePaused(false)}
        >
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Text & Value Content */}
            <div className="lg:col-span-6 flex flex-col items-start space-y-6">
              {/* Provenance Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface-container-low border border-secondary/30 rounded-full text-secondary font-label-md text-label-md shadow-sm">
                <span className="material-symbols-outlined text-base text-primary-container">eco</span>
                <span>{activeBanner.badgeText || 'Doğrudan Üreticisinden & Katkısız'}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[48px] font-extrabold text-primary tracking-tight leading-[1.12]">
                {titleParts.main}
                {titleParts.sub && (
                  <>
                    <br />
                    <span className="text-secondary block mt-1">{titleParts.sub}</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                {activeBanner.subtitle || "Anadolu'nun bereketli topraklarından gelen doğal, geleneksel ve yöresel lezzetlerle sofranıza doğallık katın. Katkısız, geleneksel yöntemlerle üretilen en taze mahsuller kapınızda."}
              </p>

              {/* Value Pills */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                {bannerFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-full bg-surface-container text-primary border border-surface-variant text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary-container">
                      {getFeatureIcon(feat)}
                    </span>
                    {feat}
                  </span>
                ))}
              </div>

              {/* Dual CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link
                  to={activeBanner.targetUrl || '/products'}
                  className="px-8 py-3.5 bg-primary-container text-on-primary hover:bg-primary font-bold text-base rounded-lg shadow-sm transition-all duration-150 active:translate-y-px flex items-center gap-2"
                >
                  <span>{activeBanner.buttonText || 'Ürünleri Keşfet'}</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                {activeBanner.secondaryButtonText && (
                  <Link
                    to={activeBanner.secondaryTargetUrl || '/hikayemiz'}
                    className="px-7 py-3.5 bg-surface-container-low border-2 border-secondary text-secondary hover:bg-surface-variant font-bold text-base rounded-lg transition-all duration-150 active:translate-y-px"
                  >
                    {activeBanner.secondaryButtonText}
                  </Link>
                )}
              </div>

              {/* Slider Carousel Controls (if multiple banners) */}
              {banners.length > 1 && (
                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCurrentSlide(prev => (prev === 0 ? banners.length - 1 : prev - 1))}
                    className="w-9 h-9 rounded-full bg-surface-container border border-surface-variant hover:bg-surface-container-highest text-primary flex items-center justify-center transition-colors shadow-xs"
                    title="Önceki vitrin"
                    aria-label="Önceki vitrin"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    {banners.map((b, idx) => (
                      <button
                        key={b.id || idx}
                        type="button"
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          idx === currentSlide ? 'w-8 bg-primary' : 'w-2.5 bg-surface-variant hover:bg-secondary/60'
                        }`}
                        title={`Vitrin ${idx + 1}`}
                        aria-label={`Vitrin ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
                    className="w-9 h-9 rounded-full bg-surface-container border border-surface-variant hover:bg-surface-container-highest text-primary flex items-center justify-center transition-colors shadow-xs"
                    title="Sonraki vitrin"
                    aria-label="Sonraki vitrin"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                  <span className="text-xs text-on-surface-variant font-medium ml-1">
                    {currentSlide + 1} / {banners.length}
                  </span>
                </div>
              )}
            </div>

            {/* Hero Visual Composition: Farmhouse Table Bento Showcase */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto rounded-2xl overflow-hidden farmhouse-shadow border-2 border-surface-container-highest bg-surface-container min-h-[300px]">
                <img
                  key={activeBanner.id || currentSlide}
                  className="w-full h-auto object-cover block transition-opacity duration-500"
                  alt={activeBanner.title || 'Köyden Sofraya Zengin Anadolu Kahvaltı Masası'}
                  src={activeBanner.imageUrl || '/images/hero-bento-showcase.png'}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/hero-bento-showcase.png';
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Value Props / Trust Ribbon */}
        <section className="py-8 bg-surface-container-low border-b border-surface-container-highest">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">eco</span>
              </div>
              <div>
                <h4 className="font-bold text-headline-sm text-primary text-sm sm:text-base">Doğrudan Üreticiden</h4>
                <p className="text-body-sm text-on-surface-variant text-xs">Aracısız aile çiftlikleri</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-xl bg-secondary text-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">inventory_2</span>
              </div>
              <div>
                <h4 className="font-bold text-headline-sm text-primary text-sm sm:text-base">Kırılmaz Ambalaj</h4>
                <p className="text-body-sm text-on-surface-variant text-xs">Buz akülü koruma</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-xl bg-surface-tint text-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <h4 className="font-bold text-headline-sm text-primary text-sm sm:text-base">%100 Katkısız</h4>
                <p className="text-body-sm text-on-surface-variant text-xs">Geleneksel şirden maya</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3">
              <div className="w-12 h-12 rounded-xl bg-tertiary-container text-surface flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <div>
                <h4 className="font-bold text-headline-sm text-primary text-sm sm:text-base">Ücretsiz Kargo</h4>
                <p className="text-body-sm text-on-surface-variant text-xs">750 TL ve üzeri siparişte</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Featured Categories Grid */}
        <section className="py-16 bg-surface">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-surface-container-highest">
              <div>
                <span className="text-label-md font-label-md text-secondary font-bold uppercase tracking-wider block mb-1">
                  Doğal Çeşitler
                </span>
                <h2 className="text-headline-xl font-headline-xl text-primary font-bold">Geleneksel Lezzet Kategorileri</h2>
              </div>
              <Link to="/products" className="mt-4 md:mt-0 text-primary hover:text-secondary font-label-md flex items-center gap-1 group">
                <span>Tüm Kategorileri Gör</span>
                <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {DEFAULT_CATEGORIES.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="group relative rounded-xl overflow-hidden border border-surface-container-highest bg-surface-container-low hover:-translate-y-1.5 hover:shadow-xl hover:border-secondary transition-all duration-300 farmhouse-shadow"
                >
                  <div className="h-60 overflow-hidden relative">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      alt={cat.name}
                      src={cat.imageUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/65 via-primary/10 to-transparent group-hover:from-primary/75 transition-colors duration-300 pointer-events-none"></div>
                    <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface/95 text-primary text-xs font-bold shadow-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      Keşfet
                      <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-headline-sm font-headline-sm font-bold text-primary group-hover:text-secondary transition-colors">
                        {cat.name}
                      </h3>
                      <span className="material-symbols-outlined text-[20px] text-secondary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        arrow_forward
                      </span>
                    </div>
                    <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Best-Sellers Showcase */}
        <section className="py-16 bg-surface-container-high border-y border-surface-container-highest" id="urunler">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-surface-container-highest">
              <div>
                <span className="text-label-md font-label-md text-secondary font-bold uppercase tracking-wider block mb-1">
                  Müşterilerimizin Vazgeçilmezleri
                </span>
                <h2 className="text-headline-xl font-headline-xl text-primary font-bold">En Çok Tercih Edilen Köy Lezzetleri</h2>
              </div>
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <button
                  onClick={() => setSelectedCategoryTab('all')}
                  className={`px-4 py-2 rounded-lg font-label-md font-bold transition-colors ${
                    selectedCategoryTab === 'all'
                      ? 'bg-primary-container text-surface shadow-sm'
                      : 'bg-surface hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setSelectedCategoryTab('kahvaltilik')}
                  className={`px-4 py-2 rounded-lg font-label-md font-bold transition-colors ${
                    selectedCategoryTab === 'kahvaltilik'
                      ? 'bg-primary-container text-surface shadow-sm'
                      : 'bg-surface hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  Kahvaltılıklar
                </button>
                <button
                  onClick={() => setSelectedCategoryTab('zeytinyagi')}
                  className={`px-4 py-2 rounded-lg font-label-md font-bold transition-colors ${
                    selectedCategoryTab === 'zeytinyagi'
                      ? 'bg-primary-container text-surface shadow-sm'
                      : 'bg-surface hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  Zeytinyağı
                </button>
                <button
                  onClick={() => setSelectedCategoryTab('salca')}
                  className={`px-4 py-2 rounded-lg font-label-md font-bold transition-colors ${
                    selectedCategoryTab === 'salca'
                      ? 'bg-primary-container text-surface shadow-sm'
                      : 'bg-surface hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  Salçalar
                </button>
              </div>
            </div>

            {/* Compact Responsive Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredBestSellers.map(product => {
                const isFav = wishlist.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-surface rounded-xl border border-surface-container-highest overflow-hidden farmhouse-shadow flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-44 sm:h-48 bg-surface-container-low overflow-hidden">
                        <Link to={`/products/${product.slug}`} className="block w-full h-full">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={product.name}
                            src={product.imageUrl}
                          />
                        </Link>
                        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 ${product.badgeColor} text-[11px] rounded-md font-bold shadow-sm`}>
                          {product.badge}
                        </span>
                        <button
                          onClick={e => toggleWishlist(product.id, e)}
                          aria-label="Favoriye ekle"
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/90 hover:bg-surface text-primary flex items-center justify-center transition-colors shadow-sm active:scale-95"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isFav ? 'fill-icon text-tertiary-container' : ''}`}>
                            favorite
                          </span>
                        </button>
                      </div>

                      <div className="p-3.5 sm:p-4 pb-2">
                        <Link to={`/products/${product.slug}`}>
                          <h3 className="text-sm sm:text-base font-bold text-primary leading-snug line-clamp-2 hover:text-secondary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <div className="p-3.5 sm:p-4 pt-2.5 border-t border-surface-container">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5 sm:mb-3">
                        <div>
                          {product.oldPrice && (
                            <span className="text-xs text-outline line-through block">
                              {money(product.oldPrice)}
                            </span>
                          )}
                          <p className="text-base sm:text-lg font-bold text-primary">
                            {money(product.price)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={e => handleAddToCart(product, e)}
                        className="w-full py-2 px-3 bg-primary-container hover:bg-primary text-surface text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 active:translate-y-px shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                        <span>Sepete Ekle</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. Brand Story Spotlight */}
        <section className="py-20 bg-surface relative overflow-hidden" id="hikayemiz">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border-2 border-secondary/20 shadow-xl bg-surface-container relative">
                <img
                  src="/images/products/mehmet-ali-dayi.jpg"
                  alt="Mehmet Ali Dayı - Hatay Hacıpaşa Köyü"
                  className="w-full h-80 sm:h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-on-primary">
                  <p className="font-bold text-headline-sm">Mehmet Ali Dayı &amp; Hacıpaşa Köyü</p>
                  <p className="text-body-sm opacity-90 text-surface-container-high">3 Kuşaktır Taş Baskı Zeytincilik</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container text-secondary font-label-md text-label-md rounded-full">
                <span className="material-symbols-outlined text-sm">history_edu</span>
                <span>Bizim Hikâyemiz</span>
              </div>
              <h2 className="text-headline-xl font-headline-xl text-primary font-bold leading-tight">
                Anadolu'nun Bereketli Topraklarından Sofranıza
              </h2>
              <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
                "Biz dedemizden ne gördüysek onu yaparız. Kimyasal gübre zeytinin kalbini kırar. Ağaçlarımızı kuyu suyuyla, toprağımızı hayvan gübresiyle besleriz. Bu yağ soframıza koyduğumuz, çocuklarımıza içirdiğimiz yağdır."
              </p>
              <p className="text-body-sm font-body-sm text-outline leading-relaxed">
                Köyden Sofraya olarak Ege'nin zeytinliklerinden Toroslar'ın yüksek yaylalarına, Kars'ın meralarından Gaziantep'in güneşli avlularına kadar yerel üretici ailelerle ve kadın kooperatifleriyle doğrudan el sıkışıyoruz. Katkı maddesi, raf ömrü uzatıcı kimyasallar ve endüstriyel hileler sofranıza giremez.
              </p>
              <div className="flex flex-wrap items-center gap-8 pt-2">
                <div>
                  <p className="text-headline-lg font-bold text-primary">14+</p>
                  <p className="text-body-sm text-secondary">Köy Kooperatifi</p>
                </div>
                <div className="w-px h-10 bg-surface-container-highest"></div>
                <div>
                  <p className="text-headline-lg font-bold text-primary">%100</p>
                  <p className="text-body-sm text-secondary">Doğal &amp; Katkısız</p>
                </div>
                <div className="w-px h-10 bg-surface-container-highest"></div>
                <div>
                  <p className="text-headline-lg font-bold text-primary">24 Saat</p>
                  <p className="text-body-sm text-secondary">Kırılmaz Ambalaj</p>
                </div>
              </div>
              <Link
                to="/hikayemiz"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-container hover:bg-primary text-on-primary font-bold text-sm rounded-lg transition-colors shadow-xs"
              >
                <span>Tüm Hikâyemizi ve Üreticilerimizi Keşfedin</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 8. Seasonal Village Harvest Special */}
        <section className="py-16 bg-surface-container-high border-t border-surface-container-highest">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-surface-container-highest">
              <div>
                <span className="text-label-md font-label-md text-secondary font-bold uppercase tracking-wider block mb-1">
                  Mevsim Takvimi
                </span>
                <h2 className="text-headline-xl font-headline-xl text-primary font-bold">Mevsiminde Taze Mahsuller</h2>
              </div>
              <p className="text-body-sm font-body-sm text-outline mt-2 md:mt-0 max-w-md">
                Doğanın döngüsüne saygı duyuyoruz. Sadece zamanında toplanan taze ürünleri sunuyoruz.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {seasonalProducts.map(season => (
                <div
                  key={season.id}
                  className="p-4 rounded-xl bg-surface-container-low border border-surface-variant hover:border-secondary transition-all farmhouse-shadow flex flex-col justify-between"
                >
                  <div>
                    <Link to={`/products/${season.slug}`} className="block h-44 rounded-lg overflow-hidden relative mb-4">
                      <img className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt={season.name} src={season.imageUrl} />
                      <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-primary-container text-surface text-label-sm font-label-sm rounded font-bold">
                        {season.badge}
                      </span>
                    </Link>
                    <span className="text-label-sm font-label-sm text-secondary font-bold uppercase">{season.region}</span>
                    <Link to={`/products/${season.slug}`}>
                      <h3 className="text-headline-sm font-headline-sm font-bold text-primary mt-1 hover:text-secondary transition-colors">{season.name}</h3>
                    </Link>
                    <p className="text-body-sm font-body-sm text-on-surface-variant mt-1.5">{season.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-surface-variant flex items-center justify-between">
                    <span className="text-headline-sm font-headline-sm font-bold text-primary">{season.priceInfo}</span>
                    <button
                      onClick={() => handleAddToCart(season)}
                      className="p-2.5 bg-primary-container text-surface rounded-lg hover:bg-primary transition-colors active:translate-y-px"
                      aria-label={`${season.name} sepete ekle`}
                    >
                      <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Village Newsletter & Harvest Alert */}
        <section className="py-14 bg-surface-container-high">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <div className="bg-tertiary-container rounded-2xl p-5 sm:p-8 lg:p-12 text-surface border border-tertiary relative overflow-hidden farmhouse-shadow">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                <div className="lg:col-span-7 space-y-3">
                  <span className="px-3 py-1 bg-surface/20 rounded-md text-tertiary-fixed text-label-sm font-label-sm font-bold uppercase">
                    İlk Hasat Bülteni
                  </span>
                  <h2 className="text-headline-xl font-headline-xl font-bold tracking-tight text-on-tertiary">
                    Köyün İlk Hasadından İlk Sizin Haberiniz Olsun
                  </h2>
                  <p className="text-body-md font-body-md text-tertiary-fixed max-w-xl">
                    Sınırlı miktarda üretilen mevsimlik mahsuller, yeni sıkım zeytinyağları ve özel kooperatif indirimleri e-posta kutunuza gelsin. İlk siparişinizde geçerli <strong>%10 Hoş Geldin İndirimi</strong> kazanın.
                  </p>
                </div>
                <div className="lg:col-span-5">
                  {newsletterSubscribed ? (
                    <div className="bg-surface/20 p-4 rounded-xl text-center">
                      <span className="material-symbols-outlined text-3xl mb-1 text-surface-tint">mark_email_read</span>
                      <p className="font-bold">Aramıza hoş geldiniz!</p>
                      <p className="text-xs text-tertiary-fixed mt-1">%10 indirim kodunuz: <strong>KÖYDEN10</strong></p>
                    </div>
                  ) : (
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        if (newsletterEmail) {
                          setNewsletterSubscribed(true);
                          setToastMessage('Bülten kaydınız tamamlandı! %10 indirim kodunuz tanımlandı.');
                        }
                      }}
                      className="flex flex-col sm:flex-row gap-2.5"
                    >
                      <input
                        value={newsletterEmail}
                        onChange={e => setNewsletterEmail(e.target.value)}
                        required
                        className="px-4 py-3.5 bg-surface text-on-surface rounded-lg border-0 focus:ring-2 focus:ring-surface-tint flex-1 placeholder:text-outline text-body-sm font-body-sm"
                        placeholder="E-posta adresinizi yazın..."
                        type="email"
                      />
                      <button
                        className="px-6 py-3.5 bg-surface-tint hover:bg-primary-container text-surface rounded-lg font-label-md font-bold transition-all shrink-0 active:translate-y-px"
                        type="submit"
                      >
                        Kayıt Ol
                      </button>
                    </form>
                  )}
                  <p className="text-xs text-tertiary-fixed/80 mt-2">
                    Kişisel verileriniz KVKK kapsamında korunmaktadır. Dilediğiniz zaman abonelikten çıkabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Footer */}
        <footer className="bg-primary text-on-primary w-full mt-auto border-t border-primary-container">
          <div className="w-full px-6 lg:px-12 max-w-[1320px] mx-auto py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
              {/* Column 1: Brand Info */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-2xl">potted_plant</span>
                  </div>
                  <span className="text-headline-lg font-headline-lg font-extrabold text-on-primary">Köyden Sofraya</span>
                </div>
                <p className="text-body-sm font-body-sm text-surface-container-high max-w-sm leading-relaxed">
                  Anadolu'nun kadim lezzet mirasını koruyan, yerel kadın kooperatifleri ve köy üreticileriyle çalışan dürüst gıda girişimi. Sofranıza giren her lokmada saflık ve emek var.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <a aria-label="Instagram" className="w-9 h-9 rounded-lg bg-primary-container hover:bg-surface-tint flex items-center justify-center text-on-primary transition-colors" href="https://instagram.com" target="_blank" rel="noreferrer">
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                  </a>
                  <a aria-label="Facebook" className="w-9 h-9 rounded-lg bg-primary-container hover:bg-surface-tint flex items-center justify-center text-on-primary transition-colors" href="https://facebook.com" target="_blank" rel="noreferrer">
                    <span className="material-symbols-outlined text-lg">public</span>
                  </a>
                  <a aria-label="YouTube" className="w-9 h-9 rounded-lg bg-primary-container hover:bg-surface-tint flex items-center justify-center text-on-primary transition-colors" href="https://youtube.com" target="_blank" rel="noreferrer">
                    <span className="material-symbols-outlined text-lg">smart_display</span>
                  </a>
                </div>
              </div>

              {/* Column 2: Ürün Kategorileri */}
              <div>
                <h4 className="text-headline-sm font-headline-sm font-bold text-on-primary mb-4">Ürün Kategorileri</h4>
                <ul className="space-y-2.5 font-label-md text-label-md">
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products?category=kahvaltiliklar">Köy Kahvaltılıkları</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products?category=zeytinyaglari">Zeytinyağları</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products?category=salca-ve-soslar">Salça &amp; Soslar</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products?category=bal-ve-receller">Bal &amp; Reçel</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products?category=kuru-gidalar">Kuru Gıdalar &amp; Bakliyat</Link></li>
                </ul>
              </div>

              {/* Column 3: Kurumsal */}
              <div>
                <h4 className="text-headline-sm font-headline-sm font-bold text-on-primary mb-4">Kurumsal</h4>
                <ul className="space-y-2.5 font-label-md text-label-md">
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">Hikâyemiz &amp; Hakkımızda</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products">Kargo ve Teslimat</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">İade &amp; Değişim Koşulları</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">Mesafeli Satış Sözleşmesi</Link></li>
                  <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">Gizlilik ve Güvenlik</Link></li>
                </ul>
              </div>

              {/* Column 4: İletişim & Destek */}
              <div>
                <h4 className="text-headline-sm font-headline-sm font-bold text-on-primary mb-4">İletişim &amp; Destek</h4>
                <ul className="space-y-3 font-body-sm text-body-sm text-surface-container-high">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-base mt-0.5 text-inverse-primary">location_on</span>
                    <span>Köyceğiz Mah. Üretici Sok. No: 12 Ayvalık / Balıkesir</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-inverse-primary">call</span>
                    <span>0850 302 45 65</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-inverse-primary">mail</span>
                    <span>siparis@koydensofraya.com</span>
                  </li>
                  <li className="pt-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-container rounded border border-surface-tint/40 text-xs text-on-primary">
                      <span className="material-symbols-outlined text-sm text-inverse-primary">shield</span>
                      <span>256-Bit SSL Korumalı Güvenli Ödeme</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar: Copyright & Payment Badges */}
            <div className="pt-8 border-t border-primary-container flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-body-sm font-body-sm text-surface-container-high">
                © {new Date().getFullYear()} Köyden Sofraya Doğal Gıda A.Ş. Tüm hakları saklıdır. Anadolu'nun bereketli topraklarından sofranıza.
              </p>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-surface-container-lowest text-primary text-xs font-bold rounded">TROY</span>
                <span className="px-2.5 py-1 bg-surface-container-lowest text-primary text-xs font-bold rounded">VISA</span>
                <span className="px-2.5 py-1 bg-surface-container-lowest text-primary text-xs font-bold rounded">Mastercard</span>
                <span className="px-2.5 py-1 bg-surface-container-lowest text-primary text-xs font-bold rounded">Havale/EFT</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
