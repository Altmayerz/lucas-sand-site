// Prepara as imagens do site a partir das fotos de origem (fonte/bruto/*.png) para public/img/*.webp.
// uso (da raiz do projeto): node fonte/imagens.mjs        precisa do sharp (npm install -E -D sharp@0.35.5)
//
// - fotos de card e de seção: uma ou duas larguras em WebP;
// - a névoa de cada foto: uma cópia pequena e muito desfocada (<nome>-nevoa.webp). É dela que sai o desfoque
//   pesado do pé dos cards e a entrada "do desfoque ao foco" de todas as fotos, sem filtro ligado no navegador;
// - a modelo do hero e a mulher do fecho: recorte com alfa (silhueta do macOS por fonte/recorta.swift + o fundo
//   tirado pela cor, que é o que acerta os fios de cabelo); a névoa do hero vai embutida em src/styles/gerado.css
//   para estar na primeira pintura;
// - o grão: o ladrilho da geada, que vai por cima de todo vidro.
// Só processa o que existe, então dá para rodar a qualquer momento.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..');
const BRUTO = join(AQUI, 'bruto'), IMG = join(RAIZ, 'public', 'img');
mkdirSync(IMG, { recursive: true });
const b = (n) => join(BRUTO, `${n}.png`);
const tem = (n) => existsSync(b(n));
const feito = [];

const HERO = 'hero-d'; // a foto do hero (fonte/bruto/<nome>.png): sai recortada, com alfa

// nome → larguras e, quando o site usa só um pedaço da foto, o corte [x, y, largura, altura] em frações do quadro
const FOTOS = {
  'macro-rosto': { larguras: [1280, 720] },
  'macro-labios': { larguras: [800] },
  'macro-ombro': { larguras: [696, 440], corte: [0, 0.48, 0.62, 0.52] }, // só a pele das costas: sem o fundo e sem a alça
  maos: { larguras: [900, 520] },
  'area-rosto': { larguras: [800, 440] },
  'area-corpo': { larguras: [800, 440] },
  'area-cabelo': { larguras: [800, 440] },
  madura: { larguras: [1536, 900] },
  'clinica-recepcao': { larguras: [1280, 720] },
  'clinica-sala': { larguras: [900, 520] },
  'clinica-cuidado': { larguras: [1280, 720] },
  'clinica-detalhe': { larguras: [900, 520] },
  'clinica-espera': { larguras: [900, 520] },
  'equipe-1': { larguras: [800, 440] },
  'equipe-2': { larguras: [800, 440] },
  'equipe-3': { larguras: [800, 440] },
};

/** a névoa: a foto pequena, muito desfocada e um pouco mais saturada (as cores escorrem, como tinta molhada) */
async function nevoa(origem, saida, { largura = 168, sigma = 0.07 } = {}) {
  const base = sharp(origem).removeAlpha().resize({ width: largura });
  const { width } = await base.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  await base.blur(Math.max(2, width * sigma)).modulate({ saturation: 1.18 }).webp({ quality: 62 }).toFile(saida);
}

for (const [n, { larguras, corte }] of Object.entries(FOTOS)) {
  if (!tem(n)) continue;
  const inteira = await sharp(b(n)).metadata();
  const area = corte && { left: Math.round(inteira.width * corte[0]), top: Math.round(inteira.height * corte[1]), width: Math.round(inteira.width * corte[2]), height: Math.round(inteira.height * corte[3]) };
  const origem = area ? await sharp(b(n)).extract(area).png().toBuffer() : b(n);
  const meta = area || inteira;
  for (const [i, w] of larguras.entries()) {
    const nome = i === 0 ? `${n}.webp` : `${n}-${w}.webp`;
    await sharp(origem).resize({ width: Math.min(w, meta.width) }).webp({ quality: 80, effort: 6, smartSubsample: true }).toFile(join(IMG, nome));
  }
  await nevoa(origem, join(IMG, `${n}-nevoa.webp`));
  feito.push(area ? `${n} (${meta.width}×${meta.height})` : n);
}

