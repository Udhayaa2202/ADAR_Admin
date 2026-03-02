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
    LineChart,
    Line,
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

const mockChartData = [
    { name: 'Feb 1', trust: 85, reports: 12 },
    { name: 'Feb 5', trust: 82, reports: 18 },
    { name: 'Feb 10', trust: 75, reports: 25 },
    { name: 'Feb 15', trust: 68, reports: 40 },
    { name: 'Feb 20', trust: 72, reports: 32 },
    { name: 'Feb 25', trust: 78, reports: 22 },
    { name: 'Mar 1', trust: 84, reports: 15 },
];

const Dashboard = ({ onViewReport }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const totalReports = reports.length;
    const activeAlerts = reports.filter(r => r.status === 'Flagged').length;
    const avgTrust = reports.length > 0
        ? (reports.reduce((acc, r) => acc + (r.trustScore || 0), 0) / reports.length).toFixed(1)
        : 0;
    const verifiedUsers = [...new Set(reports.map(r => r.userId))].length;

    return (
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        System Overview
                    </h2>
                    <p className="text-white/40 mt-1 font-medium italic">Monitoring real-time node integrity and reporting trust.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5 self-start transition-all hover:bg-white/10 cursor-pointer" onClick={loadReports}>
                    <Activity className={`w-4 h-4 text-cyber-dark-accent ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm font-semibold text-white/70 tracking-wide uppercase">Sync Nodes</span>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="lg:col-span-2 glass-card p-6 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyber-dark-accent" />
                            <h3 className="font-bold text-lg">Trust Integrity Wave</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-cyber-dark-accent" />
                                <span className="text-xs text-white/40 uppercase font-bold tracking-widest">Trust Index</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-white/20" />
                                <span className="text-xs text-white/40 uppercase font-bold tracking-widest">Reports</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockChartData}>
                                <defs>
                                    <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3A86FF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3A86FF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.2)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.2)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#16213E',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="trust"
                                    stroke="#3A86FF"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorTrust)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="reports"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-cyber-dark-green" />
                        Node Health
                    </h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Frontend Cluster', status: 'Optimal', value: 98 },
                            { label: 'Trust Engine', status: 'Analyzing', value: 84 },
                            { label: 'Blockchain Sync', status: 'Lagging', value: 42 },
                            { label: 'AI Inference', status: 'Optimal', value: 95 },
                        ].map((node) => (
                            <div key={node.label}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-white/70">{node.label}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${node.value > 80 ? 'bg-cyber-dark-green/10 text-cyber-dark-green' :
                                        node.value > 60 ? 'bg-cyber-dark-amber/10 text-cyber-dark-amber' : 'bg-cyber-dark-red/10 text-cyber-dark-red'
                                        }`}>
                                        {node.status}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${node.value > 80 ? 'bg-cyber-dark-green' :
                                            node.value > 60 ? 'bg-cyber-dark-amber' : 'bg-cyber-dark-red'
                                            }`}
                                        style={{ width: `${node.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
