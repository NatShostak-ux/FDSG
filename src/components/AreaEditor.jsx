import React, { useState, useEffect } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, ShieldAlert, AlertTriangle, X, Sparkles, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import NotebookLMChat from './NotebookLMChat';
import AdvancedEditor from './AdvancedEditor';
import { ARAD_BLUE, ARAD_GOLD, GANTT_START_YEAR, GANTT_END_YEAR, EXPERTISE_AREAS, EMPTY_AREA_DATA } from '../utils/constants';

const AreaEditor = ({ activeView, activeScenario, updateAreaData, updateProject, updateProjectBatch, updateKSM, isEditor = false }) => {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    const area = EXPERTISE_AREAS.find(a => a.id === activeView);
    if (!area) return null;

    const data = activeScenario.data[activeView] || { ...EMPTY_AREA_DATA };
    const safeProjects = Array.isArray(data.projects) ? data.projects : [];
    const areaProjects = safeProjects.map(p => ({ ...p, areaId: area.id }));

    const areaBudgetMin = areaProjects.reduce((acc, p) => acc + (Number(p.budgetMin) || 0), 0);
    const areaBudgetMax = areaProjects.reduce((acc, p) => acc + (Number(p.budgetMax) || 0), 0);

    useEffect(() => {
        if (!selectedProjectId && areaProjects.length > 0) {
            setSelectedProjectId(areaProjects[0].id);
        }
    }, [activeView]);

    const addProject = () => {
        if (!isEditor) return;
        const newId = Date.now();
        const newProject = {
            id: newId,
            title: '',
            description: '',
            enablers: [""],
            start: `${GANTT_START_YEAR}-01`,
            end: `${GANTT_START_YEAR}-04`,
            impact: 5,
            effort: 5,
            budgetMin: 0,
            budgetMax: 0
        };
        const currentProjects = Array.isArray(data.projects) ? data.projects : [];
        updateAreaData(activeView, 'projects', [...currentProjects, newProject]);
        setSelectedProjectId(newId);
    };

    const removeProject = (projectId) => {
        if (!isEditor || !Array.isArray(data.projects)) return;
        const newProjects = data.projects.filter(p => p.id !== projectId);
        updateAreaData(activeView, 'projects', newProjects);
        if (selectedProjectId === projectId) {
            setSelectedProjectId(newProjects.length > 0 ? newProjects[0].id : null);
        }
    };

    // LOGICA KEY ENABLERS
    const handleEnablerKeyDown = (e, index, projectId, currentEnablers) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newEnablers = [...currentEnablers];
            newEnablers.splice(index + 1, 0, "");
            updateProject(activeView, projectId, 'enablers', newEnablers);
            setTimeout(() => {
                const inputs = document.querySelectorAll(`.enabler-input-${projectId}`);
                inputs[index + 1]?.focus();
            }, 10);
        } 
        else if (e.key === 'Backspace' && currentEnablers[index] === "" && currentEnablers.length > 1) {
            e.preventDefault();
            const newEnablers = currentEnablers.filter((_, i) => i !== index);
            updateProject(activeView, projectId, 'enablers', newEnablers);
            setTimeout(() => {
                const inputs = document.querySelectorAll(`.enabler-input-${projectId}`);
                inputs[index - 1]?.focus();
            }, 10);
        }
    };

    const selectedProject = areaProjects.find(p => p.id === selectedProjectId);

    return (
        <div className="space-y-6 animate-fadeIn relative">
            {/* Header Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-grow">
                        <div className="p-3 rounded-xl text-white" style={{ backgroundColor: area.hex }}>
                            <area.icon size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{area.label}</h2>
                            <div className="flex items-center gap-3">
                                <p className="text-gray-500 text-sm">Pianificazione operativa</p>
                                <button onClick={() => setIsNotesOpen(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors border border-yellow-200">
                                    <StickyNote size={12} /> Note
                                </button>
                                <button onClick={() => setIsChatOpen(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 shadow-sm">
                                    <Sparkles size={12} /> AI Chat
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-stretch gap-4 w-full md:w-auto">
                        <div className="text-white rounded-lg p-3 flex flex-col items-center justify-center shadow-lg min-w-[100px]" style={{ backgroundColor: ARAD_BLUE }}>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1" style={{ color: ARAD_GOLD }}>Importance</span>
                            <div className="flex items-center gap-1">
                                <input type="number" min="1" max="10" value={data.importance || 0} onChange={(e) => updateAreaData(activeView, 'importance', parseInt(e.target.value))} disabled={!isEditor} className="w-12 text-center text-2xl font-bold bg-transparent border-0 border-b-2 focus:ring-0 p-0 text-white" style={{ borderColor: ARAD_GOLD }} />
                                <span className="text-sm opacity-60">/10</span>
                            </div>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col justify-center min-w-[180px]">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Budget Totale Area</span>
                            <div className="font-bold text-lg text-gray-800">
                                € {areaBudgetMin.toLocaleString('it-IT')} - {areaBudgetMax.toLocaleString('it-IT')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gantt e Dettaglio */}
            <Card title="Pianificazione Gantt" icon={Calendar} action={isEditor && <Button variant="ghost" icon={Plus} onClick={addProject} className="text-red-700">Aggiungi Progetto</Button>} noPadding>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <GanttChart projects={areaProjects} areas={EXPERTISE_AREAS} activeAreaId={area.id} onUpdateProject={updateProjectBatch} isEditor={isEditor} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
                </div>

                <div className="p-6 bg-white min-h-[300px]">
                    {selectedProject ? (
                        <div className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                    <span>Progetti</span><ChevronRight size={14} /><span style={{ color: area.hex }}>{selectedProject.title || 'Iniziativa senza nome'}</span>
                                </div>
                                {isEditor && <button onClick={() => removeProject(selectedProject.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>}
                            </div>

                            <div className="space-y-8">
                                <input type="text" placeholder="Nome del progetto..." className="w-full text-2xl font-bold text-gray-800 border-0 border-b border-gray-100 focus:ring-0 px-0 pb-2" style={{ color: area.hex }} value={selectedProject.title} onChange={(e) => updateProject(activeView, selectedProject.id, 'title', e.target.value)} disabled={!isEditor} />

                                {/* DETTAGLI RIGA UNICA - SPAZIO CALENDARIO OTTIMIZZATO */}
                                <div className="flex flex-wrap items-end gap-6 pb-8 border-b border-gray-50">
                                    
                                    {/* Tempistiche (Molto più largo) */}
                                    <div className="space-y-2 flex-grow min-w-[320px]">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempistiche</label>
                                        <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 h-11 px-4">
                                            <div className="flex items-center gap-3">
                                                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                                                <input type="month" value={selectedProject.start} onChange={(e) => updateProject(activeView, selectedProject.id, 'start', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold focus:ring-0 w-32" />
                                            </div>
                                            <span className="text-gray-300">→</span>
                                            <input type="month" value={selectedProject.end} onChange={(e) => updateProject(activeView, selectedProject.id, 'end', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold focus:ring-0 w-32 text-right" />
                                        </div>
                                    </div>

                                    {/* Budget */}
                                    <div className="space-y-2 w-64">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget Progetto (€)</label>
                                        <div className="flex items-center gap-2 h-11">
                                            <input type="number" placeholder="Min" value={selectedProject.budgetMin ?? ''} onChange={(e) => updateProject(activeView, selectedProject.id, 'budgetMin', parseFloat(e.target.value) || 0)} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-sm font-bold p-2.5 h-full" />
                                            <span className="text-gray-300">-</span>
                                            <input type="number" placeholder="Max" value={selectedProject.budgetMax ?? ''} onChange={(e) => updateProject(activeView, selectedProject.id, 'budgetMax', parseFloat(e.target.value) || 0)} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-sm font-bold p-2.5 h-full" />
                                        </div>
                                    </div>

                                    {/* Priorità e Effort (Stretti) */}
                                    <div className="flex gap-4">
                                        <div className="space-y-2 w-20">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Priorità</label>
                                            <input type="number" min="1" max="10" value={selectedProject.impact} onChange={(e) => updateProject(activeView, selectedProject.id, 'impact', parseInt(e.target.value))} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-lg font-bold text-center h-11" style={{ color: area.hex }} />
                                        </div>
                                        <div className="space-y-2 w-20">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Effort</label>
                                            <input type="number" min="1" max="10" value={selectedProject.effort} onChange={(e) => updateProject(activeView, selectedProject.id, 'effort', parseInt(e.target.value))} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-lg font-bold text-center h-11 text-gray-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Descrizione */}
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrizione Iniziativa</label>
                                    <AdvancedEditor value={selectedProject.description || ''} onChange={(val) => updateProject(activeView, selectedProject.id, 'description', val)} placeholder="Descrivi i dettagli..." disabled={!isEditor} />
                                </div>

                                {/* KEY ENABLERS SECTION */}
                                <div className="space-y-4 pt-6">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Abilitatori Chiave (Key Enablers)</label>
                                    <div className="space-y-3">
                                        {(selectedProject.enablers || [""]).map((enabler, index) => (
                                            <div key={index} className="flex items-center gap-3 group">
                                                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    value={enabler}
                                                    placeholder={index === 0 ? "Aggiungi abilitatore..." : ""}
                                                    className={`enabler-input-${selectedProject.id} flex-grow bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-700 placeholder-gray-300 font-medium`}
                                                    onChange={(e) => {
                                                        const newEnablers = [...(selectedProject.enablers || [""])];
                                                        newEnablers[index] = e.target.value;
                                                        updateProject(activeView, selectedProject.id, 'enablers', newEnablers);
                                                    }}
                                                    onKeyDown={(e) => handleEnablerKeyDown(e, index, selectedProject.id, selectedProject.enablers || [""])}
                                                    disabled={!isEditor}
                                                />
                                                {isEditor && (
                                                    <button 
                                                        onClick={() => {
                                                            const newEnablers = selectedProject.enablers.filter((_, i) => i !== index);
                                                            updateProject(activeView, selectedProject.id, 'enablers', newEnablers.length ? newEnablers : [""]);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12"><Calendar size={48} className="opacity-20" /><p className="italic text-sm">Seleziona un progetto dal Gantt</p></div>
                    )}
                </div>
            </Card>

            <Card title="Routine Day-by-Day" icon={Clock}>
                <AdvancedEditor value={data.routine || ''} onChange={(val) => updateAreaData(activeView, 'routine', val)} placeholder="Attività quotidiane..." disabled={!isEditor} />
            </Card>
            <NotebookLMChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} areaLabel={area.label} />
        </div>
    );
};

export default AreaEditor;
