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
        'Approved': 'bg-[#06D6A0]/10 text-[#06D6A0] border-[#06D6A0]/20',
        'Pending': 'bg-[#FFBE0B]/10 text-[#FFBE0B] border-[#FFBE0B]/20',
        'Flagged': 'bg-[#EF233C]/10 text-[#EF233C] border-[#EF233C]/20',
        'Under Review': 'bg-[#3A86FF]/10 text-[#3A86FF] border-[#3A86FF]/20',
    };

    const icons = {
        'Verified': CheckCircle2,
        'Approved': CheckCircle2,
        'Pending': Clock,
        'Flagged': AlertCircle,
        'Under Review': Clock,
    };

    const Icon = icons[status] || Clock;

    return (
        <span className={`status-badge border inline-flex items-center gap-1.5 ${styles[status]}`}>
            <Icon className="w-3.5 h-3.5" />
            {status === 'Verified' ? 'Approved' : status}
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
        const term = searchTerm.toLowerCase();
        const matchesSearch = (report.id || '').toLowerCase().includes(term) ||
            (report.userId && typeof report.userId === 'string' && report.userId.toLowerCase().includes(term));
        const matchesStatus = statusFilter === 'All' || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="glass-card border-white/5 h-full flex flex-col overflow-hidden mx-auto w-full">
            <div className="p-3 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-3 md:gap-4 items-center justify-between shrink-0">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-white/30" />
                    <input
                        type="text"
                        inputMode="text"
                        placeholder="Search By ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                        }}
                        className="w-full bg-[#0D1B2A] border border-white/5 rounded-xl py-2 md:py-2.5 pl-9 md:pl-10 pr-4 text-sm focus:outline-none focus:border-cyber-dark-accent/50 transition-colors"
                    />
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 w-full md:w-auto">
                    <span className="text-[9px] md:text-xs font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">
                        Total reports: <span className="text-cyber-dark-accent">{filteredReports.length}</span> out of {reports.length}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-white/5 rounded-xl border border-white/5">
                        <Filter className="w-3 h-3 md:w-4 md:h-4 text-white/50" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] md:text-sm font-medium focus:outline-none cursor-pointer pr-1 md:pr-2"
                        >
                            <option value="All" className="bg-[#16213E] text-white text-xs">All Status</option>
                            <option value="Verified" className="bg-[#16213E] text-white text-xs">Approved</option>
                            <option value="Under Review" className="bg-[#16213E] text-white text-xs">Review</option>
                            <option value="Flagged" className="bg-[#16213E] text-white text-xs">Flagged</option>
                            <option value="Rejected" className="bg-[#16213E] text-white text-xs">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto min-h-0 custom-scrollbar">
                <div className="min-w-[600px] md:min-w-full">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#16213E] sticky top-0 z-10 border-b border-white/5">
                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Report ID</th>
                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Status</th>
                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Trust Score</th>
                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Timestamp</th>
                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em] text-right">Actions</th>
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
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-bold text-cyber-dark-accent">{report.id}</span>
                                            <span className="text-[9px] text-white/60 font-black uppercase">{report.userId || 'Anonymous'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <StatusBadge status={report.status} />
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <TrustScore score={report.trustScore} />
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <span className="text-sm text-white/50 whitespace-nowrap">{report.timestamp}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-right">
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
            </div>

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
