import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, X, ChevronRight, Check, Info, ChevronDown, ChevronUp, AlignLeft, ArrowUp, ArrowDown, PlusCircle, Layout } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import AdvancedEditor from './AdvancedEditor';
import { GANTT_START_YEAR, EXPERTISE_AREAS, EMPTY_AREA_DATA } from '../utils/constants';

export const STRATEGIC_ROLES = [
    { id: 'strategic', value: 5, label: '5 - Strategic', icon: '🔥', title: '5 - Strategic (Transformational)', desc: "Iniziative che creano un nuovo vantaggio competitivo." },
    { id: 'core', value: 4, label: '4 - Core', icon: '⭐', title: '4 - Core (Business Critical)', desc: "Il motore attuale del business. Genera i ricavi oggi." },
    { id: 'enabling', value: 3, label: '3 - Enabling', icon: '🏗️', title: '3 - Enabling (Foundational)', desc: 'Le fondamenta prerequisito per le altre aree.' },
    { id: 'supporting', value: 2, label: '2 - Supporting', icon: '⚙️', title: '2 - Supporting (Operational)', desc: "Attività necessarie al mantenimento aziendale." },
    { id: 'exploratory', value: 1, label: '1 - Exploratory', icon: '🧪', title: '1 - Exploratory (Innovation)', desc: "Iniziative per testare nuove acque." }
];

export const getStrategicRole = (val) => {
    const num = Number(val) || 0;
    if (num >= 5) return STRATEGIC_ROLES[0];
    if (num === 4) return STRATEGIC_ROLES[1];
    if (num === 3) return STRATEGIC_ROLES[2];
    if (num === 2) return STRATEGIC_ROLES[3];
    return STRATEGIC_ROLES[4];
};

