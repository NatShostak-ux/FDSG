import React, { useState } from 'react';
import { Euro, List, TrendingUp, Calendar, Target, X, ChevronRight, ChevronDown, ChevronUp, Filter, Activity, Zap } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import RadarChart from './RadarChart';
import { ARAD_BLUE, ARAD_GOLD, EXPERTISE_AREAS } from '../utils/constants';

import { STRATEGIC_ROLES, getStrategicRole } from './AreaEditor';

const SHOW_FINANCIALS_AND_LIST = false; 

const Dashboard = ({ activeScenario, setActiveView, updateProjectBatch, setSearchFocusItem }) => {
    const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);
    
    // Stato per la modale del singolo progetto
    const [modalProject, setModalProject] = useState(null);
    
    // Stati per i Filtri Strategici
    const [filterArea, setFilterArea] = useState('all');
    const [filterTime, setFilterTime] = useState('all');
    const [filterRole, setFilterRole] = useState('all'); 
    
    const [expandedKSMs, setExpandedKSMs] = useState({});

    const toggleKsmArea = (areaId) => {
        setExpandedKSMs(prev => ({ ...prev, [areaId]: !prev[areaId] }));
    };

    const calculateTotalBudgetRange = () => {
        let min = 0, max = 0;
        EXPERTISE_AREAS.forEach(area => {
            const projects = activeScenario.data[area.id]?.projects || [];
            projects.forEach(p => { min += (Number(p.budgetMin) || 0); max += (Number(p.budgetMax) || 0); });
        });
        return { min, max };
    };
    const budgetRange = calculateTotalBudgetRange();
    
    const allProjects = EXPERTISE_AREAS.flatMap(area => {
        const areaData = activeScenario.data[area.id];
        return (areaData?.projects || []).map(p => ({ ...p, areaId: area.id, areaColor: area.hex, areaLabel: area.label }));
    });

    const projectsByArea = EXPERTISE_AREAS.map(area => {
        const areaProjects = allProjects.filter(p => p.areaId === area.id);
        if (areaProjects.length === 0) return null;
        return { area, projects: areaProjects };
    }).filter(Boolean);

    const hasAnyMetrics = EXPERTISE_AREAS.some(area => (activeScenario.data[area.id]?.ksms || []).length > 0);

    let filteredProjects = allProjects;

    if (filterArea !== 'all') {
        filteredProjects = filteredProjects.filter(p => p.areaId === filterArea);
    }
    if (filterTime === '2026') {
        filteredProjects = filteredProjects.filter(p => p.start.startsWith('2026') || p.end.startsWith('2026'));
    } else if (filterTime === '2027') {
        filteredProjects = filteredProjects.filter(p => p.start.startsWith('2027') || p.end.startsWith('2027'));
    } else if (filterTime === 'next6m') {
        filteredProjects = filteredProjects.filter(p => p.start === '2026-01' || p.start === '2026-02' || p.start === '2026-03' || p.start === '2026-04' || p.start === '2026-05' || p.start === '2026-06');
    }

    if (filterRole !== 'all') {
        const roleVal = parseInt(filterRole, 10);
        filteredProjects = filteredProjects.filter(p => {
            const areaScore = activeScenario.data[p.areaId]?.importance || 0;
            const role = getStrategicRole(areaScore);
            return role.value === roleVal;
        });
    }

    // Apre il pop-up del dettaglio progetto
    const openProjectModal = (projectId) => {
        const project = allProjects.find(p => p.id === projectId);
        if (project) {
            setModalProject(project);
        }
    };

    // Teletrasporto all'editor per modificare il progetto
    const handleGoToEdit = () => {
        if (modalProject && setSearchFocusItem) {
            setSearchFocusItem({ type: 'project', id: modalProject.id });
            setActiveView(modalProject.areaId);
            setModalProject(null); // Chiude la modale
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn relative pb-12">
            
            {/* POP-UP DETTAGLIO SINGOLO PROGETTO */}
            {modalProject && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-fadeIn" onClick={() => setModalProject(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
                        
                        {/* Header Modale */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center relative">
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: modalProject.areaColor }}></div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: modalProject.areaColor }}></div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{modalProject.areaLabel}</span>
                            </div>
                            <button onClick={() => setModalProject(null)} className="text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
                        </div>
                        
                        {/* Corpo Modale */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{modalProject.title || 'Iniziativa senza titolo'}</h2>
                            
                            {/* Riga Info Chiave */}
                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">{modalProject.start} <span className="text-slate-400 font-normal mx-1">→</span> {modalProject.end}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" title="Priorità / Impact">
                                    <Target size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">Impatto: <span style={{ color: modalProject.areaColor }}>{modalProject.impact}/10</span></span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100" title="Effort">
                                    <Activity size={14} className="text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">Sforzo: {modalProject.effort}/10</span>
                                </div>
                                {SHOW_FINANCIALS_AND_LIST && (
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <Euro size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-700">{(modalProject.budgetMin/1000).toFixed(0)}k - {(modalProject.budgetMax/1000).toFixed(0)}k</span>
                                    </div>
                                )}
                            </div>

                            {/* Descrizione (Renderizzata da HTML) */}
                            {modalProject.description && (
                                <div className="mb-8">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Descrizione</h4>
                                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: modalProject.description }} />
                                </div>
                            )}

                            {/* Abilitatori */}
                            {modalProject.enablers && modalProject.enablers.filter(e => e.trim()).length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Abilitatori Chiave</h4>
                                    <ul className="space-y-2">
                                        {modalProject.enablers.filter(e => e.trim()).map((enabler, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                                                <Zap size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <span className="leading-snug">{enabler}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Footer Modale */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                            <Button variant="secondary" onClick={() => setModalProject(null)}>Chiudi</Button>
                            <Button onClick={handleGoToEdit}>Modifica Iniziativa</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* PREVIEW LISTA PROGETTI (Modale Esistente) */}
            {isProjectPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn" onClick={() => setIsProjectPreviewOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ color: ARAD_BLUE }}>
                                    <List size={24} style={{ color: ARAD_GOLD }} /> Indice Progetti
                                </h3>
                            </div>
                            <button onClick={() => setIsProjectPreviewOpen(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50">
                            {projectsByArea.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">Nessun progetto pianificato.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projectsByArea.map(({ area, projects }) => (
                                        <div key={area.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <button onClick={() => { setActiveView(area.id); setIsProjectPreviewOpen(false); }} className="flex items-center gap-2 w-full mb-3 group">
                                                <div className="p-2 rounded-lg text-white" style={{ backgroundColor: area.hex }}><area.icon size={18} /></div>
                                                <span className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors flex-grow text-left">{area.label}</span>
                                                <ChevronRight size={16} className="text-gray-300" />
                                            </button>
                                            <ul className="space-y-2">
                                                {projects.map(p => (
                                                    <li key={p.id} className="text-xs flex items-center gap-2 text-gray-600 pl-2 border-l-2 border-gray-100">
                                                        <span className="truncate font-medium">{p.title || 'Senza titolo'}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SEZIONE NASCOSTA TRAMITE FEATURE FLAG */}
            {SHOW_FINANCIALS_AND_LIST && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Budget Stimato Totale (Bottom-Up)</div>
                            <div className="text-2xl font-bold" style={{ color: ARAD_BLUE }}>
                                € {budgetRange.min.toLocaleString('it-IT')} - {budgetRange.max.toLocaleString('it-IT')}
                            </div>
                        </div>
                        <div className="p-3 rounded-full" style={{ backgroundColor: `${ARAD_GOLD}20`, color: ARAD_GOLD }}><Euro size={24} /></div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setIsProjectPreviewOpen(true)}>
                        <div>
                            <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Progetti in Roadmap</div>
                            <div className="text-3xl font-bold text-gray-800">{allProjects.length}</div>
                        </div>
                        <div className="p-3 rounded-full group-hover:scale-110 transition-transform" style={{ backgroundColor: `${ARAD_BLUE}20`, color: ARAD_BLUE }}><List size={24} /></div>
                    </div>
                </div>
            )}

            <Card title="Analisi Pesi Strategici" icon={TrendingUp}>
                <div className="flex flex-col lg:flex-row gap-10 items-center">
                    <div className="flex-grow w-full max-w-2xl">
                        <RadarChart data={activeScenario.data} areas={EXPERTISE_AREAS} />
                    </div>
                    
                    <div className="flex-shrink-0 w-full lg:w-auto lg:min-w-[360px] space-y-3 text-sm text-gray-600 pr-2">
                        <h4 className="font-bold text-gray-800 mb-4 uppercase text-[11px] tracking-wider">Valori Puntuali</h4>
                        {EXPERTISE_AREAS.map(area => {
                            const score = activeScenario.data[area.id]?.importance || 0;
                            const role = getStrategicRole(score);
                            return (
                                <div key={area.id} className="flex justify-between items-center border-b border-gray-50 pb-3 gap-6">
                                    <span className="flex items-center gap-3 font-medium text-gray-700">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: area.hex }}></div>
                                        {area.label}
                                    </span>
                                    <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider whitespace-nowrap">
                                        <span className="text-base">{role.icon}</span> 
                                        <span style={{ color: area.hex }}>{role.label}</span>
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Card>

            <Card title="Roadmap Strategica Integrata" icon={Calendar} noPadding>
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <Filter size={16} className="text-blue-600"/> Filtri Strategici
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer hover:border-gray-300 transition-colors">
                            <option value="all">Tutte le Aree</option>
                            {EXPERTISE_AREAS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                        </select>
                        
                        <select value={filterTime} onChange={e => setFilterTime(e.target.value)} className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer hover:border-gray-300 transition-colors">
                            <option value="all">Tutta la Roadmap</option>
                            <option value="next6m">Prossimi 6 Mesi</option>
                            <option value="2026">Focus 2026</option>
                            <option value="2027">Focus 2027</option>
                        </select>
                        
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer hover:border-gray-300 transition-colors">
                            <option value="all">Tutti i Ruoli Strategici</option>
                            {STRATEGIC_ROLES.map(role => (
                                <option key={role.id} value={role.value}>{role.icon} {role.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-0 overflow-hidden rounded-b-xl relative z-0">
                    <GanttChart 
                        projects={filteredProjects} 
                        areas={EXPERTISE_AREAS} 
                        showSwimlanes={filterArea === 'all'} 
                        activeAreaId={filterArea !== 'all' ? filterArea : null}
                        onUpdateProject={updateProjectBatch} 
                        onSelectProject={openProjectModal} // <--- APRE IL POP-UP AL CLICK!
                    />
                    {filteredProjects.length === 0 && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="text-gray-500 font-medium">Nessun progetto corrisponde ai filtri selezionati.</div>
                        </div>
                    )}
                </div>
            </Card>

            <Card title="Riepilogo Metriche di Successo (KSM)" icon={Target} noPadding>
                <div className="p-4 md:p-6 bg-slate-50/50">
                    {!hasAnyMetrics ? (
                        <div className="text-center py-8 text-gray-400 italic">Nessuna metrica definita.</div>
                    ) : (
                        <div className="space-y-4">
                            {EXPERTISE_AREAS.map(area => {
                                const areaKSMs = activeScenario.data[area.id]?.ksms || [];
                                if (areaKSMs.length === 0) return null;
                                
                                const isExpanded = expandedKSMs[area.id] || false;

                                return (
                                    <div key={area.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-gray-300">
                                        <div 
                                            className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => toggleKsmArea(area.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-md text-white" style={{ backgroundColor: area.hex }}><area.icon size={16} /></div>
                                                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{area.label}</h4>
                                                <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">{areaKSMs.length} Metriche</span>
                                            </div>
                                            <div className="text-gray-400">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="p-5 pt-0 border-t border-gray-100 bg-slate-50/30">
                                                <div className="grid grid-cols-1 gap-3 mt-4">
                                                    {areaKSMs.map(ksm => (
                                                        <div key={ksm.id} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                                            <div className="flex-grow pr-4">
                                                                <span className="font-bold text-gray-900 text-sm block mb-1">{ksm.name || 'Metrica senza nome'}</span>
                                                                {ksm.description && <div className="text-xs text-gray-500 line-clamp-2" dangerouslySetInnerHTML={{ __html: ksm.description }} />}
                                                            </div>
                                                            <div className="flex gap-6 text-sm shrink-0 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">As Is</span>
                                                                    <span className="font-medium text-gray-700">{ksm.valueAsIs || '-'}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l border-gray-200 pl-6">
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target</span>
                                                                    <span className="font-bold text-blue-600">{ksm.targetValue || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
