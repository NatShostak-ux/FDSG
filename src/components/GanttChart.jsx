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

    const monthWidth = 30; // Larghezza esatta di un mese
    const GANTT_START_YEAR = 2026;
    const TOTAL_YEARS = 4;
    const TOTAL_MONTHS = TOTAL_YEARS * 12;
    const totalWidth = TOTAL_MONTHS * monthWidth;

    // Converte YYYY-MM (es. 2026-01) nell'offset in pixel dal margine sinistro
    const dateToPixel = (dateStr) => {
        if (!dateStr) return 0;
        const [year, month] = dateStr.split('-');
        const monthsDiff = (parseInt(year) - GANTT_START_YEAR) * 12 + (parseInt(month) - 1);
        return monthsDiff * monthWidth;
    };

    // Converte un offset in pixel in una data YYYY-MM
    const pixelToDate = (px) => {
        const totalMonths = Math.round(px / monthWidth);
        const date = new Date(`${GANTT_START_YEAR}-01-01`);
        date.setMonth(date.getMonth() + totalMonths);
        return date.toISOString().slice(0, 7);
    };

    const handleMouseDown = (e, project, mode = 'move') => {
        if (!isEditor) return;
        if (onSelectProject) onSelectProject(project.id);
        
        e.preventDefault();
        e.stopPropagation();
        
        const currentLeft = dateToPixel(project.start);
        
        // FIX: La larghezza calcola che il mese di fine è COMPRESO. 
        // Es: Inizio Gennaio (0px), Fine Gennaio. Diff = 0. Aggiungiamo 1 mese (30px).
        const rawWidth = dateToPixel(project.end) - currentLeft;
        const currentWidth = rawWidth + monthWidth;

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
            // Effetto Snap-to-grid: arrotondiamo a multipli di monthWidth
            let rawNewLeft = draggedProject.originalLeft + deltaX;
            let snappedLeft = Math.round(rawNewLeft / monthWidth) * monthWidth;
            const newLeft = Math.max(0, Math.min(totalWidth - draggedProject.currentWidth, snappedLeft));
            
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft }));
        } else if (draggedProject.mode === 'resize-right') {
            let rawNewWidth = draggedProject.originalWidth + deltaX;
            let snappedWidth = Math.round(rawNewWidth / monthWidth) * monthWidth;
            const newWidth = Math.max(monthWidth, snappedWidth); // Minimo 1 mese
            
            setDraggedProject(prev => ({ ...prev, currentWidth: newWidth }));
        }
    };

    const handleMouseUp = () => {
        if (draggedProject && onUpdateProject) {
            
            // FIX ANTISTRESS: Se non mi sono mosso di un intero blocco (30px), è solo un click!
            if (draggedProject.currentLeft === draggedProject.originalLeft && 
                draggedProject.currentWidth === draggedProject.originalWidth) {
                setDraggedProject(null);
                return; // Non ricalcolo nulla, la barra resta intatta.
            }

            let newStartDate = pixelToDate(draggedProject.currentLeft);
            
            // FIX MESE FINE: Sottraiamo il monthWidth che avevamo aggiunto per il calcolo visivo,
            // così la data salvata su database corrisponde al mese corretto.
            let newEndDate = pixelToDate(draggedProject.currentLeft + draggedProject.currentWidth - monthWidth);
            
            // Fallback di sicurezza
            if (newStartDate > newEndDate) {
                newEndDate = newStartDate;
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
        
        let left, width;
        
        if (isDragging) {
            left = draggedProject.currentLeft;
            width = draggedProject.currentWidth;
        } else {
            left = dateToPixel(p.start);
            // VISUALIZZAZIONE: La barra occupa lo spazio INCLUSO il mese di fine
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
                className={`absolute h-6 rounded-md flex items-center px-2 text-white text-[10px] cursor-pointer transition-all select-none ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg z-30' : 'opacity-80 hover:opacity-100 z-10'
                }`}
                style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    top: `${topOffset}px`,
                    backgroundColor: areaColor,
                    border: isSelected ? '1px solid white' : 'none',
                    transition: isDragging ? 'none' : 'all 0.2s ease-out'
                }}
            >
                <span className="truncate font-bold pointer-events-none">{p.title || 'Nuovo Progetto'}</span>
                
                {isEditor && (
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize z-40 hover:bg-white/30 rounded-r-md flex items-center justify-center" 
                        onMouseDown={(e) => handleMouseDown(e, p, 'resize-right')}
                    >
                        <div className="w-0.5 h-3 bg-white/50 rounded-full"></div>
                    </div>
                )}
                
                <div 
                    className="absolute inset-y-0 left-0 right-4 z-0 cursor-grab active:cursor-grabbing" 
                    onMouseDown={(e) => handleMouseDown(e, p, 'move')}
                ></div>
            </div>
        );
    };

    const years = [2026, 2027, 2028, 2029];
    const months = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];

    return (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-lg bg-white custom-scrollbar" ref={containerRef}>
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
                <div className="relative min-h-[200px] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMTAwJSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48bGluZSB4MT0iMzAiIHkxPSIwIiB4Mj0iMzAiIHkyPSIxMDAlIiBzdHJva2U9IiNmM2Y0ZjYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] bg-repeat" style={{ backgroundPosition: '192px 0' }}>
                    {showSwimlanes ? (
                        areas.map(area => {
                            const areaProjects = projects.filter(p => p.areaId === area.id);
                            const rowHeight = Math.max(44, (areaProjects.length * 32) + 16);

                            return (
                                <div key={area.id} className="border-b border-gray-100 relative z-10 hover:bg-gray-50/30 transition-colors">
                                    <div className="flex" style={{ minHeight: `${rowHeight}px` }}>
                                        <div className="w-48 flex-shrink-0 bg-white/95 backdrop-blur-sm border-r border-gray-200 px-3 py-3 flex items-start gap-2 sticky left-0 z-20 h-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
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
                        projects.map((p, index) => {
                            const currentArea = areas.find(a => a.id === activeAreaId);
                            const barColor = currentArea ? currentArea.hex : '#ccc';
                            return (
                                <div 
                                    key={p.id} 
                                    className={`flex items-center h-10 border-b border-gray-50 group transition-colors ${selectedProjectId === p.id ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`}
                                >
                                    <div className={`w-48 flex-shrink-0 px-3 truncate text-xs font-medium sticky left-0 z-20 transition-all ${
                                        selectedProjectId === p.id ? 'text-blue-600 font-bold bg-blue-50 border-r-blue-200' : 'text-gray-600 bg-white/95 backdrop-blur-sm border-r-gray-100'
                                    } border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] h-full flex items-center`}>
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
