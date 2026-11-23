// Interações comuns: no toque, a resposta de hover acende por um instante (.is-tocado) em tudo o que é clicável.
const CLICAVEIS = 'a, button, [role="button"], [data-toque]';

export function interacoes() {
  let timer = 0, atual = null;
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const alvo = e.target.closest?.(CLICAVEIS);
    if (!alvo) return;
    clearTimeout(timer);
    // um pequeno atraso: quem só está arrastando a página não acende nada
    timer = setTimeout(() => { atual?.classList.remove('is-tocado'); atual = alvo; alvo.classList.add('is-tocado'); }, 70);
  }, { passive: true });
  const solta = () => { clearTimeout(timer); const a = atual; if (a) setTimeout(() => a.classList.remove('is-tocado'), 420); atual = null; };
  addEventListener('pointerup', solta, { passive: true });
  addEventListener('pointercancel', () => { clearTimeout(timer); atual?.classList.remove('is-tocado'); atual = null; }, { passive: true });
}
