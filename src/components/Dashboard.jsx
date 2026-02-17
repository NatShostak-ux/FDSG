import React, { useState } from 'react';
import { Euro, List, TrendingUp, Calendar, Target, ShieldAlert, AlertTriangle, X, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import RadarChart from './RadarChart';
import { ARAD_BLUE, ARAD_GOLD, EXPERTISE_AREAS } from '../utils/constants';

const Dashboard = ({ activeScenario, setActiveView }) => {
    const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);

    const calculateTotalBudget = () => {
        return EXPERTISE_AREAS.reduce((acc, area) => acc + (activeScenario.data[area.id]?.budget || 0), 0);
    };

    const totalBudget = calculateTotalBudget();
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

            {isProjectPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn" onClick={() => setIsProjectPreviewOpen(false)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2" style={{ color: ARAD_BLUE }}>
                                    <List size={24} style={{ color: ARAD_GOLD }} /> Indice Progetti
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Clicca su un'area per accedere al dettaglio</p>
                            </div>
                            <button onClick={() => setIsProjectPreviewOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow bg-slate-50">
                            {projectsByArea.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                    <List size={48} className="mb-2 opacity-20" />
                                    <p>Nessun progetto pianificato in questo scenario.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {projectsByArea.map(({ area, projects }) => (
                                        <div key={area.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <button
                                                onClick={() => { setActiveView(area.id); setIsProjectPreviewOpen(false); }}
                                                className="flex items-center gap-2 w-full text-left mb-3 group"
                                            >
                                                <div className="p-2 rounded-lg text-white transition-transform group-hover:scale-110" style={{ backgroundColor: area.hex }}>
                                                    <area.icon size={18} />
                                                </div>
                                                <span className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors flex-grow">
                                                    {area.label}
                                                </span>
                                                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-700" />
                                            </button>

                                            <ul className="space-y-2">
                                                {projects.map(p => (
                                                    <li key={p.id} className="text-xs flex items-center gap-2 text-gray-600 pl-2 border-l-2 border-gray-100">
                                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: area.hex }}></div>
                                                        <span className="truncate font-medium">{p.title || 'Senza titolo'}</span>
                                                        <span className="ml-auto text-gray-400 text-[10px]">{p.start}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end">
                            <Button onClick={() => setIsProjectPreviewOpen(false)} variant="secondary">Chiudi</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">Budget Stimato (3 Anni)</div>
                        <div className="text-3xl font-bold" style={{ color: ARAD_BLUE }}>€ {totalBudget.toLocaleString('it-IT')}</div>
                    </div>
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${ARAD_GOLD}20`, color: ARAD_GOLD }}><Euro size={24} /></div>
                </div>
                <div
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow group"
                    onClick={() => setIsProjectPreviewOpen(true)}
                >
                    <div>
                        <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">Progetti in Roadmap</div>
                        <div className="text-3xl font-bold text-gray-800">{allProjects.length}</div>
                    </div>
                    <div className="p-3 rounded-full group-hover:scale-110 transition-transform" style={{ backgroundColor: `${ARAD_BLUE}20`, color: ARAD_BLUE }}><List size={24} /></div>
                </div>
            </div>

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
                <div className="p-4 bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                    Timeline estesa (drag per spostare, bordi per ridimensionare).
                </div>
                <div className="p-6">
                    <GanttChart
                        projects={allProjects}
                        areas={EXPERTISE_AREAS}
                        showSwimlanes={true}
                    />
                </div>
            </Card>

            {/* NEW SECTION: Riepilogo KSM Dashboard */}
            <Card title="Riepilogo Metriche di Successo (KSM)" icon={Target} noPadding>
                <div className="p-6 bg-slate-50/50">
                    {!hasAnyMetrics && (
                        <div className="text-center py-8 text-gray-400 italic">
                            Nessuna metrica definita. Compila le schede di area per popolare questo riepilogo.
                        </div>
                    )}

                    {EXPERTISE_AREAS.map(area => {
                        const areaKSMs = activeScenario.data[area.id]?.ksms || [];
                        if (areaKSMs.length === 0) return null;

                        return (
                            <div key={area.id} className="mb-6 last:mb-0">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                    <div className="p-1.5 rounded-md text-white" style={{ backgroundColor: area.hex }}>
                                        <area.icon size={14} />
                                    </div>
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
                                                {ksm.formula && <div className="text-[10px] text-gray-400 mt-1 font-mono bg-gray-50 inline-block px-1 rounded">f(x): {ksm.formula}</div>}
                                            </div>

                                            <div className="flex gap-4 text-xs shrink-0">
                                                {ksm.guardRail && (
                                                    <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-100 min-w-[100px] justify-center">
                                                        <ShieldAlert size={12} />
                                                        <span className="font-medium">{ksm.guardRail}</span>
                                                    </div>
                                                )}
                                                {ksm.alertLevel && (
                                                    <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1.5 rounded border border-red-100 min-w-[100px] justify-center">
                                                        <AlertTriangle size={12} />
                                                        <span className="font-medium">{ksm.alertLevel}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
