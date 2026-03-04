import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Info } from 'lucide-react';

const MASTER_COLORS = {
  p1: '#0f172a',   // Slate 900
  push: '#8B3A20', // Nuovo colore Conversione (C)
  pull: '#78A48C', // Nuovo colore Editorialità (B)
  gold: '#bf9000'  // Arad Gold
};

const ARAD_GOLD = '#bf9000';
const ARAD_CHART_BG = '#081f32';

// Dati aggiornati con i nuovi titoli per il breakdown interattivo della Fase 1
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

const Tag = ({ color, bg, children }) => (
  <span style={{ border: `1px solid ${color}44`, backgroundColor: bg, color: color }} className="text-[10px] tracking-wide px-3 py-1 rounded-full inline-block font-medium hover:opacity-80 transition-opacity cursor-default">
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
  
  // Stati per l'interazione della Fase 1
  const [showPhase1Tree, setShowPhase1Tree] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const run = () => {
    setStep(0);
    const delays = [150, 800, 1500, 2100, 2700, 3300, 3900];
    delays.forEach((d, i) => setTimeout(() => setStep(i + 1), d));
  };

  const startRoadmap = () => {
    setShowRoadmap(true);
    run();
  };

  const s = (n) => step >= n;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-fadeIn pb-24">
      
      {/* SEZIONE 1: I 3 PRINCIPI CHIAVE (INTERATTIVA) */}
      <div className="mb-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/40 to-transparent rounded-[3rem] -z-10 transform scale-105 pointer-events-none"></div>

        <div className="text-center mb-16 pt-8 animate-fadeIn">
          <div className="text-[10px] tracking-[4px] uppercase text-gray-400 mb-3 font-bold">
            Feudi di San Gregorio · D2C Strategy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            <span className="block">Modulo 2:</span>
            <span className="block">3 Principi Chiave</span>
          </h1>
          <div className="w-16 h-1 mx-auto rounded-full" style={{ backgroundColor: MASTER_COLORS.gold }}></div>
        </div>

        <div className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          
          <div className="w-[300px] h-[300px] rounded-full shadow-2xl flex items-center justify-center mb-20 relative overflow-hidden border-4 border-white/10 transition-transform duration-700 hover:scale-105" style={{ backgroundColor: ARAD_CHART_BG }}>
             <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${ARAD_GOLD}22 0%, transparent 70%)`}}></div>
             
             <svg width="260" height="260" viewBox="0 0 200 200" className="relative z-10">
                <defs>
                    <radialGradient id="masterPolyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor={ARAD_GOLD} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={ARAD_GOLD} stopOpacity="0.1" />
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="85" fill="none" stroke={ARAD_GOLD} strokeWidth="1.5" strokeDasharray="6 6" className="animate-spin origin-center" style={{ animationDuration: '15s' }} />
                <circle cx="100" cy="100" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                <polygon 
                    points="100,15 173.6,142.5 26.4,142.5" 
                    fill="url(#masterPolyGradient)" 
                    stroke={ARAD_GOLD} 
                    strokeWidth="2.5" 
                    strokeLinejoin="round"
                    className="transition-all duration-500 drop-shadow-lg"
                    style={{ opacity: activeNode ? 0.3 : 1 }}
                />

                <g 
                    onMouseEnter={() => setActiveNode('A')} 
                    onMouseLeave={() => setActiveNode(null)} 
                    className="cursor-pointer transition-all duration-300"
                    style={{ opacity: activeNode && activeNode !== 'A' ? 0.3 : 1 }}
                >
                    <circle cx="100" cy="15" r={activeNode === 'A' ? 20 : 16} fill={MASTER_COLORS.p1} className="transition-all duration-300" style={{ filter: activeNode === 'A' ? 'brightness(1.3)' : 'none' }} />
                    <text x="100" y={activeNode === 'A' ? 20 : 19} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Outfit" className="pointer-events-none">A</text>
                </g>

                <g 
                    onMouseEnter={() => setActiveNode('B')} 
                    onMouseLeave={() => setActiveNode(null)} 
                    className="cursor-pointer transition-all duration-300"
                    style={{ opacity: activeNode && activeNode !== 'B' ? 0.3 : 1 }}
                >
                    <circle cx="173.6" cy="142.5" r={activeNode === 'B' ? 20 : 16} fill={MASTER_COLORS.pull} className="transition-all duration-300" style={{ filter: activeNode === 'B' ? 'brightness(1.2)' : 'none' }} />
                    <text x="173.6" y={activeNode === 'B' ? 147.5 : 146.5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Outfit" className="pointer-events-none">B</text>
                </g>

                <g 
                    onMouseEnter={() => setActiveNode('C')} 
                    onMouseLeave={() => setActiveNode(null)} 
                    className="cursor-pointer transition-all duration-300"
                    style={{ opacity: activeNode && activeNode !== 'C' ? 0.3 : 1 }}
                >
                    <circle cx="26.4" cy="142.5" r={activeNode === 'C' ? 20 : 16} fill={MASTER_COLORS.push} className="transition-all duration-300" style={{ filter: activeNode === 'C' ? 'brightness(1.2)' : 'none' }} />
                    <text x="26.4" y={activeNode === 'C' ? 147.5 : 146.5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Outfit" className="pointer-events-none">C</text>
                </g>
             </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full px-4 relative z-10">
             <div 
                className={`flex flex-col bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 transform ${activeNode === 'A' ? '-translate-y-3 ring-2 ring-opacity-50 ring-offset-4' : 'hover:-translate-y-2'}`}
                style={{ borderTop: `4px solid ${MASTER_COLORS.p1}`, '--tw-ring-color': MASTER_COLORS.p1 }}
                onMouseEnter={() => setActiveNode('A')}
                onMouseLeave={() => setActiveNode(null)}
             >
                 <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: MASTER_COLORS.p1 }}>A</div>
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                     Esecuzione eccellente
                 </h3>
                 <p className="text-sm text-gray-600 leading-relaxed font-light">
                     La foundation di tutto. Prima di qualsiasi acceleratore, Feudi di San Gregorio ha bisogno di un D2C che funzioni davvero: un'architettura tecnica solida, un'esperienza d'acquisto fluida, metriche di conversione presidiate. Senza questo, nessuna leva funziona.
                 </p>
             </div>

             <div 
                className={`flex flex-col bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 transform ${activeNode === 'B' ? '-translate-y-3 ring-2 ring-opacity-50 ring-offset-4' : 'hover:-translate-y-2'}`}
                style={{ borderTop: `4px solid ${MASTER_COLORS.pull}`, '--tw-ring-color': MASTER_COLORS.pull }}
                onMouseEnter={() => setActiveNode('B')}
                onMouseLeave={() => setActiveNode(null)}
             >
                 <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: MASTER_COLORS.pull }}>B</div>
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                     Editorialità
                 </h3>
                 <p className="text-sm text-gray-600 leading-relaxed font-light">
                     Il contenuto come canale di acquisizione e retention. Feudi di San Gregorio ha un patrimonio culturale - territorio, vitigni, storia - che nessun competitor può replicare. Trasformare questo asset in contenuto significa costruire autorevolezza, intercettare domanda latente e ridurre la dipendenza dal marketing spend.
                 </p>
             </div>

             <div 
                className={`flex flex-col bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 transform ${activeNode === 'C' ? '-translate-y-3 ring-2 ring-opacity-50 ring-offset-4' : 'hover:-translate-y-2'}`}
                style={{ borderTop: `4px solid ${MASTER_COLORS.push}`, '--tw-ring-color': MASTER_COLORS.push }}
                onMouseEnter={() => setActiveNode('C')}
                onMouseLeave={() => setActiveNode(null)}
             >
                 <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: MASTER_COLORS.push }}>C</div>
                 </div>
                 <h3 className="text-2xl font-bold mb-4 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                     Conversione assistita
                 </h3>
                 <p className="text-sm text-gray-600 leading-relaxed font-light">
                     Un sistema che accompagna l'utente dalla scoperta all'acquisto - attraverso raccomandazioni personalizzate, un sommelier digitale che apprende nel tempo, o entrambi - trasformando ogni visita in una conversazione e ogni conversazione in una relazione.
                 </p>
             </div>
          </div>
        </div>
      </div>

      {/* CALL TO ACTION / TITLE ROADMAP */}
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

      {/* ROADMAP RENDERIZZATA SOLO DOPO IL CLICK */}
      {showRoadmap && (
          <div className="mt-8 pt-8 animate-fadeIn max-w-3xl mx-auto">
            
            {s(1) && (
                <div className="flex justify-center animate-fadeIn">
                    <div className="flex items-center gap-2 text-white text-[10px] tracking-widest font-bold px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: MASTER_COLORS.p1 }}>
                        <div className="w-2 h-2 rounded-full bg-white/60"></div>
                        START · Oggi
                    </div>
                </div>
            )}

            <VConnector color={MASTER_COLORS.p1} height={40} visible={s(1)} />

            {/* STEP 2: FASE 1 CARD */}
            {s(2) && (
                <div 
                    className="bg-white border border-gray-200 border-l-4 rounded-xl rounded-l-none p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group animate-fadeIn" 
                    style={{ borderLeftColor: MASTER_COLORS.p1 }}
                    onClick={() => onSelectPhase(1)} 
                >
                    <div className="flex items-center gap-3 mb-4">
                        <Badge color={MASTER_COLORS.p1}>FASE 1 (A)</Badge>
                        <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">0 → 12 mesi</span>
                    </div>
                    <div className="text-2xl font-bold mb-3" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>
                        Road to Excellence
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 max-w-xl">
                        Un ecosistema D2C moderno, ricco e interattivo che valorizza i punti di forza e sistema le falle attuali — costruendo una macchina di conversione solida su fondamenta sane.
                    </p>
                    
                    {/* ZONA TARGET & BREAKDOWN ALBERO */}
                    <div className="flex flex-col gap-5 mt-8 relative">
                        <div className="flex items-center justify-between relative z-20">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Evita di entrare nello scenario
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
                                Entra nello Scenario <ChevronRight size={16}/>
                            </div>
                        </div>

                        {/* ALBERO INTERATTIVO (Espandibile) */}
                        {showPhase1Tree && (
                            <div 
                                className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 flex flex-col gap-3 animate-fadeIn relative z-10"
                                onClick={(e) => e.stopPropagation()} // Cliccare l'albero non fa entrare nello scenario
                            >
                                {PHASE_1_BREAKDOWN.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-3 relative group/item">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-px bg-gray-200"></div>
                                            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: item.color }}>
                                                {item.area}
                                            </span>
                                            <span className="text-sm font-medium text-gray-700">{item.title}</span>
                                        </div>
                                        <div 
                                            className="relative flex items-center ml-2 flex-shrink-0"
                                            onMouseEnter={() => setActiveTooltip(item.id)}
                                            onMouseLeave={() => setActiveTooltip(null)}
                                        >
                                            <Info size={14} className="text-gray-400 hover:text-slate-800 cursor-help transition-colors" />
                                            
                                            {/* TOOLTIP OVERLAY - Posizionato a sinistra per evitare sovrapposizioni */}
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
                        )}
                    </div>
                </div>
            )}

            <VConnector color={MASTER_COLORS.p1} height={52} visible={s(2)} />

            {s(3) && (
                <div className="flex items-center gap-4 animate-fadeIn">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <div className="text-white text-[10px] tracking-[2.5px] font-bold px-5 py-2 rounded shadow-md" style={{ backgroundColor: MASTER_COLORS.gold }}>
                        SCELTA STRATEGICA — FASE 2
                    </div>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            )}

            {s(3) && (
                <p className="text-sm font-medium text-gray-500 leading-relaxed text-center max-w-lg mx-auto mt-6 mb-8 animate-fadeIn" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                    A quel punto si apre una scelta strategica. La strada per continuare a crescere segue la direttrice della <strong className="text-gray-800 font-bold">conversione assistita</strong>, declinabile in due modi distinti.
                </p>
            )}

            <div className={`flex transition-all duration-700 ${s(4) ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-0.5 rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.push, height: s(4) ? 32 : 0 }}></div>
                    <div className="h-0.5 self-end rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.push, width: s(4) ? '50%' : 0 }}></div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-0.5 rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.pull, height: s(4) ? 32 : 0 }}></div>
                    <div className="h-0.5 self-start rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.pull, width: s(4) ? '50%' : 0 }}></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                {s(5) ? (
                    <div 
                        className="bg-white border border-gray-200 border-t-4 rounded-xl rounded-t-none p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col group animate-fadeIn" 
                        style={{ borderTopColor: MASTER_COLORS.push }}
                        onClick={() => onSelectPhase(2)} 
                    >
                        <div className="mb-4"><Badge color={MASTER_COLORS.push}>FASE 2A · PUSH (C)</Badge></div>
                        <div className="text-xl font-bold mb-3" style={{ color: MASTER_COLORS.push, fontFamily: "'Cormorant Garamond', serif" }}>AI Conversazionale</div>
                        <p className="text-xs font-medium text-gray-600 leading-relaxed mb-5 flex-grow">
                            Suggerimento diretto, personalizzazione e AI conversazionale con focus fortemente transazionale su conversion rate e AOV.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["Conversion Rate ↑", "AOV ↑", "AI Sommelier"].map(t => (
                                <Tag key={t} color={MASTER_COLORS.push} bg={`${MASTER_COLORS.push}15`}>{t}</Tag>
                            ))}
                        </div>
                        <div className="text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto" style={{ color: MASTER_COLORS.push }}>
                            Esplora Scenario Push <ChevronRight size={14}/>
                        </div>
                    </div>
                ) : <div></div>}

                {s(6) && (
                    <div 
                        className="bg-white border border-gray-200 border-t-4 rounded-xl rounded-t-none p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer flex flex-col group animate-fadeIn" 
                        style={{ borderTopColor: MASTER_COLORS.pull }}
                        onClick={() => onSelectPhase(3)} 
                    >
                        <div className="mb-4"><Badge color={MASTER_COLORS.pull}>FASE 2B · PULL (B)</Badge></div>
                        <div className="text-xl font-bold mb-3" style={{ color: MASTER_COLORS.pull, fontFamily: "'Cormorant Garamond', serif" }}>Contenuto Editoriale</div>
                        <p className="text-xs font-medium text-gray-600 leading-relaxed mb-5 flex-grow">
                            Suggerimento indiretto attraverso contenuto autorevole, capace di intercettare domanda latente e costruire relazione nel tempo.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {["Brand equity ↑", "Retention ↑", "Piattaforma editoriale"].map(t => (
                                <Tag key={t} color={MASTER_COLORS.pull} bg={`${MASTER_COLORS.pull}15`}>{t}</Tag>
                            ))}
                        </div>
                        <div className="text-xs font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-auto" style={{ color: MASTER_COLORS.pull }}>
                            Esplora Scenario Pull <ChevronRight size={14}/>
                        </div>
                    </div>
                )}
            </div>

            {s(7) && (
                <div className="mt-16 animate-fadeIn">
                    <div className="text-[10px] tracking-[3px] uppercase text-gray-400 text-center font-bold mb-6">
                        Sintesi comparativa
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 shadow-sm rounded-xl overflow-hidden border border-gray-200">
                        {[
                        { label: "Fondamenta comuni", color: MASTER_COLORS.p1, items: ["Ecosistema D2C moderno", "Conversione ottimizzata", "Macchina da 1M in 12 mesi"] },
                        { label: "Traiettoria Push", color: MASTER_COLORS.push, items: ["AI conversazionale", "Personalizzazione real-time", "Focus transazionale"] },
                        { label: "Traiettoria Pull", color: MASTER_COLORS.pull, items: ["Patrimonio culturale brand", "Intercetta domanda latente", "Costruisce relazione"] }
                        ].map((col, idx) => (
                            <div key={col.label} className={`bg-white p-6 border-t-4 ${idx > 0 ? 'border-l border-gray-100' : ''}`} style={{ borderTopColor: col.color }}>
                                <div className="text-[10px] tracking-[2px] uppercase font-bold mb-5" style={{ color: col.color }}>{col.label}</div>
                                <div className="space-y-3">
                                    {col.items.map(item => (
                                        <div key={item} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: col.color }}></div>
                                            <span className="text-xs font-medium text-gray-600 leading-snug">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-sm italic text-gray-500 text-center max-w-md mx-auto mt-12 mb-8 leading-relaxed font-serif" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        "La decisione sulla traiettoria sarà loro, sulla base dell'ambizione che vorranno esprimere."
                    </p>

                    <div className="text-center">
                        <button 
                            onClick={run} 
                            className="text-[10px] tracking-widest uppercase font-bold text-gray-400 border border-gray-200 px-6 py-2.5 rounded hover:text-yellow-600 hover:border-yellow-600 transition-colors"
                        >
                            ↺ Rivedi animazione
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
