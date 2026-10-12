import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Download, Save, History, X, CheckCircle2, Leaf, Info, AlertCircle, Zap } from "lucide-react";

// CONSTANTES
// Rangos de Rynk et al. (1992) On-Farm Composting Handbook, NRAES-54: razonable / preferido
const IDEAL_CN = [25, 30]; // preferido
const OK_CN = [20, 40];    // razonable
const IDEAL_HUM = [50, 60]; // preferido (%)
const OK_HUM = [40, 65];    // razonable (%)
const TARGET_CN = 27.5; // Objetivo: centro del rango preferido
const TARGET_HUM = 55;  // Objetivo: centro del rango preferido
// pH: Rynk et al. (1992) On-Farm Composting Handbook, NRAES-54. Razonable 5,5-9,0; preferido 6,5-8,0
const PH_OK = [5.5, 9.0];
const PH_PREF = [6.5, 8.0];
const CE_MAX = 4; // dS/m, valor de referencia que ya usaba la app

// pH y CE (dS/m) de materias primas. Solo valores con referencia publicada; el resto queda sin dato.
// acid: true = la fuente indica carácter ácido pero sin cifra.
const PH_CE_DATA = {
  // AGRÍCOLA
  "1":  { ph: 6.73, ce: 0.5, est: "ce", src: "pH: Fan et al. 2023 (paja de trigo). CE estimada por analogía con sarmiento (Ion et al. 2021)" },
  "2":  { ph: 8.2, ce: 3.3, est: "both", src: "Análogo: poda + césped (Guilabert et al. 2021, UMH)" },
  "2a": { ph: 5.41, ce: 0.5, est: "both", src: "Análogo: sarmiento de vid (Ion et al. 2021)" },
  "2b": { ph: 5.41, ce: 0.5, est: "both", src: "Análogo: sarmiento de vid (Ion et al. 2021)" },
  "2c": { ph: 5.41, ce: 0.5, est: "both", src: "Análogo: sarmiento de vid (Ion et al. 2021)" },
  "2d": { ph: 5.41, ce: 0.5, src: "Ion et al. 2021, sarmiento de vid" },
  "2e": { ph: 5.41, ce: 0.5, est: "both", src: "Análogo: sarmiento de vid (Ion et al. 2021)" },
  "3":  { ph: 7.0, ce: 3.1, est: "ce", src: "pH: restos de maíz/trigo (revisión Agronomy/MDPI). CE: análogo restos de caña (Khater 2015)" },
  "4":  { ph: 5.41, ce: 0.5, est: "both", src: "Análogo débil: material lignocelulósico seco (sarmiento, Ion et al. 2021)" },
  "5":  { ph: 8.2, ce: 3.3, est: "both", src: "Análogo: poda + césped (Guilabert et al. 2021)" },
  "6":  { ph: 8.2, ce: 3.3, est: "both", src: "Análogo: poda + césped (Guilabert et al. 2021)" },
  "7":  { ph: 7.6, ce: 0.5, est: "both", src: "pH: análogo paja de arroz (revisión MDPI). CE: análogo lignocelulósico seco" },
  "8":  { ph: 7.03, ce: 3.1, est: "ce", src: "pH: restos de maíz (revisión MDPI). CE: análogo restos de caña (Khater 2015)" },
  "9":  { ph: 4.8, ce: null, est: "ph", src: "Análogo: ensilado de hierba (pH ~4,8)" },
  "10": { ph: 8.5, ce: 5.8, est: "both", src: "Análogo: restos de posidonia, media de 4 muestras (Guilabert et al. 2021)" },
  // URBANO
  "20": { ph: 5.41, ce: 7.44, src: "Appl. Biol. Chem. 2024 (residuo deshidratado)" },
  "21": { ph: 5.3, ce: null, src: "Env. Sci. Pollut. Res. 2019: fruta pH 4-5, verdura 6-6,5" },
  "22": { ph: 5.29, ce: 6.66, src: "Appl. Biol. Chem. 2024" },
  // INDUSTRIAL
  "40": { ph: 3.85, ce: 2.09, src: "Ion et al. 2021, orujo de uva" },
  "41": { ph: 5.1, ce: 3.6, est: "both", src: "Análogo: alperujo (García-Randez et al. 2023)" },
  "42": { ph: 5.4, ce: null, src: "Assandri et al. 2021: rango bibliográfico pH 3,8-6,9 (valor medio)" },
  "43": { ph: 5.1, ce: 3.6, src: "García-Randez et al. 2023, alperujo, media de 11 almazaras (extracto 1:10)" },
  "44": { ph: 5.3, ce: null, est: "ph", src: "Análogo: restos de frutas y verduras" },
  "45": { ph: 4.5, ce: null, est: "ph", src: "Análogo: residuo de fruta (pH 4-5)" },
  "46": { ph: 3.95, ce: null, src: "BioResources 2022" },
  "47": { ph: 6.2, ce: null, src: "Env. Sci. Pollut. Res. 2019: verdura pH 6-6,5" },
  "48": { ph: 4.5, ce: null, est: "ph", src: "Análogo: residuo de fruta (pH 4-5)" },
  "49": { ph: 6.3, ce: 0.1, est: "both", src: "Análogo: serrín (Waste Biomass Valor. 2021)" },
  // GANADERO
  "60": { ph: 8.1, ce: 4.2, src: "Khater 2015, estiércol vacuno" },
  "61": { ph: 8.51, ce: 11.33, src: "Tortosa et al. 2012 (extracto 1:10)" },
  "62": { ph: 8.51, ce: 11.33, src: "Tortosa et al. 2012, estiércol ovino/caprino (extracto 1:10)" },
  "63": { ph: 7.5, ce: null, src: "NC State University, estiércol porcino fresco" },
  "64": { ph: 7.76, ce: 9.47, src: "Vida Rural (MAPA) 2009, gallina ponedora" },
  "66": { ph: 7.24, ce: 16.74, src: "Compostando Ciencia (EEZ-CSIC)" },
  "67": { ph: 8.24, ce: 9.3, src: "Vida Rural (MAPA) 2009, pollo de engorde" },
  "68": { ph: 8.24, ce: 9.3, est: "both", src: "Análogo: cama de pollos de engorde" }
  // Sin dato: cáscaras de huevo (24) y papel y cartón (25)
};

function phCeLabel(id) {
  const d = PH_CE_DATA[id];
  if (!d) return 'pH: s/d · CE: s/d';
  const mark = k => (d.est === 'both' || d.est === k) ? '≈' : '';
  const ph = d.ph != null ? mark('ph') + d.ph : 's/d';
  const ce = d.ce != null ? `${mark('ce')}${d.ce} dS/m` : 's/d';
  return `pH: ${ph} · CE: ${ce}`;
}

