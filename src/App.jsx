import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import Button from './components/ui/Button';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AreaEditor from './components/AreaEditor';
import { ARAD_BLUE, ARAD_GOLD, INITIAL_SCENARIOS, EMPTY_AREA_DATA } from './utils/constants';

function App() {
  const [scenarios, setScenarios] = useState(INITIAL_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState(1);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  const getAreaData = (areaId) => activeScenario.data[areaId] || { ...EMPTY_AREA_DATA };

  const updateScenarioMeta = (key, value) => {
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? { ...s, [key]: value } : s));
  };

  const handleAddScenario = () => {
    const newId = Date.now();
    setScenarios([...scenarios, {
      id: newId,
      title: 'Nuovo Scenario',
      description: 'Descrizione dello scenario...',
      data: {}
    }]);
    setActiveScenarioId(newId);
  };

  const handleDeleteScenario = (id) => {
    if (scenarios.length <= 1) {
      alert("Impossibile eliminare l'ultimo scenario.");
      return;
    }
    const filtered = scenarios.filter(s => s.id !== id);
    setScenarios(filtered);
    if (activeScenarioId === id) setActiveScenarioId(filtered[0].id);
  };

  const updateAreaData = (areaId, field, value) => {
    const currentData = getAreaData(areaId);
    const newData = { ...currentData, [field]: value };
    setScenarios(scenarios.map(s => {
      if (s.id === activeScenarioId) {
        return { ...s, data: { ...s.data, [areaId]: newData } };
      }
      return s;
    }));
  };

  const handleUpdateProject = (areaId, projectId, field, value) => {
    const areaData = getAreaData(areaId);
    const currentProjects = areaData.projects || [];
    const newProjects = currentProjects.map(p =>
      p.id === projectId ? { ...p, [field]: value } : p
    );
    updateAreaData(areaId, 'projects', newProjects);
  };

  // This helper is for Gantt chart drag and drop which sends { start, end }
  const handleBatchUpdateProject = (areaId, projectId, updates) => {
    const areaData = activeScenario.data[areaId] || { ...EMPTY_AREA_DATA };
    const newProjects = areaData.projects.map(p =>
      p.id === projectId ? { ...p, ...updates } : p
    );

    const newData = { ...areaData, projects: newProjects };

    setScenarios(scenarios.map(s => {
      if (s.id === activeScenarioId) {
        return { ...s, data: { ...s.data, [areaId]: newData } };
      }
      return s;
    }));
  };

  const updateKSM = (areaId, ksmId, field, value) => {
    const currentData = getAreaData(areaId);
    const newKSMs = (currentData.ksms || []).map(k =>
      k.id === ksmId ? { ...k, [field]: value } : k
    );
    updateAreaData(areaId, 'ksms', newKSMs);
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
              <span className="text-xs font-medium text-gray-500">Strategy Hub | {activeScenario.title}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" icon={Save} onClick={() => alert("Salvataggio simulato!")}>Salva</Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-8">

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
            <button
              onClick={handleAddScenario}
              className="flex items-center justify-center px-3 py-2 text-sm text-gray-400 hover:text-gray-700 bg-white border border-dashed border-gray-300 rounded-lg flex-shrink-0"
              title="Aggiungi Scenario"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group transition-all hover:border-gray-300">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDeleteScenario(activeScenarioId)}
                className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Elimina Scenario Corrente"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <input
              type="text"
              value={activeScenario.title}
              onChange={(e) => updateScenarioMeta('title', e.target.value)}
              className="w-full text-2xl font-bold text-gray-900 border-0 border-b border-transparent hover:border-gray-200 focus:ring-0 px-0 bg-transparent transition-colors mb-1 placeholder-gray-300"
              style={{ fontFamily: 'Outfit, sans-serif' }}
              placeholder="Titolo Scenario"
            />
            <textarea
              value={activeScenario.description}
              onChange={(e) => updateScenarioMeta('description', e.target.value)}
              rows={1}
              className="w-full text-gray-600 border-0 bg-transparent p-0 focus:ring-0 resize-none placeholder-gray-400"
              placeholder="Aggiungi una descrizione..."
            />
          </div>
        </div>

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
              />
            ) : (
              <AreaEditor
                activeView={activeView}
                activeScenario={activeScenario}
                updateAreaData={updateAreaData}
                updateProject={handleUpdateProject}
                updateKSM={updateKSM}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
