// O que anda preso à rolagem (só imagem e letra de fundo; texto de ler entra por tempo, em revela.js):
//   [data-trilho]    a fila de fotos da clínica anda de lado enquanto a seção atravessa a tela (no celular ela se
//                    arrasta com o dedo, e este módulo não mexe nela);
//   [data-desliza]   as palavras gigantes de fundo deslizam de lado; o número diz quanto e para que lado.
//                    Com data-modo="chega" (as metades do nome no fecho), a peça vem de fora e assenta no lugar;
//   .agendar__mulher a mulher do fecho sobe um pouco mais devagar que a página.
// Tudo é recalculado da posição da página a cada quadro, sem estado acumulado: rolagem rápida não desalinha nada.
import { gsap, REDUZIDO, desktop, limita } from './ease.js';

export function desliza() {
  if (REDUZIDO) return { mede() {} };
  const trilhos = [...document.querySelectorAll('[data-trilho]')].map((janela) => ({ janela, fita: janela.firstElementChild, topo: 0, alt: 0, curso: 0 }));
  const fundos = [...document.querySelectorAll('[data-desliza]')].map((el) => ({ el, sec: el.closest('section'), k: parseFloat(el.dataset.desliza) || 0, chega: el.dataset.modo === 'chega', topo: 0, alt: 0, proprio: 0 }));
  const mulher = document.querySelector('.agendar__mulher');
  const fecho = mulher?.closest('section');
  let fTopo = 0, fAlt = 0, vh = innerHeight, vw = innerWidth;

  function mede() {
    vh = innerHeight; vw = innerWidth;
    const y = scrollY;
    trilhos.forEach((t) => {
      const r = t.janela.getBoundingClientRect();
      t.topo = r.top + y; t.alt = r.height;
      t.curso = Math.max(0, t.fita.scrollWidth - t.janela.clientWidth);
    });
    fundos.forEach((f) => { const r = f.sec.getBoundingClientRect(); f.topo = r.top + y; f.alt = r.height; f.proprio = f.el.parentElement.getBoundingClientRect().top + y; });
    if (fecho) { const r = fecho.getBoundingClientRect(); fTopo = r.top + y; fAlt = r.height; }
    desenha();
  }

  function desenha() {
    const y = scrollY;
    if (desktop()) {
      trilhos.forEach((t) => {
        // de quando o topo da fila entra pelo pé da tela até o pé dela sair pelo alto
        const p = limita((y + vh - t.topo) / (vh + t.alt));
        t.fita.style.setProperty('--desliza', (-p * t.curso).toFixed(1));
      });
    }
    fundos.forEach((f) => {
      if (f.chega) {
        // chega de fora e assenta: de quando a peça aponta no pé da tela até ela passar do meio
        const p = limita((y + vh - f.proprio) / (vh * 0.62));
        const e = 1 - (1 - p) ** 3;
        f.el.style.setProperty('--desliza', ((1 - e) * -f.k * vw * 0.22).toFixed(1));
      } else {
        const p = limita((y + vh - f.topo) / (vh + f.alt));
        f.el.style.setProperty('--desliza', ((p - 0.5) * f.k * vw * 0.5).toFixed(1));
      }
    });
    if (mulher) {
      const p = limita((y + vh - fTopo) / (vh * 0.9));
      mulher.style.setProperty('--sobe', ((1 - p) * vh * 0.16).toFixed(1));
    }
  }
  gsap.ticker.add(desenha);
  mede();
  return { mede };
}
