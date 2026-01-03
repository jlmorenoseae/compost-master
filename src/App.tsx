// CompostMaster – versión profesional basada en OpenAI
// Réplica funcional de la app Gemini, con arquitectura segura y código robusto

import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Sparkles, RefreshCw, Copy, Check } from "lucide-react";

// ===============================
// RANGOS IDEALES
// ===============================
const IDEAL_CN = [25, 35];
const IDEAL_HUM = [50, 60];

// ===============================
// GRUPOS DE MATERIALES
// ===============================
const MATERIAL_GROUPS = ["Agrícola", "Urbano", "Industrial", "Ganadero"];

// Subcategorías según C/N
const CN_GROUPS = [
  { key: "carbonados", label: "Carbonados", min: 40 },
  { key: "equilibrados", label: "Equilibrados", min: 20, max: 40 },
  { key: "nitrogenados", label: "Nitrogenados", max: 20 }
];

// ===============================
// MATERIALES BASE
// ===============================
const BASE_MATERIALS = [
  // AGRÍCOLA
  { id: "1", group: "Agrícola", name: "Paja de cereal", C: 55, N: 0.7, humidity: 15 },
  { id: "2", group: "Agrícola", name: "Rastrojo de maíz", C: 60, N: 0.8, humidity: 20 },
  { id: "3", group: "Agrícola", name: "Poda mixta triturada", C: 50, N: 1.0, humidity: 30 },
  { id: "4", group: "Agrícola", name: "Hojas secas", C: 60, N: 1.0, humidity: 15 },
  { id: "5", group: "Agrícola", name: "Hojas verdes", C: 30, N: 2.0, humidity: 65 },
  { id: "6", group: "Agrícola", name: "Poda de olivo", C: 52, N: 1.1, humidity: 30 },
  { id: "7", group: "Agrícola", name: "Poda de almendro", C: 55, N: 0.9, humidity: 25 },
  { id: "8", group: "Agrícola", name: "Sarmientos de vid", C: 60, N: 0.8, humidity: 20 },
  { id: "9", group: "Agrícola", name: "Caña común", C: 65, N: 0.6, humidity: 20 },
  { id: "10", group: "Agrícola", name: "Cáscara de almendra", C: 80, N: 0.5, humidity: 10 },

  // URBANO
  { id: "20", group: "Urbano", name: "Residuos de cocina", C: 18, N: 2.5, humidity: 85 },
  { id: "21", group: "Urbano", name: "Restos de frutas y verduras", C: 20, N: 2.2, humidity: 90 },
  { id: "22", group: "Urbano", name: "Posos de café", C: 52, N: 2.1, humidity: 65 },
  { id: "23", group: "Urbano", name: "Bolsitas de té", C: 35, N: 1.8, humidity: 70 },
  { id: "24", group: "Urbano", name: "Césped fresco", C: 46, N: 3.2, humidity: 80 },
  { id: "25", group: "Urbano", name: "Papel y cartón", C: 200, N: 0.2, humidity: 10 },
  { id: "26", group: "Urbano", name: "Serrín", C: 300, N: 0.1, humidity: 12 },

  // INDUSTRIAL
  { id: "40", group: "Industrial", name: "Orujo de uva", C: 30, N: 1.8, humidity: 60 },
  { id: "41", group: "Industrial", name: "Raspón de uva", C: 35, N: 1.3, humidity: 65 },
  { id: "42", group: "Industrial", name: "Alperujo", C: 40, N: 1.4, humidity: 65 },
  { id: "43", group: "Industrial", name: "Bagazo cervecero", C: 20, N: 2.5, humidity: 75 },
  { id: "44", group: "Industrial", name: "Pulpa de remolacha", C: 25, N: 1.6, humidity: 75 },

  // GANADERO
  { id: "60", group: "Ganadero", name: "Estiércol vacuno", C: 42, N: 2.1, humidity: 75 },
  { id: "61", group: "Ganadero", name: "Estiércol ovino", C: 30, N: 2.5, humidity: 60 },
  { id: "62", group: "Ganadero", name: "Estiércol porcino", C: 20, N: 3.0, humidity: 80 },
  { id: "63", group: "Ganadero", name: "Gallinaza", C: 38, N: 5.5, humidity: 60 },
  { id: "64", group: "Ganadero", name: "Purín", C: 12, N: 4.0, humidity: 95 },
  { id: "65", group: "Ganadero", name: "Estiércol equino (sin cama)", C: 35, N: 1.9, humidity: 70 },
  { id: "66", group: "Ganadero", name: "Estiércol equino (con cama)", C: 55, N: 1.4, humidity: 60 }
];

