import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../../theme/tokens';
import { Modal } from '../../components/common/Modal';
import {
  productService,
  ProductDto,
  CreateProductData,
  UpdateProductData,
} from '../../services/productService';

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
// ==========================================
export const AllergensNutritionPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<number>(1);

  const productDetails = [
    {
      id: 1,
      name: 'Şirden Mayalı Trakya Eski Kaşar Peyniri (350g)',
      category: 'Süt Ürünleri',
      ingredients: 'Pastörize inek ve koyun sütü, kaya tuzu, doğal şirden mayası, peynir kültürü. Koruyucu ve katkı maddesi içermez.',
      allergens: ['Laktoz (Süt ve Süt Ürünleri)'],
      dietaryFlags: ['Glutensiz', 'Doğal Probiyotik', 'GDO İçermez'],
      nutritionPer100g: {
        energyKcal: '382 kcal',
        energyKj: '1585 kJ',
        protein: '27.4 g',
        fat: '30.1 g',
        saturatedFat: '19.8 g',
        carbs: '1.2 g',
        sugar: '0.8 g',
        salt: '1.9 g',
        calcium: '780 mg (%97 BRD)',
      },
    },
    {
      id: 2,
      name: 'Taş Değirmen Organik Siyez Unu (1kg)',
      category: 'Tahıl Grubu',
      ingredients: '%100 Taş değirmende öğütülmüş ata tohumu organik siyez buğdayı kepeği ve ruşeymiyle birlikte. Katkısız.',
      allergens: ['Gluten (Siyez Buğdayı)'],
      dietaryFlags: ['Organik Sertifikalı', 'Taş Değirmen', 'Düşük Glisemik İndeks'],
      nutritionPer100g: {
        energyKcal: '340 kcal',
        energyKj: '1438 kJ',
        protein: '14.8 g',
        fat: '2.5 g',
        saturatedFat: '0.4 g',
        carbs: '65.2 g',
        sugar: '1.4 g',
        salt: '0.02 g',
        fiber: '10.5 g',
      },
    },
    {
      id: 3,
      name: 'Ham Çiğ Karışık Kuru Yemiş (250g)',
      category: 'Atıştırmalık',
      ingredients: 'Çiğ badem içi, çiğ kaju fıstığı, çiğ ceviz içi, kavrulmamış fındık. Tuzsuz ve yağ eklenmemiştir.',
      allergens: ['Sert Kabuklu Yemişler (Fındık, Badem, Ceviz, Kaju)', 'Eser miktarda Yer Fıstığı ve Susam içerebilir.'],
      dietaryFlags: ['Vegan', 'Glutensiz', 'Çiğ (Raw)', 'Tuzsuz'],
      nutritionPer100g: {
        energyKcal: '608 kcal',
        energyKj: '2520 kJ',
        protein: '18.2 g',
        fat: '54.0 g',
        saturatedFat: '5.8 g',
        carbs: '13.5 g',
        sugar: '4.2 g',
        salt: '0.01 g',
        fiber: '8.4 g',
      },
    },
  ];

  const current = productDetails.find((p) => p.id === selectedProduct) || productDetails[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
            İçerik ve Alerjen Bilgileri
          </h1>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: theme.radii.full, backgroundColor: theme.colors.statusDangerBg, color: theme.colors.statusDanger, border: '1px solid #F5D3CE' }}>
            Gıda Güvenliği & Etiketleme
          </span>
        </div>
        <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
          İçindekiler listesi, gluten, laktoz, fındık vb. alerjen uyarı etiketleri ve 100g besin değerleri tablosu yönetimi.
        </p>
      </div>

      {/* Product Selector Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {productDetails.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedProduct(p.id)}
            style={{
              padding: '9px 18px',
              borderRadius: theme.radii.md,
              border: selectedProduct === p.id ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
              backgroundColor: selectedProduct === p.id ? theme.colors.primarySubtle : theme.colors.bgCard,
              color: selectedProduct === p.id ? theme.colors.primary : theme.colors.cedar,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{selectedProduct === p.id ? '●' : '○'}</span>
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Details + Nutrition Table Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Left Card: Ingredients & Allergens */}
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Seçili Ürün
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.espresso, marginTop: '2px', marginBottom: '8px' }}>
              {current.name}
            </h2>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {current.dietaryFlags.map((flag, idx) => (
                <span key={idx} style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: theme.radii.xs, backgroundColor: theme.colors.statusSuccessBg, color: theme.colors.statusSuccess, border: '1px solid #D5E5D4' }}>
                  ✓ {flag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '8px', textTransform: 'uppercase' }}>
              📜 İçindekiler Listesi (Bileşenler)
            </h4>
            <div style={{ padding: '14px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.bgSurface, border: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso, lineHeight: 1.6 }}>
              {current.ingredients}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.statusDanger, marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠️</span> Alerjen Uyarıları (Yasal Etiket)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {current.allergens.map((alg, idx) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Official Nutrition Facts Table */}
        <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '24px' }}>
          <div style={{ border: `2px solid ${theme.colors.espresso}`, padding: '16px', borderRadius: theme.radii.sm }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: theme.colors.espresso, borderBottom: `5px solid ${theme.colors.espresso}`, paddingBottom: '4px', margin: 0 }}>
              Besin Öğeleri Değerleri
            </h3>
            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.taupe, padding: '6px 0', borderBottom: `1px solid ${theme.colors.espresso}` }}>
              Porsiyon / Referans Değer: <b>100 g için</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `3px solid ${theme.colors.espresso}`, fontSize: '15px', fontWeight: 800, color: theme.colors.espresso }}>
              <span>Enerji Değeri</span>
              <span>{current.nutritionPer100g.energyKcal} / {current.nutritionPer100g.energyKj}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
              <span><b>Toplam Yağ</b></span>
              <b>{current.nutritionPer100g.fat}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0 5px 16px', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13px', color: theme.colors.taupe }}>
              <span>- Doymuş Yağ</span>
              <span>{current.nutritionPer100g.saturatedFat}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
              <span><b>Karbonhidrat</b></span>
              <b>{current.nutritionPer100g.carbs}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0 5px 16px', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13px', color: theme.colors.taupe }}>
              <span>- Şekerler</span>
              <span>{current.nutritionPer100g.sugar}</span>
            </div>

            {current.nutritionPer100g.fiber && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
                <span><b>Lif</b></span>
                <b>{current.nutritionPer100g.fiber}</b>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${theme.colors.border}`, fontSize: '13.5px', color: theme.colors.espresso }}>
              <span><b>Protein</b></span>
              <b>{current.nutritionPer100g.protein}</b>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `2px solid ${theme.colors.espresso}`, fontSize: '13.5px', color: theme.colors.espresso }}>
              <span><b>Tuz / Sodyum</b></span>
              <b>{current.nutritionPer100g.salt}</b>
            </div>

            <div style={{ fontSize: '11px', color: theme.colors.taupe, marginTop: '10px' }}>
              * Günlük referans alım değeri (BRD) 8400 kJ / 2000 kcal baz alınarak hesaplanmıştır.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. STT / TETT VE PARTİ (LOT) TAKİBİ SAYFASI
// ==========================================
export const LotExpiryTrackingPage: React.FC = () => {
  const lotRecords = [
    {
      lotNo: 'LOT-2026-1102-KAS',
      productName: 'Trakya Eski Kaşar Peyniri 350g',
      producedAt: '02.10.2026',
      expiryDate: '12.11.2026',
      daysLeft: 6,
      quantity: '34 Adet',
      autoDiscount: '%30 Flaş İndirim',
      status: 'Kritik Raf Ömrü',
      statusColor: theme.colors.statusDanger,
      statusBg: theme.colors.statusDangerBg,
    },
    {
      lotNo: 'LOT-2026-1025-EGG',
      productName: 'Organik Köy Yumurtası 10\'lu',
      producedAt: '25.10.2026',
      expiryDate: '15.11.2026',
      daysLeft: 9,
      quantity: '60 Paket',
      autoDiscount: '%20 İndirim Uygulandı',
      status: 'Yaklaşan STT',
      statusColor: theme.colors.statusWarning,
      statusBg: theme.colors.statusWarningBg,
    },
    {
      lotNo: 'LOT-2026-1015-BTR',
      productName: 'Doğal Yayık Köy Tereyağı 500g',
      producedAt: '15.10.2026',
      expiryDate: '28.11.2026',
      daysLeft: 22,
      quantity: '28 Kg',
      autoDiscount: 'Normal Fiyat',
      status: 'Güvenli Süre',
      statusColor: theme.colors.statusSuccess,
      statusBg: theme.colors.statusSuccessBg,
    },
    {
      lotNo: 'LOT-2026-0920-OIL',
      productName: 'Soğuk Sıkım Sızma Zeytinyağı 500ml',
      producedAt: '20.09.2026',
      expiryDate: '20.09.2027',
      daysLeft: 318,
      quantity: '142 Adet',
      autoDiscount: 'Normal Fiyat',
      status: 'Uzun Raf Ömrü',
      statusColor: theme.colors.primary,
      statusBg: theme.colors.primarySubtle,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: theme.colors.espresso, margin: 0, letterSpacing: '-0.3px' }}>
            Son Tüketim Tarihi (STT / TETT) ve Parti (Lot) Takibi
          </h1>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: theme.radii.full, backgroundColor: theme.colors.statusWarningBg, color: theme.colors.statusWarning, border: '1px solid #FDF0E2' }}>
            Parti & SKT Kontrolü
          </span>
        </div>
        <p style={{ fontSize: '13.5px', color: theme.colors.taupe, marginTop: '6px', marginBottom: 0 }}>
          Parti numarası (Lot) yönetimi ve raf ömrü yaklaşan taze gıda ürünleri için otomatik indirim ve erken uyarı kuralları.
        </p>
      </div>

      {/* Auto Discount Rules Summary */}
      <div style={{ backgroundColor: theme.colors.bgCard, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border}`, padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.espresso, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚡</span> Otomatik İndirim ve Erken Uyarı Motoru Kuralları
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.statusDangerBg, border: '1px solid #F5D3CE' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.statusDanger }}>🚨 Kural 1: Son 7 Gün</div>
            <div style={{ fontSize: '12px', color: theme.colors.espresso, marginTop: '4px' }}>
              STT'sine 7 günden az kalan ürünlere anında <b>%30 Otomatik Sepet İndirimi</b> tanımlanır ve "Taze Fırsat" rozeti eklenir.
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.statusWarningBg, border: '1px solid #FDF0E2' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.statusWarning }}>⚠️ Kural 2: Son 15 Gün</div>
            <div style={{ fontSize: '12px', color: theme.colors.espresso, marginTop: '4px' }}>
              STT'sine 15 gün kalan süt ve şarküteri ürünlerine <b>%15 Flaş İndirim</b> tanımlanır ve depo sorumlusuna bildirim düşer.
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: theme.radii.sm, backgroundColor: theme.colors.bgSurface, border: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.colors.cedar }}>🛑 Kural 3: Son 48 Saat</div>
            <div style={{ fontSize: '12px', color: theme.colors.espresso, marginTop: '4px' }}>
              Otomatik satış kapatılır; ürün sistemde rezerve edilerek <b>Karantina / İade / Aşevi</b> çıkış listesine aktarılır.
            </div>
          </div>
        </div>
      </div>

      {/* Lot Tracking Table */}
      <div
        style={{
          backgroundColor: theme.colors.bgCard,
          borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme.colors.espresso, margin: 0 }}>
            Aktif Parti (Lot) ve Raf Ömrü Listesi
          </h3>
          <span style={{ fontSize: '12px', color: theme.colors.taupe }}>FIFO (İlk Giren İlk Çıkar) sıralı</span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '860px',
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
                <th style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {lotRecords.map((lot, idx) => (
                <tr
                  key={idx}
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
                    {lot.lotNo}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontWeight: 600,
                      color: theme.colors.espresso,
                      verticalAlign: 'middle',
                    }}
                  >
                    {lot.productName}
                  </td>
                  <td style={{ padding: '14px 16px', color: theme.colors.taupe, verticalAlign: 'middle' }}>
                    {lot.producedAt}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      fontWeight: 600,
                      color: theme.colors.espresso,
                      verticalAlign: 'middle',
                    }}
                  >
                    {lot.expiryDate}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 9px',
                        borderRadius: theme.radii.xs,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        backgroundColor: lot.statusBg,
                        color: lot.statusColor,
                        border: `1px solid ${lot.statusColor}33`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>⏳</span> {lot.daysLeft} Gün Kaldı
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: theme.colors.espresso, verticalAlign: 'middle' }}>
                    {lot.quantity}
                  </td>
                  <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: lot.autoDiscount.includes('%') ? '3px 8px' : '0',
                        borderRadius: theme.radii.xs,
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: lot.autoDiscount.includes('%') ? theme.colors.statusDangerBg : 'transparent',
                        color: lot.autoDiscount.includes('%') ? theme.colors.statusDanger : theme.colors.taupe,
                        border: lot.autoDiscount.includes('%') ? '1px solid #F5D3CE' : 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {lot.autoDiscount.includes('%') && <span>⚡</span>}
                      {lot.autoDiscount}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', verticalAlign: 'middle' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: theme.radii.full,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        backgroundColor: lot.statusBg,
                        border: `1px solid ${lot.statusColor}`,
                        color: lot.statusColor,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: lot.statusColor,
                          flexShrink: 0,
                        }}
                      />
                      {lot.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
