// CompostMaster – Interfaz profesional rediseñada
import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Sparkles, Download, Save, Plus, BarChart3, AlertCircle, History, X, CheckCircle2, Leaf } from "lucide-react";

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
  { key: "carbonados", label: "Carbonados", min: 40, color: "amber" },
  { key: "equilibrados", label: "Equilibrados", min: 20, max: 40, color: "emerald" },
  { key: "nitrogenados", label: "Nitrogenados", max: 20, color: "blue" }
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
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-stone-700">{label}</span>
        <span className={`text-2xl font-bold ${isOptimal ? "text-emerald-600" : "text-amber-600"}`}>
          {value}{unit}
        </span>
      </div>
      <div className="relative h-4 bg-stone-200 rounded-full overflow-hidden shadow-inner">
        <div 
          className={`h-full transition-all duration-700 ease-out ${
            isOptimal 
              ? "bg-gradient-to-r from-emerald-400 to-emerald-600" 
              : "bg-gradient-to-r from-amber-400 to-amber-600"
          }`}
          style={{ width: `${percentage}%` }}
        >
          <div className="h-full w-full opacity-30 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-stone-500 font-medium">
        <span>Min: {min}{unit}</span>
        <span className="text-emerald-600">RANGO ÓPTIMO</span>
        <span>Max: {max}{unit}</span>
      </div>
    </div>
  );
}

