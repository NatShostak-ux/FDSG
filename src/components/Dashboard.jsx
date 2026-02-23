import React, { useState } from 'react';
import { Euro, List, TrendingUp, Calendar, Target, X, ChevronRight } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import GanttChart from './GanttChart';
import RadarChart from './RadarChart';
import { ARAD_BLUE, ARAD_GOLD, EXPERTISE_AREAS } from '../utils/constants';

import { STRATEGIC_ROLES, getStrategicRole } from './AreaEditor';

const Dashboard = ({ activeScenario, setActiveView, updateProjectBatch }) => {
    const [isProjectPreviewOpen, setIsProjectPreviewOpen] = useState(false);

    const calculateTotalBudgetRange = () => {
        let min = 0;
        let max = 0;
        EXPERTISE_AREAS.forEach(area => {
            const projects = activeScenario.data[area.id]?.projects || [];
            projects.forEach(p => {
                min += (Number(p.budgetMin) || 0);
                max += (Number(p.budgetMax) || 0);
            });
        });
        return { min, max };
    };

    const budgetRange = calculateTotalBudgetRange();
    
    const allProjects = EXPERTISE_AREAS.flatMap(area => {
        const areaData = activeScenario.data[area.id];
        return (areaData?.projects || []).map(p => ({ 
            ...p, 
            areaId: area.id,
            areaColor: area.hex,
            areaLabel: area.label
        }));
    });

    const projectsByArea = EXPERTISE_AREAS.map(area => {
        const areaProjects = allProjects.filter(p => p.areaId === area.id);
        if (areaProjects.length === 0) return null;
        return { area, projects: areaProjects };
    }).filter(Boolean);

    const hasAnyMetrics = EXPERTISE_AREAS.some(area => (activeScenario.data[area.id]?.ksms || []).length > 0);

    return (
        <div className="space-y-8 animate-fadeIn relative">
            {is