// FECHO: a mulher recortada, com alfa. A silhueta vem do recorte do macOS; o fundo sai pela cor, para não sobrar
// anel claro em volta (ela pisa num bloco de cor). Em outro sistema: recorte com qualquer removedor de fundo e
// salve como fonte/bruto/entre-recorte.png.
function distancia(d, W, H) {
  const D = Math.SQRT2;
  const olha = (k, j, custo) => { if (d[j] + custo < d[k]) d[k] = d[j] + custo; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x;
    if (x > 0) olha(k, k - 1, 1);
    if (y > 0) { olha(k, k - W, 1); if (x > 0) olha(k, k - W - 1, D); if (x < W - 1) olha(k, k - W + 1, D); }
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const k = y * W + x;
    if (x < W - 1) olha(k, k + 1, 1);
    if (y < H - 1) { olha(k, k + W, 1); if (x < W - 1) olha(k, k + W + 1, D); if (x > 0) olha(k, k + W - 1, D); }
  }
}
const suave = (a, c, v) => { const t = Math.min(1, Math.max(0, (v - a) / (c - a))); return t * t * (3 - 2 * t); };
async function semFundo(n, saida, { inteira = false, larguras = [] } = {}) {
  const recorte = join(BRUTO, `${n}-recorte.png`);
  if (!existsSync(recorte)) execFileSync('swift', [join(AQUI, 'recorta.swift'), b(n), recorte], { stdio: 'inherit' });
  const BANDA = 16;
  const foto = sharp(b(n)).removeAlpha();
  const { data: cor, info } = await foto.clone().raw().toBuffer({ resolveWithObject: true });
  const lisa = await foto.clone().blur(1.2).raw().toBuffer();
  const W = info.width, H = info.height, N = W * H;
  const sil = await sharp(recorte).ensureAlpha().extractChannel(3).raw().toBuffer();
  // onde a pessoa sai do quadro (o pé da foto), a borda não é contorno
  const BEIRA = 8;
  for (let k = 0; k < BEIRA; k++) for (let x = 0; x < W; x++) {
    const i = (H - 1 - k) * W + x, de = (H - 1 - BEIRA) * W + x;
    if (sil[de] > sil[i]) sil[i] = sil[de];
  }
  const meio = (c) => { const h = new Uint32Array(256); let t = 0; for (let i = 0; i < N; i++) if (sil[i] === 0) { h[cor[i * 3 + c]]++; t++; } let soma = 0; for (let v = 0; v < 256; v++) { soma += h[v]; if (soma >= t / 2) return v; } return 0; };
  const B = [meio(0), meio(1), meio(2)];
  const longe = (px, i) => {
    let m = 0;
    for (let c = 0; c < 3; c++) { const v = px[i * 3 + c], f = B[c], a = v < f ? (f - v) / f : (v - f) / (255 - f || 1); if (a > m) m = a; }
    return m * 255;
  };
  const conta = new Uint32Array(256);
  let nFora = 0;
  for (let i = 0; i < N; i++) if (sil[i] === 0) { conta[Math.min(255, Math.round(longe(cor, i)))]++; nFora++; }
  let ruido = 0;
  for (let soma = 0; ruido < 255 && (soma += conta[ruido]) < nFora * 0.995;) ruido++;
  ruido += 1;
  const RASO = [Math.max(4, ruido), Math.max(22, ruido * 2.2)];
  const fora = new Float32Array(N);
  for (let i = 0; i < N; i++) fora[i] = sil[i] >= 190 ? 1e6 : 0;
  distancia(fora, W, H);
  const px = Buffer.alloc(N * 4);
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let i = 0; i < N; i++) {
    const d = longe(cor, i);
    let m = suave(0.6, 0.95, sil[i] / 255);
    if (m > 0 && fora[i] < BANDA) m *= Math.max(suave(RASO[0], RASO[1], longe(lisa, i)), suave(BANDA * 0.5, BANDA, fora[i]));
    const a = Math.max(m, (d / 255) * suave(ruido * 0.6, ruido * 2.2, d));
    if (a < 1 / 255) continue;
    for (let c = 0; c < 3; c++) px[i * 4 + c] = Math.min(255, Math.max(0, Math.round(B[c] + (cor[i * 3 + c] - B[c]) / a)));
    // o alfa recua um pouco na borda: os pontos mais claros do contorno (quase só papel) não chegam ao bloco de cor
    px[i * 4 + 3] = Math.round(Math.max(0, (a - 0.14) / 0.86) * 255);
    if (px[i * 4 + 3] >= 6) { const x = i % W, y = (i - x) / W; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const caixa = { left: Math.max(0, x0 - 2), top: Math.max(0, y0 - 2), width: 0, height: 0 };
  caixa.width = Math.min(W, x1 + 3) - caixa.left; caixa.height = Math.min(H, y1 + 3) - caixa.top;
  // inteira: o quadro todo, sem aparar (a página posiciona a pessoa pelo quadro da foto)
  let img = sharp(px, { raw: { width: W, height: H, channels: 4 } });
  if (!inteira) img = img.extract(caixa);
  const png = await img.png().toBuffer();
  await sharp(png).webp({ quality: 86, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(join(IMG, `${saida}.webp`));
  for (const w of larguras) await sharp(png).resize({ width: w }).webp({ quality: 84, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(join(IMG, `${saida}-${w}.webp`));
  const fim = inteira ? { width: W, height: H } : caixa;
  feito.push(`${n} recortada (${fim.width}×${fim.height}, fundo ${B.join(',')})`);
  return { png, width: fim.width, height: fim.height };
}
if (tem('entre')) await semFundo('entre', 'entre');

// HERO: a modelo recortada, com alfa, no quadro inteiro da foto (o nome gigante passa por trás dela). A névoa da
// primeira pintura vai embutida na folha de estilo: a mesma foto, minúscula e desfocada, sobre branco (na página
// ela entra em multiply, então o branco some no painel).
if (tem(HERO)) {
  const { png, width, height } = await semFundo(HERO, 'hero', { inteira: true, larguras: [960] });
  const pequena = await sharp(png).flatten({ background: '#ffffff' }).resize({ width: 72 }).blur(4.2).webp({ quality: 50 }).toBuffer();
  mkdirSync(join(RAIZ, 'src', 'styles'), { recursive: true });
  writeFileSync(join(RAIZ, 'src', 'styles', 'gerado.css'),
    `/* gerado por fonte/imagens.mjs: a névoa da foto do hero (${pequena.length} bytes), para a primeira pintura, e a proporção da foto */\n` +
    `:root {\n  --hero-nevoa: url("data:image/webp;base64,${pequena.toString('base64')}");\n  --hero-foto-w: ${width};\n  --hero-foto-h: ${height};\n}\n`);
  feito.push(`hero (${HERO}, ${width}×${height})`);
}

// GRÃO: o ladrilho da geada, a face fosca do vidro. É branco, e o ruído mora só no alfa: por cima de um desfoque ele
// só clareia, ponto a ponto, como vidro jateado pegando luz. Nunca escurece: ruído cinza em overlay punha pontos
// escuros na foto, e pele com ponto escuro parece suja. São dois pontos do ladrilho por pixel de CSS (--grao-tam é
// a metade do lado), para o grão sair fino também na tela retina.
{
  const T = 192, B = 24, L = T + 2 * B;
  let s = 20261118;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const px = Buffer.alloc(T * T);
  for (let i = 0; i < T * T; i++) px[i] = Math.max(0, Math.min(255, Math.round(128 + ((rnd() + rnd() + rnd() + rnd() - 2) / 0.577) * 50)));
  // desfoque que emenda: o ladrilho repetido em volta antes de desfocar, e só o miolo depois (o sharp devolve o
  // cinza em 1 ou 3 canais conforme a operação: cada passo fica com o primeiro)
  const um = ({ data, info }) => { const o = Buffer.alloc(info.width * info.height); for (let i = 0; i < o.length; i++) o[i] = data[i * info.channels]; return o; };
  const largo = um(await sharp(px, { raw: { width: T, height: T, channels: 1 } }).extend({ top: B, bottom: B, left: B, right: B, extendWith: 'repeat' }).raw().toBuffer({ resolveWithObject: true }));
  const borra = async (sigma) => um(await sharp(um(await sharp(largo, { raw: { width: L, height: L, channels: 1 } }).blur(sigma).raw().toBuffer({ resolveWithObject: true })), { raw: { width: L, height: L, channels: 1 } })
    .extract({ left: B, top: B, width: T, height: T }).raw().toBuffer({ resolveWithObject: true }));
  // fino: um desfoque mínimo junta os pontos em grãos (e não em chuvisco de TV); largo: as manchas grandes, que
  // saem da conta para o ladrilho não aparecer como grade quando se repete
  const fino = await borra(0.55), mancha = await borra(6);
  const v = new Float32Array(T * T);
  let m = 0;
  for (let i = 0; i < v.length; i++) { v[i] = fino[i] - mancha[i]; m += v[i]; }
  m /= v.length;
  let d = 0;
  for (let i = 0; i < v.length; i++) d += (v[i] - m) ** 2;
  d = Math.sqrt(d / v.length);
  // alfa de cada ponto: o ruído cortado no zero um desvio abaixo da média (um ponto em seis fica sem nada), o que
  // dá mais grão para o mesmo tanto de leite: média 0,33, desvio 0,26, em 16 degraus (o arquivo pesa a metade).
  // A força do grão em cada lugar é a opacidade da camada (--grao), não o arquivo.
  const fim = Buffer.alloc(T * T * 2);
  for (let i = 0; i < T * T; i++) {
    const a = Math.max(0, Math.min(255, 77 + ((v[i] - m) / d) * 77));
    fim[i * 2] = 255;
    fim[i * 2 + 1] = Math.round(a / 17) * 17;
  }
  await sharp(fim, { raw: { width: T, height: T, channels: 2 } }).toColourspace('b-w').png({ compressionLevel: 9 }).toFile(join(IMG, 'grao.png'));
  feito.push('grão');
}

console.log('imagens:', feito.join(' · '));
