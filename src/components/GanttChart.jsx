import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
    const [sidebarWidth, setSidebarWidth] = useState(192); // Default w-48

    // STATO PER IL TOOLTIP GLOBALE
    const [tooltipData, setTooltipData] = useState(null);

    const monthWidth = 30; 
    const GANTT_START_YEAR = 2026;
    const TOTAL_YEARS = 4;
    const TOTAL_MONTHS = TOTAL_YEARS * 12;
    const totalWidth = TOTAL_MONTHS * monthWidth;

    const dateToPixel = (dateStr) => {
        if (!dateStr) return 0;
        const [year, month] = dateStr.split('-');
        const monthsDiff = (parseInt(year, 10) - GANTT_START_YEAR) * 12 + (parseInt(month, 10) - 1);
        return monthsDiff * monthWidth;
    };

    const pixelToDate = (px) => {
        const totalMonths = Math.round(px / monthWidth);
        const y = GANTT_START_YEAR + Math.floor(totalMonths / 12);
        const m = (totalMonths % 12) + 1;
        return `${y}-${m.toString().padStart(2, '0')}`;
    };

    // --- GESTIONE RESIZE SIDEBAR ---
    const startResizing = (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX;
        const startWidth = sidebarWidth;
        const doDrag = (dragEvent) => {
            const newWidth = Math.max(150, Math.min(500, startWidth + dragEvent.clientX - startX));
            setSidebarWidth(newWidth);
        };
        const stopDrag = () => {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.style.cursor = 'default';
        };
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
        document.body.style.cursor = 'col-resize';
    };

    // --- GESTIONE DRAG PILLOLE ---
    const handleMouseDown = (e, project, mode) => {
        if (!isEditor) return;
        if (onSelectProject) onSelectProject(project.id);
        e.preventDefault(); e.stopPropagation();
        setTooltipData(null); // Nascondi tooltip durante il drag
        const currentLeft = dateToPixel(project.start);
        const currentWidth = (dateToPixel(project.end) - currentLeft) + monthWidth;
        setDraggedProject({
            ...project, mode, startX: e.clientX, originalLeft: currentLeft,
            originalWidth: currentWidth, currentLeft: currentLeft, currentWidth: currentWidth
        });
    };

    const handleMouseMove = useCallback((e) => {
        if (!draggedProject) return;
        const deltaX = e.clientX - draggedProject.startX;
        if (draggedProject.mode === 'move') {
            let snappedLeft = Math.round((draggedProject.originalLeft + deltaX) / monthWidth) * monthWidth;
            const newLeft = Math.max(0, Math.min(totalWidth - draggedProject.currentWidth, snappedLeft));
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft }));
        } else if (draggedProject.mode === 'resize-right') {
            let snappedWidth = Math.round((draggedProject.originalWidth + deltaX) / monthWidth) * monthWidth;
            setDraggedProject(prev => ({ ...prev, currentWidth: Math.max(monthWidth, snappedWidth) }));
        } else if (draggedProject.mode === 'resize-left') {
            let snappedLeft = Math.round((draggedProject.originalLeft + deltaX) / monthWidth) * monthWidth;
            const newLeft = Math.max(0, Math.min(draggedProject.originalLeft + draggedProject.originalWidth - monthWidth, snappedLeft));
            const newWidth = (draggedProject.originalLeft + draggedProject.originalWidth) - newLeft;
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft, currentWidth: newWidth }));
        }
    }, [draggedProject, totalWidth]);

    const handleMouseUp = useCallback(() => {
        if (draggedProject && onUpdateProject) {
            const newStartDate = pixelToDate(draggedProject.currentLeft);
            const newEndDate = pixelToDate(draggedProject.currentLeft + draggedProject.currentWidth - monthWidth);
            onUpdateProject(draggedProject.areaId, draggedProject.id, { start: newStartDate, end: newEndDate });
        }
        setDraggedProject(null);
    }, [draggedProject, onUpdateProject]);

    useEffect(() => {
        if (draggedProject) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedProject, handleMouseMove, handleMouseUp]);

    // --- GESTIONE HOVER E POSIZIONAMENTO TOOLTIP ---
    const handleProjectMouseEnter = (e, project, areaColor) => {
        if (draggedProject) return; 
        
        const barElement = e.currentTarget;
        const textSpan = barElement.querySelector('span');

        // Se il testo ci sta tutto, non mostrare il tooltip
        if (textSpan && textSpan.scrollWidth <= textSpan.clientWidth + 2) {
            return; 
        }

        const rect = barElement.getBoundingClientRect();
        
        // Se la barra si trova molto in alto nello schermo (< 250px dal top), 
        // c'è il rischio di scontrarsi con gli header. Invertiamo il tooltip.
        const isTop = rect.top > 250; 
        const yPos = isTop ? rect.top : rect.bottom;

        setTooltipData({
            title: project.title || 'Nuovo Progetto',
            start: project.start,
            end: project.end,
            color: areaColor,
            x: rect.left + rect.width / 2,
            y: yPos,
            isTop: isTop
        });
    };

    const handleProjectMouseLeave = () => {
        setTooltipData(null);
    };

    // RENDER DELLA SINGOLA PILLOLA
    const renderProjectBar = (p, areaColor, rowIndex = 0) => {
        const isSelected = selectedProjectId === p.id;
        const isDragging = draggedProject?.id === p.id;
        let left = isDragging ? draggedProject.currentLeft : dateToPixel(p.start);
        let width = isDragging ? draggedProject.currentWidth : (dateToPixel(p.end) - left) + monthWidth;
        const topOffset = 8 + (rowIndex * 32);
        
        return (
            <div
                key={p.id}
                onClick={(e) => { e.stopPropagation(); if (onSelectProject) onSelectProject(p.id); }}
                onMouseEnter={(e) => handleProjectMouseEnter(e, p, areaColor)}
                onMouseLeave={handleProjectMouseLeave}
                className={`absolute h-6 rounded-md flex items-center px-2 text-white text-[10px] select-none cursor-pointer ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg z-20' : 'opacity-90 hover:opacity-100 z-10'
                }`}
                style={{ left: `${left}px`, width: `${width}px`, top: `${topOffset}px`, backgroundColor: areaColor }}
            >
                {/* TESTO DENTRO LA PILLOLA */}
                <span className="truncate font-bold pointer-events-none w-full block overflow-hidden text-ellipsis whitespace-nowrap Outfit">
                    {p.title || 'Nuovo Progetto'}
                </span>

                {isEditor && (
                    <>
                        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize z-30" onMouseDown={(e) => handleMouseDown(e, p, 'resize-left')} />
                        <div className="absolute inset-y-0 left-2 right-2 z-20 cursor-grab active:cursor-grabbing" onMouseDown={(e) => handleMouseDown(e, p, 'move')} />
                        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-30" onMouseDown={(e) => handleMouseDown(e, p, 'resize-right')} />
                    </>
                )}
            </div>
        );
    };

    const years = [2026, 2027, 2028, 2029];
    const months = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];

    return (
        <div className="w-full border border-gray-200 rounded-lg bg-white relative font-sans Outfit">
            
            {/* PORTAL TOOLTIP GLOBALE: Viene appeso al body così è sempre sopra a tutto */}
            {tooltipData && createPortal(
                <div 
                    className="fixed bg-white text-slate-700 text-[11px] px-3 py-2 rounded-lg shadow-xl border border-gray-200 z-[99999] whitespace-normal w-max max-w-[280px] font-normal pointer-events-none animate-fadeInFast Outfit"
                    style={{
                        left: `${tooltipData.x}px`,
                        top: `${tooltipData.y}px`,
                        // Inverte la traslazione se è "Top" (va sopra la barra) o "Bottom" (va sotto)
                        transform: tooltipData.isTop ? 'translate(-50%, -100%) translateY(-8px)' : 'translate(-50%, 0) translateY(8px)'
                    }}
                >
                    {tooltipData.isTop ? (
                        <>
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-white"></div>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-gray-200 -z-10"></div>
                        </>
                    ) : (
                        <>
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-white"></div>
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-b-[5px] border-b-gray-200 -z-10"></div>
                        </>
                    )}

                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tooltipData.color }}></div>
                        <div className="font-bold text-gray-900 Outfit pr-1">{tooltipData.title}</div>
                    </div>
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider Outfit ml-3.5">
                        {tooltipData.start} → {tooltipData.end}
                    </div>
                </div>,
                document.body
            )}

            <div className="w-full overflow-x-auto custom-scrollbar" ref={containerRef}>
                <div style={{ minWidth: `${totalWidth + sidebarWidth}px`, width: 'max-content' }} className="relative flex flex-col">
                    
                    {/* HEADER TIMELINE */}
                    <div className="flex sticky top-0 z-[80] bg-white border-b border-gray-200">
                        <div 
                            style={{ width: `${sidebarWidth}px` }} 
                            className="flex-shrink-0 p-3 text-[10px] font-bold text-gray-400 uppercase border-r border-gray-200 sticky left-0 bg-white z-[90] flex justify-between items-center group relative Outfit"
                        >
                            <span className="truncate pr-2">{showSwimlanes ? 'Area' : 'Iniziativa'}</span>
                            <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-20 transition-colors" onMouseDown={startResizing} />
                        </div>
                        <div className="flex bg-white">
                            {years.map(y => (
                                <div key={y} className="border-r border-gray-200 flex-shrink-0">
                                    <div className="text-center py-1 text-[10px] font-bold text-gray-500 bg-gray-50 border-b border-gray-200 Outfit">{y}</div>
                                    <div className="flex">
                                        {months.map((m, i) => (
                                            <div key={i} className="w-[30px] text-center text-[8px] py-1 text-gray-400 border-r border-gray-50 last:border-0 Outfit">{m}</div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHE CONTENUTO */}
                    <div className="relative min-h-[200px]">
                        {showSwimlanes ? (
                            areas.map(area => {
                                const areaProjects = projects.filter(p => p.areaId === area.id);
                                const rowHeight = Math.max(44, (areaProjects.length * 32) + 16);
                                return (
                                    <div key={area.id} className="flex border-b border-gray-100 relative" style={{ minHeight: `${rowHeight}px` }}>
                                        <div 
                                            style={{ width: `${sidebarWidth}px` }} 
                                            className="flex-shrink-0 px-3 py-3 flex items-start gap-2 sticky left-0 bg-white border-r border-gray-200 z-[50] relative Outfit"
                                        >
                                            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: area.hex }}></div>
                                            <span className="text-[10px] font-bold text-gray-700 uppercase leading-tight pr-2">{area.label}</span>
                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-20 transition-colors" onMouseDown={startResizing} />
                                        </div>
                                        <div className="flex-grow relative h-full">
                                            {areaProjects.map((p, idx) => renderProjectBar(p, area.hex, idx))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            projects.map((p, idx) => {
                                const currentArea = areas.find(a => a.id === p.areaId);
                                return (
                                    <div key={p.id} className="flex h-10 border-b border-gray-50 relative">
                                        <div 
                                            style={{ width: `${sidebarWidth}px` }} 
                                            className={`flex-shrink-0 px-3 text-[11px] font-medium sticky left-0 border-r border-gray-100 h-full flex items-center z-[50] relative Outfit ${
                                                selectedProjectId === p.id ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 bg-white'
                                            }`}
                                        >
                                            <span className="truncate w-full pr-2 block">{p.title || 'Nuovo Progetto'}</span>
                                            <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-20 transition-colors" onMouseDown={startResizing} />
                                        </div>
                                        <div className="flex-grow relative h-full">
                                            {renderProjectBar(p, currentArea?.hex || '#ccc', 0)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;
