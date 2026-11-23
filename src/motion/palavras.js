// Parte em palavras os textos marcados com data-palavras, para entrarem uma a uma saindo do desfoque (o estilo está
// em base.css; quem dispara é o revela.js). Elementos de dentro (a palavra na letra da marca, os recortes de foto)
// contam como uma peça só. O texto continua inteiro para leitores de tela (aria-label no bloco).
export function palavras(raiz = document) {
  raiz.querySelectorAll('[data-palavras]').forEach((el) => {
    if (el.dataset.partido) return;
    el.dataset.partido = '1';
    const texto = el.textContent.replace(/\s+/g, ' ').trim();
    let i = 0;
    const parte = (no) => {
      [...no.childNodes].forEach((filho) => {
        if (filho.nodeType === 3) {
          const frag = document.createDocumentFragment();
          filho.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(' '); return; }
            const s = document.createElement('span');
            s.className = 'pl';
            s.style.setProperty('--i', i++);
            s.textContent = t;
            s.setAttribute('aria-hidden', 'true');
            frag.append(s);
          });
          filho.replaceWith(frag);
        } else if (filho.nodeType === 1) {
          if (filho.matches('.chip, [data-chip]')) { filho.style.setProperty('--i', i++); filho.setAttribute('aria-hidden', 'true'); }
          else if (filho.tagName === 'BR') { /* quebra fica */ }
          else parte(filho);
        }
      });
    };
    parte(el);
    el.setAttribute('aria-label', texto);
    if (!/^H[1-6]$/.test(el.tagName) && !el.hasAttribute('role')) el.setAttribute('role', 'text');
  });
}
