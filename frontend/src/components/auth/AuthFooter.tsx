import { Link } from 'react-router-dom';
import { AuthIcon } from './AuthIcon';

export function AuthFooter() {
  return <footer className="auth-footer mt-12 bg-primary px-4 py-10 text-on-primary sm:px-6 lg:px-12">
    <div className="mx-auto grid max-w-[1320px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <Link to="/" className="text-2xl font-extrabold">Köyden Sofraya</Link>
        <p className="mt-3 max-w-sm text-sm leading-6 text-surface-container-high">Anadolu'nun bereketli topraklarından, geleneksel yöntemlerle üretilen en saf lezzetleri sofranıza ulaştırıyoruz.</p>
        <p className="mt-4 text-sm font-semibold">Müşteri Destek Hattı: <a href="tel:08504415693" className="ml-2 text-secondary-fixed">0850 441 56 93</a></p>
      </div>
      <div><h2 className="mb-3 font-bold">Kurumsal</h2><ul className="space-y-2 text-sm text-surface-container-high"><li><Link to="/#hikayemiz">Hakkımızda</Link></li><li><span>Kargo ve Teslimat</span></li><li><span>İade &amp; Değişim Koşulları</span></li><li><a href="tel:08504415693">İletişim</a></li></ul></div>
      <div><h2 className="mb-3 font-bold">Kategoriler</h2><ul className="space-y-2 text-sm text-surface-container-high"><li><Link to="/products?category=kahvaltiliklar">Köy Kahvaltılıkları</Link></li><li><Link to="/products?category=zeytinyaglari">Zeytinyağları</Link></li><li><Link to="/products?category=salca-ve-soslar">Salça &amp; Soslar</Link></li><li><Link to="/products?category=bal-ve-receller">Bal &amp; Reçel</Link></li></ul></div>
      <div><h2 className="mb-3 font-bold">Sözleşmeler</h2><ul className="space-y-2 text-sm text-surface-container-high"><li><span>Mesafeli Satış Sözleşmesi</span></li><li><span>Gizlilik ve Güvenlik</span></li><li><span>Çerez Politikası</span></li><li><span>KVKK Aydınlatma Metni</span></li></ul></div>
    </div>
    <div className="mx-auto mt-8 flex max-w-[1320px] flex-col justify-between gap-3 border-t border-white/15 pt-5 text-xs text-surface-container-high/80 sm:flex-row">
      <span>© 2025 Köyden Sofraya Doğal Gıda. Tüm hakları saklıdır.</span>
      <span className="flex items-center gap-1"><AuthIcon className="text-base">lock</AuthIcon>256-Bit SSL Koruma <span className="ml-4">Türkiye / TL (₺)</span></span>
    </div>
  </footer>;
}
