import React from 'react';
import { getStrategicRole } from './AreaEditor';

const ARAD_BLUE = '#02192c';
const ARAD_GOLD = '#bf9000';
const ARAD_CHART_BG = '#081f32';

const RadarChart = ({ data, areas }) => {
    const size = 500;
    const center = size / 2;
    const radius = 160;
    const scale = 5; // MODIFICATO: La scala ora è su base 5

    const angleStep = (Math.PI * 2) / areas.length;

    const getCoordinates = (value, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = center + (radius * (value / scale)) * Math.cos(angle);
        const y = center + (radius * (value / scale)) * Math.sin(angle);
        return [x, y];
    };

    const polyPoints = areas.map((area, i) => {
        const rawValue = data[area.id]?.importance || 0;
        // MODIFICATO: Traduciamo il valore (es. da 10 a 5, o da 8 a 4)
        const value = getStrategicRole(rawValue).value;
        return getCoordinates(value, i).join(',');
    }).join(' ');

    // MODIFICATO: I livelli della griglia ora sono da 1 a 5
    const gridLevels = [1, 2, 3, 4, 5];

    return (
        <div className="flex justify-center items-center py-8 rounded-xl overflow-hidden shadow-inner w-full h-full min-h-[450px]" style={{ backgroundColor: ARAD_CHART_BG }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <defs>
                    <radialGradient id="polyGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" stopColor={ARAD_GOLD} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={ARAD_GOLD} stopOpacity="0.1" />
                    </radialGradient>
                </defs>

                {gridLevels.map(level => {
                    const points = areas.map((_, i) => getCoordinates(level, i).join(',')).join(' ');
                    return (
                        <g key={level}>
                            <polygon
                                points={points}
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1"
                            />
                            <text
                                x={center}
                                y={center - (radius * (level / scale))}
                                fill="rgba(255,255,255,0.3)"
                                fontSize="9"
                                textAnchor="middle"
                                dy="3"
                            >
                                {level}
                            </text>
                        </g>
                    );
                })}

                {areas.map((area, i) => {
                    // MODIFICATO: Usiamo la nuova scala (5) e i suoi proporzionali per le linee
                    const [x, y] = getCoordinates(5, i);
                    const [endX, endY] = getCoordinates(5.25, i);
                    const [lx, ly] = getCoordinates(6, i);

                    return (
                        <g key={area.id}>
                            <line x1={center} y1={center} x2={endX} y2={endY} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                            <text
                                x={lx}
                                y={ly}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="12"
                                fontWeight="300"
                                className="tracking-wide"
                            >
                                {area.label.split(' ').map((line, idx) => (
                                    <tspan x={lx} dy={idx === 0 ? 0 : 14} key={idx}>{line}</tspan>
                                ))}
                            </text>
                        </g>
                    );
                })}

                <polygon
                    points={polyPoints}
                    fill="url(#polyGradient)"
                    stroke={ARAD_GOLD}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    className="drop-shadow-lg"
                />

                {areas.map((area, i) => {
                    const rawValue = data[area.id]?.importance || 0;
                    // MODIFICATO: Anche i pallini gialli devono usare il valore tradotto
                    const value = getStrategicRole(rawValue).value;
                    const [x, y] = getCoordinates(value, i);
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill={ARAD_GOLD}
                            stroke={ARAD_CHART_BG}
                            strokeWidth="2"
                        />
                    );
                })}

                <circle cx={center} cy={center} r="2" fill="rgba(255,255,255,0.2)" />
            </svg>
        </div>
    );
};

export default RadarChart;
