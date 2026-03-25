import React, { useState, useEffect, useMemo } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, X, ChevronRight, Check, Info, ChevronDown, ChevronUp, AlignLeft, ArrowUp, ArrowDown, PlusCircle, Layout } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import AdvancedEditor from './AdvancedEditor';
import { GANTT_START_YEAR, EXPERTISE_AREAS, EMPTY_AREA_DATA } from '../utils/constants';

// --- COSTANTI RUOLI STRATEGICI ---
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
    const data = activeScenario.data[activeView] || { ...EMPTY_AREA_DATA };
    
    // LOGICA DI LAYOUT DINAMICO
    // Se non esistono blocchi, inizializziamo l'ordine standard
    const blocks = useMemo(() => {
        if (data.blocks && data.blocks.length > 0) return data.blocks;
        return [
            { id: 'std_obj', type: 'objectives', title: 'Obiettivi Macro' },
            { id: 'std_phasing', type: 'phasing', title: 'Descrizione Qualitativa del Phasing' },
            { id: 'std_gantt', type: 'gantt', title: 'Pianificazione Iniziative' },
            { id: 'std_ksms', type: 'ksms', title: 'Key Success Metrics (KSM)' },
            { id: 'std_routine', type: 'routine', title: 'Attivita a Regime' }
        ];
    }, [data.blocks]);

    const rawProjects = Array.isArray(data.projects) ? data.projects : [];
    const areaProjects = rawProjects.map(p => ({ ...p, areaId: area?.id }));
    const routineTasks = Array.isArray(data.routine) ? data.routine : [];
    const currentRole = getStrategicRole(data.importance);

    useEffect(() => {
        if (!selectedProjectId && areaProjects.length > 0) setSelectedProjectId(areaProjects[0].id);
    }, [activeView]);

    // --- HANDLERS LAYOUT ---
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
        if (!isEditor || !window.confirm("Vuoi davvero rimuovere questa sezione? I dati contenuti rimarranno nel database ma non saranno più visibili in quest'area.")) return;
        updateAreaData(activeView, 'blocks', blocks.filter(b => b.id !== blockId));
    };

    const addCustomBlock = (type) => {
        const newBlock = {
            id: generateUniqueId('block'),
            type,
            title: type === 'text' ? 'Nuova Sezione Testo' : 'Nuova Sezione',
            contentId: type === 'text' ? generateUniqueId('content') : null // Per differenziare contenuti di più blocchi testo
        };
        updateAreaData(activeView, 'blocks', [...blocks, newBlock]);
        setBlockMenuOpen(false);
    };

    const updateBlockTitle = (blockId, newTitle) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, title: newTitle } : b);
        updateAreaData(activeView, 'blocks', newBlocks);
    };

    // --- LOGICA SPECIFICA COMPONENTI STANDARD ---
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

    // --- RENDERER DEI BLOCCHI ---
    const renderBlock = (block, index) => {
        const isStandard = ['objectives', 'phasing', 'gantt', 'ksms', 'routine'].includes(block.type);
        
        // Wrapper comune per i controlli di movimento/cancellazione
        const BlockWrapper = ({ children, icon: Icon, title, isCustomText = false }) => (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden mb-6 group/block animate-fadeIn">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-grow">
                        <Icon size={18} className="text-gray-400" />
                        {isCustomText || !isStandard ? (
                            <input 
                                type="text" value={block.title} 
                                onChange={(e) => updateBlockTitle(block.id, e.target.value)} 
                                disabled={!isEditor}
                                className="bg-transparent border-0 focus:ring-0 p-0 font-bold text-gray-900 text-lg w-full"
                            />
                        ) : (
                            <span className="font-bold text-gray-900 text-lg">{title}</span>
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
                <div className={block.type === 'gantt' ? '' : 'p-6'}>{children}</div>
            </div>
        );

        switch (block.type) {
            case 'objectives':
                return (
                    <BlockWrapper key={block.id} icon={Target} title="Obiettivi Macro">
                        <AdvancedEditor value={data.objectives || ''} onChange={(val) => updateAreaData(activeView, 'objectives', val)} disabled={!isEditor} />
                    </BlockWrapper>
                );
            case 'phasing':
                return (
                    <BlockWrapper key={block.id} icon={Calendar} title="Descrizione Qualitativa del Phasing">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map(y => (
                                <div key={y} className="bg-gray-50 p-3 rounded-xl border border-gray-100 h-full">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2">Anno {y}</div>
                                    <AdvancedEditor value={data[`evolution_y${y}`] || ''} onChange={(v) => updateAreaData(activeView, `evolution_y${y}`, v)} disabled={!isEditor} />
                                </div>
                            ))}
                        </div>
                    </BlockWrapper>
                );
            case 'gantt':
                return (
                    <BlockWrapper key={block.id} icon={Calendar} title="Pianificazione Iniziative">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <GanttChart projects={areaProjects} areas={EXPERTISE_AREAS} onUpdateProject={updateProjectBatch} isEditor={isEditor} selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />
                        </div>
                        <div className="p-6">
                            {selectedProject ? (
                                <div className="space-y-6">
                                    <input type="text" className="w-full text-2xl font-bold border-0 border-b border-gray-100 focus:ring-0 p-0 pb-2" style={{ color: area.hex }} value={selectedProject.title} onChange={(e) => updateProject(activeView, selectedProject.id, 'title', e.target.value)} disabled={!isEditor} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Descrizione</label>
                                            <AdvancedEditor value={selectedProject.description || ''} onChange={(v) => updateProject(activeView, selectedProject.id, 'description', v)} disabled={!isEditor} />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Abilitatori</label>
                                            <div className="space-y-2">
                                                {(selectedProject.enablers || [""]).map((en, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                        <input type="text" value={en} className="flex-grow text-sm border-0 focus:ring-0 p-0" onChange={(e) => {
                                                            const next = [...selectedProject.enablers]; next[i] = e.target.value;
                                                            updateProject(activeView, selectedProject.id, 'enablers', next);
                                                        }} onKeyDown={(e) => handleEnablerKeyDown(e, i, selectedProject.id, selectedProject.enablers)} disabled={!isEditor} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : <p className="text-center text-gray-400 italic py-10">Seleziona un'iniziativa dal Gantt</p>}
                        </div>
                    </BlockWrapper>
                );
            case 'ksms':
                return (
                    <BlockWrapper key={block.id} icon={Target} title="Key Success Metrics (KSM)">
                        <div className="space-y-4">
                            {(data.ksms || []).map(ksm => (
                                <div key={ksm.id} className="border border-gray-200 rounded-xl p-4">
                                    <div className="flex justify-between mb-4">
                                        <input type="text" value={ksm.name} onChange={(e) => updateKSM(activeView, ksm.id, 'name', e.target.value)} className="font-bold border-0 p-0 focus:ring-0" disabled={!isEditor} placeholder="Nome Metrica" />
                                        {isEditor && <button onClick={() => removeKSM(ksm.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Attuale</span>
                                            <input type="text" value={ksm.valueAsIs} onChange={(e) => updateKSM(activeView, ksm.id, 'valueAsIs', e.target.value)} className="w-full bg-transparent border-0 p-0 font-medium" disabled={!isEditor} />
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <span className="text-[10px] uppercase text-blue-400 font-bold block mb-1">Target</span>
                                            <input type="text" value={ksm.targetValue} onChange={(e) => updateKSM(activeView, ksm.id, 'targetValue', e.target.value)} className="w-full bg-transparent border-0 p-0 font-bold text-blue-600" disabled={!isEditor} />
                                        </div>
                                    </div>
                                    <AdvancedEditor value={ksm.description || ''} onChange={(v) => updateKSM(activeView, ksm.id, 'description', v)} disabled={!isEditor} />
                                </div>
                            ))}
                            {isEditor && <Button variant="ghost" icon={Plus} onClick={addKSM}>Aggiungi Metrica</Button>}
                        </div>
                    </BlockWrapper>
                );
            case 'routine':
                return (
                    <BlockWrapper key={block.id} icon={Clock} title="Attività a Regime">
                        <p className="text-sm text-gray-500 mb-4 italic">Attività incrementali e trasformative rispetto al modello attuale</p>
                        <div className="space-y-2">
                            {routineTasks.map(t => (
                                <div key={t.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group/task">
                                    <button onClick={() => toggleRoutineTask(t.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${t.completed ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-gray-200'}`} disabled={!isEditor}>
                                        {t.completed && <Check size={12} strokeWidth={3}/>}
                                    </button>
                                    <input type="text" value={t.text} onChange={(e) => updateRoutineTaskText(t.id, e.target.value)} className={`flex-grow bg-transparent border-0 p-0 text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`} disabled={!isEditor} />
                                    {isEditor && <button onClick={() => removeRoutineTask(t.id)} className="opacity-0 group-hover/task:opacity-100 text-gray-300 hover:text-red-500"><X size={16}/></button>}
                                </div>
                            ))}
                            {isEditor && (
                                <div className="flex gap-2 mt-4">
                                    <input type="text" value={newRoutineTask} onChange={(e) => setNewRoutineTask(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddRoutineTask()} placeholder="Nuova attività..." className="flex-grow text-sm border border-gray-200 rounded-lg px-3 py-2" />
                                    <Button variant="secondary" onClick={handleAddRoutineTask}>Aggiungi</Button>
                                </div>
                            )}
                        </div>
                    </BlockWrapper>
                );
            case 'text':
                // Per i blocchi di testo custom, usiamo una chiave dinamica nel data dell'area
                const contentKey = block.contentId || `custom_text_${block.id}`;
                return (
                    <BlockWrapper key={block.id} icon={AlignLeft} title={block.title} isCustomText>
                        <AdvancedEditor value={data[contentKey] || ''} onChange={(v) => updateAreaData(activeView, contentKey, v)} disabled={!isEditor} placeholder="Scrivi qui il contenuto personalizzato..." />
                    </BlockWrapper>
                );
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn relative pb-32">
            
            {/* modale note */}
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
                        <div className="bg-slate-900 rounded-2xl p-4 min-w-[220px] shadow-xl border border-white/10">
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
