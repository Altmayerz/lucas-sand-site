// Curvas e tempos da casa. Três durações (curta, média, longa), um escalonamento e as curvas; todo o movimento do
// site sai daqui, para tudo ter a mesma assinatura: saídas longas e macias, como algo que vem à tona.
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(CustomEase, ScrollTrigger);

export const DUR = { s: 0.32, m: 0.7, l: 1.2 };
export const PASSO = 0.08; // escalonamento entre peças
export const QUEBRA = 900; // abaixo disso, o layout do celular

export const desktop = () => innerWidth >= QUEBRA;
export const REDUZIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;

CustomEase.create('t-out', '0.22,1,0.36,1'); // tudo que entra (easeOutQuint)
CustomEase.create('t-io', '0.65,0,0.35,1'); // troca de estado (easeInOutCubic)
CustomEase.create('t-in', '0.5,0,0.75,0'); // tudo que sai

export const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mistura = (a, b, t) => a + (b - a) * t;

export { gsap, ScrollTrigger };
