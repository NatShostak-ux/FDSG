import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Info } from 'lucide-react';

const MASTER_COLORS = {
  p1: '#0f172a',   // Slate 900
  gold: '#bf9000'  // Arad Gold
};

const ARAD_GOLD = '#bf9000';
const ARAD_CHART_BG = '#081f32';

const PHASE_1_BREAKDOWN = [
  { id: 'ux', area: 'UXD', color: '#9333ea', title: 'Ristrutturazione completa navigazione e-commerce', desc: "Riorganizza categorie, menu e percorsi di acquisto per ridurre l'abbandono e aumentare la profondità di visita." },
  { id: 'seo', area: 'SEO', color: '#16a34a', title: 'Consolidamento domini e authority (EEAT)', desc: "Unifica i domini esistenti e ottimizza i contenuti per i segnali di autorevolezza che Google premia nel settore food & wine." },
  { id: 'loyalty', area: 'LOY', color: '#db2777', title: 'Lancio subscription box (Coffret de Curiosités)', desc: "Introduce un prodotto in abbonamento ricorrente come primo meccanismo di fidelizzazione attiva." },
  { id: 'crm', area: 'CRM', color: '#0891b2', title: 'Attivazione Welcome series', desc: "Configura il flusso email automatico post-registrazione per attivare i nuovi contatti verso il primo acquisto." },
  { id: 'ecommerce', area: 'ECM', color: '#2563eb', title: 'Nuovo checkout ottimizzato per Conversion Rate', desc: "Ridisegna il processo di acquisto riducendo gli step, ottimizzando i pagamenti e abbattendo il tasso di abbandono carrello." },
  { id: 'distribution', area: 'MRK', color: '#d97706', title: 'Setup Amazon Corner e Vivino Verified', desc: "Attiva e presidia i profili di vendita su Amazon e Vivino per intercettare domanda già esistente fuori dal sito." },
  { id: 'social', area: 'SOC', color: '#dc2626', title: 'Avvio social commerce experience e gift card', desc: "Abilita l'acquisto diretto dai canali social e lancia il prodotto gift card come leva di acquisizione." }
];

const Badge = ({ color, children }) => (
  <span style={{ backgroundColor: color }} className="text-white text-[10px] tracking-widest font-bold px-3 py-1 rounded-full inline-block">
    {children}
  </span>
);

const VConnector = ({ color, height = 48, visible }) => (
  <div className={`flex justify-center items-stretch transition-all duration-700 ${visible ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 origin-top'}`} style={{ height }}>
    <div style={{ width: 2, backgroundColor: color, borderRadius: 2 }}></div>
  </div>
);

