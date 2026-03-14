import React, { useState } from 'react';
import { Target, List, TrendingUp, Activity, Clock, Award, X, Columns3, Rows3, Info, Wand2 } from 'lucide-react';
import { EXPERTISE_AREAS } from '../utils/constants';
import { getStrategicRole } from './AreaEditor';

const AVAILABLE_FIELDS = [
    { id: 'objectives', label: 'Obiettivi Macro', icon: Target },
    { id: 'projects', label: 'Iniziative Chiave', icon: List },
    { id: 'importance', label: 'Ruolo Strategico', icon: Award },
    { id: 'phasing', label: 'Evoluzione Temporale', icon: TrendingUp },
    { id: 'ksms', label: 'Metriche (KSM)', icon: Activity },
    { id: 'routine', label: 'Attività Day-by-Day', icon: Clock }
];

const CompareAreas = ({ activeScenario }) => {
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);

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

    const renderCellContent = (areaId, fieldId) => {
        const areaData = activeScenario.data[areaId] || {};
        const areaDef = EXPERTISE_AREAS.find(a => a.id === areaId);

        switch (fieldId) {
            case 'objectives':
                return areaData.objectives 
                    ? <div className="text-[13px] text-gray-700 leading-relaxed space-y-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: areaData.objectives }} /> 
                    : <span className="text-gray-400 italic text-xs">Nessun obiettivo</span>;
            
            case 'projects':
                return (areaData.projects || []).length > 0 ? (
                    <div className="space-y-3">
                        {areaData.projects.map(p => (
                            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: areaDef?.hex }}></div>
                                    <span className="font-bold text-[14px] text-gray-900">{p.title || 'Senza Titolo'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-gray-500 font-bold uppercase tracking-wide">
                                    <span>{p.start} &rarr; {p.end}</span>
                                    <span>Effort: {p.effort} | Impatto: {p.impact}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-gray-400 italic text-xs">Nessun progetto</span>;

            case 'importance':
                const role = getStrategicRole(areaData.importance || 0);
                return <div className="flex items-center gap-2 font-bold text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 inline-flex">{role.icon} {role.label}</div>;

            case 'phasing':
                const years = [1, 2, 3].filter(y => areaData[`evolution_y${y}`]);
                if (years.length === 0) return <span className="text-gray-400 italic text-xs">Nessun phasing</span>;
                return (
                    <div className="space-y-4">
                        {years.map(y => (
                            <div key={y} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Anno {y}</div>
                                <div className="text-[13px] text-gray-700 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: areaData[`evolution_y${y}`] }} />
                            </div>
                        ))}
                    </div>
                );

            case 'ksms':
                const ksms = areaData.ksms || [];
                return ksms.length > 0 ? (
                    <div className="space-y-3">
                        {ksms.map(k => (
                            <div key={k.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                                <div className="font-bold text-sm text-gray-800 mb-1">{k.name}</div>
                                <div className="flex gap-4 text-[11px]">
                                    <span className="text-gray-400 font-bold uppercase">As Is: <span className="text-gray-700">{k.valueAsIs || '-'}</span></span>
                                    <span className="text-blue-600 font-bold uppercase">Target: {k.targetValue || '-'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-gray-400 italic text-xs">Nessuna metrica</span>;

            case 'routine':
                return (areaData.routine || []).length > 0 ? (
                    <ul className="space-y-2">
                        {areaData.routine.map(t => (
                            <li key={t.id} className="flex items-start gap-2 text-[13px] text-gray-700 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                                <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span>{t.text}</span>
                            </li>
                        ))}
                    </ul>
                ) : <span className="text-gray-400 italic text-xs">Nessuna attività</span>;

            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            {/* HEADER CONFIGURATORE */}
            <div className="bg-white rounded-[24px] border border-gray-200 p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-yellow-50 rounded-xl">
                        <Wand2 className="text-yellow-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-[22px] font-bold text-gray-900">Configuratore di Confronto</h2>
                        <p className="text-gray-500 text-sm">Analizza le dipendenze e i dettagli all'interno dello scenario "{activeScenario.title}"</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* COLONNA AREE */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Columns3 size={14}/> 1. Seleziona le aree (Colonne)
                        </h3>
                        <div 
                            onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'area')}
                            className="min-h-[100px] border-2 border-dashed border-gray-100 rounded-[20px] p-4 flex flex-wrap gap-3 bg-white"
                        >
                            {selectedAreas.map(id => {
                                const area = EXPERTISE_AREAS.find(a => a.id === id);
                                return (
                                    <div key={id} className="h-10 px-4 rounded-full text-white font-bold text-[13px] flex items-center gap-3 shadow-sm animate-fadeIn" style={{ backgroundColor: area?.hex }}>
                                        <area.icon size={16} /> {area?.label}
                                        <X size={16} className="cursor-pointer hover:bg-white/20 rounded-full" onClick={() => toggleArea(id)} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {EXPERTISE_AREAS.filter(a => !selectedAreas.includes(a.id)).map(a => (
                                <button key={a.id} draggable onDragStart={(e) => onDragStart(e, a.id, 'area')} onClick={() => toggleArea(a.id)} className="h-9 px-4 rounded-full border border-gray-200 bg-white text-gray-500 text-[12px] font-bold flex items-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.hex }}></div> {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* COLONNA VOCI */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Rows3 size={14}/> 2. Seleziona le voci (Righe)
                        </h3>
                        <div 
                            onDragOver={onDragOver} onDrop={(e) => onDrop(e, 'field')}
                            className="min-h-[100px] border-2 border-dashed border-gray-100 rounded-[20px] p-4 flex flex-wrap gap-3 bg-white"
                        >
                            {selectedFields.map(id => {
                                const field = AVAILABLE_FIELDS.find(f => f.id === id);
                                return (
                                    <div key={id} className="h-10 px-4 rounded-full bg-[#1e293b] text-white font-bold text-[13px] flex items-center gap-3 shadow-sm animate-fadeIn">
                                        <field.icon size={16} className="text-yellow-500" /> {field?.label}
                                        <X size={16} className="cursor-pointer hover:bg-white/20 rounded-full" onClick={() => toggleField(id)} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {AVAILABLE_FIELDS.filter(f => !selectedFields.includes(f.id)).map(f => (
                                <button key={f.id} draggable onDragStart={(e) => onDragStart(e, f.id, 'field')} onClick={() => toggleField(f.id)} className="h-9 px-4 rounded-full border border-gray-200 bg-white text-gray-500 text-[12px] font-bold flex items-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    <f.icon size={14} className="text-gray-400" /> {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* TABELLA CONFRONTO */}
            {selectedAreas.length > 0 && selectedFields.length > 0 ? (
                <div className="bg-white rounded-[24px] border border-gray-200 shadow-xl overflow-hidden">
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
                                                    <div className="p-3 rounded-2xl text-white shadow-lg" style={{ backgroundColor: area?.hex }}>
                                                        <area.icon size={24} />
                                                    </div>
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
                                        <tr key={fid}>
                                            <td className="p-6 border-b border-gray-100 font-bold text-[11px] text-gray-400 uppercase tracking-[0.1em] bg-white sticky left-0 z-10 align-top">
                                                <div className="flex items-center gap-3">
                                                    <field.icon size={18} /> {field?.label}
                                                </div>
                                            </td>
                                            {selectedAreas.map(aid => (
                                                <td key={`${aid}-${fid}`} className="p-8 border-b border-l border-gray-50 bg-white align-top">
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
                    <div className="p-4 bg-gray-100 rounded-full mb-6">
                        <Info size={32} className="text-gray-400" />
                    </div>
                    <p className="text-[16px] font-medium text-gray-500">Scegli almeno un'Area e una Voce per generare il confronto</p>
                </div>
            )}
        </div>
    );
};

export default CompareAreas;
