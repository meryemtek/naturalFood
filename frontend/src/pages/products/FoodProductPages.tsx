import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../../theme/tokens';
import { Modal } from '../../components/common/Modal';
import {
  productService,
  ProductDto,
  CreateProductData,
  UpdateProductData,
  ProductDetailsDto,
  NutritionalValuesDto,
  UpdateProductDetailsData,
} from '../../services/productService';
import {
  lotService,
  ProductLotDto,
  CreateLotData,
  LotSummaryMetricsDto,
} from '../../services/lotService';

// ==========================================
// 1. GELİŞMİŞ ÜRÜN TANIMLAMA SAYFASI
// Backend (.NET 10 Minimal API & PostgreSQL) Bağlantılı
// ==========================================

interface ProductFormData {
  name: string;
  category: string;
  sku: string;
  barcode: string;
  saleUnit: string;
  basePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: string | number;
  status: string;
  imageUrl?: string;
}

export const ProductDefinitionPage: React.FC = () => {
  // Filters & Search
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data & Loading state from Backend API
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Modals
  const [editingProduct, setEditingProduct] = useState<ProductDto | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductDto | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: 'Zeytinyağı & Şarküteri',
    sku: '',
    barcode: '',
    saleUnit: 'Kg',
    basePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    status: 'Active',
    imageUrl: '',
  });

  // Fetch products from .NET 10 API
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await productService.getProducts({
        search: searchTerm.trim() || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        unit: filterUnit !== 'all' ? filterUnit : undefined,
        pageSize: 50,
      });
      setProducts(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error('Ürünler API den yüklenemedi:', err);
      setError(err?.message || 'Ürün listesi sunucudan yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterCategory, filterUnit]);

  // Load on mount and filter change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open Edit Modal
  const openEditModal = (prod: ProductDto) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      sku: prod.sku || '',
      barcode: prod.barcode || '',
      saleUnit: prod.saleUnit,
      basePrice: prod.basePrice,
      sellingPrice: prod.sellingPrice,
      stockQuantity: prod.stockQuantity,
      status: prod.status,
      imageUrl: prod.imageUrl || '',
    });
  };

  // Open Add Modal
  const openAddModal = () => {
    setIsAddModalOpen(true);
    setFormData({
      name: '',
      category: 'Zeytinyağı & Şarküteri',
      sku: `SKU-FOOD-${Math.floor(100 + Math.random() * 900)}`,
      barcode: `8690${Math.floor(100000000 + Math.random() * 900000000)}`,
      saleUnit: 'Kg',
      basePrice: '100',
      sellingPrice: '145',
      stockQuantity: '50',
      status: 'Active',
      imageUrl: '',
    });
  };

  // Handle Edit Save (PUT /api/admin/products/{id})
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const updateData: UpdateProductData = {
        name: formData.name.trim(),
        category: formData.category,
        saleUnit: formData.saleUnit,
        sellingPrice: Number(formData.sellingPrice) || 0,
        basePrice: Number(formData.basePrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        status: formData.status,
        imageUrl: formData.imageUrl?.trim() || null,
      };

      await productService.updateProduct(editingProduct.id, updateData);
      setEditingProduct(null);
      showToast(`✓ "${updateData.name}" bilgileri PostgreSQL veritabanında başarıyla güncellendi.`);
      await fetchProducts();
    } catch (err: any) {
      alert(`Güncelleme hatası: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Save (POST /api/admin/products)
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setIsSubmitting(true);
      const createData: CreateProductData = {
        name: formData.name.trim(),
        category: formData.category,
        saleUnit: formData.saleUnit,
        sellingPrice: Number(formData.sellingPrice) || 0,
        basePrice: Number(formData.basePrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        status: formData.status || 'Active',
        imageUrl: formData.imageUrl?.trim() || null,
      };

      await productService.createProduct(createData);
      setIsAddModalOpen(false);
      showToast(`✓ "${createData.name}" PostgreSQL veritabanına ve kataloğa başarıyla eklendi.`);
      await fetchProducts();
    } catch (err: any) {
      alert(`Ürün ekleme hatası: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete (DELETE /api/admin/products/{id})
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      setIsSubmitting(true);
      await productService.deleteProduct(deletingProduct.id);
      const deletedName = deletingProduct.name;
      setDeletingProduct(null);
      showToast(`✓ "${deletedName}" veritabanından kalıcı olarak silindi.`);
      await fetchProducts();
    } catch (err: any) {
      alert(`Silme hatası: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.statusSuccessBg, color: theme.colors.statusSuccess, border: '1px solid #D1E7DD' }}>
            ● Satışta
          </span>
        );
      case 'LowStock':
        return (
          <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.statusWarningBg, color: theme.colors.statusWarning, border: '1px solid #FFEBAA' }}>
            ▲ Kritik Stok
          </span>
        );
      case 'OutOfStock':
        return (
          <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: theme.radii.xs, backgroundColor: '#FDE8E8', color: '#C53030', border: '1px solid #F8B4B4' }}>
            ✕ Tükendi
          </span>
        );
      case 'Draft':
        return (
          <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.bgSurface, color: theme.colors.taupe, border: `1px solid ${theme.colors.border}` }}>
            ◌ Taslak
          </span>
        );
      default:
        return (
          <span style={{ fontSize: '11.5px', fontWeight: 600, padding: '3px 8px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.bgSurface, color: theme.colors.cedar, border: `1px solid ${theme.colors.border}` }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: theme.colors.bgSurface,
            color: theme.colors.espresso,
            border: `1px solid ${theme.colors.border}`,
            borderLeft: `4px solid ${theme.colors.primary}`,
            borderRadius: theme.radii.sm,
            padding: '12px 20px',
            boxShadow: '0 4px 16px rgba(45, 36, 30, 0.08)',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.stoneMuted,
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
              Gelişmiş Ürün Tanımlama
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: theme.radii.full, backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2E7D32', display: 'inline-block' }}></span>
              PostgreSQL & .NET 10 API Canlı
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
            PostgreSQL <code style={{ backgroundColor: theme.colors.bgSurface, padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>admin.products</code> tablosu üzerinden canlı ürün, fiyat, birim ve stok yönetimi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchProducts()}
            disabled={isLoading}
            style={{
              padding: '10px 16px',
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.cedar,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isLoading ? 'Yenileniyor...' : '↻ Yenile'}
          </button>

          <button
            onClick={openAddModal}
            style={{
              padding: '10px 20px',
              borderRadius: theme.radii.md,
              border: 'none',
              backgroundColor: theme.colors.primary,
              color: theme.colors.textInverse,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
          >
            <span>+</span> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* KPI Stats: Grounded & Artisanal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Toplam Kayıtlı Ürün', val: totalCount.toString(), badge: 'PostgreSQL DB', color: theme.colors.primary },
          { label: 'Kg & Gramaj Satışlı', val: products.filter(p => p.saleUnit === 'Kg' || p.saleUnit === 'Gramaj').length.toString(), badge: 'Tartılı Ürün', color: theme.colors.statusSuccess },
          { label: 'Litre Bazlı Sıvı Grubu', val: products.filter(p => p.saleUnit === 'Litre').length.toString(), badge: 'Hacimsel', color: theme.colors.statusWarning },
          { label: 'Adet / Paket Satışlı', val: products.filter(p => p.saleUnit === 'Adet').length.toString(), badge: 'Paketli', color: theme.colors.taupe },
        ].map((item, i) => (
          <div key={i} style={{ padding: '18px 20px', backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: '12px', color: theme.colors.taupe, fontWeight: 500 }}>{item.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, color: theme.colors.espresso }}>{item.val}</span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: item.color }}>{item.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            placeholder="Ürün adı, barkod veya SKU ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13.5px',
              minWidth: '260px',
              outline: 'none',
            }}
          />

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.bgSurface,
              color: theme.colors.espresso,
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">Tüm Kategoriler</option>
            <option value="Zeytinyağı & Şarküteri">Zeytinyağı & Şarküteri</option>
            <option value="Un & Tahıl Grubu">Un & Tahıl Grubu</option>
            <option value="Süt & Şarküteri">Süt & Şarküteri</option>
            <option value="Kahvaltılık">Kahvaltılık</option>
            <option value="Kuru Yemiş">Kuru Yemiş</option>
            <option value="Taze Meyve-Sebze">Taze Meyve-Sebze</option>
          </select>

          {/* Unit Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'all', label: 'Tüm Birimler' },
              { id: 'Kg', label: 'Kg' },
              { id: 'Gramaj', label: 'Gramaj' },
              { id: 'Litre', label: 'Litre' },
              { id: 'Adet', label: 'Adet' },
            ].map((u) => (
              <button
                key={u.id}
                onClick={() => setFilterUnit(u.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: theme.radii.md,
                  border: filterUnit === u.id ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  backgroundColor: filterUnit === u.id ? theme.colors.primarySubtle : theme.colors.bgSurface,
                  color: filterUnit === u.id ? theme.colors.primary : theme.colors.cedar,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <span style={{ fontSize: '13px', color: theme.colors.taupe }}>
          Toplam <b>{products.length}</b> kayıt listeleniyor
        </span>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: '14px 18px', backgroundColor: '#FDF2F2', border: '1px solid #F8B4B4', borderRadius: theme.radii.md, color: '#9B1C1C', fontSize: '13.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Sunucu Bağlantı Uyarısı:</strong> {error}
          </div>
          <button
            onClick={() => fetchProducts()}
            style={{ padding: '6px 14px', backgroundColor: '#9B1C1C', color: '#FFFFFF', border: 'none', borderRadius: theme.radii.xs, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {/* Data Table */}
      <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: theme.colors.taupe }}>
            <div style={{ display: 'inline-block', width: '28px', height: '28px', border: `3px solid ${theme.colors.border}`, borderTopColor: theme.colors.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '12px', fontSize: '13.5px' }}>PostgreSQL veritabanından ürünler yükleniyor...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: theme.colors.taupe }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '6px' }}>Ürün Bulunamadı</p>
            <p style={{ fontSize: '13px', marginBottom: '16px' }}>Seçili filtrelere uygun ürün kaydı mevcut değil.</p>
            <button
              onClick={openAddModal}
              style={{
                padding: '8px 18px',
                borderRadius: theme.radii.md,
                border: 'none',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textInverse,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + İlk Ürünü Ekle
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: theme.colors.bgSurface, borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th style={{ padding: '14px 20px', verticalAlign: 'middle' }}>Ürün Adı</th>
                <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Kategori</th>
                <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Barkod / SKU</th>
                <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Satış Birimi</th>
                <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Alış / Satış</th>
                <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Stok</th>
                <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Durum</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr
                  key={prod.id}
                  style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}`, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.bgSurface)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: theme.colors.espresso, verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.bgSurface, border: `1px solid ${theme.colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                        🌾
                      </div>
                      <div>
                        <div>{prod.name}</div>
                        <div style={{ fontSize: '11px', color: theme.colors.stoneMuted, fontWeight: 400 }}>
                          ID: {prod.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: theme.colors.taupe, verticalAlign: 'middle' }}>
                    {prod.category}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: theme.colors.espresso }}>{prod.sku || '-'}</div>
                    <div style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>{prod.barcode || '-'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '3px 8px',
                        borderRadius: theme.radii.xs,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        backgroundColor:
                          prod.saleUnit === 'Litre'
                            ? theme.colors.statusWarningBg
                            : prod.saleUnit === 'Kg'
                            ? theme.colors.statusSuccessBg
                            : prod.saleUnit === 'Gramaj'
                            ? '#F5F2EF'
                            : theme.colors.bgSurface,
                        color:
                          prod.saleUnit === 'Litre'
                            ? theme.colors.statusWarning
                            : prod.saleUnit === 'Kg'
                            ? theme.colors.statusSuccess
                            : prod.saleUnit === 'Gramaj'
                            ? theme.colors.cedar
                            : theme.colors.taupe,
                        border: `1px solid ${theme.colors.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {prod.saleUnit}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 600, color: theme.colors.espresso }}>
                      ₺{Number(prod.sellingPrice).toFixed(2)}
                    </div>
                    {prod.basePrice > 0 && (
                      <div style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>
                        Alış: ₺{Number(prod.basePrice).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <div style={{ fontWeight: 600, color: prod.stockQuantity <= 5 ? '#C53030' : theme.colors.espresso }}>
                      {prod.stockQuantity} {prod.saleUnit}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    {renderStatusBadge(prod.status)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(prod)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: theme.radii.sm,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.bgSurface,
                          fontSize: '12px',
                          color: theme.colors.primary,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.primarySubtle;
                          e.currentTarget.style.borderColor = theme.colors.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.bgSurface;
                          e.currentTarget.style.borderColor = theme.colors.border;
                        }}
                      >
                        Düzenle
                      </button>

                      <button
                        onClick={() => setDeletingProduct(prod)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: theme.radii.sm,
                          border: '1px solid #F8B4B4',
                          backgroundColor: '#FFF5F5',
                          fontSize: '12px',
                          color: '#C53030',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#FDE8E8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#FFF5F5';
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* =========================================================================
          MODAL: ÜRÜNÜ DÜZENLE MODALI (PUT /api/admin/products/{id})
          ========================================================================= */}
      {editingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setEditingProduct(null)}
          title={`Ürünü Düzenle — ${editingProduct.name}`}
          maxWidth="600px"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Ürün Adı *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: theme.radii.xs,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Kategori *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Zeytinyağı & Şarküteri">Zeytinyağı & Şarküteri</option>
                  <option value="Un & Tahıl Grubu">Un & Tahıl Grubu</option>
                  <option value="Süt & Şarküteri">Süt & Şarküteri</option>
                  <option value="Kahvaltılık">Kahvaltılık</option>
                  <option value="Kuru Yemiş">Kuru Yemiş</option>
                  <option value="Taze Meyve-Sebze">Taze Meyve-Sebze</option>
                  <option value="Doğal İçecekler & Sirke">Doğal İçecekler & Sirke</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Active">Satışta (Active)</option>
                  <option value="LowStock">Kritik Stok (LowStock)</option>
                  <option value="OutOfStock">Tükendi (OutOfStock)</option>
                  <option value="Draft">Taslak (Draft)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Barkod
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  SKU Kodu
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Satış Birimi *
                </label>
                <select
                  value={formData.saleUnit}
                  onChange={(e) => setFormData({ ...formData, saleUnit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Gramaj">Gramaj (Gram)</option>
                  <option value="Litre">Litre (Hacim)</option>
                  <option value="Adet">Adet / Paket</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Mevcut Stok Miktarı
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Birim Satış Fiyatı (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Birim Alış / Maliyet Fiyatı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                disabled={isSubmitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet (PostgreSQL)'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: YENİ ÜRÜN EKLE MODALI (POST /api/admin/products)
          ========================================================================= */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddModalOpen(false)}
          title="Kataloğa Yeni Gıda Ürünü Ekle"
          maxWidth="600px"
        >
          <form onSubmit={handleSaveAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                Ürün Adı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Organik Çam Balı 850g"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: theme.radii.xs,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Kategori *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Zeytinyağı & Şarküteri">Zeytinyağı & Şarküteri</option>
                  <option value="Un & Tahıl Grubu">Un & Tahıl Grubu</option>
                  <option value="Süt & Şarküteri">Süt & Şarküteri</option>
                  <option value="Kahvaltılık">Kahvaltılık</option>
                  <option value="Kuru Yemiş">Kuru Yemiş</option>
                  <option value="Taze Meyve-Sebze">Taze Meyve-Sebze</option>
                  <option value="Doğal İçecekler & Sirke">Doğal İçecekler & Sirke</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Satış Birimi Türü *
                </label>
                <select
                  value={formData.saleUnit}
                  onChange={(e) => setFormData({ ...formData, saleUnit: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Kg">Kg (Kilogram)</option>
                  <option value="Gramaj">Gramaj (Gram)</option>
                  <option value="Litre">Litre (Hacim)</option>
                  <option value="Adet">Adet / Paket</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Birim Satış Fiyatı (₺) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="145.00"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Birim Maliyet / Alış Fiyatı (₺)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100.00"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Başlangıç Stok Miktarı
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="50"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Durum
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="Active">Satışta (Active)</option>
                  <option value="LowStock">Kritik Stok (LowStock)</option>
                  <option value="OutOfStock">Tükendi (OutOfStock)</option>
                  <option value="Draft">Taslak (Draft)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  SKU Kodu
                </label>
                <input
                  type="text"
                  placeholder="SKU-FOOD-101"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: theme.colors.espresso, marginBottom: '4px' }}>
                  Barkod Numarası
                </label>
                <input
                  type="text"
                  placeholder="8690123456789"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: theme.radii.xs,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textInverse,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isSubmitting ? 'Ekleniyor...' : 'Ürünü PostgreSQL’e Kaydet'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =========================================================================
          MODAL: ÜRÜN SİL ONAY MODALI (DELETE /api/admin/products/{id})
          ========================================================================= */}
      {deletingProduct && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingProduct(null)}
          title="Ürünü Sil"
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '13.5px', color: theme.colors.espresso, margin: 0, lineHeight: 1.5 }}>
              <strong>"{deletingProduct.name}"</strong> adlı ürünü PostgreSQL veritabanından kalıcı olarak silmek istediğinize emin misiniz?
            </p>
            <div style={{ padding: '10px 14px', backgroundColor: '#FFF5F5', border: '1px solid #F8B4B4', borderRadius: theme.radii.xs, fontSize: '12px', color: '#9B1C1C' }}>
              Bu işlem geri alınamaz ve ürün kataloğu ile ilişkili tüm kayıtlar etkilenecektir.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                disabled={isSubmitting}
                style={{
                  padding: '8px 16px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: theme.colors.bgSurface,
                  color: theme.colors.espresso,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  fontWeight: 600,
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
                  padding: '8px 18px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: '#C53030',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
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

// ==========================================
// 2. İÇERİK VE ALERJEN BİLGİLERİ SAYFASI
// Backend (.NET 10 Minimal API & PostgreSQL) Bağlantılı
// ==========================================
export const AllergensNutritionPage: React.FC = () => {
  // Products from API
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Selected Product Details from API
  const [details, setDetails] = useState<ProductDetailsDto | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Edit State
  const [formIngredients, setFormIngredients] = useState<string>('');
  const [formAllergens, setFormAllergens] = useState<string[]>([]);
  const [customAllergenInput, setCustomAllergenInput] = useState<string>('');
  const [formCertifications, setFormCertifications] = useState<string[]>([]);
  const [customCertInput, setCustomCertInput] = useState<string>('');
  const [formNutrition, setFormNutrition] = useState<NutritionalValuesDto>({
    energyKcal: 0,
    fat: 0,
    saturatedFat: 0,
    carbohydrates: 0,
    sugar: 0,
    protein: 0,
    salt: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // 1. Load Products on Mount
  const loadProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      setErrorMessage(null);
      const res = await productService.getProducts({ pageSize: 100 });
      setProducts(res.items);
      if (res.items.length > 0 && !selectedProductId) {
        setSelectedProductId(res.items[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ürün listesi yüklenemedi.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [selectedProductId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // 2. Load Selected Product Details
  const loadProductDetails = useCallback(async (id: string) => {
    try {
      setIsLoadingDetails(true);
      setErrorMessage(null);
      const data = await productService.getProductDetails(id);
      setDetails(data);
      // Initialize edit form
      setFormIngredients(data.ingredients || '');
      setFormAllergens(data.allergens || []);
      setFormCertifications(data.certifications || []);
      setFormNutrition(
        data.nutritionalValues || {
          energyKcal: 0,
          fat: 0,
          saturatedFat: 0,
          carbohydrates: 0,
          sugar: 0,
          protein: 0,
          salt: 0,
        }
      );
      setIsEditing(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Ürün detayları yüklenemedi.');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadProductDetails(selectedProductId);
    }
  }, [selectedProductId, loadProductDetails]);

  // Handle Save
  const handleSave = async () => {
    if (!selectedProductId) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload: UpdateProductDetailsData = {
        ingredients: formIngredients.trim() || null,
        allergens: formAllergens,
        certifications: formCertifications,
        nutritionalValues: formNutrition,
      };

      const updated = await productService.updateProductDetails(selectedProductId, payload);
      setDetails(updated);
      setIsEditing(false);
      showToast('İçerik ve besin değerleri PostgreSQL veritabanına başarıyla kaydedildi.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Allergen & Certification Tags
  const quickAllergens = [
    'Gluten',
    'Laktoz (Süt ve Süt Ürünleri)',
    'Sert Kabuklu Yemişler',
    'Soya',
    'Yumurta',
    'Balık',
    'Susam',
    'Kereviz',
    'Hardal',
    'Yer Fıstığı',
  ];

  const quickCertifications = [
    'Organik Sertifikalı',
    'Vegan',
    'Vejetaryen',
    'Helal',
    'Glutensiz',
    'Katkısız',
    'Doğal Probiyotik',
    'GDO İçermez',
    'Soğuk Sıkım',
    'Geleneksel Taş Baskı',
  ];

  const toggleAllergen = (item: string) => {
    setFormAllergens((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const addCustomAllergen = () => {
    const val = customAllergenInput.trim();
    if (val && !formAllergens.includes(val)) {
      setFormAllergens((prev) => [...prev, val]);
      setCustomAllergenInput('');
    }
  };

  const toggleCert = (item: string) => {
    setFormCertifications((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const addCustomCert = () => {
    const val = customCertInput.trim();
    if (val && !formCertifications.includes(val)) {
      setFormCertifications((prev) => [...prev, val]);
      setCustomCertInput('');
    }
  };

  // Filtered Products for Selector
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Notification */}
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
            boxShadow: '0 4px 16px rgba(45, 36, 30, 0.15)',
            fontSize: '13.5px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: `1px solid ${theme.colors.primary}`,
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
              İçerik ve Alerjen Bilgileri
            </h1>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: theme.radii.full, backgroundColor: theme.colors.statusDangerBg, color: theme.colors.statusDanger, border: '1px solid #F5D3CE' }}>
              Gıda Güvenliği & Etiketleme (Vertical Slice 3)
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
            PostgreSQL catalog şemasından canlı çekilen içindekiler listesi, alerjen uyarıları, sertifikalar ve 100g besin değerleri tablosu yönetimi.
          </p>
        </div>

        {/* Global Action Button */}
        {details && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '9px 18px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.primary}`,
                  backgroundColor: theme.colors.primary,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: theme.shadows.subtle,
                }}
              >
                <span>✏️</span>
                <span>Bilgileri Düzenle</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset to details
                    if (details) {
                      setFormIngredients(details.ingredients || '');
                      setFormAllergens(details.allergens || []);
                      setFormCertifications(details.certifications || []);
                      setFormNutrition(
                        details.nutritionalValues || {
                          energyKcal: 0,
                          fat: 0,
                          saturatedFat: 0,
                          carbohydrates: 0,
                          sugar: 0,
                          protein: 0,
                          salt: 0,
                        }
                      );
                    }
                  }}
                  disabled={isSaving}
                  style={{
                    padding: '9px 16px',
                    borderRadius: theme.radii.md,
                    border: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.bgCard,
                    color: theme.colors.taupe,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    padding: '9px 20px',
                    borderRadius: theme.radii.md,
                    border: `1px solid ${theme.colors.statusSuccess}`,
                    backgroundColor: theme.colors.statusSuccess,
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  <span>💾</span>
                  <span>{isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}</span>
                </button>
              </div>
            )}
          </div>
        )}
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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.statusDanger, fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Product Selector Card */}
      <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso }}>
            Ürün Seçimi ({products.length} Ürün Mevcut):
          </span>
          <input
            type="text"
            placeholder="Ürün adı veya SKU ile ara..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: theme.radii.sm,
              border: `1px solid ${theme.colors.border}`,
              fontSize: '12.5px',
              color: theme.colors.espresso,
              outline: 'none',
              width: '240px',
            }}
          />
        </div>

        {isLoadingProducts ? (
          <div style={{ padding: '16px', textAlign: 'center', color: theme.colors.taupe, fontSize: '13px' }}>
            Ürünler yükleniyor...
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '130px', overflowY: 'auto', paddingBottom: '4px' }}>
            {filteredProducts.map((p) => {
              const isSelected = selectedProductId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: theme.radii.md,
                    border: isSelected ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                    backgroundColor: isSelected ? theme.colors.primarySubtle : theme.colors.bgSurface,
                    color: isSelected ? theme.colors.primary : theme.colors.cedar,
                    fontSize: '12.5px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '10px' }}>{isSelected ? '●' : '○'}</span>
                  <span>{p.name}</span>
                  {p.sku && <span style={{ fontSize: '11px', opacity: 0.65 }}>({p.sku})</span>}
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <span style={{ fontSize: '13px', color: theme.colors.taupe, padding: '8px 0' }}>
                Arama kriterine uygun ürün bulunamadı.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Details View / Edit Area */}
      {isLoadingDetails ? (
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '40px', textAlign: 'center', color: theme.colors.taupe }}>
          Ürün detayları ve besin değerleri yükleniyor...
        </div>
      ) : details ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* Left Card: Ingredients, Allergens & Certifications */}
          <div
            style={{
              backgroundColor: theme.colors.bgCard,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Product Meta */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {details.category} • SKU: {details.sku}
                </span>
                {isEditing && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.primary, backgroundColor: theme.colors.primarySubtle, padding: '2px 8px', borderRadius: theme.radii.xs }}>
                    DÜZENLEME MODU
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '19px', fontWeight: 700, color: theme.colors.espresso, marginTop: '3px', marginBottom: '10px' }}>
                {details.name}
              </h2>

              {/* Certifications & Dietary Flags */}
              <div style={{ marginTop: '8px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: theme.colors.taupe, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  🏅 Sertifikalar ve Nitelikler:
                </h4>
                {isEditing ? (
                  <div>
                    {/* Active tags with remove button */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {formCertifications.map((cert, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: theme.radii.xs,
                            backgroundColor: theme.colors.statusSuccessBg,
                            color: theme.colors.statusSuccess,
                            border: '1px solid #D5E5D4',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          ✓ {cert}
                          <button
                            onClick={() => toggleCert(cert)}
                            style={{ background: 'none', border: 'none', color: theme.colors.statusSuccess, cursor: 'pointer', padding: 0, fontSize: '12px' }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      {formCertifications.length === 0 && (
                        <span style={{ fontSize: '12px', color: theme.colors.taupe }}>Sertifika seçilmedi.</span>
                      )}
                    </div>
                    {/* Quick selection chips */}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {quickCertifications.map((q) => {
                        const active = formCertifications.includes(q);
                        return (
                          <button
                            key={q}
                            type="button"
                            onClick={() => toggleCert(q)}
                            style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: theme.radii.xs,
                              border: active ? `1px solid ${theme.colors.statusSuccess}` : `1px solid ${theme.colors.border}`,
                              backgroundColor: active ? theme.colors.statusSuccessBg : theme.colors.bgSurface,
                              color: active ? theme.colors.statusSuccess : theme.colors.taupe,
                              cursor: 'pointer',
                            }}
                          >
                            {active ? '✓ ' : '+ '}
                            {q}
                          </button>
                        );
                      })}
                    </div>
                    {/* Custom Cert Input */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Özel sertifika/nitelik ekle..."
                        value={customCertInput}
                        onChange={(e) => setCustomCertInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomCert();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: theme.radii.sm,
                          border: `1px solid ${theme.colors.border}`,
                          fontSize: '12px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCustomCert}
                        style={{
                          padding: '6px 12px',
                          borderRadius: theme.radii.sm,
                          border: `1px solid ${theme.colors.border}`,
                          backgroundColor: theme.colors.bgSurface,
                          color: theme.colors.espresso,
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Ekle
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {details.certifications && details.certifications.length > 0 ? (
                      details.certifications.map((flag, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '11.5px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: theme.radii.xs,
                            backgroundColor: theme.colors.statusSuccessBg,
                            color: theme.colors.statusSuccess,
                            border: '1px solid #D5E5D4',
                          }}
                        >
                          ✓ {flag}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: theme.colors.taupe, fontStyle: 'italic' }}>
                        Tanımlanmış özel sertifika veya diyet etiketi bulunmuyor.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Ingredients Section */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '8px', textTransform: 'uppercase' }}>
                📜 İçindekiler Listesi (Bileşenler)
              </h4>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={formIngredients}
                  onChange={(e) => setFormIngredients(e.target.value)}
                  placeholder="Ürünün tüm ham maddeleri ve bileşenlerini virgülle ayırarak yazınız..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: theme.radii.sm,
                    backgroundColor: theme.colors.bgSurface,
                    border: `1.5px solid ${theme.colors.primary}`,
                    fontSize: '13.5px',
                    color: theme.colors.espresso,
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: theme.radii.sm,
                    backgroundColor: theme.colors.bgSurface,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13.5px',
                    color: theme.colors.espresso,
                    lineHeight: 1.6,
                    minHeight: '60px',
                  }}
                >
                  {details.ingredients ? (
                    details.ingredients
                  ) : (
                    <span style={{ color: theme.colors.taupe, fontStyle: 'italic' }}>
                      İçindekiler listesi henüz girilmemiş.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Allergens Section */}
            <div>
              <h4
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: theme.colors.statusDanger,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>⚠️</span> Alerjen Uyarıları (Yasal Etiket)
              </h4>

              {isEditing ? (
                <div>
                  {/* Active Allergen Warnings */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {formAllergens.map((alg, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          borderRadius: theme.radii.sm,
                          backgroundColor: theme.colors.statusDangerBg,
                          border: '1px solid #F5D3CE',
                          color: theme.colors.statusDanger,
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>⛔</span>
                          <span>{alg}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleAllergen(alg)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: theme.colors.statusDanger,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {formAllergens.length === 0 && (
                      <div style={{ padding: '8px 12px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.statusSuccessBg, color: theme.colors.statusSuccess, border: '1px solid #D5E5D4', fontSize: '12.5px', fontWeight: 600 }}>
                        ✓ Alerjen seçilmedi (Alerjen içermez olarak kaydedilir)
                      </div>
                    )}
                  </div>

                  {/* Quick allergen pills */}
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {quickAllergens.map((q) => {
                      const active = formAllergens.includes(q);
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => toggleAllergen(q)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: theme.radii.xs,
                            border: active ? `1px solid ${theme.colors.statusDanger}` : `1px solid ${theme.colors.border}`,
                            backgroundColor: active ? theme.colors.statusDangerBg : theme.colors.bgSurface,
                            color: active ? theme.colors.statusDanger : theme.colors.taupe,
                            cursor: 'pointer',
                          }}
                        >
                          {active ? '⛔ ' : '+ '}
                          {q}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Allergen Input */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      placeholder="Örn: Eser miktarda hardal içerebilir..."
                      value={customAllergenInput}
                      onChange={(e) => setCustomAllergenInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomAllergen();
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        fontSize: '12px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomAllergen}
                      style={{
                        padding: '6px 12px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.bgSurface,
                        color: theme.colors.espresso,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Ekle
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {details.allergens && details.allergens.length > 0 ? (
                    details.allergens.map((alg, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '10px 14px',
                          borderRadius: theme.radii.sm,
                          backgroundColor: theme.colors.statusDangerBg,
                          border: '1px solid #F5D3CE',
                          color: theme.colors.statusDanger,
                          fontSize: '13px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <span style={{ fontSize: '14px' }}>⛔</span>
                        <span>{alg}</span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: theme.radii.sm,
                        backgroundColor: theme.colors.statusSuccessBg,
                        border: '1px solid #D5E5D4',
                        color: theme.colors.statusSuccess,
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>✓</span>
                      <span>Bilinen alerjen içermez.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Card: Official Nutrition Facts Table */}
          <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '24px' }}>
            <div style={{ border: `2px solid ${theme.colors.espresso}`, padding: '18px', borderRadius: theme.radii.sm, backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `5px solid ${theme.colors.espresso}`, paddingBottom: '4px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: theme.colors.espresso, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                  Besin Öğeleri Değerleri
                </h3>
                {isEditing && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.primary, backgroundColor: theme.colors.primarySubtle, padding: '2px 8px', borderRadius: theme.radii.xs }}>
                    DÜZENLENİYOR
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.taupe, padding: '6px 0', borderBottom: `1px solid ${theme.colors.espresso}` }}>
                Porsiyon / Referans Değer: <b>100 g / 100 ml için</b>
              </div>

              {isEditing ? (
                /* Edit Mode: Numeric Inputs */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13.5px', fontWeight: 700, color: theme.colors.espresso }}>
                      Enerji (kcal):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formNutrition.energyKcal}
                      onChange={(e) => setFormNutrition({ ...formNutrition, energyKcal: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1.5px solid ${theme.colors.primary}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso }}>
                      Toplam Yağ (g):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formNutrition.fat}
                      onChange={(e) => setFormNutrition({ ...formNutrition, fat: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '14px' }}>
                    <label style={{ fontSize: '12.5px', color: theme.colors.taupe }}>
                      - Doymuş Yağ (g):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formNutrition.saturatedFat}
                      onChange={(e) => setFormNutrition({ ...formNutrition, saturatedFat: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso }}>
                      Karbonhidrat (g):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formNutrition.carbohydrates}
                      onChange={(e) => setFormNutrition({ ...formNutrition, carbohydrates: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '14px' }}>
                    <label style={{ fontSize: '12.5px', color: theme.colors.taupe }}>
                      - Şekerler (g):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formNutrition.sugar}
                      onChange={(e) => setFormNutrition({ ...formNutrition, sugar: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso }}>
                      Protein (g):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formNutrition.protein}
                      onChange={(e) => setFormNutrition({ ...formNutrition, protein: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso }}>
                      Tuz / Sodyum (g):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formNutrition.salt}
                      onChange={(e) => setFormNutrition({ ...formNutrition, salt: parseFloat(e.target.value) || 0 })}
                      style={{ width: '120px', padding: '6px 10px', borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}`, fontSize: '13px', textAlign: 'right' }}
                    />
                  </div>
                </div>
              ) : (
                /* View Mode: Official Nutrition Facts Card */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `3px solid ${theme.colors.espresso}`, fontSize: '15px', fontWeight: 800, color: theme.colors.espresso }}>
                    <span>Enerji Değeri</span>
                    <span>
                      {details.nutritionalValues?.energyKcal ?? 0} kcal / {Math.round((details.nutritionalValues?.energyKcal ?? 0) * 4.184)} kJ
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
                    <span><b>Toplam Yağ</b></span>
                    <b>{details.nutritionalValues?.fat ?? 0} g</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 6px 16px', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13px', color: theme.colors.taupe }}>
                    <span>- Doymuş Yağ</span>
                    <span>{details.nutritionalValues?.saturatedFat ?? 0} g</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
                    <span><b>Karbonhidrat</b></span>
                    <b>{details.nutritionalValues?.carbohydrates ?? 0} g</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 6px 16px', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13px', color: theme.colors.taupe }}>
                    <span>- Şekerler</span>
                    <span>{details.nutritionalValues?.sugar ?? 0} g</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
                    <span><b>Protein</b></span>
                    <b>{details.nutritionalValues?.protein ?? 0} g</b>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `2px solid ${theme.colors.espresso}`, fontSize: '13.5px', color: theme.colors.espresso }}>
                    <span><b>Tuz / Sodyum</b></span>
                    <b>{details.nutritionalValues?.salt ?? 0} g</b>
                  </div>

                  {!details.nutritionalValues && (
                    <div style={{ padding: '10px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.sm, marginTop: '12px', fontSize: '12px', color: theme.colors.taupe, textAlign: 'center' }}>
                      ℹ️ Bu ürün için besin değerleri henüz girilmemiş. Yukarıdaki <b>"Bilgileri Düzenle"</b> butonuna basarak kaydedebilirsiniz.
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: '11px', color: theme.colors.taupe, marginTop: '12px', lineHeight: 1.4 }}>
                * Günlük referans alım değeri (BRD) ortalama bir yetişkin için 8400 kJ / 2000 kcal baz alınarak hesaplanmıştır.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '40px', textAlign: 'center', color: theme.colors.taupe }}>
          Lütfen yukarıdaki listeden bir ürün seçiniz.
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. STT / TETT VE PARTİ (LOT) TAKİBİ SAYFASI
// Backend (.NET 10 Minimal API & PostgreSQL) Bağlantılı
// ==========================================
export const LotExpiryTrackingPage: React.FC = () => {
  // Live Data & Filter State
  const [lots, setLots] = useState<ProductLotDto[]>([]);
  const [metrics, setMetrics] = useState<LotSummaryMetricsDto>({
    totalLots: 0,
    activeLots: 0,
    nearExpiryCount: 0,
    criticalCount: 0,
    expiredCount: 0,
    writtenOffCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expiringFilter, setExpiringFilter] = useState<number | undefined>(undefined);

  // Modal State for New Lot Creation
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [availableProducts, setAvailableProducts] = useState<ProductDto[]>([]);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [formLotNumber, setFormLotNumber] = useState<string>('');
  const [formProductionDate, setFormProductionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [formExpiryDate, setFormExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [formQuantity, setFormQuantity] = useState<number>(50);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // 1. Load Lots from API
  const loadLots = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await lotService.getLots({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        expiringWithinDays: expiringFilter,
        search: searchTerm.trim() || undefined,
        pageSize: 50,
      });
      setLots(res.items);
      setMetrics(res.metrics);
    } catch (err: any) {
      setErrorMessage(err.message || 'Parti ve STT verileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, expiringFilter, searchTerm]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

  // Load products when opening create modal
  const openCreateModal = async () => {
    try {
      if (availableProducts.length === 0) {
        const res = await productService.getProducts({ pageSize: 100 });
        setAvailableProducts(res.items);
        if (res.items.length > 0) {
          setSelectedProductId(res.items[0].id);
        }
      }
      // Reset form
      setFormLotNumber('');
      setFormQuantity(50);
      setIsModalOpen(true);
    } catch (err: any) {
      showToast('Ürün listesi yüklenirken hata oluştu.');
    }
  };

  // Handle Create Lot Submit
  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Lütfen bir ürün seçiniz.');
      return;
    }
    if (formQuantity <= 0) {
      alert("Parti miktarı 0'dan büyük olmalıdır.");
      return;
    }
    if (new Date(formExpiryDate) <= new Date(formProductionDate)) {
      alert('Son tüketim tarihi (STT) üretim tarihinden sonra olmalıdır.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateLotData = {
        productId: selectedProductId,
        lotNumber: formLotNumber.trim() || undefined,
        productionDate: new Date(formProductionDate).toISOString(),
        expiryDate: new Date(formExpiryDate).toISOString(),
        quantity: Number(formQuantity),
        status: 'Active',
      };

      await lotService.createLot(payload);
      setIsModalOpen(false);
      showToast('Yeni parti başarıyla eklendi ve bağlı ürünün genel stoğu artırıldı.');
      loadLots();
    } catch (err: any) {
      alert(err.message || 'Parti eklenirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update (e.g. Write-off / Fireye ayır)
  const handleUpdateStatus = async (lot: ProductLotDto, newStatus: string) => {
    const confirmMsg =
      newStatus === 'WrittenOff'
        ? `"${lot.lotNumber}" numaralı partiyi fire/imha olarak işaretlemek istediğinize emin misiniz? Parti miktarı kadar ürün stoğu düşülecektir.`
        : `Parti durumunu "${newStatus}" olarak güncellemek istediğinize emin misiniz?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await lotService.updateLotStatus(lot.id, { status: newStatus });
      showToast(`Parti durumu '${newStatus}' olarak güncellendi.`);
      loadLots();
    } catch (err: any) {
      alert(err.message || 'Durum güncellenirken hata oluştu.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Notification */}
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
            boxShadow: '0 4px 16px rgba(45, 36, 30, 0.15)',
            fontSize: '13.5px',
            fontWeight: 600,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: `1px solid ${theme.colors.primary}`,
          }}
        >
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
              Son Tüketim Tarihi (STT / TETT) ve Parti (Lot) Takibi
            </h1>
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: theme.radii.full, backgroundColor: theme.colors.statusWarningBg, color: theme.colors.statusWarning, border: '1px solid #FDF0E2' }}>
              Parti & SKT Motoru (Vertical Slice 4)
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
            PostgreSQL catalog.ProductLots tablosu ile FIFO kuralları, yaklaşan SKT flaş indirimleri ve otomatik parti stok takibi.
          </p>
        </div>

        {/* Action Button: Create New Lot */}
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.primary}`,
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: theme.shadows.subtle,
            transition: 'background 0.2s',
          }}
        >
          <span>＋</span>
          <span>Yeni Parti Girişi</span>
        </button>
      </div>

      {/* Live Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {/* Card 1: Aktif Partiler */}
        <div
          onClick={() => {
            setStatusFilter('Active');
            setExpiringFilter(undefined);
          }}
          style={{
            backgroundColor: theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: statusFilter === 'Active' ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.taupe, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Aktif Partiler
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.colors.primary, marginTop: '4px' }}>
            {metrics.activeLots}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: theme.colors.taupe }}>/ {metrics.totalLots} Toplam</span>
          </div>
          <div style={{ fontSize: '11.5px', color: theme.colors.taupe, marginTop: '4px' }}>
            Satışta olan geçerli partiler
          </div>
        </div>

        {/* Card 2: Son 7 Gün (Kritik) */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setExpiringFilter(7);
          }}
          style={{
            backgroundColor: expiringFilter === 7 ? '#FFF5F3' : theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: expiringFilter === 7 ? `1.5px solid ${theme.colors.statusDanger}` : `1px solid ${theme.colors.border}`,
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.statusDanger, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            🚨 Son 7 Gün Kalanlar (&lt; 7 Gün)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.colors.statusDanger, marginTop: '4px' }}>
            {metrics.criticalCount}
          </div>
          <div style={{ fontSize: '11.5px', color: theme.colors.taupe, marginTop: '4px' }}>
            %30 Flaş İndirim tanımlı partiler
          </div>
        </div>

        {/* Card 3: Son 15 Gün (Erken SKT) */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setExpiringFilter(15);
          }}
          style={{
            backgroundColor: expiringFilter === 15 ? '#FFF9F2' : theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: expiringFilter === 15 ? `1.5px solid ${theme.colors.statusWarning}` : `1px solid ${theme.colors.border}`,
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.statusWarning, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            ⚠️ 8 - 15 Gün Kalanlar
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.colors.statusWarning, marginTop: '4px' }}>
            {Math.max(0, metrics.nearExpiryCount - metrics.criticalCount)}
          </div>
          <div style={{ fontSize: '11.5px', color: theme.colors.taupe, marginTop: '4px' }}>
            %15 Erken SKT İndirimi tanımlı
          </div>
        </div>

        {/* Card 4: Süresi Dolan & Fire */}
        <div
          onClick={() => {
            setStatusFilter('Expired');
            setExpiringFilter(undefined);
          }}
          style={{
            backgroundColor: statusFilter === 'Expired' ? theme.colors.bgSurface : theme.colors.bgCard,
            borderRadius: theme.radii.md,
            border: statusFilter === 'Expired' ? `1.5px solid ${theme.colors.espresso}` : `1px solid ${theme.colors.border}`,
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.espresso, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            🛑 Süresi Dolan / Fire
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: theme.colors.espresso, marginTop: '4px' }}>
            {metrics.expiredCount}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: theme.colors.taupe }}>+ {metrics.writtenOffCount} Fire</span>
          </div>
          <div style={{ fontSize: '11.5px', color: theme.colors.taupe, marginTop: '4px' }}>
            Satıştan çekilen ve imha edilen
          </div>
        </div>
      </div>

      {/* Auto Discount Rules Summary Banner */}
      <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '18px 20px' }}>
        <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚡</span> Otomatik İndirim ve Erken Uyarı Motoru Kuralları
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.statusDangerBg, border: '1px solid #F5D3CE' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: theme.colors.statusDanger }}>🚨 Kural 1: Son 7 Gün</div>
            <div style={{ fontSize: '11.5px', color: theme.colors.espresso, marginTop: '3px' }}>
              STT'sine 7 gün ve daha az kalan ürünlere anında <b>%30 Otomatik Flaş İndirim</b> tanımlanır.
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.statusWarningBg, border: '1px solid #FDF0E2' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: theme.colors.statusWarning }}>⚠️ Kural 2: Son 15 Gün</div>
            <div style={{ fontSize: '11.5px', color: theme.colors.espresso, marginTop: '3px' }}>
              STT'sine 15 gün kalan taze ve süt ürünlerine <b>%15 Erken SKT İndirimi</b> uygulanır.
            </div>
          </div>
          <div style={{ padding: '12px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.bgSurface, border: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: theme.colors.cedar }}>🛑 Kural 3: Süresi Dolanlar</div>
            <div style={{ fontSize: '11.5px', color: theme.colors.espresso, marginTop: '3px' }}>
              Otomatik satış kapatılır; ürün stoktan düşülerek <b>Karantina / Aşevi / İmha</b> çıkışına aktarılır.
            </div>
          </div>
        </div>
      </div>

      {/* Lot Tracking Table Card */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Table Filter & Search Controls */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginRight: '4px' }}>
              Filtrele:
            </span>
            {[
              { id: 'all', label: 'Tüm Partiler' },
              { id: 'Active', label: 'Aktif Partiler' },
              { id: 'NearExpiry', label: 'Yaklaşan STT (≤15 Gün)' },
              { id: 'Expired', label: 'Süresi Dolanlar' },
              { id: 'WrittenOff', label: 'Fire / İmha' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setExpiringFilter(undefined);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: theme.radii.sm,
                  border: statusFilter === tab.id && !expiringFilter ? `1.5px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
                  backgroundColor: statusFilter === tab.id && !expiringFilter ? theme.colors.primarySubtle : theme.colors.bgSurface,
                  color: statusFilter === tab.id && !expiringFilter ? theme.colors.primary : theme.colors.cedar,
                  fontSize: '12px',
                  fontWeight: statusFilter === tab.id && !expiringFilter ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Parti No veya Ürün Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                fontSize: '12.5px',
                outline: 'none',
                width: '210px',
              }}
            />
            <button
              onClick={loadLots}
              style={{
                padding: '7px 12px',
                borderRadius: theme.radii.sm,
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.bgSurface,
                color: theme.colors.espresso,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Yenile
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: theme.colors.taupe, fontSize: '13.5px' }}>
              Parti ve STT verileri PostgreSQL'den yükleniyor...
            </div>
          ) : lots.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: theme.colors.taupe, fontSize: '13.5px' }}>
              Filtrelere uygun parti kaydı bulunamadı. Yukarıdaki <b>"Yeni Parti Girişi"</b> butonunu kullanarak ilk partiyi ekleyebilirsiniz.
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                minWidth: '920px',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '13px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.colors.bgSurface,
                    borderBottom: `1px solid ${theme.colors.border}`,
                    color: theme.colors.taupe,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '14px 20px', verticalAlign: 'middle' }}>Parti (Lot) No</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Ürün Adı</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Üretim Tarihi</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>STT / TETT</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Kalan Süre</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Parti Miktarı</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Otomatik İndirim</th>
                  <th style={{ padding: '14px 16px', verticalAlign: 'middle' }}>Durum</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => {
                  // Badge styling logic
                  let badgeBg = theme.colors.statusSuccessBg;
                  let badgeColor = theme.colors.statusSuccess;
                  let badgeText = `✓ ${lot.daysLeft} Gün Kaldı`;

                  if (lot.status === 'WrittenOff') {
                    badgeBg = theme.colors.bgSurface;
                    badgeColor = theme.colors.taupe;
                    badgeText = '🛑 İmha Edildi';
                  } else if (lot.daysLeft <= 0) {
                    badgeBg = theme.colors.statusDangerBg;
                    badgeColor = theme.colors.statusDanger;
                    badgeText = '⛔ Süresi Doldu';
                  } else if (lot.daysLeft <= 7) {
                    badgeBg = theme.colors.statusDangerBg;
                    badgeColor = theme.colors.statusDanger;
                    badgeText = `⏳ ${lot.daysLeft} Gün Kaldı (Kritik)`;
                  } else if (lot.daysLeft <= 15) {
                    badgeBg = theme.colors.statusWarningBg;
                    badgeColor = theme.colors.statusWarning;
                    badgeText = `⏳ ${lot.daysLeft} Gün Kaldı`;
                  }

                  return (
                    <tr
                      key={lot.id}
                      style={{
                        borderBottom: `1px solid ${theme.colors.borderSubtle}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.colors.bgSurface)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '14px 20px',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: theme.colors.primary,
                          verticalAlign: 'middle',
                        }}
                      >
                        {lot.lotNumber}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontWeight: 600,
                          color: theme.colors.espresso,
                          verticalAlign: 'middle',
                        }}
                      >
                        <div>{lot.productName}</div>
                        {lot.productSku && (
                          <div style={{ fontSize: '11px', color: theme.colors.taupe, fontWeight: 400 }}>
                            SKU: {lot.productSku}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: theme.colors.taupe, verticalAlign: 'middle' }}>
                        {formatDate(lot.productionDate)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontWeight: 600,
                          color: theme.colors.espresso,
                          verticalAlign: 'middle',
                        }}
                      >
                        {formatDate(lot.expiryDate)}
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: theme.radii.xs,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}33`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badgeText}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: theme.colors.espresso, fontWeight: 600, verticalAlign: 'middle' }}>
                        {lot.quantity} Adet
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: lot.autoDiscount?.includes('%') ? '3px 8px' : '0',
                            borderRadius: theme.radii.xs,
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: lot.autoDiscount?.includes('%') ? theme.colors.statusDangerBg : 'transparent',
                            color: lot.autoDiscount?.includes('%') ? theme.colors.statusDanger : theme.colors.taupe,
                            border: lot.autoDiscount?.includes('%') ? '1px solid #F5D3CE' : 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lot.autoDiscount?.includes('%') && <span>⚡</span>}
                          {lot.autoDiscount}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 8px',
                            borderRadius: theme.radii.xs,
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor:
                              lot.status === 'WrittenOff'
                                ? theme.colors.bgSurface
                                : lot.status === 'Expired'
                                ? theme.colors.statusDangerBg
                                : lot.status === 'NearExpiry'
                                ? theme.colors.statusWarningBg
                                : theme.colors.statusSuccessBg,
                            color:
                              lot.status === 'WrittenOff'
                                ? theme.colors.taupe
                                : lot.status === 'Expired'
                                ? theme.colors.statusDanger
                                : lot.status === 'NearExpiry'
                                ? theme.colors.statusWarning
                                : theme.colors.statusSuccess,
                          }}
                        >
                          {lot.status === 'WrittenOff'
                            ? 'Fire / İmha'
                            : lot.status === 'Expired'
                            ? 'Süresi Doldu'
                            : lot.status === 'NearExpiry'
                            ? 'Yaklaşan SKT'
                            : 'Aktif'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                        {lot.status !== 'WrittenOff' ? (
                          <button
                            onClick={() => handleUpdateStatus(lot, 'WrittenOff')}
                            title="Partiyi fire/imha olarak kaydet ve stoktan düş"
                            style={{
                              padding: '5px 10px',
                              borderRadius: theme.radii.xs,
                              border: '1px solid #F5D3CE',
                              backgroundColor: theme.colors.statusDangerBg,
                              color: theme.colors.statusDanger,
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🗑️</span>
                            <span>Fireye Ayır</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: theme.colors.taupe, fontStyle: 'italic' }}>
                            İşlem Tamamlandı
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Yeni Parti Girişi */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Parti (Lot) Girişi">
          <form onSubmit={handleCreateLot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '6px' }}>
                İlişkili Ürün *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                }}
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ''} - Mevcut Stok: {p.stockQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '6px' }}>
                Parti (Lot) Numarası
              </label>
              <input
                type="text"
                placeholder="Örn: LOT-2026-1109-KAS (Boş bırakılırsa otomatik üretilir)"
                value={formLotNumber}
                onChange={(e) => setFormLotNumber(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '6px' }}>
                  Üretim Tarihi *
                </label>
                <input
                  type="date"
                  value={formProductionDate}
                  onChange={(e) => setFormProductionDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: theme.radii.sm,
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.statusDanger, marginBottom: '6px' }}>
                  Son Tüketim Tarihi (STT / TETT) *
                </label>
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: theme.radii.sm,
                    border: `1.5px solid ${theme.colors.statusDanger}`,
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '6px' }}>
                Parti Miktarı (Stok Girişi) *
              </label>
              <input
                type="number"
                min="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 0)}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: theme.radii.sm,
                  border: `1px solid ${theme.colors.border}`,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: theme.radii.sm,
                backgroundColor: theme.colors.primarySubtle,
                border: `1px solid ${theme.colors.primary}33`,
                fontSize: '12px',
                color: theme.colors.primary,
                lineHeight: 1.5,
              }}
            >
              ℹ️ <b>Otomatik Stok Entegrasyonu:</b> Yeni parti kaydedildiğinde girilen miktar bağlı ürünün genel envanter stoğuna otomatik olarak eklenecek ve <b>admin.AuditLogs</b> tablosuna denetim kaydı atılacaktır.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.bgCard,
                  color: theme.colors.taupe,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '9px 20px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.primary}`,
                  backgroundColor: theme.colors.primary,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? 'Kaydediliyor...' : 'Partiyi Kaydet ve Stoğa Ekle'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// ==========================================
// 4. SAKLAMA KOŞULLARI SAYFASI
// ==========================================
export const StorageConditionsPage: React.FC = () => {
  const conditions = [
    {
      id: 'dry',
      title: 'Kuru Gıda (Oda Sıcaklığı)',
      tempRange: '18°C - 24°C',
      description: 'Direkt güneş ışığından uzak, serin, nemsiz ve havadar ortamda muhafaza edilir.',
      packaging: 'Hava geçirmez kraft paket, cam kavanoz veya vakumlu çuval.',
      shippingMode: 'Standart Kargo (Özel Soğutma Gerekmez)',
      icon: '🌾',
      badgeColor: theme.colors.statusWarning,
      bgColor: theme.colors.statusWarningBg,
      productCount: 248,
      examples: ['Organik Siyez Unu', 'Sızma Zeytinyağı', 'Kuru Bakliyat', 'Çiğ Badem / Ceviz'],
    },
    {
      id: 'cold',
      title: '+4°C Soğuk Muhafaza',
      tempRange: '+2°C ile +4°C',
      description: 'Buzdolabı sıcaklığında, soğuk hava deposunda ve sürekli sıcaklık takip sensörleriyle korunur.',
      packaging: 'Sızdırmaz vakumlu gıda ambalajı ve koruyucu gazlı tabak.',
      shippingMode: 'Soğuk Zincir (Termobox + Buz Aküsü / Frigorifik Kurye)',
      icon: '❄️',
      badgeColor: theme.colors.primary,
      bgColor: theme.colors.primarySubtle,
      productCount: 164,
      examples: ['Eski Kaşar Peyniri', 'Köy Tereyağı', 'Taze Çiğ Süt', 'Köy Yumurtası'],
    },
    {
      id: 'frozen',
      title: '-18°C Donuk Muhafaza',
      tempRange: '-18°C ve Altı',
      description: 'Şok dondurucu ve derin dondurucu depolarında çözülme döngüsü olmadan saklanır.',
      packaging: 'Düşük sıcaklığa dayanıklı dondurucu poşeti ve kilitli kutu.',
      shippingMode: 'Kuru Buzlu Termobox / Özel Derin Donduruculu Lojistik',
      icon: '🧊',
      badgeColor: theme.colors.statusInfo,
      bgColor: theme.colors.statusInfoBg,
      productCount: 70,
      examples: ['Dondurulmuş Yaban Mersini', 'Organik Şoklanmış Bezelye', 'Donuk Köfte'],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
            Saklama Koşulları ve Muhafaza Tanımları
          </h1>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: theme.radii.full, backgroundColor: theme.colors.primarySubtle, color: theme.colors.primary, border: '1px solid #D5E5D4' }}>
            Soğuk Zincir & Depo Standartları
          </span>
        </div>
        <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
          Ürünlerin depolama ve sevkiyat muhafaza durumları (kuru gıda, +4°C soğuk, -18°C donuk) tanımları ve lojistik gereksinimleri.
        </p>
      </div>

      {/* 3 Main Condition Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {conditions.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: theme.colors.bgCard,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: theme.radii.md,
                    backgroundColor: item.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.colors.espresso, margin: 0 }}>
                    {item.title}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: item.badgeColor, marginTop: '2px' }}>
                    Sıcaklık Aralığı: {item.tempRange}
                  </div>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: theme.radii.xs,
                  backgroundColor: item.bgColor,
                  color: item.badgeColor,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                {item.productCount} Ürün
              </span>
            </div>

            <p style={{ fontSize: '13px', color: theme.colors.taupe, lineHeight: 1.5, margin: 0 }}>
              {item.description}
            </p>

            <div style={{ borderTop: `1px solid ${theme.colors.borderSubtle}`, paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: theme.colors.stoneMuted, fontWeight: 500 }}>Ambalaj Tipi: </span>
                <span style={{ color: theme.colors.espresso, fontWeight: 600 }}>{item.packaging}</span>
              </div>
              <div>
                <span style={{ color: theme.colors.stoneMuted, fontWeight: 500 }}>Lojistik / Sevkiyat: </span>
                <span style={{ color: item.badgeColor, fontWeight: 600 }}>{item.shippingMode}</span>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${theme.colors.borderSubtle}`, paddingTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.taupe, textTransform: 'uppercase', marginBottom: '6px' }}>
                Örnek Ürünler
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {item.examples.map((ex, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '11.5px',
                      padding: '3px 8px',
                      borderRadius: theme.radii.xs,
                      backgroundColor: theme.colors.bgSurface,
                      color: theme.colors.espresso,
                      border: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
