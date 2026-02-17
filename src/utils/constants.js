import {
    ShoppingBag,
    Truck,
    Smartphone,
    Users,
    Database,
    Share2,
    Search,
    Layers,
    Activity
} from 'lucide-react';

export const ARAD_BLUE = '#02192c';
export const ARAD_GOLD = '#bf9000';
export const ARAD_CHART_BG = '#081f32';

export const EXPERTISE_AREAS = [
    { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag, hex: '#2563eb' },
    { id: 'distribution', label: 'Distribuzione & Marketplace', icon: Truck, hex: '#d97706' },
    { id: 'ux', label: 'User Experience (UX)', icon: Smartphone, hex: '#9333ea' },
    { id: 'loyalty', label: 'Loyalty & Membership', icon: Users, hex: '#db2777' },
    { id: 'crm', label: 'CRM & Data', icon: Database, hex: '#0891b2' },
    { id: 'social', label: 'Social Media & Content', icon: Share2, hex: '#dc2626' },
    { id: 'seo', label: 'SEO & SEM', icon: Search, hex: '#16a34a' },
    { id: 'tech', label: 'Tech & Infrastructure', icon: Layers, hex: '#475569' },
    { id: 'organization', label: 'Organizzazione & Cultura', icon: Activity, hex: '#4f46e5' },
    { id: 'logistics', label: 'Logistica', icon: Truck, hex: '#0d9488' },
];

export const EMPTY_AREA_DATA = {
    importance: 1,
    objectives: '',
    evolution_y1: '',
    evolution_y2: '',
    evolution_y3: '',
    ksms: [], // Key Success Metrics array
    routine: '',
    budget: 0,
    projects: [],
    comments: ''
};

export const INITIAL_SCENARIOS = [
    {
        id: 1,
        title: 'Scenario 1: Ottimizzazione Incrementale',
        description: 'Focus sul miglioramento delle piattaforme esistenti e efficienza operativa.',
        data: {
            'ecommerce': { ...EMPTY_AREA_DATA, importance: 8 },
            'crm': { ...EMPTY_AREA_DATA, importance: 6 },
        }
    },
    {
        id: 2,
        title: 'Scenario 2: Espansione Omnichannel',
        description: 'Integrazione forte tra fisico e digitale, apertura a nuovi marketplace.',
        data: {
            'ecommerce': { ...EMPTY_AREA_DATA, importance: 9 },
            'social': { ...EMPTY_AREA_DATA, importance: 7 },
        }
    },
    {
        id: 3,
        title: 'Scenario 3: Digital Disruption & AI',
        description: 'Adozione massiva di AI, iper-personalizzazione e modelli di business D2C aggressivi.',
        data: {
            'tech': { ...EMPTY_AREA_DATA, importance: 10 },
            'ux': { ...EMPTY_AREA_DATA, importance: 9 },
        }
    }
];

export const GANTT_START_YEAR = 2026;
export const GANTT_END_YEAR = 2029;
