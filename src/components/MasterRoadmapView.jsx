import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Info } from 'lucide-react';

const MASTER_COLORS = {
  p1: '#0f172a',   // Slate 900
  push: '#8B3A20', // Conversione
  pull: '#78A48C', // Editorialità
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
    // Animazione fluida fino alla fine (Step 4 è la sintesi)
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

      {/* SEZIONE 1: IL TRIANGOLO DEI 3 PRINCIPI */}
      <div className="mb-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/40 to-transparent rounded-[3rem] -z-10 transform scale-105 pointer-events-none"></div>

        <div className="text-center mb-16 pt-8 animate-fadeIn">
          <div className="text-[10px] tracking-[4px] uppercase text-gray-400 mb-3 font-bold">
            Feudi di San Gregorio · D2C Strategy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Modulo 2: 3 Principi Chiave
          </h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: MASTER_COLORS.gold }}></div>
        </div>

        <div className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          
          {/* SVG TRIANGOLO */}
          <div className="w-[300px] h-[300px] rounded-full shadow-2xl flex items-center justify-center mb-20 relative overflow-hidden border-4 border-white/10 transition-transform duration-700 hover:scale-105" style={{ backgroundColor: ARAD_CHART_BG }}>
             <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${ARAD_GOLD}22 0%, transparent 70%)`}}></div>
             
             <svg width="260" height="260" viewBox="0 0 200 200" className="relative z-10">
                <circle cx="100" cy="100" r="85" fill="none" stroke={ARAD_GOLD} strokeWidth="1.5" strokeDasharray="6 6" className="animate-spin origin-center" style={{ animationDuration: '15s' }} />
                <polygon points="100,15 173.6,142.5 26.4,142.5" fill="rgba(191,144,0,0.1)" stroke={ARAD_GOLD} strokeWidth="2.5" strokeLinejoin="round" />

                <g onMouseEnter={() => setActiveNode('A')} onMouseLeave={() => setActiveNode(null)} className="cursor-pointer transition-all duration-300" style={{ opacity: activeNode && activeNode !== 'A' ? 0.3 : 1 }}>
                    <circle cx="100" cy="15" r={activeNode === 'A' ? 20 : 16} fill={MASTER_COLORS.p1} />
                    <text x="100" y={activeNode === 'A' ? 20 : 19} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Outfit">A</text>
                </g>

                <g onMouseEnter={() => setActiveNode('B')} onMouseLeave={() => setActiveNode(null)} className="cursor-pointer transition-all duration-300" style={{ opacity: activeNode && activeNode !== 'B' ? 0.3 : 1 }}>
                    <circle cx="173.6" cy="142.5" r={activeNode === 'B' ? 20 : 16} fill={MASTER_COLORS.pull} />
                    <text x="173.6" y={activeNode === 'B' ? 147.5 : 146.5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Outfit">B</text>
                </g>

                <g onMouseEnter={() => setActiveNode('C')} onMouseLeave={() => setActiveNode(null)} className="cursor-pointer transition-all duration-300" style={{ opacity: activeNode && activeNode !== 'C' ? 0.3 : 1 }}>
                    <circle cx="26.4" cy="142.5" r={activeNode === 'C' ? 20 : 16} fill={MASTER_COLORS.push} />
                    <text x="26.4" y={activeNode === 'C' ? 147.5 : 146.5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Outfit">C</text>
                </g>
             </svg>
          </div>

          {/* DESCRIZIONI TRIANGOLO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4 relative z-10">
              <div className={`flex flex-col bg-white rounded-2xl p-8 shadow-sm transition-all duration-500 border-t-4 ${activeNode === 'A' ? '-translate-y-3 ring-2 ring-blue-100' : ''}`} style={{ borderTopColor: MASTER_COLORS.p1 }}>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Esecuzione eccellente</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">La foundation di tutto. Un'architettura tecnica solida e un'esperienza d'acquisto fluida. Senza questo, nessuna leva funziona.</p>
              </div>

              <div className={`flex flex-col bg-white rounded-2xl p-8 shadow-sm transition-all duration-500 border-t-4 ${activeNode === 'B' ? '-translate-y-3 ring-2 ring-blue-100' : ''}`} style={{ borderTopColor: MASTER_COLORS.pull }}>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Editorialità</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">Il contenuto come canale di acquisizione. Trasformare il patrimonio culturale in valore per costruire autorevolezza.</p>
              </div>

              <div className={`flex flex-col bg-white rounded-2xl p-8 shadow-sm transition-all duration-500 border-t-4 ${activeNode === 'C' ? '-translate-y-3 ring-2 ring-blue-100' : ''}`} style={{ borderTopColor: MASTER_COLORS.push }}>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Conversione assistita</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-light">Accompagnare l'utente attraverso raccomandazioni personalizzate, trasformando ogni visita in una relazione.</p>
              </div>
          </div>
        </div>
      </div>

      {/* ROADMAP SECTION */}
      <div className="flex flex-col items-center justify-center mt-20">
          {!showRoadmap && <div className="animate-bounce mb-4" style={{ color: ARAD_GOLD }}><ChevronDown size={36} strokeWidth={2.5} /></div>}
          <div onClick={!showRoadmap ? startRoadmap : undefined} className={`group text-center px-8 py-2 ${!showRoadmap ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}>
            <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: ARAD_GOLD }}>Roadmap Strategica</h2>
            <div className={`h-1 mx-auto rounded-full mt-6 transition-all duration-700 ${showRoadmap ? 'w-32 opacity-100' : 'w-0 opacity-0'}`} style={{ backgroundColor: ARAD_GOLD }}></div>
          </div>
      </div>

      {showRoadmap && (
          <div className="mt-8 pt-8 animate-fadeIn max-w-3xl mx-auto">
            
            {/* OGGI */}
            {s(1) && (
                <div className="flex justify-center animate-fadeIn">
                    <div className="flex items-center gap-2 text-white text-[10px] tracking-widest font-bold px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: MASTER_COLORS.p1 }}>
                        START · Oggi
                    </div>
                </div>
            )}

            <VConnector color={MASTER_COLORS.p1} height={40} visible={s(1)} />

            {/* CARD UNICA PHASE 1 */}
            {s(2) && (
                <div className="bg-white border border-gray-200 border-l-4 rounded-xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group" style={{ borderLeftColor: MASTER_COLORS.p1 }} onClick={() => onSelectPhase(1)}>
                    <div className="flex items-center gap-3 mb-4">
                        <Badge color={MASTER_COLORS.p1}>ESECUZIONE</Badge>
                        <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">0 → 12 mesi</span>
                    </div>
                    <div className="text-2xl font-bold mb-3" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>Road to Excellence</div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6">Un ecosistema D2C moderno e interattivo che sistema le falle attuali e costruisce una macchina di conversione solida.</p>
                    
                    <div className="flex flex-col gap-5 mt-8">
                        <button onClick={(e) => { e.stopPropagation(); setShowPhase1Tree(!showPhase1Tree); }} className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                            <span className="text-2xl font-bold" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>€ 1M</span>
                            <span className="text-[11px] font-bold tracking-wider uppercase flex items-center gap-2" style={{ color: MASTER_COLORS.p1 }}>
                                target D2C in 12 mesi
                                <ChevronDown size={14} className={`transition-transform duration-300 ${showPhase1Tree ? 'rotate-180' : ''}`} />
                            </span>
                        </button>

                        {showPhase1Tree && (
                            <div className="mt-5 ml-6 relative animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                                <div className="absolute left-0 top-3 bottom-0 w-px bg-gray-200"></div>
                                {PHASE_1_BREAKDOWN.map((item) => (
                                    <div key={item.id} className="relative flex items-center justify-between gap-3 pl-8 mb-5 group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="absolute left-0 top-1/2 w-4 h-px bg-gray-200"></div>
                                            <div className="absolute left-[14px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: item.color }}>{item.area}</span>
                                            <span className="text-sm font-medium text-gray-700">{item.title}</span>
                                        </div>
                                        <div className="relative" onMouseEnter={() => setActiveTooltip(item.id)} onMouseLeave={() => setActiveTooltip(null)}>
                                            <Info size={14} className="text-gray-300 hover:text-slate-600 cursor-help" />
                                            {activeTooltip === item.id && (
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-64 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 z-50">
                                                    <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <VConnector color={MASTER_COLORS.p1} height={60} visible={s(3)} />

            {/* SINTESI FINALE LINEARE */}
            {s(4) && (
                <div className="mt-4 animate-fadeIn">
                    <div className="text-[10px] tracking-[3px] uppercase text-gray-400 text-center font-bold mb-6">Focus Strategico 2026</div>
                    <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden border border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
                            <div>
                                <div className="text-2xl font-bold text-yellow-500 mb-1">Ecosistema</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-60">D2C Moderno</div>
                            </div>
                            <div className="md:border-x border-white/10 px-4">
                                <div className="text-2xl font-bold text-yellow-500 mb-1">Conversione</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-60">Check-out & UX</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-500 mb-1">Crescita</div>
                                <div className="text-[10px] uppercase tracking-widest opacity-60">Retention</div>
                            </div>
                        </div>
                    </div>
                    <div className="text-center mt-12">
                        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="text-[10px] tracking-widest uppercase font-bold text-gray-400 hover:text-yellow-600 transition-colors">
                            ↺ Rivedi i principi
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
