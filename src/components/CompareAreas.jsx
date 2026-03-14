import React, { useState } from 'react';
import { Target, List, Euro, TrendingUp, Activity, Clock, Award, X, Columns3, Rows3, Info } from 'lucide-react';
import { EXPERTISE_AREAS } from '../utils/constants';
import { getStrategicRole } from './AreaEditor';

const AVAILABLE_FIELDS = [
    { id: 'objectives', label: 'Obiettivi Macro', icon: Target },
    { id: 'projects', label: 'Iniziative Chiave', icon: List },
    { id: 'importance', label: 'Ruolo Strategico', icon: Award },
    { id: 'budget', label: 'Budget & Risorse', icon: Euro },
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

    const renderCellContent = (areaId, fieldId) => {
        const areaData = activeScenario.data[areaId] || {};
        switch (fieldId) {
            case 'objectives':
                return areaData.objectives ? <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: areaData.objectives }} /> : <span className="text-gray-400 italic text-xs">Nessun obiettivo</span>;
            case 'projects':
                return (areaData.projects || []).length > 0 ? (
                    <div className="space-y-2">
                        {areaData.projects.map(p => (
                            <div key={p.id} className="text-xs p-2 bg-gray-50 rounded border border-gray-100">
                                <div className="font-bold text-gray-800">{p.title || 'Senza Titolo'}</div>
                                <div className="text-[9px] text-gray-500 mt-1 uppercase">{p.start} - {p.end}</div>
                            </div>
                        ))}
                    </div>
                ) : <span className="text-gray-400 italic text-xs">Nessun progetto</span>;
            case 'importance':
                const role = getStrategicRole(areaData.importance || 0);
                return <div className="flex items-center gap-2 font-bold text-xs text-gray-700">{role.icon} {role.label}</div>;
            case 'budget':
                const min = (areaData.projects || []).reduce((acc, p) => acc + (Number(p.budgetMin) || 0), 0);
                const max = (areaData.projects || []).reduce((acc, p) => acc + (Number(p.budgetMax) || 0), 0);
                return <div className="font-bold text-blue-700">€ {min.toLocaleString()} - {max.toLocaleString()}</div>;
            default: return <span className="text-gray-400 italic text-xs">Dato non disponibile</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Columns3 size={14}/> 1. Seleziona Aree</h3>
                    <div className="flex flex-wrap gap-2">
                        {EXPERTISE_AREAS.map(a => (
                            <button key={a.id} onClick={() => toggleArea(a.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedAreas.includes(a.id) ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2"><Rows3 size={14}/> 2. Seleziona Campi</h3>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_FIELDS.map(f => (
                            <button key={f.id} onClick={() => toggleField(f.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedFields.includes(f.id) ? 'bg-slate-800 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {selectedAreas.length > 0 && selectedFields.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-4 border-b border-gray-200 w-48"></th>
                                    {selectedAreas.map(id => (
                                        <th key={id} className="p-4 border-b border-l border-gray-200 font-bold text-gray-900">
                                            {EXPERTISE_AREAS.find(a => a.id === id)?.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {selectedFields.map(fid => (
                                    <tr key={fid} className="hover:bg-gray-50/50">
                                        <td className="p-4 border-b border-gray-200 font-bold text-[10px] text-gray-400 uppercase bg-gray-50/30">
                                            {AVAILABLE_FIELDS.find(f => f.id === fid)?.label}
                                        </td>
                                        {selectedAreas.map(aid => (
                                            <td key={`${aid}-${fid}`} className="p-4 border-b border-l border-gray-100 align-top">
                                                {renderCellContent(aid, fid)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                    Seleziona almeno un'area e un campo per vedere il confronto.
                </div>
            )}
        </div>
    );
};

export default CompareAreas;
