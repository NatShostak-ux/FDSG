import React, { useState, useRef, useEffect } from 'react';
import { Flame, ArrowUpCircle, Circle } from 'lucide-react';

const ARAD_BLUE = '#02192c';
const GANTT_START_YEAR = 2026;
const GANTT_END_YEAR = 2029;
const TOTAL_YEARS = GANTT_END_YEAR - GANTT_START_YEAR + 1;
const MONTHS_PER_YEAR = 12;
const TOTAL_MONTHS = TOTAL_YEARS * MONTHS_PER_YEAR;
const MONTH_NAMES = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];

const GanttChart = ({ projects, areas, showSwimlanes = false, activeAreaId = null, onUpdateProject }) => {
    const containerRef = useRef(null);
    const [draggedProject, setDraggedProject] = useState(null);

    // Parametri di calcolo
    const monthWidth = 30;
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

    const getWidth = (startStr, endStr) => {
        if (!startStr || !endStr) return monthWidth;
        const p1 = dateToPixel(startStr);
        const p2 = dateToPixel(endStr);
        return Math.max(monthWidth, p2 - p1);
    };

    const handleMouseDown = (e, project, mode = 'move') => {
        e.preventDefault();
        e.stopPropagation();

        setDraggedProject({
            ...project,
            mode,
            startX: e.clientX,
            originalLeft: dateToPixel(project.start),
            originalWidth: getWidth(project.start, project.end),
            currentLeft: dateToPixel(project.start),
            currentWidth: getWidth(project.start, project.end)
        });
    };

    const handleMouseMove = (e) => {
        if (!draggedProject) return;
        const deltaX = e.clientX - draggedProject.startX;

        if (draggedProject.mode === 'move') {
            const newLeft = Math.max(0, Math.min(totalWidth - draggedProject.currentWidth, draggedProject.originalLeft + deltaX));
            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft }));
        } else if (draggedProject.mode === 'resize-left') {
            const maxDelta = draggedProject.originalWidth - monthWidth;
            const effectiveDelta = Math.min(maxDelta, Math.max(-draggedProject.originalLeft, deltaX));

            const newLeft = draggedProject.originalLeft + effectiveDelta;
            const newWidth = draggedProject.originalWidth - effectiveDelta;

            setDraggedProject(prev => ({ ...prev, currentLeft: newLeft, currentWidth: newWidth }));
        } else if (draggedProject.mode === 'resize-right') {
            const newWidth = Math.max(monthWidth, draggedProject.originalWidth + deltaX);
            setDraggedProject(prev => ({ ...prev, currentWidth: newWidth }));
        }
    };

    const handleMouseUp = () => {
        if (draggedProject && onUpdateProject) {
            let newStartDate = pixelToDate(draggedProject.currentLeft);
            let newEndDate = pixelToDate(draggedProject.currentLeft + draggedProject.currentWidth);

            if (newStartDate === newEndDate) {
                const d = new Date(newStartDate);
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
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedProject]);

    const years = Array.from({ length: TOTAL_YEARS }, (_, i) => GANTT_START_YEAR + i);

    const getPriorityIcon = (impact) => {
        if (impact >= 8) return <Flame size={12} className="text-white fill-current" />;
        if (impact >= 5) return <ArrowUpCircle size={12} className="text-white" />;
        return <Circle size={10} className="text-white" />;
    };

    const renderProjectBar = (p, areaColor) => {
        const isDragging = draggedProject?.id === p.id;
        const left = isDragging ? draggedProject.currentLeft : dateToPixel(p.start);
        const width = isDragging ? draggedProject.currentWidth : getWidth(p.start, p.end);

        return (
            <div
                key={p.id}
                className={`absolute top-2 h-6 rounded-md shadow-sm flex items-center justify-between px-2 text-white text-[10px] overflow-hidden whitespace-nowrap border border-white/20 group hover:z-20`}
                style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    backgroundColor: areaColor,
                    zIndex: isDragging ? 50 : 10,
                    transition: isDragging ? 'none' : 'left 0.2s, width 0.2s'
                }}
                title={`${p.title} (${p.start} - ${p.end})`}
            >
                <div
                    className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize z-30 hover:bg-white/20"
                    onMouseDown={(e) => handleMouseDown(e, p, 'resize-left')}
                ></div>

                <div
                    className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown(e, p, 'move')}
                ></div>

                <div className="relative z-0 flex items-center gap-1 w-full pointer-events-none">
                    <span className="flex-shrink-0">{getPriorityIcon(p.impact)}</span>
                    <span className="drop-shadow-sm font-medium truncate flex-grow">{p.title}</span>
                </div>

                <div
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize z-30 hover:bg-white/20"
                    onMouseDown={(e) => handleMouseDown(e, p, 'resize-right')}
                ></div>
            </div>
        );
    };

    return (
        <div className="w-full overflow-x-auto border border-gray-200 rounded-lg bg-white custom-scrollbar" ref={containerRef}>
            <div style={{ width: `${totalWidth + (showSwimlanes ? 200 : 200)}px` }} className="relative">
                <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200 flex">
                    <div className="w-48 flex-shrink-0 p-3 text-xs font-bold text-gray-500 uppercase border-r border-gray-200 bg-gray-50 sticky left-0 z-30">
                        {showSwimlanes ? 'Area' : 'Progetto'}
                    </div>

                    <div className="flex flex-grow">
                        {years.map(year => (
                            <div key={year} className="flex-1 border-r border-gray-300 last:border-0">
                                <div className="text-center py-1 text-xs font-bold text-gray-700 bg-gray-100 border-b border-gray-200">
                                    {year}
                                </div>
                                <div className="flex">
                                    {MONTH_NAMES.map((m, idx) => (
                                        <div key={idx} className="flex-1 text-[9px] text-center py-1 text-gray-400 border-r border-gray-100 last:border-0" style={{ minWidth: monthWidth }}>
                                            {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative min-h-[200px]">
                    <div className="absolute inset-0 flex pl-48 z-0 pointer-events-none">
                        {years.map(y => (
                            <div key={y} className="flex-1 flex border-r border-gray-200 last:border-0 h-full">
                                {MONTH_NAMES.map((_, idx) => (
                                    <div key={idx} className="flex-1 border-r border-gray-50 h-full"></div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {showSwimlanes ? (
                        areas.map(area => {
                            const areaProjects = projects.filter(p => p.areaId === area.id);
                            return (
                                <div key={area.id} className="border-b border-gray-100 relative z-10 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex min-h-[44px] items-center">
                                        <div className="w-48 flex-shrink-0 bg-white border-r border-gray-200 px-3 py-2 flex items-center gap-2 sticky left-0 z-20">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: area.hex }}></div>
                                            <span className="text-xs font-bold text-gray-700 uppercase truncate" title={area.label}>{area.label}</span>
                                        </div>
                                        <div className="flex-grow relative h-10 w-full">
                                            {areaProjects.map(p => renderProjectBar(p, area.hex))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        projects.map(p => {
                            const activeArea = areas.find(a => a.id === activeAreaId);
                            const barColor = activeArea ? activeArea.hex : ARAD_BLUE;
                            return (
                                <div key={p.id} className="flex items-center h-12 border-b border-gray-100 relative z-10 hover:bg-gray-50 group">
                                    <div className="w-48 flex-shrink-0 px-3 truncate text-sm font-medium text-gray-800 border-r border-gray-200 bg-white sticky left-0 z-20 flex items-center h-full" title={p.title}>
                                        {p.title || 'Nuovo Progetto'}
                                    </div>
                                    <div className="flex-grow relative h-full w-full">
                                        {renderProjectBar(p, barColor)}
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
