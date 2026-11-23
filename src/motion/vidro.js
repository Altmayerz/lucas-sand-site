// O vidro de cada cartão repousa logo acima do texto que mora nele, e chega aos poucos. Para cada cartão com um bloco
// marcado com [data-vidro="folga faixa"] (em px: a folga acima do texto e a faixa em que o vidro se desfaz na foto):
//   --nevoa-borda  a faixa, limitada a 24% da altura do cartão (em cartão baixo ela encolhe);
//   --pe           o topo do vidro, em % da altura: o vidro fica cheio na folga, logo acima do texto.
// Sem o JS valem os valores do CSS. Remede quando o cartão muda de tamanho e quando a fonte chega.
export function vidros(raiz = document) {
  const fotos = [...raiz.querySelectorAll('.foto')].filter((f) => f.querySelector('[data-vidro]'));
  if (!fotos.length || !('ResizeObserver' in window)) return;
  const mede = (foto) => {
    const alvo = foto.querySelector('[data-vidro]');
    const h = foto.clientHeight;
    if (!h) return;
    // a posição do bloco pela caixa de layout: as entradas mexem só com transform, e isso não entra na conta
    let y = 0;
    for (let n = alvo; n && n !== foto; n = n.offsetParent) y += n.offsetTop;
    const [folga = 16, faixa = 150] = alvo.dataset.vidro.split(/\s+/).filter(Boolean).map(Number);
    const b = Math.min(faixa, h * 0.24);
    foto.style.setProperty('--nevoa-borda', `${b.toFixed(1)}px`);
    foto.style.setProperty('--pe', Math.max(4, ((y - folga - b * 0.9) / h) * 100).toFixed(2));
  };
  const ro = new ResizeObserver((entradas) => entradas.forEach((e) => mede(e.target)));
  fotos.forEach((f) => { mede(f); ro.observe(f); });
  document.fonts?.ready.then(() => fotos.forEach(mede));
}
