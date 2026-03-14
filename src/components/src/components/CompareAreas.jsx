import React, { useState } from 'react';
import { Target, List, Euro, TrendingUp, Activity, Clock, Award, X, Columns3, Rows3, Info } from 'lucide-react';
import { EXPERTISE_AREAS } from '../utils/constants';
import { getStrategicRole } from './AreaEditor';

// Definiamo i campi disponibili per il confronto (le Righe)
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
    // Stati per gli elementi selezionati
    const [selectedAreas, setSelectedAreas] = useState([]);
    const [selectedFields, setSelectedFields] = useState([]);

    // --- LOGICA DRAG & DROP E CLICK ---
    const toggleArea = (areaId) => {
        if (selectedAreas.includes(areaId)) {
            setSelectedAreas(prev => prev.filter(id => id !== areaId));
        } else {
            setSelectedAreas(prev => [...prev, areaId]);
        }
    };

    const toggleField = (fieldId) => {
        if (selectedFields.includes(fieldId)) {
            setSelectedFields(prev => prev.filter(id => id !== fieldId));
        } else {
            setSelectedFields(prev => [...prev, fieldId]);
        }
    };

    // Handler Drag HTML5
    const onDragStartArea = (e, areaId) => e.dataTransfer.setData('areaId', areaId);
    const onDragStartField = (e, fieldId) => e.dataTransfer.setData('fieldId', fieldId);
    
    const onDropArea = (e) => {
        const areaId = e.dataTransfer.getData('areaId');
        if (areaId && !selectedAreas.includes(areaId)) setSelectedAreas(prev => [...prev, areaId]);
    };
    
    const onDropField = (e) => {
        const fieldId = e.dataTransfer.getData('fieldId');
        if (fieldId && !selectedFields.includes(fieldId)) setSelectedFields(prev => [...prev, fieldId]);
    };

    const allowDrop = (e) => e.preventDefault();

    // --- MOTORE DI RENDERIZZAZIONE DEI CONTENUTI ---
    const renderCellContent = (areaId, fieldId) => {
        const areaData = activeScenario.data[areaId] || {};
        
        switch (fieldId) {
            case 'objectives':
                return areaData.objectives 
                    ? <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: areaData.objectives }} /> 
                    : <div className="text-gray-400 italic text-sm">Nessun obiettivo</div>;
            
            case 'projects':
                const projects = areaData.projects || [];
                if (projects.length === 0) return <div className="text-gray-400 italic text-sm">Nessun progetto</div>;
                return (
                    <div className="space-y-3">
                        {projects.map(p => (
                            <div key={p.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3 hover:border-blue-200 transition-colors">
                                <div className="font-bold text-sm text-gray-800 mb-2">{p.title || 'Senza Titolo'}</div>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <span className="bg-white px-2 py-1 rounded border border-gray-200">{p.start} &rarr; {p.end}</span>
                                    <span>Effort: {p.effort} | Impatto: {p.impact}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'importance':
                const role = getStrategicRole(areaData.importance || 0);
                return (
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg border border-gray-100 inline-flex">
                        <span className="text-xl">{role.icon}</span>
                        <span className="font-bold text-sm text-gray-800">{role.title}</span>
                    </div>
                );

            case 'budget':
                const min = (areaData.projects || []).reduce((acc, p) => acc + (Number(p.budgetMin) || 0), 0);
                const max = (areaData.projects || []).reduce((acc, p) => acc + (Number(p.budgetMax) || 0), 0);
                return (
                    <div className="font-bold text-lg text-blue-800 bg-blue-50/50 px-4 py-3 rounded-lg border border-blue-100 inline-block">
                        € {min.toLocaleString('it-IT')} - {max.toLocaleString('it-IT')}
                    </div>
                );

            case 'phasing':
                return (
                    <div className="space-y-4">
                        {[1, 2, 3].map(y => {
                            const val = areaData[`evolution_y${y}`];
                            if (!val) return null;
                            return (
                                <div key={y}>
                                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Anno {y}</div>
                                    <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100" dangerouslySetInnerHTML={{ __html: val }} />
                                </div>
                            );
                        })}
                        {(!areaData.evolution_y1 && !areaData.evolution_y2 && !areaData.evolution_y3) && <div className="text-gray-400 italic text-sm">Nessun phasing</div>}
                    </div>
                );

            case 'ksms':
                const ksms = areaData.ksms || [];
                if (ksms.length === 0) return <div className="text-gray-400 italic text-sm">Nessuna metrica</div>;
                return (
                    <div className="space-y-3">
                        {ksms.map(k => (
                            <div key={k.id} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                <div className="font-bold text-sm text-gray-800 mb-1">{k.name || 'Metrica'}</div>
                                <div className="flex gap-4 text-xs">
                                    <span className="text-gray-500">As Is: <strong className="text-gray-700">{k.valueAsIs || '-'}</strong></span>
                                    <span className="text-gray-500">Target: <strong className="text-blue-600">{k.targetValue || '-'}</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'routine':
                const tasks = areaData.routine || [];
                if (tasks.length === 0) return <div className="text-gray-400 italic text-sm">Nessuna attività</div>;
                return (
                    <ul className="space-y-2">
                        {tasks.map(t => (
                            <li key={t.id} className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                                <span className="leading-tight">{t.text}</span>
                            </li>
                        ))}
                    </ul>
                );

            default: return null;
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-12">
            
            {/* CONFIGURATORE DRAG & DROP */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* BLOCCO 1: AREE (Colonne) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <Columns3 size={16} /> 1. Seleziona le Aree (Colonne)
                    </div>
                    
                    {/* Dropzone Aree */}
                    <div 
                        onDragOver={allowDrop} 
                        onDrop={onDropArea}
                        className={`flex-grow border-2 border-dashed rounded-xl p-4 mb-6 flex flex-wrap gap-2 transition-colors ${selectedAreas.length > 0 ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'}`}
                        style={{ minHeight: '100px' }}
                    >
                        {selectedAreas.length === 0 && (
                            <div className="w-full flex items-center justify-center text-gray-400 text-sm font-medium">Trascinare qui le Aree (o cliccarle sotto)</div>
                        )}
                        {selectedAreas.map(areaId => {
                            const area = EXPERTISE_AREAS.find(a => a.id === areaId);
                            if (!area) return null;
                            return (
                                <div key={area.id} className="flex items-center gap-2 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm animate-fadeIn" style={{ backgroundColor: area.hex }}>
                                    <area.icon size={14} /> {area.label}
                                    <button onClick={() => toggleArea(area.id)} className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Libreria Aree disponibili */}
                    <div className="flex flex-wrap gap-2">
                        {EXPERTISE_AREAS.filter(a => !selectedAreas.includes(a.id)).map(area => (
                            <div 
                                key={area.id} 
                                draggable
                                onDragStart={(e) => onDragStartArea(e, area.id)}
                                onClick={() => toggleArea(area.id)}
                                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: area.hex }}></div>
                                {area.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* BLOCCO 2: VOCI (Righe) */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        <Rows3 size={16} /> 2. Seleziona le Voci (Righe)
                    </div>
                    
                    {/* Dropzone Voci */}
                    <div 
                        onDragOver={allowDrop} 
                        onDrop={onDropField}
                        className={`flex-grow border-2 border-dashed rounded-xl p-4 mb-6 flex flex-wrap gap-2 transition-colors ${selectedFields.length > 0 ? 'border-slate-800/30 bg-slate-50' : 'border-gray-200 bg-gray-50/50'}`}
                        style={{ minHeight: '100px' }}
                    >
                        {selectedFields.length === 0 && (
                            <div className="w-full flex items-center justify-center text-gray-400 text-sm font-medium">Trascinare qui le Voci (o cliccarle sotto)</div>
                        )}
                        {selectedFields.map(fieldId => {
                            const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
                            if (!field) return null;
                            return (
                                <div key={field.id} className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-sm animate-fadeIn">
                                    <field.icon size={14} className="text-yellow-500" /> {field.label}
                                    <button onClick={() => toggleField(field.id)} className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"><X size={14} /></button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Libreria Voci disponibili */}
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_FIELDS.filter(f => !selectedFields.includes(f.id)).map(field => (
                            <div 
                                key={field.id} 
                                draggable
                                onDragStart={(e) => onDragStartField(e, field.id)}
                                onClick={() => toggleField(field.id)}
                                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <field.icon size={12} className="text-gray-400" />
                                {field.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MATRICE DINAMICA */}
            {selectedAreas.length > 0 && selectedFields.length > 0 ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            {/* HEADER COLONNE (Aree) */}
                            <thead>
                                <tr>
                                    <th className="p-4 border-b border-gray-200 bg-gray-50 w-48 min-w-[200px] sticky left-0 z-20"></th>
                                    {selectedAreas.map(areaId => {
                                        const area = EXPERTISE_AREAS.find(a => a.id === areaId);
                                        return (
                                            <th key={areaId} className="p-6 border-b border-l border-gray-200 min-w-[320px] bg-white align-top">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg text-white shadow-sm" style={{ backgroundColor: area.hex }}><area.icon size={20} /></div>
                                                    <span className="font-bold text-gray-900 text-lg">{area.label}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            
                            {/* CORPO (Righe = Campi, Celle = Contenuto) */}
                            <tbody>
                                {selectedFields.map(fieldId => {
                                    const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
                                    return (
                                        <tr key={fieldId} className="group">
                                            {/* Etichetta Riga (Fissa a sinistra) */}
                                            <td className="p-5 border-b border-gray-200 bg-gray-50 sticky left-0 z-10 align-top group-hover:bg-blue-50/30 transition-colors">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                                    <field.icon size={16} /> {field.label}
                                                </div>
                                            </td>
                                            
                                            {/* Celle Contenuto */}
                                            {selectedAreas.map(areaId => (
                                                <td key={`${fieldId}-${areaId}`} className="p-6 border-b border-l border-gray-100 bg-white align-top group-hover:bg-slate-50/30 transition-colors">
                                                    {renderCellContent(areaId, fieldId)}
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
                <div className="bg-white/50 border border-gray-200 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center text-gray-400">
                    <Info size={48} className="mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">Seleziona almeno un'area e una voce dai blocchi in alto<br/>per generare la matrice di confronto.</p>
                </div>
            )}

        </div>
    );
};

export default CompareAreas;
