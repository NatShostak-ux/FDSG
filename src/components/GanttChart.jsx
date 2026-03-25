import React, { useState, useRef, useEffect } from 'react';

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
    
    // STATO PER LA LARGHEZZA DELLA BARRA LATERALE
    const [sidebarWidth, setSidebarWidth] = useState(192); // 192px di default (equivalente a w-48)

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

    // FUNZIONI PER IL DRAG DELLA COLONNA (RESIZER)
    const startResizing = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const doDrag = (dragEvent) => {
            // Limiti min e max larghezza (es. da 150px a 500px)
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

    // FUNZIONI PER IL DRAG DELLE PILLOLE
    const handleMouseDown = (e, project, mode) => {
        if (!isEditor) return;
        if (onSelectProject) onSelectProject(project.id);
        e.preventDefault();
        e.stopPropagation();
        const currentLeft = dateToPixel(project.start);
        const currentWidth = (dateToPixel(project.end) - currentLeft) + monthWidth;
        setDraggedProject({
            ...project, mode, startX: e.clientX, originalLeft: currentLeft,
            originalWidth: currentWidth, currentLeft: currentLeft, currentWidth: currentWidth
        });
    };

    const handleMouseMove = (e) => {
        if (!draggedProject) return;
        const deltaX = e.clientX - draggedProject.startX;
        if (draggedProject.mode === 'move') {
            let rawNewLeft = draggedProject.originalLeft + deltaX;
            let snappedLeft = Math.round(rawNewLeft / monthWidth) * monthWidth;
            const newLeft = Math.max(0, Math.min(totalWidth - draggedProject.currentWidth, snappedLeft));
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft }));
        } else if (draggedProject.mode === 'resize-right') {
            let rawNewWidth = draggedProject.originalWidth + deltaX;
            let snappedWidth = Math.round(rawNewWidth / monthWidth) * monthWidth;
            setDraggedProject(prev => ({ ...prev, currentWidth: Math.max(monthWidth, snappedWidth) }));
        } else if (draggedProject.mode === 'resize-left') {
            let rawNewLeft = draggedProject.originalLeft + deltaX;
            let snappedLeft = Math.round(rawNewLeft / monthWidth) * monthWidth;
            const newLeft = Math.max(0, Math.min(draggedProject.originalLeft + draggedProject.originalWidth - monthWidth, snappedLeft));
            const newWidth = (draggedProject.originalLeft + draggedProject.originalWidth) - newLeft;
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft, currentWidth: newWidth }));
        }
    };

    const handleMouseUp = () => {
        if (draggedProject && onUpdateProject) {
            const newStartDate = pixelToDate(draggedProject.currentLeft);
            const newEndDate = pixelToDate(draggedProject.currentLeft + draggedProject.currentWidth - monthWidth);
            onUpdateProject(draggedProject.areaId, draggedProject.id, { start: newStartDate, end: newEndDate });
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

    // RENDER DELLA SINGOLA PILLOLA
    const renderProjectBar = (p, areaColor, rowIndex = 0) => {
        const isSelected = selectedProjectId === p.id;
        const isDragging = draggedProject?.id === p.id;
        let left = isDragging ? draggedProject.currentLeft : dateToPixel(p.start);
        let width = isDragging ? draggedProject.currentWidth : (dateToPixel(p.end) - left) + monthWidth;
        const topOffset = 8 + (rowIndex * 32);
        
        const title = p.title || 'Nuovo Progetto';

        return (
            <div
                key={p.id}
                onClick={(e) => { e.stopPropagation(); if (onSelectProject) onSelectProject(p.id); }}
                className={`absolute h-6 rounded-md flex items-center px-2 text-white text-[10px] select-none cursor-pointer group ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-lg z-20' : 'opacity-90 hover:opacity-100 z-10'
                }`}
                style={{ left: `${left}px`, width: `${width}px`, top: `${topOffset}px`, backgroundColor: areaColor }}
            >
                {/* TESTO DENTRO LA PILLOLA (TRONCATO SE TROPPO LUNGO) */}
                <span className="truncate font-bold pointer-events-none w-full block overflow-hidden text-ellipsis whitespace-nowrap">
                    {title}
                </span>

                {/* TOOLTIP FLUTTUANTE (VISIBILE IN HOVER) */}
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[11px] px-3 py-2 rounded-lg shadow-xl z-[200] whitespace-normal w-max max-w-[250px] font-normal pointer-events-none before:content-[''] before:absolute before:top-full before:left-4 before:border-4 before:border-transparent before:border-t-slate-900">
                    <div className="font-bold text-white mb-0.5">{title}</div>
                    <div className="text-slate-300 text-[10px] uppercase tracking-wider">{p.start} → {p.end}</div>
                </div>

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
        <div className="w-full overflow-x-auto border border-gray-200 rounded-lg bg-white relative custom-scrollbar" ref={containerRef}>
            {/* AGGIUNTO MIN-WIDTH DINAMICO BASATO SULLA LARGHEZZA DELLA SIDEBAR */}
            <div style={{ minWidth: `${totalWidth + sidebarWidth}px`, width: 'max-content' }} className="relative flex flex-col">
                
                {/* HEADER TIMELINE */}
                <div className="flex sticky top-0 z-[100] bg-white border-b border-gray-200">
                    <div 
                        style={{ width: `${sidebarWidth}px` }} 
                        className="flex-shrink-0 p-3 text-[10px] font-bold text-gray-400 uppercase border-r border-gray-200 sticky left-0 bg-white z-[110] flex justify-between items-center group relative"
                    >
                        <span className="truncate pr-2">{showSwimlanes ? 'Area' : 'Iniziativa'}</span>
                        {/* MANIGLIA PER IL RESIZE */}
                        <div 
                            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 z-20 transition-colors"
                            onMouseDown={startResizing}
                        />
                    </div>
                    <div className="flex bg-white">
                        {years.map(y => (
                            <div key={y} className="border-r border-gray-200 flex-shrink-0">
                                <div className="text-center py-1 text-[10px] font-bold text-gray-500 bg-gray-50 border-b border-gray-200">{y}</div>
                                <div className="flex">
                                    {months.map((m, i) => (
                                        <div key={i} className="w-[30px] text-center text-[8px] py-1 text-gray-400 border-r border-gray-50 last:border-0">{m}</div>
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
                                <div key={area.id} className="flex border-b border-gray-100 group relative" style={{ minHeight: `${rowHeight}px` }}>
                                    {/* COLONNA AREA */}
                                    <div 
                                        style={{ width: `${sidebarWidth}px` }} 
                                        className="flex-shrink-0 px-3 py-3 flex items-start gap-2 sticky left-0 bg-white border-r border-gray-200 z-[50] relative"
                                    >
                                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: area.hex }}></div>
                                        <span className="text-[10px] font-bold text-gray-700 uppercase leading-tight pr-2">{area.label}</span>
                                        {/* MANIGLIA PER IL RESIZE */}
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
                                <div key={p.id} className="flex h-10 border-b border-gray-50 group relative">
                                    {/* COLONNA INIZIATIVA */}
                                    <div 
                                        style={{ width: `${sidebarWidth}px` }} 
                                        className={`flex-shrink-0 px-3 text-[11px] font-medium sticky left-0 border-r border-gray-100 h-full flex items-center z-[50] relative ${
                                            selectedProjectId === p.id ? 'text-blue-600 font-bold bg-blue-50' : 'text-gray-600 bg-white'
                                        }`}
                                    >
                                        <span className="truncate w-full pr-2 block">{p.title || 'Nuovo Progetto'}</span>
                                        {/* MANIGLIA PER IL RESIZE */}
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
    );
};

export default GanttChart;
