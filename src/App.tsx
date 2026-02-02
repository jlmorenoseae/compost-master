// CompostMaster – Diseño profesional completamente renovado
import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Sparkles, Download, Save, Plus, BarChart3, AlertCircle, History, X, CheckCircle2, Leaf, Info } from "lucide-react";

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
  { key: "carbonados", label: "🟡 Carbonados", min: 40, color: "from-yellow-400 to-amber-500" },
  { key: "equilibrados", label: "🟢 Equilibrados", min: 20, max: 40, color: "from-green-400 to-emerald-500" },
  { key: "nitrogenados", label: "🔵 Nitrogenados", max: 20, color: "from-blue-400 to-cyan-500" }
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

function ProgressRing({ value, min, max, size = 120 }) {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const isOptimal = value >= min && value <= max;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isOptimal ? "#10b981" : "#f59e0b"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-3xl font-black ${isOptimal ? 'text-green-600' : 'text-amber-600'}`}>
            {value}
          </div>
          <div className="text-xs text-gray-500 font-semibold mt-1">
            {isOptimal ? "✓ Óptimo" : "Ajustar"}
          </div>
        </div>
      </div>
    </div>
  );
}

function MaterialBarChart({ materials }) {
  if (!materials || materials.length === 0) return null;
  
  const total = materials.reduce((sum, m) => sum + m.proportion, 0);
  
  return (
    <div className="space-y-3">
      <div className="text-sm font-bold text-gray-700 mb-4">Distribución de materiales</div>
      {materials.map((m, idx) => {
        const percentage = total > 0 ? (m.proportion / total) * 100 : 0;
        const cn = (m.C / m.N).toFixed(0);
        const color = cn >= 40 ? 'from-yellow-400 to-amber-500' : 
                      cn >= 20 ? 'from-green-400 to-emerald-500' : 
                      'from-blue-400 to-cyan-500';
        
        return (
          <div key={m.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 truncate flex-1 mr-3">{m.name}</span>
              <span className="font-bold text-gray-900 whitespace-nowrap">{m.proportion}%</span>
            </div>
            <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
              <div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color} transition-all duration-700 ease-out flex items-center justify-between px-3`}
                style={{ width: `${percentage}%` }}
              >
                <span className="text-xs font-bold text-white drop-shadow-md">
                  {(m.proportion / 10).toFixed(1)} partes
                </span>
                {percentage > 30 && (
                  <span className="text-xs font-semibold text-white/80">
                    C/N: {cn}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Añadir Material Personalizado</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Nombre del material</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all text-gray-900"
              placeholder="Ej: Restos de poda de naranjo"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">% Carbono</label>
              <input
                type="number"
                step="0.1"
                value={formData.C}
                onChange={e => setFormData({...formData, C: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all text-gray-900 text-center font-bold"
                placeholder="45"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">% Nitrógeno</label>
              <input
                type="number"
                step="0.1"
                value={formData.N}
                onChange={e => setFormData({...formData, N: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all text-gray-900 text-center font-bold"
                placeholder="1.5"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-700">% Humedad</label>
              <input
                type="number"
                step="1"
                value={formData.humidity}
                onChange={e => setFormData({...formData, humidity: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all text-gray-900 text-center font-bold"
                placeholder="60"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            <strong className="flex items-center gap-2"><Info size={16} /> Nota importante:</strong>
            <p className="mt-1">Estos valores suelen obtenerse mediante análisis de laboratorio. Si no los conoces con exactitud, usa materiales similares de la base de datos.</p>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-bold transition-all text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold shadow-lg hover:shadow-xl transition-all"
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

  // Cargar del localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem('customMaterials');
    const savedMixesData = localStorage.getItem('savedMixes');
    if (savedCustom) setCustomMaterials(JSON.parse(savedCustom));
    if (savedMixesData) setSavedMixes(JSON.parse(savedMixesData));
  }, []);

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
  const totalOk = Math.abs(totalProportion - 100) < 0.1;

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

    const updated = [newMix, ...savedMixes].slice(0, 10);
    setSavedMixes(updated);
    localStorage.setItem('savedMixes', JSON.stringify(updated));
    alert("✅ ¡Mezcla guardada correctamente!");
  };

  const loadMix = (mix) => {
    setSelected(mix.materials);
    setShowHistory(false);
  };

  const deleteMix = (id) => {
    if (confirm("¿Seguro que quieres eliminar esta mezcla?")) {
      const updated = savedMixes.filter(m => m.id !== id);
      setSavedMixes(updated);
      localStorage.setItem('savedMixes', JSON.stringify(updated));
    }
  };

  const exportMix = () => {
    if (selected.length === 0) return;

    const text = `
═══════════════════════════════════════════════════
    COMPOSTMASTER - RECETA DE COMPOSTAJE
═══════════════════════════════════════════════════

Fecha: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

MATERIALES SELECCIONADOS:
${selected.map((m, i) => `${i + 1}. ${m.name}: ${m.proportion}% (${(m.proportion / 10).toFixed(1)} partes)`).join('\n')}

COMPOSICIÓN TOTAL: ${totalProportion.toFixed(1)}%

RESULTADOS DEL ANÁLISIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Relación C/N: ${stats.cn} ${cnOk ? '✓ ÓPTIMO' : '⚠ REQUIERE AJUSTE'}
  (Rango ideal: ${IDEAL_CN[0]}-${IDEAL_CN[1]})

• Humedad: ${stats.hum}% ${humOk ? '✓ ÓPTIMO' : '⚠ REQUIERE AJUSTE'}
  (Rango ideal: ${IDEAL_HUM[0]}-${IDEAL_HUM[1]}%)

RECOMENDACIÓN:
${buildRecommendation(stats.cn, stats.hum)}

PARÁMETROS IDEALES DE REFERENCIA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Relación C/N: 20-30
• Humedad: 50-60%
• pH: 5.0-8.5
• Salinidad (CE): < 4 dS/m
• Temperatura (fase termófila): 55-65°C

═══════════════════════════════════════════════════
Generado por CompostMaster
Metodología Universidad Miguel Hernández (UMH)
═══════════════════════════════════════════════════
    `.trim();

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CompostMaster_Receta_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm("¿Seguro que quieres eliminar toda la mezcla actual?")) {
      setSelected([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* HEADER MEJORADO */}
        <header className="mb-8">
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-green-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Leaf className="text-white" size={36} strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                    Compost<span className="text-green-600">Master</span>
                  </h1>
                  <p className="text-gray-600 font-semibold">Calculadora Profesional de Compostaje</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                {savedMixes.length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <History size={20} />
                    <span>Mis Mezclas ({savedMixes.length})</span>
                  </button>
                )}
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Plus size={20} />
                  <span className="hidden sm:inline">Material Personalizado</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* MODALES */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-green-100">
                <h3 className="text-3xl font-black text-gray-900">Mezclas Guardadas</h3>
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <X size={28} />
                </button>
              </div>
              
              {savedMixes.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500 text-lg font-semibold">No hay mezclas guardadas todavía</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedMixes.map(mix => (
                    <div key={mix.id} className="border-4 border-gray-100 rounded-2xl p-6 hover:border-green-200 hover:shadow-lg transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-black text-xl text-gray-900">{mix.name}</h4>
                          <p className="text-sm text-gray-500 font-semibold mt-1">
                            {new Date(mix.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadMix(mix)}
                            className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteMix(mix.id)}
                            className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="bg-green-50 px-4 py-2 rounded-xl">
                          <span className="text-gray-600 font-semibold">C/N: </span>
                          <span className="text-green-700 font-black text-lg">{mix.stats.cn}</span>
                        </div>
                        <div className="bg-blue-50 px-4 py-2 rounded-xl">
                          <span className="text-gray-600 font-semibold">Humedad: </span>
                          <span className="text-blue-700 font-black text-lg">{mix.stats.hum}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showCustomModal && (
          <CustomMaterialModal
            onClose={() => setShowCustomModal(false)}
            onAdd={addCustomMaterial}
          />
        )}

        {/* FACTORES IDEALES */}
        <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 mb-8 border-4 border-blue-100">
          <details className="group">
            <summary className="cursor-pointer font-black text-2xl text-gray-900 flex items-center gap-3 hover:text-green-600 transition-colors">
              <span className="text-3xl">📊</span>
              <span className="flex-1">Factores Ideales para el Compostaje</span>
              <span className="text-green-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Relación C/N", value: "20 - 30", color: "green" },
                { label: "Humedad", value: "50% - 60%", color: "blue" },
                { label: "pH", value: "5,0 - 8,5", color: "purple" },
                { label: "Salinidad (CE)", value: "< 4 dS/m", color: "amber" },
                { label: "Temperatura", value: "55 - 65 °C", color: "red" },
              ].map((item, idx) => (
                <div key={idx} className={`bg-${item.color}-50 border-4 border-${item.color}-200 rounded-2xl p-4`}>
                  <div className="font-bold text-gray-700 text-sm mb-1">{item.label}</div>
                  <div className={`font-black text-2xl text-${item.color}-600`}>{item.value}</div>
                </div>
              ))}
            </div>
          </details>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* COLUMNA IZQUIERDA - SELECCIÓN */}
          <div>
            <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-green-100">
              <h2 className="font-black text-3xl text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-4xl">1️⃣</span>
                Selecciona Materiales
              </h2>
              
              <div className="space-y-4">
                {MATERIAL_GROUPS.map(group => {
                  const groupMats = allMaterials.filter(m => m.group === group);
                  if (groupMats.length === 0 && group === "Personalizado") return null;
                  
                  return (
                    <details key={group} className="group border-4 border-gray-100 rounded-2xl overflow-hidden">
                      <summary className="cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 font-black text-gray-900 text-lg hover:from-gray-100 hover:to-gray-200 transition-all flex items-center gap-3">
                        <span className="text-2xl group-open:rotate-90 transition-transform">▶</span>
                        <span className="flex-1">{group}</span>
                        <span className="text-sm font-bold bg-green-500 text-white px-4 py-1 rounded-full">
                          {groupMats.length}
                        </span>
                      </summary>
                      <div className="p-6 bg-white">
                        {CN_GROUPS.map(cnGroup => {
                          const mats = groupMats
                            .filter(m => {
                              if (m.isCustom) return true;
                              const cn = m.C / m.N;
                              if (cnGroup.min && cn < cnGroup.min) return false;
                              if (cnGroup.max && cn >= cnGroup.max) return false;
                              return true;
                            })
                            .sort((a, b) => a.C / a.N - b.C / b.N);

                          if (mats.length === 0) return null;

                          return (
                            <div key={cnGroup.key} className="mb-6 last:mb-0">
                              <div className={`inline-block font-black text-sm mb-4 px-4 py-2 rounded-full bg-gradient-to-r ${cnGroup.color} text-white shadow-md`}>
                                {cnGroup.label}
                              </div>
                              <div className="grid gap-3">
                                {mats.map(mat => {
                                  const isSelected = selected.find(m => m.id === mat.id);
                                  return (
                                    <button
                                      key={mat.id}
                                      onClick={() => toggleMaterial(mat)}
                                      className={`border-4 rounded-2xl p-4 text-left transition-all ${
                                        isSelected 
                                          ? 'border-green-400 bg-green-50 shadow-lg scale-[1.02]' 
                                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        {isSelected && (
                                          <CheckCircle2 className="text-green-600 flex-shrink-0" size={24} strokeWidth={3} />
                                        )}
                                        <div className="flex-1">
                                          <div className="font-bold text-gray-900">{mat.name}</div>
                                          <div className="text-sm text-gray-600 font-semibold mt-1">
                                            C/N: {(mat.C / mat.N).toFixed(1)} · Humedad: {mat.humidity}%
                                          </div>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA - RESULTADOS */}
          <div className="space-y-8">
            {/* AJUSTES */}
            {selected.length > 0 && (
              <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-yellow-100">
                <h2 className="font-black text-3xl text-gray-900 mb-6 flex items-center gap-3">
                  <span className="text-4xl">2️⃣</span>
                  Ajustar Proporciones
                </h2>
                
                {!totalOk && totalProportion > 0 && (
                  <div className={`mb-6 rounded-2xl p-5 border-4 ${
                    totalProportion < 100 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : 'bg-red-50 border-red-300'
                  } flex items-start gap-4`}>
                    <AlertCircle size={28} className={totalProportion < 100 ? 'text-yellow-600' : 'text-red-600'} strokeWidth={3} />
                    <div className="flex-1">
                      <div className="font-black text-lg mb-1">Total: {totalProportion.toFixed(1)}%</div>
                      <div className="text-sm font-semibold">
                        {totalProportion < 100 
                          ? `Faltan ${(100 - totalProportion).toFixed(1)}% para completar la mezcla`
                          : `Te pasas por ${(totalProportion - 100).toFixed(1)}%`
                        }
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mb-6">
                  <button
                    onClick={optimizeMix}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg hover:shadow-xl transition-all hover:scale-105"
                  >
                    <Sparkles size={24} /> Distribuir Equitativamente
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-6 py-4 border-4 border-red-300 text-red-600 rounded-2xl hover:bg-red-50 font-black transition-all"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {selected.map(m => (
                    <div key={m.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border-2 border-gray-200">
                      <button 
                        onClick={() => toggleMaterial(m)} 
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-xl transition-all flex-shrink-0"
                      >
                        <Trash2 size={20} strokeWidth={3} />
                      </button>
                      <span className="flex-1 font-bold text-gray-900 truncate">{m.name}</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={m.proportion}
                        onChange={e => updateProp(m.id, e.target.value)}
                        className="w-20 border-4 border-gray-300 rounded-xl p-2 text-center font-black text-lg focus:border-green-500 focus:ring-4 focus:ring-green-200 outline-none transition-all"
                      />
                      <span className="font-black text-gray-600">%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* RESULTADOS */}
            {selected.length > 0 && totalProportion > 0 && (
              <section className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border-4 border-purple-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-black text-3xl text-gray-900 flex items-center gap-3">
                    <span className="text-4xl">3️⃣</span>
                    Resultados
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={saveMix}
                      className="p-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all"
                      title="Guardar mezcla"
                    >
                      <Save size={22} strokeWidth={3} />
                    </button>
                    <button
                      onClick={exportMix}
                      className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                      title="Exportar receta"
                    >
                      <Download size={22} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                {/* Gráfico de barras */}
                <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-4 border-gray-200">
                  <MaterialBarChart materials={selected} />
                </div>

                {/* Anillos de progreso */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="flex flex-col items-center">
                    <ProgressRing value={stats.cn} min={IDEAL_CN[0]} max={IDEAL_CN[1]} size={140} />
                    <div className="mt-4 text-center">
                      <div className="font-black text-gray-900 text-lg">Relación C/N</div>
                      <div className="text-sm text-gray-600 font-semibold">Rango: {IDEAL_CN[0]}-{IDEAL_CN[1]}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <ProgressRing value={stats.hum} min={IDEAL_HUM[0]} max={IDEAL_HUM[1]} size={140} />
                    <div className="mt-4 text-center">
                      <div className="font-black text-gray-900 text-lg">Humedad</div>
                      <div className="text-sm text-gray-600 font-semibold">Rango: {IDEAL_HUM[0]}-{IDEAL_HUM[1]}%</div>
                    </div>
                  </div>
                </div>

                {/* Recomendación */}
                <div className={`rounded-2xl p-6 border-4 ${
                  cnOk && humOk 
                    ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300" 
                    : "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300"
                }`}>
                  <div className="flex items-start gap-4">
                    <span className="text-5xl flex-shrink-0">
                      {cnOk && humOk ? "🎉" : "💡"}
                    </span>
                    <div className="flex-1">
                      <div className={`font-black text-2xl mb-3 ${cnOk && humOk ? 'text-green-700' : 'text-yellow-700'}`}>
                        {cnOk && humOk ? "¡Mezcla Perfecta!" : "Recomendación"}
                      </div>
                      <div className="text-gray-700 font-semibold leading-relaxed">
                        {buildRecommendation(stats.cn, stats.hum)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Estado inicial */}
            {selected.length === 0 && (
              <section className="bg-white rounded-3xl shadow-xl p-12 text-center border-4 border-green-100">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse">
                  <Leaf className="text-white" size={64} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-3xl mb-4 text-gray-900">¡Comienza tu Mezcla!</h3>
                <p className="text-gray-600 text-lg font-semibold max-w-md mx-auto">
                  Selecciona materiales de la izquierda para calcular la relación C/N y humedad óptimas para tu compost
                </p>
              </section>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 text-center">
          <div className="inline-block bg-white rounded-2xl px-8 py-4 shadow-xl border-4 border-gray-100">
            <p className="font-black text-gray-900 text-lg">CompostMaster · Metodología UMH</p>
            <p className="text-gray-600 font-semibold mt-1">Para una gestión sostenible de residuos orgánicos 🌍</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
