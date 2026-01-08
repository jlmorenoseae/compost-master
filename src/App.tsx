// CompostMaster – versión profesional basada en OpenAI
// Calculadora de compostaje guiada estilo UMH, con modo experto implícito

import React, { useState, useMemo } from "react";
import { Trash2, Sparkles } from "lucide-react";

// ===============================
// RANGOS IDEALES
// ===============================
const IDEAL_CN = [20, 30];
const IDEAL_HUM = [50, 60];

// ===============================
// GRUPOS DE MATERIALES
// ===============================
const MATERIAL_GROUPS = ["Agrícola", "Urbano", "Industrial", "Ganadero"];

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
  { id: "2", group: "Agrícola", name: "Poda mixta triturada", C: 50, N: 1.0, humidity: 30 },
  { id: "2a", group: "Agrícola", name: "Poda de frutales (manzano, peral)", C: 48, N: 1.1, humidity: 35 },
  { id: "2b", group: "Agrícola", name: "Poda de olivo", C: 55, N: 0.9, humidity: 30 },
  { id: "2c", group: "Agrícola", name: "Poda de cítricos", C: 45, N: 1.2, humidity: 40 },
  { id: "2d", group: "Agrícola", name: "Poda de vid", C: 60, N: 0.8, humidity: 25 },
  { id: "2e", group: "Agrícola", name: "Poda de almendro y otros leñosos", C: 65, N: 0.7, humidity: 20 },
  { id: "3", group: "Agrícola", name: "Restos de cosecha", C: 60, N: 0.8, humidity: 20 },
  { id: "4", group: "Agrícola", name: "Hojas secas", C: 60, N: 1.0, humidity: 15 },
  { id: "5", group: "Agrícola", name: "Hojas verdes", C: 25, N: 1.8, humidity: 70 },
  { id: "6", group: "Agrícola", name: "Hierba fresca", C: 20, N: 2.5, humidity: 80 },

  // URBANO
  { id: "20", group: "Urbano", name: "Residuos de cocina", C: 18, N: 2.5, humidity: 85 },
  { id: "21", group: "Urbano", name: "Restos de frutas y verduras", C: 20, N: 2.2, humidity: 90 },
  { id: "22", group: "Urbano", name: "Posos de café", C: 20, N: 2.0, humidity: 80 },
  { id: "23", group: "Urbano", name: "Bolsas de infusión / té", C: 30, N: 1.5, humidity: 70 },
  { id: "24", group: "Urbano", name: "Cáscaras de huevo trituradas", C: 15, N: 1.2, humidity: 5 },
  { id: "25", group: "Urbano", name: "Papel y cartón sin tintas", C: 170, N: 0.1, humidity: 10 },

  // INDUSTRIAL / AGROINDUSTRIAL
  { id: "40", group: "Industrial", name: "Orujo de uva", C: 30, N: 1.8, humidity: 60 },
  { id: "41", group: "Industrial", name: "Pulpa de aceituna", C: 45, N: 1.2, humidity: 65 },
  { id: "42", group: "Industrial", name: "Bagazo cervecero", C: 14, N: 2.8, humidity: 80 },
  { id: "43", group: "Industrial", name: "Restos de almazara", C: 40, N: 1.5, humidity: 55 },
  { id: "44", group: "Industrial", name: "Descartes hortofrutícolas (centrales)", C: 20, N: 2.2, humidity: 85 },
  { id: "45", group: "Industrial", name: "Pulpa de tomate", C: 18, N: 2.5, humidity: 90 },
  { id: "46", group: "Industrial", name: "Restos de cítricos industriales", C: 35, N: 1.6, humidity: 75 },
  { id: "47", group: "Industrial", name: "Subproductos de IV gama (ensaladas)", C: 22, N: 2.1, humidity: 88 },

  // GANADERO
  { id: "60", group: "Ganadero", name: "Estiércol vacuno", C: 42, N: 2.1, humidity: 75 },
  { id: "61", group: "Ganadero", name: "Estiércol ovino", C: 30, N: 2.5, humidity: 65 },
  { id: "62", group: "Ganadero", name: "Estiércol caprino", C: 28, N: 2.6, humidity: 60 },
  { id: "63", group: "Ganadero", name: "Estiércol porcino", C: 14, N: 3.5, humidity: 85 },
  { id: "64", group: "Ganadero", name: "Gallinaza", C: 10, N: 4.0, humidity: 70 },
  { id: "66", group: "Ganadero", name: "Estiércol equino (con cama)", C: 55, N: 1.4, humidity: 60 }
];

// ===============================
// UTILIDADES
// ===============================
const normalizeMaterial = m => ({
  ...m,
  proportion: typeof m.proportion === "number" ? m.proportion : 0
});

