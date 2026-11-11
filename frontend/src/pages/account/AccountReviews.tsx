import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountApi, type CustomerReview } from '../../api/accountApi';

const statusLabels: Record<string, string> = { Pending: 'Onay bekliyor', Approved: 'Yayınlandı', Rejected: 'Yayınlanmadı' };
export function AccountReviews() {
  const [reviews, setReviews] = useState<CustomerReview[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; accountApi.reviews().then(data => { if (active) setReviews(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Yorumlar yüklenemedi.'); }); return () => { active = false; }; }, []);
  return <><div className="account-heading"><div><h1>Yorum ve Değerlendirmelerim</h1><p>Gönderdiğiniz ürün yorumlarını görüntüleyin.</p></div></div>
    {error && <p className="account-error" role="alert">{error}</p>}{!reviews && !error && <p className="account-muted">Yorumlar yükleniyor...</p>}
    {reviews?.length === 0 && <section className="account-card">Henüz ürün yorumu yapmadınız.</section>}
    {reviews?.map(review => <section className="account-card" key={review.id}><div className="account-row"><strong>{review.productSlug ? <Link to={`/products/${review.productSlug}`}>{review.productName || 'Ürün'}</Link> : review.productName || 'Ürün'}</strong><span className="account-tag">{statusLabels[review.status] || review.status}</span></div><p className="account-muted">{'★'.repeat(review.rating)} · {new Date(review.createdAtUtc).toLocaleDateString('tr-TR')}</p><p>{review.text}</p></section>)}
  </>;
}
