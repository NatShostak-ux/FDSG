import React, { useState } from 'react';
import { Euro, List, TrendingUp, Calendar, Target, ShieldAlert, AlertTriangle, X, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import RadarChart from './RadarChart';
import { ARAD_BLUE, ARAD_GOLD, EXPERTISE_AREAS } from '../utils/constants';

const Dashboard = ({ activeScenario, setActiveView, updateProjectBatch }) => {
    const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);

    // Calcolo Totale Bottom-Up (Somma di tutti i progetti di tutte le aree)
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
        const data = activeScenario.data[area.id];
        return data?.projects?.map(p => ({ ...p, areaId: area.id })) || [];
    });

    const projectsByArea = EXPERTISE_AREAS.map(area => {
        const areaProjects = allProjects.filter(p => p.areaId === area.id);
        if (areaProjects.length === 0) return null;
        return { area, projects: areaProjects };
    }).filter(Boolean);

    const hasAnyMetrics = EXPERTISE_AREAS.some(area => (activeScenario.data[area.id]?.ksms || []).length > 0);

    return (
        <div className="space-y-8 animate-fadeIn relative">
            {/* ... Modal Index rimane uguale ... */}
            
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

            {/* ... Resto del componente (Radar, Gantt, KSM) rimane uguale ... */}
            <Card title="Analisi Pesi Strategici" icon={TrendingUp}>
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-grow w-full max-w-lg">
                        <RadarChart data={activeScenario.data} areas={EXPERTISE_AREAS} />
                    </div>
                    <div className="flex-shrink-0 w-full md:w-64 space-y-2 text-sm text-gray-600 max-h-80 overflow-y-auto pr-2">
                        <h4 className="font-bold text-gray-800 mb-2 uppercase text-xs">Valori Puntuali</h4>
                        {EXPERTISE_AREAS.map(area => {
                            const score = activeScenario.data[area.id]?.importance || 0;
                            return (
                                <div key={area.id} className="flex justify-between items-center border-b border-gray-50 pb-1">
                                    <span className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: area.hex }}></div>
                                        {area.label}
                                    </span>
                                    <span className="font-bold" style={{ color: area.hex }}>{score}/10</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Card>

            <Card title="Roadmap Strategica Integrata (2026-2029)" icon={Calendar} noPadding>
                <div className="p-6">
                    <GanttChart projects={allProjects} areas={EXPERTISE_AREAS} showSwimlanes={true} onUpdateProject={updateProjectBatch} />
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
                                            <div key={ksm.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-gray-300 hover:shadow-md">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 text-sm">{ksm.name}</span>
                                                        {ksm.abbr && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-mono">{ksm.abbr}</span>}
                                                    </div>
                                                    {ksm.description && <p className="text-xs text-gray-500 mt-1">{ksm.description}</p>}
                                                </div>
                                                <div className="flex gap-4 text-xs shrink-0">
                                                    {ksm.guardRail && <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-100 min-w-[100px] justify-center"><ShieldAlert size={12} /><span>{ksm.guardRail}</span></div>}
                                                    {ksm.alertLevel && <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1.5 rounded border border-red-100 min-w-[100px] justify-center"><AlertTriangle size={12} /><span>{ksm.alertLevel}</span></div>}
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
