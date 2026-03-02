import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const MASTER_COLORS = {
  p1: '#0f172a', // Slate 900
  push: '#b91c1c', // Red 700
  pull: '#1d4ed8', // Blue 700
  gold: '#bf9000'  // Arad Gold
};

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

  const run = () => {
    setStep(0);
    const delays = [150, 800, 1500, 2100, 2700, 3300, 3900];
    delays.forEach((d, i) => setTimeout(() => setStep(i + 1), d));
  };

  useEffect(() => { run(); }, []);
  const s = (n) => step >= n;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      {/* HEADER */}
      <div className={`text-center mb-12 transition-all duration-1000 transform ${s(0) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="text-[10px] tracking-[4px] uppercase text-gray-400 mb-3 font-bold">
          Feudi di San Gregorio · D2C Strategy
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Roadmap Strategica
        </h1>
        <div className="w-12 h-1 mx-auto rounded-full" style={{ backgroundColor: MASTER_COLORS.gold }}></div>
      </div>

      {/* STEP 1: START NODE */}
      <div className={`flex justify-center transition-all duration-700 transform ${s(1) ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="flex items-center gap-2 text-white text-[10px] tracking-widest font-bold px-5 py-2 rounded-full shadow-md" style={{ backgroundColor: MASTER_COLORS.p1 }}>
          <div className="w-2 h-2 rounded-full bg-white/60"></div>
          START · Oggi
        </div>
      </div>

      <VConnector color={MASTER_COLORS.p1} height={40} visible={s(1)} />

      {/* STEP 2: FASE 1 CARD */}
      <div 
        className={`bg-white border border-gray-200 border-l-4 rounded-xl rounded-l-none p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-700 cursor-pointer group ${s(2) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        style={{ borderLeftColor: MASTER_COLORS.p1 }}
        onClick={() => onSelectPhase(1)} // ID 1 = Fase 1
      >
        <div className="flex items-center gap-3 mb-4">
          <Badge color={MASTER_COLORS.p1}>FASE 1</Badge>
          <span className="text-[11px] text-gray-400 font-bold tracking-wider uppercase">0 → 12 mesi</span>
        </div>
        <div className="text-2xl font-bold mb-3" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>
          Road to Excellence
        </div>
        <p className="text-sm font-medium text-gray-600 leading-relaxed mb-6 max-w-xl">
          Un ecosistema D2C moderno, ricco e interattivo che valorizza i punti di forza e sistema le falle attuali — costruendo una macchina di conversione solida su fondamenta sane.
        </p>
        <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border" style={{ backgroundColor: `${MASTER_COLORS.p1}10`, borderColor: `${MASTER_COLORS.p1}30` }}>
              <span className="text-2xl font-bold" style={{ color: MASTER_COLORS.p1, fontFamily: "'Cormorant Garamond', serif" }}>€ 1M</span>
              <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: MASTER_COLORS.p1 }}>target D2C in 12 mesi</span>
            </div>
            <div className="text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: MASTER_COLORS.p1 }}>
                Entra nello Scenario <ChevronRight size={16}/>
            </div>
        </div>
      </div>

      <VConnector color={MASTER_COLORS.p1} height={52} visible={s(2)} />

      {/* STEP 3: FORK BANNER */}
      <div className={`flex items-center gap-4 transition-all duration-700 transform ${s(3) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex-1 h-px bg-gray-200"></div>
        <div className="text-white text-[10px] tracking-[2.5px] font-bold px-5 py-2 rounded shadow-md" style={{ backgroundColor: MASTER_COLORS.gold }}>
          SCELTA STRATEGICA — FASE 2
        </div>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      <p className={`text-sm font-medium text-gray-500 leading-relaxed text-center max-w-lg mx-auto mt-6 mb-8 transition-all duration-700 delay-150 ${s(3) ? 'opacity-100' : 'opacity-0'}`}>
        A quel punto si apre una scelta strategica. La strada per continuare a crescere segue la direttrice della <strong className="text-gray-800 font-bold">conversione assistita</strong>, declinabile in due modi distinti.
      </p>

      {/* STEP 4: FORK ARMS */}
      <div className={`flex transition-all duration-700 ${s(4) ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-0.5 h-8 rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.push, height: s(4) ? 32 : 0 }}></div>
          <div className="h-0.5 self-end rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.push, width: s(4) ? '50%' : 0 }}></div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-0.5 h-8 rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.pull, height: s(4) ? 32 : 0 }}></div>
          <div className="h-0.5 self-start rounded-full transition-all duration-700" style={{ backgroundColor: MASTER_COLORS.pull, width: s(4) ? '50%' : 0 }}></div>
        </div>
      </div>

      {/* STEP 5 & 6: PUSH + PULL SIDE BY SIDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
        {/* PUSH CARD */}
        <div 
          className={`bg-white border border-gray-200 border-t-4 rounded-xl rounded-t-none p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-700 cursor-pointer flex flex-col group ${s(5) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ borderTopColor: MASTER_COLORS.push }}
          onClick={() => onSelectPhase(2)} // ID 2 = Fase 2A Push
        >
          <div className="mb-4"><Badge color={MASTER_COLORS.push}>FASE 2A · PUSH</Badge></div>
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

        {/* PULL CARD */}
        <div 
          className={`bg-white border border-gray-200 border-t-4 rounded-xl rounded-t-none p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-700 delay-150 cursor-pointer flex flex-col group ${s(6) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ borderTopColor: MASTER_COLORS.pull }}
          onClick={() => onSelectPhase(3)} // ID 3 = Fase 2B Pull
        >
          <div className="mb-4"><Badge color={MASTER_COLORS.pull}>FASE 2B · PULL</Badge></div>
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
      </div>

      {/* STEP 7: SUMMARY TABLE */}
      <div className={`mt-16 transition-all duration-1000 transform ${s(7) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
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
    </div>
  );
};

export default MasterRoadmapView;
