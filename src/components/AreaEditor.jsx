import React, { useState, useEffect } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, X, Sparkles, ChevronRight, Check, Info } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import NotebookLMChat from './NotebookLMChat';
import AdvancedEditor from './AdvancedEditor';
import { ARAD_BLUE, ARAD_GOLD, GANTT_START_YEAR, EXPERTISE_AREAS, EMPTY_AREA_DATA } from '../utils/constants';

export const STRATEGIC_ROLES = [
    { id: 'strategic', value: 10, label: 'Strategic', icon: '🔥', title: 'Strategic (Transformational)', desc: "Non serve per sopravvivere oggi, ma serve per vincere domani. Sono le iniziative che creano un nuovo vantaggio competitivo, cambiano il modello di business o aprono nuovi mercati." },
    { id: 'core', value: 8, label: 'Core', icon: '⭐', title: 'Core (Business Critical)', desc: "È il motore attuale del business. Genera i ricavi oggi o è vitale per le operations quotidiane." },
    { id: 'enabling', value: 6, label: 'Enabling', icon: '🏗️', title: 'Enabling (Foundational / Strutturale)', desc: 'Sono le "fondamenta". I prerequisiti affinché le aree Core e Strategic possano esistere.' },
    { id: 'supporting', value: 4, label: 'Supporting', icon: '⚙️', title: 'Supporting (Operational)', desc: "Attività necessarie al mantenimento aziendale, vanno ottimizzate e automatizzate." },
    { id: 'exploratory', value: 2, label: 'Exploratory', icon: '🧪', title: 'Exploratory (Innovation / Sperimentale)', desc: "Iniziative ad alto rischio e alto potenziale per testare nuove acque." }
];

export const getStrategicRole = (val) => {
    const num = Number(val) || 0;
    if (num >= 9) return STRATEGIC_ROLES[0];
    if (num >= 7) return STRATEGIC_ROLES[1];
    if (num >= 5) return STRATEGIC_ROLES[2];
    if (num >= 3) return STRATEGIC_ROLES[3];
    return STRATEGIC_ROLES[4];
};

