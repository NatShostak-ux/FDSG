import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, LogOut, ArrowLeft, Search, X, ChevronRight } from 'lucide-react';
import Button from './components/ui/Button';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AreaEditor from './components/AreaEditor';
import AdvancedEditor from './components/AdvancedEditor';
import MasterRoadmapView from './components/MasterRoadmapView'; 
import CompareAreas from './components/CompareAreas'; 
import { ARAD_BLUE, ARAD_GOLD, INITIAL_SCENARIOS, EMPTY_AREA_DATA, EXPERTISE_AREAS } from './utils/constants';
import { auth, db, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import Login from './components/Login';

function App() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditor, setIsEditor] = useState(false);
  
  const [appMode, setAppMode] = useState('master'); 

  // Stati per la Ricerca Globale e Deep Linking
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchFocusItem, setSearchFocusItem] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsEditor(currentUser?.email?.endsWith('@arad.digital') || false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "strategy", "hub");
    
    const initDoc = async () => {
      try {
        const snap = await getDoc(docRef);
        if (!snap.exists()) await setDoc(docRef, { scenarios: INITIAL_SCENARIOS });
      } catch (err) { console.error("Init err:", err); }
    };
    initDoc();

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const loadedScenarios = docSnap.data().scenarios || [];
        setScenarios(loadedScenarios);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const handleSelectPhase = (phaseId) => {
    if (scenarios.length < 3) return; 

    let targetScenarioId = null;
    if (phaseId === 1) targetScenarioId = scenarios[2]?.id;
    if (phaseId === 2) targetScenarioId = scenarios[1]?.id;
    if (phaseId === 3) targetScenarioId = scenarios[0]?.id;

    if (targetScenarioId) {
        setActiveScenarioId(targetScenarioId);
        setActiveView('dashboard'); 
        setAppMode('scenario'); 
        window.scrollTo(0, 0);
    }
  };

  const handleBackToMaster = () => {
      setAppMode('master');
      window.scrollTo(0, 0);
  };

  const searchResults = useMemo(() => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const q = searchQuery.toLowerCase();
      const results = [];

      const decodeHTML = (html) => {
          const txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;
      };

      (scenarios || []).forEach(scenario => {
          Object.entries(scenario.data || {}).forEach(([areaId, areaData]) => {
              const areaDef = EXPERTISE_AREAS.find(a => a.id === areaId);
              const areaLabel = areaDef ? areaDef.label : areaId;
              const pathStr = `${scenario.title || 'Scenario'} > ${areaLabel}`;

              const addResult = (type, text, details = '', itemType, itemId = null) => {
                  const cleanText = decodeHTML(text);
                  const cleanDetails = decodeHTML(details);
                  results.push({ id: Math.random().toString(), scenarioId: scenario.id, areaId, type, text: cleanText, details: cleanDetails, pathStr, areaColor: areaDef?.hex || '#999', itemType, itemId });
              };

              if (areaData.objectives?.toLowerCase().includes(q)) addResult('Obiettivo', areaData.objectives.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...', '', 'objective');
              
              [1, 2, 3].forEach(y => {
                  if (areaData[`evolution_y${y}`]?.toLowerCase().includes(q)) addResult(`Phasing Anno ${y}`, areaData[`evolution_y${y}`].replace(/<[^>]*>?/gm, '').substring(0, 100) + '...', '', 'phasing', y);
              });

              (Array.isArray(areaData.projects) ? areaData.projects : []).forEach(p => {
                  if (p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
                      addResult('Progetto', p.title || 'Senza Titolo', p.description?.replace(/<[^>]*>?/gm, '').substring(0, 60), 'project', p.id);
                  }
              });

              (Array.isArray(areaData.ksms) ? areaData.ksms : []).forEach(k => {
                  if (k.name?.toLowerCase().includes(q) || k.description?.toLowerCase().includes(q)) {
                      addResult('Metrica (KSM)', k.name || 'Metrica', k.targetValue ? `Target: ${k.targetValue}` : '', 'ksm', k.id);
                  }
              });

              (Array.isArray(areaData.routine) ? areaData.routine : []).forEach(r => {
                  if (r.text?.toLowerCase().includes(q)) addResult('Task Day-by-Day', r.text, '', 'routine', r.id);
              });
          });
      });
      return results;
  }, [searchQuery, scenarios]);

  const handleResultClick = (res) => {
      setActiveScenarioId(res.scenarioId);
      setActiveView(res.areaId);
      setSearchFocusItem({ type: res.itemType, id: res.itemId });
      setSearchQuery('');
      setIsSearchFocused(false);
      // Non facciamo window.scrollTo(0,0) qui perché vogliamo che l'AreaEditor faccia lo scroll all'elemento
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Caricamento in corso...</div>;
  if (!user) return <Login />;

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0] || { title: '', description: '', data: {} };

  const persistScenarios = async (newScenarios) => {
    if (!isEditor) return;
    try { await setDoc(doc(db, "strategy", "hub"), { scenarios: newScenarios, lastUpdated: new Date().toISOString(), updatedBy: user.email }); } catch (e) {}
  };

  const updateScenarioMeta = (key, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const updated = prev.map(s => s.id === activeScenarioId ? { ...s, [key]: value } : s);
      persistScenarios(updated); return updated;
    });
  };

  const updateAreaData = (areaId, field, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      const updatedScenario = { ...scenario, data: { ...scenario.data, [areaId]: { ...areaData, [field]: value } } };
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated); return updated;
    });
  };

  const handleUpdateProject = (areaId, projectId, field, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      const currentProjects = Array.isArray(areaData.projects) ? areaData.projects : [];
      const updatedProjects = currentProjects.map(p => p.id === projectId ? { ...p, [field]: value } : p);
      const updatedScenario = { ...scenario, data: { ...scenario.data, [areaId]: { ...areaData, projects: updatedProjects } } };
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated); return updated;
    });
  };

  const handleBatchUpdateProject = (areaId, projectIdOrArray, updatedDates) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      let finalProjects = Array.isArray(projectIdOrArray) ? projectIdOrArray : (Array.isArray(areaData.projects) ? areaData.projects : []).map(p => p.id === projectIdOrArray ? { ...p, ...updatedDates } : p);
      const updatedScenario = { ...scenario, data: { ...scenario.data, [areaId]: { ...areaData, projects: finalProjects } } };
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated); return updated;
    });
  };

  const updateKSM = (areaId, ksmId, field, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      const updatedKSMs = (Array.isArray(areaData.ksms) ? areaData.ksms : []).map(k => k.id === ksmId ? { ...k, [field]: value } : k);
      const updatedScenario = { ...scenario, data: { ...scenario.data, [areaId]: { ...areaData, ksms: updatedKSMs } } };
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated); return updated;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/arad-logo.png" alt="ARAD Digital" className="h-10 w-auto object-contain" />
            <div className="h-6 w-px bg-gray-300"></div>
            
            {appMode === 'scenario' ? (
                <button 
                    onClick={handleBackToMaster} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                >
                    <ArrowLeft size={18} /> Torna alla Roadmap Strategica
                </button>
            ) : (
                <span className="text-lg font-bold text-gray-900 leading-tight">Feudi di San Gregorio</span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user.email}</span>
              <span className={`text-xs font-bold uppercase ${isEditor ? 'text-blue-600' : 'text-gray-400'}`}>{isEditor ? 'Editor' : 'Viewer'}</span>
            </div>
            
            <button onClick={() => logout()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-red-600 rounded-lg transition-colors">
              <LogOut size={18} /><span>Esci</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8 bg-slate-50">
        
        <div className={appMode === 'master' ? 'block' : 'hidden'}>
            <MasterRoadmapView onSelectPhase={handleSelectPhase} />
        </div>

        {appMode === 'scenario' && (
            <div className="animate-fadeIn">
                <div className="mb-8">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
                        
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 border-b border-gray-100 pb-4 relative z-50">
                            
                            <div className="flex items-center gap-6 flex-grow">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block whitespace-nowrap">Scenario in visione</span>
                                
                                <div className="relative flex-grow max-w-md hidden md:block">
                                    <div className={`flex items-center bg-slate-50 rounded-lg transition-all border ${isSearchFocused ? 'ring-2 ring-blue-100 border-blue-300 bg-white' : 'border-gray-200'}`}>
                                        <Search size={16} className="text-gray-400 ml-3 flex-shrink-0" />
                                        <input 
                                            type="text" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onFocus={() => setIsSearchFocused(true)}
                                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                            placeholder="Cerca progetti, metriche, obiettivi..."
                                            className="w-full bg-transparent border-0 py-2 px-3 text-gray-700 placeholder-gray-400 focus:ring-0 text-sm font-medium"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="pr-3 text-gray-400 hover:text-gray-600"><X size={14}/></button>
                                        )}
                                    </div>

                                    {isSearchFocused && searchQuery.length >= 2 && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full md:w-[500px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto z-[100]">
                                            {searchResults.length === 0 ? (
                                                <div className="p-8 text-center text-gray-500 font-medium">Nessun risultato trovato per "{searchQuery}"</div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold tracking-widest uppercase text-gray-500 border-b border-gray-100">
                                                        {searchResults.length} Risultati trovati
                                                    </div>
                                                    {searchResults.map((res, idx) => (
                                                        <div key={idx} onMouseDown={() => handleResultClick(res)} className="p-4 border-b border-gray-50 hover:bg-slate-50 cursor-pointer transition-colors group">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: res.areaColor }}>{res.type}</span>
                                                                <span className="text-[10px] font-bold text-gray-500 tracking-wider flex items-center gap-1">{res.pathStr} <ChevronRight size={12}/></span>
                                                            </div>
                                                            <div className="font-medium text-sm text-slate-800 group-hover:text-blue-900 transition-colors">{res.text}</div>
                                                            {res.details && <div className="text-xs font-medium text-slate-500 mt-1 truncate">{res.details}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto w-full xl:w-auto flex-nowrap">
                                {[...scenarios].reverse().map((s) => {
                                    const isActive = s.id === activeScenarioId;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setActiveScenarioId(s.id);
                                                setSearchFocusItem(null); // RESET FOCUS AL CAMBIO SCENARIO
                                            }}
                                            className={`px-4 py-2 text-[11px] font-bold tracking-wider uppercase rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                                                isActive 
                                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' 
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                            }`}
                                            title={s.title}
                                        >
                                            {s.title || 'Nuovo Scenario'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <input type="text" value={activeScenario?.title || ''} onChange={(e) => updateScenarioMeta('title', e.target.value)} disabled={!isEditor} className="w-full text-2xl font-bold text-gray-900 border-0 focus:ring-0 px-0 bg-transparent mb-1" placeholder="Titolo Scenario" />
                        <AdvancedEditor value={activeScenario?.description || ''} onChange={(val) => updateScenarioMeta('description', val)} placeholder="Aggiungi una descrizione strategica per questo scenario..." disabled={!isEditor} />
                    </div>
                </div>

                <div className="flex gap-6 items-start relative">
                    <Sidebar 
                        activeView={activeView} 
                        setActiveView={(view) => {
                            setActiveView(view);
                            setSearchFocusItem(null); // RESET FOCUS QUANDO SI NAVIGA DALLA SIDEBAR
                        }} 
                        isSidebarOpen={isSidebarOpen} 
                        setIsSidebarOpen={setIsSidebarOpen} 
                        activeScenario={activeScenario} 
                    />
                    
                    <div className="flex-grow min-w-0 transition-all duration-300">
                        {activeView === 'dashboard' ? (
                            <Dashboard 
                                activeScenario={activeScenario} 
                                setActiveView={setActiveView} 
                                updateProjectBatch={handleBatchUpdateProject} 
                                setSearchFocusItem={setSearchFocusItem}
                            />
                        ) : activeView === 'compare' ? (
                            <CompareAreas 
                                activeScenario={activeScenario} 
                                setActiveView={setActiveView} 
                                setSearchFocusItem={setSearchFocusItem} 
                            />
                        ) : (
                            <AreaEditor
                                activeView={activeView} 
                                activeScenario={activeScenario} 
                                updateAreaData={updateAreaData}
                                updateProject={handleUpdateProject} 
                                updateProjectBatch={handleBatchUpdateProject}
                                updateKSM={updateKSM} 
                                isEditor={isEditor} 
                                searchFocusItem={searchFocusItem}
                                onFocusHandled={() => setSearchFocusItem(null)} // NUOVA CALLBACK PER RESETTARE IL FOCUS
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;
