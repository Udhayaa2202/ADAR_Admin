import React, { useState, useEffect } from 'react';
import {
    Users,
    AlertCircle,
    CheckCircle2,
    FileText,
    TrendingUp,
    Activity,
    Calendar,
    Loader2
} from 'lucide-react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import StatCard from '../components/StatCard';
import ReportTable from '../components/ReportTable';
import { fetchAllReports } from '../services/dataService';


const Dashboard = ({ onViewReport }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewType, setViewType] = useState('daily'); // 'daily' or 'monthly'

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllReports();
            setReports(data);
        } catch (error) {
            console.error("Failed to load reports:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);


    const processChartData = () => {
        if (!reports.length) return [];

        const dataMap = {};

        reports.forEach(report => {
            const date = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.incidentDate || Date.now());
            const key = viewType === 'daily'
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            if (!dataMap[key]) {
                dataMap[key] = { name: key, Verified: 0, Flagged: 0, 'Under Review': 0, Rejected: 0 };
            }

            const status = report.status || 'Under Review';
            if (dataMap[key].hasOwnProperty(status)) {
                dataMap[key][status]++;
            }
        });

        // Convert to array and sort by date (simple heuristic for now)
        return Object.values(dataMap).reverse(); // reverse since fetchAllReports is desc
    };

    const chartData = processChartData();

    const processCategoryData = () => {
        if (!reports.length) return [];

        const TRANSLATIONS = {
            'பாதுகாப்பு': 'Safety',
            'போக்குவரத்து': 'Traffic',
            'கட்டமைப்பு': 'Infrastructure',
            'சுகாதாரம்': 'Sanitation',
            'விபத்து': 'Accident',
            'விற்பனை/பரிமாற்றம்': 'Sale/Exchange',
            'மற்றவை': 'Other'
        };

        const categories = {};
        reports.forEach(report => {
            let cat = report.activity_type || 'Uncategorized';
            // Translate if Tamil term exists in mapping
            cat = TRANSLATIONS[cat] || cat;
            categories[cat] = (categories[cat] || 0) + 1;
        });
        const COLORS = ['#3A86FF', '#06D6A0', '#FFBE0B', '#FB5607', '#FF006E', '#8338EC'];

        return Object.entries(categories)
            .map(([name, value], index) => ({
                name,
                value,
                fill: COLORS[index % COLORS.length]
            }))
            .sort((a, b) => b.value - a.value);
    };

    const categoryData = processCategoryData();

    const totalReports = reports.length;
    const activeAlerts = reports.filter(r => r.status === 'Flagged').length;
    const avgTrust = reports.length > 0
        ? (reports.reduce((acc, r) => acc + (r.trustScore || 0), 0) / reports.length).toFixed(1)
        : 0;
    const verifiedUsers = [...new Set(reports.map(r => r.userId))].length;

    return (
        <div className="h-full flex flex-col p-6 gap-6 font-sans overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        ADAR Insight Deck
                    </h2>
                    <p className="text-[10px] text-white/40 mt-0.5 font-medium italic uppercase tracking-wider">Real-time service integrity & reporting trust mission control.</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard
                    icon={FileText}
                    label="Total Reports"
                    value={totalReports.toLocaleString()}
                    color="blue"
                    trend={12}
                />
                <StatCard
                    icon={AlertCircle}
                    label="Active Alerts"
                    value={activeAlerts.toString()}
                    color="red"
                    trend={-5}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg Trust Score"
                    value={`${avgTrust}%`}
                    color="amber"
                    trend={8}
                />
                <StatCard
                    icon={Users}
                    label="Unique Reporters"
                    value={verifiedUsers.toString()}
                    color="green"
                    trend={15}
                />
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyber-dark-accent" />
                            <h3 className="font-bold text-base">Signal Distribution</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                {[
                                    { label: 'Verified', color: '#06D6A0' },
                                    { label: 'Flagged', color: '#FFBE0B' },
                                    { label: 'Review', color: '#3A86FF' },
                                    { label: 'Rejected', color: '#EF233C' }
                                ].map(k => (
                                    <div key={k.label} className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: k.color }} />
                                        <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">{k.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                                <button
                                    onClick={() => setViewType('daily')}
                                    className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${viewType === 'daily' ? 'bg-cyber-dark-accent text-white' : 'text-white/20 hover:text-white/40'}`}
                                >
                                    Daily
                                </button>
                                <button
                                    onClick={() => setViewType('monthly')}
                                    className={`px-3 py-1 rounded text-[8px] font-black uppercase tracking-tighter transition-all ${viewType === 'monthly' ? 'bg-cyber-dark-accent text-white' : 'text-white/40 hover:text-white'}`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00F5B8" stopOpacity={0.4} /><stop offset="95%" stopColor="#00F5B8" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFBE0B" stopOpacity={0.4} /><stop offset="95%" stopColor="#FFBE0B" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorReview" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4D94FF" stopOpacity={0.4} /><stop offset="95%" stopColor="#4D94FF" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF233C" stopOpacity={0.4} /><stop offset="95%" stopColor="#EF233C" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.4)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.4)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    label={{
                                        value: 'Reports',
                                        angle: -90,
                                        position: 'insideLeft',
                                        fill: 'rgba(255,255,255,0.5)',
                                        fontSize: 10,
                                        fontWeight: 600,
                                        dx: -5
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#16213E',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="Verified" stroke="#00F5B8" strokeWidth={3} fillOpacity={1} fill="url(#colorVerified)" stackId="1" />
                                <Area type="monotone" dataKey="Under Review" stroke="#4D94FF" strokeWidth={3} fillOpacity={1} fill="url(#colorReview)" stackId="1" />
                                <Area type="monotone" dataKey="Flagged" stroke="#FFBE0B" strokeWidth={3} fillOpacity={1} fill="url(#colorFlagged)" stackId="1" />
                                <Area type="monotone" dataKey="Rejected" stroke="#EF233C" strokeWidth={3} fillOpacity={1} fill="url(#colorRejected)" stackId="1" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right side left empty for future implementation */}
                <div className="hidden lg:block"></div>
            </div>
        </div>
    );
};

export default Dashboard;
