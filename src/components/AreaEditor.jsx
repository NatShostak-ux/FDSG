import React, { useState, useEffect } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, X, Sparkles, ChevronRight } from 'lucide-react';
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
        updateAreaData(activeView, 'projects', [...areaProjects, newProject]);
        setSelectedProjectId(newId);
    };

    const removeProject = (projectId) => {
        if (!isEditor) return;
        const newProjects = areaProjects.filter(p => p.id !== projectId);
        updateAreaData(activeView, 'projects', newProjects);
        if (selectedProjectId === projectId) {
            setSelectedProjectId(newProjects.length > 0 ? newProjects[0].id : null);
        }
    };

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

    // FUNZIONE AGGIORNATA PER LE NUOVE KSM
    const addKSM = () => {
        if (!isEditor) return;
        const newKSM = {
            id: Date.now(),
            name: '',
            valueAsIs: '',
            targetValue: '',
            description: ''
        };
        const currentKSMs = Array.isArray(data.ksms) ? data.ksms : [];
        updateAreaData(activeView, 'ksms', [...currentKSMs, newKSM]);
    };

    const removeKSM = (ksmId) => {
        if (!isEditor) return;
        const currentKSMs = Array.isArray(data.ksms) ? data.ksms : [];
        updateAreaData(activeView, 'ksms', currentKSMs.filter(k => k.id !== ksmId));
    };

    const selectedProject = areaProjects.find(p => p.id === selectedProjectId);

    return (
        <div className="space-y-6 animate-fadeIn relative">
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
                                <button onClick={() => setIsNotesOpen(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200 transition-colors">
                                    <StickyNote size={12} /> Note
                                </button>
                                <button onClick={() => setIsChatOpen(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm">
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

            <Card title="Obiettivi Macro" icon={Target}>
                <AdvancedEditor 
                    value={data.objectives || ''} 
                    onChange={(val) => updateAreaData(activeView, 'objectives', val)} 
                    placeholder={`Definisci gli obiettivi strategici per ${area.label}...`} 
                    disabled={!isEditor} 
                />
            </Card>

            <Card title="Evoluzione Temporale (Roadmap 3 Anni)" icon={Calendar}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {[1, 2, 3].map(year => (
                        <div key={year} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col h-full">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2 text-[10px] tracking-wider">Anno {year}</div>
                            <div className="relative flex-grow h-full bg-white rounded border border-gray-100">
                                <AdvancedEditor
                                    value={data[`evolution_y${year}`] || ''}
                                    onChange={(val) => updateAreaData(activeView, `evolution_y${year}`, val)}
                                    placeholder={`Focus Anno ${year}...`}
                                    disabled={!isEditor}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

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

                                <div className="flex flex-wrap items-end gap-6 pb-8 border-b border-gray-50">
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

                                    <div className="space-y-2 w-64">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget Progetto (€)</label>
                                        <div className="flex items-center gap-2 h-11">
                                            <input type="number" placeholder="Min" value={selectedProject.budgetMin ?? ''} onChange={(e) => updateProject(activeView, selectedProject.id, 'budgetMin', parseFloat(e.target.value) || 0)} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-sm font-bold p-2.5 h-full" />
                                            <span className="text-gray-300">-</span>
                                            <input type="number" placeholder="Max" value={selectedProject.budgetMax ?? ''} onChange={(e) => updateProject(activeView, selectedProject.id, 'budgetMax', parseFloat(e.target.value) || 0)} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-sm font-bold p-2.5 h-full" />
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="space-y-2 w-20 text-center">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priorità</label>
                                            <input type="number" min="1" max="10" value={selectedProject.impact} onChange={(e) => updateProject(activeView, selectedProject.id, 'impact', parseInt(e.target.value))} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-lg font-bold text-center h-11" style={{ color: area.hex }} />
                                        </div>
                                        <div className="space-y-2 w-20 text-center">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Effort</label>
                                            <input type="number" min="1" max="10" value={selectedProject.effort} onChange={(e) => updateProject(activeView, selectedProject.id, 'effort', parseInt(e.target.value))} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-lg font-bold text-center h-11 text-gray-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrizione Iniziativa</label>
                                    <AdvancedEditor value={selectedProject.description || ''} onChange={(val) => updateProject(activeView, selectedProject.id, 'description', val)} placeholder="Descrivi i dettagli, gli obiettivi e i task..." disabled={!isEditor} />
                                </div>

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
                                                    <button onClick={() => {
                                                        const newEnablers = selectedProject.enablers.filter((_, i) => i !== index);
                                                        updateProject(activeView, selectedProject.id, 'enablers', newEnablers.length ? newEnablers : [""]);
                                                    }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity">
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
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12"><Calendar size={48} className="opacity-20" /><p className="italic text-sm">Seleziona un progetto dal Gantt per visualizzare i dettagli</p></div>
                    )}
                </div>
            </Card>

            {/* SEZIONE KSM AGGIORNATA (DESIGN SEMPLIFICATO) */}
            <Card 
                title="Key Success Metrics (KSM)" 
                icon={Target} 
                action={isEditor && <Button variant="ghost" icon={Plus} onClick={addKSM} className="text-red-700">Aggiungi Metrica</Button>} 
                noPadding
            >
                <div className="p-6 space-y-6 bg-slate-50/50">
                    <p className="text-sm text-gray-600 mb-2">
                        Definisci le metriche chiave per misurare il successo in quest'area <strong>(Consigliato: massimo 3 metriche)</strong>.
                    </p>

                    {(!Array.isArray(data.ksms) || data.ksms.length === 0) ? (
                        <div className="text-center text-gray-400 italic text-sm py-8">
                            Nessuna metrica definita. Aggiungine una per monitorare il successo.
                        </div>
                    ) : (
                        data.ksms.map((ksm) => (
                            <div key={ksm.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative group space-y-6">
                                {isEditor && (
                                    <button 
                                        onClick={() => removeKSM(ksm.id)} 
                                        className="absolute top-6 right-6 text-gray-300 hover:text-red-600 p-1 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                
                                <div className="pr-12">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Denominazione Metrica</label>
                                    <input 
                                        type="text" 
                                        value={ksm.name || ''} 
                                        onChange={(e) => updateKSM(activeView, ksm.id, 'name', e.target.value)} 
                                        disabled={!isEditor} 
                                        className="w-full border-0 border-b border-transparent hover:border-gray-200 focus:border-blue-400 focus:ring-0 px-0 py-1 text-xl font-bold text-gray-800 bg-transparent transition-colors placeholder-gray-400" 
                                        placeholder="Es. Tasso di Conversione" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Valore As Is (Attuale)</label>
                                        <input 
                                            type="text" 
                                            value={ksm.valueAsIs || ''} 
                                            onChange={(e) => updateKSM(activeView, ksm.id, 'valueAsIs', e.target.value)} 
                                            disabled={!isEditor} 
                                            className="w-full border border-gray-200 rounded-md text-sm p-2.5 focus:ring-1 focus:ring-blue-500 bg-white" 
                                            placeholder="Es. 1.2% (lascia vuoto se non disponibile)" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Target di Massima</label>
                                        <input 
                                            type="text" 
                                            value={ksm.targetValue || ''} 
                                            onChange={(e) => updateKSM(activeView, ksm.id, 'targetValue', e.target.value)} 
                                            disabled={!isEditor} 
                                            className="w-full border border-gray-200 rounded-md text-sm p-2.5 focus:ring-1 focus:ring-blue-500 bg-white" 
                                            placeholder="Es. > 2.5%" 
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Descrizione (Cosa Misura)</label>
                                    <AdvancedEditor 
                                        value={ksm.description || ''} 
                                        onChange={(val) => updateKSM(activeView, ksm.id, 'description', val)} 
                                        placeholder="Descrivi lo scopo della metrica..." 
                                        disabled={!isEditor} 
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <Card title="Attività di Routine (Day-by-Day)" icon={Clock}>
                <AdvancedEditor 
                    value={data.routine || ''} 
                    onChange={(val) => updateAreaData(activeView, 'routine', val)} 
                    placeholder="Quali sono le attività operative quotidiane?" 
                    disabled={!isEditor} 
                />
            </Card>

            <NotebookLMChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} areaLabel={area.label} />
        </div>
    );
};

export default AreaEditor;
