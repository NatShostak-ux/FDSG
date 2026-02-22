import React, { useState } from 'react';
import { StickyNote, Target, Calendar, Plus, Trash2, Clock, ShieldAlert, AlertTriangle, X, Sparkles } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import NotebookLMChat from './NotebookLMChat';
import AdvancedEditor from './AdvancedEditor';
import { ARAD_BLUE, ARAD_GOLD, GANTT_START_YEAR, GANTT_END_YEAR, EXPERTISE_AREAS, EMPTY_AREA_DATA } from '../utils/constants';

const AreaEditor = ({ activeView, activeScenario, updateAreaData, updateProject, updateProjectBatch, updateKSM, isEditor = false }) => {
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const area = EXPERTISE_AREAS.find(a => a.id === activeView);
    if (!area) return null;

    const data = activeScenario.data[activeView] || { ...EMPTY_AREA_DATA };
    
    const safeProjects = Array.isArray(data.projects) ? data.projects : [];
    const areaProjects = safeProjects.map(p => ({ ...p, areaId: area.id }));

    const addProject = () => {
        if (!isEditor) return;
        const newProject = {
            id: Date.now(),
            title: '',
            description: '', // Nuova field per descrizione iniziativa
            start: `${GANTT_START_YEAR}-01`,
            end: `${GANTT_START_YEAR}-04`,
            impact: 5,
            effort: 5
        };
        const currentProjects = Array.isArray(data.projects) ? data.projects : [];
        updateAreaData(activeView, 'projects', [...currentProjects, newProject]);
    };

    const removeProject = (projectId) => {
        if (!isEditor || !Array.isArray(data.projects)) return;
        const newProjects = data.projects.filter(p => p.id !== projectId);
        updateAreaData(activeView, 'projects', newProjects);
    };

    const addKSM = () => {
        if (!isEditor) return;
        const newKSM = {
            id: Date.now(),
            name: '',
            abbr: '',
            formula: '',
            description: '',
            guardRail: '',
            alertLevel: ''
        };
        const currentKSMs = Array.isArray(data.ksms) ? data.ksms : [];
        updateAreaData(activeView, 'ksms', [...currentKSMs, newKSM]);
    };

    const removeKSM = (ksmId) => {
        if (!isEditor || !Array.isArray(data.ksms)) return;
        const newKSMs = data.ksms.filter(k => k.id !== ksmId);
        updateAreaData(activeView, 'ksms', newKSMs);
    };

    return (
        <div className="space-y-6 animate-fadeIn relative">

            {isNotesOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <StickyNote size={18} className="text-yellow-600" /> Note: {area.label}
                            </h3>
                            <button onClick={() => setIsNotesOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="relative">
                                <AdvancedEditor
                                    value={data.comments || ''}
                                    onChange={(val) => updateAreaData(activeView, 'comments', val)}
                                    placeholder={`Inserisci note per ${area.label}...`}
                                    disabled={!isEditor}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end">
                            <Button onClick={() => setIsNotesOpen(false)} variant="secondary">Chiudi</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-grow">
                        <div className="p-3 rounded-xl text-white" style={{ backgroundColor: area.hex }}>
                            <area.icon size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{area.label}</h2>
                            <div className="flex items-center gap-3">
                                <p className="text-gray-500 text-sm">Pianificazione operativa e strategica</p>
                                <button
                                    onClick={() => setIsNotesOpen(true)}
                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors font-medium border border-yellow-200"
                                >
                                    <StickyNote size={12} /> Note / Appunti
                                </button>
                                <button
                                    onClick={() => setIsChatOpen(true)}
                                    className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium border border-blue-200 shadow-sm"
                                >
                                    <Sparkles size={12} /> NotebookLM AI
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-stretch gap-4 w-full md:w-auto">
                        <div className="text-white rounded-lg p-3 flex flex-col items-center justify-center shadow-lg min-w-[100px]" style={{ backgroundColor: ARAD_BLUE }}>
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1" style={{ color: ARAD_GOLD }}>Importance</span>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={data.importance || 0}
                                    onChange={(e) => updateAreaData(activeView, 'importance', parseInt(e.target.value))}
                                    disabled={!isEditor}
                                    className={`w-12 text-center text-2xl font-bold bg-transparent border-0 border-b-2 focus:ring-0 p-0 text-white placeholder-gray-500 focus:border-white ${!isEditor ? 'cursor-not-allowed opacity-50' : ''}`}
                                    style={{ borderColor: ARAD_GOLD }}
                                />
                                <span className="text-sm opacity-60 font-light">/10</span>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col justify-center min-w-[140px]">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Budget Stimato</span>
                            <div className="flex items-center gap-1">
                                <span className="text-gray-400 font-light">€</span>
                                <input
                                    type="number"
                                    value={data.budget ?? ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateAreaData(activeView, 'budget', val === '' ? 0 : parseFloat(val));
                                    }}
                                    disabled={!isEditor}
                                    className={`w-full border-0 focus:ring-0 p-0 font-bold text-lg text-gray-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${!isEditor ? 'cursor-not-allowed text-gray-500' : ''}`}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Card title="Obiettivi Macro" icon={Target}>
                <div className="relative">
                    <AdvancedEditor
                        value={data.objectives || ''}
                        onChange={(val) => updateAreaData(activeView, 'objectives', val)}
                        placeholder="Definisci gli obiettivi strategici per questa area..."
                        disabled={!isEditor}
                    />
                </div>
            </Card>

            <Card title="Evoluzione Temporale (Roadmap 3 Anni)" icon={Calendar}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {[1, 2, 3].map(year => (
                        <div key={year} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col h-full">
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2">Anno {year}</div>
                            <div className="relative flex-grow h-full">
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

            <Card
                title="Pianificazione Gantt (2026-2029)"
                icon={Calendar}
                action={isEditor && <Button variant="ghost" icon={Plus} onClick={addProject} className="text-red-700">Aggiungi Progetto</Button>}
                noPadding
            >
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <GanttChart
                        projects={areaProjects}
                        areas={EXPERTISE_AREAS}
                        activeAreaId={area.id}
                        onUpdateProject={updateProjectBatch}
                        isEditor={isEditor}
                    />
                </div>

                <div className="p-6 space-y-4">
                    {areaProjects.length === 0 && <div className="text-center text-gray-400 italic text-sm">Nessun progetto. Clicca "Aggiungi" per iniziare la pianificazione.</div>}

                    {areaProjects.map((project) => (
                        <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-colors hover:border-gray-300">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Nome del progetto / iniziativa..."
                                        className={`flex-grow font-semibold text-gray-800 border-0 border-b border-gray-200 focus:ring-0 px-0 py-1 focus:border-current ${!isEditor ? 'cursor-not-allowed' : ''}`}
                                        style={{ color: isEditor ? area.hex : '#6b7280' }}
                                        value={project.title}
                                        onChange={(e) => updateProject(activeView, project.id, 'title', e.target.value)}
                                        disabled={!isEditor}
                                    />
                                    {isEditor && <button onClick={() => removeProject(project.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex gap-2 items-center bg-gray-50 p-2 rounded text-sm">
                                        <Calendar size={14} className="text-gray-400" />
                                        <input
                                            type="month"
                                            min={`${GANTT_START_YEAR}-01`} max={`${GANTT_END_YEAR}-12`}
                                            value={project.start}
                                            onChange={(e) => updateProject(activeView, project.id, 'start', e.target.value)}
                                            disabled={!isEditor}
                                            className={`bg-transparent border-0 p-0 text-sm w-32 focus:ring-0 text-gray-700 ${!isEditor ? 'cursor-not-allowed' : ''}`}
                                        />
                                        <span className="text-gray-400">→</span>
                                        <input
                                            type="month"
                                            min={`${GANTT_START_YEAR}-01`} max={`${GANTT_END_YEAR}-12`}
                                            value={project.end}
                                            onChange={(e) => updateProject(activeView, project.id, 'end', e.target.value)}
                                            disabled={!isEditor}
                                            className={`bg-transparent border-0 p-0 text-sm w-32 focus:ring-0 text-gray-700 ${!isEditor ? 'cursor-not-allowed' : ''}`}
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs uppercase font-bold text-gray-400">Priorità</span>
                                            <input
                                                type="number" min="1" max="10"
                                                value={project.impact}
                                                onChange={(e) => updateProject(activeView, project.id, 'impact', parseInt(e.target.value))}
                                                disabled={!isEditor}
                                                className={`w-12 h-8 text-center border-gray-200 rounded text-sm font-bold ${!isEditor ? 'cursor-not-allowed text-gray-400' : ''}`}
                                                style={{ color: isEditor ? area.hex : '#9ca3af' }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs uppercase font-bold text-gray-400">Effort</span>
                                            <input
                                                type="number" min="1" max="10"
                                                value={project.effort}
                                                onChange={(e) => updateProject(activeView, project.id, 'effort', parseInt(e.target.value))}
                                                disabled={!isEditor}
                                                className={`w-12 h-8 text-center border-gray-200 rounded text-sm text-gray-600 ${!isEditor ? 'cursor-not-allowed opacity-50' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {/* NUOVO BLOCCO DESCRIZIONE INIZIATIVA */}
                                <div className="mt-2 pt-4 border-t border-gray-100">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
                                        Descrizione Iniziativa
                                    </label>
                                    <div className="relative">
                                        <AdvancedEditor
                                            value={project.description || ''}
                                            onChange={(val) => updateProject(activeView, project.id, 'description', val)}
                                            placeholder="Descrivi i dettagli, gli obiettivi e i task principali di questa iniziativa..."
                                            disabled={!isEditor}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card
                title="Key Success Metrics (KSM)"
                icon={Target}
                action={isEditor && <Button variant="ghost" icon={Plus} onClick={addKSM} className="text-red-700">Aggiungi Metrica</Button>}
                noPadding
            >
                <div className="p-6 space-y-4 bg-slate-50/50">
                    {(!Array.isArray(data.ksms) || data.ksms.length === 0) && (
                        <div className="text-center text-gray-400 italic text-sm py-4">
                            Nessuna metrica definita. Aggiungine una per monitorare il successo.
                        </div>
                    )}

                    {(Array.isArray(data.ksms) ? data.ksms : []).map((ksm) => (
                        <div key={ksm.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative group">
                            {isEditor && (
                                <button
                                    onClick={() => removeKSM(ksm.id)}
                                    className="absolute top-2 right-2 text-gray-300 hover:text-red-600 p-1 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Denominazione Metrica</label>
                                    <input
                                        type="text"
                                        placeholder="Es. Tasso di Conversione"
                                        className={`w-full border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-sm font-semibold text-gray-800 ${!isEditor ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                        value={ksm.name}
                                        onChange={(e) => updateKSM(activeView, ksm.id, 'name', e.target.value)}
                                        disabled={!isEditor}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Abbreviazione</label>
                                        <input
                                            type="text"
                                            placeholder="Es. CR"
                                            className={`w-full border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-sm ${!isEditor ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                            value={ksm.abbr}
                                            onChange={(e) => updateKSM(activeView, ksm.id, 'abbr', e.target.value)}
                                            disabled={!isEditor}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Formula</label>
                                        <input
                                            type="text"
                                            placeholder="Es. Ordini / Visite"
                                            className={`w-full border-gray-200 rounded focus:ring-1 focus:ring-blue-500 text-sm font-mono text-xs ${!isEditor ? 'bg-gray-50 cursor-not-allowed' : 'bg-gray-50'}`}
                                            value={ksm.formula}
                                            onChange={(e) => updateKSM(activeView, ksm.id, 'formula', e.target.value)}
                                            disabled={!isEditor}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrizione (Cosa misura)</label>
                                <div className="relative">
                                    <AdvancedEditor
                                        value={ksm.description || ''}
                                        onChange={(val) => updateKSM(activeView, ksm.id, 'description', val)}
                                        placeholder="Descrivi lo scopo della metrica..."
                                        disabled={!isEditor}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert size={16} className="text-green-600" />
                                    <div className="flex-grow">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Guard Rail (Sicurezza)</label>
                                        <input
                                            type="text"
                                            placeholder="Es. > 2.5%"
                                            className={`w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 px-0 py-1 text-sm text-green-700 font-medium placeholder-gray-400 ${!isEditor ? 'cursor-not-allowed opacity-60' : ''}`}
                                            value={ksm.guardRail}
                                            onChange={(e) => updateKSM(activeView, ksm.id, 'guardRail', e.target.value)}
                                            disabled={!isEditor}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-600" />
                                    <div className="flex-grow">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Alert Level (Soglia Critica)</label>
                                        <input
                                            type="text"
                                            placeholder="Es. < 1.0%"
                                            className={`w-full bg-transparent border-0 border-b border-gray-200 focus:ring-0 px-0 py-1 text-sm text-red-700 font-medium placeholder-gray-400 ${!isEditor ? 'cursor-not-allowed opacity-60' : ''}`}
                                            value={ksm.alertLevel}
                                            onChange={(e) => updateKSM(activeView, ksm.id, 'alertLevel', e.target.value)}
                                            disabled={!isEditor}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            <Card title="Attività di Routine (Day-by-Day)" icon={Clock}>
                <div className="relative">
                    <AdvancedEditor
                        value={data.routine || ''}
                        onChange={(val) => updateAreaData(activeView, 'routine', val)}
                        placeholder="Quali saranno le attività operative quotidiane per il team?"
                        disabled={!isEditor}
                    />
                </div>
            </Card>

            <NotebookLMChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                areaLabel={area.label}
            />
        </div>
    );
};

export default AreaEditor;
