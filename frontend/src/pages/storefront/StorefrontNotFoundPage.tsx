import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';

export function StorefrontNotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-primary">
      <StorefrontHeader />
      <main className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-bold">Sayfa bulunamadı</h1>
        <p>Aradığınız sayfaya ulaşılamıyor.</p>
        <Link to="/" className="rounded-lg bg-primary px-6 py-3 font-semibold text-white">Ana sayfaya dön</Link>
      </main>
    </div>
  );
}
