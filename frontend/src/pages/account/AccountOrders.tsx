import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, type Order } from '../../api/accountApi';
import { ensureAccessToken } from '../../api/authApi';
import { money } from '../../api/storefront/storefrontApi';
import { orderStatuses } from '../../api/storefront/orderWorkflowApi';
import { OrderCustomerDetail } from '../../components/orders/OrderCustomerDetail';

type OrderTab = 'all' | 'active' | 'completed' | 'closed';

const ACTIVE_STATUSES = new Set(['PendingPayment', 'Paid', 'Preparing', 'Processing', 'Shipped']);
const COMPLETED_STATUSES = new Set(['Delivered', 'Completed']);
const CLOSED_STATUSES = new Set(['Cancelled', 'Refunded']);

export function AccountOrders({ orderId }: { orderId?: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<OrderTab>('all');
  const [search, setSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    setOrders(null);
    setError('');
    const load = async () => {
      if (pending) return;
      pending = true;
      try {
        await ensureAccessToken();
        const data = orderId
          ? [await accountApi.order(orderId, controller.signal)]
          : await accountApi.orders(controller.signal);
        if (!controller.signal.aborted) {
          setOrders(data);
          setError('');
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : 'Siparişler yüklenemedi.');
        }
      } finally {
        pending = false;
      }
    };
    void load();
    // Detail component owns its own polling.
    const timer = orderId
      ? undefined
      : window.setInterval(() => {
          if (!document.hidden) void load();
        }, 15000);
    const focus = () => {
      if (!orderId) void load();
    };
    window.addEventListener('focus', focus);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, [orderId]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = search.trim().toLowerCase();
    return orders.filter(order => {
      if (tab === 'active' && !ACTIVE_STATUSES.has(order.status)) return false;
      if (tab === 'completed' && !COMPLETED_STATUSES.has(order.status)) return false;
      if (tab === 'closed' && !CLOSED_STATUSES.has(order.status)) return false;
      if (q && !order.number.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, tab, search]);

  return (
    <>
      <div className="account-heading">
        <div>
          <h1>{orderId ? 'Sipariş Detayı & Takip' : 'Siparişlerim & Sipariş Takibi'}</h1>
          <p>Sipariş durumunuz, kargo takibi ve iptal/iade talepleriniz otomatik olarak güncellenir.</p>
        </div>
      </div>

      {!orderId && orders && orders.length > 0 && (
        <section className="account-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(
                [
                  ['all', 'Tümü'],
                  ['active', 'Devam Eden & Kargoda'],
                  ['completed', 'Teslim Edilenler'],
                  ['closed', 'İptal / İade'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={tab === key ? 'account-primary' : 'account-outline'}
                  style={{ padding: '7px 12px', fontSize: '12px' }}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sipariş no ile ara..."
              aria-label="Sipariş numarası ile ara"
              style={{
                border: '1px solid #dfd1bd',
                borderRadius: '7px',
                background: '#f6eddb',
                padding: '8px 12px',
                fontSize: '13px',
                minWidth: 0,
                width: '100%',
                maxWidth: '260px',
                flex: '1 1 180px',
              }}
            />
          </div>
        </section>
      )}

      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      {!orders && !error && <p className="account-muted">Siparişler yükleniyor…</p>}
      {orders?.length === 0 && (
        <div className="account-card">
          <p>Henüz siparişiniz bulunmuyor.</p>
          <Link to="/products" className="account-link">
            Ürünleri keşfedin
          </Link>
        </div>
      )}

      {!orderId && orders && orders.length > 0 && filteredOrders.length === 0 && (
        <div className="account-card">
          <p>Seçilen filtreye veya aramaya uygun sipariş bulunamadı.</p>
        </div>
      )}

      {orderId
        ? orders?.map(order => (
            <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Link
                  to="/hesabim/siparisler"
                  className="account-outline"
                  title="Küçült"
                  aria-label="Küçült"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close_fullscreen</span>
                </Link>
              </div>
              <OrderCustomerDetail initialOrder={order} />
            </div>
          ))
        : filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            return (
              <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <section className="account-card">
                  <div className="account-row">
                    <div>
                      <strong>Sipariş #{order.number}</strong>
                      <p className="account-muted" style={{ marginTop: '4px' }}>
                        {new Date(order.createdAtUtc).toLocaleString('tr-TR')} · {order.lines?.length ?? 0} kalem ürün
                      </p>
                    </div>
                    <span className="account-tag">{orderStatuses[order.status] ?? order.status}</span>
                  </div>
                  <div className="account-row" style={{ marginTop: '14px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '15px' }}>{money(order.total)}</strong>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={isExpanded ? 'account-primary' : 'account-outline'}
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        {isExpanded ? 'Takibi Gizle' : 'Kargo & Takibi Yönet'}
                      </button>
                      <Link
                        className="account-outline"
                        to={`/hesabim/siparisler/${order.id}`}
                        title="Büyüt"
                        aria-label="Büyüt"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, textDecoration: 'none' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_full</span>
                      </Link>
                    </div>
                  </div>
                </section>
                {isExpanded && <OrderCustomerDetail initialOrder={order} />}
              </div>
            );
          })}

      {orderId && (
        <Link className="account-link" to="/hesabim/siparisler">
          Siparişlere dön
        </Link>
      )}
    </>
  );
}
