import React, { useState, useEffect } from 'react';
import { Plus, Trash2, LogOut, Download, Table, RefreshCw } from 'lucide-react';
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsEditor(currentUser.email?.endsWith('@arad.digital'));
      } else {
        setIsEditor(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) return;

    console.log("Starting Firestore sync for user:", user.email);
    const docRef = doc(db, "strategy", "hub");

    const initDoc = async () => {
      try {
        const snap = await getDoc(docRef);
        console.log("Initial fetch - Doc exists:", snap.exists());
        if (!snap.exists()) {
          console.log("Document missing, creating initial data...");
          await setDoc(docRef, { scenarios: INITIAL_SCENARIOS });
        }
      } catch (err) {
        console.error("Initialization check failed (likely rules):", err);
      }
    };
    initDoc();

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const loadedScenarios = data.scenarios || [];
        console.log("Sync: loaded", loadedScenarios.length, "scenarios");
        setScenarios(loadedScenarios);
        if (loadedScenarios.length > 0) {
          setActiveScenarioId(prevId => prevId || loadedScenarios[0].id);
        }
      } else {
        console.log("Sync: Doc doesn't exist");
        setScenarios([]);
      }
      setLoading(false); // Only stop loading after first snapshot attempt
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Debug scenarios state
  useEffect(() => {
    console.log("Current scenarios in state:", scenarios.length);
  }, [scenarios]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">Caricamento in corso...</div>;
  if (!user) return <Login />;

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0] || { title: '', description: '', data: {} };
  const getAreaData = (areaId) => activeScenario.data[areaId] || { ...EMPTY_AREA_DATA };

  const persistScenarios = async (newScenarios) => {
    if (!isEditor) return;
    try {
      // Local Backup
      localStorage.setItem('fdsg_backup', JSON.stringify({
        timestamp: new Date().toISOString(),
        scenarios: newScenarios
      }));

      // 2. Cloud Persistence (Collaboration)
      console.log("Saving to Firestore...", newScenarios.length, "scenarios");
      await setDoc(doc(db, "strategy", "hub"), {
        scenarios: newScenarios,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.email
      });
      console.log("Firestore save successful!");
    } catch (e) {
      console.error("Persistence Error:", e);
    }
  };

  const updateScenarioMeta = (key, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const updated = prev.map(s => s.id === activeScenarioId ? { ...s, [key]: value } : s);
      persistScenarios(updated);
      return updated;
    });
  };

  const handleAddScenario = () => {
    if (!isEditor) return;
    const newId = Date.now();
    setScenarios(prev => {
      const updated = [...prev, {
        id: newId,
        title: 'Nuovo Scenario',
        description: 'Descrizione dello scenario...',
        data: {}
      }];
      persistScenarios(updated);
      return updated;
    });
    setActiveScenarioId(newId);
  };

  const handleDeleteScenario = (id) => {
    if (!isEditor) return;
    setScenarios(prev => {
      if (prev.length <= 1) {
        alert("Impossibile eliminare l'ultimo scenario.");
        return prev;
      }
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
      const updatedScenario = {
        ...scenario,
        data: { ...scenario.data, [areaId]: { ...areaData, [field]: value } }
      };

      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated);
      return updated;
    });
  };

  const handleUpdateProject = (areaId, projectId, field, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      const updatedProjects = (areaData.projects || []).map(p =>
        p.id === projectId ? { ...p, [field]: value } : p
      );
      const updatedScenario = {
        ...scenario,
        data: { ...scenario.data, [areaId]: { ...areaData, projects: updatedProjects } }
      };
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated);
      return updated;
    });
  };

  const handleBatchUpdateProject = (areaId, updatedProjects) => {
    if (!isEditor) return;
    
    // Versione flessibile: estrae l'array anche se è dentro un oggetto
    const projectsArray = Array.isArray(updatedProjects) 
      ? updatedProjects 
      : (updatedProjects?.projects || []);

    if (projectsArray.length === 0 && !Array.isArray(updatedProjects)) {
      console.warn("Dati Gantt non validi o vuoti:", updatedProjects);
      return;
    }

    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      
      const updatedScenario = {
        ...scenario,
        data: { 
          ...scenario.data, 
          [areaId]: { 
            ...areaData, 
            projects: projectsArray 
          } 
        }
      };
      
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated);
      return updated;
    });
  };

  const updateKSM = (areaId, ksmId, field, value) => {
    if (!isEditor) return;
    setScenarios(prev => {
      const scenario = prev.find(s => s.id === activeScenarioId);
      if (!scenario) return prev;
      const areaData = scenario.data[areaId] || { ...EMPTY_AREA_DATA };
      const updatedKSMs = (areaData.ksms || []).map(k =>
        k.id === ksmId ? { ...k, [field]: value } : k
      );
      const updatedScenario = {
        ...scenario,
        data: { ...scenario.data, [areaId]: { ...areaData, ksms: updatedKSMs } }
      };
      const updated = prev.map(s => s.id === activeScenarioId ? updatedScenario : s);
      persistScenarios(updated);
      return updated;
    });
  };

  const handleRestoreDefaults = async () => {
    if (!isEditor) return;
    if (window.confirm("Attenzione: questo sovrascriverà tutti i dati con quelli predefiniti. Procedere?")) {
      await persistScenarios(INITIAL_SCENARIOS);
      alert("Inizializzazione completata!");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(scenarios, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fdsg_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExportCSV = () => {
    // Flattening scenarios for CSV
    const rows = [
      ['Scenario', 'Area', 'Importance', 'Budget', 'Objectives', 'Projects', 'KSMs']
    ];

    scenarios.forEach(s => {
      EXPERTISE_AREAS.forEach(area => {
        const areaData = s.data[area.id] || { ...EMPTY_AREA_DATA };
        const projectTitles = (areaData.projects || []).map(p => p.title).join('; ');
        const ksmNames = (areaData.ksms || []).map(k => k.name).join('; ');

        rows.push([
          s.title,
          area.label,
          areaData.importance,
          areaData.budget,
          (areaData.objectives || '').replace(/"/g, '""'),
          projectTitles.replace(/"/g, '""'),
          ksmNames.replace(/"/g, '""')
        ]);
      });
    });

    const csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fdsg_experts_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold tracking-tight" style={{ color: ARAD_BLUE }}>ARAD <span style={{ color: ARAD_GOLD }}>Digital</span></span>
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight">Feudi di San Gregorio</span>
              <span className="text-xs font-medium text-gray-500">Strategy Hub | {activeScenario?.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900 leading-tight">{user.displayName || user.email}</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${isEditor ? 'text-blue-600' : 'text-gray-400'}`}>
                {isEditor ? 'Editor' : 'Viewer'}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            <div className="flex items-center gap-3">
              {isEditor && !import.meta.env.PROD && (
                <button
                  onClick={async () => {
                    const btn = document.getElementById('sync-btn');
                    btn.classList.add('animate-spin');
                    try {
                      const res = await fetch('http://localhost:3000/api/sync', { method: 'POST' });
                      const data = await res.json();
                      if (data.status === 'success') alert('Sincronizzazione Cloud completata!');
                      else alert('Errore: ' + data.error);
                    } catch (e) {
                      alert('Assicurati che il server locale sia attivo.');
                    } finally {
                      btn.classList.remove('animate-spin');
                    }
                  }}
                  className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                  title="Sincronizza NotebookLM con il Cloud"
                >
                  <RefreshCw id="sync-btn" size={20} />
                </button>
              )}
              <button
                onClick={handleExportCSV}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                title="Esporta per Excel (CSV)"
              >
                <Table size={20} />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                title="Esporta Backup JSON"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut size={18} />
                <span>Esci</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {scenarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-6 font-medium">Nessun dato trovato nel database.</p>
            {isEditor ? (
              <Button onClick={handleRestoreDefaults}>
                Carica Dati di Esempio (Inizializza)
              </Button>
            ) : (
              <p className="text-sm text-gray-400">Contatta un amministratore per inizializzare la strategia.</p>
            )}
          </div>
        ) : (
          <div className="mb-8 no-print">
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2">
              {scenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveScenarioId(scenario.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium text-sm border flex-shrink-0 transition-all ${activeScenarioId === scenario.id
                    ? 'shadow-md text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  style={activeScenarioId === scenario.id ? { backgroundColor: ARAD_BLUE, borderColor: ARAD_BLUE } : {}}
                >
                  {scenario.title}
                </button>
              ))}
              {isEditor && (
                <button
                  onClick={handleAddScenario}
                  className="flex items-center justify-center px-3 py-2 text-sm text-gray-400 hover:text-gray-700 bg-white border border-dashed border-gray-300 rounded-lg flex-shrink-0"
                  title="Aggiungi Scenario"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group transition-all hover:border-gray-300">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {isEditor && (
                  <button
                    onClick={() => handleDeleteScenario(activeScenarioId)}
                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Elimina Scenario Corrente"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={activeScenario?.title || ''}
                onChange={(e) => updateScenarioMeta('title', e.target.value)}
                disabled={!isEditor}
                className={`w-full text-2xl font-bold text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:ring-0 px-0 bg-transparent transition-colors mb-1 placeholder-gray-300 ${!isEditor ? 'cursor-not-allowed' : ''}`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
                placeholder="Titolo Scenario"
              />
              <div className="relative group">
                <AdvancedEditor
                  value={activeScenario?.description || ''}
                  onChange={(val) => updateScenarioMeta('description', val)}
                  placeholder="Aggiungi una descrizione..."
                  disabled={!isEditor}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-6 items-start relative">
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            activeScenario={activeScenario}
          />

          <div className="flex-grow min-w-0 print-full transition-all duration-300">
            {activeView === 'dashboard' ? (
              <Dashboard
                activeScenario={activeScenario}
                setActiveView={setActiveView}
                updateProjectBatch={handleBatchUpdateProject}
                isEditor={isEditor}
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
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