function MaterialChart({ materials }) {
  const maxProp = Math.max(...materials.map(m => m.proportion), 1);
  
  return (
    <div className="space-y-3">
      {materials.map((m, idx) => (
        <div key={m.id} className="space-y-1.5" style={{ animationDelay: `${idx * 50}ms` }}>
          <div className="flex justify-between text-sm">
            <span className="truncate flex-1 mr-3 text-stone-700 font-medium">{m.name}</span>
            <span className="font-bold text-emerald-700">{m.proportion}%</span>
          </div>
          <div className="h-8 bg-stone-100 rounded-lg overflow-hidden shadow-sm">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-500 flex items-center justify-end pr-3 relative overflow-hidden"
              style={{ width: `${(m.proportion / maxProp) * 100}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              {m.proportion > 8 && (
                <span className="text-xs text-white font-bold relative z-10 drop-shadow">
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-stone-800">Nuevo Material</h3>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-600 transition-colors p-1 hover:bg-stone-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-stone-700">Nombre del material</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
              placeholder="Ej: Restos de poda de naranjo"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-stone-700">% Carbono</label>
              <input
                type="number"
                step="0.1"
                value={formData.C}
                onChange={e => setFormData({...formData, C: e.target.value})}
                className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="45"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-stone-700">% Nitrógeno</label>
              <input
                type="number"
                step="0.1"
                value={formData.N}
                onChange={e => setFormData({...formData, N: e.target.value})}
                className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="1.5"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-stone-700">% Humedad</label>
              <input
                type="number"
                step="1"
                value={formData.humidity}
                onChange={e => setFormData({...formData, humidity: e.target.value})}
                className="w-full border-2 border-stone-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                placeholder="60"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-sm text-blue-900">
            <strong>💡 Nota:</strong> Estos valores suelen obtenerse mediante análisis de laboratorio. 
            Si no los conoces, usa materiales similares de la base de datos.
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 border-2 border-stone-300 rounded-xl hover:bg-stone-50 font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 font-semibold shadow-lg shadow-emerald-200 transition-all"
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
  const [showChart, setShowChart] = useState(true);

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50 relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* HEADER */}
        <header className="mb-8 md:mb-12 text-center">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Leaf className="text-white" size={28} />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              CompostMaster
            </h1>
          </div>
          <p className="text-stone-600 text-lg font-medium">Calculadora Profesional de Compostaje</p>
          <p className="text-stone-500 text-sm mt-1">Metodología Universidad Miguel Hernández (UMH)</p>
          
          {savedMixes.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-stone-200"
            >
              <History size={18} />
              <span className="font-semibold text-sm">Mis Mezclas ({savedMixes.length})</span>
            </button>
          )}
        </header>

        {/* MODALES */}
        {showHistory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-stone-200">
                <h3 className="text-2xl font-bold text-stone-800">Mezclas Guardadas</h3>
                <button onClick={() => setShowHistory(false)} className="text-stone-400 hover:text-stone-600 p-1 hover:bg-stone-100 rounded-lg transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              {savedMixes.length === 0 ? (
                <p className="text-stone-500 text-center py-12">No hay mezclas guardadas</p>
              ) : (
                <div className="space-y-4">
                  {savedMixes.map(mix => (
                    <div key={mix.id} className="border-2 border-stone-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-stone-800">{mix.name}</h4>
                          <p className="text-sm text-stone-500">
                            {new Date(mix.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadMix(mix)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Cargar
                          </button>
                          <button
                            onClick={() => deleteMix(mix.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                          >
                            Borrar
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm font-semibold">
                        <span className="text-stone-600">C/N: <span className="text-emerald-600">{mix.stats.cn}</span></span>
                        <span className="text-stone-600">Humedad: <span className="text-blue-600">{mix.stats.hum}%</span></span>
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
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 mb-8 border border-stone-200">
          <details className="group">
            <summary className="cursor-pointer font-bold text-lg text-stone-800 flex items-center gap-2 hover:text-emerald-600 transition-colors">
              <span className="text-2xl">📊</span>
              <span>Factores Ideales para el Compostaje</span>
              <span className="ml-auto group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="mt-6 grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5" />
                <div>
                  <strong className="text-stone-800">Relación C/N:</strong>
                  <span className="text-stone-600"> ideal entre </span>
                  <strong className="text-emerald-600">20 y 30</strong>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                <div>
                  <strong className="text-stone-800">Humedad:</strong>
                  <span className="text-stone-600"> óptima entre </span>
                  <strong className="text-blue-600">50% y 60%</strong>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5" />
                <div>
                  <strong className="text-stone-800">pH:</strong>
                  <span className="text-stone-600"> rango funcional </span>
                  <strong className="text-purple-600">5,0 – 8,5</strong>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5" />
                <div>
                  <strong className="text-stone-800">Salinidad (CE):</strong>
                  <span className="text-stone-600"> menor a </span>
                  <strong className="text-amber-600">4 dS/m</strong>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5" />
                <div>
                  <strong className="text-stone-800">Temperatura:</strong>
                  <span className="text-stone-600"> fase termófila </span>
                  <strong className="text-red-600">55 – 65 °C</strong>
                </div>
              </div>
            </div>
          </details>
        </section>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* COLUMNA IZQUIERDA - SELECCIÓN (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-stone-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b-2 border-stone-200">
                <h2 className="font-bold text-2xl text-stone-800 flex items-center gap-2">
                  <span className="text-2xl">1️⃣</span>
                  Selecciona Materiales
                </h2>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold shadow-lg shadow-blue-200 transition-all"
                >
                  <Plus size={18} /> Material Personalizado
                </button>
              </div>
              
              <div className="space-y-3">
                {MATERIAL_GROUPS.map(group => {
                  const groupMats = allMaterials.filter(m => m.group === group);
                  if (groupMats.length === 0 && group === "Personalizado") return null;
                  
                  return (
                    <details key={group} className="group border-2 border-stone-200 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer bg-gradient-to-r from-stone-50 to-stone-100 px-5 py-4 font-bold text-stone-800 hover:from-stone-100 hover:to-stone-200 transition-all flex items-center gap-3">
                        <span className="group-open:rotate-90 transition-transform">▶</span>
                        <span className="flex-1">{group}</span>
                        <span className="text-sm font-normal bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                          {groupMats.length} materiales
                        </span>
                      </summary>
                      <div className="p-5 bg-white">
                        {group === "Personalizado" ? (
                          <div className="grid gap-3">
                            {groupMats.map(mat => {
                              const isSelected = selected.find(m => m.id === mat.id);
                              return (
                                <button
                                  key={mat.id}
                                  onClick={() => toggleMaterial(mat)}
                                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                                    isSelected 
                                      ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isSelected && <CheckCircle2 className="text-emerald-600" size={20} />}
                                    <div className="flex-1">
                                      <div className="font-semibold text-stone-800">{mat.name}</div>
                                      <div className="text-xs text-stone-500 mt-1">
                                        C/N ≈ {(mat.C / mat.N).toFixed(1)} · Humedad {mat.humidity}%
                                      </div>
                                    </div>
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
                              <div key={cnGroup.key} className="mb-6 last:mb-0">
                                <div className={`inline-block font-bold text-sm mb-3 px-3 py-1 rounded-full ${
                                  cnGroup.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                                  cnGroup.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {cnGroup.label}
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  {mats.map(mat => {
                                    const isSelected = selected.find(m => m.id === mat.id);
                                    return (
                                      <button
                                        key={mat.id}
                                        onClick={() => toggleMaterial(mat)}
                                        className={`border-2 rounded-xl p-4 text-left transition-all ${
                                          isSelected 
                                            ? 'border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]' 
                                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 hover:scale-[1.01]'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {isSelected && <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-stone-800 truncate">{mat.name}</div>
                                            <div className="text-xs text-stone-500 mt-1">
                                              C/N ≈ {(mat.C / mat.N).toFixed(1)} · Humedad {mat.humidity}%
                                            </div>
                                          </div>
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
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA - AJUSTES Y RESULTADOS (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            {/* PASO 2 - AJUSTES */}
            {selected.length > 0 && (
              <section className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-stone-200 sticky top-6">
                <h2 className="font-bold text-2xl text-stone-800 mb-6 pb-4 border-b-2 border-stone-200 flex items-center gap-2">
                  <span className="text-2xl">2️⃣</span>
                  Ajustar Proporciones
                </h2>
                
                {/* Alerta suma */}
                {totalProportion !== 100 && totalProportion > 0 && (
                  <div className={`mb-5 rounded-xl p-4 border-2 ${
                    totalProportion < 100 
                      ? 'bg-amber-50 border-amber-300' 
                      : 'bg-red-50 border-red-300'
                  } flex items-start gap-3`}>
                    <AlertCircle size={22} className={totalProportion < 100 ? 'text-amber-600' : 'text-red-600'} />
                    <div className="flex-1">
                      <div className="font-bold text-sm mb-1">Total: {totalProportion.toFixed(1)}%</div>
                      <div className="text-xs">
                        {totalProportion < 100 
                          ? `Faltan ${(100 - totalProportion).toFixed(1)}% para completar`
                          : `Te pasas por ${(totalProportion - 100).toFixed(1)}%`
                        }
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-5">
                  <button
                    onClick={optimizeMix}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                  >
                    <Sparkles size={18} /> Distribuir
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-4 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-semibold transition-all"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2">
                  {selected.map(m => (
                    <div key={m.id} className="flex items-center gap-2 bg-stone-50 rounded-xl p-3 border border-stone-200">
                      <button 
                        onClick={() => toggleMaterial(m)} 
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-100 rounded-lg transition-all flex-shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="flex-1 text-sm font-medium truncate text-stone-700">{m.name}</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={m.proportion}
                        onChange={e => updateProp(m.id, e.target.value)}
                        className="w-16 border-2 border-stone-300 rounded-lg p-1.5 text-center font-bold text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                      />
                      <span className="text-sm font-bold text-stone-600">%</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* PASO 3 - RESULTADOS */}
            {selected.length > 0 && totalProportion > 0 && (
              <section className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-stone-200">
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-stone-200">
                  <h2 className="font-bold text-2xl text-stone-800 flex items-center gap-2">
                    <span className="text-2xl">3️⃣</span>
                    Resultados
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className={`p-2.5 border-2 rounded-xl transition-all ${
                        showChart 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                          : 'border-stone-300 hover:bg-stone-50'
                      }`}
                      title={showChart ? "Ocultar gráfico" : "Mostrar gráfico"}
                    >
                      <BarChart3 size={20} />
                    </button>
                    <button
                      onClick={saveMix}
                      className="p-2.5 border-2 border-stone-300 rounded-xl hover:bg-stone-50 transition-all"
                      title="Guardar mezcla"
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={exportMix}
                      className="p-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all"
                      title="Exportar receta"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>

                {/* Gráfico */}
                {showChart && (
                  <div className="mb-6 p-5 bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl border border-stone-200">
                    <h3 className="font-bold text-sm text-stone-700 mb-4">Distribución Visual</h3>
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

                {/* Tarjetas métricas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-5 rounded-xl border-2 ${
                    cnOk 
                      ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300" 
                      : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300"
                  }`}>
                    <div className="text-xs font-bold text-stone-600 mb-2">RELACIÓN C/N</div>
                    <div className={`text-4xl font-black mb-2 ${cnOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {stats.cn}
                    </div>
                    <div className={`text-xs font-bold ${cnOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {cnOk ? "✓ ÓPTIMO" : "⚠ AJUSTAR"}
                    </div>
                  </div>
                  <div className={`p-5 rounded-xl border-2 ${
                    humOk 
                      ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300" 
                      : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300"
                  }`}>
                    <div className="text-xs font-bold text-stone-600 mb-2">HUMEDAD</div>
                    <div className={`text-4xl font-black mb-2 ${humOk ? 'text-blue-700' : 'text-amber-700'}`}>
                      {stats.hum}%
                    </div>
                    <div className={`text-xs font-bold ${humOk ? 'text-blue-600' : 'text-amber-600'}`}>
                      {humOk ? "✓ ÓPTIMO" : "⚠ AJUSTAR"}
                    </div>
                  </div>
                </div>

                {/* Recomendación */}
                <div className={`rounded-xl p-5 border-2 ${
                  cnOk && humOk 
                    ? "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300" 
                    : "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300"
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl flex-shrink-0">
                      {cnOk && humOk ? "🎉" : "💡"}
                    </span>
                    <div className="flex-1">
                      <div className={`font-bold mb-2 ${cnOk && humOk ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {cnOk && humOk ? "¡Mezcla Perfecta!" : "Recomendación"}
                      </div>
                      <div className="text-sm text-stone-700 leading-relaxed">
                        {buildRecommendation(stats.cn, stats.hum)}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Mensaje inicial */}
            {selected.length === 0 && (
              <section className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-12 text-center border border-stone-200">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-200 animate-pulse">
                  <Leaf className="text-white" size={40} />
                </div>
                <h3 className="font-bold text-2xl mb-3 text-stone-800">Comienza tu Mezcla</h3>
                <p className="text-stone-600">
                  Selecciona materiales de la izquierda para calcular la relación C/N y humedad óptimas
                </p>
              </section>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-12 text-center text-sm text-stone-500 pb-6">
          <div className="inline-block bg-white/60 backdrop-blur rounded-xl px-6 py-4 shadow-md border border-stone-200">
            <p className="font-semibold text-stone-700">CompostMaster · Metodología UMH</p>
            <p className="mt-1">Para una gestión sostenible de residuos orgánicos 🌍</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
