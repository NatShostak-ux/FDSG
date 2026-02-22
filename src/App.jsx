import React, { useState, useEffect } from 'react';
import { Plus, Trash2, LogOut } from 'lucide-react';
import Button from './components/ui/Button';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AreaEditor from './components/AreaEditor';
import AdvancedEditor from './components/AdvancedEditor';
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
        if (loadedScenarios.length > 0 && !activeScenarioId) setActiveScenarioId(loadedScenarios[0].id);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

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

  const handleAddScenario = () => {
    if (!isEditor) return;
    const newId = Date.now();
    setScenarios(prev => {
      const updated = [...prev, { id: newId, title: 'Nuovo Scenario', description: '', data: {} }];
      persistScenarios(updated); return updated;
    });
    setActiveScenarioId(newId);
  };

  const handleDeleteScenario = (id) => {
    if (!isEditor) return;
    setScenarios(prev => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter(s => s.id !== id);
      persistScenarios(filtered);
      if (activeScenarioId === id) setActiveScenarioId(filtered[0].id);
      return filtered;
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
            <span className="text-2xl font-bold tracking-tight" style={{ color: ARAD_BLUE }}>ARAD <span style={{ color: ARAD_GOLD }}>Digital</span></span>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight">Feudi di San Gregorio</span>
              <span className="text-xs font-medium text-gray-500">Strategy Hub | {activeScenario?.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user.email}</span>
              <span className={`text-xs font-bold uppercase ${isEditor ? 'text-blue-600' : 'text-gray-400'}`}>{isEditor ? 'Editor' : 'Viewer'}</span>
            </div>
            
            <button onClick={() => logout()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-red-600 rounded-lg">
              <LogOut size={18} /><span>Esci</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8 bg-slate-50">
        {scenarios.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-4">
              {scenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenarioId(scenario.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm border ${activeScenarioId === scenario.id ? 'text-white' : 'bg-white text-gray-600 border-gray-200'}`}
                  style={activeScenarioId === scenario.id ? { backgroundColor: ARAD_BLUE, borderColor: ARAD_BLUE } : {}}
                >
                  {scenario.title}
                </button>
              ))}
              {isEditor && <button onClick={handleAddScenario} className="px-3 py-2 text-gray-400 bg-white border border-dashed border-gray-300 rounded-lg"><Plus size={16} /></button>}
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100">
                {isEditor && <button onClick={() => handleDeleteScenario(activeScenarioId)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>}
              </div>
              <input type="text" value={activeScenario?.title || ''} onChange={(e) => updateScenarioMeta('title', e.target.value)} disabled={!isEditor} className="w-full text-2xl font-bold text-gray-900 border-0 focus:ring-0 px-0 bg-transparent mb-1" placeholder="Titolo Scenario" />
              <AdvancedEditor value={activeScenario?.description || ''} onChange={(val) => updateScenarioMeta('description', val)} placeholder="Aggiungi una descrizione..." disabled={!isEditor} />
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start relative">
          <Sidebar activeView={activeView} setActiveView={setActiveView} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} activeScenario={activeScenario} />
          
          <div className="flex-grow min-w-0 transition-all duration-300">
            {activeView === 'dashboard' ? (
              <Dashboard activeScenario={activeScenario} setActiveView={setActiveView} updateProjectBatch={handleBatchUpdateProject} isEditor={isEditor} />
            ) : (
              <AreaEditor
                activeView={activeView} activeScenario={activeScenario} updateAreaData={updateAreaData}
                updateProject={handleUpdateProject} updateProjectBatch={handleBatchUpdateProject}
                updateKSM={updateKSM} isEditor={isEditor}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