function calculatePhCe(materials) {
  let phW = 0, phSum = 0, ceW = 0, ceSum = 0, total = 0, noData = 0, estimated = 0;
  const acidNoFigure = [];
  materials.forEach(m => {
    const p = m.proportion || 0;
    if (p <= 0) return;
    total += p;
    const dry = p * (1 - m.humidity / 100); // ponderación por materia seca
    const d = PH_CE_DATA[m.id];
    if (!d || (d.ph == null && d.ce == null)) noData += p;
    if (d && d.acid) acidNoFigure.push(m.name);
    if (d && d.est) estimated += p;
    if (d && d.ph != null) { phW += dry; phSum += dry * d.ph; }
    if (d && d.ce != null) { ceW += dry; ceSum += dry * d.ce; }
  });
  return {
    ph: phW > 0 ? +(phSum / phW).toFixed(1) : null,
    ce: ceW > 0 ? +(ceSum / ceW).toFixed(1) : null,
    noDataPct: total > 0 ? Math.round((noData / total) * 100) : 0,
    estPct: total > 0 ? Math.round((estimated / total) * 100) : 0,
    acidNoFigure
  };
}
const MATERIAL_GROUPS = ["Agrícola", "Urbano", "Industrial", "Ganadero"];
// Densidad aparente (kg/m3, material tal cual, con su humedad). Solo valores con referencia publicada;
// est: true = estimación por analogía con un material parecido (se marca con ≈). El resto queda "s/d".
// Con rango se usa el punto medio. Conversión: 1 lb/yd3 = 0,5933 kg/m3.
// Fuente principal: CREF 2021, The Composting Handbook, Apéndice B "Example feedstock characteristics"
// (compila OFCH = Rynk et al. 1992, Tabla A.1; WSU; COTC). Rangos OFCH tomados de la calculadora WSU-Puyallup (2012).
// Materiales mediterráneos: Álvarez de la Puente 2006, Junta de Andalucía (DA en kg/L). Residuos de cocina: MITECO.
// Densidad aparente de la mezcla inicial: preferido 700-1.000 lb/yd3 (415-593 kg/m3); razonable < 1.200 lb/yd3 (712 kg/m3).
// Fuentes: UC ANR (Compost Guidebook, adaptado de Compost Research & Education Foundation); BioCycle 2023 (800-1.000 lb/cy);
// LSU AgCenter 2022 (no superar 1.000 lb/yd3).
const DENS_PREF = [415, 593];
const DENS_MAXOK = 712;
function densStatus(d) {
  if (d == null) return null;
  if (d > DENS_MAXOK) return { lvl: 'bad', label: '⚠ DEMASIADO DENSA', tip: 'Poca aireación: añade material estructurante (poda triturada, paja).' };
  if (d > DENS_PREF[1]) return { lvl: 'ok', label: '≈ ALGO DENSA', tip: 'Aceptable; algo de estructurante mejoraría la aireación.' };
  if (d < DENS_PREF[0]) return { lvl: 'ok', label: '≈ MUY ESPONJOSA', tip: 'Mucho aire: puede secarse y enfriarse. Vigila la humedad.' };
  return { lvl: 'ideal', label: '✓ ADECUADA', tip: null };
}
const DENS_MIN_COVER = 50; // % mínimo de la mezcla con dato para mostrar la densidad aparente de la mezcla
const DENS_DATA = {
  // AGRÍCOLA
  "1":  { min: 129, max: 135, src: "CREF 2021 (OFCH): paja, media 129; paja de avena 135" },
  "2":  { min: 340, max: 349, src: "CREF 2021 (COTC): restos verdes triturados, humedad 29-41 %" },
  "2a": { min: 260, max: 349, est: true, src: "Análogo: recortes de arbusto (OFCH, 260) y restos verdes triturados (COTC, 340-349)" },
  "2b": { min: 500, max: 500, src: "Junta de Andalucía 2006, poda de olivar triturada (0,5 kg/L)" },
  "2c": { min: 260, max: 349, est: true, src: "Análogo: recortes de arbusto (OFCH, 260) y restos verdes triturados (COTC, 340-349)" },
  "2d": { min: 260, max: 349, est: true, src: "Análogo: recortes de arbusto (OFCH, 260) y restos verdes triturados (COTC, 340-349)" },
  "2e": { min: 260, max: 349, est: true, src: "Análogo: recortes de arbusto (OFCH, 260) y restos verdes triturados (COTC, 340-349)" },
  "3":  { min: 90,  max: 98,  est: true, src: "Análogo: cañas de maíz y heno (CREF 2021, COTC)" },
  "4":  { min: 100, max: 119, src: "CREF 2021: hojas sueltas y secas (WSU 100; OFCH 119)" },
  "5":  { min: 180, max: 180, src: "CREF 2021 (WSU): hojas frescas, humedad 65 %" },
  "6":  { min: 180, max: 380, src: "CREF 2021: césped suelto (OFCH, 180) y compactado (WSU, 380)" },
  "7":  { min: 110, max: 130, src: "Rynk et al. 1992, Tabla A.1: cascarilla de arroz 185-219 lb/yd3" },
  "8":  { min: 20,  max: 20,  src: "CREF 2021 (OFCH): cañas de maíz" },
  "9":  { min: 250, max: 250, est: true, src: "Análogo: restos de ensilado (CREF 2021, WSU)" },
  // URBANO
  "20": { min: 600, max: 941, src: "MITECO, biorresiduos (0,6-0,8 t/m3); CREF 2021: restos de cocina y jardín (WSU, 700), basura orgánica (OFCH, 941)" },
  "21": { min: 941, max: 950, src: "CREF 2021: hortalizas (OFCH, 941), restos de fruta y verdura (WSU, 950)" },
  "22": { min: 900, max: 900, src: "CREF 2021 (WSU): posos de café, humedad 80 %" },
  "25": { min: 130, max: 160, src: "CREF 2021: papel y cartón (WSU, 130), cartón (WSU, 160)" },
  // INDUSTRIAL
  "40": { min: 500, max: 500, src: "Junta de Andalucía 2006, orujo de uva (0,5 kg/L)" },
  "41": { min: 890, max: 890, est: true, src: "Análogo: alperujo (Junta de Andalucía 2006, 0,89 kg/L)" },
  "42": { min: 900, max: 900, src: "Engineering ToolBox, bagazo de cervecería húmedo" },
  "43": { min: 890, max: 890, src: "Junta de Andalucía 2006, alperujo (0,89 kg/L)" },
  "44": { min: 941, max: 950, src: "CREF 2021: hortalizas (OFCH, 941), restos de fruta y verdura (WSU, 950)" },
  "45": { min: 941, max: 950, est: true, src: "Análogo: hortalizas y restos de fruta (CREF 2021)" },
  "46": { min: 950, max: 950, est: true, src: "Análogo: restos de fruta (CREF 2021, WSU)" },
  "47": { min: 941, max: 1300, src: "CREF 2021: hortalizas (OFCH, 941), restos de ensalada (COTC, 1.300)" },
  "48": { min: 925, max: 925, src: "CREF 2021 (OFCH): orujo de manzana" },
  "49": { min: 316, max: 316, est: true, src: "Análogo: madera de frondosas, media (CREF 2021, OFCH)" },
  // GANADERO
  "60": { min: 785, max: 993, src: "Rynk et al. 1992 (OFCH): estiércol vacuno 1.323-1.674 lb/yd3, media 865 kg/m3" },
  "61": { min: 1040, max: 1040, src: "CREF 2021 (OFCH): estiércol ovino, humedad 69 %" },
  "62": { min: 1040, max: 1040, est: true, src: "Análogo: estiércol ovino (CREF 2021, OFCH)" },
  "63": { min: 960, max: 960, src: "CREF 2021 (OFCH): estiércol porcino, humedad 80 %" },
  "64": { min: 817, max: 961, src: "Rynk et al. 1992 (OFCH): gallinas ponedoras 1.377-1.620 lb/yd3, media 877 kg/m3" },
  "66": { min: 721, max: 961, src: "Rynk et al. 1992 (OFCH): estiércol equino 1.215-1.620 lb/yd3, media 818 kg/m3" },
  "67": { min: 449, max: 609, src: "Rynk et al. 1992 (OFCH): cama de pollos 756-1.026 lb/yd3, media 513 kg/m3" },
  "68": { min: 465, max: 465, src: "CREF 2021 (OFCH): cama de pavos" }
  // Sin dato: algas marinas (10) y cáscaras de huevo (24)
};

