// Entradas por marco: quando um bloco chega à tela ele entra por tempo, uma vez só.
//   [data-entra]     textos e blocos: sobem um pouco saindo do desfoque (o estilo está em base.css);
//   [data-palavras]  títulos e frases: palavra por palavra (partidos por palavras.js);
//   .foto         a névoa escorre para baixo e a imagem vem à tona (classe .em-foco).
// Irmãos que chegam juntos entram escalonados. Quem recebe foco do teclado antes de entrar, entra na hora.
import { PASSO, REDUZIDO } from './ease.js';

export function revelacoes(raiz = document) {
  const alvos = [...raiz.querySelectorAll('[data-entra], [data-palavras], .foto')];
  if (REDUZIDO || !('IntersectionObserver' in window)) {
    alvos.forEach((a) => a.classList.add('entrou', 'em-foco'));
    return;
  }
  const io = new IntersectionObserver((entradas) => {
    const chegaram = entradas.filter((e) => e.isIntersecting).map((e) => e.target);
    chegaram.sort((a, b) => (a.getBoundingClientRect().top - b.getBoundingClientRect().top) || (a.getBoundingClientRect().left - b.getBoundingClientRect().left));
    chegaram.forEach((a, i) => {
      io.unobserve(a);
      const atraso = Math.min(i, 6) * PASSO + parseFloat(a.dataset.atraso || 0);
      a.style.setProperty('--atraso', `${atraso}s`);
      if (a.classList.contains('foto')) setTimeout(() => a.classList.add('em-foco'), atraso * 1000);
      else a.classList.add('entrou');
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  alvos.forEach((a) => io.observe(a));
  document.addEventListener('focusin', (e) => {
    const bloco = e.target.closest?.('[data-entra]:not(.entrou), [data-palavras]:not(.entrou)');
    if (bloco) bloco.classList.add('entrou');
  });
}
