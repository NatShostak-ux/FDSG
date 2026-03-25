import React, { useState, useEffect } from 'react';
import { Target, List, TrendingUp, Activity, Clock, Award, X, Columns3, Rows3, Info, ArrowRightLeft, Zap, Calendar, Target as TargetIcon } from 'lucide-react';
import { EXPERTISE_AREAS } from '../utils/constants';
import { getStrategicRole } from './AreaEditor';
import Button from './ui/Button';

const AVAILABLE_FIELDS = [
    { id: 'objectives', label: 'Obiettivi Macro', icon: Target },
    { id: 'projects', label: 'Iniziative Chiave', icon: List },
    { id: 'importance', label: 'Ruolo Strategico', icon: Award },
    { id: 'phasing', label: 'Evoluzione Temporale', icon: TrendingUp },
    { id: 'ksms', label: 'Metriche (KSM)', icon: Activity },
    { id: 'routine', label: 'Attività Day-by-Day', icon: Clock }
];

const CompareAreas = ({ activeScenario, setActiveView, setSearchFocusItem }) => {
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);
    const [modalProject, setModalProject] = useState(null);

    useEffect(() => {
        if (modalProject) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [modalProject]);

    const toggleArea = (areaId) => {
        setSelectedAreas(prev => prev.includes(areaId) ? prev.filter(id => id !== areaId) : [...prev, areaId]);
    };

    const toggleField = (fieldId) => {
        setSelectedFields(prev => prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]);
    };

    const onDragStart = (e, id, type) => {
        e.dataTransfer.setData("id", id);
        e.dataTransfer.setData("type", type);
    };

    const onDragOver = (e) => e.preventDefault();

    const onDrop = (e, targetType) => {
        const id = e.dataTransfer.getData("id");
        const type = e.dataTransfer.getData("type");
        if (type === targetType) {
            if (type === 'area') toggleArea(id);
            if (type === 'field') toggleField(id);
        }
    };

    const handleProjectClick = (project, areaDef) => {
        setModalProject({
            ...project,
            areaId: areaDef.id,
            areaLabel: areaDef.label,
            areaColor: areaDef.hex
        });
    };

    const handleGoToEdit = () => {
        if (modalProject && modalProject.areaId) {
            if (setSearchFocusItem) {
                setSearchFocusItem({ type: 'project', id: modalProject.id });
            }
            setActiveView(modalProject.areaId);
            setModalProject(null);
            setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }
    };

    // === ESTRATTORE UNIVERSALE ===
    const getAggregatedAreaData = (areaId) => {
        const areaData = activeScenario?.data?.[areaId] || {};
        
        const blocksToUse = (areaData.blocks && areaData.blocks.length > 0) 
            ? areaData.blocks 
            : [
                { id: 'std_obj', type: 'objectives', title: 'Obiettivi Macro' },
                { id: 'std_phasing', type: 'phasing', title: 'Descrizione Qualitativa del Phasing' },
                { id: 'std_gantt', type: 'gantt', title: 'Pianificazione Iniziative' },
                { id: 'std_ksms', type: 'ksms', title: 'Key Success Metrics (KSM)' },
                { id: 'std_routine', type: 'routine', title: 'Attività a Regime' }
            ];

        let aggregated = {
            objectives: [],
            phasing: [],
            projects: [],
            ksms: [],
            routine: [],
            importance: areaData.importance || 0
        };

        blocksToUse.forEach(block => {
            const isLegacy = block.id.startsWith('std_');

            if (block.type === 'objectives') {
                const key = isLegacy ? 'objectives' : `${block.id}_objectives`;
                if (areaData[key]) {
                    aggregated.objectives.push({ title: block.title, content: areaData[key] });
                }
            } else if (block.type === 'phasing') {
                let blockPhasing = [];
                [1, 2, 3].forEach(y => {
                    const key = isLegacy ? `evolution_y${y}` : `${block.id}_y${y}`;
                    if (areaData[key]) {
                        blockPhasing.push({ year: y, content: areaData[key] });
                    }
                });
                if (blockPhasing.length > 0) {
                    aggregated.phasing.push({ title: block.title, years: blockPhasing });
                }
            } else if (block.type === 'gantt') {
                const key = isLegacy ? 'projects' : `${block.id}_projects`;
                const projs = areaData[key] || [];
                if (projs.length > 0) {
                    aggregated.projects.push(...projs.map(p => ({ ...p, ganttOriginTitle: block.title })));
                }
            } else if (block.type === 'ksms') {
                const key = isLegacy ? 'ksms' : `${block.id}_ksms`;
                const ksms = areaData[key] || [];
                if (ksms.length > 0) {
                    aggregated.ksms.push(...ksms.map(k => ({ ...k, originTitle: block.title })));
                }
            } else if (block.type === 'routine') {
                const key = isLegacy ? 'routine' : `${block.id}_routine`;
                const r = areaData[key] || [];
                if (r.length > 0) {
                    aggregated.routine.push(...r.map(t => ({ ...t, originTitle: block.title })));
                }
            }
        });

        // Fallback per salvataggi legacy senza blocchi
        if (aggregated.projects.length === 0 && areaData.projects?.length > 0) {
            aggregated.projects = areaData.projects.map(p => ({ ...p, ganttOriginTitle: 'Pianificazione Iniziative' }));
        }
        if (aggregated.ksms.length === 0 && areaData.ksms?.length > 0) {
            aggregated.ksms = areaData.ksms.map(k => ({ ...k, originTitle: 'Metriche (KSM)' }));
        }
        if (aggregated.routine.length === 0 && areaData.routine?.length > 0) {
            aggregated.routine = areaData.routine.map(t => ({ ...t, originTitle: 'Attività a Regime' }));
        }

        return aggregated;
    };

    const renderCellContent = (areaId, fieldId) => {
        const areaDef = EXPERTISE_AREAS.find(a => a.id === areaId);
        const agg = getAggregatedAreaData(areaId);

        switch (fieldId) {
            case 'objectives':
                if (agg.objectives.length === 0) return <span className="text-gray-400 italic text-xs">Nessun obiettivo</span>;
                return (
                    <div className="space-y-4">
                        {agg.objectives.map((obj, i) => (
                            <div key={i}>
                                {agg.objectives.length > 1 && <h4 className="text-[9px] uppercase font-bold text-blue-500 mb-1">{obj.title}</h4>}
                                <div className="text-[13px] text-gray-700 leading-relaxed space-y-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: obj.content }} />
                            </div>
                        ))}
                    </div>
                );
            
            case 'projects':
                if (agg.projects.length === 0) return <span className="text-gray-400 italic text-xs">Nessun progetto</span>;
                return (
                    <div className="space-y-3">
                        {agg.projects.map((p, i) => (
                            <div 
                                key={p.id || i} 
                                onClick={() => handleProjectClick(p, areaDef)}
                                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: areaDef?.hex }}></div>
                                <div className="pl-2">
                                    {agg.projects.some(proj => proj.ganttOriginTitle !== p.ganttOriginTitle) && (
                                        <span className="text-[9px] font-bold text-blue-500 uppercase block mb-1">{p.ganttOriginTitle}</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {areaDef?.icon && <areaDef.icon size={14} style={{ color: areaDef?.hex }} />}
                                        <span className="font-bold text-[14px] text-gray-900 group-hover:text-blue-700 transition-colors">{p.title || 'Senza Titolo'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-gray-500 font-bold uppercase tracking-wide pl-2 mt-1">
                                    <span>{p.start} &rarr; {p.end}</span>
                                    <span>Effort: {p.effort} | Impatto: {p.impact}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'importance':
                const role = getStrategicRole(agg.importance);
                return <div className="flex items-center gap-2 font-bold text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-flex">{role.icon} {role.label}</div>;

            case 'phasing':
                if (agg.phasing.length === 0) return <span className="text-gray-400 italic text-xs">Nessun phasing</span>;
                return (
                    <div className="space-y-6">
                        {agg.phasing.map((phaseBlock, i) => (
                            <div key={i} className="space-y-4">
                                {agg.phasing.length > 1 && <h4 className="text-[9px] uppercase font-bold text-blue-500">{phaseBlock.title}</h4>}
                                {phaseBlock.years.map(y => (
                                    <div key={y.year} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: areaDef?.hex }}></div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 pl-2">Anno {y.year}</div>
                                        <div className="text-[13px] text-gray-700 leading-relaxed prose prose-sm max-w-none pl-2" dangerouslySetInnerHTML={{ __html: y.content }} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                );

            case 'ksms':
                if (agg.ksms.length === 0) return <span className="text-gray-400 italic text-xs">Nessuna metrica</span>;
                return (
                    <div className="space-y-3">
                        {agg.ksms.map((k, i) => (
                            <div key={k.id || i} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-3 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: areaDef?.hex }}></div>
                                <div className="w-2 h-2 rounded-full flex-shrink-0 ml-1" style={{ backgroundColor: areaDef?.hex }}></div>
                                <div className="flex-grow">
                                    {agg.ksms.some(ksm => ksm.originTitle !== k.originTitle) && (
                                        <span className="text-[9px] font-bold text-blue-500 uppercase block mb-0.5">{k.originTitle}</span>
                                    )}
                                    <div className="font-bold text-sm text-gray-800 mb-0.5">{k.name}</div>
                                    <div className="flex gap-4 text-[11px]">
                                        <span className="text-gray-400 font-bold uppercase tracking-wide">As Is: <span className="text-gray-700">{k.valueAsIs || '-'}</span></span>
                                        <span className="text-blue-600 font-bold uppercase tracking-wide">Target: {k.targetValue || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'routine':
                if (agg.routine.length === 0) return <span className="text-gray-400 italic text-xs">Nessuna attività</span>;
                return (
                    <ul className="space-y-2">
                        {agg.routine.map((t, i) => (
                            <li key={t.id || i} className="flex items-start gap-2.5 text-[13px] text-gray-700 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: areaDef?.hex }}></div>
                                <Clock size={16} className="text-gray-400 mt-0.5 flex-shrink-0 ml-1" />
                                <div className="leading-snug w-full">
                                    {agg.routine.some(rout => rout.originTitle !== t.originTitle) && (
                                        <span className="text-[9px] font-bold text-blue-500 uppercase block mb-0.5">{t.originTitle}</span>
                                    )}
                                    {t.text}
                                </div>
                            </li>
                        ))}
                    </ul>
                );

            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            
            {/* MODALE DETTAGLIO */}
            {modalProject && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 animate-fadeIn" onClick={() => setModalProject(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center relative">
                            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: modalProject.areaColor }}></div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: modalProject.areaColor }}></div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{modalProject.areaLabel}</span>
                                </div>
                                {modalProject.ganttOriginTitle && (
                                    <span className="text-[9px] text-gray-400 mt-0.5 ml-6 italic">{modalProject.ganttOriginTitle}</span>
                                )}
                            </div>
                            <button onClick={() => setModalProject(null)} className="text-gray-400 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">{modalProject.title || 'Iniziativa senza titolo'}</h2>
                            
                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-bold text-slate-700">
                                    <Calendar size={14} className="text-slate-400" />
                                    {modalProject.start} → {modalProject.end}
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-bold text-slate-700">
                                    <TargetIcon size={14} className="text-slate-400" />
                                    Impatto: <span style={{ color: modalProject.areaColor }}>{modalProject.impact}/10</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-bold text-slate-700">
                                    <Activity size={14} className="text-slate-400" />
                                    Sforzo: {modalProject.effort}/10
                                </div>
                            </div>

                            {modalProject.description && (
                                <div className="mb-8">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Descrizione</h4>
                                    <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: modalProject.description }} />
                                </div>
                            )}

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

                        <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setModalProject(null)}>Chiudi</Button>
                            <Button onClick={handleGoToEdit}>Modifica Iniziativa</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIGURATORE UI */}
            <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-yellow-50 rounded-xl">
                        <ArrowRightLeft className="text-yellow-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-[22px] font-bold text-gray-900">Confronto Aree</h2>
                        <p className="text-gray-500 text-sm">Configura la matrice per analizzare i dettagli dello scenario</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Columns3 size={14}/> 1. Aree (Colonne)</h3>
                        <div onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'area')} className="min-h-[100px] border-2 border-dashed border-gray-100 rounded-[20px] p-4 flex flex-wrap gap-3 bg-slate-50/30">
                            {selectedAreas.length === 0 && <div className="w-full flex items-center justify-center text-gray-300 text-xs italic">Trascina aree qui</div>}
                            {selectedAreas.map(id => {
                                const area = EXPERTISE_AREAS.find(a => a.id === id);
                                return (
                                    <div key={id} className="h-10 px-4 rounded-full text-white font-bold text-[13px] flex items-center gap-3 shadow-sm" style={{ backgroundColor: area?.hex }}>
                                        {area && <area.icon size={16} />} {area?.label}
                                        <X size={16} className="cursor-pointer hover:bg-white/20 rounded-full" onClick={() => toggleArea(id)} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {EXPERTISE_AREAS.filter(a => !selectedAreas.includes(a.id)).map(a => (
                                <button key={a.id} draggable onDragStart={(e) => onDragStart(e, a.id, 'area')} onClick={() => toggleArea(a.id)} className="h-9 px-4 rounded-full border border-gray-200 bg-white text-gray-500 text-[12px] font-bold flex items-center gap-2 hover:border-gray-300 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.hex }}></div> {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Rows3 size={14}/> 2. Voci (Righe)</h3>
                        <div onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'field')} className="min-h-[100px] border-2 border-dashed border-gray-100 rounded-[20px] p-4 flex flex-wrap gap-3 bg-slate-50/30">
                            {selectedFields.length === 0 && <div className="w-full flex items-center justify-center text-gray-300 text-xs italic">Trascina voci qui</div>}
                            {selectedFields.map(id => {
                                const field = AVAILABLE_FIELDS.find(f => f.id === id);
                                return (
                                    <div key={id} className="h-10 px-4 rounded-full bg-[#1e293b] text-white font-bold text-[13px] flex items-center gap-3 shadow-sm">
                                        {field && <field.icon size={16} className="text-yellow-500" />} {field?.label}
                                        <X size={16} className="cursor-pointer hover:bg-white/20 rounded-full" onClick={() => toggleField(id)} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {AVAILABLE_FIELDS.filter(f => !selectedFields.includes(f.id)).map(f => (
                                <button key={f.id} draggable onDragStart={(e) => onDragStart(e, f.id, 'field')} onClick={() => toggleField(f.id)} className="h-9 px-4 rounded-full border border-gray-200 bg-white text-gray-500 text-[12px] font-bold flex items-center gap-2 hover:border-gray-300 shadow-sm">
                                    <f.icon size={14} className="text-gray-400" /> {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* TABELLA CONFRONTO */}
            {selectedAreas.length > 0 && selectedFields.length > 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-200 shadow-xl overflow-hidden animate-fadeIn">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-6 border-b border-gray-100 bg-white w-56 sticky left-0 z-20"></th>
                                    {selectedAreas.map(id => {
                                        const area = EXPERTISE_AREAS.find(a => a.id === id);
                                        return (
                                            <th key={id} className="p-8 border-b border-l border-gray-100 bg-white min-w-[350px]">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: area?.hex }}>{area && <area.icon size={24} />}</div>
                                                    <span className="font-bold text-gray-900 text-[20px]">{area?.label}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedFields.map(fid => {
                                    const field = AVAILABLE_FIELDS.find(f => f.id === fid);
                                    return (
                                        <tr key={fid} className="group">
                                            <td className="p-6 border-b border-gray-100 font-bold text-[11px] text-gray-400 uppercase bg-white sticky left-0 z-10 align-top group-hover:bg-blue-50/50 transition-colors">
                                                <div className="flex items-center gap-3">{field && <field.icon size={18} />} {field?.label}</div>
                                            </td>
                                            {selectedAreas.map(aid => (
                                                <td key={`${aid}-${fid}`} className="p-8 border-b border-l border-gray-50 bg-white align-top group-hover:bg-slate-50/30 transition-colors">
                                                    {renderCellContent(aid, fid)}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-[24px] p-20 flex flex-col items-center justify-center text-center">
                    <Info size={32} className="text-gray-400 mb-4" />
                    <p className="text-[16px] font-medium text-gray-500">Configura la matrice selezionando Aree e Voci in alto</p>
                </div>
            )}
        </div>
    );
};

export default CompareAreas;
