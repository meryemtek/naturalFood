import React, { useState, useEffect, useCallback, useId } from 'react';
import { theme } from '../../theme/tokens';
import { Modal } from '../../components/common/Modal';
import {
  productService,
  ProductDto,
  CreateProductData,
  UpdateProductData,
} from '../../services/productService';

// Hazır Doğal Gıda Görselleri Galerisi (Admin tek tıkla seçebilsin)
export const PRESET_PRODUCT_IMAGES = [
  { label: 'Zeytinyağı (Ayvalık / Soğuk Sıkım)', url: '/images/products/product-zeytinyagi.jpg' },
  { label: 'Köy Domates & Biber Salçası', url: '/images/products/product-salca.jpg' },
  { label: 'Kars Eski Kaşarı', url: '/images/products/product-kasar.jpg' },
  { label: 'Doğu Anadolu Karakovan Çiçek Balı', url: '/images/products/product-cam-bali.jpg' },
  { label: 'Geleneksel Yayık Tereyağı', url: '/images/products/product-tereyagi.jpg' },
  { label: 'El Kesmesi Köy Eriştesi', url: '/images/products/product-eriste.jpg' },
  { label: 'Antakya Halhalı Taş Kırma Yeşil Zeytin', url: '/images/products/halhali-zeytin.jpg' },
  { label: 'Doğal Gemlik Sele Zeytin', url: '/images/products/sele-zeytin.jpg' },
  { label: 'Manda Kaymağı', url: '/images/products/manda-kaymagi.jpg' },
  { label: 'Taş Değirmen Siyez Unu', url: '/images/products/prod-siyez-unu.jpg' },
  { label: 'Ev Yapımı Köy Tarhanası', url: '/images/products/prod-tarhana.jpg' },
  { label: 'İspir Kuru Fasulye', url: '/images/products/prod-kuru-fasulye.jpg' },
  { label: 'Toroslar Karakovan Petek Bal', url: '/images/products/prod-petek-bal.jpg' },
  { label: 'Güneşte Kurutulmuş Odun Ateşinde Salça', url: '/images/products/biber-salcasi.jpg' },
  { label: 'Antakya Katkısız Nar Ekşisi (%100)', url: '/images/products/nar-eksisi.jpg' },
  { label: 'İç Ceviz & Kuruyemiş', url: '/images/products/ceviz.jpg' },
];

// Popüler Yöresel Köken Presetleri
export const PRESET_ORIGINS = [
  'Kars & Erzurum Yaylaları',
  'Karadeniz (Trabzon/Tonya)',
  'Ege & Kaz Dağları',
  'Hatay / Antakya',
  'Gaziantep & Nizip',
  'Malatya & Elazığ',
  'Aydın & Germencik',
  'Çanakkale (Ezine / Bayramiç)',
  'Rize & Fırtına Vadisi',
];

// Popüler Doğal Gıda Kategorileri
export const PRODUCT_CATEGORIES = [
  'Köy Kahvaltılıkları',
  'Zeytinyağları',
  'Salça & Soslar',
  'Bal & Reçel',
  'Kuru Gıdalar & Bakliyat',
  'Kuruyemiş & Kuru Meyve',
  'Süt & Şarküteri',
];

interface ProductFormData {
  name: string;
  category: string;
  sku: string;
  barcode: string;
  saleUnit: string;
  basePrice: string | number;
  sellingPrice: string | number;
  discountPrice: string | number;
  stockQuantity: string | number;
  status: string;
  imageUrl: string;
  origin: string;
  shortDescription: string;
  description: string;
  isBestSeller: boolean;
  isNew: boolean;
  isFeatured: boolean;
  isSeasonal: boolean;
}

