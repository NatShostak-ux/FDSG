import React from 'react';
import { ChevronLeft, LayoutDashboard, Menu, ArrowRightLeft } from 'lucide-react';
import Button from './ui/Button';
import { ARAD_BLUE, ARAD_GOLD, EXPERTISE_AREAS } from '../utils/constants';

const Sidebar = ({ activeView, setActiveView, isSidebarOpen, setIsSidebarOpen, activeScenario }) => {
    return (
        <>
            {!isSidebarOpen && (
                <div className="absolute left-0 top-0 z-20 toggle-sidebar">
                    <Button variant="icon" onClick={() => setIsSidebarOpen(true)} title="Mostra Menu">
                        <Menu size={20} />
                    </Button>
                </div>
            )}

            <div className={`flex-shrink-0 space-y-1 sidebar-nav print:hidden transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}>

                <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Navigazione</span>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" title="Nascondi Menu">
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* TASTO DASHBOARD SINTESI */}
                <button
                    onClick={() => setActiveView('dashboard')}
                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors mb-2 ${
                        activeView === 'dashboard' ? 'shadow-lg text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    style={activeView === 'dashboard' ? { backgroundColor: ARAD_BLUE } : {}}
                >
                    <LayoutDashboard size={20} />
                    <span className="font-bold text-sm whitespace-nowrap">Dashboard Sintesi</span>
                </button>

                {/* NUOVO TASTO: CONFRONTO AREE (Stile Gold) */}
                <button
                    onClick={() => setActiveView('compare')}
                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-colors mb-4 ${
                        activeView === 'compare' ? 'shadow-lg text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                    style={activeView === 'compare' ? { backgroundColor: '#b58e3e' } : {}} // Colore dorato per differenziarlo
                >
                    <ArrowRightLeft size={20} />
                    <span className="font-bold text-sm whitespace-nowrap">Confronto Aree</span>
                </button>

                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Aree Strategiche</div>
                
                {EXPERTISE_AREAS.map(area => {
                    const hasData = activeScenario.data[area.id]?.projects?.length > 0;
                    const isActive = activeView === area.id;

                    return (
                        <button
                            key={area.id}
                            onClick={() => setActiveView(area.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                                isActive ? 'bg-white shadow-md border-l-4' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                            }`}
                            style={isActive ? { color: area.hex, borderColor: area.hex } : {}}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <area.icon size={18} className="flex-shrink-0" style={isActive ? { color: area.hex } : { color: '#9ca3af' }} />
                                <span className="font-medium text-sm whitespace-nowrap">{area.label}</span>
                            </div>
                            {hasData && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ARAD_GOLD }}></div>}
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default Sidebar;
