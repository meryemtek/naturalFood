import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { request, money, type CatalogCategory, type Product } from '../../api/storefront/storefrontApi';
import { cartApi } from '../../api/storefront/cartApi';
import { useWishlist } from '../../api/storefront/useWishlist';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';

import {
  type UiProduct,
  STITCH_PRODUCTS,
  CATEGORY_FILTERS,
  REGIONS,
  matchCategory,
} from './productsMockData';

const CATEGORY_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  'kahvaltiliklar': {
    title: 'Köy Kahvaltılıkları',
    subtitle: 'Yayla peynirleri, yayık tereyağı, hakiki manda kaymağı ve doğal zeytin çeşitleri.',
    icon: 'breakfast_dining',
  },
  'zeytinyaglari': {
    title: 'Taş Baskı Zeytinyağı & Zeytin',
    subtitle: 'Soğuk sıkım erken hasat sızma zeytinyağları ve geleneksel salamura zeytinler.',
    icon: 'water_drop',
  },
  'salca-ve-soslar': {
    title: 'Güneşte Kurutulmuş Salça & Soslar',
    subtitle: 'Odun ateşinde ve Ağustos güneşinde kıvam alan katkısız köy salçaları ve soslar.',
    icon: 'soup_kitchen',
  },
  'bal-ve-receller': {
    title: 'Doğal Bal, Pekmez & Reçeller',
    subtitle: 'Yüksek yayla karakovan balları, odun ateşinde pişmiş meyve reçelleri ve pekmezler.',
    icon: 'hive',
  },
  'kuru-gidalar': {
    title: 'Yöresel Erişte & Bakliyat',
    subtitle: 'Köy yumurtalı el kesimi erişteler, taş değirmen unları ve ata tohumu bakliyatlar.',
    icon: 'grain',
  },
  'kuruyemisler': {
    title: 'Kuruyemiş & Kuru Meyveler',
    subtitle: 'Yeni mahsul kabuklu ceviz, çifte kavrulmuş fındık ve güneşte kurutulmuş meyveler.',
    icon: 'nutrition',
  },
};

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<UiProduct[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [allOrigins, setAllOrigins] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(1500);
  const [draftMinPrice, setDraftMinPrice] = useState<string>('0');
  const [draftMaxPrice, setDraftMaxPrice] = useState<string>('1500');
  const [priceRangeValue, setPriceRangeValue] = useState<number>(1500);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { ids: wishlist, toggle: toggleFavorite } = useWishlist();
  const [toastMessage, setToastMessage] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [catSectionOpen, setCatSectionOpen] = useState(true);
  const [regionSectionOpen, setRegionSectionOpen] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Sync URL query params -> state when user clicks header/footer links
  useEffect(() => {
    const urlCat = searchParams.get('category') || '';
    const urlSearch = searchParams.get('search') || '';
    setSelectedCategory(urlCat);
    setSearch(urlSearch);
    setPage(1);
  }, [searchParams]);

  // Helper to update category & URL cleanly
  const updateCategory = (nextCat: string) => {
    setSelectedCategory(nextCat);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (nextCat) params.set('category', nextCat);
    else params.delete('category');
    setSearchParams(params, { replace: true });
  };

  const updateSearch = (nextSearch: string) => {
    setSearch(nextSearch);
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    else params.delete('search');
    setSearchParams(params, { replace: true });
  };

  // Load categories & all product origins once on mount
  useEffect(() => {
    const controller = new AbortController();
    request<CatalogCategory[]>('/api/catalog/categories', { signal: controller.signal })
      .then(cats => setCatalogCategories(cats))
      .catch(() => {});

    const loadAllOrigins = async () => {
      try {
        const res = await request<{ items: Product[] }>('/api/catalog/products?pageSize=100', { signal: controller.signal });
        setAllOrigins((res.items ?? []).map(p => p.origin || '').filter(Boolean));
      } catch {
        if (controller.signal.aborted) return;
        await new Promise(resolve => setTimeout(resolve, 800));
        if (controller.signal.aborted) return;
        try {
          const res = await request<{ items: Product[] }>('/api/catalog/products?pageSize=100', { signal: controller.signal });
          setAllOrigins((res.items ?? []).map(p => p.origin || '').filter(Boolean));
        } catch {
          // ignore secondary failure
        }
      }
    };
    void loadAllOrigins();

    return () => controller.abort();
  }, []);

  // Load filtered & paginated products from Backend API
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      pageIndex: String(page),
      pageSize: String(pageSize),
    });
    if (selectedCategory) params.set('categorySlug', selectedCategory);
    if (search.trim()) params.set('search', search.trim());
    if (minPrice > 0) params.set('minPrice', String(minPrice));
    if (maxPrice < 1500) params.set('maxPrice', String(maxPrice));
    if (selectedRegions.length > 0) params.set('origin', selectedRegions.join(','));
    if (sortBy && sortBy !== 'rating') params.set('sortBy', sortBy);

    const applyProducts = (res: { items: Product[]; totalCount: number }) => {
      const mapped: UiProduct[] = (res.items || []).map((p, idx) => {
        const fallback = STITCH_PRODUCTS[idx % STITCH_PRODUCTS.length];
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription || fallback.shortDescription,
          categoryName: p.categoryName || fallback.categoryName,
          categorySlug: p.categorySlug || fallback.categorySlug,
          basePrice: p.basePrice,
          discountPrice: p.discountPrice,
          stockQuantity: p.stockQuantity,
          variantCount: p.variantCount,
          unitInfo: p.unitInfo || fallback.unitInfo,
          mainImageUrl: p.mainImageUrl || fallback.mainImageUrl,
          origin: p.origin || undefined,
          rating: fallback.rating,
          reviewCount: fallback.reviewCount,
          isBestSeller: p.isBestSeller,
          isNew: p.isNew,
          isFeatured: p.isFeatured,
          isColdChain: fallback.isColdChain,
          badge: p.isBestSeller ? 'Çok Satan' : p.isNew ? 'Yeni Mahsul' : fallback.badge,
        };
      });
      setProducts(mapped);
      setTotalCount(res.totalCount ?? mapped.length);
      setToastMessage('');
    };

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await request<{ items: Product[]; totalCount: number }>(`/api/catalog/products?${params.toString()}`, { signal: controller.signal });
        applyProducts(res);
      } catch {
        if (controller.signal.aborted) return;
        await new Promise(resolve => setTimeout(resolve, 800));
        if (controller.signal.aborted) return;
        try {
          const res = await request<{ items: Product[]; totalCount: number }>(`/api/catalog/products?${params.toString()}`, { signal: controller.signal });
          applyProducts(res);
        } catch {
          if (!controller.signal.aborted) {
            setToastMessage('Ürünler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.');
          }
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchProducts();

    return () => controller.abort();
  }, [page, selectedCategory, search, minPrice, maxPrice, selectedRegions, sortBy]);

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const toggleWishlist = async (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const added = await toggleFavorite(productId);
      setToastMessage(added ? 'Ürün favorilerinize eklendi.' : 'Ürün favorilerinizden çıkarıldı.');
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : 'Favoriler güncellenemedi.');
    }
  };

  const addToCart = async (product: UiProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variantCount) {
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

  const applyPriceFilter = () => {
    const parsedMin = Math.max(0, Number(draftMinPrice) || 0);
    const parsedMax = Math.max(parsedMin, Number(draftMaxPrice) || 1500);
    setMinPrice(parsedMin);
    setMaxPrice(parsedMax);
    setPriceRangeValue(Math.min(1500, parsedMax));
    setPage(1);
  };

  const selectedCatalogCat = catalogCategories.find(c => c.slug === selectedCategory);
  const selectedParentCat = selectedCatalogCat?.parentCategoryId
    ? catalogCategories.find(c => c.id === selectedCatalogCat.parentCategoryId)
    : undefined;

  const getCategoryCount = (slug: string): number => {
    if (catalogCategories.length === 0) return slug ? 0 : totalCount;
    if (!slug) {
      return catalogCategories.reduce((sum, c) => sum + c.productCount, 0);
    }
    const root = catalogCategories.find(c => c.slug === slug);
    if (!root) return 0;
    const ids = new Set<string>([root.id]);
    let added = true;
    while (added) {
      added = false;
      for (const cat of catalogCategories) {
        if (cat.parentCategoryId && ids.has(cat.parentCategoryId) && !ids.has(cat.id)) {
          ids.add(cat.id);
          added = true;
        }
      }
    }
    return catalogCategories
      .filter(c => ids.has(c.id))
      .reduce((sum, c) => sum + c.productCount, 0);
  };

  // Client-side rating sort (category, search, price, origin, and pagination are handled by backend)
  const filteredProducts = useMemo(() => {
    const result = [...products];
    if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return result;
  }, [products, sortBy]);

  const displayTotalCount = totalCount;

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedRegions([]);
    setMinPrice(0);
    setMaxPrice(1500);
    setDraftMinPrice('0');
    setDraftMaxPrice('1500');
    setPriceRangeValue(1500);
    setSortBy('featured');
    setPage(1);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(
    search || selectedCategory || selectedRegions.length > 0 || minPrice > 0 || maxPrice < 1500
  );

  // Active category meta for header
  const matchedFilter = CATEGORY_FILTERS.find(c => matchCategory(selectedCategory, c.slug));
  const activeMeta = matchedFilter
    ? CATEGORY_META[matchedFilter.slug]
    : {
        title: 'Doğal & Yöresel Ürünler',
        subtitle: 'Anadolu’nun bereketli köylerinden, katkısız ve geleneksel yöntemlerle üretilen taze mahsuller.',
        icon: 'eco',
      };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-sans selection:bg-secondary-fixed selection:text-tertiary">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-on-primary px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in text-label-md">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed" data-icon="check_circle">check_circle</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 hover:opacity-80">
            <span className="material-symbols-outlined text-[16px]" data-icon="close">close</span>
          </button>
        </div>
      )}

      <StorefrontHeader
        wishlistCount={wishlist.length}
        onSearch={value => updateSearch(value)}
        onCategorySelect={value => updateCategory(value)}
      />

      {/* Main Canvas */}
      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-12 py-6">
        {/* Clean, Unified Page Header & Toolbar */}
        <div className="mb-7 pb-5 border-b border-secondary/20 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-secondary mb-2">
              <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
              <span className="text-secondary/50">/</span>
              <button
                type="button"
                onClick={() => updateCategory('')}
                className={`hover:text-primary transition-colors ${!selectedCategory ? 'text-primary font-semibold' : ''}`}
              >
                Tüm Ürünler
              </button>
              {matchedFilter ? (
                <>
                  <span className="text-secondary/50">/</span>
                  <span className="text-primary font-semibold">{matchedFilter.name}</span>
                </>
              ) : selectedCatalogCat && (
                <>
                  {selectedParentCat && (
                    <>
                      <span className="text-secondary/50">/</span>
                      <button
                        type="button"
                        onClick={() => updateCategory(selectedParentCat.slug)}
                        className="hover:text-primary transition-colors"
                      >
                        {selectedParentCat.name}
                      </button>
                    </>
                  )}
                  <span className="text-secondary/50">/</span>
                  <span className="text-primary font-semibold">{selectedCatalogCat.name}</span>
                </>
              )}
            </nav>

            <h1 className="text-2xl sm:text-[28px] font-extrabold text-primary tracking-tight leading-tight">
              {selectedCatalogCat ? selectedCatalogCat.name : activeMeta.title}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
              {selectedCatalogCat?.description || activeMeta.subtitle}
            </p>
          </div>

          {/* Right Toolbar: Count, Sort & View Mode */}
          <div className="flex flex-wrap items-center gap-3 lg:flex-shrink-0">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-surface-container text-primary border border-secondary/30 rounded-lg text-xs font-bold"
            >
              <span className="material-symbols-outlined text-[16px]" data-icon="tune">tune</span>
              Filtreler
            </button>

            <div className="text-xs sm:text-sm text-on-surface-variant pr-2 border-r border-secondary/20">
              <strong className="font-extrabold text-primary">{displayTotalCount}</strong> ürün listeleniyor
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="products-sort" className="text-xs font-semibold text-secondary hidden sm:inline">
                Sıralama:
              </label>
              <select
                id="products-sort"
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                className="bg-surface-container/80 hover:bg-surface-container border border-secondary/25 rounded-lg py-1.5 pl-3 pr-8 text-xs sm:text-sm font-semibold text-primary focus:ring-primary focus:border-primary cursor-pointer transition-colors"
              >
                <option value="featured">Öne Çıkanlar</option>
                <option value="price_asc">Fiyata Göre Artan</option>
                <option value="price_desc">Fiyata Göre Azalan</option>
                <option value="bestselling">En Çok Satanlar</option>
                <option value="newest">En Yeniler</option>
                <option value="rating">Değerlendirme Puanı</option>
              </select>
            </div>

            <div className="flex items-center border border-secondary/25 rounded-lg p-0.5 bg-surface-container/80">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'}`}
                title="Izgara Görünümü"
              >
                <span className="material-symbols-outlined text-[18px] block" data-icon="grid_view">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface text-primary shadow-xs' : 'text-on-surface-variant hover:text-primary'}`}
                title="Liste Görünümü"
              >
                <span className="material-symbols-outlined text-[18px] block" data-icon="view_list">view_list</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area: Sidebar Filter + Product Grid */}
        <div className="flex gap-8 items-start">
          {/* Left Sidebar Filters */}
          <aside className={`space-y-4 lg:block lg:static lg:w-64 xl:w-72 lg:flex-shrink-0 lg:sticky lg:top-28 lg:p-0 lg:bg-transparent lg:overflow-visible ${mobileFilterOpen ? 'fixed inset-0 z-50 w-full bg-background p-5 overflow-y-auto' : 'hidden'}`}>
            {mobileFilterOpen && (
              <div className="flex items-center justify-between pb-3 border-b border-secondary/20 lg:hidden">
                <span className="font-headline-sm text-headline-sm font-bold text-primary">Filtreler</span>
                <button onClick={() => setMobileFilterOpen(false)} className="p-2">
                  <span className="material-symbols-outlined text-[24px]" data-icon="close">close</span>
                </button>
              </div>
            )}

            {/* Category Tree Filter (Starts aligned with the top of the Product Grid) */}
            <div className="bg-surface-container/60 border border-secondary/20 rounded-xl p-4">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-secondary/15">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]" data-icon="tune">tune</span>
                  <span className="text-sm font-bold text-primary">Filtreler</span>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-tertiary hover:underline"
                  >
                    Temizle
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCatSectionOpen(prev => !prev)}
                className="w-full text-sm font-bold text-primary flex items-center justify-between"
              >
                <span>Kategoriler</span>
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  {catSectionOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {catSectionOpen && (
                <div className="space-y-1.5 text-sm mt-3">
                  <button
                    type="button"
                    onClick={() => updateCategory('')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${!selectedCategory ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface hover:bg-surface-container'}`}
                  >
                    <span>Tüm Ürünler</span>
                    <span className={`text-xs ${!selectedCategory ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                      {getCategoryCount('')}
                    </span>
                  </button>
                  {CATEGORY_FILTERS.map(cat => {
                    const count = getCategoryCount(cat.slug);
                    const rootCat = catalogCategories.find(c => c.slug === cat.slug);
                    const subcategories = rootCat
                      ? catalogCategories
                          .filter(c => c.parentCategoryId === rootCat.id && c.isActive)
                          .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, 'tr'))
                      : [];
                    const isChecked = matchCategory(selectedCategory, cat.slug);
                    const isParentOrChildSelected =
                      isChecked || subcategories.some(sub => sub.slug === selectedCategory);
                    return (
                      <div key={cat.slug} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => updateCategory(isChecked ? '' : cat.slug)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${isChecked ? 'bg-primary text-on-primary font-semibold' : isParentOrChildSelected ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container'}`}
                        >
                          <span>{cat.name}</span>
                          <span className={`text-xs ${isChecked ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                            {count}
                          </span>
                        </button>
                        {subcategories.length > 0 && (
                          <div className="ml-3 pl-2.5 border-l border-secondary/25 space-y-1">
                            {subcategories.map(sub => {
                              const isSubChecked = selectedCategory === sub.slug;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => updateCategory(isSubChecked ? cat.slug : sub.slug)}
                                  className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-xs text-left transition-colors ${isSubChecked ? 'bg-primary text-on-primary font-semibold' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                                >
                                  <span>{sub.name}</span>
                                  <span className={`text-[11px] ${isSubChecked ? 'text-on-primary/80' : 'text-on-surface-variant/80'}`}>
                                    {sub.productCount}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Regional Origin Filter (Yöre) */}
            <div className="bg-surface-container/60 border border-secondary/20 rounded-xl p-4">
              <button
                type="button"
                onClick={() => setRegionSectionOpen(prev => !prev)}
                className="w-full font-headline-sm text-headline-sm font-bold text-primary flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary" data-icon="location_on">location_on</span>
                  Yöre &amp; Menşei
                </span>
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  {regionSectionOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {regionSectionOpen && (
                <div className="space-y-2.5 font-label-md text-label-md mt-3">
                  {REGIONS.map(reg => {
                    const isChecked = selectedRegions.includes(reg);
                    const keyword = reg.split('&')[0].split('(')[0].trim().toLocaleLowerCase('tr-TR');
                    const regionCount = allOrigins.filter(o => o.toLocaleLowerCase('tr-TR').includes(keyword)).length;
                    return (
                      <label key={reg} className="flex items-center justify-between cursor-pointer group">
                        <span className="flex items-center gap-2 text-on-surface group-hover:text-primary">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedRegions(prev => isChecked ? prev.filter(r => r !== reg) : [...prev, reg]);
                              setPage(1);
                            }}
                            className="w-4 h-4 rounded border-secondary/50 text-primary-container focus:ring-primary-container"
                          />
                          <span>{reg}</span>
                        </span>
                        <span className="text-on-surface-variant font-label-sm text-label-sm">{regionCount}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Range Slider & Numeric Inputs */}
            <div className="bg-surface-container/60 border border-secondary/20 rounded-xl p-4">
              <h3 className="font-headline-sm text-headline-sm font-bold text-primary mb-3">Fiyat Aralığı</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      className="w-full bg-surface border border-secondary/30 rounded-lg py-1.5 px-2.5 font-body-sm text-body-sm text-on-surface focus:border-primary-container focus:ring-0"
                      placeholder="Min"
                      type="number"
                      min={0}
                      value={draftMinPrice}
                      onChange={e => setDraftMinPrice(e.target.value)}
                    />
                    <span className="absolute right-2.5 top-2 text-on-surface-variant font-label-sm text-label-sm">TL</span>
                  </div>
                  <span className="text-secondary">-</span>
                  <div className="relative flex-1">
                    <input
                      className="w-full bg-surface border border-secondary/30 rounded-lg py-1.5 px-2.5 font-body-sm text-body-sm text-on-surface focus:border-primary-container focus:ring-0"
                      placeholder="Maks"
                      type="number"
                      min={0}
                      value={draftMaxPrice}
                      onChange={e => setDraftMaxPrice(e.target.value)}
                    />
                    <span className="absolute right-2.5 top-2 text-on-surface-variant font-label-sm text-label-sm">TL</span>
                  </div>
                </div>
                <input
                  className="w-full accent-primary-container cursor-pointer"
                  max="1500"
                  min="0"
                  type="range"
                  value={priceRangeValue}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setPriceRangeValue(val);
                    setDraftMaxPrice(String(val));
                    setMaxPrice(val);
                    setPage(1);
                  }}
                />
                <button
                  type="button"
                  onClick={applyPriceFilter}
                  className="w-full py-1.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-md text-label-md active:translate-y-px transition-colors"
                >
                  Uygula
                </button>
              </div>
            </div>

            {mobileFilterOpen && (
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold mt-4 lg:hidden"
              >
                Sonuçları Gör ({displayTotalCount})
              </button>
            )}
          </aside>

          {/* Right Product Grid / List */}
          <section className="flex-1">
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-secondary/15">
                <span className="text-xs font-semibold text-secondary mr-1">Seçili Filtreler:</span>
                {matchedFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-primary border border-secondary/25 rounded-lg text-xs font-semibold">
                    {matchedFilter.name}
                    <button onClick={() => updateCategory('')} className="hover:text-error transition-colors" title="Kaldır">
                      <span className="material-symbols-outlined text-[14px] block">close</span>
                    </button>
                  </span>
                )}
                {selectedRegions.map(reg => (
                  <span key={reg} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-primary border border-secondary/25 rounded-lg text-xs font-semibold">
                    {reg}
                    <button onClick={() => setSelectedRegions(prev => prev.filter(r => r !== reg))} className="hover:text-error transition-colors" title="Kaldır">
                      <span className="material-symbols-outlined text-[14px] block">close</span>
                    </button>
                  </span>
                ))}
                {search && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-primary border border-secondary/25 rounded-lg text-xs font-semibold">
                    “{search}”
                    <button onClick={() => updateSearch('')} className="hover:text-error transition-colors" title="Kaldır">
                      <span className="material-symbols-outlined text-[14px] block">close</span>
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-tertiary hover:underline ml-auto"
                >
                  Tümünü Temizle
                </button>
              </div>
            )}

            {isLoading && filteredProducts.length === 0 ? (
              <div className="bg-surface-container rounded-2xl p-12 text-center border border-secondary/20 text-on-surface-variant">
                Ürünler yükleniyor...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-surface-container rounded-2xl p-12 text-center border border-secondary/20">
                <span className="material-symbols-outlined text-[48px] text-secondary mb-3" data-icon="search_off">search_off</span>
                <h3 className="text-headline-md font-bold text-primary mb-2">Aramanıza Uygun Ürün Bulunamadı</h3>
                <p className="text-body-md text-on-surface-variant max-w-md mx-auto mb-6">
                  Seçtiğiniz filtreleri veya arama terimini değiştirerek tekrar deneyebilirsiniz.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold"
                >
                  Tüm Filtreleri Temizle
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                  const isFavorited = wishlist.includes(product.id);
                  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice;
                  const discountPercent = hasDiscount
                    ? Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)
                    : 0;

                  return (
                    <article
                      key={product.id}
                      className="bg-surface-container-lowest rounded-xl border border-secondary/20 overflow-hidden flex flex-col farmhouse-card group"
                    >
                      <div className="relative aspect-square bg-surface-container overflow-hidden">
                        <Link to={`/products/${product.slug}`} className="block w-full h-full">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={product.name}
                            src={product.mainImageUrl}
                          />
                        </Link>

                        {/* Badges */}
                        {product.badge && (
                          <span className={`absolute top-3 left-3 text-surface font-label-sm text-label-sm px-2.5 py-1 rounded shadow-sm ${product.badge === 'Çok Satan' ? 'bg-tertiary text-on-tertiary' : product.badge === 'Soğuk Zincir' ? 'bg-primary-container flex items-center gap-1' : 'bg-[#536B43]'}`}>
                            {product.badge === 'Soğuk Zincir' && (
                              <span className="material-symbols-outlined text-[12px]" data-icon="ac_unit">ac_unit</span>
                            )}
                            {product.badge}
                          </span>
                        )}

                        {hasDiscount && (
                          <span className="absolute top-3 right-3 bg-surface/90 text-error font-label-sm text-label-sm px-2 py-0.5 rounded border border-error/20 font-bold">
                            %{discountPercent} İndirim
                          </span>
                        )}

                        {/* Favorite button */}
                        <button
                          onClick={e => toggleWishlist(product.id, e)}
                          className="absolute bottom-3 right-3 p-2 bg-surface/90 hover:bg-surface text-on-surface-variant hover:text-tertiary rounded-full shadow-sm transition-colors"
                          title="Favorilere Ekle"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isFavorited ? 'text-tertiary fill' : ''}`} data-icon="favorite">
                            favorite
                          </span>
                        </button>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between text-secondary font-label-sm text-label-sm mb-1">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]" data-icon="location_on">location_on</span>
                            {product.origin || 'Doğal Köy Üretimi'}
                          </span>
                        </div>

                        <Link to={`/products/${product.slug}`}>
                          <h2 className="font-headline-sm text-headline-sm font-bold text-primary group-hover:text-primary-container transition-colors mb-1 line-clamp-2">
                            {product.name}
                          </h2>
                        </Link>

                        <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                          {product.shortDescription}
                        </p>

                        <div className="mt-auto pt-3 border-t border-secondary/15 flex items-center justify-between gap-2">
                          <div>
                            {hasDiscount && (
                              <div className="text-outline line-through text-xs font-label-sm">
                                {money(product.basePrice)}
                              </div>
                            )}
                            <div className="font-headline-sm text-headline-sm font-extrabold text-primary">
                              {money(product.discountPrice ?? product.basePrice)}
                            </div>
                          </div>

                          <button
                            onClick={e => addToCart(product, e)}
                            className="px-3.5 py-2 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center gap-1.5 tactile-depress transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]" data-icon="add_shopping_cart">add_shopping_cart</span>
                            <span>Sepete Ekle</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {filteredProducts.map(product => {
                  const isFavorited = wishlist.includes(product.id);
                  const hasDiscount = product.discountPrice != null && product.discountPrice < product.basePrice;

                  return (
                    <article
                      key={product.id}
                      className="bg-surface-container-lowest rounded-xl border border-secondary/20 overflow-hidden flex flex-col sm:flex-row farmhouse-card group"
                    >
                      <div className="relative w-full sm:w-56 h-56 bg-surface-container overflow-hidden flex-shrink-0">
                        <Link to={`/products/${product.slug}`} className="block w-full h-full">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={product.name}
                            src={product.mainImageUrl}
                          />
                        </Link>
                        {product.badge && (
                          <span className="absolute top-3 left-3 bg-tertiary text-on-tertiary font-label-sm text-label-sm px-2.5 py-1 rounded shadow-sm">
                            {product.badge}
                          </span>
                        )}
                        <button
                          onClick={e => toggleWishlist(product.id, e)}
                          className="absolute bottom-3 right-3 p-2 bg-surface/90 hover:bg-surface text-on-surface-variant hover:text-tertiary rounded-full shadow-sm transition-colors"
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isFavorited ? 'text-tertiary fill' : ''}`} data-icon="favorite">favorite</span>
                        </button>
                      </div>

                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div>
                          <div className="flex items-center justify-between text-secondary font-label-sm text-label-sm mb-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]" data-icon="location_on">location_on</span>
                              {product.origin || 'Doğal Köy Üretimi'}
                            </span>
                          </div>
                          <Link to={`/products/${product.slug}`}>
                            <h2 className="font-headline-sm text-headline-sm font-bold text-primary group-hover:text-primary-container transition-colors mb-2">
                              {product.name}
                            </h2>
                          </Link>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
                            {product.shortDescription}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-secondary/15 flex items-center justify-between gap-4">
                          <div>
                            {hasDiscount && (
                              <div className="text-outline line-through text-xs font-label-sm">
                                {money(product.basePrice)}
                              </div>
                            )}
                            <div className="font-headline-sm text-headline-sm font-extrabold text-primary">
                              {money(product.discountPrice ?? product.basePrice)}
                            </div>
                          </div>

                          <button
                            onClick={e => addToCart(product, e)}
                            className="px-5 py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center gap-2 tactile-depress transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[20px]" data-icon="add_shopping_cart">add_shopping_cart</span>
                            <span>Sepete Ekle</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {displayTotalCount > 0 && (() => {
              const totalPages = Math.max(1, Math.ceil(displayTotalCount / pageSize));
              return (
                <div className="mt-10 pt-6 border-t border-secondary/20 flex flex-col items-center justify-center gap-3">
                  <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 rounded-xl border border-secondary/20 bg-surface-container-low px-4 py-2.5 shadow-sm">
                    <span className="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                      Sayfa <strong className="text-primary font-bold">{page}</strong> / {totalPages} ({filteredProducts.length} / {displayTotalCount} Ürün)
                    </span>
                    <span className="hidden sm:inline-block h-5 w-px bg-secondary/20" aria-hidden="true" />
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <button
                        type="button"
                        disabled={page === 1}
                        onClick={() => { setPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                        className="px-3 py-1.5 rounded-lg border border-secondary/20 bg-white text-on-surface-variant font-label-md text-label-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-high transition-colors"
                      >
                        Önceki
                      </button>
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setPage(p); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                          className={`w-9 h-9 rounded-lg font-label-md text-label-md font-bold transition-colors ${p === page ? 'bg-primary text-on-primary shadow-sm' : 'border border-secondary/20 bg-white text-on-surface hover:bg-surface-container-high'}`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => { setPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                        className="px-3 py-1.5 rounded-lg border border-secondary/20 bg-white text-on-surface hover:bg-surface-container-high font-label-md text-label-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Sonraki
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>
        </div>

        {/* Bottom Trust & Delivery Guarantee Banner */}
        <div className="mt-16 bg-surface-container border border-secondary/20 rounded-2xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[26px]" data-icon="local_shipping">local_shipping</span>
            </div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-1">750 TL Üzeri Ücretsiz Kargo</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Tüm Türkiye'ye hızlı ve özenli teslimat imkanı.</p>
          </div>
          <div className="flex flex-col items-center border-y md:border-y-0 md:border-x border-secondary/20 py-4 md:py-0 md:px-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[26px]" data-icon="ac_unit">ac_unit</span>
            </div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-1">Isı Yalıtımlı Soğuk Zincir</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Buz aküleri ve özel koruyucu ambalajlarla tazelik garantisi.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[26px]" data-icon="verified_user">verified_user</span>
            </div>
            <h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-1">Koşulsuz Tazelik Garantisi</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Memnun kalmadığınız her üründe anında iade ve telafi.</p>
          </div>
        </div>
      </main>

      {/* Shared Footer */}
      <footer className="bg-primary w-full mt-auto border-t border-primary-container text-on-primary">
        <div className="w-full px-6 lg:px-12 max-w-[1320px] mx-auto py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-primary-container">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-4">
              <Link to="/" className="text-headline-lg font-headline-lg font-extrabold text-on-primary tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-secondary-fixed" data-icon="eco">eco</span>
                Köyden Sofraya
              </Link>
              <p className="text-surface-container-high font-body-sm text-body-sm max-w-sm leading-relaxed">
                Anadolu'nun bereketli topraklarından, geleneksel yöntemlerle üretilen en temiz ve katkısız gıdaları aracısız olarak sofranızla buluşturuyoruz.
              </p>
              <div className="pt-2">
                <div className="font-label-md text-label-md font-bold mb-2 text-surface">E-Bültene Kaydolun</div>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    setToastMessage('Bülten aboneliğiniz alındı, teşekkür ederiz!');
                  }}
                  className="flex max-w-sm"
                >
                  <input
                    className="flex-1 px-3 py-2 bg-primary-container border border-on-primary-container/30 rounded-l-lg text-surface placeholder:text-surface/50 font-body-sm text-body-sm focus:outline-none"
                    placeholder="E-posta adresiniz..."
                    type="email"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-secondary-fixed hover:bg-secondary-fixed-dim text-on-secondary-fixed font-label-md text-label-md font-bold rounded-r-lg transition-colors"
                  >
                    Abone Ol
                  </button>
                </form>
              </div>
            </div>

            {/* Links Column 1 */}
            <div className="space-y-3">
              <h5 className="text-headline-sm font-headline-sm font-bold text-surface">Ürünlerimiz</h5>
              <ul className="space-y-2 font-label-md text-label-md">
                <li><button onClick={() => { updateCategory('kahvaltiliklar'); window.scrollTo({ top: 200, behavior: 'smooth' }); }} className="text-surface-container-high hover:text-on-primary transition-colors">Köy Kahvaltılıkları</button></li>
                <li><button onClick={() => { updateCategory('zeytinyaglari'); window.scrollTo({ top: 200, behavior: 'smooth' }); }} className="text-surface-container-high hover:text-on-primary transition-colors">Zeytinyağları</button></li>
                <li><button onClick={() => { updateCategory('salca-ve-soslar'); window.scrollTo({ top: 200, behavior: 'smooth' }); }} className="text-surface-container-high hover:text-on-primary transition-colors">Salça &amp; Soslar</button></li>
                <li><button onClick={() => { updateCategory('bal-ve-receller'); window.scrollTo({ top: 200, behavior: 'smooth' }); }} className="text-surface-container-high hover:text-on-primary transition-colors">Bal &amp; Reçel</button></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div className="space-y-3">
              <h5 className="text-headline-sm font-headline-sm font-bold text-surface">Kurumsal</h5>
              <ul className="space-y-2 font-label-md text-label-md">
                <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">Hikâyemiz &amp; Hakkımızda</Link></li>
                <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/products">Kargo ve Teslimat</Link></li>
                <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">Üretici Kooperatiflerimiz</Link></li>
              </ul>
            </div>

            {/* Links Column 3 */}
            <div className="space-y-3">
              <h5 className="text-headline-sm font-headline-sm font-bold text-surface">Müşteri İlişkileri</h5>
              <ul className="space-y-2 font-label-md text-label-md">
                <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/hikayemiz">İade &amp; Tazelik Garantisi</Link></li>
                <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/giris">Üye Girişi / Kayıt</Link></li>
                <li><Link className="text-surface-container-high hover:text-on-primary transition-colors" to="/cart">Sepetim</Link></li>
              </ul>
            </div>
          </div>

          {/* Copyright & Payment Bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm text-surface-container-high/80">
            <div>
              © 2025 Köyden Sofraya Doğal Gıda A.Ş. Tüm hakları saklıdır. Anadolu'nun bereketli topraklarından sofranıza.
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-surface/10 rounded font-label-sm text-label-sm font-bold tracking-wider text-surface">TROY</span>
              <span className="px-2 py-1 bg-surface/10 rounded font-label-sm text-label-sm font-bold tracking-wider text-surface">VISA</span>
              <span className="px-2 py-1 bg-surface/10 rounded font-label-sm text-label-sm font-bold tracking-wider text-surface">MASTERCARD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