function densLabel(id) {
  const d = DENS_DATA[id];
  if (!d) return 'Dens. aparente: s/d';
  const m = d.est ? '≈' : '';
  return d.min === d.max ? `Dens. aparente: ${m}${d.min} kg/m³` : `Dens. aparente: ${m}${d.min}-${d.max} kg/m³`;
}

function calculateDensity(materials) {
  let total = 0, covered = 0, vol = 0;
  materials.forEach(m => {
    const p = m.proportion || 0;
    if (p <= 0) return;
    total += p;
    const d = DENS_DATA[m.id];
    if (d) { covered += p; vol += p / ((d.min + d.max) / 2); }
  });
  const coverPct = total > 0 ? Math.round((covered / total) * 100) : 0;
  return {
    dens: vol > 0 && coverPct >= DENS_MIN_COVER ? Math.round(covered / vol) : null,
    coverPct
  };
}

const BASE_MATERIALS = [
  // Revisión oct-2026 (%C en base seca, C = %N x C/N): hierba fresca C/N 18 (Clemson CAMM 2020: 45 %C, 2,5 %N);
  // residuos de cocina C/N 15 (restos de comida, Radovich/UH-CTAHR); posos de café C/N 20 (UC Composting 101);
  // gallinaza C/N 10 (UC Composting 101); papel y cartón 40 %C / 0,1 %N, C/N 400 (UC ANR, 4-H);
  // estiércol equino C/N 30 con cama (Rynk 1992 vía MSU Ext.; carbono medido 18,7-47,5 %, Rutgers).
  // AGRÍCOLA
  { id: "1", group: "Agrícola", name: "Paja de cereal", C: 55, N: 0.7, humidity: 15 },
  { id: "2", group: "Agrícola", name: "Poda mixta triturada", C: 50, N: 1.0, humidity: 30 },
  { id: "2a", group: "Agrícola", name: "Poda de frutales", C: 48, N: 1.1, humidity: 35 },
  { id: "2b", group: "Agrícola", name: "Poda de olivo", C: 55, N: 0.9, humidity: 30 },
  { id: "2c", group: "Agrícola", name: "Poda de cítricos", C: 45, N: 1.2, humidity: 40 },
  { id: "2d", group: "Agrícola", name: "Poda de vid", C: 60, N: 0.8, humidity: 25 },
  { id: "2e", group: "Agrícola", name: "Poda de almendro", C: 65, N: 0.7, humidity: 20 },
  { id: "3", group: "Agrícola", name: "Restos de cosecha", C: 60, N: 0.8, humidity: 20 },
  { id: "4", group: "Agrícola", name: "Hojas secas", C: 60, N: 1.0, humidity: 15 },
  { id: "5", group: "Agrícola", name: "Hojas verdes", C: 25, N: 1.8, humidity: 70 },
  { id: "6", group: "Agrícola", name: "Hierba fresca", C: 45, N: 2.5, humidity: 80 },
  // Fuente materiales 7-10, 48-49, 67-68: On-Farm Composting Handbook (Rynk et al., 1992), Tabla A.1. C = %N x C/N
  { id: "7", group: "Agrícola", name: "Cascarilla de arroz", C: 36.3, N: 0.3, humidity: 14 },
  { id: "8", group: "Agrícola", name: "Cañas de maíz", C: 46.6, N: 0.7, humidity: 12 },
  { id: "9", group: "Agrícola", name: "Ensilado de maíz", C: 52.7, N: 1.3, humidity: 66 },
  { id: "10", group: "Agrícola", name: "Algas marinas", C: 32.3, N: 1.9, humidity: 53 },
  // URBANO
  { id: "20", group: "Urbano", name: "Residuos de cocina", C: 37.5, N: 2.5, humidity: 85 },
  { id: "21", group: "Urbano", name: "Restos de frutas y verduras", C: 20, N: 2.2, humidity: 90 },
  { id: "22", group: "Urbano", name: "Posos de café", C: 40, N: 2.0, humidity: 80 },
  { id: "24", group: "Urbano", name: "Cáscaras de huevo", C: 15, N: 1.2, humidity: 5 },
  { id: "25", group: "Urbano", name: "Papel y cartón", C: 40, N: 0.1, humidity: 10 },
  // INDUSTRIAL
  { id: "40", group: "Industrial", name: "Orujo de uva", C: 30, N: 1.8, humidity: 60 },
  { id: "41", group: "Industrial", name: "Pulpa de aceituna", C: 45, N: 1.2, humidity: 65 },
  { id: "42", group: "Industrial", name: "Bagazo cervecero", C: 14, N: 2.8, humidity: 80 },
  { id: "43", group: "Industrial", name: "Restos de almazara", C: 40, N: 1.5, humidity: 55 },
  { id: "44", group: "Industrial", name: "Descartes hortofrutícolas", C: 20, N: 2.2, humidity: 85 },
  { id: "45", group: "Industrial", name: "Pulpa de tomate", C: 18, N: 2.5, humidity: 90 },
  { id: "46", group: "Industrial", name: "Restos de cítricos", C: 35, N: 1.6, humidity: 75 },
  { id: "47", group: "Industrial", name: "IV gama (ensaladas)", C: 22, N: 2.1, humidity: 88 },
  { id: "48", group: "Industrial", name: "Orujo de manzana", C: 52.8, N: 1.1, humidity: 88 },
  { id: "49", group: "Industrial", name: "Corteza de frondosas", C: 54.0, N: 0.24, humidity: 59 },
  // GANADERO
  { id: "60", group: "Ganadero", name: "Estiércol vacuno", C: 42, N: 2.1, humidity: 75 },
  { id: "61", group: "Ganadero", name: "Estiércol ovino", C: 30, N: 2.5, humidity: 65 },
  { id: "62", group: "Ganadero", name: "Estiércol caprino", C: 28, N: 2.6, humidity: 60 },
  { id: "63", group: "Ganadero", name: "Estiércol porcino", C: 14, N: 3.5, humidity: 85 },
  { id: "64", group: "Ganadero", name: "Gallinaza", C: 40, N: 4.0, humidity: 70 },
  { id: "66", group: "Ganadero", name: "Estiércol equino", C: 42, N: 1.4, humidity: 60 },
  { id: "67", group: "Ganadero", name: "Cama de pollos de engorde", C: 37.1, N: 2.75, humidity: 34 },
  { id: "68", group: "Ganadero", name: "Cama de pavos", C: 41.6, N: 2.6, humidity: 26 }
];

const normalizeMaterial = m => ({ ...m, proportion: typeof m.proportion === "number" ? m.proportion : 0 });

function calculateMix(materials) {
  if (!materials || materials.length === 0) return { cn: 0, hum: 0 };
  let totalC = 0, totalN = 0, totalWater = 0, totalFresh = 0;
  materials.forEach(raw => {
    const m = normalizeMaterial(raw);
    const fresh = m.proportion;
    const dry = fresh * (1 - m.humidity / 100);
    totalC += dry * (m.C / 100);
    totalN += dry * (m.N / 100);
    totalWater += fresh - dry;
    totalFresh += fresh;
  });
  return {
    cn: totalN > 0 ? +(totalC / totalN).toFixed(1) : 0,
    hum: totalFresh > 0 ? +((totalWater / totalFresh) * 100).toFixed(1) : 0
  };
}

// OPTIMIZACIÓN
// Criterio: primero acercar la C/N al rango preferido; después, la humedad (que puede corregirse con riego o aireación).
// Cada ingrediente elegido conserva al menos MIN_SHARE % de la mezcla (criterio didáctico).
const MIN_SHARE = 10;

function mixStats(mats, props) {
  let C = 0, N = 0, W = 0, F = 0;
  mats.forEach((m, i) => {
    const fresh = props[i], dry = fresh * (1 - m.humidity / 100);
    C += dry * m.C / 100; N += dry * m.N / 100; W += fresh - dry; F += fresh;
  });
  return { cn: N > 0 ? C / N : 0, hum: F > 0 ? (W / F) * 100 : 0 };
}

