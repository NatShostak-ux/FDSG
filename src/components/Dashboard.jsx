import React, { useState } from 'react';
import { Euro, List, TrendingUp, Calendar, Target, X, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import RadarChart from './RadarChart';
import { ARAD_BLUE, ARAD_GOLD, EXPERTISE_AREAS } from '../utils/constants';

import { STRATEGIC_ROLES, getStrategicRole } from './AreaEditor';

const Dashboard = ({ activeScenario, setActiveView, updateProjectBatch }) => {
    const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);

    const calculateTotalBudgetRange = () => {
        let min = 0;
        let max = 0;
        EXPERTISE_AREAS.forEach(area => {
            const projects = activeScenario.data[area.id]?.projects || [];
            projects.forEach(p => {
                min += (Number(p.budgetMin) || 0);
                max += (Number(p.budgetMax) || 0);
            });
        });
        return { min, max };
    };

    const budgetRange = calculateTotalBudgetRange();
    
    const allProjects = EXPERTISE_AREAS.flatMap(area => {
        const areaData = activeScenario.data[area.id];
        return (areaData?.projects || []).map(p => ({ 
            ...p, 
            areaId: area.id,
            areaColor: area.hex,
            areaLabel: area.label
        }));
    });

    const projectsByArea = EXPERTISE_AREAS.map(area => {
        const areaProjects = allProjects.filter(p => p.areaId === area.id);
        if (areaProjects.length === 0) return null;
        return { area, projects: areaProjects };
    }).filter(Boolean);

    const hasAnyMetrics = EXPERTISE_AREAS.some(area => (activeScenario.data[area.id]?.ksms || []).length > 0);

    return (
        <div className="space-y-8 animate-fadeIn relative">
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

            <Card title="Analisi Pesi Strategici" icon={TrendingUp}>
                <div className="flex flex-col lg:flex-row gap-10 items-center">
                    {/* Contenitore Grafico */}
                    <div className="flex-grow w-full max-w-2xl">
                        <RadarChart data={activeScenario.data} areas={EXPERTISE_AREAS} />
                    </div>
                    
                    {/* Contenitore Testo Allargato: min-w-[360px] garantisce spazio alla colonna */}
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
                                    {/* whitespace-nowrap blocca il testo su un'unica riga */}
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

            <Card title="Roadmap Strategica Integrata (2026-2029)" icon={Calendar} noPadding>
                <div className="p-4 bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                    Visualizzazione consolidata per aree operative (drag per spostare, bordi per ridimensionare).
                </div>
                <div className="p-0 overflow-hidden rounded-b-xl">
                    <GanttChart 
                        projects={allProjects} 
                        areas={EXPERTISE_AREAS} 
                        showSwimlanes={true} 
                        onUpdateProject={updateProjectBatch} 
                    />
                </div>
            </Card>

            <Card title="Riepilogo Metriche di Successo (KSM)" icon={Target} noPadding>
                <div className="p-6 bg-slate-50/50">
                    {!hasAnyMetrics ? (
                        <div className="text-center py-8 text-gray-400 italic">Nessuna metrica definita.</div>
                    ) : (
                        EXPERTISE_AREAS.map(area => {
                            const areaKSMs = activeScenario.data[area.id]?.ksms || [];
                            if (areaKSMs.length === 0) return null;
                            return (
                                <div key={area.id} className="mb-6 last:mb-0">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                        <div className="p-1.5 rounded-md text-white" style={{ backgroundColor: area.hex }}><area.icon size={14} /></div>
                                        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{area.label}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {areaKSMs.map(ksm => (
                                            <div key={ksm.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-300">
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
                            );
                        })
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
