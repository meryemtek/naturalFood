import { useState } from 'react';
import { simulatePaytrPayment, type CreatedOrder } from '../../api/storefront/orderApi';
import { createUuid, money } from '../../api/storefront/storefrontApi';

interface PaytrSimulationPanelProps {
  order: CreatedOrder;
  onPaid: (nextStatus: string) => void;
  onSkip: () => void;
}

export function PaytrSimulationPanel({ order, onPaid, onSkip }: PaytrSimulationPanelProps) {
  const [cardHolder, setCardHolder] = useState('TEST KULLANICI');
  const [cardNumber, setCardNumber] = useState('4355 0843 5508 4358');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('000');
  const [smsCode, setSmsCode] = useState('123456');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSimulate = async (result: 'Success' | 'Failure') => {
    setBusy(true);
    setError('');
    try {
      const attemptKey = createUuid();
      const response = await simulatePaytrPayment(order.id, result, attemptKey);
      if (result === 'Success') {
        onPaid(response.orderStatus || 'Paid');
      } else {
        setError('PayTR Test: Kart reddedildi / yetersiz bakiye simülasyonu. Sipariş ödeme bekliyor durumunda kaldı; tekrar deneyebilirsiniz.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'PayTR simülasyonu sırasında bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-secondary/30 bg-white px-3 py-2.5 text-sm text-on-surface';

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-surface-container-low p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary/20 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            TEST / SİMÜLASYON MODU
          </span>
          <h1 className="mt-2 text-2xl font-bold text-primary">PayTR Güvenli Ödeme</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface/70">Sipariş No: <strong>{order.number}</strong></p>
          <p className="text-xl font-extrabold text-primary">{money(order.total)}</p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-white/80 p-3 text-xs text-on-surface/80 border border-secondary/15">
        Geliştirici test ortamı için simüle edilmiş PayTR 3D Secure ödeme ekranıdır. Gerçek kart çekimi yapılmaz; onaylandığında sipariş durumu <strong>Ödeme Doğrulandı (Paid)</strong> olarak admin paneline düşer.
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold sm:col-span-2">
          Kart Üzerindeki İsim
          <input className={`${inputClass} mt-1`} value={cardHolder} onChange={e => setCardHolder(e.target.value)} disabled={busy} />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          Test Kart Numarası (PayTR Test)
          <input className={`${inputClass} mt-1 font-mono`} value={cardNumber} onChange={e => setCardNumber(e.target.value)} disabled={busy} />
        </label>
        <label className="block text-sm font-semibold">
          Son Kullanma Tarihi
          <input className={`${inputClass} mt-1 font-mono`} value={expiry} onChange={e => setExpiry(e.target.value)} disabled={busy} />
        </label>
        <label className="block text-sm font-semibold">
          CVC / CVV
          <input className={`${inputClass} mt-1 font-mono`} value={cvc} onChange={e => setCvc(e.target.value)} disabled={busy} />
        </label>
        <label className="block text-sm font-semibold sm:col-span-2">
          3D Secure Test SMS Kodu
          <input className={`${inputClass} mt-1 font-mono`} value={smsCode} onChange={e => setSmsCode(e.target.value)} disabled={busy} />
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSimulate('Success')}
          className="flex-1 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          {busy ? 'İşleniyor...' : 'Ödemeyi Onayla (PayTR Başarılı)'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSimulate('Failure')}
          className="rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
        >
          Başarısız Ödeme Simüle Et
        </button>
      </div>

      <div className="mt-4 border-t border-secondary/15 pt-4 text-right">
        <button
          type="button"
          disabled={busy}
          onClick={onSkip}
          className="text-xs font-medium text-on-surface/70 underline hover:text-primary"
        >
          Ödemeyi atla (Siparişi &ldquo;Ödeme Bekliyor&rdquo; olarak bırak)
        </button>
      </div>
    </section>
  );
}
