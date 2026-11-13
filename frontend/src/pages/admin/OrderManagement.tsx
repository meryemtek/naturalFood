import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../../api/adminApi';
import { orderStatuses, type Workflow, type Invoice } from '../../api/storefront/orderWorkflowApi';
import { InvoicePreview, OrderWorkflowView } from '../../components/orders/OrderWorkflowView';
import { usePermissions } from '../../context/PermissionContext';

const transitions: Record<string, string[]> = { PendingPayment: ['Paid', 'Cancelled'], Paid: ['Preparing', 'Cancelled'], Preparing: ['Shipped', 'Cancelled'], Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'] };
export function OrderManagement({ id, status, onUpdated }: { id: string; status: string; onUpdated: () => void }) {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('orders.manage');
  const [data, setData] = useState<Workflow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [eta, setEta] = useState('');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); let pending = false;
    const load = async () => {
      if (pending) return; pending = true;
      try { const value = await adminApi.orderWorkflow(id, controller.signal); if (!controller.signal.aborted) setData(value); }
      catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Detaylar yüklenemedi.'); }
      finally { pending = false; }
    };
    void load(); const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [id, status, refresh]);
  useEffect(() => { setNext(''); }, [status]);
  const act = async (action: () => Promise<unknown>) => {
    if (busy) return; setBusy(true); setError('');
    try { await action(); setRefresh(n => n + 1); onUpdated(); }
    catch (e) { setError(e instanceof Error ? e.message : 'İşlem tamamlanamadı.'); }
    finally { setBusy(false); }
  };
  const update = (event: FormEvent) => {
    event.preventDefault();
    void act(async () => { await adminApi.updateOrderStatus(id, { expectedStatus: status, status: next, note, carrier, trackingNumber, trackingUrl, estimatedDeliveryUtc: eta ? new Date(eta).toISOString() : null }); setNext(''); setNote(''); });
  };
  return <section>
    {error && <p role="alert" className="orders-error">{error}</p>}
    {data && <OrderWorkflowView data={data} />}
    {canManage && (transitions[status]?.length ?? 0) > 0 && <form className="order-controls" onSubmit={update}>
      <h3>Sipariş durumunu güncelle</h3>
      <label>Yeni durum<select required value={next} onChange={e => setNext(e.target.value)}><option value="">Seçin</option>{transitions[status].map(value => <option key={value} value={value}>{orderStatuses[value]}</option>)}</select></label>
      {next === 'Paid' && <p>Bu işlem ödeme tahsil etmez. Demo veya harici ödeme doğrulamasını açıklamada belirtin.</p>}
      {next === 'Cancelled' && <p>Stoklar geri yüklenir. Tahsil edilmiş tutarlar için ayrıca ödeme iadesi gerekir.</p>}
      <label>Müşteriye açıklama<textarea required={next === 'Paid' || next === 'Cancelled'} maxLength={800} value={note} onChange={e => setNote(e.target.value)} /></label>
      {next === 'Shipped' && <><label>Kargo firması<input required maxLength={150} value={carrier} onChange={e => setCarrier(e.target.value)} /></label><label>Takip numarası<input required maxLength={150} value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} /></label><label>Takip bağlantısı (HTTPS)<input type="url" maxLength={1000} value={trackingUrl} onChange={e => setTrackingUrl(e.target.value)} /></label><label>Tahmini teslimat<input type="datetime-local" value={eta} onChange={e => setEta(e.target.value)} /></label></>}
      <button disabled={busy || !next}>Durumu kaydet</button>
    </form>}
    {canManage && data?.requests.filter(item => item.status === 'Pending').map(item => <RequestDecision key={item.id} kind={item.kind} busy={busy} onResolve={(decision, response) => void act(() => adminApi.resolveOrderRequest(id, item.id, decision, response))} />)}
    <div className="order-controls"><p>Fatura ve bildirimler demo modundadır. E-posta/SMS gönderilmez; belge mali geçerlilik taşımaz.</p>
      {data?.invoice ? <button disabled={busy} onClick={() => void act(async () => setInvoice(await adminApi.orderInvoice(id)))}>Demo faturayı görüntüle</button> : canManage && ['Paid', 'Preparing', 'Processing', 'Shipped', 'Delivered', 'Completed'].includes(status) && <button disabled={busy} onClick={() => void act(() => adminApi.issueDemoInvoice(id))}>Demo fatura oluştur</button>}
    </div>{invoice && <InvoicePreview data={invoice} />}
  </section>;
}

function RequestDecision({ kind, busy, onResolve }: { kind: string; busy: boolean; onResolve: (decision: string, response: string) => void }) {
  const [response, setResponse] = useState('');
  const [decision, setDecision] = useState('');
  return <form className="order-controls" onSubmit={e => { e.preventDefault(); onResolve(decision, response); }}><h3>{kind === 'Return' ? 'İade' : 'İptal'} talebini değerlendir</h3>
    <label>Karar<select required value={decision} onChange={e => setDecision(e.target.value)}><option value="">Seçin</option><option value="Approved">Onayla</option><option value="Rejected">Reddet</option></select></label>
    <label>Müşteriye yanıt<textarea required maxLength={800} value={response} onChange={e => setResponse(e.target.value)} /></label><button disabled={busy || !response.trim() || !decision}>Kararı kaydet</button>
  </form>;
}
