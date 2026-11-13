import { OrderManagement } from './OrderManagement';
import { orderStatuses } from '../../api/storefront/orderWorkflowApi';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi, type AdminOrderPage } from '../../api/adminApi';
import { money } from '../../api/storefront/storefrontApi';
import './orders.css';

const statuses = orderStatuses;
export function OrdersPage() {
  const { pathname } = useLocation();
  const filter = pathname.split('/')[2] ?? '';
  return <OrderList key={filter} filter={filter} />;
}

function OrderList({ filter }: { filter: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminOrderPage | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [updated, setUpdated] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await adminApi.getOrders(page, filter, controller.signal);
        if (!controller.signal.aborted) { setData(result); setError(''); setUpdated(new Date().toLocaleTimeString('tr-TR')); }
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Siparişler yüklenemedi.');
      } finally { inFlight = false; }
    };
    void load();
    const interval = window.setInterval(() => { if (!document.hidden) void load(); }, 15000);
    const focus = () => void load();
    window.addEventListener('focus', focus);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', focus); };
  }, [page, filter, refresh]);
  const title = filter === 'pending' ? 'Bekleyen Siparişler' : filter === 'completed' ? 'Tamamlanan Siparişler' : filter === 'returns' ? 'İptal ve İadeler' : 'Tüm Siparişler';
  return <main className="admin-orders">
    <header><div><h1>{title}</h1><p>Üye ve misafir siparişleri · 15 saniyede bir güncellenir{updated && ` · Son güncelleme: ${updated}`}</p></div><button onClick={() => setRefresh(value => value + 1)}>Yenile</button></header>
    {error && <p role="alert" className="orders-error">{error} {data && 'Son yüklenen bilgiler gösteriliyor.'}</p>}
    {!data && !error && <p role="status">Siparişler yükleniyor…</p>}
    {data && <>
      <p>{data.total} sipariş</p>
      {data.items.length === 0 && <p>Bu listede sipariş bulunmuyor.</p>}
      {data.items.map(item => <article className="order-card" key={item.order.id}>
        <header><div><h2>Sipariş #{item.order.number}</h2><p>{new Date(item.order.createdAtUtc).toLocaleString('tr-TR')} · {item.isGuest ? 'Misafir müşteri' : 'Üye müşteri'}</p></div><strong>{statuses[item.order.status] ?? item.order.status}</strong></header>
        <p>{item.email} · {item.phone}</p>
        <p className="order-total">Toplam: {money(item.order.total)}</p>
        <details onToggle={event => { const open = event.currentTarget.open; setExpanded(previous => ({ ...previous, [item.order.id]: open })); }}><summary>Sipariş yönetimi, ürünler ve adres bilgileri</summary>
          <div className="order-addresses"><div><h3>Teslimat adresi</h3><p>{item.deliveryAddress}</p></div><div><h3>Fatura adresi</h3><p>{item.billingAddress}</p></div></div>
          <div className="order-table"><table><thead><tr><th>Ürün</th><th>SKU</th><th>Adet</th><th>Birim fiyat</th><th>Tutar</th></tr></thead><tbody>{item.order.lines.map((line, index) => <tr key={`${line.sku}-${index}`}><td>{line.name}</td><td>{line.sku}</td><td>{line.quantity}</td><td>{money(line.unitPrice)}</td><td>{money(line.unitPrice * line.quantity)}</td></tr>)}</tbody></table></div>
          <p>Ürünler: {money(item.order.subtotal)} · İndirim: {money(item.order.discount)} · Kargo: {money(item.order.shippingFee)}</p>
          {expanded[item.order.id] && <OrderManagement id={item.order.id} status={item.order.status} onUpdated={() => setRefresh(value => value + 1)} />}
        </details>
      </article>)}
      <nav aria-label="Sipariş sayfaları"><button disabled={page === 1} onClick={() => { setData(null); setPage(value => value - 1); }}>Önceki</button><span>Sayfa {page} / {Math.max(1, Math.ceil(data.total / data.pageSize))}</span><button disabled={page * data.pageSize >= data.total} onClick={() => { setData(null); setPage(value => value + 1); }}>Sonraki</button></nav>
    </>}
  </main>;
}