const generateUniqueId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const AreaEditor = ({ activeView, activeScenario, updateAreaData, updateProject, updateProjectBatch, updateKSM, isEditor = false, searchFocusItem = null, onFocusHandled }) => {
    
    // --- STATI LOCALI ---
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [newRoutineTask, setNewRoutineTask] = useState("");
    const [expandedKSMs, setExpandedKSMs] = useState({});
    const [blockMenuOpen, setBlockMenuOpen] = useState(false);

    // --- DATI AREA ---
    const area = EXPERTISE_AREAS.find(a => a.id === activeView);
    const data = activeScenario?.data?.[activeView] || { ...EMPTY_AREA_DATA };
    
    // --- INIZIALIZZAZIONE LAYOUT ---
    const blocks = useMemo(() => {
        if (data.blocks && data.blocks.length > 0) return data.blocks;
        return [
            { id: 'std_obj', type: 'objectives', title: 'Obiettivi Macro' },
            { id: 'std_phasing', type: 'phasing', title: 'Descrizione Qualitativa del Phasing' },
            { id: 'std_gantt', type: 'gantt', title: 'Pianificazione Iniziative' },
            { id: 'std_ksms', type: 'ksms', title: 'Key Success Metrics (KSM)' },
            { id: 'std_routine', type: 'routine', title: 'Attività a Regime' }
        ];
    }, [data.blocks]);

    const rawProjects = Array.isArray(data.projects) ? data.projects : [];
    const areaProjects = rawProjects.map(p => ({ ...p, areaId: area?.id }));
    const routineTasks = Array.isArray(data.routine) ? data.routine : [];
    const currentRole = getStrategicRole(data.importance);

    useEffect(() => {
        if (!selectedProjectId && areaProjects.length > 0) setSelectedProjectId(areaProjects[0].id);
    }, [activeView]);

    // --- FOCUS GESTION ---
    useEffect(() => {
        if (searchFocusItem) {
            if (searchFocusItem.type === 'project') setSelectedProjectId(searchFocusItem.id);
            if (searchFocusItem.type === 'ksm') setExpandedKSMs(prev => ({ ...prev, [searchFocusItem.id]: true }));
            
            setTimeout(() => {
                let targetId = '';
                if (searchFocusItem.type === 'objective') targetId = 'target-objective';
                if (searchFocusItem.type === 'phasing') targetId = `target-phasing-${searchFocusItem.id}`;
                if (searchFocusItem.type === 'project') targetId = 'target-project-details';
                if (searchFocusItem.type === 'ksm') targetId = `target-ksm-${searchFocusItem.id}`;
                if (searchFocusItem.type === 'routine') targetId = `target-routine-${searchFocusItem.id}`;

                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'all 0.4s ease-out';
                    el.style.boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)';
                    el.style.backgroundColor = '#f0f9ff';
                    setTimeout(() => {
                        el.style.boxShadow = 'none';
                        el.style.backgroundColor = 'transparent';
                        if (onFocusHandled) onFocusHandled();
                    }, 2000);
                }
            }, 150);
        } else {
            window.scrollTo(0, 0);
        }
    }, [searchFocusItem, activeView]);

    // --- HANDLERS BLOCCHI ---
    const moveBlock = (index, direction) => {
        if (!isEditor) return;
        const newBlocks = [...blocks];
        if (direction === 'up' && index > 0) {
            [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
        } else if (direction === 'down' && index < newBlocks.length - 1) {
            [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
        }
        updateAreaData(activeView, 'blocks', newBlocks);
    };

    const removeBlock = (blockId) => {
        if (!isEditor || !window.confirm("Vuoi davvero rimuovere questa sezione?")) return;
        updateAreaData(activeView, 'blocks', blocks.filter(b => b.id !== blockId));
    };

    const addCustomBlock = (type) => {
        const newBlock = {
            id: generateUniqueId('block'),
            type,
            title: type === 'text' ? 'Nuova Sezione Testo' : 'Nuova Sezione',
            contentId: type === 'text' ? generateUniqueId('content') : null
        };
        updateAreaData(activeView, 'blocks', [...blocks, newBlock]);
        setBlockMenuOpen(false);
    };

    const updateBlockTitle = (blockId, newTitle) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, title: newTitle } : b);
        updateAreaData(activeView, 'blocks', newBlocks);
    };

    // --- HANDLERS INTERNI ---
    const handleEnablerKeyDown = (e, index, projectId, currentEnablers) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newEnablers = [...currentEnablers];
            newEnablers.splice(index + 1, 0, "");
            updateProject(activeView, projectId, 'enablers', newEnablers);
            setTimeout(() => document.querySelectorAll(`.enabler-input-${projectId}`)[index + 1]?.focus(), 10);
        }
    };

    if (!area) return null;
    const selectedProject = areaProjects.find(p => p.id === selectedProjectId);

    // --- RENDERER PIATTO (Evita i crash di React) ---
    const renderBlock = (block, index) => {
        const isStandard = ['objectives', 'phasing', 'gantt', 'ksms', 'routine'].includes(block.type);
        let Icon = Target;
        let blockContent = null;
        let isCustomText = false;
        let titleText = block.title;

        if (block.type === 'objectives') {
            Icon = Target;
            blockContent = (
                <div id="target-objective">
                    <AdvancedEditor value={data.objectives || ''} onChange={(val) => updateAreaData(activeView, 'objectives', val)} disabled={!isEditor} placeholder="Inserisci gli obiettivi..." />
                </div>
            );
        } else if (block.type === 'phasing') {
            Icon = Calendar;
            blockContent = (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(y => (
                        <div key={y} id={`target-phasing-${y}`} className="bg-gray-50 p-3 rounded-xl border border-gray-100 h-full flex flex-col">
                            <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Anno {y}</div>
                            <div className="bg-white border border-gray-200 rounded-lg flex-grow overflow-hidden">
                                <AdvancedEditor value={data[`evolution_y${y}`] || ''} onChange={(v) => updateAreaData(activeView, `evolution_y${y}`, v)} disabled={!isEditor} placeholder={`Focus Anno ${y}...`} />
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (block.type === 'gantt') {
            Icon = Calendar;
            blockContent = (
                <>
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <GanttChart projects={areaProjects} areas={EXPERTISE_AREAS} activeAreaId={area.id} onUpdateProject={updateProjectBatch} isEditor={isEditor} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
                        {isEditor && (
                            <div className="mt-4 flex justify-end">
                                <Button variant="ghost" icon={Plus} onClick={() => {
                                    const newId = generateUniqueId('proj');
                                    updateAreaData(activeView, 'projects', [...rawProjects, { id: newId, title: '', description: '', enablers: [""], start: `${GANTT_START_YEAR}-01`, end: `${GANTT_START_YEAR}-04`, impact: 5, effort: 5, budgetMin: 0, budgetMax: 0 }]);
                                    setSelectedProjectId(newId);
                                }} className="text-blue-600 hover:bg-blue-50">Aggiungi Iniziativa</Button>
                            </div>
                        )}
                    </div>
                    <div className="p-6" id="target-project-details">
                        {selectedProject ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                    <input type="text" className="w-full text-2xl font-bold border-0 focus:ring-0 p-0" style={{ color: area.hex }} value={selectedProject.title} onChange={(e) => updateProject(activeView, selectedProject.id, 'title', e.target.value)} disabled={!isEditor} placeholder="Nome Progetto" />
                                    {isEditor && <button onClick={() => {
                                        const newProjects = rawProjects.filter(p => p.id !== selectedProject.id);
                                        updateAreaData(activeView, 'projects', newProjects);
                                        setSelectedProjectId(newProjects.length > 0 ? newProjects[0].id : null);
                                    }} className="text-gray-300 hover:text-red-500"><Trash2 size={18}/></button>}
                                </div>
                                <div className="flex flex-wrap gap-6">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-center gap-3">
                                        <Calendar size={16} className="text-gray-400" />
                                        <input type="month" value={selectedProject.start} onChange={(e) => updateProject(activeView, selectedProject.id, 'start', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold focus:ring-0" />
                                        <span className="text-gray-300">→</span>
                                        <input type="month" value={selectedProject.end} onChange={(e) => updateProject(activeView, selectedProject.id, 'end', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold focus:ring-0" />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Priorità</span>
                                            <input type="number" min="1" max="10" value={selectedProject.impact} onChange={(e) => updateProject(activeView, selectedProject.id, 'impact', parseInt(e.target.value))} disabled={!isEditor} className="w-12 bg-transparent border-0 p-0 text-lg font-bold text-center focus:ring-0" style={{ color: area.hex }} />
                                        </div>
                                        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">Effort</span>
                                            <input type="number" min="1" max="10" value={selectedProject.effort} onChange={(e) => updateProject(activeView, selectedProject.id, 'effort', parseInt(e.target.value))} disabled={!isEditor} className="w-12 bg-transparent border-0 p-0 text-lg font-bold text-center focus:ring-0 text-gray-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrizione</label>
                                        <AdvancedEditor value={selectedProject.description || ''} onChange={(v) => updateProject(activeView, selectedProject.id, 'description', v)} disabled={!isEditor} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Abilitatori</label>
                                        <div className="space-y-2">
                                            {(selectedProject.enablers || [""]).map((en, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 border border-gray-100 group">
                                                    <div className="w-2 h-2 rounded-full border-2 border-gray-300"></div>
                                                    <input type="text" value={en} className={`enabler-input-${selectedProject.id} flex-grow text-sm bg-transparent border-0 focus:ring-0 p-0 font-medium`} onChange={(e) => {
                                                        const next = [...(selectedProject.enablers || [""])]; next[i] = e.target.value;
                                                        updateProject(activeView, selectedProject.id, 'enablers', next);
                                                    }} onKeyDown={(e) => handleEnablerKeyDown(e, i, selectedProject.id, selectedProject.enablers || [""])} disabled={!isEditor} placeholder="Aggiungi abilitatore..." />
                                                    {isEditor && <button onClick={() => {
                                                        const next = selectedProject.enablers.filter((_, idx) => idx !== i);
                                                        updateProject(activeView, selectedProject.id, 'enablers', next.length ? next : [""]);
                                                    }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500"><X size={14}/></button>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : <p className="text-center text-gray-400 italic py-10">Seleziona un'iniziativa dal Gantt</p>}
                    </div>
                </>
            );
        } else if (block.type === 'ksms') {
            Icon = Target;
            blockContent = (
                <div className="space-y-4">
                    {(data.ksms || []).map(ksm => {
                        const isExpanded = expandedKSMs[ksm.id];
                        return (
                            <div key={ksm.id} id={`target-ksm-${ksm.id}`} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex justify-between items-center p-4 bg-white">
                                    <input type="text" value={ksm.name} onChange={(e) => updateKSM(activeView, ksm.id, 'name', e.target.value)} className="font-bold border-0 p-0 focus:ring-0 w-full text-lg" disabled={!isEditor} placeholder="Nome Metrica" />
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        {isEditor && <button onClick={() => {
                                            updateAreaData(activeView, 'ksms', (data.ksms || []).filter(k => k.id !== ksm.id));
                                        }} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>}
                                        <button onClick={() => setExpandedKSMs(prev => ({ ...prev, [ksm.id]: !prev[ksm.id] }))} className="bg-gray-50 p-2 rounded-lg text-gray-500">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="p-4 pt-0 bg-gray-50 border-t border-gray-100">
                                        <div className="grid grid-cols-2 gap-4 my-4 bg-white p-4 rounded-xl border border-gray-100">
                                            <div>
                                                <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Attuale (As Is)</span>
                                                <input type="text" value={ksm.valueAsIs} onChange={(e) => updateKSM(activeView, ksm.id, 'valueAsIs', e.target.value)} className="w-full bg-transparent border-0 p-0 font-medium text-sm" disabled={!isEditor} placeholder="Es. € 100.000" />
                                            </div>
                                            <div className="border-l border-gray-100 pl-4">
                                                <span className="text-[10px] uppercase text-blue-400 font-bold block mb-1">Target Obbiettivo</span>
                                                <input type="text" value={ksm.targetValue} onChange={(e) => updateKSM(activeView, ksm.id, 'targetValue', e.target.value)} className="w-full bg-transparent border-0 p-0 font-bold text-blue-600 text-sm" disabled={!isEditor} placeholder="Es. € 500.000" />
                                            </div>
                                        </div>
                                        <AdvancedEditor value={ksm.description || ''} onChange={(v) => updateKSM(activeView, ksm.id, 'description', v)} disabled={!isEditor} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isEditor && <Button variant="ghost" icon={Plus} onClick={() => {
                        const newId = generateUniqueId('ksm');
                        updateAreaData(activeView, 'ksms', [...(data.ksms || []), { id: newId, name: '', valueAsIs: '', targetValue: '', description: '' }]);
                        setExpandedKSMs(prev => ({ ...prev, [newId]: true }));
                    }} className="text-blue-600">Aggiungi Metrica</Button>}
                </div>
            );
        } else if (block.type === 'routine') {
            Icon = Clock;
            blockContent = (
                <div className="space-y-2">
                    <p className="text-sm text-gray-500 font-medium italic mb-4">Attività incrementali e trasformative rispetto al modello attuale</p>
                    {isEditor && (
                        <div className="flex items-center gap-2 mb-4">
                            <input type="text" value={newRoutineTask} onChange={(e) => setNewRoutineTask(e.target.value)} onKeyDown={(e) => {
                                if(e.key === 'Enter' && newRoutineTask.trim()) {
                                    updateAreaData(activeView, 'routine', [...routineTasks, { id: generateUniqueId('task'), text: newRoutineTask.trim(), completed: false }]);
                                    setNewRoutineTask("");
                                }
                            }} placeholder="Nuova attività day-by-day..." className="flex-grow border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                            <Button variant="secondary" onClick={() => {
                                if(newRoutineTask.trim()) {
                                    updateAreaData(activeView, 'routine', [...routineTasks, { id: generateUniqueId('task'), text: newRoutineTask.trim(), completed: false }]);
                                    setNewRoutineTask("");
                                }
                            }}>Aggiungi</Button>
                        </div>
                    )}
                    {routineTasks.map(t => (
                        <div key={t.id} id={`target-routine-${t.id}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl group/task border border-gray-100">
                            <button onClick={() => {
                                if(isEditor) updateAreaData(activeView, 'routine', routineTasks.map(rt => rt.id === t.id ? { ...rt, completed: !rt.completed } : rt));
                            }} className={`w-5 h-5 min-w-[20px] min-h-[20px] mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${t.completed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200'}`} disabled={!isEditor}>
                                {t.completed && <Check size={12} strokeWidth={3}/>}
                            </button>
                            <textarea value={t.text} onChange={(e) => { 
                                e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; 
                                updateAreaData(activeView, 'routine', routineTasks.map(rt => rt.id === t.id ? { ...rt, text: e.target.value } : rt));
                            }} ref={el => { if(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} rows={1} disabled={!isEditor} className={`flex-grow bg-transparent border-0 p-0 text-sm focus:ring-0 resize-none overflow-hidden pt-0.5 ${t.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`} />
                            {isEditor && <button onClick={() => {
                                updateAreaData(activeView, 'routine', routineTasks.filter(rt => rt.id !== t.id));
                            }} className="opacity-0 group-hover/task:opacity-100 text-gray-300 hover:text-red-500 mt-0.5"><X size={16}/></button>}
                        </div>
                    ))}
                </div>
            );
        } else if (block.type === 'text') {
            Icon = AlignLeft;
            isCustomText = true;
            const contentKey = block.contentId || `custom_text_${block.id}`;
            blockContent = <AdvancedEditor value={data[contentKey] || ''} onChange={(v) => updateAreaData(activeView, contentKey, v)} disabled={!isEditor} placeholder="Scrivi qui il contenuto personalizzato..." />;
        }

        return (
            <div key={block.id} className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden mb-6 group/block animate-fadeIn">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow pr-4">
                        <Icon size={18} className="text-gray-400" />
                        {isCustomText || !isStandard ? (
                            <input 
                                type="text" value={titleText} 
                                onChange={(e) => updateBlockTitle(block.id, e.target.value)} 
                                disabled={!isEditor}
                                className="bg-transparent border-0 focus:ring-0 p-0 font-bold text-gray-900 text-lg w-full placeholder-gray-400"
                                placeholder="Titolo della sezione..." 
                            />
                        ) : (
                            <span className="font-bold text-gray-900 text-lg">{titleText}</span>
                        )}
                    </div>
                    {isEditor && (
                        <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                            <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowUp size={16}/></button>
                            <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowDown size={16}/></button>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <button onClick={() => removeBlock(block.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                    )}
                </div>
                <div className={block.type === 'gantt' ? '' : 'p-6'}>
                    {blockContent}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn relative pb-32">
            
            {/* Modal Note */}
            {isNotesOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b">
                            <h3 className="font-bold flex items-center gap-2"><StickyNote size={18} className="text-yellow-600" /> Note Area</h3>
                            <button onClick={() => setIsNotesOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <AdvancedEditor value={data.comments || ''} onChange={(val) => updateAreaData(activeView, 'comments', val)} disabled={!isEditor} />
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER FISSO AREA */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 relative z-40">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl text-white shadow-lg" style={{ backgroundColor: area.hex }}><area.icon size={32} /></div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{area.label}</h2>
                            <button onClick={() => setIsNotesOpen(true)} className="text-xs mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 transition-colors">
                                <StickyNote size={12} /> Note di Lavoro
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 rounded-2xl p-4 min-w-[220px] shadow-xl border border-white/10 relative">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-bold tracking-[2px] text-yellow-500/80">Ruolo Strategico</span>
                                <button onClick={() => setIsLegendOpen(!isLegendOpen)} className="text-white/40 hover:text-white"><Info size={14}/></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{currentRole.icon}</span>
                                <select value={currentRole.value} onChange={(e) => updateAreaData(activeView, 'importance', parseInt(e.target.value))} disabled={!isEditor} className="bg-transparent border-0 p-0 text-white font-bold text-lg focus:ring-0 cursor-pointer w-full">
                                    {STRATEGIC_ROLES.map(r => <option key={r.id} value={r.value} className="text-slate-900">{r.label}</option>)}
                                </select>
                            </div>
                            
                            {isLegendOpen && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setIsLegendOpen(false)}></div>
                                    <div className="absolute top-[calc(100%+12px)] right-0 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-[70] overflow-hidden animate-fadeIn">
                                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                            <h3 className="font-bold text-gray-900 text-sm">Legenda Ruolo Strategico</h3>
                                            <button onClick={() => setIsLegendOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                                        </div>
                                        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                            {STRATEGIC_ROLES.map(role => (
                                                <div key={role.id}>
                                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-1.5 text-sm"><span className="text-lg">{role.icon}</span> {role.title}</h4>
                                                    <p className="text-xs text-gray-600 leading-relaxed font-normal">{role.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- RENDER DEI BLOCCHI DINAMICI --- */}
            <div className="space-y-6">
                {blocks.map((block, idx) => renderBlock(block, idx))}
            </div>

            {/* --- TOOLBAR AGGIUNTA BLOCCHI --- */}
            {isEditor && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
                    <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-full p-2 shadow-2xl flex items-center gap-2">
                        <Button onClick={() => setBlockMenuOpen(!blockMenuOpen)} variant="primary" className="rounded-full px-6 py-3 shadow-lg flex items-center gap-2">
                            <PlusCircle size={20}/> Aggiungi Modulo
                        </Button>
                        
                        {blockMenuOpen && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeInFast p-2">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-3 px-4">Moduli Standard</div>
                                <button onClick={() => addCustomBlock('objectives')} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 rounded-2xl transition-colors"><Target size={16} className="text-red-500"/> Obiettivi Macro</button>
                                <button onClick={() => addCustomBlock('phasing')} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 rounded-2xl transition-colors"><Calendar size={16} className="text-blue-500"/> Phasing Qualitativo</button>
                                <button onClick={() => addCustomBlock('gantt')} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 rounded-2xl transition-colors"><Calendar size={16} className="text-purple-500"/> Gantt Iniziative</button>
                                <button onClick={() => addCustomBlock('ksms')} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 rounded-2xl transition-colors"><Target size={16} className="text-green-500"/> Metriche KSM</button>
                                <button onClick={() => addCustomBlock('routine')} className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex items-center gap-3 rounded-2xl transition-colors"><Clock size={16} className="text-yellow-500"/> Attività a Regime</button>
                                
                                <div className="h-px bg-gray-100 my-2 mx-2"></div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-3 px-4">Moduli Custom</div>
                                <button onClick={() => addCustomBlock('text')} className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 rounded-2xl transition-colors font-medium"><AlignLeft size={16} className="text-blue-500"/> Box di Testo Formattato</button>
                                <button disabled className="w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-gray-400 cursor-not-allowed opacity-50"><Layout size={16}/> Tabella Dinamica (Soon)</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreaEditor;