// ===============================
// UTILIDADES
// ===============================
const normalizeMaterial = m => ({
  ...m,
  proportion: typeof m.proportion === "number" ? m.proportion : 0,
  parts: typeof m.parts === "number" ? m.parts : 0
});

export function calculateMix(materials) {
  if (!materials || materials.length === 0) return { cn: 0, hum: 0 };

  let totalC = 0;
  let totalN = 0;
  let totalWater = 0;
  let totalFresh = 0;

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

// ===============================
// APP PRINCIPAL
// ===============================
export default function App() {
  const [selected, setSelected] = useState([]);
  const [groupFilter, setGroupFilter] = useState("Todos");
  const [analysis, setAnalysis] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [optError, setOptError] = useState(null);

  const stats = useMemo(() => calculateMix(selected), [selected]);

  useEffect(() => {
    if (selected.length === 0) {
      setShareUrl(null);
      return;
    }
    const encoded = btoa(JSON.stringify(selected));
    setShareUrl(`${window.location.origin}${window.location.pathname}#mix=${encoded}`);
  }, [selected]);

  const toggleMaterial = mat => {
    setSelected(prev =>
      prev.find(m => m.id === mat.id)
        ? prev.filter(m => m.id !== mat.id)
        : [...prev, normalizeMaterial(mat)]
    );
  };

  const updateProp = (id, value) => {
    setSelected(prev => prev.map(m => (m.id === id ? { ...m, proportion: Number(value) || 0 } : m)));
  };

  const updateParts = (id, value) => {
    setSelected(prev => prev.map(m => (m.id === id ? { ...m, parts: Number(value) || 0 } : m)));
  };

  const cnOk = stats.cn >= IDEAL_CN[0] && stats.cn <= IDEAL_CN[1];
  const humOk = stats.hum >= IDEAL_HUM[0] && stats.hum <= IDEAL_HUM[1];

  const warnings = [];
  if (!cnOk) warnings.push("La relación C/N está fuera del rango óptimo (25–35)");
  if (!humOk) warnings.push("La humedad está fuera del rango óptimo (50–60%)");

  const optimizeMix = () => {
    setOptError(null);
    if (selected.length < 2) return;

    const targetCN = (IDEAL_CN[0] + IDEAL_CN[1]) / 2; // ~30

    const enriched = selected.map(m => ({ ...m, cn: m.C / m.N }));

    const weights = enriched.map(m => 1 / (Math.abs(m.cn - targetCN) + 1));
    const weightSum = weights.reduce((a, b) => a + b, 0);

    const rawParts = weights.map(w => (w / weightSum) * 10);
    let intParts = rawParts.map(p => Math.floor(p));
    let remainder = 10 - intParts.reduce((a, b) => a + b, 0);

    const decimals = rawParts
      .map((p, i) => ({ i, frac: p - Math.floor(p) }))
      .sort((a, b) => b.frac - a.frac);

    for (let k = 0; k < remainder; k++) {
      intParts[decimals[k].i] += 1;
    }

    const candidate = enriched.map((m, i) => ({
      ...m,
      parts: intParts[i],
      proportion: (intParts[i] / 10) * 100 // sin redondear
    }));

    const result = calculateMix(candidate);

    const cnOk = result.cn >= IDEAL_CN[0] && result.cn <= IDEAL_CN[1];
    const humOk = result.hum >= IDEAL_HUM[0] && result.hum <= IDEAL_HUM[1];

    if (!cnOk || !humOk) {
      setOptError("No es posible optimizar completamente dentro de los rangos óptimos. Se propone la mezcla más cercana posible.");
    }

    setSelected(candidate);
  };

  const recommend = useMemo(() => {
    if (cnOk && humOk) return null;

    const suggestions = [];

    if (stats.cn > IDEAL_CN[1]) {
      const nitro = BASE_MATERIALS.filter(m => m.N > 2).slice(0, 3);
      suggestions.push(`C/N alto: añade materiales nitrogenados como ${nitro.map(m => m.name).join(", ")}`);
    }

    if (stats.cn < IDEAL_CN[0]) {
      const carb = BASE_MATERIALS.filter(m => m.C / m.N > 50).slice(0, 3);
      suggestions.push(`C/N bajo: añade materiales carbonados como ${carb.map(m => m.name).join(", ")}`);
    }

    if (stats.hum > IDEAL_HUM[1]) {
      const dry = BASE_MATERIALS.filter(m => m.humidity < 20).slice(0, 3);
      suggestions.push(`Humedad alta: añade materiales secos como ${dry.map(m => m.name).join(", ")}`);
    }

    if (stats.hum < IDEAL_HUM[0]) {
      const wet = BASE_MATERIALS.filter(m => m.humidity > 70).slice(0, 3);
      suggestions.push(`Humedad baja: añade materiales húmedos como ${wet.map(m => m.name).join(", ")}`);
    }

    return suggestions.length > 0 ? suggestions : null;
  }, [stats, cnOk, humOk]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CompostMaster · OpenAI</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${cnOk ? "bg-green-100" : "bg-red-100"}`}>
          <div className="font-bold">Relación C/N</div>
          <div className="text-3xl">{stats.cn}</div>
        </div>
        <div className={`p-4 rounded-xl ${humOk ? "bg-green-100" : "bg-red-100"}`}>
          <div className="font-bold">Humedad (%)</div>
          <div className="text-3xl">{stats.hum}</div>
        </div>
      </div>

      {optError && (
        <div className="bg-red-50 border border-red-300 p-3 rounded mb-4 text-sm text-red-800">⚠️ {optError}</div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border p-3 rounded mb-4 text-sm">
          {warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
          {recommend && <div className="mt-2 font-semibold">💡 {recommend}</div>}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold">Mezcla</h2>
          <button
            onClick={optimizeMix}
            className="flex items-center gap-1 text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            <Sparkles size={14} /> Optimizar
          </button>
        </div>
        {selected.map(m => (
          <div key={m.id} className="flex items-center gap-3 mb-2">
            <button onClick={() => toggleMaterial(m)} className="text-red-500"><Trash2 size={16} /></button>
            <span className="flex-1">{m.name}</span>
            <input type="number" value={m.proportion} onChange={e => updateProp(m.id, e.target.value)} className="w-20 border rounded p-1" />
            <span>%</span>
            <input type="number" value={m.parts} onChange={e => updateParts(m.id, e.target.value)} className="w-20 border rounded p-1 ml-2" />
            <span className="text-xs text-gray-500">partes/10</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl">
        <h2 className="font-bold mb-3">Biblioteca de materiales</h2>
        {MATERIAL_GROUPS.map(group => (
          <details key={group} className="border rounded-lg mb-2">
            <summary className="cursor-pointer bg-slate-100 px-3 py-2 font-semibold">{group}</summary>
            <div className="p-3">
              {CN_GROUPS.map(cnGroup => {
                const mats = BASE_MATERIALS
                  .filter(m => m.group === group)
                  .filter(m => {
                    const cn = m.C / m.N;
                    if (cnGroup.min && cn < cnGroup.min) return false;
                    if (cnGroup.max && cn >= cnGroup.max) return false;
                    return true;
                  })
                  .sort((a, b) => a.C / a.N - b.C / b.N);

                if (mats.length === 0) return null;

                return (
                  <div key={cnGroup.key} className="mb-4">
                    <div className="font-semibold text-sm mb-2">{cnGroup.label}</div>
                    <div className="grid grid-cols-2 gap-3">
                      {mats.map(mat => (
                        <button key={mat.id} onClick={() => toggleMaterial(mat)} className="border rounded-lg p-3 hover:bg-green-50 text-left">
                          <div className="font-semibold">{mat.name}</div>
                          <div className="text-xs text-gray-500">C/N ≈ {(mat.C / mat.N).toFixed(1)} | Hum {mat.humidity}%</div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
