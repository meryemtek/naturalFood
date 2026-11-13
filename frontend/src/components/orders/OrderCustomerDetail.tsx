import { useEffect, useState, type FormEvent } from 'react';
import type { Order } from '../../api/accountApi';
import { orderRequest, orderStatuses, type Workflow, type Invoice } from '../../api/storefront/orderWorkflowApi';
import { money } from '../../api/storefront/storefrontApi';
import { InvoicePreview, OrderWorkflowView } from './OrderWorkflowView';
import './orders-shared.css';

const TRACKING_STEPS = [
  { key: 'received', label: 'Sipariş Alındı' },
  { key: 'preparing', label: 'Hazırlanıyor' },
  { key: 'shipped', label: 'Kargoya Verildi' },
  { key: 'delivered', label: 'Teslim Edildi' },
] as const;

function getStepIndex(status: string): number {
  if (['Delivered', 'Completed'].includes(status)) return 3;
  if (status === 'Shipped') return 2;
  if (['Preparing', 'Processing'].includes(status)) return 1;
  if (['PendingPayment', 'Paid'].includes(status)) return 0;
  return -1;
}

export function OrderCustomerDetail({ initialOrder, guestKey }: { initialOrder: Order; guestKey?: string }) {
  const [order, setOrder] = useState(initialOrder);
  const [data, setData] = useState<Workflow | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        const [nextOrder, workflow] = await Promise.all([
          orderRequest<Order>(initialOrder.id, '', guestKey, { signal: controller.signal }),
          orderRequest<Workflow>(initialOrder.id, '/workflow', guestKey, { signal: controller.signal }),
        ]);
        if (!controller.signal.aborted) {
          setOrder(nextOrder);
          setData(workflow);
          setError('');
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Sipariş yenilenemedi.');
      } finally {
        pending = false;
      }
    };
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 15000);
    const focus = () => void load();
    window.addEventListener('focus', focus);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, [initialOrder.id, guestKey, refresh]);

  const kind = ['PendingPayment', 'Paid', 'Preparing', 'Processing'].includes(order.status)
    ? 'Cancellation'
    : ['Delivered', 'Completed'].includes(order.status)
      ? 'Return'
      : null;
  const canRequest = data && kind && !data.requests.some(item => item.kind === kind && ['Pending', 'Approved'].includes(item.status));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !canRequest || !reason.trim()) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await orderRequest<void>(order.id, '/requests', guestKey, {
        method: 'POST',
        body: JSON.stringify({ kind, reason: reason.trim() }),
      });
      setReason('');
      setNotice('Talebiniz alındı. Sonucunu bu ekrandan takip edebilirsiniz.');
      setRefresh(n => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Talep oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  const showInvoice = async () => {
    setBusy(true);
    try {
      setInvoice(await orderRequest<Invoice>(order.id, '/invoice', guestKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Belge yüklenemedi.');
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = getStepIndex(order.status);
  const isClosed = ['Cancelled', 'Refunded', 'Returned'].includes(order.status);
  const statusLabel = orderStatuses[order.status] ?? order.status;
  const closedMessage =
    order.status === 'Cancelled'
      ? 'Bu sipariş iptal edildi.'
      : order.status === 'Refunded'
        ? 'Bu siparişin ödemesi iade edildi.'
        : order.status === 'Returned'
          ? 'Bu sipariş iade edildi.'
          : null;
  const itemsSubtotal = order.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  return (
    <section className="account-card order-detail-shell">
      <div className="order-detail-header">
        <div>
          <div className="order-detail-title">
            <h2>Sipariş #{order.number}</h2>
          </div>
          <p className="account-muted" style={{ marginTop: '6px' }}>
            Sipariş Tarihi: {new Date(order.createdAtUtc).toLocaleString('tr-TR')}
          </p>
        </div>

        <div className="order-detail-actions">
          <span
            role="status"
            className={`order-status-pill ${
              isClosed ? 'order-status-pill--danger' : order.status === 'PendingPayment' ? 'order-status-pill--warn' : ''
            }`}
          >
            {statusLabel}
          </span>
          {data?.invoice && (
            <button type="button" className="account-primary" disabled={busy} onClick={showInvoice}>
              Demo Faturayı Görüntüle
            </button>
          )}
        </div>
      </div>

      {closedMessage && (
        <p role="status" className="account-error" style={{ margin: 0 }}>
          {closedMessage}
        </p>
      )}

      {stepIndex >= 0 && (
        <div className="order-stepper" aria-label="Sipariş aşamaları">
          {TRACKING_STEPS.map((step, idx) => {
            const stateClass = idx < stepIndex ? 'is-done' : idx === stepIndex ? 'is-current' : '';
            return (
              <div key={step.key} className={`order-step ${stateClass}`}>
                <span className="order-step-dot">{idx < stepIndex ? '✓' : idx + 1}</span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="account-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="account-notice">
          {notice}
        </p>
      )}

      <section className="order-panel">
        <h3>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shopping_bag</span>
          Sipariş İçeriği ({order.lines.length} kalem)
        </h3>
        <ul className="order-items-list">
          {order.lines.map((line, index) => (
            <li key={index}>
              <span>
                <strong>{line.name}</strong> × {line.quantity}
              </span>
              <strong>{money(line.unitPrice * line.quantity)}</strong>
            </li>
          ))}
        </ul>
        <div className="order-summary-rows">
          <div className="order-summary-row">
            <span>Ürünler Toplamı</span>
            <span>{money(itemsSubtotal)}</span>
          </div>
          <div className="order-summary-row">
            <span>Kargo Ücreti</span>
            <span>{money(order.shippingFee)}</span>
          </div>
          {order.discount > 0 && (
            <div className="order-summary-row">
              <span>İndirim</span>
              <span>-{money(order.discount)}</span>
            </div>
          )}
          <div className="order-summary-row order-summary-row--total">
            <span>Genel Toplam</span>
            <span>{money(order.total)}</span>
          </div>
        </div>
      </section>

      {data ? <OrderWorkflowView data={data} /> : !error && <p className="account-muted">Takip bilgileri yükleniyor…</p>}

      {canRequest && (
        <section className="order-panel">
          <form className="order-controls" onSubmit={submit}>
            <h3>{kind === 'Cancellation' ? 'İptal Talebi Oluştur' : 'İade Talebi Oluştur'}</h3>
            <label>
              Talep Nedeni
              <textarea
                required
                rows={3}
                maxLength={1000}
                placeholder="Talebinizle ilgili kısa bir açıklama yazın..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </label>
            <p className="account-muted" style={{ margin: 0 }}>
              Talebiniz yönetici değerlendirmesine alınır. Bu işlem otomatik ödeme iadesi başlatmaz.
            </p>
            <button disabled={busy || !reason.trim()}>{busy ? 'İşleniyor…' : 'Talebi Gönder'}</button>
          </form>
        </section>
      )}

      {invoice && <InvoicePreview data={invoice} />}
    </section>
  );
}
