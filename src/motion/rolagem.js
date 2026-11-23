// Rolagem suave: o Lenis em modo de duração (cada gesto vira uma corrida de 1,1 s com saída exponencial), no relógio
// do GSAP, com o ScrollTrigger lendo a mesma posição. Sem Lenis com movimento reduzido.
// Teto: o alvo da roda nunca fica mais que TETO telas à frente da página, para um gesto violento não atravessar
// várias seções de uma vez. No toque a rolagem é a nativa (o filtro devolve true: cancelar o touchend mataria o
// clique de todos os botões no celular).
import Lenis from 'lenis';
import { gsap, ScrollTrigger, REDUZIDO } from './ease.js';

const TETO = 1.6;
let lenis = null;

export function criarRolagem() {
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (REDUZIDO) return null;
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 2,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  lenis.options.virtualScroll = (data) => {
    const { deltaY, event } = data;
    if (event.type.includes('touch') || event.ctrlKey || !deltaY) return true;
    const alvo = lenis.targetScroll;
    const dir = Math.sign(deltaY);
    const lim = lenis.animatedScroll + dir * TETO * innerHeight;
    const novo = dir > 0 ? Math.max(alvo, Math.min(alvo + deltaY, lim)) : Math.min(alvo, Math.max(alvo + deltaY, lim));
    data.deltaY = novo - alvo;
    if (Math.abs(data.deltaY) < 0.5) {
      if (event.cancelable) event.preventDefault();
      return false;
    }
    return true;
  };
  return lenis;
}

export const rolagem = () => lenis;

/** leva a página até uma posição (px) com a curva da casa (dur em segundos); sem Lenis, salta */
export function irPara(y, { imediato = false, dur = 1.4 } = {}) {
  const alvo = Math.max(0, Math.round(y));
  if (lenis && !imediato) lenis.scrollTo(alvo, { duration: dur, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
  else if (lenis) lenis.scrollTo(alvo, { immediate: true, force: true });
  else scrollTo({ top: alvo, behavior: REDUZIDO || imediato ? 'instant' : 'smooth' });
}

export function trava() { document.documentElement.classList.add('travado'); lenis?.stop(); }
export function solta() { document.documentElement.classList.remove('travado'); lenis?.start(); }
