// Tona: monta a rolagem, a abertura do hero, as entradas por marco, o topo e as interações de cada seção.
// Não há tela de carregamento: a primeira pintura já é o hero, com a névoa da foto, e a abertura é o foco chegando.
import { gsap, ScrollTrigger } from './motion/ease.js';
import { criarRolagem } from './motion/rolagem.js';
import { palavras } from './motion/palavras.js';
import { revelacoes } from './motion/revela.js';
import { vidros } from './motion/vidro.js';
import { hero } from './motion/hero.js';
import { topo } from './motion/topo.js';
import { tratamentos } from './motion/tratamentos.js';
import { desliza } from './motion/desliza.js';
import { zap } from './motion/zap.js';
import { interacoes } from './motion/interacoes.js';
import './motion/rolando.js';

const html = document.documentElement;
window.__tonaViva = true;

// sem transição no primeiro quadro (a trava sai depois de dois quadros)
requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('assentou')));

function iniciar() {
  history.scrollRestoration = 'manual';
  const lenis = criarRolagem();
  palavras();
  const h = hero();
  topo();
  tratamentos();
  interacoes();
  const d = desliza();
  vidros(document);
  revelacoes(document);
  zap();

  let largura = innerWidth;
  const remede = () => { lenis?.resize(); ScrollTrigger.refresh(); d.mede(); };
  let tempo = 0;
  addEventListener('resize', () => {
    if (innerWidth === largura) return; // a barra do navegador do celular subindo e descendo não remede nada
    largura = innerWidth;
    clearTimeout(tempo);
    tempo = setTimeout(remede, 120);
  });
  document.fonts.ready.then(remede);
  addEventListener('load', remede, { once: true });
  // a sanfona de dúvidas e as fotos que chegam mudam a altura da página
  if ('ResizeObserver' in window) {
    let alt = document.body.offsetHeight;
    new ResizeObserver(() => { const a = document.body.offsetHeight; if (Math.abs(a - alt) > 2) { alt = a; clearTimeout(tempo); tempo = setTimeout(remede, 120); } }).observe(document.body);
  }

  h.entra();
}

iniciar();
