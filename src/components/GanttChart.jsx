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

    const monthWidth = 30; // Larghezza fissa e precisa di 1 mese in pixel
    const GANTT_START_YEAR = 2026;
    const TOTAL_YEARS = 4;
    const TOTAL_MONTHS = TOTAL_YEARS * 12;
    const totalWidth = TOTAL_MONTHS * monthWidth;

    // Converte puramente in modo matematico YYYY-MM in pixel (niente new Date che sballa coi fusi orari)
    const dateToPixel = (dateStr) => {
        if (!dateStr) return 0;
        const [year, month] = dateStr.split('-');
        const monthsDiff = (parseInt(year, 10) - GANTT_START_YEAR) * 12 + (parseInt(month, 10) - 1);
        return monthsDiff * monthWidth;
    };

    // Converte puramente i pixel in stringa YYYY-MM
    const pixelToDate = (px) => {
        const totalMonths = Math.round(px / monthWidth);
        const y = GANTT_START_YEAR + Math.floor(totalMonths / 12);
        const m = (totalMonths % 12) + 1;
        return `${y}-${m.toString().padStart(2, '0')}`;
    };

    const handleMouseDown = (e, project, mode) => {
        if (!isEditor) return;
        if (onSelectProject) onSelectProject(project.id);
        
        e.preventDefault();
        e.stopPropagation();
        
        const currentLeft = dateToPixel(project.start);
        // La larghezza copre FINO ALLA FINE del mese finale (+ monthWidth)
        const currentWidth = (dateToPixel(project.end) - currentLeft) + monthWidth;

        setDraggedProject({
            ...project,
            mode,
            startX: e.clientX,
            originalLeft: currentLeft,
            originalWidth: currentWidth,
            currentLeft: currentLeft,
            currentWidth: currentWidth
        });
    };

    const handleMouseMove = (e) => {
        if (!draggedProject) return;
        
        const deltaX = e.clientX - draggedProject.startX;
        
        if (draggedProject.mode === 'move') {
            // Sposta tutto il blocco
            let rawNewLeft = draggedProject.originalLeft + deltaX;
            let snappedLeft = Math.round(rawNewLeft / monthWidth) * monthWidth;
            const maxLeft = totalWidth - draggedProject.currentWidth;
            const newLeft = Math.max(0, Math.min(maxLeft, snappedLeft));
            
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft }));
            
        } else if (draggedProject.mode === 'resize-right') {
            // Estende solo la fine
            let rawNewWidth = draggedProject.originalWidth + deltaX;
            let snappedWidth = Math.round(rawNewWidth / monthWidth) * monthWidth;
            const maxAvailableWidth = totalWidth - draggedProject.originalLeft;
            const newWidth = Math.max(monthWidth, Math.min(maxAvailableWidth, snappedWidth)); // Minimo 1 mese
            
            setDraggedProject(prev => ({ ...prev, currentWidth: newWidth }));
            
        } else if (draggedProject.mode === 'resize-left') {
            // Estende solo l'inizio (Tenendo bloccata la parte destra)
            let rawNewLeft = draggedProject.originalLeft + deltaX;
            let snappedLeft = Math.round(rawNewLeft / monthWidth) * monthWidth;
            
            const maxLeft = draggedProject.originalLeft + draggedProject.originalWidth - monthWidth;
            const newLeft = Math.max(0, Math.min(maxLeft, snappedLeft));
            
            const rightEdge = draggedProject.originalLeft + draggedProject.originalWidth;
            const newWidth = rightEdge - newLeft;
            
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft, currentWidth: newWidth }));
        }
    };

    const handleMouseUp = () => {
        if (draggedProject && onUpdateProject) {
            // Se non si è mosso di almeno 1 mese, consideralo un click normale. Non salvare.
            if (draggedProject.currentLeft !== draggedProject.originalLeft || 
                draggedProject.currentWidth !== draggedProject.originalWidth) {
                
                const newStartDate = pixelToDate(draggedProject.currentLeft);
                // Sottraiamo il mese "cuscinetto" per trovare il mese finale corretto nel DB
                const newEndDate = pixelToDate(draggedProject.currentLeft + draggedProject.currentWidth - monthWidth);

                onUpdateProject(draggedProject.areaId, draggedProject.id, { 
                    start: newStartDate, 
                    end: newEndDate 
                });
            }
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
        
        let left, width;
        
        if (isDragging) {
            left = draggedProject.currentLeft;
            width = draggedProject.currentWidth;
        } else {
            left = dateToPixel(p.start);
            width = (dateToPixel(p.end) - left) + monthWidth;
        }
        
        const topOffset = 8 + (rowIndex * 32);

        return (
            <div
                key={p.id}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectProject) onSelectProject(p.id);
                }}
                className={`absolute h-6 rounded-md flex items-center px-2 text-white text-[10px] select-none group ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg z-30' : 'opacity-85 hover:opacity-100 z-10'
                }`}
                style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    top: `${topOffset}px`,
                    backgroundColor: areaColor,
                    border: isSelected ? '1px solid white' : 'none',
                    // Tolta l'animazione di layout per evitare l'effetto "elastico" durante le modifiche testuali
                    transition: 'background-color 0.2s, opacity 0.2s, box-shadow 0.2s'
                }}
            >
                <span className="truncate font-bold pointer-events-none z-20">{p.title || 'Nuovo Progetto'}</span>
                
                {/* MANIGLIA SINISTRA (Inizio Progetto) */}
                {isEditor && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize z-40 flex items-center justify-center hover:bg-white/20 rounded-l-md" 
                        onMouseDown={(e) => handleMouseDown(e, p, 'resize-left')}
                    >
                        <div className="w-0.5 h-3 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                )}
                
                {/* CORPO CENTRALE (Sposta tutto il progetto) */}
                {isEditor && (
                    <div 
                        className="absolute inset-y-0 left-3 right-3 z-30 cursor-grab active:cursor-grabbing" 
                        onMouseDown={(e) => handleMouseDown(e, p, 'move')}
                    ></div>
                )}

                {/* MANIGLIA DESTRA (Fine Progetto) */}
                {isEditor && (
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize z-40 flex items-center justify-center hover:bg-white/20 rounded-r-md" 
                        onMouseDown={(e) => handleMouseDown(e, p, 'resize-right')}
                    >
                        <div className="w-0.5 h-3 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                )}
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
