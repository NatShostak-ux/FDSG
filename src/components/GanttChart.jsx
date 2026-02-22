import React, { useState, useRef, useEffect } from 'react';
import { Flame, ArrowUpCircle, Circle } from 'lucide-react';

const GanttChart = ({ 
    projects, 
    areas, 
    showSwimlanes = false, 
    activeAreaId = null, 
    onUpdateProject, 
    isEditor = false, 
    selectedProjectId, 
    onSelectProject 
}) => {
    const containerRef = useRef(null);
    const [draggedProject, setDraggedProject] = useState(null);

    const monthWidth = 30;
    const GANTT_START_YEAR = 2026;
    const TOTAL_YEARS = 4;
    const TOTAL_MONTHS = TOTAL_YEARS * 12;
    const totalWidth = TOTAL_MONTHS * monthWidth;

    const dateToPixel = (dateStr) => {
        if (!dateStr) return 0;
        const date = new Date(dateStr);
        const start = new Date(`${GANTT_START_YEAR}-01-01`);
        const diffTime = Math.max(0, date - start);
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
        return diffMonths * monthWidth;
    };

    const pixelToDate = (px) => {
        const months = px / monthWidth;
        const date = new Date(`${GANTT_START_YEAR}-01-01`);
        date.setMonth(date.getMonth() + Math.round(months));
        return date.toISOString().slice(0, 7);
    };

    const handleMouseDown = (e, project, mode = 'move') => {
        if (!isEditor) return;
        if (onSelectProject) onSelectProject(project.id);
        
        e.preventDefault();
        e.stopPropagation();
        
        const currentLeft = dateToPixel(project.start);
        const currentWidth = dateToPixel(project.end) - currentLeft;

        setDraggedProject({
            ...project,
            mode,
            startX: e.clientX,
            originalLeft: currentLeft,
            originalWidth: Math.max(monthWidth, currentWidth),
            currentLeft: currentLeft,
            currentWidth: Math.max(monthWidth, currentWidth)
        });
    };

    const handleMouseMove = (e) => {
        if (!draggedProject) return;
        
        const deltaX = e.clientX - draggedProject.startX;
        
        if (draggedProject.mode === 'move') {
            const newLeft = Math.max(0, Math.min(totalWidth - draggedProject.currentWidth, draggedProject.originalLeft + deltaX));
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft }));
        } else if (draggedProject.mode === 'resize-right') {
            // Logica ripristinata per il ridimensionamento della lunghezza
            const newWidth = Math.max(monthWidth, draggedProject.originalWidth + deltaX);
            setDraggedProject(prev => ({ ...prev, currentWidth: newWidth }));
        }
    };

    const handleMouseUp = () => {
        if (draggedProject && onUpdateProject) {
            let newStartDate = pixelToDate(draggedProject.currentLeft);
            let newEndDate = pixelToDate(draggedProject.currentLeft + draggedProject.currentWidth);
            
            // Evitiamo che la data di fine sia uguale o precedente a quella di inizio
            if (newStartDate >= newEndDate) {
                const d = new Date(newStartDate + "-01");
                d.setMonth(d.getMonth() + 1);
                newEndDate = d.toISOString().slice(0, 7);
            }

            onUpdateProject(draggedProject.areaId, draggedProject.id, { 
                start: newStartDate, 
                end: newEndDate 
            });
        }
        setDraggedProject(null);
    };

    useEffect(() => {
        if (draggedProject) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedProject]);

    const renderProjectBar = (p, areaColor, rowIndex = 0) => {
        const isSelected = selectedProjectId === p.id;
        const isDragging = draggedProject?.id === p.id;
        
        const left = isDragging ? draggedProject.currentLeft : dateToPixel(p.start);
        const width = isDragging ? draggedProject.currentWidth : Math.max(monthWidth, dateToPixel(p.end) - dateToPixel(p.start));
        
        const topOffset = 8 + (rowIndex * 32);

        return (
            <div
                key={p.id}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectProject) onSelectProject(p.id);
                }}
                className={`absolute h-6 rounded-md flex items-center px-2 text-white text-[10px] cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg z-30' : 'opacity-80 hover:opacity-100 z-10'
                }`}
                style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    top: `${topOffset}px`,
                    backgroundColor: areaColor,
                    border: isSelected ? '1px solid white' : 'none',
                    transition: isDragging ? 'none' : 'all 0.2s' // Disabilita transizioni durante il drag per fluidità
                }}
            >
                <span className="truncate font-bold pointer-events-none">{p.title || 'Nuovo Progetto'}</span>
                
                {/* Zona sensibile per il ridimensionamento (bordo destro) */}
                {isEditor && (
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize z-40" 
                        onMouseDown={(e) => handleMouseDown(e, p, 'resize-right')}
                    ></div>
                )}
                
                {/* Zona sensibile per lo spostamento (corpo della barra) */}
                <div 
                    className="absolute inset-0 z-0" 
                    onMouseDown={(e) => handleMouseDown(e, p, 'move')}
                ></div>
            </div>
        );
    };

    const years = [2026, 2027, 2028, 2029];
    const months = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];

    return (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-lg bg-white" ref={containerRef}>
            <div style={{ width: `${totalWidth + 200}px` }} className="relative">
                {/* Header Timeline */}
                <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
                    <div className="w-48 flex-shrink-0 p-3 text-[10px] font-bold text-gray-400 uppercase border-r border-gray-200 sticky left-0 bg-gray-50 z-30 text-center">
                        {showSwimlanes ? 'Area' : 'Iniziativa'}
                    </div>
                    <div className="flex">
                        {years.map(y => (
                            <div key={y} className="border-r border-gray-200">
                                <div className="text-center py-1 text-[10px] font-bold text-gray-500 bg-gray-100 border-b border-gray-200">{y}</div>
                                <div className="flex">
                                    {months.map((m, i) => (
                                        <div key={i} className="w-[30px] text-center text-[8px] py-1 text-gray-400 border-r border-gray-50 last:border-0">{m}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Righe Progetti */}
                <div className="relative min-h-[200px]">
                    {showSwimlanes ? (
                        areas.map(area => {
                            const areaProjects = projects.filter(p => p.areaId === area.id);
                            const rowHeight = Math.max(44, (areaProjects.length * 32) + 16);

                            return (
                                <div key={area.id} className="border-b border-gray-100 relative z-10">
                                    <div className="flex" style={{ minHeight: `${rowHeight}px` }}>
                                        <div className="w-48 flex-shrink-0 bg-white border-r border-gray-200 px-3 py-3 flex items-start gap-2 sticky left-0 z-20 h-full">
                                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: area.hex }}></div>
                                            <span className="text-[10px] font-bold text-gray-700 uppercase leading-tight">{area.label}</span>
                                        </div>
                                        <div className="flex-grow relative h-full">
                                            {areaProjects.map((p, idx) => renderProjectBar(p, area.hex, idx))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        projects.map(p => {
                            const currentArea = areas.find(a => a.id === activeAreaId);
                            const barColor = currentArea ? currentArea.hex : '#ccc';
                            return (
                                <div 
                                    key={p.id} 
                                    className={`flex items-center h-10 border-b border-gray-50 group transition-colors ${selectedProjectId === p.id ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                                >
                                    <div className={`w-48 flex-shrink-0 px-3 truncate text-xs font-medium sticky left-0 z-20 transition-all ${
                                        selectedProjectId === p.id ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 bg-white'
                                    } border-r border-gray-100 h-full flex items-center`}>
                                        {p.title || 'Nuovo Progetto'}
                                    </div>
                                    <div className="flex-grow relative h-full">
                                        {renderProjectBar(p, barColor, 0)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
