import React, { useState, useMemo, useEffect } from "react";
import { Trash2, Sparkles, Download, Save, Plus, History, X, CheckCircle2, Leaf, Info, AlertCircle } from "lucide-react";

// CONSTANTES
const IDEAL_CN = [20, 30];
const IDEAL_HUM = [50, 60];
const MATERIAL_GROUPS = ["Agrícola", "Urbano", "Industrial", "Ganadero", "Personalizado"];

const BASE_MATERIALS = [
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
  { id: "6", group: "Agrícola", name: "Hierba fresca", C: 20, N: 2.5, humidity: 80 },
  // URBANO
  { id: "20", group: "Urbano", name: "Residuos de cocina", C: 18, N: 2.5, humidity: 85 },
  { id: "21", group: "Urbano", name: "Restos de frutas y verduras", C: 20, N: 2.2, humidity: 90 },
  { id: "22", group: "Urbano", name: "Posos de café", C: 20, N: 2.0, humidity: 80 },
  { id: "23", group: "Urbano", name: "Bolsas de té", C: 30, N: 1.5, humidity: 70 },
  { id: "24", group: "Urbano", name: "Cáscaras de huevo", C: 15, N: 1.2, humidity: 5 },
  { id: "25", group: "Urbano", name: "Papel y cartón", C: 170, N: 0.1, humidity: 10 },
  // INDUSTRIAL
  { id: "40", group: "Industrial", name: "Orujo de uva", C: 30, N: 1.8, humidity: 60 },
  { id: "41", group: "Industrial", name: "Pulpa de aceituna", C: 45, N: 1.2, humidity: 65 },
  { id: "42", group: "Industrial", name: "Bagazo cervecero", C: 14, N: 2.8, humidity: 80 },
  { id: "43", group: "Industrial", name: "Restos de almazara", C: 40, N: 1.5, humidity: 55 },
  { id: "44", group: "Industrial", name: "Descartes hortofrutícolas", C: 20, N: 2.2, humidity: 85 },
  { id: "45", group: "Industrial", name: "Pulpa de tomate", C: 18, N: 2.5, humidity: 90 },
  { id: "46", group: "Industrial", name: "Restos de cítricos", C: 35, N: 1.6, humidity: 75 },
  { id: "47", group: "Industrial", name: "IV gama (ensaladas)", C: 22, N: 2.1, humidity: 88 },
  // GANADERO
  { id: "60", group: "Ganadero", name: "Estiércol vacuno", C: 42, N: 2.1, humidity: 75 },
  { id: "61", group: "Ganadero", name: "Estiércol ovino", C: 30, N: 2.5, humidity: 65 },
  { id: "62", group: "Ganadero", name: "Estiércol caprino", C: 28, N: 2.6, humidity: 60 },
  { id: "63", group: "Ganadero", name: "Estiércol porcino", C: 14, N: 3.5, humidity: 85 },
  { id: "64", group: "Ganadero", name: "Gallinaza", C: 10, N: 4.0, humidity: 70 },
  { id: "66", group: "Ganadero", name: "Estiércol equino", C: 55, N: 1.4, humidity: 60 }
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

function buildRecommendation(cn, hum) {
  if (cn < IDEAL_CN[0]) return "⚠️ Demasiado nitrógeno. Añade material seco (paja, poda).";
  if (cn > IDEAL_CN[1]) return "⚠️ Demasiado carbono. Añade material fresco (restos de cocina, estiércol).";
  if (hum < IDEAL_HUM[0]) return "⚠️ Mezcla seca. Añade materiales húmedos o agua.";
  if (hum > IDEAL_HUM[1]) return "⚠️ Muy húmeda. Añade material seco estructurante.";
  return "✅ ¡Perfecto! Mezcla óptima para compostaje.";
}

export default function App() {
  const [selected, setSelected] = useState([]);
  const [customMaterials, setCustomMaterials] = useState([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedMixes, setSavedMixes] = useState([]);

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
  const totalProportion = useMemo(() => selected.reduce((sum, m) => sum + m.proportion, 0), [selected]);

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
    const text = `COMPOSTMASTER - RECETA
Fecha: ${new Date().toLocaleDateString()}

MATERIALES:
${selected.map((m, i) => `${i + 1}. ${m.name}: ${m.proportion}% (${(m.proportion / 10).toFixed(1)} partes)`).join('\n')}

RESULTADOS:
• C/N: ${stats.cn} ${cnOk ? '✓' : '⚠'}
• Humedad: ${stats.hum}% ${humOk ? '✓' : '⚠'}

${buildRecommendation(stats.cn, stats.hum)}
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compost_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm("¿Limpiar toda la mezcla?")) setSelected([]);
  };

  const addCustomMaterial = (mat) => {
    setCustomMaterials(prev => [...prev, mat]);
    toggleMaterial(mat);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', marginBottom: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                <Leaf size={36} color="white" strokeWidth={3} />
              </div>
              <div>
                <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#111827', margin: 0, lineHeight: 1 }}>
                  Compost<span style={{ color: '#10b981' }}>Master</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: '600', margin: '4px 0 0 0' }}>
                  Calculadora Profesional de Compostaje
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {savedMixes.length > 0 && (
                <button onClick={() => setShowHistory(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                  <History size={20} /> Mis Mezclas ({savedMixes.length})
                </button>
              )}
              <button onClick={() => setShowCustomModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
                <Plus size={20} /> Personalizado
              </button>
            </div>
          </div>
        </div>

        {/* FACTORES IDEALES */}
        <details style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <summary style={{ fontSize: '20px', fontWeight: '800', cursor: 'pointer', color: '#111827', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>📊</span>
            Factores Ideales para el Compostaje
            <span style={{ marginLeft: 'auto', color: '#10b981' }}>▼</span>
          </summary>
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { label: "Relación C/N", value: "20-30", bg: '#d1fae5' },
              { label: "Humedad", value: "50-60%", bg: '#dbeafe' },
              { label: "pH", value: "5,0-8,5", bg: '#e9d5ff' },
              { label: "Salinidad", value: "< 4 dS/m", bg: '#fed7aa' },
              { label: "Temperatura", value: "55-65°C", bg: '#fecaca' },
            ].map((item, i) => (
              <div key={i} style={{ background: item.bg, padding: '16px', borderRadius: '12px', border: '3px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#111827' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </details>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr', gap: '24px' }}>
          
          {/* SELECCIÓN DE MATERIALES */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>1️⃣</span> Selecciona Materiales
            </h2>
            
            {MATERIAL_GROUPS.map(group => {
              const groupMats = allMaterials.filter(m => m.group === group);
              if (groupMats.length === 0 && group === "Personalizado") return null;
              
              return (
                <details key={group} style={{ background: '#f9fafb', border: '3px solid #e5e7eb', borderRadius: '16px', marginBottom: '12px', overflow: 'hidden' }}>
                  <summary style={{ padding: '16px 20px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', background: 'linear-gradient(90deg, #f9fafb, #f3f4f6)', color: '#111827', display: 'flex', alignItems: 'center', gap: '12px', listStyle: 'none' }}>
                    <span>▶</span>
                    <span style={{ flex: 1 }}>{group}</span>
                    <span style={{ background: '#10b981', color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: '700' }}>
                      {groupMats.length}
                    </span>
                  </summary>
                  <div style={{ padding: '20px', background: 'white' }}>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {groupMats.map(mat => {
                        const isSelected = selected.find(m => m.id === mat.id);
                        const cn = (mat.C / mat.N).toFixed(1);
                        return (
                          <button
                            key={mat.id}
                            onClick={() => toggleMaterial(mat)}
                            style={{
                              padding: '16px',
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
                                  C/N: {cn} · Humedad: {mat.humidity}%
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
                <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>2️⃣</span> Ajustar Proporciones
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

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <button onClick={optimizeMix} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                      <Sparkles size={20} /> Distribuir
                    </button>
                    <button onClick={clearAll} style={{ padding: '16px 20px', background: 'white', color: '#ef4444', border: '3px solid #ef4444', borderRadius: '12px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
                      Limpiar
                    </button>
                  </div>

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
                <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '32px' }}>3️⃣</span> Resultados
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
                  <div style={{ background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)', padding: '24px', borderRadius: '16px', marginBottom: '24px', border: '3px solid #e5e7eb' }}>
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
                              <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>
                                {(m.proportion / 10).toFixed(1)} partes
                              </span>
                              {percentage > 30 && (
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ 
                      background: cnOk ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      padding: '24px',
                      borderRadius: '16px',
                      border: cnOk ? '3px solid #10b981' : '3px solid #fbbf24',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px' }}>RELACIÓN C/N</div>
                      <div style={{ fontSize: '48px', fontWeight: '900', color: cnOk ? '#059669' : '#d97706', lineHeight: 1 }}>
                        {stats.cn}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: cnOk ? '#059669' : '#d97706', marginTop: '8px' }}>
                        {cnOk ? "✓ ÓPTIMO" : "⚠ AJUSTAR"}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginTop: '4px' }}>
                        Ideal: {IDEAL_CN[0]}-{IDEAL_CN[1]}
                      </div>
                    </div>

                    <div style={{ 
                      background: humOk ? 'linear-gradient(135deg, #dbeafe, #bfdbfe)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      padding: '24px',
                      borderRadius: '16px',
                      border: humOk ? '3px solid #3b82f6' : '3px solid #fbbf24',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#374151', marginBottom: '8px' }}>HUMEDAD</div>
                      <div style={{ fontSize: '48px', fontWeight: '900', color: humOk ? '#1d4ed8' : '#d97706', lineHeight: 1 }}>
                        {stats.hum}%
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: humOk ? '#1d4ed8' : '#d97706', marginTop: '8px' }}>
                        {humOk ? "✓ ÓPTIMO" : "⚠ AJUSTAR"}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginTop: '4px' }}>
                        Ideal: {IDEAL_HUM[0]}-{IDEAL_HUM[1]}%
                      </div>
                    </div>
                  </div>

                  {/* RECOMENDACIÓN */}
                  <div style={{ 
                    background: cnOk && humOk ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: cnOk && humOk ? '3px solid #10b981' : '3px solid #fbbf24',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px'
                  }}>
                    <span style={{ fontSize: '42px' }}>{cnOk && humOk ? "🎉" : "💡"}</span>
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
              <div style={{ background: 'white', borderRadius: '20px', padding: '60px 28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center' }}>
                <div style={{ width: '96px', height: '96px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
                  <Leaf size={52} color="white" strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '30px', fontWeight: '900', color: '#111827', marginBottom: '12px' }}>¡Comienza tu Mezcla!</h3>
                <p style={{ fontSize: '16px', color: '#6b7280', fontWeight: '600', maxWidth: '400px', margin: '0 auto' }}>
                  Selecciona materiales de la izquierda para calcular la relación C/N y humedad óptimas
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODALES */}
        {showCustomModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: '24px', maxWidth: '500px', width: '100%', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', margin: 0 }}>Nuevo Material</h3>
                <button onClick={() => setShowCustomModal(false)} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addCustomMaterial({
                  id: `custom-${Date.now()}`,
                  group: "Personalizado",
                  name: formData.get('name'),
                  C: parseFloat(formData.get('C')),
                  N: parseFloat(formData.get('N')),
                  humidity: parseFloat(formData.get('humidity')),
                  isCustom: true
                });
                setShowCustomModal(false);
              }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#374151', marginBottom: '8px' }}>Nombre del material</label>
                  <input name="name" required style={{ width: '100%', padding: '14px', border: '3px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', fontWeight: '600' }} placeholder="Ej: Restos de poda" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '8px' }}>% Carbono</label>
                    <input name="C" type="number" step="0.1" required style={{ width: '100%', padding: '12px', border: '3px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', fontWeight: '700', textAlign: 'center' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '8px' }}>% Nitrógeno</label>
                    <input name="N" type="number" step="0.1" required style={{ width: '100%', padding: '12px', border: '3px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', fontWeight: '700', textAlign: 'center' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#374151', marginBottom: '8px' }}>% Humedad</label>
                    <input name="humidity" type="number" step="1" required style={{ width: '100%', padding: '12px', border: '3px solid #e5e7eb', borderRadius: '10px', fontSize: '16px', fontWeight: '700', textAlign: 'center' }} />
                  </div>
                </div>
                <div style={{ background: '#dbeafe', border: '3px solid #3b82f6', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '13px', color: '#1e40af', fontWeight: '600' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Info size={16} /> Nota:
                  </strong>
                  Estos valores se obtienen por análisis de laboratorio. Si no los conoces, usa materiales similares.
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowCustomModal(false)} style={{ flex: 1, padding: '16px', background: 'white', color: '#374151', border: '3px solid #d1d5db', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" style={{ flex: 1, padding: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                    Añadir
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistory && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: '24px', maxWidth: '800px', width: '100%', padding: '32px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '28px', fontWeight: '900', color: '#111827', margin: 0 }}>Mezclas Guardadas</h3>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
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
                      <div style={{ display: 'flex', gap: '12px' }}>
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

        {/* FOOTER */}
        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'white', borderRadius: '16px', padding: '20px 32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>CompostMaster · Metodología UMH</p>
            <p style={{ fontSize: '14px', color: '#6b7280', fontWeight: '600', margin: 0 }}>Gestión sostenible de residuos orgánicos 🌍</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        button:hover {
          transform: translateY(-2px);
          transition: all 0.2s;
        }
        button:active {
          transform: translateY(0);
        }
        details[open] > summary span:last-child {
          transform: rotate(90deg);
        }
      `}</style>
    </div>
  );
}
