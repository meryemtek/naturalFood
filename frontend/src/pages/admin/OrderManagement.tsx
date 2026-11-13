import React, { useEffect, useState, type FormEvent } from 'react';
import { adminApi, type AdminOrderView } from '../../api/adminApi';
import { orderStatuses, requestStatuses, type Workflow, type Invoice } from '../../api/storefront/orderWorkflowApi';
import { InvoicePreview } from '../../components/orders/OrderWorkflowView';
import { usePermissions } from '../../context/PermissionContext';
import { money } from '../../api/storefront/storefrontApi';
import { theme } from '../../theme/tokens';

const transitions: Record<string, string[]> = {
  PendingPayment: ['Paid', 'Cancelled'],
  Paid: ['Preparing', 'Cancelled'],
  Preparing: ['Shipped', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
};

const COLD_CHAIN_KEYWORDS = [
  'yumurta', 'süt', 'sut', 'peynir', 'tereyağ', 'tereyag', 'yoğurt', 'yogurt',
  'kaymak', 'et', 'tavuk', 'balık', 'balik', 'sucuk', 'kavurma', 'pastırma',
  'pastirma', 'zeytinyağı', 'zeytinyagi', 'soğuk', 'soguk', 'taze', 'lor', 'tulum'
];

export function isColdChainOrder(lines: { name: string; sku: string }[]): boolean {
  return lines.some((l) => {
    const text = `${l.name} ${l.sku}`.toLowerCase();
    return COLD_CHAIN_KEYWORDS.some((kw) => text.includes(kw));
  });
}

export function formatShortOrderNumber(num: string): string {
  if (!num) return '#NF-000000';
  const clean = num.replace(/^#NF-/i, '');
  const last6 = clean.length > 6 ? clean.slice(-6) : clean;
  return `#NF-${last6.toUpperCase()}`;
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  } catch {
    return isoString;
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'PendingPayment':
      return 'status-pill status-pill--pending-payment';
    case 'Paid':
      return 'status-pill status-pill--paid';
    case 'Preparing':
    case 'Processing':
      return 'status-pill status-pill--preparing';
    case 'Shipped':
      return 'status-pill status-pill--shipped';
    case 'Delivered':
    case 'Completed':
      return 'status-pill status-pill--delivered';
    case 'Cancelled':
    case 'Refunded':
    case 'Returned':
      return 'status-pill status-pill--cancelled';
    default:
      return 'status-pill';
  }
}

export interface OrderDrawerProps {
  orderItem: AdminOrderView;
  onClose: () => void;
  onUpdated: () => void;
}

/** 2-Column Order Management Drawer */
export const OrderDrawer: React.FC<OrderDrawerProps> = ({ orderItem, onClose, onUpdated }) => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('orders.manage');

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [eta, setEta] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  const orderId = orderItem.order.id;
  const currentStatus = orderItem.order.status;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ ${label}`);
  };

  // Close drawer on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Load workflow
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const val = await adminApi.orderWorkflow(orderId, controller.signal);
        if (!controller.signal.aborted) {
          setWorkflow(val);
          if (val.shipment) {
            setCarrier(val.shipment.carrier || '');
            setTrackingNumber(val.shipment.trackingNumber || '');
            setTrackingUrl(val.shipment.trackingUrl || '');
            if (val.shipment.estimatedDeliveryUtc) {
              try {
                const d = new Date(val.shipment.estimatedDeliveryUtc);
                setEta(d.toISOString().slice(0, 16));
              } catch {
                // ignore
              }
            }
          }
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Sipariş detayları yüklenemedi.');
        }
      } finally {
        pending = false;
      }
    };
    void load();
    return () => controller.abort();
  }, [orderId, currentStatus, refresh]);

  useEffect(() => {
    setNext('');
  }, [currentStatus]);

  const act = async (action: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      setRefresh((n) => n + 1);
      onUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İşlem tamamlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusUpdate = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => {
      await adminApi.updateOrderStatus(orderId, {
        expectedStatus: currentStatus,
        status: next,
        note,
        carrier,
        trackingNumber,
        trackingUrl,
        estimatedDeliveryUtc: eta ? new Date(eta).toISOString() : null,
      });
      setNext('');
      setNote('');
      showToast('✓ Sipariş durumu başarıyla güncellendi.');
    });
  };

  const handleIssueInvoice = async () => {
    await act(async () => {
      await adminApi.issueDemoInvoice(orderId);
      const inv = await adminApi.orderInvoice(orderId);
      setInvoice(inv);
      setShowInvoice(true);
      showToast('✓ Demo e-arşiv fatura düzenlendi.');
    });
  };

  const handleViewInvoice = async () => {
    await act(async () => {
      const inv = await adminApi.orderInvoice(orderId);
      setInvoice(inv);
      setShowInvoice(true);
    });
  };

  const shortCode = formatShortOrderNumber(orderItem.order.number);
  const coldChainRequired = isColdChainOrder(orderItem.order.lines);
  const allowedTransitions = transitions[currentStatus] || [];

  return (
    <div className="order-drawer-backdrop" onClick={onClose}>
      <aside
        className="order-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        aria-label="Sipariş Yönetim Çekmecesi"
      >
        {/* Toast */}
        {toastMessage && <div className="order-toast">{toastMessage}</div>}

        {/* Drawer Header */}
        <header className="order-drawer-header">
          <div className="order-drawer-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="order-code-badge" title={orderItem.order.number}>
                {shortCode}
              </span>
              <button
                type="button"
                className="order-copy-btn"
                title="Sipariş kodunu kopyala"
                onClick={() => copyToClipboard(orderItem.order.number, 'Sipariş kodu kopyalandı')}
              >
                📋
              </button>
            </div>

            <span className={getStatusBadgeClass(currentStatus)}>
              {orderStatuses[currentStatus] ?? currentStatus}
            </span>

            <span className={orderItem.isGuest ? 'customer-tag customer-tag--guest' : 'customer-tag customer-tag--member'}>
              {orderItem.isGuest ? 'Misafir Müşteri' : 'Üye Müşteri'}
            </span>

            <span style={{ fontSize: '12.5px', color: theme.colors.taupe }}>
              {formatDateTime(orderItem.order.createdAtUtc)}
            </span>
          </div>

          <button
            type="button"
            className="order-drawer-close-btn"
            onClick={onClose}
            title="Kapat (ESC)"
          >
            ✕
          </button>
        </header>

        {/* Drawer Scrollable Content */}
        <div className="order-drawer-content">
          {error && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '12px 16px',
                backgroundColor: theme.colors.statusDangerBg,
                color: theme.colors.statusDanger,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radii.sm,
                fontSize: '13.5px',
              }}
            >
              <strong>Uyarı:</strong> {error}
            </div>
          )}

          {/* ======================================================== */}
          {/* SOL SÜTUN (Sipariş İçeriği)                              */}
          {/* ======================================================== */}
          <div className="order-drawer-col">
            {/* 1. Ürünler Tablosu */}
            <section className="drawer-card">
              <h3 className="drawer-card-title">
                <span>🛒</span>
                Sipariş Edilen Ürünler ({orderItem.order.lines.length} Kalem)
              </h3>
              <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.colors.border}`, color: theme.colors.taupe }}>
                      <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: 600 }}>Ürün</th>
                      <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: 600 }}>SKU</th>
                      <th style={{ textAlign: 'center', padding: '8px 4px', fontWeight: 600 }}>Adet</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600 }}>Birim Fiyat</th>
                      <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600 }}>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItem.order.lines.map((line, idx) => (
                      <tr key={`${line.sku}-${idx}`} style={{ borderBottom: `1px solid ${theme.colors.borderSubtle}` }}>
                        <td style={{ padding: '10px 4px', fontWeight: 600, color: theme.colors.espresso }}>
                          {line.name}
                        </td>
                        <td style={{ padding: '10px 4px', color: theme.colors.taupe, fontFamily: 'monospace', fontSize: '12px' }}>
                          {line.sku}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'center', color: theme.colors.espresso }}>
                          {line.quantity}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', color: theme.colors.taupe }}>
                          {money(line.unitPrice)}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: theme.colors.espresso }}>
                          {money(line.unitPrice * line.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tutar Özeti */}
              <div className="order-summary-rows">
                <div className="order-summary-row">
                  <span>Ara Toplam</span>
                  <strong>{money(orderItem.order.subtotal)}</strong>
                </div>
                {orderItem.order.discount > 0 && (
                  <div className="order-summary-row" style={{ color: theme.colors.statusSuccess }}>
                    <span>İndirim {orderItem.order.couponCode ? `(${orderItem.order.couponCode})` : ''}</span>
                    <strong>-{money(orderItem.order.discount)}</strong>
                  </div>
                )}
                <div className="order-summary-row">
                  <span>Kargo Ücreti</span>
                  <span>{orderItem.order.shippingFee === 0 ? 'Ücretsiz Kargo' : money(orderItem.order.shippingFee)}</span>
                </div>
                <div className="order-summary-row order-summary-row--total">
                  <span>Genel Toplam</span>
                  <span style={{ color: theme.colors.primary, fontSize: '17px' }}>
                    {money(orderItem.order.total)}
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Soğuk Zincir Gereksinimi Uyarısı */}
            {coldChainRequired && (
              <section className="cold-chain-card" role="alert">
                <span className="cold-chain-icon">🧊</span>
                <div>
                  <div className="cold-chain-title">Soğuk Zincir & Hassas Taşıma Uyarısı</div>
                  <p className="cold-chain-desc">
                    Bu sipariş taze/soğuk gıda ürünleri içermektedir (ör. peynir, yumurta, tereyağı veya taze şarküteri).
                    Bozulmayı önlemek için <strong>ısı yalıtımlı ambalaj ve buz aküsü desteğiyle</strong> sevk edilmelidir.
                  </p>
                </div>
              </section>
            )}

            {/* 3. Teslimat & Fatura Adresi */}
            <section className="drawer-card">
              <h3 className="drawer-card-title">
                <span>📍</span>
                Teslimat ve Fatura Bilgileri
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                <div style={{ padding: '12px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.colors.primary, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🚚</span> Teslimat Adresi
                  </div>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: theme.colors.espresso, lineHeight: '1.4' }}>
                    {orderItem.deliveryAddress || 'Belirtilmedi'}
                  </p>
                  <div style={{ fontSize: '12px', color: theme.colors.taupe }}>
                    Müşteri: <strong>{orderItem.email}</strong> · {orderItem.phone}
                  </div>
                </div>

                <div style={{ padding: '12px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}` }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: theme.colors.cedar, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🧾</span> Fatura Adresi
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: theme.colors.espresso, lineHeight: '1.4' }}>
                    {orderItem.billingAddress || orderItem.deliveryAddress || 'Teslimat adresiyle aynı'}
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Demo E-Arşiv Fatura */}
            <section className="drawer-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 className="drawer-card-title" style={{ margin: 0 }}>
                    <span>📄</span> Demo E-Arşiv Fatura
                  </h3>
                  <p style={{ fontSize: '12px', color: theme.colors.stoneMuted, margin: '2px 0 0 0' }}>
                    {workflow?.invoice
                      ? `Belge No: ${workflow.invoice.number} (${formatDateTime(workflow.invoice.issuedAtUtc)})`
                      : 'Bu sipariş için henüz demo fatura kesilmedi.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {workflow?.invoice ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleViewInvoice()}
                      style={{
                        padding: '8px 14px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.primary}`,
                        backgroundColor: showInvoice ? theme.colors.primary : theme.colors.bgSurface,
                        color: showInvoice ? '#FFFFFF' : theme.colors.primary,
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {showInvoice ? 'Faturayı Gizle' : 'Demo E-Arşiv Fatura Önizle'}
                    </button>
                  ) : canManage && ['Paid', 'Preparing', 'Processing', 'Shipped', 'Delivered', 'Completed'].includes(currentStatus) ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleIssueInvoice()}
                      style={{
                        padding: '8px 14px',
                        borderRadius: theme.radii.sm,
                        border: 'none',
                        backgroundColor: theme.colors.primary,
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Demo E-Arşiv Faturası Oluştur
                    </button>
                  ) : null}
                </div>
              </div>

              {showInvoice && invoice && (
                <div style={{ marginTop: '16px' }}>
                  <InvoicePreview data={invoice} />
                </div>
              )}
            </section>
          </div>

          {/* ======================================================== */}
          {/* SAĞ SÜTUN (Operasyon & Durum Yönetimi)                   */}
          {/* ======================================================== */}
          <div className="order-drawer-col">
            {/* 1. Sipariş Durumunu Güncelle */}
            {canManage && allowedTransitions.length > 0 && (
              <section className="drawer-card">
                <h3 className="drawer-card-title">
                  <span>⚙️</span>
                  Sipariş Durumunu Güncelle
                </h3>

                <form onSubmit={handleStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.cedar, marginBottom: '6px' }}>
                      Yeni Durum <span style={{ color: theme.colors.statusDanger }}>*</span>
                    </label>
                    <select
                      required
                      value={next}
                      onChange={(e) => setNext(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: '#FFFFFF',
                        color: theme.colors.espresso,
                        fontSize: '13.5px',
                      }}
                    >
                      <option value="">Durum seçiniz...</option>
                      {allowedTransitions.map((val) => (
                        <option key={val} value={val}>
                          {orderStatuses[val] ?? val}
                        </option>
                      ))}
                    </select>
                  </div>

                  {next === 'Paid' && (
                    <div style={{ padding: '8px 12px', backgroundColor: theme.colors.statusWarningBg, border: `1px solid #F6DFC8`, borderRadius: theme.radii.sm, fontSize: '12px', color: theme.colors.statusWarning }}>
                      ℹ️ Bu işlem ödeme tahsil etmez. Demo veya harici ödeme doğrulamasını açıklamada belirtiniz.
                    </div>
                  )}

                  {next === 'Cancelled' && (
                    <div style={{ padding: '8px 12px', backgroundColor: theme.colors.statusDangerBg, border: `1px solid #F5C6C0`, borderRadius: theme.radii.sm, fontSize: '12px', color: theme.colors.statusDanger }}>
                      ⚠️ İptal durumunda rezervasyon ve stoklar otomatik geri yüklenir.
                    </div>
                  )}

                  {/* Kargo Bilgileri (Shipped durumunda) */}
                  {next === 'Shipped' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}` }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: theme.colors.primary }}>
                        🚚 Sevkiyat ve Kargo Bilgileri
                      </div>

                      {/* Hızlı Kargo Firması Seçimi */}
                      <div>
                        <div style={{ fontSize: '11.5px', color: theme.colors.taupe, marginBottom: '6px' }}>Hızlı Kargo Firması Seç:</div>
                        <div className="carrier-quick-buttons">
                          {['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'Sürat Kargo', 'PTT Kargo'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              className="carrier-chip-btn"
                              onClick={() => setCarrier(c)}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <input
                          required
                          placeholder="Kargo Firması Adı *"
                          maxLength={150}
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: theme.radii.sm,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: '#FFFFFF',
                            fontSize: '13px',
                          }}
                        />
                      </div>

                      <div>
                        <input
                          required
                          placeholder="Takip Numarası *"
                          maxLength={150}
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: theme.radii.sm,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: '#FFFFFF',
                            fontSize: '13px',
                          }}
                        />
                      </div>

                      <div>
                        <input
                          type="url"
                          placeholder="Takip Bağlantısı (https://...)"
                          maxLength={1000}
                          value={trackingUrl}
                          onChange={(e) => setTrackingUrl(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: theme.radii.sm,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: '#FFFFFF',
                            fontSize: '13px',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: theme.colors.taupe, marginBottom: '4px' }}>
                          Tahmini Teslimat Tarihi:
                        </label>
                        <input
                          type="datetime-local"
                          value={eta}
                          onChange={(e) => setEta(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: theme.radii.sm,
                            border: `1px solid ${theme.colors.border}`,
                            backgroundColor: '#FFFFFF',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Müşteriye Açıklama */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: theme.colors.cedar, marginBottom: '6px' }}>
                      Müşteriye Açıklama {next === 'Paid' || next === 'Cancelled' ? <span style={{ color: theme.colors.statusDanger }}>*</span> : '(İsteğe Bağlı)'}
                    </label>
                    <textarea
                      required={next === 'Paid' || next === 'Cancelled'}
                      placeholder="Müşteri sipariş takip ekranında görünecek açıklama notu..."
                      maxLength={800}
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: theme.radii.sm,
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: '#FFFFFF',
                        color: theme.colors.espresso,
                        fontSize: '13px',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !next}
                    style={{
                      padding: '11px 20px',
                      borderRadius: theme.radii.sm,
                      border: 'none',
                      backgroundColor: theme.colors.primary,
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: busy || !next ? 'not-allowed' : 'pointer',
                      opacity: busy || !next ? 0.5 : 1,
                      transition: 'background-color 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {busy ? 'Güncelleniyor...' : 'Durumu Güncelle'}
                  </button>
                </form>
              </section>
            )}

            {/* 2. İptal / İade Talebi Değerlendirme (varsa) */}
            {canManage && workflow?.requests && workflow.requests.length > 0 && (
              <section className="drawer-card">
                <h3 className="drawer-card-title">
                  <span>↩️</span>
                  İptal ve İade Talepleri
                </h3>
                {workflow.requests.map((item) => (
                  <div key={item.id} style={{ marginBottom: '14px', padding: '12px', backgroundColor: theme.colors.bgSurface, borderRadius: theme.radii.sm, border: `1px solid ${theme.colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px', color: theme.colors.espresso }}>
                        {item.kind === 'Cancellation' ? 'İptal Talebi' : 'İade Talebi'}
                      </strong>
                      <span className={item.status === 'Pending' ? 'order-status-pill order-status-pill--warn' : 'order-status-pill'}>
                        {requestStatuses[item.status] ?? item.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: theme.colors.cedar }}>
                      {item.reason}
                    </p>
                    <small style={{ color: theme.colors.stoneMuted, fontSize: '11.5px' }}>
                      {formatDateTime(item.createdAtUtc)}
                    </small>

                    {item.response && (
                      <div style={{ marginTop: '6px', fontSize: '12.5px', color: theme.colors.primary, fontWeight: 600 }}>
                        Yanıt: {item.response}
                      </div>
                    )}

                    {item.status === 'Pending' && (
                      <RequestDecisionForm
                        busy={busy}
                        kind={item.kind}
                        onResolve={(decision, response) =>
                          void act(async () => {
                            await adminApi.resolveOrderRequest(orderId, item.id, decision, response);
                            showToast('✓ Talep kararı kaydedildi.');
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* 3. Kargo ve Teslimat Bilgisi (Mevcut Sevkiyat) */}
            {workflow?.shipment && (
              <section className="drawer-card">
                <h3 className="drawer-card-title">
                  <span>🚚</span>
                  Kargo Takip Bilgisi
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: theme.colors.taupe, fontSize: '12px', display: 'block' }}>Kargo Firması</span>
                    <strong>{workflow.shipment.carrier}</strong>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.taupe, fontSize: '12px', display: 'block', marginBottom: '3px' }}>Takip Kodu</span>
                    <span className="order-tracking-code">
                      {workflow.shipment.trackingNumber}
                      <button
                        type="button"
                        className="order-copy-btn"
                        onClick={() => copyToClipboard(workflow.shipment!.trackingNumber, 'Kargo takip no kopyalandı')}
                        title="Takip kodunu kopyala"
                      >
                        📋
                      </button>
                    </span>
                  </div>
                  <div>
                    <span style={{ color: theme.colors.taupe, fontSize: '12px', display: 'block' }}>Tahmini Teslimat</span>
                    <span>{formatDateTime(workflow.shipment.estimatedDeliveryUtc)}</span>
                  </div>
                  {workflow.shipment.trackingUrl?.startsWith('https://') && (
                    <div style={{ marginTop: '6px' }}>
                      <a
                        href={workflow.shipment.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: theme.colors.primary,
                          fontWeight: 600,
                          fontSize: '12.5px',
                          textDecoration: 'none',
                        }}
                      >
                        Kargo Firmasında Takip Et ↗
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 4. Sipariş Hareketleri (Zaman Çizelgesi) */}
            <section className="drawer-card">
              <h3 className="drawer-card-title">
                <span>📈</span>
                Sipariş Hareketleri ({workflow?.history.length ?? 0})
              </h3>
              {workflow && workflow.history.length > 0 ? (
                <ol className="order-timeline">
                  {workflow.history.map((event) => (
                    <li key={event.id}>
                      <div className="order-timeline-head">
                        <strong style={{ color: theme.colors.espresso }}>
                          {orderStatuses[event.status] ?? event.status}
                        </strong>
                        <span>{formatDateTime(event.createdAtUtc)}</span>
                      </div>
                      {event.note && <p className="order-timeline-note">{event.note}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: theme.colors.taupe }}>
                  Henüz bir sipariş hareketi kaydedilmedi.
                </p>
              )}
            </section>

            {/* 5. Sistem & Bildirim Geçmişi (SMS / E-posta Logları) - Varsayılan KAPALI Akordeon */}
            <section className="notification-accordion">
              <details>
                <summary>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📬</span>
                    Sistem & Bildirim Geçmişi ({workflow?.notifications.length ?? 0})
                  </span>
                  <span style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>Tıkla ve Aç ▾</span>
                </summary>
                <div className="notification-accordion-body">
                  <div className="notification-disclaimer">
                    ℹ️ Bu kayıtlar sistem içi demo bildirimleridir. Harici SMS ve e-posta servislerine gönderim yapılmaz; belgeler mali geçerlilik taşımaz.
                  </div>

                  {workflow && workflow.notifications.length > 0 ? (
                    workflow.notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: theme.colors.bgSurface,
                          borderRadius: theme.radii.xs,
                          border: `1px solid ${theme.colors.border}`,
                          fontSize: '12.5px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: theme.colors.espresso }}>
                            {n.channel === 'Email' ? '📧 E-posta Bildirimi' : '💬 SMS Bildirimi'}
                          </span>
                          <span style={{ fontSize: '11px', color: theme.colors.stoneMuted }}>
                            {formatDateTime(n.createdAtUtc)}
                          </span>
                        </div>
                        <p style={{ margin: 0, color: theme.colors.cedar, lineHeight: '1.4' }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: '4px 0', fontSize: '12.5px', color: theme.colors.taupe }}>
                      Bu siparişe ait kayıtlı bildirim logu bulunmuyor.
                    </p>
                  )}
                </div>
              </details>
            </section>
          </div>
        </div>
      </aside>
    </div>
  );
};

function RequestDecisionForm({
  kind,
  busy,
  onResolve,
}: {
  kind: string;
  busy: boolean;
  onResolve: (decision: string, response: string) => void;
}) {
  const [response, setResponse] = useState('');
  const [decision, setDecision] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onResolve(decision, response);
      }}
      style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setDecision('Approved')}
          style={{
            flex: 1,
            padding: '7px',
            borderRadius: theme.radii.xs,
            border: decision === 'Approved' ? `2px solid ${theme.colors.statusSuccess}` : `1px solid ${theme.colors.border}`,
            backgroundColor: decision === 'Approved' ? theme.colors.statusSuccessBg : '#FFFFFF',
            color: decision === 'Approved' ? theme.colors.statusSuccess : theme.colors.espresso,
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          ✓ Talebi Onayla
        </button>
        <button
          type="button"
          onClick={() => setDecision('Rejected')}
          style={{
            flex: 1,
            padding: '7px',
            borderRadius: theme.radii.xs,
            border: decision === 'Rejected' ? `2px solid ${theme.colors.statusDanger}` : `1px solid ${theme.colors.border}`,
            backgroundColor: decision === 'Rejected' ? theme.colors.statusDangerBg : '#FFFFFF',
            color: decision === 'Rejected' ? theme.colors.statusDanger : theme.colors.espresso,
            fontWeight: 600,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          ✕ Talebi Reddet
        </button>
      </div>

      <textarea
        required
        placeholder={`${kind === 'Return' ? 'İade' : 'İptal'} değerlendirme gerekçesi ve müşteriye yanıt...`}
        maxLength={800}
        rows={2}
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: theme.radii.xs,
          border: `1px solid ${theme.colors.border}`,
          fontSize: '12.5px',
        }}
      />

      <button
        type="submit"
        disabled={busy || !response.trim() || !decision}
        style={{
          alignSelf: 'flex-start',
          padding: '6px 14px',
          borderRadius: theme.radii.xs,
          border: 'none',
          backgroundColor: theme.colors.primary,
          color: '#FFFFFF',
          fontSize: '12px',
          fontWeight: 600,
          cursor: busy || !response.trim() || !decision ? 'not-allowed' : 'pointer',
          opacity: busy || !response.trim() || !decision ? 0.5 : 1,
        }}
      >
        Kararı Kaydet
      </button>
    </form>
  );
}

/** Legacy wrapper if still invoked with simple (id, status, onUpdated) */
export function OrderManagement({
  id,
  status,
  onUpdated,
}: {
  id: string;
  status: string;
  onUpdated: () => void;
}) {
  const [data, setData] = useState<Workflow | null>(null);
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    void adminApi.orderWorkflow(id).then(setData).catch(() => {});
  }, [id, status]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!next) return;
    setBusy(true);
    try {
      await adminApi.updateOrderStatus(id, {
        expectedStatus: status,
        status: next,
        note,
        carrier: '',
        trackingNumber: '',
        trackingUrl: '',
        estimatedDeliveryUtc: null,
      });
      onUpdated();
    } finally {
      setBusy(false);
    }
  };

  const allowed = transitions[status] || [];

  return (
    <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E7E5E0' }}>
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ margin: 0, color: theme.colors.espresso }}>Hızlı Durum Güncelle</h4>
        <select
          value={next}
          onChange={(e) => setNext(e.target.value)}
          style={{ padding: '8px', border: '1px solid #E7E5E0', borderRadius: '4px' }}
        >
          <option value="">Durum seçiniz...</option>
          {allowed.map((s) => (
            <option key={s} value={s}>{orderStatuses[s] ?? s}</option>
          ))}
        </select>
        <textarea
          placeholder="Açıklama notu..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ padding: '8px', border: '1px solid #E7E5E0', borderRadius: '4px' }}
        />
        <button
          type="submit"
          disabled={busy || !next}
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            backgroundColor: theme.colors.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Güncelle
        </button>
      </form>
    </div>
  );
}