function distTo(v, r) { return v < r[0] ? r[0] - v : v > r[1] ? v - r[1] : 0; }

function mixScore(st) {
  return distTo(st.cn, IDEAL_CN) * 100 + distTo(st.hum, IDEAL_HUM)
    + 0.01 * Math.abs(st.cn - TARGET_CN) + 0.001 * Math.abs(st.hum - TARGET_HUM);
}

// Búsqueda local por transferencias entre pares, con pasos decrecientes y varios puntos de partida
function searchProportions(mats, minShare) {
  const n = mats.length;
  const starts = [mats.map(() => 100 / n)];
  for (let k = 0; k < n; k++) starts.push(mats.map((_, i) => (i === k ? 100 - minShare * (n - 1) : minShare)));
  let best = null, bestScore = Infinity;
  starts.forEach(start => {
    let p = start.slice(), sc = mixScore(mixStats(mats, p));
    [10, 5, 2, 1, 0.5, 0.1].forEach(step => {
      let improved = true, guard = 0;
      while (improved && guard++ < 2000) {
        improved = false;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
          if (i === j || p[j] - step < minShare - 1e-9) continue;
          const q = p.slice(); q[i] += step; q[j] -= step;
          const s2 = mixScore(mixStats(mats, q));
          if (s2 < sc - 1e-9) { p = q; sc = s2; improved = true; }
        }
      }
    });
    if (sc < bestScore) { bestScore = sc; best = p; }
  });
  return best;
}

function roundTo100(props) {
  const r = props.map(p => Math.round(p * 10) / 10);
  const diff = Math.round((100 - r.reduce((a, b) => a + b, 0)) * 10) / 10;
  if (diff !== 0) { const k = r.indexOf(Math.max(...r)); r[k] = Math.round((r[k] + diff) * 10) / 10; }
  return r;
}

function suggestFor(need, selected) {
  const ids = new Set(selected.map(m => m.id));
  const out = [];
  MATERIAL_GROUPS.forEach(g => {
    const cands = BASE_MATERIALS.filter(m => m.group === g && !ids.has(m.id))
      .filter(m => need === 'N' ? m.C / m.N <= OK_CN[0] : m.C / m.N >= OK_CN[1])
      .sort((a, b) => need === 'N' ? (a.C / a.N) - (b.C / b.N) : (b.C / b.N) - (a.C / a.N));
    if (cands.length) out.push(cands[0].name);
  });
  return out;
}

function optimizeMixSmart(materials) {
  const n = materials.length;
  const minShare = Math.min(MIN_SHARE, 100 / n);
  const props = roundTo100(searchProportions(materials, minShare));
  const st = mixStats(materials, props);
  const cn = +st.cn.toFixed(1), hum = +st.hum.toFixed(1);
  const need = st.cn > IDEAL_CN[1] ? 'N' : st.cn < IDEAL_CN[0] ? 'C' : null;
  const cnLevel = need === null ? 'ideal' : (st.cn >= OK_CN[0] && st.cn <= OK_CN[1] ? 'ok' : 'bad');
  let humAdvice = null;
  if (hum < IDEAL_HUM[0]) humAdvice = `La humedad queda en ${hum} %. Riega la mezcla al montarla hasta llegar a ${IDEAL_HUM[0]}-${IDEAL_HUM[1]} % (prueba del puño: al apretar debe soltar como mucho unas gotas).`;
  if (hum > IDEAL_HUM[1]) humAdvice = `La humedad queda en ${hum} %. Añade material seco estructurante o voltea más a menudo para airear y bajar a ${IDEAL_HUM[0]}-${IDEAL_HUM[1]} %.`;
  return {
    materials: materials.map((m, i) => ({ ...m, proportion: props[i] })),
    apply: cnLevel !== 'bad', cn, hum, need, cnLevel, humAdvice,
    suggestions: need ? suggestFor(need, materials) : []
  };
}

function rangeStatus(v, ideal, ok) {
  if (v >= ideal[0] && v <= ideal[1]) return 'ideal';
  if (v >= ok[0] && v <= ok[1]) return 'ok';
  return 'bad';
}

function buildRecommendation(cn, hum) {
  if (cn < OK_CN[0]) return "⚠️ Demasiado nitrógeno. Añade material seco (paja, poda).";
  if (cn > OK_CN[1]) return "⚠️ Demasiado carbono. Añade material fresco (restos de cocina, estiércol).";
  if (hum < OK_HUM[0]) return "⚠️ Mezcla seca. Añade materiales húmedos o agua.";
  if (hum > OK_HUM[1]) return "⚠️ Muy húmeda. Añade material seco estructurante.";
  if (cn < IDEAL_CN[0]) return `💡 C/N aceptable pero algo baja. Añade un poco de material seco para acercarte a ${IDEAL_CN[0]}-${IDEAL_CN[1]}.`;
  if (cn > IDEAL_CN[1]) return `💡 C/N aceptable pero algo alta. Añade un poco de material fresco para acercarte a ${IDEAL_CN[0]}-${IDEAL_CN[1]}.`;
  if (hum < IDEAL_HUM[0]) return `💡 Humedad aceptable pero algo baja. Riega o añade material húmedo para llegar a ${IDEAL_HUM[0]}-${IDEAL_HUM[1]}%.`;
  if (hum > IDEAL_HUM[1]) return `💡 Humedad aceptable pero algo alta. Añade algo de material seco para bajar a ${IDEAL_HUM[0]}-${IDEAL_HUM[1]}%.`;
  return "✅ ¡Perfecto! Mezcla óptima para compostaje.";
}

function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener('change', onChange); else mql.addListener(onChange);
    return () => { if (mql.removeEventListener) mql.removeEventListener('change', onChange); else mql.removeListener(onChange); };
  }, [query]);
  return matches;
}

