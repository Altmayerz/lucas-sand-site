// Dúvidas: sanfona. Uma resposta aberta por vez; a primeira já vem aberta.
export function duvidas() {
  const itens = [...document.querySelectorAll('.duvida')];
  if (!itens.length) return;
  const abre = (item, on) => {
    item.classList.toggle('is-aberta', on);
    item.querySelector('.duvida__p').setAttribute('aria-expanded', String(on));
    item.querySelector('.duvida__r').toggleAttribute('inert', !on);
  };
  itens.forEach((item, i) => {
    abre(item, i === 0);
    item.querySelector('.duvida__p').addEventListener('click', () => {
      const estava = item.classList.contains('is-aberta');
      itens.forEach((o) => abre(o, false));
      abre(item, !estava);
    });
  });
}