export const ProductDefinitionPage: React.FC = () => {
  const uploadInputId = useId();

  // Filtreler & Arama
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBadge, setFilterBadge] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Veri & Yükleme
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canlı Önizlemesi Yapılan Ürün (Müşteri Vitrini Görünümü)
  const [selectedPreviewProduct, setSelectedPreviewProduct] = useState<ProductDto | null>(null);

  // Modallar
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const initialFormData: ProductFormData = {
    name: '',
    category: 'Köy Kahvaltılıkları',
    sku: '',
    barcode: '',
    saleUnit: 'Kg',
    basePrice: '',
    sellingPrice: '',
    discountPrice: '',
    stockQuantity: '100',
    status: 'Active',
    imageUrl: '/images/products/product-zeytinyagi.jpg',
    origin: 'Ege & Kaz Dağları',
    shortDescription: '',
    description: '',
    isBestSeller: false,
    isNew: true,
    isFeatured: false,
    isSeasonal: false,
  };

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Ürünleri Backend'den Çek
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await productService.getProducts({
        search: searchTerm.trim() || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        pageSize: 100,
      });
      setProducts(res.items);
      setTotalCount(res.totalCount);

      // Seçili önizleme ürününü güncelle veya ilk ürüne ayarla
      if (res.items.length > 0) {
        setSelectedPreviewProduct((prev) => {
          if (!prev) return res.items[0];
          const found = res.items.find((p) => p.id === prev.id);
          return found || res.items[0];
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Ürünler yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Yeni Ürün Modalını Aç
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      ...initialFormData,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
    });
    setIsAddModalOpen(true);
  };

  // Düzenleme Modalını Aç
  const handleOpenEditModal = (p: ProductDto) => {
    setEditingProduct(p);
    setSelectedPreviewProduct(p);

    const normalPrice = p.basePrice || p.sellingPrice || '';
    const discountPrice = p.discountPrice && p.discountPrice < (p.basePrice || p.sellingPrice)
      ? p.discountPrice
      : '';

    setFormData({
      name: p.name || '',
      category: p.category || 'Köy Kahvaltılıkları',
      sku: p.sku || '',
      barcode: p.barcode || '',
      saleUnit: p.saleUnit || 'Kg',
      basePrice: normalPrice,
      sellingPrice: normalPrice,
      discountPrice: discountPrice,
      stockQuantity: p.stockQuantity ?? 100,
      status: p.status || 'Active',
      imageUrl: p.imageUrl || '/images/products/product-zeytinyagi.jpg',
      origin: p.origin || 'Ege & Kaz Dağları',
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      isBestSeller: !!p.isBestSeller,
      isNew: !!p.isNew,
      isFeatured: !!p.isFeatured,
      isSeasonal: !!p.isSeasonal,
    });
    setIsAddModalOpen(true);
  };

  // Bilgisayardan Fotoğraf Yükleme
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await productService.uploadProductImage(file);
      setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl }));
      showToast('Görsel başarıyla yüklendi.');
    } catch (err: any) {
      showToast(err?.message || 'Görsel yüklenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  // Hızlı Durum Açma / Kapama (Aktif <-> Pasif)
  const handleToggleStatus = async (p: ProductDto) => {
    const nextIsActive = p.status !== 'Active';
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, status: nextIsActive ? 'Active' : 'OutOfStock' }
            : item
        )
      );
      if (selectedPreviewProduct?.id === p.id) {
        setSelectedPreviewProduct((prev) =>
          prev ? { ...prev, status: nextIsActive ? 'Active' : 'OutOfStock' } : null
        );
      }

      await productService.toggleProductStatus(p.id, nextIsActive);
      showToast(`${p.name} ${nextIsActive ? 'satışa açıldı' : 'satıştan kaldırıldı (pasif)'}.`);
    } catch (err: any) {
      showToast(err?.message || 'Durum güncellenirken bir hata oluştu.');
      fetchProducts();
    }
  };

  // Form Kaydet (Create veya Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Lütfen ürün adını giriniz.');
      return;
    }

    const basePriceNum = parseFloat(String(formData.basePrice || formData.sellingPrice)) || 0;
    const discountPriceNum = formData.discountPrice ? parseFloat(String(formData.discountPrice)) : null;

    if (basePriceNum <= 0) {
      showToast('Lütfen geçerli bir satış fiyatı giriniz.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingProduct) {
        const updatePayload: UpdateProductData = {
          name: formData.name.trim(),
          category: formData.category,
          saleUnit: formData.saleUnit,
          sellingPrice: basePriceNum,
          basePrice: basePriceNum,
          discountPrice: discountPriceNum && discountPriceNum > 0 ? discountPriceNum : null,
          stockQuantity: parseInt(String(formData.stockQuantity), 10) || 0,
          sku: formData.sku.trim() || null,
          barcode: formData.barcode.trim() || null,
          status: formData.status,
          imageUrl: formData.imageUrl.trim() || null,
          origin: formData.origin.trim() || null,
          shortDescription: formData.shortDescription.trim() || null,
          description: formData.description.trim() || null,
          isBestSeller: formData.isBestSeller,
          isNew: formData.isNew,
          isFeatured: formData.isFeatured,
          isSeasonal: formData.isSeasonal,
        };

        const updated = await productService.updateProduct(editingProduct.id, updatePayload);
        showToast('Ürün bilgileri, vitrin fotoğrafı ve etiketleri güncellendi.');
        setSelectedPreviewProduct(updated);
      } else {
        const createPayload: CreateProductData = {
          name: formData.name.trim(),
          category: formData.category,
          saleUnit: formData.saleUnit,
          sellingPrice: basePriceNum,
          basePrice: basePriceNum,
          discountPrice: discountPriceNum && discountPriceNum > 0 ? discountPriceNum : null,
          stockQuantity: parseInt(String(formData.stockQuantity), 10) || 0,
          sku: formData.sku.trim() || null,
          barcode: formData.barcode.trim() || null,
          status: formData.status,
          imageUrl: formData.imageUrl.trim() || null,
          origin: formData.origin.trim() || null,
          shortDescription: formData.shortDescription.trim() || null,
          description: formData.description.trim() || null,
          isBestSeller: formData.isBestSeller,
          isNew: formData.isNew,
          isFeatured: formData.isFeatured,
          isSeasonal: formData.isSeasonal,
        };

        const created = await productService.createProduct(createPayload);
        showToast('Yeni ürün vitrine başarıyla eklendi.');
        setSelectedPreviewProduct(created);
      }

      setIsAddModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err?.message || 'İşlem sırasında bir hata meydana geldi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ürün Silme
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsSubmitting(true);
      await productService.deleteProduct(deletingProduct.id);
      showToast(`${deletingProduct.name} başarıyla silindi.`);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast(err?.message || 'Ürün silinirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtreleme mantığı
  const filteredProducts = products.filter((p) => {
    if (filterStatus === 'active' && p.status !== 'Active') return false;
    if (filterStatus === 'inactive' && p.status === 'Active') return false;
    if (filterBadge === 'bestseller' && !p.isBestSeller) return false;
    if (filterBadge === 'new' && !p.isNew) return false;
    if (filterBadge === 'discount' && !(p.discountPrice && p.discountPrice < (p.basePrice || p.sellingPrice))) return false;
    if (filterBadge === 'seasonal' && !p.isSeasonal) return false;
    return true;
  });

  // Metrikler
  const totalProductsCount = products.length;
  const activeProductsCount = products.filter((p) => p.status === 'Active').length;
  const discountedProductsCount = products.filter((p) => p.discountPrice && p.discountPrice < (p.basePrice || p.sellingPrice)).length;
  const badgedProductsCount = products.filter((p) => p.isBestSeller || p.isNew || p.isSeasonal || p.isFeatured).length;

  // İndirim oranı hesaplama yardımcısı
  const calculateDiscountPercent = (base: number, discount?: number | null) => {
    if (!discount || discount >= base || base <= 0) return 0;
    return Math.round(((base - discount) / base) * 100);
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: theme.colors.bgCanvas, minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Toast Bildirimi */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            backgroundColor: theme.colors.espresso,
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: theme.radii.md,
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: theme.colors.taupe, marginBottom: '6px' }}>
          <span>Ürün ve Menü Yönetimi</span>
          <span>/</span>
          <span style={{ color: theme.colors.primary, fontWeight: 600 }}>Ürün Kataloğu & Görsel Yönetimi</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme.colors.espresso, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              Ürün Kataloğu & Vitrin Yönetimi
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: theme.colors.taupe, maxWidth: '720px', lineHeight: 1.5 }}>
              Doğal gıda ürünlerinin vitrin fotoğraflarını, yöre/köken bilgilerini, indirim ve vitrin etiketlerini (Çok Satan, Yeni Mahsul, İndirim, Mevsimlik), açıklamalarını ve fiyatlarını tek ekrandan yönetin.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={fetchProducts}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                backgroundColor: theme.colors.bgCard,
                color: theme.colors.espresso,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii.md,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⟳ Yenile
            </button>
            <button
              onClick={handleOpenCreateModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                border: 'none',
                borderRadius: theme.radii.md,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(45, 90, 39, 0.25)',
              }}
            >
              + Yeni Ürün Ekle
            </button>
          </div>
        </div>
      </div>

      {/* KPI İstatistik Kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: theme.colors.bgCard, padding: '16px 20px', borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.taupe, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Toplam Ürün</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: theme.colors.espresso, marginTop: '6px' }}>{totalProductsCount}</div>
          <div style={{ fontSize: '12px', color: theme.colors.stoneMuted, marginTop: '4px' }}>Katalogdaki kayıtlı çeşit</div>
        </div>

        <div style={{ backgroundColor: theme.colors.bgCard, padding: '16px 20px', borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.statusSuccess, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aktif Satışta</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: theme.colors.statusSuccess, marginTop: '6px' }}>{activeProductsCount}</div>
          <div style={{ fontSize: '12px', color: theme.colors.stoneMuted, marginTop: '4px' }}>Müşteriye açık ürünler</div>
        </div>

        <div style={{ backgroundColor: theme.colors.bgCard, padding: '16px 20px', borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.statusDanger, textTransform: 'uppercase', letterSpacing: '0.04em' }}>İndirim & Fırsat</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: theme.colors.statusDanger, marginTop: '6px' }}>{discountedProductsCount}</div>
          <div style={{ fontSize: '12px', color: theme.colors.stoneMuted, marginTop: '4px' }}>% İndirim etiketli ürünler</div>
        </div>

        <div style={{ backgroundColor: theme.colors.bgCard, padding: '16px 20px', borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.statusWarning, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Özel Vitrin Rozetliler</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: theme.colors.statusWarning, marginTop: '6px' }}>{badgedProductsCount}</div>
          <div style={{ fontSize: '12px', color: theme.colors.stoneMuted, marginTop: '4px' }}>Çok Satan / Yeni / Mevsimlik</div>
        </div>
      </div>

      {/* CANLI VİTRİN KARTI ÖNİZLEME (Storefront Canlı Bento Kartı) */}
      {selectedPreviewProduct && (
        <div
          style={{
            backgroundColor: theme.colors.bgSurface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radii.lg,
            padding: '20px 24px',
            marginBottom: '28px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>👁️</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.espresso }}>
                Seçili Ürünün Canlı Mağaza Kartı Görünümü (Müşteri Vitrini)
              </span>
              <span style={{ fontSize: '12px', backgroundColor: theme.colors.primarySubtle, color: theme.colors.primary, padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                Birebir Mağaza Tasarımı
              </span>
            </div>
            <button
              onClick={() => handleOpenEditModal(selectedPreviewProduct)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: theme.colors.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: theme.radii.sm,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ✏️ Bu Ürünün Görsel ve Bilgilerini Düzenle
            </button>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* 1:1 Storefront Product Card Replica */}
            <div
              style={{
                width: '320px',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid rgba(138, 116, 92, 0.2)',
                boxShadow: '0 4px 16px rgba(45, 36, 30, 0.06)',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Görsel ve Rozet Alanı */}
              <div style={{ position: 'relative', height: '220px', backgroundColor: '#F2EFE9', overflow: 'hidden' }}>
                <img
                  src={selectedPreviewProduct.imageUrl || '/images/products/product-zeytinyagi.jpg'}
                  alt={selectedPreviewProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/products/product-zeytinyagi.jpg';
                  }}
                />

                {/* Rozetler (Sol Üst: Çok Satan, Yeni Mahsul, Mevsimlik) */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {selectedPreviewProduct.isBestSeller && (
                    <span
                      style={{
                        backgroundColor: '#4A3B32',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Çok Satan
                    </span>
                  )}
                  {selectedPreviewProduct.isNew && !selectedPreviewProduct.isBestSeller && (
                    <span
                      style={{
                        backgroundColor: '#2D5A27',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Yeni Mahsul
                    </span>
                  )}
                  {selectedPreviewProduct.isSeasonal && (
                    <span
                      style={{
                        backgroundColor: '#8C5E35',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Mevsimlik
                    </span>
                  )}
                </div>

                {/* Sağ Üst: İndirim Rozeti */}
                {selectedPreviewProduct.discountPrice && selectedPreviewProduct.discountPrice < (selectedPreviewProduct.basePrice || selectedPreviewProduct.sellingPrice) && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span
                      style={{
                        backgroundColor: '#F7DCD7',
                        color: '#9B3828',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(155, 56, 40, 0.2)',
                      }}
                    >
                      %{calculateDiscountPercent(selectedPreviewProduct.basePrice || selectedPreviewProduct.sellingPrice, selectedPreviewProduct.discountPrice)} İndirim
                    </span>
                  </div>
                )}

                {/* Kalp / Favori Butonu */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  <span style={{ fontSize: '16px', color: '#6B5E55' }}>♡</span>
                </div>
              </div>

              {/* Kart İçerik Alanı */}
              <div style={{ padding: '16px' }}>
                {/* Yöre / Menşe Bilgisi */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B5E55', marginBottom: '6px' }}>
                  <span>📍</span>
                  <span style={{ fontWeight: 600 }}>{selectedPreviewProduct.origin || 'Doğal Köy Üretimi'}</span>
                </div>

                {/* Başlık */}
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#2D241E',
                    margin: '0 0 6px 0',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={selectedPreviewProduct.name}
                >
                  {selectedPreviewProduct.name}
                </h3>

                {/* Kısa Açıklama */}
                <p
                  style={{
                    fontSize: '12px',
                    color: '#8C827A',
                    margin: '0 0 14px 0',
                    lineHeight: 1.45,
                    height: '34px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {selectedPreviewProduct.shortDescription || 'Anadolu köylerinden geleneksel yöntemlerle katkısız ve taze üretilmiştir.'}
                </p>

                {/* Fiyat ve Sepet Alanı */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '8px', borderTop: '1px solid #F0EEE9' }}>
                  <div>
                    {selectedPreviewProduct.discountPrice && selectedPreviewProduct.discountPrice < (selectedPreviewProduct.basePrice || selectedPreviewProduct.sellingPrice) && (
                      <div style={{ fontSize: '12px', color: '#8C827A', textDecoration: 'line-through', marginBottom: '2px' }}>
                        {(selectedPreviewProduct.basePrice || selectedPreviewProduct.sellingPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                    )}
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#2D5A27' }}>
                      {(selectedPreviewProduct.discountPrice || selectedPreviewProduct.basePrice || selectedPreviewProduct.sellingPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      <span style={{ fontSize: '11px', fontWeight: 500, color: '#8C827A', marginLeft: '4px' }}>/ {selectedPreviewProduct.saleUnit || 'Adet'}</span>
                    </div>
                  </div>

                  <button
                    style={{
                      backgroundColor: '#2D5A27',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'default',
                    }}
                  >
                    <span>+</span>
                    <span>Sepete Ekle</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Önizleme Yan Açıklama & Hızlı Bilgiler */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '8px' }}>
                Vitrin Görünüm Detayları
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: theme.colors.taupe, lineHeight: 1.8 }}>
                <li><strong>Fotoğraf Kaynağı:</strong> <code>{selectedPreviewProduct.imageUrl || 'Varsayılan'}</code></li>
                <li><strong>Yöre / Menşe:</strong> {selectedPreviewProduct.origin || 'Belirtilmedi'}</li>
                <li><strong>Kategori:</strong> {selectedPreviewProduct.category || 'Genel'}</li>
                <li><strong>Satış Durumu:</strong> {selectedPreviewProduct.status === 'Active' ? '✅ Satışta & Aktif' : '❌ Satışa Kapalı'}</li>
                <li><strong>Vitrin Rozetleri:</strong> {[
                  selectedPreviewProduct.isBestSeller ? 'Çok Satan' : null,
                  selectedPreviewProduct.isNew ? 'Yeni Mahsul' : null,
                  selectedPreviewProduct.isSeasonal ? 'Mevsimlik' : null,
                  selectedPreviewProduct.isFeatured ? 'Öne Çıkan' : null,
                  selectedPreviewProduct.discountPrice && selectedPreviewProduct.discountPrice < (selectedPreviewProduct.basePrice || selectedPreviewProduct.sellingPrice) ? '% İndirim' : null,
                ].filter(Boolean).join(', ') || 'Standart'}</li>
                <li><strong>Stok Adedi:</strong> {selectedPreviewProduct.stockQuantity} {selectedPreviewProduct.saleUnit}</li>
              </ul>

              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleToggleStatus(selectedPreviewProduct)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: theme.radii.sm,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.bgCard,
                    color: selectedPreviewProduct.status === 'Active' ? theme.colors.statusDanger : theme.colors.statusSuccess,
                    cursor: 'pointer',
                  }}
                >
                  {selectedPreviewProduct.status === 'Active' ? '⏸️ Ürünü Satıştan Kaldır' : '▶️ Ürünü Satışa Aç'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arama & Filtre Çubuğu */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          padding: '16px 20px',
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1, minWidth: '320px' }}>
          {/* Arama Kutusu */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Ürün adı, barkod, SKU veya yöre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii.sm,
                fontSize: '13px',
                color: theme.colors.espresso,
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: theme.colors.bgCanvas,
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: theme.colors.stoneMuted, fontSize: '14px' }}>
              🔍
            </span>
          </div>

          {/* Kategori Filtresi */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '9px 12px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.sm,
              fontSize: '13px',
              color: theme.colors.espresso,
              backgroundColor: theme.colors.bgCard,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tüm Kategoriler</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Rozet Filtresi */}
          <select
            value={filterBadge}
            onChange={(e) => setFilterBadge(e.target.value)}
            style={{
              padding: '9px 12px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.sm,
              fontSize: '13px',
              color: theme.colors.espresso,
              backgroundColor: theme.colors.bgCard,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tüm Vitrin Rozetleri</option>
            <option value="bestseller">⭐ Çok Satanlar</option>
            <option value="new">🌱 Yeni Mahsuller</option>
            <option value="discount">🏷️ İndirimli Ürünler</option>
            <option value="seasonal">🍂 Mevsimlik Ürünler</option>
          </select>

          {/* Satış Durumu Filtresi */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '9px 12px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radii.sm,
              fontSize: '13px',
              color: theme.colors.espresso,
              backgroundColor: theme.colors.bgCard,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif Satışta</option>
            <option value="inactive">Pasif / Satışa Kapalı</option>
          </select>
        </div>

        <div style={{ fontSize: '13px', color: theme.colors.taupe, fontWeight: 500 }}>
          {filteredProducts.length} ürün listeleniyor
        </div>
      </div>

      {/* Ürün Listesi Tablosu */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radii.lg,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.colors.taupe }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
            <div>Ürün kataloğu yükleniyor...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: theme.colors.statusDanger }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>⚠️ Hata</div>
            <div>{error}</div>
            <button
              onClick={fetchProducts}
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                backgroundColor: theme.colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: theme.radii.sm,
                cursor: 'pointer',
              }}
            >
              Tekrar Dene
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: theme.colors.taupe }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌾</div>
            <div style={{ fontWeight: 600, fontSize: '15px', color: theme.colors.espresso }}>Aramanızla eşleşen ürün bulunamadı.</div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>Filtreleri temizleyebilir veya yeni ürün ekleyebilirsiniz.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, width: '64px' }}>Görsel</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Ürün Bilgisi & SKU</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Kategori</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Yöre / Menşe</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Vitrin Rozetleri</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fiyatlandırma</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Stok</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Durum</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isDiscounted = p.discountPrice && p.discountPrice < (p.basePrice || p.sellingPrice);
                  const isSelected = selectedPreviewProduct?.id === p.id;

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                        backgroundColor: isSelected ? theme.colors.primarySubtle : '#FFFFFF',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Küçük Resim (Thumbnail) */}
                      <td style={{ padding: '10px 16px' }}>
                        <div
                          onClick={() => setSelectedPreviewProduct(p)}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#F2EFE9',
                            border: `1px solid ${theme.colors.border}`,
                            cursor: 'pointer',
                          }}
                          title="Vitrin önizlemesini görüntüle"
                        >
                          <img
                            src={p.imageUrl || '/images/products/product-zeytinyagi.jpg'}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/products/product-zeytinyagi.jpg';
                            }}
                          />
                        </div>
                      </td>

                      {/* Ürün Adı & Kod */}
                      <td style={{ padding: '10px 16px' }}>
                        <div
                          onClick={() => setSelectedPreviewProduct(p)}
                          style={{ fontWeight: 600, color: theme.colors.espresso, cursor: 'pointer', fontSize: '13.5px' }}
                          title="Önizlemek için tıklayın"
                        >
                          {p.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px', color: theme.colors.stoneMuted, marginTop: '2px' }}>
                          <span>SKU: {p.sku || '-'}</span>
                          {p.barcode && <span>• Barkod: {p.barcode}</span>}
                        </div>
                        {p.shortDescription && (
                          <div style={{ fontSize: '11px', color: theme.colors.taupe, marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.shortDescription}
                          </div>
                        )}
                      </td>

                      {/* Kategori */}
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: theme.colors.bgSurface,
                            border: `1px solid ${theme.colors.border}`,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: theme.colors.cedar,
                            fontWeight: 500,
                          }}
                        >
                          {p.category || 'Genel'}
                        </span>
                      </td>

                      {/* Yöre / Menşe */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: theme.colors.cedar, fontWeight: 500 }}>
                          <span style={{ fontSize: '13px' }}>📍</span>
                          <span>{p.origin || 'Köy Üretimi'}</span>
                        </div>
                      </td>

                      {/* Vitrin Rozetleri */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.isBestSeller && (
                            <span style={{ backgroundColor: '#4A3B32', color: '#fff', fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              Çok Satan
                            </span>
                          )}
                          {p.isNew && (
                            <span style={{ backgroundColor: '#2D5A27', color: '#fff', fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              Yeni Mahsul
                            </span>
                          )}
                          {p.isSeasonal && (
                            <span style={{ backgroundColor: '#8C5E35', color: '#fff', fontSize: '10.5px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                              Mevsimlik
                            </span>
                          )}
                          {isDiscounted && (
                            <span style={{ backgroundColor: '#FDF2F0', color: '#9B3828', fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(155,56,40,0.2)' }}>
                              %{calculateDiscountPercent(p.basePrice || p.sellingPrice, p.discountPrice)} İndirim
                            </span>
                          )}
                          {!p.isBestSeller && !p.isNew && !p.isSeasonal && !isDiscounted && (
                            <span style={{ color: theme.colors.stoneMuted, fontSize: '11px' }}>-</span>
                          )}
                        </div>
                      </td>

                      {/* Fiyat */}
                      <td style={{ padding: '10px 16px' }}>
                        {isDiscounted ? (
                          <div>
                            <span style={{ fontSize: '11px', color: theme.colors.stoneMuted, textDecoration: 'line-through', marginRight: '6px' }}>
                              {(p.basePrice || p.sellingPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                            <span style={{ fontWeight: 700, color: theme.colors.statusDanger, fontSize: '13.5px' }}>
                              {p.discountPrice!.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontWeight: 600, color: theme.colors.espresso }}>
                            {(p.basePrice || p.sellingPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                          </div>
                        )}
                        <span style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>/ {p.saleUnit || 'Adet'}</span>
                      </td>

                      {/* Stok */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontWeight: 500, color: p.stockQuantity <= 5 ? theme.colors.statusDanger : theme.colors.espresso }}>
                          {p.stockQuantity} {p.saleUnit || 'Adet'}
                        </span>
                      </td>

                      {/* Durum (Aktif / Pasif Toggle) */}
                      <td style={{ padding: '10px 16px' }}>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: p.status === 'Active' ? theme.colors.statusSuccessBg : theme.colors.statusDangerBg,
                            color: p.status === 'Active' ? theme.colors.statusSuccess : theme.colors.statusDanger,
                          }}
                          title="Durumu değiştirmek için tıklayın"
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                          {p.status === 'Active' ? 'Satışta' : 'Kapalı'}
                        </button>
                      </td>

                      {/* İşlemler */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedPreviewProduct(p)}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: theme.colors.bgSurface,
                              border: `1px solid ${theme.colors.border}`,
                              borderRadius: theme.radii.xs,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                            title="Canlı Önizle"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            style={{
                              padding: '5px 10px',
                              backgroundColor: theme.colors.primary,
                              color: '#fff',
                              border: 'none',
                              borderRadius: theme.radii.xs,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Ürünü Düzenle"
                          >
                            ✏️ Düzenle
                          </button>
                          <button
                            onClick={() => setDeletingProduct(p)}
                            style={{
                              padding: '5px 8px',
                              backgroundColor: theme.colors.statusDangerBg,
                              color: theme.colors.statusDanger,
                              border: `1px solid rgba(155, 56, 40, 0.2)`,
                              borderRadius: theme.radii.xs,
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                            title="Ürünü Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ÜRÜN EKLE / DÜZENLE MODALI (TÜM GÖRSEL, YÖRE, ROZET ALANLARI) */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            if (!isSubmitting) setIsAddModalOpen(false);
          }}
          title={editingProduct ? `Ürünü Düzenle: ${editingProduct.name}` : 'Yeni Doğal Gıda Ürünü Ekle'}
          maxWidth="840px"
        >
          <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* BÖLÜM 1: GÖRSEL & MEDYA YÖNETİMİ */}
            <div
              style={{
                backgroundColor: theme.colors.bgSurface,
                padding: '16px',
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '12px' }}>
                <span>🖼️</span>
                <span>Vitrin Fotoğrafı & Medya Yönetimi</span>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Seçili Görsel Önizleme Kutusu */}
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: theme.radii.md,
                    border: `1px solid ${theme.colors.border}`,
                    overflow: 'hidden',
                    backgroundColor: '#EFECE6',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  <img
                    src={formData.imageUrl || '/images/products/product-zeytinyagi.jpg'}
                    alt="Önizleme"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/products/product-zeytinyagi.jpg';
                    }}
                  />
                  {isUploading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      Yükleniyor...
                    </div>
                  )}
                </div>

                {/* Yükleme Butonu & Doğrudan URL Girişi */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <label
                      htmlFor={uploadInputId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: theme.colors.primary,
                        color: '#FFFFFF',
                        borderRadius: theme.radii.sm,
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: isUploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span>📁</span>
                      <span>{isUploading ? 'Yükleniyor...' : 'Bilgisayardan Fotoğraf Yükle'}</span>
                    </label>
                    <input
                      id={uploadInputId}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '12px', color: theme.colors.stoneMuted }}>JPG, PNG veya WebP</span>
                  </div>

                  {/* Doğrudan URL */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: theme.colors.taupe, marginBottom: '4px', fontWeight: 500 }}>
                      Görsel Bağlantısı (URL veya Yerel Yol):
                    </label>
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="/images/products/product-zeytinyagi.jpg veya https://..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.sm,
                        fontSize: '12.5px',
                        color: theme.colors.espresso,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Hazır Doğal Gıda Görselleri (Tek tıkla seç) */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${theme.colors.border}` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.cedar, marginBottom: '8px' }}>
                  🎨 Hazır Doğal Gıda Galerisinden Hızlı Seç:
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {PRESET_PRODUCT_IMAGES.map((preset) => {
                    const isPicked = formData.imageUrl === preset.url;
                    return (
                      <button
                        type="button"
                        key={preset.url}
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: theme.radii.sm,
                          border: `1px solid ${isPicked ? theme.colors.primary : theme.colors.border}`,
                          backgroundColor: isPicked ? theme.colors.primarySubtle : '#FFFFFF',
                          cursor: 'pointer',
                          flexShrink: 0,
                          fontSize: '11.5px',
                          fontWeight: isPicked ? 700 : 500,
                          color: isPicked ? theme.colors.primary : theme.colors.espresso,
                        }}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                        />
                        <span>{preset.label.split('(')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BÖLÜM 2: TEMEL BİLGİLER & YÖRE (KÖKEN) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Güneşte Kurutulmuş Odun Ateşinde Köy Domates Salçası"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.sm,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
                  Kategori *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.sm,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>
                  Satış Birimi
                </label>
                <select
                  value={formData.saleUnit}
                  onChange={(e) => setFormData({ ...formData, saleUnit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.sm,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Litre">Litre (Şişe/Teneke)</option>
                  <option value="Kavanoz">Kavanoz</option>
                  <option value="Paket">Paket</option>
                  <option value="Adet">Adet</option>
                  <option value="Gram">Gram (500g, 250g)</option>
                </select>
              </div>
            </div>

            {/* YÖRE & KÖKEN ALANI (Önemli: Müşteri Kartında 📍 ikonu ile çıkar) */}
            <div
              style={{
                backgroundColor: theme.colors.bgSurface,
                padding: '14px',
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '6px' }}>
                📍 Yöre / Menşe Kökeni (Vitrin Kartında Gösterilir)
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Örn: Kars & Erzurum Yaylaları, Ege & Kaz Dağları, Hatay / Antakya..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  marginBottom: '8px',
                }}
              />

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', color: theme.colors.stoneMuted, alignSelf: 'center' }}>Hızlı Seç:</span>
                {PRESET_ORIGINS.map((reg) => (
                  <button
                    type="button"
                    key={reg}
                    onClick={() => setFormData({ ...formData, origin: reg })}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: formData.origin === reg ? 700 : 500,
                      border: `1px solid ${formData.origin === reg ? theme.colors.primary : theme.colors.border}`,
                      backgroundColor: formData.origin === reg ? theme.colors.primarySubtle : '#FFFFFF',
                      color: formData.origin === reg ? theme.colors.primary : theme.colors.cedar,
                      cursor: 'pointer',
                    }}
                  >
                    {reg}
                  </button>
                ))}
              </div>
            </div>

            {/* BÖLÜM 3: AÇIKLAMALAR & VİTRİN METİNLERİ */}
            <div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Vitrin Kısa Açıklaması (Mağaza Kartında Görünen 1-2 Cümle)
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Örn: Ağustos domateslerinden, tepsilerde odun ateşinde pişirilerek güneşte kurutulmuş..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.sm,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Detaylı Ürün Açıklaması (Ürün Detay Sayfası)
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ürünün üretim serüveni, geleneksel işleme yöntemleri ve lezzet notları..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radii.sm,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* BÖLÜM 4: FİYATLANDIRMA & İNDİRİM */}
            <div
              style={{
                backgroundColor: theme.colors.bgSurface,
                padding: '16px',
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '10px' }}>
                💰 Fiyatlandırma & İndirim Kampanyası
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                    Normal Satış Fiyatı (TL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value, sellingPrice: e.target.value })}
                    placeholder="360.00"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.sm,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.statusDanger, marginBottom: '4px' }}>
                    İndirimli Kampanya Fiyatı (TL) (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    placeholder="320.00 (Boşsa indirim uygulanmaz)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${formData.discountPrice ? theme.colors.statusDanger : theme.colors.border}`,
                      borderRadius: theme.radii.sm,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formData.discountPrice && parseFloat(String(formData.discountPrice)) < parseFloat(String(formData.basePrice)) && (
                    <div style={{ fontSize: '11.5px', color: theme.colors.statusDanger, fontWeight: 700, marginTop: '4px' }}>
                      %{calculateDiscountPercent(parseFloat(String(formData.basePrice)), parseFloat(String(formData.discountPrice)))} İndirim Etiketi Uygulanacak!
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                    Stok Miktarı ({formData.saleUnit || 'Adet'})
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    placeholder="100"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.radii.sm,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* BÖLÜM 5: VİTRİN ROZETLERİ & KODLAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '8px' }}>
                  🏷️ Vitrin Rozetleri (Kart Üzerinde Gösterilir)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isBestSeller}
                      onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                    />
                    <span style={{ fontWeight: 600, color: '#4A3B32' }}>⭐ Çok Satan (Best Seller)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    />
                    <span style={{ fontWeight: 600, color: '#2D5A27' }}>🌱 Yeni Mahsul</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isSeasonal}
                      onChange={(e) => setFormData({ ...formData, isSeasonal: e.target.checked })}
                    />
                    <span style={{ fontWeight: 600, color: '#8C5E35' }}>🍂 Mevsimlik Ürün</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    />
                    <span>✨ Anasayfada Öne Çıkar</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.status === 'Active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'Active' : 'OutOfStock' })}
                    />
                    <span>✅ Satışta / Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '8px' }}>
                  📦 Stok Kodu & Barkod
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      placeholder="SKU Kodu (Örn: SKU-SALCA-01)"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.sm,
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="Barkod (Opsiyonel)"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.radii.sm,
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Butonları */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: `1px solid ${theme.colors.border}` }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  padding: '9px 18px',
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.colors.taupe,
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 24px',
                  backgroundColor: theme.colors.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 6px rgba(45, 90, 39, 0.25)',
                }}
              >
                {isSubmitting ? 'Kaydediliyor...' : editingProduct ? 'Değişiklikleri Kaydet' : 'Ürünü Vitrine Ekle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* SİLME ONAY MODALI */}
      {deletingProduct && (
        <Modal
          isOpen={!!deletingProduct}
          onClose={() => {
            if (!isSubmitting) setDeletingProduct(null);
          }}
          title="Ürünü Kalıcı Olarak Sil"
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: theme.colors.espresso, lineHeight: 1.5 }}>
              <strong>{deletingProduct.name}</strong> adlı ürünü vitrinden ve katalogdan kalıcı olarak silmek istediğinizden emin misiniz?
            </p>
            <div style={{ fontSize: '12.5px', color: theme.colors.statusDanger, backgroundColor: theme.colors.statusDangerBg, padding: '10px 14px', borderRadius: theme.radii.sm }}>
              ⚠️ Bu işlem geri alınamaz. Ürüne ait tüm fotoğraflar ve vitrin etiketleri kaldırılacaktır.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme.colors.bgCard,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: theme.colors.taupe,
                  cursor: 'pointer',
                }}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isSubmitting}
                style={{
                  padding: '8px 20px',
                  backgroundColor: theme.colors.statusDanger,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: theme.radii.sm,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
