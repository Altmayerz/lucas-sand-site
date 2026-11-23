// Hero. A abertura é um foco que se acerta: a primeira pintura mostra só a névoa da foto (uma cópia minúscula e
// desfocada, embutida na folha de estilo); quando a foto de verdade está decodificada e a letra da marca chegou, a
// cena sai do desfoque e as duas metades do nome sobem por trás da modelo. Depois, o nome afunda um pouco quando a
// página desce e, com mouse, as letras e a foto se deslocam em profundidades diferentes.
import { gsap, ScrollTrigger, REDUZIDO, desktop } from './ease.js';
import { rolando } from './rolando.js';

const u = () => (desktop() ? Math.min(innerWidth / 1440, innerHeight / 900, 1.5) : innerWidth / 390);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export function hero() {
  const el = document.querySelector('.hero');
  if (!el) return { entra() {} };
  const foto = el.querySelector('.hero__foto');
  const nome = el.querySelector('.hero__nome');
  const nevoa = el.querySelector('.hero__nevoa');
  const metades = [...el.querySelectorAll('.hero__letras')];
  const partes = [...el.querySelectorAll('[data-hero]')];
  let aberto = false;

  async function entra() {
    if (REDUZIDO) { el.classList.add('is-aberto'); aberto = true; return; }
    // a abertura só começa com a foto decodificada e a letra na tela (teto de 2,5 s para rede ruim)
    await Promise.race([
      Promise.all([
        (foto.complete ? Promise.resolve() : new Promise((ok) => { foto.addEventListener('load', ok, { once: true }); foto.addEventListener('error', ok, { once: true }); }))
          .then(() => foto.decode?.().catch(() => {})),
        document.fonts.load(`${getComputedStyle(nome).fontWeight} 1em ${getComputedStyle(nome).fontFamily.split(',')[0]}`).catch(() => {}),
      ]),
      espera(2500),
    ]);
    const k = u();
    gsap.set(nevoa, { opacity: 1 });
    gsap.set(foto, { opacity: 0, filter: `blur(${24 * k}px)` });
    gsap.set(nome, { opacity: 1 });
    gsap.set(metades, { opacity: 0, x: 0, y: 84 * k, filter: `blur(${28 * k}px)` });
    gsap.set(partes, { opacity: 0, x: 0, y: 20, filter: 'blur(8px)' });
    el.classList.add('is-aberto');

    const tl = gsap.timeline({ defaults: { ease: 't-out' }, onComplete: () => { aberto = true; gsap.set([foto, ...metades, ...partes], { clearProps: 'filter' }); } });
    tl.to(foto, { opacity: 1, duration: 0.5, ease: 'none' }, 0)
      .to(foto, { filter: 'blur(0px)', duration: 1.5 }, 0)
      .to(nevoa, { opacity: 0, duration: 0.8, ease: 'none' }, 0.1)
      .to(metades, { opacity: 1, duration: 0.7, ease: 'none', stagger: 0.1 }, 0.15)
      .to(metades, { y: 0, filter: 'blur(0px)', duration: 1.6, stagger: 0.1 }, 0.15)
      .to(partes, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.09 }, 0.55);
    return tl;
  }

  // o nome afunda atrás dela enquanto o hero sai (só as letras andam: a foto fica parada)
  if (!REDUZIDO) {
    const afunda = gsap.quickSetter(nome, '--afunda');
    ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (st) => afunda(st.progress.toFixed(4)),
    });
  }

  // com mouse: as letras fogem um pouco do cursor e a foto o acompanha de leve, com embalo
  if (!REDUZIDO && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let ax = 0, ay = 0, x = 0, y = 0, vivo = false;
    const px = gsap.quickSetter(el, '--px'), py = gsap.quickSetter(el, '--py');
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || rolando.on) return;
      const r = el.getBoundingClientRect();
      ax = (e.clientX - r.left) / r.width - 0.5;
      ay = (e.clientY - r.top) / r.height - 0.5;
      vivo = true;
    }, { passive: true });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { ax = 0; ay = 0; } });
    gsap.ticker.add(() => {
      if (!aberto || !vivo) return;
      x += (ax - x) * 0.07;
      y += (ay - y) * 0.07;
      if (Math.abs(ax - x) < 0.0005 && Math.abs(ay - y) < 0.0005 && ax === 0 && ay === 0) vivo = false;
      px(x.toFixed(4));
      py(y.toFixed(4));
    });
  }

  return { entra };
}
