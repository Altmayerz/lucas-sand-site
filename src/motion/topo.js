// Topo: transparente no alto da página; quando a página desce ele sai da frente e, quando ela sobe, volta como
// cápsula fosca. Marca a seção atual no menu. No celular, o botão de dois traços abre o menu em tela cheia.
import { irPara, trava, solta } from './rolagem.js';

export function topo() {
  const el = document.querySelector('[data-topo]');
  if (!el) return;
  const links = [...document.querySelectorAll('.topo__link, .menu__link')];
  const abre = el.querySelector('.topo__abre');
  const menu = document.getElementById('menu');
  let ultimo = scrollY, desceu = 0, subiu = 0;

  const estado = () => {
    const y = scrollY;
    const d = y - ultimo;
    ultimo = y;
    const noAlto = y < 56; // lá em cima ele é a faixa transparente do hero; daí para baixo, cápsula
    el.classList.toggle('is-solto', !noAlto);
    if (menu?.classList.contains('is-aberto')) { el.classList.remove('is-fora'); desceu = subiu = 0; return; }
    if (y < 8) { el.classList.remove('is-fora'); desceu = subiu = 0; return; }
    // descendo, sai da frente logo (senão os links ficam escritos por cima do que passa por baixo);
    // subindo um pouco, volta
    if (d > 0) { desceu += d; subiu = 0; if (desceu > 20) el.classList.add('is-fora'); }
    else if (d < 0) { subiu -= d; desceu = 0; if (subiu > 48 || y < 56) el.classList.remove('is-fora'); }
  };
  addEventListener('scroll', estado, { passive: true });
  estado();
  // o foco do teclado dentro do topo o traz de volta
  el.addEventListener('focusin', () => el.classList.remove('is-fora'));

  // seção atual
  const secoes = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.toggleAttribute('aria-current', false));
        links.filter((l) => l.getAttribute('href') === `#${e.target.id}`).forEach((l) => l.setAttribute('aria-current', 'true'));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    [...new Set(secoes)].forEach((s) => io.observe(s));
  }

  // âncoras: a página rola até a seção com a curva da casa
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const alvo = document.querySelector(a.getAttribute('href'));
    if (!alvo) return;
    e.preventDefault();
    fecha();
    const y = alvo.id === 'inicio' ? 0 : alvo.getBoundingClientRect().top + scrollY - (alvo.dataset.cena !== undefined ? 0 : 24);
    irPara(y);
    history.replaceState(null, '', a.getAttribute('href'));
  });

  // menu do celular
  function fecha() {
    if (!menu || !menu.classList.contains('is-aberto')) return;
    menu.classList.remove('is-aberto');
    abre?.setAttribute('aria-expanded', 'false');
    abre?.setAttribute('aria-label', 'Abrir o menu');
    solta();
    setTimeout(() => { if (!menu.classList.contains('is-aberto')) menu.hidden = true; }, 460);
  }
  function abreMenu() {
    menu.hidden = false;
    [...menu.querySelectorAll('.menu__link')].forEach((l, i) => l.style.setProperty('--i', i));
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-aberto')));
    abre.setAttribute('aria-expanded', 'true');
    abre.setAttribute('aria-label', 'Fechar o menu');
    el.classList.remove('is-fora');
    trava();
  }
  abre?.addEventListener('click', () => (menu.classList.contains('is-aberto') ? fecha() : abreMenu()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });
}