const MasterRoadmapView = ({ onSelectPhase }) => {
  const [step, setStep] = useState(0);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [showPhase1Tree, setShowPhase1Tree] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const run = () => {
    setStep(0);
    // Animazione lineare che arriva fino alla sintesi finale
    const delays = [150, 800, 1500, 2200];
    delays.forEach((d, i) => setTimeout(() => setStep(i + 1), d));
  };

  const startRoadmap = () => {
    setShowRoadmap(true);
    run();
  };

  const s = (n) => step >= n;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fadeIn pb-24 relative">
      
      {/* TASTO SKIP */}
      <button 
          onClick={() => onSelectPhase(1)}
          className="absolute top-2 right-2 md:top-6 md:right-6 bg-white border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 text-gray-900 text-[11px] font-bold tracking-widest uppercase px-6 py-3 rounded-full transition-all flex items-center gap-2 z-50 group"
      >
          Skip allo Scenario <ChevronRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* SEZIONE 1: I PRINCIPI CHIAVE */}
      <div className="mb-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/40 to-transparent rounded-[3rem] -z-10 transform scale-105 pointer-events-none"></div>

        <div className="text-center mb-16 pt-8 animate-fadeIn">
          <div className="text-[10px] tracking-[4px] uppercase text-gray-400 mb-3 font-bold">
            Feudi di San Gregorio · D2C Strategy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <span className="block">Piano Strategico:</span>
            <span className="block">Esecuzione Eccellente</span>
          </h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: MASTER_COLORS.gold }}></div>
        </div>

        {/* Visualizzazione Nodo Unico o Principale */}
        <div className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="w-[280px] h-[280px] rounded-full shadow-2xl flex items-center justify-center mb-20 relative overflow-hidden border-4 border-white/10 transition-transform duration-700 hover:scale-105" style={{ backgroundColor: ARAD_CHART_BG }}>
             <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${ARAD_GOLD}22 0%, transparent 70%)`}}></div>
             
             <svg width="240" height="240" viewBox="0 0 200 200" className="relative z-10">
                <circle cx="100" cy="100" r="85" fill="none" stroke={ARAD_GOLD} strokeWidth="1.5" strokeDasharray="6 6" className="animate-spin origin-center" style={{ animationDuration: '20s' }} />
                <circle cx="100" cy="100" r="45" fill={ARAD_GOLD} fillOpacity="0.1" stroke={ARAD_GOLD} strokeWidth="1" />
                <g className="cursor-default">
                    <circle cx="100" cy="100" r="20" fill={MASTER_COLORS.p1} className="shadow-lg" />
                    <text x="100" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Outfit">A</text>
                </g>
             </svg>
          </div>

          <div className="max-w-2xl mx-auto text-center px-4 relative z-10">
              <div className="flex flex-col bg-white rounded-2xl p-8 shadow-sm border-t-4" style={{ borderTopColor: MASTER_COLORS.p1 }}>
                  <h3 className="text-3xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Esecuzione eccellente
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed font-light italic">
                      "Prima di qualsiasi acceleratore, Feudi di San Gregorio ha bisogno di un D2C che funzioni davvero: un'architettura tecnica solida, un'esperienza d'acquisto fluida, metriche di conversione presidiate. Senza questo, nessuna leva funziona."
                  </p>
              </div>
          </div>
        </div>
      </div>

      {/* TITOLO ROADMAP */}
      <div className="flex flex-col items-center justify-center mt-20 animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          {!showRoadmap && (
            <div className="animate-bounce mb-4" style={{ color: ARAD_GOLD }}>
                <ChevronDown size={36} strokeWidth={2.5} />
            </div>
          )}
          
          <div 
            onClick={!showRoadmap ? startRoadmap : undefined}
            className={`group relative text-center px-8 py-2 ${!showRoadmap ? 'cursor-pointer hover:scale-105 transition-transform duration-300' : ''}`}
          >
            <h2 className="text-4xl md:text-5xl font-bold flex items-center justify-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: ARAD_GOLD }}>
               Roadmap Strategica 
            </h2>
            <div className={`h-1 mx-auto rounded-full mt-6 transition-all duration-700 ${showRoadmap ? 'w-32 opacity-100' : 'w-0 opacity-0'}`} style={{ backgroundColor: ARAD_GOLD }}></div>
          </div>
      </div>

      {/* ROADMAP RENDERIZZATA */}
      {showRoadmap && (
          <div className="mt-8 pt-8 animate-fadeIn max-w-3xl mx-auto">
            
            {/* START */}
            {s(1) && (
                <div className="flex justify-center animate-fadeIn">
                    <div className="flex items-center gap-2 text-white text-[10px] tracking-widest font-bold px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: MASTER_COLORS.p1 }}>
                        <div className="w-2 h-2 rounded-full bg-white/60"></div>
                        START · Oggi
                    </div>
                </div>
            )}

            <VConnector color={MASTER_COLORS.p1} height={40} visible={s(1)} />

            {/* CARD FASE 1 */}
            {s(2) && (
                <div 
                    className="bg-white border border-gray-200 border-l-4 rounded-xl rounded-l-none p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group animate-fadeIn" 
                    style={{ borderLeftColor: MASTER_COLORS.p1 }}
                    onClick={() => onSelectPhase(1)} 
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Badge color={MASTER_COLORS.p1}>ESECUZIONE</Badge>
                        <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">0 → 12 mesi</span>
                    </div>
                    <div className="text-2xl font-bold mb-3" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>
                        Road to Excellence
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 max-w-xl">
                        Un ecosistema D2C moderno, ricco e interattivo che valorizza i punti di forza e sistema le falle attuali — costruendo una macchina di conversione solida su fondamenta sane.
                    </p>
                    
                    <div className="flex flex-col gap-5 mt-8 relative">
                        <div className="flex items-center justify-between relative z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    setShowPhase1Tree(!showPhase1Tree);
                                }}
                                className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                <span className="text-2xl font-bold" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>€ 1M</span>
                                <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-2" style={{ color: MASTER_COLORS.p1 }}>
                                    target D2C in 12 mesi
                                    <ChevronDown size={14} className={`transition-transform duration-300 text-gray-400 ${showPhase1Tree ? 'rotate-180' : ''}`} />
                                </span>
                            </button>
                            <div className="text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: MASTER_COLORS.p1 }}>
                                Apri lo Scenario <ChevronRight size={16}/>
                            </div>
                        </div>

                        {/* ALBERO INTERATTIVO */}
                        {showPhase1Tree && (
                            <div className="mt-5 ml-6 relative animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                    <div className="absolute left-0 top-3 bottom-0 w-px bg-gray-300 z-0"></div>
                                    {PHASE_1_BREAKDOWN.map((item) => (
                                        <div key={item.id} className="relative flex items-center justify-between gap-3 pl-8 mb-5 group/item z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px bg-gray-300"></div>
                                                <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm ml-1" style={{ backgroundColor: item.color }}>{item.area}</span>
                                                <span className="text-sm font-medium text-gray-700">{item.title}</span>
                                            </div>
                                            <div className="relative flex items-center ml-2 flex-shrink-0" onMouseEnter={() => setActiveTooltip(item.id)} onMouseLeave={() => setActiveTooltip(null)}>
                                                <Info size={14} className="text-gray-400 hover:text-slate-800 cursor-help transition-colors" />
                                                {activeTooltip === item.id && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 bg-white text-gray-600 text-[13px] leading-relaxed p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 animate-fadeIn pointer-events-none">
                                                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-r border-t border-gray-100 rotate-45"></div>
                                                        {item.desc}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="relative flex items-start pl-8 mt-8 pb-2 z-10">
                                    <div className="absolute left-0 -top-8 h-[42px] w-px bg-gray-300 z-0"></div>
                                    <div className="absolute left-0 top-[10px] w-6 h-px bg-gray-300 z-0"></div>
                                    <div className="w-full relative z-10">
                                        <span className="text-[12px] tracking-[2px] font-bold text-slate-500 uppercase">Abilitatori Trasversali</span>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                                            {['Logistica', 'Organizzazione', 'Tecnologia'].map((label, i) => (
                                                <div key={label} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                                    <div className="text-[10px] font-bold text-slate-800 uppercase mb-2">{label}</div>
                                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                                        {i===0 && "Regole di segregazione per one pool inventory, pop-up WH presso i corrieri"}
                                                        {i===1 && "Selezione digital marketing/SEO agency, piano di recruiting interno"}
                                                        {i===2 && "Integrazione nuovo tech-stack (e-com, CRM, Marketing automation)"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <VConnector color={MASTER_COLORS.p1} height={52} visible={s(3)} />

            {/* SINTESI FINALE */}
            {s(4) && (
                <div className="mt-8 animate-fadeIn">
                    <div className="text-[10px] tracking-[3px] uppercase text-gray-400 text-center font-bold mb-6">
                        Focus Strategico Finale
                    </div>
                    
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 border-t-4" style={{ borderTopColor: MASTER_COLORS.gold }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-xl font-bold text-slate-800 mb-2">Ecosistema</div>
                                <p className="text-xs text-slate-500">D2C moderno, ricco e interattivo</p>
                            </div>
                            <div className="border-x border-gray-100">
                                <div className="text-xl font-bold text-slate-800 mb-2">Conversione</div>
                                <p className="text-xs text-slate-500">Ottimizzazione dei flussi e del checkout</p>
                            </div>
                            <div>
                                <div className="text-xl font-bold text-slate-800 mb-2">Ambizione</div>
                                <p className="text-xs text-slate-500">Macchina da 1M di fatturato in 12 mesi</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <button 
                            onClick={run} 
                            className="text-[10px] tracking-widest uppercase font-bold text-gray-400 border border-gray-200 px-6 py-2.5 rounded hover:text-yellow-600 hover:border-yellow-600 transition-colors"
                        >
                            ↺ Rivedi piano
                        </button>
                    </div>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default MasterRoadmapView;
