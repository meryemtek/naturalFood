import React from 'react';
import { Link } from 'react-router-dom';
import { StorefrontHeader } from '../../components/storefront/StorefrontHeader';
import { useWishlist } from '../../api/storefront/useWishlist';

const PRODUCERS = [
  {
    name: 'Mehmet Ali Dayı & Ailesi',
    region: 'Hatay / Altınözü - Hacıpaşa Köyü',
    specialty: '3 Kuşaktır Taş Baskı Zeytincilik',
    quote:
      'Biz dedemizden ne gördüysek onu yaparız. Kimyasal gübre zeytinin kalbini kırar. Ağaçlarımızı kuyu suyuyla, toprağımızı doğal gübreyle besleriz. Bu yağ kendi soframıza koyduğumuz, çocuklarımıza içirdiğimiz yağdır.',
    image: '/images/products/mehmet-ali-dayi.jpg',
  },
  {
    name: 'Boğatepe Yayla Mandırası',
    region: 'Kars / Boğatepe (2300m Rakım)',
    specialty: 'Geleneksel Şirden Mayalı Eski Kaşar & Tereyağı',
    quote:
      'Yaylamızda yüzlerce endemik çiçek yetişir. Hayvanlarımız yalnızca bu meralarda otlar. Peynirlerimizi kültür mayasıyla değil, geleneksel şirden mayasıyla mayalar, taş mahzenlerde en az 10 ay dinlendiririz.',
    image: '/images/products/prod-kasar-eski.jpg',
  },
  {
    name: 'İslahiye Kadın Eli Kooperatifi',
    region: 'Gaziantep / İslahiye & Nurdağı',
    specialty: 'Güneşte Kurutulmuş Köy Salçaları & Kuru Gıda',
    quote:
      'Ağustos güneşi bizim en büyük sırrımızdır. Tarladan topladığımız etli biberleri ve domatesleri taş değirmende çekip bakır tepsilerde günlerce güneşte kıvam aldırırız; içine tek damla koruyucu girmez.',
    image: '/images/products/cat-salca.jpg',
  },
];

const PILLARS = [
  {
    icon: 'handshake',
    title: 'Aracısız Üretici Dayanışması',
    description:
      'Endüstriyel fabrikalarla değil; Anadolu’nun köylerindeki küçük aile çiftlikleri ve kadın kooperatifleriyle doğrudan çalışıyoruz.',
  },
  {
    icon: 'verified',
    title: '%100 Katkısız & Geleneksel',
    description:
      'Raf ömrü uzatıcı kimyasallar, glikoz şurubu, yapay renklendirici veya endüstriyel hızlandırıcılar hiçbir ürünümüzde yer almaz.',
  },
  {
    icon: 'ac_unit',
    title: 'Soğuk Zincir & Kırılmaz Paket',
    description:
      'Peynir ve tereyağlarını özel strafor kutularda buz aküleriyle, cam kavanozları ise darbe emici koruyucularla 24 saatte kapınıza ulaştırıyoruz.',
  },
  {
    icon: 'eco',
    title: 'Mevsiminde ve Taze Hasat',
    description:
      'Doğanın takvimine saygı duyuyoruz. Her mahsulü yalnızca kendi mevsiminde, besin değeri ve aroması en yüksek olduğu anda topluyoruz.',
  },
];

export function OurStoryPage() {
  const { ids: wishlist } = useWishlist();

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-sans selection:bg-secondary-fixed selection:text-tertiary">
      <StorefrontHeader wishlistCount={wishlist.length} />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative bg-surface-container-high border-b border-secondary/20 py-14 lg:py-20 overflow-hidden">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <nav className="flex items-center gap-2 font-label-md text-label-md text-secondary mb-6">
              <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-primary font-bold">Hikâyemiz</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-secondary/30 text-secondary font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[16px] text-primary">history_edu</span>
                  <span>Toprağa, Emeğe ve Doğallığa Saygı</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary tracking-tight leading-tight">
                  Anadolu’nun Bereketli Topraklarından, <span className="text-secondary">Aracısız Sofranıza</span>
                </h1>

                <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-2xl">
                  Köyden Sofraya, çocukluğumuzdaki o gerçek tereyağı kokusunu, genzi hafifçe yakan taş baskı zeytinyağını ve güneşte ağır ağır kıvam alan köy salçasını yeniden şehirdeki sofralarla buluşturmak için doğdu.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-3 max-w-lg border-t border-secondary/20">
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">14+</p>
                    <p className="text-xs sm:text-sm text-secondary font-medium">Köy Kooperatifi</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">%100</p>
                    <p className="text-xs sm:text-sm text-secondary font-medium">Katkısız Üretim</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">81 İl</p>
                    <p className="text-xs sm:text-sm text-secondary font-medium">Soğuk Zincir Kargo</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border-2 border-secondary/25 shadow-lg bg-surface-container relative">
                  <img
                    src="/images/anadolu-sofrasi.jpg"
                    alt="Geleneksel Anadolu Köy Sofrası"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="p-4 bg-surface-container-lowest border-t border-secondary/15 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-primary text-sm">Geleneksel Üretim Sözü</p>
                      <p className="text-xs text-on-surface-variant">Tohumdan sofraya şeffaf tedarik zinciri</p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values / 4 Pillars */}
        <section className="py-14 bg-surface border-b border-secondary/15">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <div className="max-w-2xl mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                Üretim İlkelerimiz
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                Neden Köyden Sofraya?
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PILLARS.map(pillar => (
                <div
                  key={pillar.title}
                  className="bg-surface-container-lowest border border-secondary/20 rounded-xl p-6 flex flex-col gap-3 shadow-xs"
                >
                  <div className="w-11 h-11 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">{pillar.icon}</span>
                  </div>
                  <h3 className="font-bold text-lg text-primary">{pillar.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Producer Stories */}
        <section className="py-16 bg-surface-container-low">
          <div className="max-w-[1320px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary block mb-1">
                  Üreticilerimizle Tanışın
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                  Sofranıza Bereket Katan Emekçiler
                </h2>
              </div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-bold text-sm transition-colors self-start md:self-auto"
              >
                <span>Tüm Mahsulleri İncele</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {PRODUCERS.map(producer => (
                <article
                  key={producer.name}
                  className="bg-surface rounded-2xl border border-secondary/20 overflow-hidden flex flex-col shadow-xs"
                >
                  <div className="h-60 overflow-hidden relative bg-surface-container">
                    <img
                      src={producer.image}
                      alt={producer.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-primary/90 text-on-primary text-xs font-bold">
                      {producer.region}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-xs font-bold text-secondary uppercase tracking-wide">
                        {producer.specialty}
                      </span>
                      <h3 className="text-xl font-bold text-primary mt-1">{producer.name}</h3>
                      <p className="mt-3 text-sm text-on-surface-variant italic leading-relaxed">
                        “{producer.quote}”
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary w-full mt-auto border-t border-primary-container text-on-primary">
        <div className="w-full px-6 lg:px-12 max-w-[1320px] mx-auto py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-container-high/80">
          <div className="flex items-center gap-2 font-bold text-on-primary">
            <span className="material-symbols-outlined text-secondary-fixed">eco</span>
            <span>Köyden Sofraya</span>
          </div>
          <div>
            © 2025 Köyden Sofraya Doğal Gıda A.Ş. Anadolu'nun bereketli topraklarından sofranıza.
          </div>
        </div>
      </footer>
    </div>
  );
}
