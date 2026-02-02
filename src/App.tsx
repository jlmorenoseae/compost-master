// CompostMaster – Versión mejorada con características avanzadas
import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Sparkles, Download, Save, Plus, BarChart3, AlertCircle, History, X } from "lucide-react";

// ===============================
// RANGOS IDEALES
// ===============================
const IDEAL_CN = [20, 30];
const IDEAL_HUM = [50, 60];

// ===============================
// GRUPOS DE MATERIALES
// ===============================
const MATERIAL_GROUPS = ["Agrícola", "Urbano", "Industrial", "Ganadero", "Personalizado"];

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
  return "¡Excelente! La mezcla está dentro de los rangos óptimos para compostaje.";
}

// ===============================
// COMPONENTES
// ===============================

function ProgressBar({ value, min, max, label, unit = "" }) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isOptimal = value >= min && value <= max;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className={isOptimal ? "text-green-700 font-bold" : "text-yellow-700"}>
          {value}{unit}
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            isOptimal ? "bg-green-500" : "bg-yellow-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min}{unit}</span>
        <span>Óptimo</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function MaterialChart({ materials }) {
  const maxProp = Math.max(...materials.map(m => m.proportion), 1);
  
  return (
    <div className="space-y-2">
      {materials.map(m => (
        <div key={m.id} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="truncate flex-1 mr-2">{m.name}</span>
            <span className="font-semibold">{m.proportion}%</span>
          </div>
          <div className="h-6 bg-gray-100 rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 flex items-center justify-end pr-2"
              style={{ width: `${(m.proportion / maxProp) * 100}%` }}
            >
              {m.proportion > 5 && (
                <span className="text-xs text-white font-semibold">
                  {(m.proportion / 10).toFixed(1)} partes
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomMaterialModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    C: "",
    N: "",
    humidity: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.C && formData.N && formData.humidity) {
      onAdd({
        id: `custom-${Date.now()}`,
        group: "Personalizado",
        name: formData.name,
        C: parseFloat(formData.C),
        N: parseFloat(formData.N),
        humidity: parseFloat(formData.humidity),
        isCustom: true
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Añadir Material Personalizado</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nombre del material</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="Ej: Restos de poda de naranjo"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1">% Carbono</label>
              <input
                type="number"
                step="0.1"
                value={formData.C}
                onChange={e => setFormData({...formData, C: e.target.value})}
                className="w-full border rounded-lg p-2"
                placeholder="45"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">% Nitrógeno</label>
              <input
                type="number"
                step="0.1"
                value={formData.N}
                onChange={e => setFormData({...formData, N: e.target.value})}
                className="w-full border rounded-lg p-2"
                placeholder="1.5"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">% Humedad</label>
              <input
                type="number"
                step="1"
                value={formData.humidity}
                onChange={e => setFormData({...formData, humidity: e.target.value})}
                className="w-full border rounded-lg p-2"
                placeholder="60"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Nota:</strong> Estos valores suelen obtenerse mediante análisis de laboratorio. 
            Si no los conoces con exactitud, usa materiales similares de la base de datos.
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Añadir Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===============================
// APP PRINCIPAL
// ===============================
export default function App() {
  const [selected, setSelected] = useState([]);
  const [customMaterials, setCustomMaterials] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedMixes, setSavedMixes] = useState([]);
  const [showChart, setShowChart] = useState(false);

  // Cargar materiales personalizados y mezclas guardadas del localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem('customMaterials');
    const savedMixesData = localStorage.getItem('savedMixes');
    if (savedCustom) setCustomMaterials(JSON.parse(savedCustom));
    if (savedMixesData) setSavedMixes(JSON.parse(savedMixesData));
  }, []);

  // Guardar materiales personalizados
  useEffect(() => {
    if (customMaterials.length > 0) {
      localStorage.setItem('customMaterials', JSON.stringify(customMaterials));
    }
  }, [customMaterials]);

  const allMaterials = useMemo(() => [...BASE_MATERIALS, ...customMaterials], [customMaterials]);

  const stats = useMemo(() => calculateMix(selected), [selected]);

  const totalProportion = useMemo(() => 
    selected.reduce((sum, m) => sum + m.proportion, 0), 
    [selected]
  );

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

  const addCustomMaterial = (material) => {
    setCustomMaterials(prev => [...prev, material]);
    toggleMaterial(material);
  };

  const saveMix = () => {
    if (selected.length === 0) return;
    
    const mixName = prompt("Nombre para esta mezcla:", `Mezcla ${new Date().toLocaleDateString()}`);
    if (!mixName) return;

    const newMix = {
      id: Date.now(),
      name: mixName,
      date: new Date().toISOString(),
      materials: selected,
      stats
    };

    const updated = [newMix, ...savedMixes].slice(0, 10); // Máximo 10 guardadas
    setSavedMixes(updated);
    localStorage.setItem('savedMixes', JSON.stringify(updated));
    alert("¡Mezcla guardada!");
  };

  const loadMix = (mix) => {
    setSelected(mix.materials);
    setShowHistory(false);
  };

  const deleteMix = (id) => {
    const updated = savedMixes.filter(m => m.id !== id);
    setSavedMixes(updated);
    localStorage.setItem('savedMixes', JSON.stringify(updated));
  };

  const exportMix = () => {
    if (selected.length === 0) return;

    const text = `
COMPOSTMASTER - RECETA DE COMPOSTAJE
=====================================
Fecha: ${new Date().toLocaleDateString()}

MATERIALES:
${selected.map(m => `• ${m.name}: ${m.proportion}% (${(m.proportion / 10).toFixed(1)} partes)`).join('\n')}

RESULTADOS:
• Relación C/N: ${stats.cn} ${cnOk ? '✓ ÓPTIMO' : '⚠ AJUSTAR'}
• Humedad: ${stats.hum}% ${humOk ? '✓ ÓPTIMO' : '⚠ AJUSTAR'}

RECOMENDACIÓN:
${buildRecommendation(stats.cn, stats.hum)}

FACTORES IDEALES:
• Relación C/N: 20-30
• Humedad: 50-60%
• pH: 5.0-8.5
• Salinidad (CE): < 4 dS/m
• Temperatura: 55-65°C (fase termófila)
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compost-receta-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm("¿Seguro que quieres limpiar toda la mezcla?")) {
      setSelected([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-slate-50 to-green-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-green-800">🌱 CompostMaster</h1>
            <div className="flex gap-2">
              {savedMixes.length > 0 && (
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                  title="Ver historial"
                >
                  <History size={20} />
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-600">Calculadora profesional de compostaje · Estilo UMH</p>
        </header>

        {/* HISTORIAL MODAL */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Mezclas Guardadas</h3>
                <button onClick={() => setShowHistory(false)} className="text-gray-500">
                  <X size={24} />
                </button>
              </div>
              
              {savedMixes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay mezclas guardadas</p>
              ) : (
                <div className="space-y-3">
                  {savedMixes.map(mix => (
                    <div key={mix.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{mix.name}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(mix.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadMix(mix)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteMix(mix.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="mr-3">C/N: {mix.stats.cn}</span>
                        <span>Humedad: {mix.stats.hum}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOM MATERIAL MODAL */}
        {showCustomModal && (
          <CustomMaterialModal
            onClose={() => setShowCustomModal(false)}
            onAdd={addCustomMaterial}
          />
        )}

        {/* FACTORES IDEALES */}
        <section className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <details className="border rounded-lg p-3">
            <summary className="cursor-pointer font-semibold text-lg">
              📊 Factores ideales para el compostaje
            </summary>
            <div className="mt-3 text-sm text-gray-700 space-y-2">
              <div><strong>Relación C/N:</strong> ideal entre <strong>20 y 30</strong>.</div>
              <div><strong>Humedad:</strong> óptima entre <strong>50 % y 60 %</strong>.</div>
              <div><strong>pH:</strong> rango funcional <strong>5,0 – 8,5</strong>.</div>
              <div><strong>Salinidad (CE):</strong> &lt; <strong>4 dS/m</strong>.</div>
              <div><strong>Temperatura:</strong> fase termófila <strong>55 – 65 °C</strong>.</div>
            </div>
          </details>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA - SELECCIÓN */}
          <div className="space-y-6">
            {/* PASO 1 */}
            <section className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-xl">1️⃣ Selecciona materiales</h2>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus size={16} /> Personalizado
                </button>
              </div>
              
              {MATERIAL_GROUPS.map(group => {
                const groupMats = allMaterials.filter(m => m.group === group);
                if (groupMats.length === 0 && group === "Personalizado") return null;
                
                return (
                  <details key={group} className="border rounded-lg mb-2">
                    <summary className="cursor-pointer bg-slate-100 px-3 py-2 font-semibold hover:bg-slate-200">
                      {group} ({groupMats.length})
                    </summary>
                    <div className="p-3">
                      {group === "Personalizado" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {groupMats.map(mat => {
                            const isSelected = selected.find(m => m.id === mat.id);
                            return (
                              <button
                                key={mat.id}
                                onClick={() => toggleMaterial(mat)}
                                className={`border-2 rounded-lg p-3 text-left transition-all ${
                                  isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="font-semibold">{mat.name}</div>
                                <div className="text-xs text-gray-500">
                                  C/N ≈ {(mat.C / mat.N).toFixed(1)} · Humedad {mat.humidity}%
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        CN_GROUPS.map(cnGroup => {
                          const mats = groupMats
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
                              <div className="font-semibold text-sm mb-2 text-gray-700">{cnGroup.label}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {mats.map(mat => {
                                  const isSelected = selected.find(m => m.id === mat.id);
                                  return (
                                    <button
                                      key={mat.id}
                                      onClick={() => toggleMaterial(mat)}
                                      className={`border-2 rounded-lg p-3 text-left transition-all ${
                                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="font-semibold text-sm">{mat.name}</div>
                                      <div className="text-xs text-gray-500">
                                        C/N ≈ {(mat.C / mat.N).toFixed(1)} · Humedad {mat.humidity}%
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </details>
                );
              })}
            </section>
          </div>

          {/* COLUMNA DERECHA - AJUSTES Y RESULTADOS */}
          <div className="space-y-6">
            {/* PASO 2 */}
            {selected.length > 0 && (
              <section className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <h2 className="font-bold text-xl mb-4">2️⃣ Ajusta proporciones</h2>
                
                {/* Alerta si no suma 100% */}
                {totalProportion !== 100 && totalProportion > 0 && (
                  <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-800">
                      <strong>Total: {totalProportion.toFixed(1)}%</strong> 
                      {totalProportion < 100 
                        ? ` - Faltan ${(100 - totalProportion).toFixed(1)}% para completar`
                        : ` - Te pasas por ${(totalProportion - 100).toFixed(1)}%`
                      }
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <button
                    onClick={optimizeMix}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    <Sparkles size={16} /> Distribuir equitativamente
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-2">
                  {selected.map(m => (
                    <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                      <button 
                        onClick={() => toggleMaterial(m)} 
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="flex-1 text-sm font-medium truncate">{m.name}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={m.proportion}
                        onChange={e => updateProp(m.id, e.target.value)}
                        className="w-20 border rounded p-1 text-center"
                      />
                      <span className="text-sm font-semibold w-6">%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PASO 3 - RESULTADOS */}
            {selected.length > 0 && totalProportion > 0 && (
              <section className="bg-white rounded-xl shadow-lg p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-xl">3️⃣ Resultados</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title={showChart ? "Ocultar gráfico" : "Mostrar gráfico"}
                    >
                      <BarChart3 size={20} />
                    </button>
                    <button
                      onClick={saveMix}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                      title="Guardar mezcla"
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={exportMix}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      title="Exportar receta"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>

                {/* Gráfico visual */}
                {showChart && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3 text-sm text-gray-700">Distribución de materiales</h3>
                    <MaterialChart materials={selected} />
                  </div>
                )}

                {/* Barras de progreso */}
                <div className="space-y-6 mb-6">
                  <ProgressBar 
                    value={stats.cn} 
                    min={IDEAL_CN[0]} 
                    max={IDEAL_CN[1]} 
                    label="Relación C/N" 
                  />
                  <ProgressBar 
                    value={stats.hum} 
                    min={IDEAL_HUM[0]} 
                    max={IDEAL_HUM[1]} 
                    label="Humedad" 
                    unit="%" 
                  />
                </div>

                {/* Tarjetas de métricas */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    cnOk ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="text-sm font-semibold text-gray-700">Relación C/N</div>
                    <div className="text-3xl font-bold mt-1">
                      {stats.cn}
                    </div>
                    <div className="text-xs mt-1 text-gray-600">
                      {cnOk ? "✓ Óptimo" : "⚠ Ajustar"}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border-2 ${
                    humOk ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="text-sm font-semibold text-gray-700">Humedad</div>
                    <div className="text-3xl font-bold mt-1">
                      {stats.hum}%
                    </div>
                    <div className="text-xs mt-1 text-gray-600">
                      {humOk ? "✓ Óptimo" : "⚠ Ajustar"}
                    </div>
                  </div>
                </div>

                {/* Recomendación */}
                <div className={`rounded-lg p-4 border-2 ${
                  cnOk && humOk 
                    ? "bg-green-50 border-green-200" 
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">💡</span>
                    <div>
                      <div className="font-semibold mb-1">
                        {cnOk && humOk ? "¡Mezcla perfecta!" : "Recomendación"}
                      </div>
                      <div className="text-sm">
                        {buildRecommendation(stats.cn, stats.hum)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Mensaje inicial */}
            {selected.length === 0 && (
              <section className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="font-bold text-xl mb-2">Comienza tu mezcla</h3>
                <p className="text-gray-600">
                  Selecciona materiales de la lista para calcular la relación C/N y humedad óptimas
                </p>
              </section>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>CompostMaster · Desarrollado con metodología UMH</p>
          <p className="mt-1">Para una gestión sostenible de residuos orgánicos 🌍</p>
        </footer>
      </div>
    </div>
  );
}
