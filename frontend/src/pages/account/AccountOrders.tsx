import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, type Order } from '../../api/accountApi';
import { money } from '../../api/storefront/storefrontApi';

const statuses: Record<string, string> = { PendingPayment: 'Ödeme Bekleniyor', Paid: 'Ödeme Alındı', Preparing: 'Hazırlanıyor', Shipped: 'Kargoya Verildi', Delivered: 'Teslim Edildi', Cancelled: 'İptal Edildi', Refunded: 'İade Edildi' };

export function AccountOrders({ orderId }: { orderId?: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setOrders(null); setError('');
    const load = orderId ? accountApi.order(orderId).then(order => [order]) : accountApi.orders();
    load.then(data => { if (active) setOrders(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Siparişler yüklenemedi.'); });
    return () => { active = false; };
  }, [orderId]);
  return <><div className="account-heading"><div><h1>{orderId ? 'Sipariş Detayı' : 'Siparişlerim'}</h1><p>Siparişlerinizi ve durumlarını görüntüleyin.</p></div></div>
    {error && <p className="account-error" role="alert">{error}</p>}
    {!orders && !error && <p className="account-muted">Siparişler yükleniyor...</p>}
    {orders?.length === 0 && <div className="account-card"><p>Henüz siparişiniz bulunmuyor.</p><Link to="/products" className="account-link">Ürünleri keşfedin</Link></div>}
    {orders?.map(order => <section className="account-card" key={order.id}><div className="account-row"><div><strong>Sipariş #{order.number}</strong><p className="account-muted">{new Date(order.createdAtUtc).toLocaleDateString('tr-TR')}</p></div><span className="account-tag">{statuses[order.status] || order.status}</span></div><div className="account-row"><span>{order.lines.reduce((n, line) => n + line.quantity, 0)} ürün</span><strong>{money(order.total)}</strong></div>{orderId ? <><ul className="account-list">{order.lines.map((line, index) => <li key={`${line.sku}-${index}`}><span>{line.name} × {line.quantity}</span><strong>{money(line.unitPrice * line.quantity)}</strong></li>)}</ul><p className="account-muted">Kargo: {money(order.shippingFee)} · İndirim: {money(order.discount)}</p><Link className="account-link" to="/hesabim/siparisler">Siparişlere dön</Link></> : <Link className="account-link" to={`/hesabim/siparisler/${order.id}`}>Sipariş detayını görüntüle</Link>}</section>)}
  </>;
}
