import { type Workflow, type Invoice, orderStatuses, requestStatuses } from '../../api/storefront/orderWorkflowApi';
import { money } from '../../api/storefront/storefrontApi';
import './orders-shared.css';

export function OrderWorkflowView({ data }: { data: Workflow }) {
  return (
    <div className="order-workflow">
      <div className="order-detail-grid">
        <section className="order-panel">
          <h3>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>local_shipping</span>
            Kargo ve Teslimat
          </h3>
          {data.shipment ? (
            <div className="order-shipment-box">
              <div>
                <span style={{ color: '#696e65', fontSize: '12px', display: 'block' }}>Kargo Firması</span>
                <strong>{data.shipment.carrier}</strong>
              </div>
              <div>
                <span style={{ color: '#696e65', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Takip Numarası</span>
                <span className="order-tracking-code">{data.shipment.trackingNumber}</span>
              </div>
              <div>
                <span style={{ color: '#696e65', fontSize: '12px', display: 'block' }}>Tahmini Teslimat</span>
                <span>
                  {data.shipment.estimatedDeliveryUtc
                    ? new Date(data.shipment.estimatedDeliveryUtc).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Henüz belirtilmedi'}
                </span>
              </div>
              {data.shipment.trackingUrl?.startsWith('https://') && (
                <div>
                  <a
                    className="account-outline"
                    style={{ display: 'inline-block', textDecoration: 'none' }}
                    href={data.shipment.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Kargo Firmasında Takip Et ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <p className="account-muted" style={{ margin: 0 }}>
              Siparişiniz hazırlanıyor. Kargoya verildiğinde takip numarası burada görünecektir.
            </p>
          )}
        </section>

        <section className="order-panel">
          <h3>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment_return</span>
            İptal ve İade Talepleri
          </h3>
          {data.requests.length ? (
            data.requests.map(item => (
              <div className="order-request" key={item.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <strong>{item.kind === 'Cancellation' ? 'İptal Talebi' : 'İade Talebi'}</strong>
                  <span className="order-status-pill">{requestStatuses[item.status] ?? item.status}</span>
                </div>
                <p style={{ margin: '4px 0', color: '#252b25' }}>{item.reason}</p>
                <small style={{ color: '#696e65' }}>{new Date(item.createdAtUtc).toLocaleString('tr-TR')}</small>
                {item.response && (
                  <p style={{ margin: '6px 0 0', fontWeight: 600, color: '#294532' }}>Yanıt: {item.response}</p>
                )}
              </div>
            ))
          ) : (
            <p className="account-muted" style={{ margin: 0 }}>
              Bu sipariş için oluşturulmuş bir iptal veya iade talebi bulunmuyor.
            </p>
          )}
        </section>
      </div>

      <section className="order-panel">
        <h3>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timeline</span>
          Sipariş Hareketleri
        </h3>
        {data.history.length > 0 ? (
          <ol className="order-timeline">
            {data.history.map(event => (
              <li key={event.id}>
                <div className="order-timeline-head">
                  <strong>{orderStatuses[event.status] ?? event.status}</strong>
                  <span>{new Date(event.createdAtUtc).toLocaleString('tr-TR')}</span>
                </div>
                {event.note && <p className="order-timeline-note">{event.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="account-muted" style={{ margin: 0 }}>
            Bu sipariş için kayıtlı hareket geçmişi henüz bulunmuyor.
          </p>
        )}
      </section>

      {data.notifications.length > 0 && (
        <section className="order-panel">
          <details>
            <summary>Bildirim Geçmişi ({data.notifications.length})</summary>
            <p className="account-muted" style={{ margin: '8px 0 12px' }}>
              Bu kayıtlar sistem içi demo bildirimleridir.
            </p>
            {data.notifications.map(item => (
              <div className="order-request" key={item.id}>
                <strong>{item.channel === 'Email' ? 'E-posta' : 'SMS'}</strong>
                <small style={{ color: '#696e65' }}> · {new Date(item.createdAtUtc).toLocaleString('tr-TR')}</small>
                <p style={{ margin: '4px 0 0' }}>{item.message}</p>
              </div>
            ))}
          </details>
        </section>
      )}
    </div>
  );
}

export function InvoicePreview({ data }: { data: Invoice }) {
  return (
    <section className="order-invoice" aria-label="Demo fatura">
      <h3>DEMO FATURA — MALİ BELGE DEĞİLDİR</h3>
      <p className="account-muted" style={{ marginTop: 0 }}>
        Bu belge yalnızca bilgilendirme amaçlı demo görüntülemedir.
      </p>
      <div style={{ display: 'grid', gap: '4px', marginBottom: '12px' }}>
        <div><strong>Belge No:</strong> {data.invoice.number}</div>
        <div><strong>Düzenleme Tarihi:</strong> {new Date(data.invoice.issuedAtUtc).toLocaleString('tr-TR')}</div>
        <div><strong>Alıcı:</strong> {data.email}</div>
        {data.billingAddress && <div><strong>Fatura Adresi:</strong> {data.billingAddress}</div>}
      </div>
      <ul className="order-items-list">
        {data.order.lines.map((line, index) => (
          <li key={index}>
            <span>{line.name} × {line.quantity}</span>
            <strong>{money(line.quantity * line.unitPrice)}</strong>
          </li>
        ))}
      </ul>
      <div className="order-summary-rows">
        <div className="order-summary-row"><span>Ürünler</span><span>{money(data.order.subtotal)}</span></div>
        <div className="order-summary-row"><span>İndirim</span><span>-{money(data.order.discount)}</span></div>
        <div className="order-summary-row"><span>Kargo</span><span>{money(data.order.shippingFee)}</span></div>
        <div className="order-summary-row order-summary-row--total"><span>Genel Toplam</span><span>{money(data.order.total)}</span></div>
      </div>
    </section>
  );
}
