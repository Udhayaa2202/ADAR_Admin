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
    Loader2,
    Info
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

        const toSortKey = (d) => {
            if (viewType === 'daily') {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const toLabel = (d) => {
            if (viewType === 'daily') {
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };

        // 1. Identify each user's first report bucket (key)
        const userFirstKeyMap = {};
        reports.forEach(r => {
            const date = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.incidentDate || 0);
            const key = toSortKey(date);
            const uid = r.userId;
            if (uid && (!userFirstKeyMap[uid] || key < userFirstKeyMap[uid])) {
                userFirstKeyMap[uid] = key;
            }
        });

        // 2. Count new users per bucket key
        const installCounts = {};
        Object.values(userFirstKeyMap).forEach(key => {
            installCounts[key] = (installCounts[key] || 0) + 1;
        });

        const dataMap = {};

        reports.forEach(report => {
            const date = report.createdAt?.toDate ? report.createdAt.toDate() : new Date(report.incidentDate || 0);
            const key = toSortKey(date);

            if (!dataMap[key]) {
                dataMap[key] = {
                    name: toLabel(date),
                    _sortKey: key,
                    Approved: 0,
                    Flagged: 0,
                    'Under Review': 0,
                    Rejected: 0,
                    newInstalls: installCounts[key] || 0,
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

        // Sort chronologically (oldest first)
        return Object.entries(dataMap)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([, item]) => ({
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

    const getStatsForRange = (rangeReports, allReports) => {
        const usersInRange = [...new Set(rangeReports.map(r => r.userId))];
        
        // Use a consistent date-only comparison helper
        const toDayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        
        const newInstalls = usersInRange.filter(userId => {
            if (!userId) return false;
            const userReports = allReports.filter(r => r.userId === userId);
            if (userReports.length === 0) return false;
            
            // Earliest report date across ALL historical data
            const earliestDate = userReports.reduce((min, r) => {
                const rDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.incidentDate || 0);
                return rDate < min ? rDate : min;
            }, new Date());
            
            const earliestDayKey = toDayKey(earliestDate);
            
            // Check if user's first-ever report happened on a day that is in the current range
            return rangeReports.some(r => {
                const rDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.incidentDate || 0);
                return toDayKey(rDate) === earliestDayKey;
            });
        }).length;

        return {
            total: rangeReports.length,
            flagged: rangeReports.filter(r => r.status === 'Flagged').length,
            newInstalls: newInstalls
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

        const getReportDate = (r) => r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.incidentDate || 0);

        const currentReports = reports.filter(r => getReportDate(r) >= currentStart);
        const prevReports = reports.filter(r => {
            const date = getReportDate(r);
            return date >= prevStart && date <= prevEnd;
        });

        const current = getStatsForRange(currentReports, reports);
        const prev = getStatsForRange(prevReports, reports);

        const calcTrend = (curr, old) => {
            if (old === 0) return null;
            return Math.round(((curr - old) / old) * 100);
        };

        return {
            current,
            trends: {
                total: calcTrend(current.total, prev.total),
                flagged: calcTrend(current.flagged, prev.flagged),
                newInstalls: calcTrend(current.newInstalls, prev.newInstalls)
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

    const getHoverTrend = (currValue, dataKey) => {
        if (!hoveredPoint || !chartData.length) return null;
        const index = chartData.findIndex(d => d.name === hoveredPoint.name);
        if (index <= 0) return null;
        const prevPoint = chartData[index - 1];
        const prevValue = prevPoint[dataKey];
        if (prevValue === 0) return null;
        return Math.round(((currValue - prevValue) / prevValue) * 100);
    };

    const displayStats = hoveredPoint ? {
        total: hoveredPoint.total,
        flagged: hoveredPoint.Flagged,
        newInstalls: hoveredPoint.newInstalls,
        trends: {
            total: getHoverTrend(hoveredPoint.total, 'total'),
            flagged: getHoverTrend(hoveredPoint.Flagged, 'Flagged'),
            newInstalls: getHoverTrend(hoveredPoint.newInstalls, 'newInstalls')
        },
        labelTitle: hoveredPoint.name,
        isHover: true
    } : {
        total: dynamics.current.total,
        flagged: dynamics.current.flagged,
        newInstalls: dynamics.current.newInstalls,
        trends: dynamics.trends,
        labelTitle: dynamics.periodLabel,
        isHover: false
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 gap-4 md:gap-6 font-sans overflow-x-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic tracking-tighter uppercase">
                        ADAR Insight Deck
                    </h2>
                    <p className="text-[9px] md:text-[10px] text-white/70 mt-0.5 font-medium italic uppercase tracking-wider">Real-time service integrity & reporting trust mission control.</p>
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
                        trend={displayStats.trends.total}
                    />
                </div>
                <div className="lg:col-span-1">
                    <StatCard
                        icon={AlertCircle}
                        label={`Flagged (${displayStats.labelTitle})`}
                        value={displayStats.flagged.toString()}
                        color="red"
                        trend={displayStats.trends.flagged}
                    />
                </div>
                <div className="lg:col-span-1">
                    <StatCard
                        icon={Users}
                        label={`New Installs (${displayStats.labelTitle})`}
                        value={displayStats.newInstalls.toString()}
                        color="green"
                        trend={displayStats.trends.newInstalls}
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
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 truncate w-full text-right">Integrity Matrix</span>
                            <span className="text-[8px] font-normal text-cyber-dark-amber/80 uppercase tracking-widest truncate w-full text-right">{displayStats.labelTitle} Focus</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {trustStats.map(stat => (
                            <div key={stat.label} className="flex flex-col gap-1 overflow-hidden">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-bold text-white/85 uppercase tracking-tighter truncate">{stat.label}</span>
                                    <span className="text-[13px] font-bold whitespace-nowrap">{stat.value}<span className="text-[9px] opacity-70 ml-0.5">%</span></span>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[320px] shrink-0">
                <div className="lg:col-span-2 glass-card p-4 flex flex-col gap-2">
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
                                        <span className="text-[9px] text-white/70 uppercase font-black tracking-widest">{k.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner">
                                <button
                                    onClick={() => setViewType('daily')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewType === 'daily' ? 'bg-cyber-dark-accent text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-white/70 hover:text-white/90'}`}
                                >
                                    Daily
                                </button>
                                <button
                                    onClick={() => setViewType('monthly')}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewType === 'monthly' ? 'bg-cyber-dark-accent text-white shadow-[0_0_15px_rgba(58,134,255,0.4)]' : 'text-white/70 hover:text-white/90'}`}
                                >
                                    Monthly
                                </button>
                            </div>
                        </div>
                    </div>

                    <motion.div 
                        className="flex-1 w-full min-h-0"
                        initial={{ clipPath: 'inset(0 100% 0 0)' }}
                        animate={{ clipPath: 'inset(0 0% 0 0)' }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
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
                                    fontSize={9}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                    dy={5}
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
                                        fontSize: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                                    }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                    formatter={(value, name) => {
                                        if (name === 'newInstalls') return [value, 'New Installs'];
                                        return [value, name];
                                    }}
                                />
                                <Area type="monotone" dataKey="Approved" stroke="#00F5B8" strokeWidth={3} fillOpacity={1} fill="url(#colorApproved)" stackId="1" />
                                <Area type="monotone" dataKey="Under Review" stroke="#4D94FF" strokeWidth={3} fillOpacity={1} fill="url(#colorReview)" stackId="1" />
                                <Area type="monotone" dataKey="Flagged" stroke="#FFBE0B" strokeWidth={3} fillOpacity={1} fill="url(#colorFlagged)" stackId="1" />
                                <Area type="monotone" dataKey="Rejected" stroke="#EF233C" strokeWidth={3} fillOpacity={1} fill="url(#colorRejected)" stackId="1" />
                                <Area 
                                    type="monotone" 
                                    dataKey="newInstalls" 
                                    stroke="#06D6A0" 
                                    strokeWidth={2} 
                                    strokeDasharray="4 4" 
                                    fill="transparent" 
                                    dot={{ r: 3, fill: '#06D6A0' }}
                                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </motion.div>

                    {/* Info notice inside the graph card */}
                    <div className="flex items-center gap-2 px-1 shrink-0">
                        <div className="flex-shrink-0 w-[16px] h-[16px] rounded-full border border-cyber-dark-accent/40 flex items-center justify-center bg-cyber-dark-accent/10">
                            <span className="text-[9px] font-black text-cyber-dark-accent leading-none">!</span>
                        </div>
                        <span className="text-[9px] text-white/60 italic leading-tight">The graph displays only the dates on which reports were received. If a date is not shown, no reports were submitted on that day.</span>
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
