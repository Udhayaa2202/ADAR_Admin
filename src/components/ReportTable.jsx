import React, { useState } from 'react';
import {
    Search,
    Filter,
    ChevronRight,
    MoreVertical,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatusBadge = ({ status }) => {
    const styles = {
        'Verified': 'bg-[#06D6A0]/10 text-[#06D6A0] border-[#06D6A0]/20',
        'Pending': 'bg-[#FFBE0B]/10 text-[#FFBE0B] border-[#FFBE0B]/20',
        'Flagged': 'bg-[#EF233C]/10 text-[#EF233C] border-[#EF233C]/20',
        'Under Review': 'bg-[#3A86FF]/10 text-[#3A86FF] border-[#3A86FF]/20',
    };

    const icons = {
        'Verified': CheckCircle2,
        'Pending': Clock,
        'Flagged': AlertCircle,
        'Under Review': Clock,
    };

    const Icon = icons[status] || Clock;

    return (
        <span className={`status-badge border inline-flex items-center gap-1.5 ${styles[status]}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};

const TrustScore = ({ score }) => {
    let color = 'text-[#06D6A0]';
    if (score < 50) color = 'text-[#EF233C]';
    else if (score < 80) color = 'text-[#FFBE0B]';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${score < 50 ? 'bg-[#EF233C]' : score < 80 ? 'bg-[#FFBE0B]' : 'bg-[#06D6A0]'} transition-all`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className={`text-sm font-semibold tabular-nums ${color}`}>{score}%</span>
        </div>
    );
};

const ReportTable = ({ reports, onSelectReport }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredReports = reports.filter(report => {
        const matchesSearch = (report.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="glass-card overflow-hidden border-white/5">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search by 6-digit Report ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setSearchTerm(val);
                        }}
                        className="w-full bg-[#0D1B2A] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyber-dark-accent/50 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">
                        Showing <span className="text-cyber-dark-accent">{filteredReports.length}</span> of {reports.length} Signals
                    </span>
                    <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                        <Filter className="w-4 h-4 text-white/50" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer pr-2"
                        >
                            <option value="All" className="bg-[#16213E] text-white">All Status</option>
                            <option value="Verified" className="bg-[#16213E] text-white">Verified</option>
                            <option value="Under Review" className="bg-[#16213E] text-white">Under Review</option>
                            <option value="Flagged" className="bg-[#16213E] text-white">Flagged</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/2 pb-4">
                            <th className="px-6 py-4 text-xs font-bold text-white/30 uppercase tracking-widest font-sans">Report ID</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/30 uppercase tracking-widest font-sans">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/30 uppercase tracking-widest font-sans">Trust Score</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/30 uppercase tracking-widest font-sans">Timestamp</th>
                            <th className="px-6 py-4 text-xs font-bold text-white/30 uppercase tracking-widest font-sans text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {filteredReports.map((report) => (
                                <motion.tr
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    key={report.id}
                                    className="hover:bg-white/2 transition-colors cursor-pointer group"
                                    onClick={() => onSelectReport(report)}
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm font-medium text-cyber-dark-accent">{report.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={report.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <TrustScore score={report.trustScore} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-white/50 whitespace-nowrap">{report.timestamp}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectReport(report);
                                            }}
                                            className="p-2 hover:bg-cyber-dark-accent/10 rounded-lg text-white/30 group-hover:text-cyber-dark-accent transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>

                {filteredReports.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-white/20">
                        <Search className="w-12 h-12 mb-4 opacity-10" />
                        <p className="text-lg font-medium">No reports found matching your criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportTable;
