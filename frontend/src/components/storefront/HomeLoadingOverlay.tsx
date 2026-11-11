import { useEffect, useRef, useState } from 'react';
import './HomeLoadingOverlay.css';

const VEGETABLE_COUNT = 12;
const MIN_DURATION = 2000;
const MAX_DURATION = 2700;
const FADE_DURATION = 300;
const random = (min: number, max: number) => min + Math.random() * (max - min);

export function HomeLoadingOverlay({ ready, onFinished }: { ready: boolean; onFinished: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const readyRef = useRef(ready);
  const finishRef = useRef(onFinished);
  const [leaving, setLeaving] = useState(false);
  const [finished, setFinished] = useState(false);
  useEffect(() => { readyRef.current = ready; }, [ready]);
  useEffect(() => { finishRef.current = onFinished; }, [onFinished]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const container = stage.current;
    const animations: Animation[] = [];
    let frame = 0;
    let exitTimer: ReturnType<typeof setTimeout> | undefined;
    let exiting = false;
    let didFinish = false;
    const finish = () => {
      if (didFinish) return;
      didFinish = true;
      cancelAnimationFrame(frame);
      if (exitTimer) clearTimeout(exitTimer);
      document.body.style.overflow = previousOverflow;
      setFinished(true);
      finishRef.current();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (!reducedMotion && container) {
      const vegetableCount = width < 650 ? 9 : 15;
      const laneCount = Math.ceil(vegetableCount / 3);
      for (let i = 0; i < vegetableCount; i++) {
        // Kullanıcının yeni dosyasındaki saydam fotoğraf atlası: dört sütun, üç satır.
        const vegetable = document.createElement('div');
        const spriteIndex = i % VEGETABLE_COUNT;
        vegetable.style.backgroundPosition = `${(spriteIndex % 4) * 100 / 3}% ${Math.floor(spriteIndex / 4) * 50}%`;
        vegetable.classList.add('vegetable-loader-falling', 'vegetable-loader-photo');
        const size = random(width < 650 ? 54 : 76, width < 650 ? 82 : 112);
        vegetable.style.width = `${size}px`; vegetable.style.height = `${size}px`;
        container.appendChild(vegetable);
        // Girişleri ayrı dikey şeritlere yay; sebzeler aynı noktada kümelenmesin.
        const direction = i % 3;
        const lane = Math.floor(i / 3);
        const laneProgress = laneCount === 1 ? 0.5 : lane / (laneCount - 1);
        const laneY = height * (0.14 + laneProgress * 0.68);
        const y0 = direction === 2 ? -size * 1.2 : laneY + random(-height * .025, height * .025) + (direction === 0 ? -height * .035 : height * .035);
        const x0 = direction === 0 ? -size * 1.2 : direction === 1 ? width + size * .2 : width * (0.12 + laneProgress * 0.72);
        const x1 = direction === 0 ? width * .4 : direction === 1 ? width * .6 - size : Math.max(0, Math.min(width - size, x0 + random(-width * .1, width * .1)));
        const y1 = direction === 2 ? height + size : y0 + height * .45;
        const begin = random(-35, 35);
        const spin = random(45, 110) * (direction === 1 ? -1 : 1);
        animations.push(vegetable.animate([
          { transform: `translate3d(${x0}px,${y0}px,0) rotate(${begin}deg)`, opacity: 0, offset: 0 },
          { opacity: 1, offset: .06 },
          { transform: `translate3d(${x0 + (x1 - x0) * .45}px,${y0 + (y1 - y0) * .3}px,0) rotate(${begin + spin * .45}deg)`, opacity: 1, offset: .45 },
          { opacity: 1, offset: .9 },
          { transform: `translate3d(${x1}px,${y1}px,0) rotate(${begin + spin}deg)`, opacity: 0, offset: 1 },
        ], { duration: random(3600, 4800), delay: random(0, 600), easing: 'linear', fill: 'both' }));
      }
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const complete = reducedMotion || (readyRef.current && elapsed >= MIN_DURATION) || elapsed >= MAX_DURATION;
      const progress = complete ? 100 : Math.min(95, Math.round(elapsed / MIN_DURATION * 95));
      if (bar.current) bar.current.style.width = `${progress}%`;
      if (label.current) label.current.textContent = `${progress}%`;
      if (complete && !exiting) {
        exiting = true; setLeaving(true);
        exitTimer = setTimeout(finish, reducedMotion ? 0 : FADE_DURATION);
      } else if (!exiting) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    // Veri veya animasyon karesi gecikse bile açılış ekranı sayfayı kilitlemez.
    const deadline = setTimeout(finish, MAX_DURATION + FADE_DURATION);
    return () => {
      clearTimeout(deadline);
      cancelAnimationFrame(frame);
      if (exitTimer) clearTimeout(exitTimer);
      animations.forEach(animation => animation.cancel());
      container?.replaceChildren();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (finished) return null;
  return <div className={`vegetable-loader${leaving ? ' is-leaving' : ''}`} role="status" aria-label="Ana sayfa yükleniyor">
    <div className="vegetable-loader-top">KÖYDEN SOFRAYA</div>
    <div ref={stage} className="vegetable-loader-stage" aria-hidden="true" />
    <div className="vegetable-loader-center">
      <div className="vegetable-loader-kicker">TOPRAKTAN SOFRANIZA</div>
      <h2>Doğallık<br /><span>yükleniyor...</span></h2>
      <p className="vegetable-loader-caption">Taptaze renkler, mis gibi köy lezzetleri geliyor.</p>
      <div className="vegetable-loader-progress-track" aria-hidden="true"><div ref={bar} className="vegetable-loader-progress-bar" /></div>
      <div ref={label} className="vegetable-loader-progress-text" aria-hidden="true">0%</div>
    </div>
    <div className="vegetable-loader-bottom">DOĞANIN GÜZELLİKLERİYLE TANIŞIN</div>
  </div>;
}