export default function App() {
  const mob = useMediaQuery('(max-width: 768px)'); // móvil
  const wide = useMediaQuery('(min-width: 1025px)'); // escritorio: dos columnas
  const M = (desk, mobile) => (mob ? mobile : desk);
  const [selected, setSelected] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [optResult, setOptResult] = useState(null);
  const [savedMixes, setSavedMixes] = useState([]);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    localStorage.removeItem('customMaterials');
    const savedMixesData = localStorage.getItem('savedMixes');
    if (savedMixesData) setSavedMixes(JSON.parse(savedMixesData));
  }, []);

  const allMaterials = BASE_MATERIALS;
  const stats = useMemo(() => calculateMix(selected), [selected]);
  const phce = useMemo(() => calculatePhCe(selected), [selected]);
  const densMix = useMemo(() => calculateDensity(selected), [selected]);
  const densSt = densStatus(densMix.dens);
  const densWarn = densSt && densSt.lvl !== 'ideal';
  const phWarnings = [];
  if (phce.ph != null) {
    if (phce.ph < PH_OK[0] || phce.ph > PH_OK[1]) phWarnings.push(`pH estimado ${phce.ph}: fuera del rango razonable (${PH_OK[0]}-${PH_OK[1]}). Corrige la mezcla con materiales de pH opuesto.`);
    else if (phce.ph < PH_PREF[0] || phce.ph > PH_PREF[1]) phWarnings.push(`pH estimado ${phce.ph}: dentro del rango razonable pero fuera del preferido (${PH_PREF[0]}-${PH_PREF[1]}). Vigila el arranque del proceso.`);
  }
  if (phce.acidNoFigure.length > 0) phWarnings.push(`Contiene materiales de carácter ácido sin valor numérico: ${phce.acidNoFigure.join(', ')}.`);
  if (phce.ce != null && phce.ce > CE_MAX) phWarnings.push(`CE estimada ${phce.ce} dS/m: por encima de ${CE_MAX} dS/m. Riesgo de salinidad en el compost; reduce la proporción de materiales salinos.`);
  const totalProportion = useMemo(() => selected.reduce((sum, m) => sum + m.proportion, 0), [selected]);

  const cnSt = rangeStatus(stats.cn, IDEAL_CN, OK_CN);
  const humSt = rangeStatus(stats.hum, IDEAL_HUM, OK_HUM);
  const cnOk = cnSt === 'ideal';
  const humOk = humSt === 'ideal';
  const stLabel = st => st === 'ideal' ? "✓ ÓPTIMO" : st === 'ok' ? "≈ ACEPTABLE" : "⚠ AJUSTAR";

  const toggleMaterial = mat => {
    setOptResult(null);
    setSelected(prev =>
      prev.find(m => m.id === mat.id)
        ? prev.filter(m => m.id !== mat.id)
        : [...prev, normalizeMaterial(mat)]
    );
  };

  const updateProp = (id, value) => {
    setOptResult(null);
    setSelected(prev => prev.map(m => (m.id === id ? { ...m, proportion: Math.min(100, Math.max(0, Number(value) || 0)) } : m)));
  };

  const optimizeMix = () => {
    if (selected.length < 2) {
      setOptResult({ kind: 'info', lines: ["Selecciona al menos 2 materiales para optimizar la mezcla."] });
      return;
    }
    setOptimizing(true);
    setTimeout(() => {
      const r = optimizeMixSmart(selected);
      const lines = [];
      const sug = r.suggestions.length ? ` Por ejemplo: ${r.suggestions.join(', ')}.` : '';
      const nutr = r.need === 'N' ? 'nitrógeno' : 'carbono';
      const rich = r.need === 'N' ? 'Todos los materiales elegidos aportan sobre todo carbono.' : 'Todos los materiales elegidos aportan sobre todo nitrógeno.';
      let kind = 'ok';
      if (r.cnLevel === 'bad') {
        kind = 'bad';
        lines.push(`Con estos materiales la C/N no puede ${r.need === 'N' ? 'bajar' : 'subir'} de ${r.cn} (rango razonable ${OK_CN[0]}-${OK_CN[1]}). ${rich} No se cambian las proporciones.`);
        lines.push(`Añade un material rico en ${nutr}.${sug}`);
      } else {
        if (r.cnLevel === 'ok') {
          kind = 'warn';
          lines.push(`Lo más cerca posible con estos materiales es C/N ${r.cn}: aceptable, pero fuera del rango preferido (${IDEAL_CN[0]}-${IDEAL_CN[1]}).`);
          lines.push(`Para mejorarla, añade un material rico en ${nutr}.${sug}`);
        } else {
          lines.push(`Mezcla optimizada: C/N ${r.cn}, dentro del rango preferido (${IDEAL_CN[0]}-${IDEAL_CN[1]}).`);
        }
        if (r.humAdvice) { lines.push(r.humAdvice); if (kind === 'ok') kind = 'warn'; }
        lines.push(`Cada material elegido mantiene al menos un ${Math.round(Math.min(MIN_SHARE, 100 / selected.length))} % de la mezcla.`);
        setSelected(r.materials);
      }
      setOptResult({ kind, lines });
      setOptimizing(false);
    }, 50);
  };

  const distributeEqually = () => {
    if (selected.length < 2) return;
    const equal = +(100 / selected.length).toFixed(1);
    setSelected(prev => prev.map(m => ({ ...m, proportion: equal })));
  };

  const saveMix = () => {
    if (selected.length === 0) return;
    const mixName = prompt("Nombre para esta mezcla:", `Mezcla ${new Date().toLocaleDateString()}`);
    if (!mixName) return;
    const newMix = { id: Date.now(), name: mixName, date: new Date().toISOString(), materials: selected, stats };
    const updated = [newMix, ...savedMixes].slice(0, 10);
    setSavedMixes(updated);
    localStorage.setItem('savedMixes', JSON.stringify(updated));
    alert("✅ Mezcla guardada!");
  };

  const loadMix = (mix) => {
    setSelected(mix.materials);
    setShowHistory(false);
  };

  const deleteMix = (id) => {
    if (confirm("¿Eliminar esta mezcla?")) {
      const updated = savedMixes.filter(m => m.id !== id);
      setSavedMixes(updated);
      localStorage.setItem('savedMixes', JSON.stringify(updated));
    }
  };

  const exportMix = () => {
    if (selected.length === 0) return;
    const text = `COMPOSTMASTER - RECETA OPTIMIZADA
Fecha: ${new Date().toLocaleDateString()}

MATERIALES:
${selected.map((m, i) => `${i + 1}. ${m.name}: ${m.proportion}% (${(m.proportion / 10).toFixed(1)} partes)`).join('\n')}

RESULTADOS:
• C/N: ${stats.cn} ${stLabel(cnSt)}
  Preferido: ${IDEAL_CN[0]}-${IDEAL_CN[1]} · Razonable: ${OK_CN[0]}-${OK_CN[1]}
  
• Humedad: ${stats.hum}% ${stLabel(humSt)}
  Preferido: ${IDEAL_HUM[0]}-${IDEAL_HUM[1]}% · Razonable: ${OK_HUM[0]}-${OK_HUM[1]}%

${buildRecommendation(stats.cn, stats.hum)}

pH Y SALINIDAD (orientativo):
• pH estimado: ${phce.ph != null ? phce.ph : 'sin dato'}
• CE estimada: ${phce.ce != null ? phce.ce + ' dS/m' : 'sin dato'}
• Parte de la mezcla sin datos: ${phce.noDataPct}%
• Parte con valores estimados por analogía: ${phce.estPct}%
${phWarnings.map(w => '⚠ ' + w).join('\n')}

DENSIDAD APARENTE (orientativo):
• Estimada: ${densMix.dens != null ? densMix.dens + ' kg/m³ ' + densSt.label : 'datos insuficientes'}
• Parte de la mezcla con dato: ${densMix.coverPct}%

PARÁMETROS DE REFERENCIA:
• Relación C/N: 25-30 (razonable 20-40)
• Humedad: 50-60% (razonable 40-65%)
• pH: 5,5-9,0 (preferido 6,5-8,0)
• Salinidad (CE): < 4 dS/m
• Densidad aparente de la mezcla: 415-593 kg/m³ (razonable < 712)
• Temperatura (termófila): 55-65°C
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CompostMaster_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm("¿Limpiar toda la mezcla?")) { setSelected([]); setOptResult(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', padding: M('20px', '10px'), overflowX: 'hidden' }}>
      <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>
        
        {/* HEADER */}
        <div style={{ background: 'white', borderRadius: M('24px', '18px'), padding: M('40px', '18px'), marginBottom: M('32px', '14px'), boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: M('20px', '12px') }}>
              <div style={{ width: M('80px', '52px'), height: M('80px', '52px'), flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                <Leaf size={mob ? 30 : 44} color="white" strokeWidth={3} />
              </div>
              <div>
                <h1 style={{ fontSize: M('52px', '30px'), fontWeight: '900', color: '#111827', margin: 0, lineHeight: 1 }}>
                  Compost<span style={{ color: '#10b981' }}>Master</span>
                </h1>
                <p style={{ fontSize: M('20px', '15px'), color: '#6b7280', fontWeight: '600', margin: '8px 0 0 0' }}>
                  Calculadora de Compostaje
                </p>
                <p style={{ fontSize: M('15px', '13px'), color: '#6b7280', fontWeight: '600', margin: '6px 0 0 0' }}>
                  Una aplicación de{' '}
                  <a href="https://www.agroecologia.net/" target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: '800', textDecoration: 'none' }}>
                    Sociedad Española de Agricultura Ecológica y Agroecología (SEAE)
                  </a>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {savedMixes.length > 0 && (
                <button onClick={() => setShowHistory(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: M('18px 24px', '12px 16px'), background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '14px', fontSize: M('17px', '15px'), fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  <History size={24} /> Mis Mezclas ({savedMixes.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FACTORES IDEALES */}
        <details style={{ background: 'white', borderRadius: '20px', padding: M('32px', '18px'), marginBottom: M('32px', '14px'), boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <summary style={{ fontSize: M('24px', '18px'), fontWeight: '800', cursor: 'pointer', color: '#111827', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: M('32px', '24px') }}>📊</span>
            Factores Ideales para el Compostaje
            <span className="chev-down" style={{ marginLeft: 'auto', color: '#10b981' }}>▼</span>
          </summary>
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: M('repeat(auto-fit, minmax(250px, 1fr))', 'repeat(auto-fit, minmax(140px, 1fr))'), gap: M('20px', '10px') }}>
            {[
              { label: "Relación C/N", value: "25-30", bg: '#d1fae5', detail: "Razonable: 20-40" },
              { label: "Humedad", value: "50-60%", bg: '#dbeafe', detail: "Razonable: 40-65%" },
              { label: "pH", value: "5,5-9,0", bg: '#e9d5ff', detail: "Preferido 6,5-8,0" },
              { label: "Salinidad", value: "< 4 dS/m", bg: '#fed7aa', detail: "Baja salinidad" },
              { label: "Densidad aparente", value: "415-593 kg/m³", bg: '#f5e6d8', detail: "Mezcla inicial · razonable < 712" },
              { label: "Temperatura", value: "55-65°C", bg: '#fecaca', detail: "Fase termófila" },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, padding: M('20px', '12px'), borderRadius: '16px', border: '3px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>{item.label}</div>
                <div style={{ fontSize: M('28px', '21px'), fontWeight: '900', color: '#111827', marginBottom: '6px' }}>{item.value}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr 1fr' : '1fr', gap: M('24px', '14px') }}>
          
          {/* SELECCIÓN DE MATERIALES */}
          <div style={{ background: 'white', borderRadius: '20px', padding: M('32px', '16px'), boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: M('32px', '22px'), fontWeight: '900', color: '#111827', marginBottom: M('24px', '16px'), display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: M('36px', '24px') }}>1️⃣</span> Selecciona Materiales
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', margin: '-12px 0 20px 0' }}>
              Los valores de cada material son típicos, tomados de bibliografía: tu material puede variar según su origen, humedad y manejo. ≈ = estimación por analogía; s/d = sin dato.
            </p>
            
            {MATERIAL_GROUPS.map(group => {
              const groupMats = allMaterials.filter(m => m.group === group).sort((a, b) => (b.C / b.N) - (a.C / a.N)); // de más a menos carbono (C/N)
              if (groupMats.length === 0 && group === "Personalizado") return null;
              
              return (
                <details key={group} style={{ background: '#f9fafb', border: '3px solid #e5e7eb', borderRadius: '16px', marginBottom: '12px', overflow: 'hidden' }}>
                  <summary style={{ padding: '16px 20px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', background: 'linear-gradient(90deg, #f9fafb, #f3f4f6)', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px', listStyle: 'none' }}>
                    <span className="chev">▶</span>
                    <span style={{ flex: 1 }}>{group}</span>
                    <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {groupMats.length}
                    </span>
                  </summary>
                  <div style={{ padding: M('20px', '10px'), background: 'white' }}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {groupMats.map(mat => {
                        const isSelected = selected.find(m => m.id === mat.id);
                        const cn = (mat.C / mat.N).toFixed(1);
                        return (
                          <button
                            key={mat.id}
                            onClick={() => toggleMaterial(mat)}
                            style={{
                              padding: M('16px', '12px'),
                              border: isSelected ? '3px solid #10b981' : '3px solid #e5e7eb',
                              borderRadius: '12px',
                              background: isSelected ? '#ecfdf5' : 'white',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s',
                              boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.2)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {isSelected && <CheckCircle2 size={22} color="#10b981" strokeWidth={3} />}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', color: '#111827', fontSize: '15px', marginBottom: '4px' }}>
                                  {mat.name}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                                  C/N: {cn} · Humedad: {mat.humidity}% · {phCeLabel(mat.id)} · {densLabel(mat.id)}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>

          {/* AJUSTES Y RESULTADOS */}
          <div>
            {selected.length > 0 ? (
              <>
                {/* AJUSTAR PROPORCIONES */}
                <div style={{ background: 'white', borderRadius: '20px', padding: M('32px', '16px'), boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: M('32px', '14px') }}>
                  <h2 style={{ fontSize: M('32px', '22px'), fontWeight: '900', color: '#111827', marginBottom: M('24px', '16px'), display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: M('36px', '24px') }}>2️⃣</span> Ajustar Proporciones
                  </h2>

                  {Math.abs(totalProportion - 100) > 0.1 && (
                    <div style={{ background: totalProportion < 100 ? '#fef3c7' : '#fee2e2', border: '3px solid ' + (totalProportion < 100 ? '#fbbf24' : '#ef4444'), borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'start', gap: '12px' }}>
                      <AlertCircle size={24} color={totalProportion < 100 ? '#d97706' : '#dc2626'} strokeWidth={3} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '800', fontSize: '16px', marginBottom: '4px' }}>Total: {totalProportion.toFixed(1)}%</div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {totalProportion < 100 ? `Faltan ${(100 - totalProportion).toFixed(1)}%` : `Te pasas ${(totalProportion - 100).toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button 
                      onClick={optimizeMix} 
                      disabled={optimizing}
                      style={{ 
                        flex: 1,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        padding: '16px', 
                        background: optimizing ? '#9ca3af' : 'linear-gradient(135deg, #f59e0b, #d97706)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        cursor: optimizing ? 'not-allowed' : 'pointer', 
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' 
                      }}
                    >
                      <Zap size={20} /> {optimizing ? 'Optimizando...' : '⚡ Optimizar Mezcla'}
                    </button>
                    
                    <button onClick={clearAll} style={{ padding: M('16px 20px', '14px 14px'), background: 'white', color: '#ef4444', border: '3px solid #ef4444', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                      Limpiar
                    </button>
                  </div>

                  {optResult && (
                    <div role="status" style={{ background: optResult.kind === 'ok' ? '#ecfdf5' : optResult.kind === 'bad' ? '#fee2e2' : optResult.kind === 'warn' ? '#fef3c7' : '#f3f4f6', border: '3px solid ' + (optResult.kind === 'ok' ? '#10b981' : optResult.kind === 'bad' ? '#ef4444' : optResult.kind === 'warn' ? '#fbbf24' : '#d1d5db'), borderRadius: '12px', padding: M('14px 16px', '12px'), marginBottom: '16px', fontSize: '14px', fontWeight: '600', color: '#374151', lineHeight: 1.5 }}>
                      {optResult.lines.map((l, i) => <p key={i} style={{ margin: i ? '6px 0 0 0' : 0 }}>{l}</p>)}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                    {selected.map(m => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f9fafb', padding: '14px', borderRadius: '12px', border: '2px solid #e5e7eb' }}>
                        <button onClick={() => toggleMaterial(m)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={18} strokeWidth={3} />
                        </button>
                        <span style={{ flex: 1, fontWeight: '700', color: '#111827', fontSize: '14px' }}>{m.name}</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={m.proportion}
                          onChange={e => updateProp(m.id, e.target.value)}
                          style={{ width: '70px', padding: '8px', border: '3px solid #d1d5db', borderRadius: '8px', textAlign: 'center', fontWeight: '800', fontSize: '16px' }}
                        />
                        <span style={{ fontWeight: '800', color: '#6b7280' }}>%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RESULTADOS */}
                <div style={{ background: 'white', borderRadius: '20px', padding: M('32px', '16px'), boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: M('28px', '16px') }}>
                    <h2 style={{ fontSize: M('32px', '22px'), fontWeight: '900', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: M('36px', '24px') }}>3️⃣</span> Resultados
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={saveMix} style={{ padding: '10px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}>
                        <Save size={20} strokeWidth={3} />
                      </button>
                      <button onClick={exportMix} style={{ padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}>
                        <Download size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {/* GRÁFICO DE BARRAS */}
                  <div style={{ background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)', padding: M('24px', '14px'), borderRadius: '16px', marginBottom: M('24px', '16px'), border: '3px solid #e5e7eb' }}>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#374151', marginBottom: '16px' }}>Distribución de materiales</div>
                    {selected.map(m => {
                      const percentage = totalProportion > 0 ? (m.proportion / totalProportion) * 100 : 0;
                      const cn = (m.C / m.N).toFixed(0);
                      const color = cn >= 40 ? '#fbbf24' : cn >= 20 ? '#10b981' : '#3b82f6';
                      
                      return (
                        <div key={m.id} style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                            <span style={{ fontWeight: '600', color: '#374151' }}>{m.name}</span>
                            <span style={{ fontWeight: '800', color: '#111827' }}>{m.proportion}%</span>
                          </div>
                          <div style={{ height: '36px', background: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ 
                              width: `${percentage}%`,
                              height: '100%',
                              background: `linear-gradient(90deg, ${color}, ${color})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 12px',
                              transition: 'width 0.5s ease-out'
                            }}>
                              {percentage >= (mob ? 30 : 0) && (
                              <span style={{ color: 'white', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                {(m.proportion / 10).toFixed(1)} partes
                              </span>
                              )}
                              {percentage > (mob ? 60 : 30) && (
                                <span style={{ color: 'white', fontWeight: '700', fontSize: '12px', opacity: 0.9 }}>
                                  C/N: {cn}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* MÉTRICAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: M('20px', '10px'), marginBottom: M('28px', '14px') }}>
                    <div style={{ 
                      background: cnOk ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      padding: M('32px', '16px 10px'),
                      borderRadius: '20px',
                      border: cnOk ? '3px solid #10b981' : '3px solid #fbbf24',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#374151', marginBottom: '12px' }}>RELACIÓN C/N</div>
                      <div style={{ fontSize: M('64px', '40px'), fontWeight: '900', color: cnOk ? '#059669' : '#d97706', lineHeight: 1 }}>
                        {stats.cn}
                      </div>
                      <div style={{ fontSize: M('16px', '13px'), fontWeight: '800', color: cnOk ? '#059669' : '#d97706', marginTop: '12px' }}>
                        {stLabel(cnSt)}
                      </div>
                      <div style={{ fontSize: M('13px', '11px'), color: '#6b7280', fontWeight: '600', marginTop: '6px' }}>
                        Preferido: {IDEAL_CN[0]}-{IDEAL_CN[1]} · Razonable: {OK_CN[0]}-{OK_CN[1]}
                      </div>
                    </div>

                    <div style={{ 
                      background: humOk ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      padding: M('32px', '16px 10px'),
                      borderRadius: '20px',
                      border: humOk ? '3px solid #3b82f6' : '3px solid #fbbf24',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#374151', marginBottom: '12px' }}>HUMEDAD</div>
                      <div style={{ fontSize: M('64px', '40px'), fontWeight: '900', color: humOk ? '#1d4ed8' : '#d97706', lineHeight: 1 }}>
                        {stats.hum}%
                      </div>
                      <div style={{ fontSize: M('16px', '13px'), fontWeight: '800', color: humOk ? '#1d4ed8' : '#d97706', marginTop: '12px' }}>
                        {stLabel(humSt)}
                      </div>
                      <div style={{ fontSize: M('13px', '11px'), color: '#6b7280', fontWeight: '600', marginTop: '6px' }}>
                        Preferido: {IDEAL_HUM[0]}-{IDEAL_HUM[1]}% · Razonable: {OK_HUM[0]}-{OK_HUM[1]}%
                      </div>
                    </div>

                  </div>

                  {/* DATOS INFORMATIVOS: pH, salinidad y densidad */}
                  <div style={{ display: 'grid', gridTemplateColumns: M('repeat(auto-fit, minmax(190px, 1fr))', 'repeat(auto-fit, minmax(140px, 1fr))'), gap: M('16px', '10px'), marginBottom: M('28px', '14px') }}>
                    <div style={{ background: (phce.ph == null || (phce.ph >= PH_OK[0] && phce.ph <= PH_OK[1])) ? 'linear-gradient(135deg, #ffe4e6, #fecdd3)' : 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: M('24px', '14px 10px'), borderRadius: '20px', border: (phce.ph == null || (phce.ph >= PH_OK[0] && phce.ph <= PH_OK[1])) ? '3px solid #f43f5e' : '3px solid #fbbf24', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px' }}>pH</div>
                      <div style={{ fontSize: M('46px', '32px'), fontWeight: '900', color: (phce.ph == null || (phce.ph >= PH_OK[0] && phce.ph <= PH_OK[1])) ? '#be123c' : '#d97706', lineHeight: 1 }}>
                        {phce.ph != null ? phce.ph : 's/d'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: (phce.ph == null || (phce.ph >= PH_OK[0] && phce.ph <= PH_OK[1])) ? '#be123c' : '#d97706', marginTop: '10px' }}>
                        {(phce.ph == null || (phce.ph >= PH_OK[0] && phce.ph <= PH_OK[1])) ? "✓ ORIENTATIVO" : "⚠ REVISAR"}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginTop: '6px' }}>
                        Razonable: {PH_OK[0]}-{PH_OK[1]} · Preferido: {PH_PREF[0]}-{PH_PREF[1]}
                      </div>
                    </div>

                    <div style={{ background: (phce.ce == null || phce.ce <= CE_MAX) ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: M('24px', '14px 10px'), borderRadius: '20px', border: (phce.ce == null || phce.ce <= CE_MAX) ? '3px solid #64748b' : '3px solid #fbbf24', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px' }}>SALINIDAD (CE)</div>
                      <div style={{ fontSize: M('46px', '32px'), fontWeight: '900', color: (phce.ce == null || phce.ce <= CE_MAX) ? '#334155' : '#d97706', lineHeight: 1 }}>
                        {phce.ce != null ? phce.ce : 's/d'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: (phce.ce == null || phce.ce <= CE_MAX) ? '#334155' : '#d97706', marginTop: '10px' }}>
                        {(phce.ce == null || phce.ce <= CE_MAX) ? "✓ ORIENTATIVO" : "⚠ REVISAR"}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginTop: '6px' }}>
                        dS/m · Máximo: {CE_MAX}
                      </div>
                    </div>

                    <div style={{ background: densWarn ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : 'linear-gradient(135deg, #f5e6d8, #e8d2bd)', padding: M('24px', '14px 10px'), gridColumn: mob ? '1 / -1' : 'auto', borderRadius: '20px', border: densWarn ? '3px solid #fbbf24' : '3px solid #a9794f', textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '10px' }}>DENSIDAD APARENTE</div>
                      <div style={{ fontSize: M('46px', '32px'), fontWeight: '900', color: densWarn ? '#d97706' : '#7c4a24', lineHeight: 1 }}>
                        {densMix.dens != null ? densMix.dens : 's/d'}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: densWarn ? '#d97706' : '#7c4a24', marginTop: '10px' }}>
                        {densSt ? densSt.label : "ℹ DATOS INSUFICIENTES"}
                      </div>
                      {densSt && densSt.tip && (
                        <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '700', marginTop: '6px' }}>{densSt.tip}</div>
                      )}
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginTop: '6px' }}>
                        kg/m³ · Preferido: {DENS_PREF[0]}-{DENS_PREF[1]} · Con dato: {densMix.coverPct}% de la mezcla
                      </div>
                    </div>
                  </div>

                  {selected.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginTop: '-12px', marginBottom: '28px' }}>
                      Densidad aparente: dato informativo (kg/m³, material con su humedad). Se calcula sumando volúmenes solo de los materiales con dato (≈ indica estimación por analogía; «s/d», sin dato) y se muestra si cubren al menos el {DENS_MIN_COVER}% de la mezcla. La densidad aparente real depende de la compactación y de la humedad, y suele ser algo mayor que la calculada porque las partículas finas ocupan huecos de las gruesas.
                    </div>
                  )}

                  {/* pH Y SALINIDAD */}
                  {selected.length > 0 && (
                    <div style={{ background: phWarnings.length ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#f9fafb', padding: M('24px', '14px'), borderRadius: '16px', border: phWarnings.length ? '3px solid #fbbf24' : '3px solid #e5e7eb', marginBottom: '28px' }}>
                      <div style={{ fontWeight: '900', fontSize: '18px', color: '#111827', marginBottom: '10px' }}>pH y salinidad (orientativo)</div>
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
                        <span>Mezcla sin datos: {phce.noDataPct}%</span>
                        <span>Con valores estimados (≈): {phce.estPct}%</span>
                      </div>
                      {phWarnings.map((w, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'start', fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>
                          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} /> <span>{w}</span>
                        </div>
                      ))}
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginTop: '8px' }}>
                        Media ponderada por materia seca. Los valores marcados con ≈ son estimaciones por analogía con materiales parecidos, no datos medidos de ese material. El pH real de una mezcla no es una media, y las fuentes usan métodos de extracción distintos: tómalo como indicación, no como analítica.
                      </div>
                    </div>
                  )}

                  {/* RECOMENDACIÓN */}
                  <div style={{ 
                    background: cnOk && humOk ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    padding: M('24px', '14px'),
                    borderRadius: '16px',
                    border: cnOk && humOk ? '3px solid #10b981' : '3px solid #fbbf24',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{ fontSize: M('42px', '30px') }}>{cnOk && humOk ? "🎉" : "💡"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '900', fontSize: '20px', marginBottom: '8px', color: cnOk && humOk ? '#065f46' : '#92400e' }}>
                        {cnOk && humOk ? "¡Mezcla Perfecta!" : "Recomendación"}
                      </div>
                      <div style={{ color: '#374151', fontWeight: '600', lineHeight: 1.5 }}>
                        {buildRecommendation(stats.cn, stats.hum)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: 'white', borderRadius: '20px', padding: M('60px 28px', '32px 18px'), boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ width: M('96px', '64px'), height: M('96px', '64px'), background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
                  <Leaf size={52} color="white" strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: M('30px', '22px'), fontWeight: '900', color: '#111827', marginBottom: '12px' }}>¡Comienza tu Mezcla!</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: '600', maxWidth: '400px', margin: '0 auto' }}>
                  Selecciona materiales de la izquierda para calcular la relación C/N y humedad óptimas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PIE: TITULARIDAD Y DERECHOS */}
        <details style={{ marginTop: '32px', background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', color: '#4b5563', fontSize: '13px', lineHeight: 1.6 }}>
          <summary style={{ fontWeight: '800', fontSize: '15px', color: '#111827', cursor: 'pointer' }}>Fuentes de los datos</summary>
          <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px' }}>
            <li>Rangos de C/N, humedad y pH, y parte de los materiales: Rynk, R. (ed.) et al. (1992). <i>On-Farm Composting Handbook</i> (NRAES-54). NRAES, Ithaca (NY).</li>
            <li>Densidad aparente y otros materiales: Compost Research &amp; Education Foundation (2021). <i>The Composting Handbook</i>, Apéndice B; WSU-Puyallup, Compost Mix Calculator (2012).</li>
            <li>Materiales mediterráneos (alperujo, orujo de uva, poda de olivo): Álvarez de la Puente, J. M. (2006). Estudio sobre mezclas óptimas de material vegetal para compostaje de alperujos. Junta de Andalucía.</li>
            <li>pH y salinidad: publicaciones científicas citadas por material (Ion et al. 2021, García-Randez et al. 2023, Tortosa et al. 2012, Khater 2015, entre otras).</li>
            <li>Residuos de cocina: MITECO, Biorresiduos: características.</li>
          </ul>
        </details>

        <footer style={{ marginTop: '16px', background: 'white', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', textAlign: 'center', color: '#4b5563', fontSize: '14px', lineHeight: 1.6 }}>
          <p style={{ margin: 0, fontWeight: '600' }}>
            CompostMaster es una aplicación de la{' '}
            <a href="https://www.agroecologia.net/" target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: '700' }}>
              Sociedad Española de Agricultura Ecológica y Agroecología (SEAE)
            </a>.
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            © 2026 SEAE. Todos los derechos reservados. Acceso y uso gratuito y público de la herramienta.
          </p>
          <p style={{ margin: '4px 0 0 0' }}>
            Contacto:{' '}
            <a href="mailto:comunicacion@agroecologia.net" style={{ color: '#059669', fontWeight: '700' }}>comunicacion@agroecologia.net</a>
            {' · '}Tlf:{' '}
            <a href="tel:+34961267122" style={{ color: '#059669', fontWeight: '700' }}>961 267 122</a>
          </p>
        </footer>

        {/* MODALES - (igual que antes, sin cambios)  */}

        {showHistory && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: M('20px', '8px'), zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: '24px', maxWidth: '800px', width: '100%', padding: M('32px', '16px'), maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: M('28px', '20px'), fontWeight: '900', color: '#111827', margin: 0 }}>Mezclas Guardadas</h3>
                <button onClick={() => setShowHistory(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>
              {savedMixes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
                  <p style={{ fontSize: '18px', color: '#6b7280', fontWeight: '600' }}>No hay mezclas guardadas</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {savedMixes.map(mix => (
                    <div key={mix.id} style={{ border: '3px solid #e5e7eb', borderRadius: '16px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', margin: '0 0 4px 0' }}>{mix.name}</h4>
                          <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', margin: 0 }}>
                            {new Date(mix.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => loadMix(mix)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                            Cargar
                          </button>
                          <button onClick={() => deleteMix(mix.id)} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ background: '#d1fae5', padding: '8px 16px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#065f46', fontWeight: '600' }}>C/N: </span>
                          <span style={{ fontSize: '18px', color: '#059669', fontWeight: '900' }}>{mix.stats.cn}</span>
                        </div>
                        <div style={{ background: '#dbeafe', padding: '8px 16px', borderRadius: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>Humedad: </span>
                          <span style={{ fontSize: '18px', color: '#1d4ed8', fontWeight: '900' }}>{mix.stats.hum}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @media (hover: hover) {
          button:hover {
            transform: translateY(-2px);
            transition: all 0.2s;
          }
          button:active {
            transform: translateY(0);
          }
        }
        .chev, .chev-down { display: inline-block; transition: transform 0.2s; }
        details[open] > summary .chev { transform: rotate(90deg); }
        details[open] > summary .chev-down { transform: rotate(180deg); }
        summary::-webkit-details-marker { display: none; }
      `}</style>
    </div>
  );
}
