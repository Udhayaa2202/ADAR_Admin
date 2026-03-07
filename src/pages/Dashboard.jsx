import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import TopReporters from '../components/TopReporters';
import { fetchAllReports } from '../services/dataService';


const Dashboard = ({ onViewReport }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewType, setViewType] = useState('daily'); // 'daily' or 'monthly'
    const [hoveredPoint, setHoveredPoint] = useState(null);

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
                dataMap[key] = {
                    name: key,
                    Approved: 0,
                    Flagged: 0,
                    'Under Review': 0,
                    Rejected: 0,
                    _userIds: new Set(),
                    _trustSums: { Approved: 0, Flagged: 0, 'Under Review': 0, Rejected: 0 },
                    _trustCounts: { Approved: 0, Flagged: 0, 'Under Review': 0, Rejected: 0 }
                };
            }

            const status = report.status === 'Verified' ? 'Approved' : (report.status || 'Under Review');
            if (dataMap[key].hasOwnProperty(status)) {
                dataMap[key][status]++;
                dataMap[key]._userIds.add(report.userId);
                dataMap[key]._trustSums[status] += (report.trustScore || 0);
                dataMap[key]._trustCounts[status]++;
            }
        });

        return Object.values(dataMap).reverse().map(item => ({
            ...item,
            total: item.Approved + item.Flagged + item['Under Review'] + item.Rejected,
            userCount: item._userIds.size,

            statusAverages: {
                Approved: item._trustCounts.Approved > 0 ? (item._trustSums.Approved / item._trustCounts.Approved).toFixed(1) : "0",
                'Under Review': item._trustCounts['Under Review'] > 0 ? (item._trustSums['Under Review'] / item._trustCounts['Under Review']).toFixed(1) : "0",
                Flagged: item._trustCounts.Flagged > 0 ? (item._trustSums.Flagged / item._trustCounts.Flagged).toFixed(1) : "0",
                Rejected: item._trustCounts.Rejected > 0 ? (item._trustSums.Rejected / item._trustCounts.Rejected).toFixed(1) : "0"
            }
        }));
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

    const getStatsForRange = (rangeReports) => {
        return {
            total: rangeReports.length,
            alerts: rangeReports.filter(r => r.status === 'Flagged').length,
            users: [...new Set(rangeReports.map(r => r.userId))].length
        };
    };

    const calculateDynamics = () => {
        const now = new Date();
        let currentStart, prevStart, prevEnd;

        if (viewType === 'daily') {
            currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            prevStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, -1);
        } else {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        }

        const getReportDate = (r) => r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.incidentDate || Date.now());

        const currentReports = reports.filter(r => getReportDate(r) >= currentStart);
        const prevReports = reports.filter(r => {
            const date = getReportDate(r);
            return date >= prevStart && date <= prevEnd;
        });

        const current = getStatsForRange(currentReports);
        const prev = getStatsForRange(prevReports);

        const calcTrend = (curr, old) => {
            if (old === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - old) / old) * 100);
        };

        return {
            current,
            trends: {
                total: calcTrend(current.total, prev.total),
                alerts: calcTrend(current.alerts, prev.alerts),
                users: calcTrend(current.users, prev.users)
            },
            periodLabel: viewType === 'daily' ? 'Today' : 'This Month'
        };
    };

    const dynamics = calculateDynamics();

    const getAvgByStatus = (statusName) => {
        const filtered = reports.filter(r => {
            const rStatus = r.status === 'Verified' ? 'Approved' : (r.status || 'Under Review');
            return rStatus === statusName;
        });
        if (filtered.length === 0) return "0";
        const sum = filtered.reduce((acc, r) => acc + (r.trustScore || 0), 0);
        return (sum / filtered.length).toFixed(1);
    };

    const trustStats = hoveredPoint ? [
        { label: 'Approved', value: hoveredPoint.statusAverages.Approved, color: 'green' },
        { label: 'Review', value: hoveredPoint.statusAverages['Under Review'], color: 'accent' },
        { label: 'Flagged', value: hoveredPoint.statusAverages.Flagged, color: 'amber' },
        { label: 'Rejected', value: hoveredPoint.statusAverages.Rejected, color: 'red' },
    ] : [
        { label: 'Approved', value: getAvgByStatus('Approved'), color: 'green' },
        { label: 'Review', value: getAvgByStatus('Under Review'), color: 'accent' },
        { label: 'Flagged', value: getAvgByStatus('Flagged'), color: 'amber' },
        { label: 'Rejected', value: getAvgByStatus('Rejected'), color: 'red' },
    ];

    const displayStats = hoveredPoint ? {
        total: hoveredPoint.total,
        alerts: hoveredPoint.Flagged,
        users: hoveredPoint.userCount,
        labelTitle: hoveredPoint.name,
        isHover: true
    } : {
        total: dynamics.current.total,
        alerts: dynamics.current.alerts,
        users: dynamics.current.users,
        labelTitle: dynamics.periodLabel,
        isHover: false
    };

    return (
        <div className="h-full flex flex-col p-6 gap-6 font-sans overflow-y-auto custom-scrollbar">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
                <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic tracking-tighter uppercase">
                        ADAR Insight Deck
                    </h2>
                    <p className="text-[10px] text-white/70 mt-0.5 font-medium italic uppercase tracking-wider">Real-time service integrity & reporting trust mission control.</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
                <div className="lg:col-span-1">
                    <StatCard
                        icon={FileText}
                        label={`Reports (${displayStats.labelTitle})`}
                        value={displayStats.total.toLocaleString()}
                        color="blue"
                        trend={!displayStats.isHover ? dynamics.trends.total : null}
                    />
                </div>
                <div className="lg:col-span-1">
                    <StatCard
                        icon={AlertCircle}
                        label={`Alerts (${displayStats.labelTitle})`}
                        value={displayStats.alerts.toString()}
                        color="red"
                        trend={!displayStats.isHover ? dynamics.trends.alerts : null}
                    />
                </div>
                <div className="lg:col-span-1">
                    <StatCard
                        icon={Users}
                        label={`Reporters (${displayStats.labelTitle})`}
                        value={displayStats.users.toString()}
                        color="green"
                        trend={!displayStats.isHover ? dynamics.trends.users : null}
                    />
                </div>

                {/* Trust Ledger Card (Integrity Matrix) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="lg:col-span-2 glass-card p-6 flex flex-col gap-4 border-white/5 hover:border-white/10 transition-all cursor-default group"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl text-cyber-dark-amber bg-cyber-dark-amber/10 border-cyber-dark-amber/20">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col items-end overflow-hidden">
                            <span className="text-[11px] font-normal uppercase tracking-[0.2em] text-white/40 truncate w-full text-right">Integrity Matrix</span>
                            <span className="text-[8px] font-normal text-cyber-dark-amber/80 uppercase tracking-widest truncate w-full text-right">{displayStats.labelTitle} Focus</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {trustStats.map(stat => (
                            <div key={stat.label} className="flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-normal text-white/60 uppercase tracking-tighter truncate">{stat.label}</span>
                                    <span className="text-[13px] font-normal whitespace-nowrap">{stat.value}<span className="text-[9px] opacity-40 ml-0.5">%</span></span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.1)]`}
                                        style={{
                                            width: `${stat.value}%`,
                                            backgroundColor: stat.color === 'accent' ? '#3A86FF' : (stat.color === 'green' ? '#06D6A0' : (stat.color === 'amber' ? '#FFBE0B' : '#EF233C'))
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-2 glass-card p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-cyber-dark-accent" />
                            <h3 className="font-bold text-base">Signal Distribution</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                {[
                                    { label: 'Approved', color: '#06D6A0' },
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

                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner">
                                <button
                                    onClick={() => setViewType('daily')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewType === 'daily' ? 'bg-cyber-dark-accent text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-white/20 hover:text-white/50'}`}
                                >
                                    Daily
                                </button>
                                <button
                                    onClick={() => setViewType('monthly')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewType === 'monthly' ? 'bg-cyber-dark-accent text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-white/20 hover:text-white/50'}`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                onMouseMove={(e) => {
                                    if (e.activePayload) setHoveredPoint(e.activePayload[0].payload);
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                            >
                                <defs>
                                    <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00F5B8" stopOpacity={0.4} /><stop offset="95%" stopColor="#00F5B8" stopOpacity={0} /></linearGradient>
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
                                <Area type="monotone" dataKey="Approved" stroke="#00F5B8" strokeWidth={3} fillOpacity={1} fill="url(#colorApproved)" stackId="1" />
                                <Area type="monotone" dataKey="Under Review" stroke="#4D94FF" strokeWidth={3} fillOpacity={1} fill="url(#colorReview)" stackId="1" />
                                <Area type="monotone" dataKey="Flagged" stroke="#FFBE0B" strokeWidth={3} fillOpacity={1} fill="url(#colorFlagged)" stackId="1" />
                                <Area type="monotone" dataKey="Rejected" stroke="#EF233C" strokeWidth={3} fillOpacity={1} fill="url(#colorRejected)" stackId="1" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-1 h-full">
                    <TopReporters reports={reports} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