const AreaEditor = ({ activeView, activeScenario, updateAreaData, updateProject, updateProjectBatch, updateKSM, isEditor = false }) => {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [newRoutineTask, setNewRoutineTask] = useState("");

    const area = EXPERTISE_AREAS.find(a => a.id === activeView);
    if (!area) return null;

    const data = activeScenario.data[activeView] || { ...EMPTY_AREA_DATA };
    const safeProjects = Array.isArray(data.projects) ? data.projects : [];
    const areaProjects = safeProjects.map(p => ({ ...p, areaId: area.id }));

    const areaBudgetMin = areaProjects.reduce((acc, p) => acc + (Number(p.budgetMin) || 0), 0);
    const areaBudgetMax = areaProjects.reduce((acc, p) => acc + (Number(p.budgetMax) || 0), 0);
    const routineTasks = Array.isArray(data.routine) ? data.routine : [];

    const currentRole = getStrategicRole(data.importance);

    useEffect(() => {
        if (!selectedProjectId && areaProjects.length > 0) setSelectedProjectId(areaProjects[0].id);
    }, [activeView]);

    const addProject = () => {
        if (!isEditor) return;
        const newId = Date.now();
        updateAreaData(activeView, 'projects', [...areaProjects, { id: newId, title: '', description: '', enablers: [""], start: `${GANTT_START_YEAR}-01`, end: `${GANTT_START_YEAR}-04`, impact: 5, effort: 5, budgetMin: 0, budgetMax: 0 }]);
        setSelectedProjectId(newId);
    };

    const removeProject = (projectId) => {
        if (!isEditor) return;
        const newProjects = areaProjects.filter(p => p.id !== projectId);
        updateAreaData(activeView, 'projects', newProjects);
        if (selectedProjectId === projectId) setSelectedProjectId(newProjects.length > 0 ? newProjects[0].id : null);
    };

    const handleEnablerKeyDown = (e, index, projectId, currentEnablers) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newEnablers = [...currentEnablers];
            newEnablers.splice(index + 1, 0, "");
            updateProject(activeView, projectId, 'enablers', newEnablers);
            setTimeout(() => document.querySelectorAll(`.enabler-input-${projectId}`)[index + 1]?.focus(), 10);
        } else if (e.key === 'Backspace' && currentEnablers[index] === "" && currentEnablers.length > 1) {
            e.preventDefault();
            const newEnablers = currentEnablers.filter((_, i) => i !== index);
            updateProject(activeView, projectId, 'enablers', newEnablers);
            setTimeout(() => document.querySelectorAll(`.enabler-input-${projectId}`)[index - 1]?.focus(), 10);
        }
    };

    const addKSM = () => {
        if (!isEditor) return;
        updateAreaData(activeView, 'ksms', [...(Array.isArray(data.ksms) ? data.ksms : []), { id: Date.now(), name: '', valueAsIs: '', targetValue: '', description: '' }]);
    };

    const removeKSM = (ksmId) => {
        if (!isEditor) return;
        updateAreaData(activeView, 'ksms', (Array.isArray(data.ksms) ? data.ksms : []).filter(k => k.id !== ksmId));
    };

    const handleAddRoutineTask = () => {
        if (!newRoutineTask.trim() || !isEditor) return;
        updateAreaData(activeView, 'routine', [...routineTasks, { id: Date.now(), text: newRoutineTask.trim(), completed: false }]);
        setNewRoutineTask("");
    };

    const toggleRoutineTask = (taskId) => {
        if (!isEditor) return;
        updateAreaData(activeView, 'routine', routineTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };

    const removeRoutineTask = (taskId) => {
        if (!isEditor) return;
        updateAreaData(activeView, 'routine', routineTasks.filter(t => t.id !== taskId));
    };

    const selectedProject = areaProjects.find(p => p.id === selectedProjectId);

    return (
        <div className="space-y-6 animate-fadeIn relative">
            
            {/* Modal Note */}
            {isNotesOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2"><StickyNote size={18} className="text-yellow-600" /> Note: {area.label}</h3>
                            <button onClick={() => setIsNotesOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <AdvancedEditor value={data.comments || ''} onChange={(val) => updateAreaData(activeView, 'comments', val)} disabled={!isEditor} />
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end"><Button onClick={() => setIsNotesOpen(false)} variant="secondary">Chiudi</Button></div>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative z-40">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-grow">
                        <div className="p-3 rounded-xl text-white" style={{ backgroundColor: area.hex }}><area.icon size={28} /></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{area.label}</h2>
                            <div className="flex items-center gap-3">
                                <p className="text-gray-500 text-sm">Pianificazione operativa</p>
                                <button onClick={() => setIsNotesOpen(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200"><StickyNote size={12} /> Note</button>
                                <button onClick={() => setIsChatOpen(true)} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"><Sparkles size={12} /> AI Chat</button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-stretch gap-4 w-full md:w-auto relative">
                        {/* Ruolo Strategico con Tooltip Popover */}
                        <div className="rounded-xl p-3 flex flex-col justify-center shadow-lg bg-slate-900 min-w-[190px] relative transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-500">Ruolo Strategico</span>
                                <button onClick={() => setIsLegendOpen(!isLegendOpen)} className="text-gray-400 hover:text-white"><Info size={14} /></button>
                            </div>
                            <select value={currentRole.value} onChange={(e) => updateAreaData(activeView, 'importance', parseInt(e.target.value))} disabled={!isEditor} className="w-full appearance-none bg-transparent border-0 border-b-2 border-yellow-500 p-0 py-1 text-white font-semibold text-[15px] cursor-pointer focus:ring-0">
                                {STRATEGIC_ROLES.map(role => <option key={role.id} value={role.value}>{role.icon} {role.label}</option>)}
                            </select>

                            {/* TOOLTIP POPOVER */}
                            {isLegendOpen && (
                                <div>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsLegendOpen(false)}></div>
                                    <div className="absolute top-[calc(100%+12px)] right-0 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-[70] overflow-hidden cursor-default animate-fadeIn">
                                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <h3 className="font-bold text-gray-900 text-sm">Legenda Ruolo Strategico</h3>
                                            <button onClick={() => setIsLegendOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                                        </div>
                                        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar text-left">
                                            {STRATEGIC_ROLES.map(role => (
                                                <div key={role.id}>
                                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-1.5 text-sm"><span className="text-lg">{role.icon}</span> {role.title}</h4>
                                                    <p className="text-xs text-gray-600 leading-relaxed font-normal whitespace-normal">{role.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-center min-w-[180px]">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Budget Totale Area</span>
                            <div className="font-bold text-lg text-gray-800">€ {areaBudgetMin.toLocaleString('it-IT')} - {areaBudgetMax.toLocaleString('it-IT')}</div>
                        </div>
                    </div>
                </div>
            </div>

            <Card title="Obiettivi Macro" icon={Target}>
                <AdvancedEditor value={data.objectives || ''} onChange={(val) => updateAreaData(activeView, 'objectives', val)} placeholder={`Definisci gli obiettivi...`} disabled={!isEditor} />
            </Card>

            {/* SEZIONE RINOMINATA E ALLINEATA */}
            <Card title="Descrizione Qualitativa del Phasing" icon={Calendar}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {[1, 2, 3].map(year => (
                        <div key={year} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col h-full">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Anno {year}</div>
                            {/* Le classi aggiunte qui forzano il box dell'editor a espandersi fino in fondo! */}
                            <div className="relative flex-grow flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden [&>div]:flex-grow [&>div]:flex [&>div]:flex-col">
                                <AdvancedEditor value={data[`evolution_y${year}`] || ''} onChange={(val) => updateAreaData(activeView, `evolution_y${year}`, val)} placeholder={`Focus Anno ${year}...`} disabled={!isEditor} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Pianificazione Iniziative" icon={Calendar} action={isEditor && <Button variant="ghost" icon={Plus} onClick={addProject} className="text-red-700">Aggiungi Progetto</Button>} noPadding>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <GanttChart projects={areaProjects} areas={EXPERTISE_AREAS} activeAreaId={area.id} onUpdateProject={updateProjectBatch} isEditor={isEditor} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
                </div>
                <div className="p-6 bg-white min-h-[300px]">
                    {selectedProject ? (
                        <div className="animate-fadeIn">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium"><span>Progetti</span><ChevronRight size={14} /><span style={{ color: area.hex }}>{selectedProject.title || 'Senza nome'}</span></div>
                                {isEditor && <button onClick={() => removeProject(selectedProject.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>}
                            </div>
                            <div className="space-y-8">
                                <input type="text" placeholder="Nome del progetto..." className="w-full text-2xl font-bold text-gray-800 border-0 border-b border-gray-100 focus:ring-0 px-0 pb-2" style={{ color: area.hex }} value={selectedProject.title} onChange={(e) => updateProject(activeView, selectedProject.id, 'title', e.target.value)} disabled={!isEditor} />
                                <div className="flex flex-wrap items-end gap-6 pb-8 border-b border-gray-50">
                                    <div className="space-y-2 flex-grow min-w-[320px]">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tempistiche</label>
                                        <div className="flex items-center justify-between gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 h-11 px-4">
                                            <div className="flex items-center gap-3"><Calendar size={16} className="text-gray-400 flex-shrink-0" /><input type="month" value={selectedProject.start} onChange={(e) => updateProject(activeView, selectedProject.id, 'start', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold focus:ring-0 w-32" /></div>
                                            <span className="text-gray-300">→</span>
                                            <input type="month" value={selectedProject.end} onChange={(e) => updateProject(activeView, selectedProject.id, 'end', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold focus:ring-0 w-32 text-right" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 w-64">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Budget (€)</label>
                                        <div className="flex items-center gap-2 h-11"><input type="number" placeholder="Min" value={selectedProject.budgetMin ?? ''} onChange={(e) => updateProject(activeView, selectedProject.id, 'budgetMin', parseFloat(e.target.value) || 0)} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-sm font-bold p-2.5 h-full" /><span className="text-gray-300">-</span><input type="number" placeholder="Max" value={selectedProject.budgetMax ?? ''} onChange={(e) => updateProject(activeView, selectedProject.id, 'budgetMax', parseFloat(e.target.value) || 0)} disabled={!isEditor} className="w-full bg-gray-50 border-gray-100 rounded-lg text-sm font-bold p-2.5 h-full" /></div>
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
                                    <AdvancedEditor value={selectedProject.description || ''} onChange={(val) => updateProject(activeView, selectedProject.id, 'description', val)} disabled={!isEditor} />
                                </div>
                                <div className="space-y-4 pt-6">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Abilitatori Chiave (Key Enablers)</label>
                                    <div className="space-y-3">
                                        {(selectedProject.enablers || [""]).map((enabler, index) => (
                                            <div key={index} className="flex items-center gap-3 group">
                                                <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                                                <input type="text" value={enabler} placeholder={index === 0 ? "Aggiungi abilitatore..." : ""} className={`enabler-input-${selectedProject.id} flex-grow bg-transparent border-0 focus:ring-0 p-0 text-sm text-gray-700 font-medium`} onChange={(e) => { const newEnablers = [...(selectedProject.enablers || [""])]; newEnablers[index] = e.target.value; updateProject(activeView, selectedProject.id, 'enablers', newEnablers); }} onKeyDown={(e) => handleEnablerKeyDown(e, index, selectedProject.id, selectedProject.enablers || [""])} disabled={!isEditor} />
                                                {isEditor && <button onClick={() => { const newEnablers = selectedProject.enablers.filter((_, i) => i !== index); updateProject(activeView, selectedProject.id, 'enablers', newEnablers.length ? newEnablers : [""]); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"><X size={16} /></button>}
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

            <Card title="Key Success Metrics (KSM)" icon={Target} action={isEditor && <Button variant="ghost" icon={Plus} onClick={addKSM} className="text-red-700">Aggiungi Metrica</Button>} noPadding>
                <div className="p-6 space-y-6 bg-slate-50/50">
                    {(!Array.isArray(data.ksms) || data.ksms.length === 0) ? (
                        <div className="text-gray-400 italic text-sm">Nessuna metrica definita.</div>
                    ) : (
                        data.ksms.map((ksm) => (
                            <div key={ksm.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative group space-y-6">
                                {isEditor && <button onClick={() => removeKSM(ksm.id)} className="absolute top-6 right-6 text-gray-300 hover:text-red-600"><Trash2 size={18} /></button>}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Denominazione Metrica</label>
                                    <input type="text" value={ksm.name || ''} onChange={(e) => updateKSM(activeView, ksm.id, 'name', e.target.value)} disabled={!isEditor} className="w-full border-0 bg-transparent text-xl font-bold text-gray-800 p-0" placeholder="Nome Metrica" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Valore As Is (Attuale)</label><input type="text" value={ksm.valueAsIs || ''} onChange={(e) => updateKSM(activeView, ksm.id, 'valueAsIs', e.target.value)} disabled={!isEditor} className="w-full border-0 bg-transparent text-sm p-0" placeholder="Es. 1.2%" /></div>
                                    <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Target di Massima</label><input type="text" value={ksm.targetValue || ''} onChange={(e) => updateKSM(activeView, ksm.id, 'targetValue', e.target.value)} disabled={!isEditor} className="w-full border-0 bg-transparent text-sm p-0 text-blue-600 font-bold" placeholder="Es. > 2.5%" /></div>
                                </div>
                                <div><label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Descrizione (Cosa Misura)</label><AdvancedEditor value={ksm.description || ''} onChange={(val) => updateKSM(activeView, ksm.id, 'description', val)} disabled={!isEditor} /></div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            <Card title="Attività Chiave Day-by-Day" icon={Clock}>
                <div className="space-y-4">
                    {isEditor && (
                        <div className="flex items-center gap-3">
                            <input type="text" value={newRoutineTask} onChange={(e) => setNewRoutineTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddRoutineTask()} placeholder="Aggiungi una nuova attività chiave..." className="flex-grow border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none" />
                            <Button variant="secondary" onClick={handleAddRoutineTask}><Plus size={16} /> Aggiungi</Button>
                        </div>
                    )}
                    {routineTasks.length === 0 ? (
                        <div className="text-gray-400 text-sm italic">Nessuna attività day-by-day definita.</div>
                    ) : (
                        <div className="space-y-2 mt-4">
                            {routineTasks.map((task) => (
                                <div key={task.id} className="group flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                    <div className="flex items-center gap-4 flex-grow cursor-pointer" onClick={() => toggleRoutineTask(task.id)}>
                                        <button disabled={!isEditor} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white'}`}>{task.completed && <Check size={12} strokeWidth={3} />}</button>
                                        <span className={`text-sm select-none ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'}`}>{task.text}</span>
                                    </div>
                                    {isEditor && <button onClick={() => removeRoutineTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1"><X size={16} /></button>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <NotebookLMChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} areaLabel={area.label} />
        </div>
    );
};

export default AreaEditor;
