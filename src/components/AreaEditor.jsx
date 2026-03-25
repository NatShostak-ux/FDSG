import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, X, Check, Info, ChevronDown, ChevronUp, AlignLeft, ArrowUp, ArrowDown, LayoutGrid, Layout } from 'lucide-react';
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

// --- EXCEL PARSER ---
// Questo parser intelligente decodifica il formato "CSV" usato dalla clipboard di Excel/Sheets,
// rispettando le virgolette per le celle multi-riga.
const parseExcelString = (text) => {
    let rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        let nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"'; // virgolette escapate
                i++; // salta la prossima
            } else {
                inQuotes = !inQuotes; // toggle stato
            }
        } else if (char === '\t' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    currentRow.push(currentCell);
    if (currentRow.length > 0 || rows.length > 0) {
        rows.push(currentRow);
    }
    
    // Pulisce l'ultima riga se è un artefatto vuoto
    if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
        rows.pop();
    }
    return rows;
};

const AreaEditor = ({ activeView, activeScenario, updateAreaData, updateProject, updateProjectBatch, updateKSM, isEditor = false, searchFocusItem = null, onFocusHandled }) => {
    
    // --- STATI LOCALI ---
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [newRoutineTasks, setNewRoutineTasks] = useState({});
    const [expandedKSMs, setExpandedKSMs] = useState({});
    const [blockMenuOpen, setBlockMenuOpen] = useState(false);
    
    // REF per il menu dei blocchi (chiusura cliccando fuori)
    const blockMenuRef = useRef(null);
    const blockButtonRef = useRef(null);

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
    const currentRole = getStrategicRole(data.importance);

    // Autoseleziona il primo progetto disponibile nel primo blocco Gantt utile
    useEffect(() => {
        if (!selectedProjectId) {
            for (let b of blocks) {
                if (b.type === 'gantt') {
                    const pk = b.id === 'std_gantt' ? 'projects' : `${b.id}_projects`;
                    if (data[pk] && data[pk].length > 0) {
                        setSelectedProjectId(data[pk][0].id);
                        break;
                    }
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeView, blocks]);

    // --- GESTIONE CLIC ESTERNO PER MENU BLOCCHI ---
    useEffect(() => {
        function handleClickOutside(event) {
            if (blockMenuOpen && 
                blockMenuRef.current && !blockMenuRef.current.contains(event.target) &&
                blockButtonRef.current && !blockButtonRef.current.contains(event.target)) {
                setBlockMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [blockMenuOpen]);

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
                    el.style.boxShadow = '0 0 0 6px rgba(191, 144, 0, 0.4), 0 0 40px rgba(191, 144, 0, 0.2)'; 
                    el.style.backgroundColor = '#fdfdfc';
                    setTimeout(() => {
                        el.style.boxShadow = 'none';
                        el.style.backgroundColor = 'transparent';
                        if (onFocusHandled) onFocusHandled();
                    }, 2000);
                }
            }, 150);
        }
    }, [searchFocusItem, activeView, onFocusHandled]);

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
        if (!isEditor || !window.confirm("Vuoi davvero rimuovere questa sezione? I dati rimarranno nel database ma non saranno più visibili in quest'area.")) return;
        updateAreaData(activeView, 'blocks', blocks.filter(b => b.id !== blockId));
    };

    const addBlock = (type) => {
        if (!isEditor) return;
        
        let newBlock = {
            id: generateUniqueId('block'),
            type,
            title: ''
        };

        switch (type) {
            case 'objectives': newBlock.title = 'Nuovi Obiettivi Macro'; break;
            case 'phasing': newBlock.title = 'Nuovo Phasing Qualitativo'; break;
            case 'gantt': newBlock.title = 'Nuova Pianificazione Iniziative'; break;
            case 'ksms': newBlock.title = 'Nuove Metriche KSM'; break;
            case 'routine': newBlock.title = 'Nuove Attività a Regime'; break;
            case 'text': newBlock.title = 'Nuova Sezione Testo'; newBlock.contentId = generateUniqueId('content'); break;
            case 'table': newBlock.title = 'Nuova Tabella Dinamica'; newBlock.contentId = generateUniqueId('table'); break;
            default: break;
        }

        updateAreaData(activeView, 'blocks', [...blocks, newBlock]);
        setBlockMenuOpen(false);

        setTimeout(() => {
            const newElement = document.getElementById(`block-wrapper-${newBlock.id}`);
            if (newElement) {
                newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                newElement.style.transition = 'all 0.5s ease-out';
                newElement.style.boxShadow = '0 0 0 6px rgba(191, 144, 0, 0.4)';
                setTimeout(() => {
                    newElement.style.boxShadow = 'none';
                }, 1500);
            } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        }, 150);
    };

    const updateBlockTitle = (blockId, newTitle) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, title: newTitle } : b);
        updateAreaData(activeView, 'blocks', newBlocks);
    };

    const handleEnablerKeyDown = (e, index, projectId, currentEnablers, updateFn) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newEnablers = [...currentEnablers];
            newEnablers.splice(index + 1, 0, "");
            updateFn(projectId, 'enablers', newEnablers);
            setTimeout(() => document.querySelectorAll(`.enabler-input-${projectId}`)[index + 1]?.focus(), 10);
        }
    };

    if (!area) return null;

    // --- RENDERER PIATTO DEI BLOCCHI ---
    const renderBlock = (block, index) => {
        const isLegacy = block.id.startsWith('std_');
        let blockContent = null;
        let Icon = Target;
        let actionBtn = null;
        let titleText = block.title;

        if (block.type === 'objectives') {
            Icon = Target;
            const objKey = isLegacy ? 'objectives' : `${block.id}_objectives`;
            blockContent = (
                <div id={isLegacy ? "target-objective" : `target-${block.id}`}>
                    <AdvancedEditor key={`obj-${block.id}-${activeView}`} value={data[objKey] || ''} onChange={(val) => updateAreaData(activeView, objKey, val)} disabled={!isEditor} placeholder="Inserisci gli obiettivi..." />
                </div>
            );
        } else if (block.type === 'phasing') {
            Icon = Calendar;
            blockContent = (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[1, 2, 3].map(y => {
                        const phaseKey = isLegacy ? `evolution_y${y}` : `${block.id}_y${y}`;
                        return (
                            <div key={y} id={isLegacy ? `target-phasing-${y}` : undefined} className="bg-slate-50 border border-gray-100 p-4 rounded-xl h-full flex flex-col transition-all hover:bg-white hover:shadow-sm">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Anno {y}</div>
                                <div className="bg-white border border-gray-200 rounded-lg flex-grow overflow-hidden">
                                    <AdvancedEditor key={`phasing-${y}-${block.id}-${activeView}`} value={data[phaseKey] || ''} onChange={(v) => updateAreaData(activeView, phaseKey, v)} disabled={!isEditor} placeholder={`Focus Anno ${y}...`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } else if (block.type === 'gantt') {
            Icon = Calendar;
            const projKey = isLegacy ? 'projects' : `${block.id}_projects`;
            const blockRawProjects = Array.isArray(data[projKey]) ? data[projKey] : [];
            const blockProjects = blockRawProjects.map(p => ({ ...p, areaId: area?.id }));
            const blockSelectedProject = blockProjects.find(p => p.id === selectedProjectId);

            const handleUpdateProject = (projectId, field, value) => {
                const updated = blockRawProjects.map(p => p.id === projectId ? { ...p, [field]: value } : p);
                updateAreaData(activeView, projKey, updated);
            };

            const handleUpdateProjectBatch = (areaId, projectId, updates) => {
                const updated = blockRawProjects.map(p => p.id === projectId ? { ...p, ...updates } : p);
                updateAreaData(activeView, projKey, updated);
            };

            actionBtn = (
                <button onClick={() => {
                    const newId = generateUniqueId('proj');
                    updateAreaData(activeView, projKey, [...blockRawProjects, { id: newId, title: '', description: '', enablers: [""], start: `${GANTT_START_YEAR}-01`, end: `${GANTT_START_YEAR}-04`, impact: 5, effort: 5, budgetMin: 0, budgetMax: 0 }]);
                    setSelectedProjectId(newId);
                }} className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
                    <Plus size={16} /> Aggiungi Progetto
                </button>
            );

            blockContent = (
                <>
                    <div className="p-4 bg-white border-b border-gray-100">
                        <GanttChart projects={blockProjects} areas={EXPERTISE_AREAS} activeAreaId={area.id} onUpdateProject={handleUpdateProjectBatch} isEditor={isEditor} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
                    </div>
                    <div className="p-6 bg-slate-50/30" id={isLegacy ? "target-project-details" : undefined}>
                        {blockSelectedProject ? (
                            <div className="space-y-6 w-full">
                                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                                    <input type="text" className="w-full text-2xl font-bold border-0 focus:ring-0 p-0 bg-transparent" style={{ color: area.hex }} value={blockSelectedProject.title} onChange={(e) => handleUpdateProject(blockSelectedProject.id, 'title', e.target.value)} disabled={!isEditor} placeholder="Nome del progetto..." />
                                    {isEditor && <button onClick={() => {
                                        const newProjects = blockRawProjects.filter(p => p.id !== blockSelectedProject.id);
                                        updateAreaData(activeView, projKey, newProjects);
                                        setSelectedProjectId(newProjects.length > 0 ? newProjects[0].id : null);
                                    }} className="text-gray-300 hover:text-red-500 ml-4"><Trash2 size={18}/></button>}
                                </div>
                                
                                <div className="space-y-6 w-full">
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2.5 px-3 shadow-sm">
                                            <Calendar size={16} className="text-gray-400" />
                                            <input type="month" value={blockSelectedProject.start} onChange={(e) => handleUpdateProject(blockSelectedProject.id, 'start', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold text-gray-800 focus:ring-0 w-28" />
                                            <span className="text-gray-300">→</span>
                                            <input type="month" value={blockSelectedProject.end} onChange={(e) => handleUpdateProject(blockSelectedProject.id, 'end', e.target.value)} disabled={!isEditor} className="bg-transparent border-0 p-0 text-sm font-bold text-gray-800 focus:ring-0 w-28 text-right" />
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Prio</span>
                                                <input type="number" min="1" max="10" value={blockSelectedProject.impact} onChange={(e) => handleUpdateProject(blockSelectedProject.id, 'impact', parseInt(e.target.value))} disabled={!isEditor} className="w-14 bg-white border border-gray-200 shadow-sm rounded-lg text-lg font-bold text-center h-11 focus:ring-2 focus:ring-blue-100" style={{ color: area.hex }} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Eff</span>
                                                <input type="number" min="1" max="10" value={blockSelectedProject.effort} onChange={(e) => handleUpdateProject(blockSelectedProject.id, 'effort', parseInt(e.target.value))} disabled={!isEditor} className="w-14 bg-white border border-gray-200 shadow-sm rounded-lg text-lg font-bold text-center h-11 focus:ring-2 focus:ring-blue-100 text-gray-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 w-full">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Descrizione Iniziativa</label>
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm w-full">
                                            <AdvancedEditor key={`proj-desc-${blockSelectedProject.id}`} value={blockSelectedProject.description || ''} onChange={(v) => handleUpdateProject(blockSelectedProject.id, 'description', v)} disabled={!isEditor} placeholder="Aggiungi una descrizione dettagliata..." />
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-slate-50 border border-gray-200 rounded-xl p-5 w-full shadow-sm">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Abilitatori Chiave (Key Enablers)</label>
                                        <div className="space-y-2 w-full">
                                            {(blockSelectedProject.enablers || [""]).map((en, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-2.5 border border-gray-100 shadow-sm group transition-all hover:border-gray-200 w-full">
                                                    <div className="w-2 h-2 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                                                    <input type="text" value={en} className={`enabler-input-${blockSelectedProject.id} flex-grow text-sm bg-transparent border-0 focus:ring-0 p-0 font-medium text-gray-700 w-full`} onChange={(e) => {
                                                        const next = [...(blockSelectedProject.enablers || [""])]; next[i] = e.target.value;
                                                        handleUpdateProject(blockSelectedProject.id, 'enablers', next);
                                                    }} onKeyDown={(e) => handleEnablerKeyDown(e, i, blockSelectedProject.id, blockSelectedProject.enablers || [""], handleUpdateProject)} disabled={!isEditor} placeholder="Aggiungi abilitatore..." />
                                                    {isEditor && <button onClick={() => {
                                                        const next = blockSelectedProject.enablers.filter((_, idx) => idx !== i);
                                                        handleUpdateProject(blockSelectedProject.id, 'enablers', next.length ? next : [""]);
                                                    }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity"><X size={14}/></button>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : <p className="text-center text-gray-400 italic py-16">{"Seleziona un'iniziativa dal Gantt per visualizzare i dettagli"}</p>}
                    </div>
                </>
            );
        } else if (block.type === 'ksms') {
            Icon = Target;
            const ksmsKey = isLegacy ? 'ksms' : `${block.id}_ksms`;
            const blockKsms = Array.isArray(data[ksmsKey]) ? data[ksmsKey] : [];

            const handleUpdateKSM = (ksmId, field, value) => {
                const updated = blockKsms.map(k => k.id === ksmId ? { ...k, [field]: value } : k);
                updateAreaData(activeView, ksmsKey, updated);
            };

            actionBtn = (
                <button onClick={() => {
                    const newId = generateUniqueId('ksm');
                    updateAreaData(activeView, ksmsKey, [...blockKsms, { id: newId, name: '', valueAsIs: '', targetValue: '', description: '' }]);
                    setExpandedKSMs(prev => ({ ...prev, [newId]: true }));
                }} className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 transition-colors">
                    <Plus size={16} /> Aggiungi Metrica
                </button>
            );

            blockContent = (
                <div className="space-y-4 p-6 bg-slate-50/30">
                    {blockKsms.map(ksm => {
                        const isExpanded = expandedKSMs[ksm.id];
                        return (
                            <div key={ksm.id} id={isLegacy ? `target-ksm-${ksm.id}` : undefined} className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm transition-all hover:border-gray-300">
                                <div className="flex justify-between items-center p-4">
                                    <input type="text" value={ksm.name} onChange={(e) => handleUpdateKSM(ksm.id, 'name', e.target.value)} className="font-bold border-0 p-0 focus:ring-0 w-full text-lg Outfit placeholder-gray-300" disabled={!isEditor} placeholder="Nome della metrica..." />
                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                        {isEditor && <button onClick={() => {
                                            updateAreaData(activeView, ksmsKey, blockKsms.filter(k => k.id !== ksm.id));
                                        }} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>}
                                        <button onClick={() => setExpandedKSMs(prev => ({ ...prev, [ksm.id]: !prev[ksm.id] }))} className="bg-slate-50 hover:bg-slate-100 p-2 rounded-lg text-gray-500 transition-colors">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="p-4 pt-0 bg-slate-50/50 border-t border-gray-100">
                                        <div className="grid grid-cols-2 gap-4 my-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                            <div>
                                                <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Attuale (As Is)</span>
                                                <input type="text" value={ksm.valueAsIs} onChange={(e) => handleUpdateKSM(ksm.id, 'valueAsIs', e.target.value)} className="w-full bg-transparent border-0 p-0 font-medium text-sm text-gray-700 Outfit" disabled={!isEditor} placeholder="€ 100k" />
                                            </div>
                                            <div className="border-l border-gray-100 pl-4">
                                                <span className="text-[10px] uppercase text-blue-400 font-bold block mb-1">Target Obiettivo</span>
                                                <input type="text" value={ksm.targetValue} onChange={(e) => handleUpdateKSM(ksm.id, 'targetValue', e.target.value)} className="w-full bg-transparent border-0 p-0 font-bold text-blue-600 text-sm Outfit" disabled={!isEditor} placeholder="€ 500k" />
                                            </div>
                                        </div>
                                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                            <AdvancedEditor key={`ksm-desc-${ksm.id}`} value={ksm.description || ''} onChange={(v) => handleUpdateKSM(ksm.id, 'description', v)} disabled={!isEditor} placeholder="Descrizione metrica..." />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        } else if (block.type === 'routine') {
            Icon = Clock;
            const routineKey = isLegacy ? 'routine' : `${block.id}_routine`;
            const blockRoutine = Array.isArray(data[routineKey]) ? data[routineKey] : [];
            const currentNewTask = newRoutineTasks[block.id] || "";
            
            const handleAddRoutine = () => {
                if(currentNewTask.trim()) {
                    updateAreaData(activeView, routineKey, [...blockRoutine, { id: generateUniqueId('task'), text: currentNewTask.trim(), completed: false }]);
                    setNewRoutineTasks(prev => ({...prev, [block.id]: ""}));
                }
            };

            blockContent = (
                <div className="space-y-2 p-6">
                    <p className="text-sm text-gray-500 font-medium italic mb-5 ml-1">Attività incrementali e trasformative rispetto al modello attuale</p>
                    {isEditor && (
                        <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl border border-gray-100 transition-colors focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-200 shadow-sm">
                            <input type="text" value={currentNewTask} onChange={(e) => setNewRoutineTasks(prev => ({...prev, [block.id]: e.target.value}))} onKeyDown={(e) => {
                                if(e.key === 'Enter') handleAddRoutine();
                            }} placeholder="Descrivi la nuova attività day-by-day..." className="flex-grow border-0 px-3 py-2.5 text-sm outline-none focus:ring-0" />
                            <Button variant="secondary" onClick={handleAddRoutine} className="py-2.5 px-6 rounded-lg font-semibold">Aggiungi</Button>
                        </div>
                    )}
                    {blockRoutine.map(t => (
                        <div key={t.id} id={isLegacy ? `target-routine-${t.id}` : undefined} className="flex items-start gap-3 p-3 bg-white rounded-xl group/task border border-gray-100 transition-all hover:bg-slate-50 shadow-sm">
                            <button onClick={() => {
                                if(isEditor) updateAreaData(activeView, routineKey, blockRoutine.map(rt => rt.id === t.id ? { ...rt, completed: !rt.completed } : rt));
                            }} className={`w-5 h-5 min-w-[20px] min-h-[20px] mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${t.completed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200'}`} disabled={!isEditor}>
                                {t.completed && <Check size={12} strokeWidth={3}/>}
                            </button>
                            <textarea value={t.text} onChange={(e) => { 
                                e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; 
                                updateAreaData(activeView, routineKey, blockRoutine.map(rt => rt.id === t.id ? { ...rt, text: e.target.value } : rt));
                            }} ref={el => { if(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} rows={1} disabled={!isEditor} className={`flex-grow bg-transparent border-0 p-0 text-sm focus:ring-0 resize-none overflow-hidden pt-0.5 ${t.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`} />
                            {isEditor && <button onClick={() => {
                                updateAreaData(activeView, routineKey, blockRoutine.filter(rt => rt.id !== t.id));
                            }} className="opacity-0 group-hover/task:opacity-100 text-gray-300 hover:text-red-500 mt-0.5 ml-2"><X size={16}/></button>}
                        </div>
                    ))}
                </div>
            );
        } else if (block.type === 'text') {
            Icon = AlignLeft;
            const contentKey = block.contentId || `custom_text_${block.id}`;
            blockContent = (
                <div className="p-6">
                    <AdvancedEditor key={`custom-${contentKey}`} value={data[contentKey] || ''} onChange={(v) => updateAreaData(activeView, contentKey, v)} disabled={!isEditor} placeholder="Scrivi qui il contenuto personalizzato... (Testo Formattato)" />
                </div>
            );
        } else if (block.type === 'table') {
            Icon = Layout;
            const contentKey = block.contentId || `custom_table_${block.id}`;
            const tableData = data[contentKey] || {
                headers: ['Colonna 1', 'Colonna 2', 'Colonna 3'],
                rows: [
                    { id: generateUniqueId('r1'), cells: ['', '', ''] },
                    { id: generateUniqueId('r2'), cells: ['', '', ''] }
                ]
            };

            const handleTableUpdate = (newTableData) => {
                updateAreaData(activeView, contentKey, newTableData);
            };

            const addCol = () => {
                const newHeaders = [...tableData.headers, `Colonna ${tableData.headers.length + 1}`];
                const newRows = tableData.rows.map(r => ({ ...r, cells: [...r.cells, ''] }));
                handleTableUpdate({ headers: newHeaders, rows: newRows });
            };

            const addRow = () => {
                const newRow = { id: generateUniqueId('row'), cells: Array(tableData.headers.length).fill('') };
                handleTableUpdate({ ...tableData, rows: [...tableData.rows, newRow] });
            };

            // LOGICA INTEGRAZIONE EXCEL PASTE
            const handlePaste = (e, rowIndex, colIndex) => {
                const pasteData = e.clipboardData.getData('text');
                if (!pasteData) return;

                const parsedRows = parseExcelString(pasteData);

                // Se l'utente sta incollando UNA SOLA cella da Excel, 
                // lasciamo fare il paste nativo per inserire il testo alla posizione del cursore!
                if (parsedRows.length === 1 && parsedRows[0].length === 1) {
                    // C'è un piccolo trick: se Excel ha avvolto il testo in virgolette, il parser le ha tolte.
                    // Per evitare che l'utente si becchi le virgolette di Excel, sostituiamo il testo
                    const textarea = e.target;
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const textToInsert = parsedRows[0][0]; 
                    
                    const currentCellText = tableData.rows[rowIndex].cells[colIndex] || "";
                    const newText = currentCellText.substring(0, start) + textToInsert + currentCellText.substring(end);
                    
                    const newRows = [...tableData.rows];
                    newRows[rowIndex].cells[colIndex] = newText;
                    
                    e.preventDefault();
                    handleTableUpdate({ ...tableData, rows: newRows });
                    return;
                }

                // Incolla multiplo (Copia/Incolla di un range di celle Excel)
                e.preventDefault();
                let updatedRows = tableData.rows.map(r => ({ ...r, cells: [...r.cells] }));

                parsedRows.forEach((rowArray, i) => {
                    const targetRowIndex = rowIndex + i;

                    // Espansione automatica delle righe
                    if (targetRowIndex >= updatedRows.length) {
                        updatedRows.push({
                            id: generateUniqueId('row_auto'),
                            cells: Array(tableData.headers.length).fill('')
                        });
                    }

                    rowArray.forEach((cellText, j) => {
                        const targetColIndex = colIndex + j;
                        // Restringiamo l'incolla solo alle colonne attualmente esistenti
                        if (targetColIndex < tableData.headers.length) {
                            updatedRows[targetRowIndex].cells[targetColIndex] = cellText;
                        }
                    });
                });

                handleTableUpdate({ ...tableData, rows: updatedRows });
            };

            blockContent = (
                <div className="space-y-4 p-6">
                    <div className="w-full overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm custom-scrollbar pb-2">
                        <table className="w-full text-left border-collapse" style={{ minWidth: 'max-content' }}>
                            <thead>
                                <tr>
                                    {tableData.headers.map((h, i) => (
                                        <th key={i} className="bg-slate-50 border-b border-r border-gray-200 p-0 relative group/th last:border-r-0 align-top" style={{ minWidth: '280px', width: '280px', maxWidth: '280px' }}>
                                            <div className="flex w-full">
                                                <input
                                                    type="text"
                                                    value={h}
                                                    onChange={(e) => {
                                                        const newH = [...tableData.headers];
                                                        newH[i] = e.target.value;
                                                        handleTableUpdate({ ...tableData, headers: newH });
                                                    }}
                                                    disabled={!isEditor}
                                                    className="w-full bg-transparent border-0 font-bold text-[11px] uppercase tracking-widest text-gray-700 p-4 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                    placeholder={`Nome Colonna ${i+1}`}
                                                />
                                                {isEditor && tableData.headers.length > 1 && (
                                                    <button onClick={() => {
                                                        if(!window.confirm("Vuoi davvero eliminare questa colonna? I dati andranno persi.")) return;
                                                        const newH = tableData.headers.filter((_, idx) => idx !== i);
                                                        const newR = tableData.rows.map(r => ({ ...r, cells: r.cells.filter((_, idx) => idx !== i) }));
                                                        handleTableUpdate({ headers: newH, rows: newR });
                                                    }} className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/th:opacity-100 text-gray-400 hover:text-red-500 transition-opacity bg-white border border-gray-200 shadow-sm rounded p-1">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.rows.map((row, rowIndex) => (
                                    <tr key={row.id} className="group/tr border-b border-gray-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        {row.cells.map((cell, colIndex) => (
                                            <td key={`${row.id}-${colIndex}`} className="border-r border-gray-100 last:border-r-0 p-0 relative align-top" style={{ minWidth: '280px', width: '280px', maxWidth: '280px' }}>
                                                <textarea
                                                    value={cell}
                                                    onChange={(e) => {
                                                        const newRows = [...tableData.rows];
                                                        newRows[rowIndex].cells[colIndex] = e.target.value;
                                                        handleTableUpdate({ ...tableData, rows: newRows });
                                                    }}
                                                    onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                                                    disabled={!isEditor}
                                                    rows={1}
                                                    className="w-full bg-transparent border-0 text-sm text-gray-700 p-4 focus:ring-2 focus:ring-blue-100 outline-none resize-none overflow-hidden Outfit transition-all"
                                                    style={{ minHeight: '56px' }}
                                                    ref={el => { if(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                                    placeholder="Inserisci testo o incolla da Excel..."
                                                />
                                                {isEditor && tableData.rows.length > 1 && colIndex === tableData.headers.length - 1 && (
                                                    <button onClick={() => {
                                                        const newRows = tableData.rows.filter((_, idx) => idx !== rowIndex);
                                                        handleTableUpdate({ ...tableData, rows: newRows });
                                                    }} className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover/tr:opacity-100 text-gray-300 hover:text-red-500 transition-opacity p-1.5 bg-white rounded shadow border border-gray-200 z-10">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {isEditor && (
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={addRow} className="text-xs py-2 px-4 font-semibold flex items-center gap-1.5 shadow-sm">
                                <Plus size={14} /> Aggiungi Riga
                            </Button>
                            <Button variant="secondary" onClick={addCol} className="text-xs py-2 px-4 font-semibold flex items-center gap-1.5 shadow-sm">
                                <Plus size={14} /> Aggiungi Colonna
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div id={`block-wrapper-${block.id}`} key={block.id} className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden mb-6 group/block animate-fadeIn">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 flex-grow pr-4">
                        <Icon size={18} className="text-gray-400" />
                        <input 
                            type="text" value={titleText} 
                            onChange={(e) => updateBlockTitle(block.id, e.target.value)} 
                            disabled={!isEditor}
                            className="bg-transparent border-0 focus:ring-0 p-0 font-bold text-gray-900 text-lg w-full placeholder-gray-400 Outfit hover:bg-gray-100/50 transition-colors rounded px-2 -ml-2"
                            placeholder="Dai un titolo a questa sezione..." 
                        />
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {actionBtn && isEditor && (
                            <div>{actionBtn}</div>
                        )}
                        
                        {isEditor && (
                            <div className="flex items-center gap-1.5 opacity-0 group-hover/block:opacity-100 transition-all ml-2">
                                <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-20"><ArrowUp size={16}/></button>
                                <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-20"><ArrowDown size={16}/></button>
                                <div className="w-px h-5 bg-gray-200 mx-1.5"></div>
                                <button onClick={() => removeBlock(block.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>
                <div className={block.type === 'gantt' ? '' : (block.type === 'ksms' ? '' : (block.type === 'table' ? '' : 'p-6'))}>
                    {blockContent}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn relative pb-32 Outfit">
            
            {/* Modal Note */}
            {isNotesOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="bg-gray-100/50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2"><StickyNote size={18} className="text-yellow-600" /> Note di Lavoro Area</h3>
                            <button onClick={() => setIsNotesOpen(false)} className="text-gray-500 hover:text-gray-900"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <AdvancedEditor key={`notes-area-${activeView}`} value={data.comments || ''} onChange={(val) => updateAreaData(activeView, 'comments', val)} disabled={!isEditor} placeholder="Aggiungi note personali su questa area, non visibili nel PDF." />
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER FISSO AREA */}
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 relative z-40 transition-shadow hover:shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl text-white shadow-lg" style={{ backgroundColor: area.hex }}><area.icon size={32} /></div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{area.label}</h2>
                            <button onClick={() => setIsNotesOpen(true)} className="text-xs mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100 hover:bg-yellow-100 transition-colors font-semibold">
                                <StickyNote size={12} /> Note di Lavoro
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 rounded-2xl p-4 min-w-[220px] shadow-2xl border border-white/10 relative">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase font-bold tracking-[2.5px] text-yellow-500/80">Ruolo Strategico</span>
                                <button onClick={() => setIsLegendOpen(!isLegendOpen)} className="text-white/40 hover:text-white"><Info size={14}/></button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{currentRole.icon}</span>
                                <select value={currentRole.value} onChange={(e) => updateAreaData(activeView, 'importance', parseInt(e.target.value))} disabled={!isEditor} className="bg-transparent border-0 p-0 text-white font-bold text-lg focus:ring-0 cursor-pointer w-full Outfit">
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
                                        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar Outfit text-sm">
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

            {/* --- TOOLBAR AGGIUNTA BLOCCHI (Floating CTA GOLD) --- */}
            {isEditor && (
                <div className="fixed bottom-8 right-8 z-[100]" ref={blockButtonRef}>
                    <div className="relative">
                        <button 
                            onClick={() => setBlockMenuOpen(!blockMenuOpen)} 
                            className="bg-[#bf9000] text-white rounded-full h-14 border-[3px] border-white shadow-[0_8px_30px_rgba(191,144,0,0.4)] flex items-center transition-all duration-300 ease-in-out overflow-hidden group hover:w-[190px] w-14 justify-start px-[13px]"
                            title="Aggiungi un nuovo modulo all'area"
                        >
                            <div className="flex-shrink-0 flex items-center justify-center">
                                <LayoutGrid size={22}/>
                            </div>
                            <span className="font-bold text-sm whitespace-nowrap ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                                Aggiungi Modulo
                            </span>
                        </button>
                        
                        {blockMenuOpen && (
                            <div className="absolute bottom-full mb-4 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeInFast p-2 z-[61]" ref={blockMenuRef}>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-3 px-4 Outfit">{"Moduli Standard"}</div>
                                <button onClick={() => addBlock('objectives')} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3.5 rounded-2xl transition-colors Outfit hover:bg-slate-50">
                                    <Target size={16} className="text-red-500"/> 
                                    <span className="text-gray-700 font-medium">Obiettivi Macro</span>
                                </button>
                                
                                <button onClick={() => addBlock('phasing')} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3.5 rounded-2xl transition-colors Outfit hover:bg-slate-50">
                                    <Calendar size={16} className="text-blue-500"/> 
                                    <span className="text-gray-700 font-medium">Phasing Qualitativo</span>
                                </button>
                                
                                <button onClick={() => addBlock('gantt')} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3.5 rounded-2xl transition-colors Outfit hover:bg-slate-50">
                                    <Calendar size={16} className="text-purple-500"/> 
                                    <span className="text-gray-700 font-medium">Gantt Iniziative</span>
                                </button>
                                
                                <button onClick={() => addBlock('ksms')} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3.5 rounded-2xl transition-colors Outfit hover:bg-slate-50">
                                    <Target size={16} className="text-green-500"/> 
                                    <span className="text-gray-700 font-medium">Metriche KSM</span>
                                </button>
                                
                                <button onClick={() => addBlock('routine')} className="w-full text-left px-4 py-3 text-sm flex items-center gap-3.5 rounded-2xl transition-colors Outfit hover:bg-slate-50">
                                    <Clock size={16} className="text-yellow-600"/> 
                                    <span className="text-gray-700 font-medium">Attività a Regime</span>
                                </button>
                                
                                <div className="h-px bg-gray-100 my-2 mx-2"></div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest p-3 px-4 Outfit">Moduli Custom</div>
                                
                                <button onClick={() => addBlock('text')} className="w-full text-left px-4 py-3 text-sm hover:bg-gold-50 hover:text-gold-700 flex items-center gap-3.5 rounded-2xl transition-colors font-medium Outfit text-gray-800">
                                    <AlignLeft size={16} className="text-gold-500"/> Box di Testo Formattato
                                </button>
                                
                                <button onClick={() => addBlock('table')} className="w-full text-left px-4 py-3 text-sm hover:bg-gold-50 hover:text-gold-700 flex items-center gap-3.5 rounded-2xl transition-colors font-medium Outfit text-gray-800">
                                    <Layout size={16} className="text-gold-500"/> Tabella Dinamica
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreaEditor;