function calculateMix(materials) {
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

function buildRecommendation(cn, hum) {
  if (cn < IDEAL_CN[0]) return "La mezcla es demasiado rica en nitrógeno. Añade material seco o carbonado (paja, poda).";
  if (cn > IDEAL_CN[1]) return "La mezcla es demasiado carbonada. Añade materiales frescos o húmedos (restos de cocina, estiércol).";
  if (hum < IDEAL_HUM[0]) return "La mezcla está seca. Añade materiales húmedos o un poco de agua.";
  if (hum > IDEAL_HUM[1]) return "La mezcla está demasiado húmeda. Añade material estructurante y seco.";
  return "La mezcla está dentro de los rangos óptimos para compostaje.";
}

// ===============================
// APP
// ===============================
export default function App() {
  const [selected, setSelected] = useState([]);

  const stats = useMemo(() => calculateMix(selected), [selected]);

  const cnOk = stats.cn >= IDEAL_CN[0] && stats.cn <= IDEAL_CN[1];
  const humOk = stats.hum >= IDEAL_HUM[0] && stats.hum <= IDEAL_HUM[1];

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

  const optimizeMix = () => {
    if (selected.length < 2) return;
    const equal = +(100 / selected.length).toFixed(1);
    setSelected(prev => prev.map(m => ({ ...m, proportion: equal })));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">CompostMaster · OpenAI</h1>
      <p className="text-gray-600 mb-6">Calculadora de compostaje guiada (estilo UMH)</p>

      {/* FACTORES IDEALES */}
      <section className="bg-white p-4 rounded-xl mb-6">
        <details className="border rounded-lg p-3">
          <summary className="cursor-pointer font-semibold text-lg">
            📊 Factores ideales para el compostaje
          </summary>
          <div className="mt-3 text-sm text-gray-700 space-y-2">
            <div><strong>Relación C/N:</strong> ideal entre <strong>20 y 30</strong>.</div>
            <div><strong>Humedad:</strong> óptima entre <strong>50 % y 60 %</strong>.</div>
            <div><strong>pH:</strong> rango funcional <strong>5,0 – 8,5</strong>.</div>
            <div><strong>Salinidad (CE):</strong> &lt; <strong>4 dS/m</strong>.</div>
            <div><strong>Temperatura:</strong> fase termófila <strong>55 – 65 °C</strong>.</div>
          </div>
        </details>
      </section>

      {/* PASO 1 */}
      <section className="bg-white p-4 rounded-xl mb-6">
        <h2 className="font-bold text-lg mb-3">1️⃣ Selecciona los materiales</h2>
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
                  <div key={cnGroup.key} className="mb-3">
                    <div className="font-semibold text-sm mb-2">{cnGroup.label}</div>
                    <div className="grid grid-cols-2 gap-3">
                      {mats.map(mat => (
                        <button
                          key={mat.id}
                          onClick={() => toggleMaterial(mat)}
                          className="border rounded-lg p-3 hover:bg-green-50 text-left"
                        >
                          <div className="font-semibold">{mat.name}</div>
                          <div className="text-xs text-gray-500">
                            C/N ≈ {(mat.C / mat.N).toFixed(1)} · Humedad {mat.humidity}%
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </section>

      {/* PASO 2 */}
      {selected.length > 0 && (
        <section className="bg-white p-4 rounded-xl mb-6">
          <h2 className="font-bold text-lg mb-3">2️⃣ Cantidades</h2>
          <button
            onClick={optimizeMix}
            className="mb-4 flex items-center gap-2 px-4 py-2 rounded bg-green-600 text-white"
          >
            <Sparkles size={16} /> Ajustar automáticamente la mezcla
          </button>
          {selected.map(m => (
            <div key={m.id} className="flex items-center gap-3 mb-2">
              <button onClick={() => toggleMaterial(m)} className="text-red-500">
                <Trash2 size={16} />
              </button>
              <span className="flex-1">{m.name}</span>
              <input
                type="number"
                value={m.proportion}
                onChange={e => updateProp(m.id, e.target.value)}
                className="w-20 border rounded p-1"
              />
              <span>%</span>
            </div>
          ))}
        </section>
      )}

      {/* PASO 3 */}
      {selected.length > 0 && (
        <section className="bg-white p-4 rounded-xl">
          <h2 className="font-bold text-lg mb-3">3️⃣ Resultado</h2>
          <div className="mb-4 space-y-2">
            {selected.map(m => (
              <div key={m.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1">{m.name}</span>
                <span className="w-16 text-right">{m.proportion}%</span>
                <span className="w-20 text-right text-gray-600">{(m.proportion / 10).toFixed(1)} partes</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-4 rounded ${cnOk ? "bg-green-100" : "bg-yellow-100"}`}>
              <div className="font-bold">Relación C/N</div>
              <div className="text-3xl">{stats.cn}</div>
            </div>
            <div className={`p-4 rounded ${humOk ? "bg-green-100" : "bg-yellow-100"}`}>
              <div className="font-bold">Humedad</div>
              <div className="text-3xl">{stats.hum}%</div>
            </div>
          </div>
          <div className="bg-slate-50 border rounded p-3 text-sm">
            💡 {buildRecommendation(stats.cn, stats.hum)}
          </div>
        </section>
      )}
    </div>
  );
}
