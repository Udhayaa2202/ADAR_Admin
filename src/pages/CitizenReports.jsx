import React, { useState, useEffect } from 'react';
import {
    Activity,
    Loader2,
    FileText,
    Search,
    Filter
} from 'lucide-react';
import ReportTable from '../components/ReportTable';
import { fetchAllReports } from '../services/dataService';

const CitizenReports = ({ onViewReport }) => {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredReports = reports.filter(report =>
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto font-sans">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Citizen Reports
                    </h2>
                    <p className="text-white/40 mt-1 font-medium italic">Verified community signals and active incident reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyber-dark-accent transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by ID or Location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyber-dark-accent/50 transition-all w-64"
                        />
                    </div>
                    <button
                        onClick={loadReports}
                        className="flex items-center gap-3 bg-white/5 p-2 px-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <Activity className={`w-4 h-4 text-cyber-dark-accent ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-black uppercase tracking-widest text-white/70">Sync Feed</span>
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-white/20">
                    <Loader2 className="w-12 h-12 mb-4 animate-spin text-cyber-dark-accent" />
                    <p className="text-lg font-medium">Fetching secure signal data...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                            Showing {filteredReports.length} of {reports.length} Signals
                        </span>
                        <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Advanced Filters</span>
                        </div>
                    </div>
                    <ReportTable reports={filteredReports} onSelectReport={onViewReport} />
                </div>
            )}
        </div>
    );
};

export default CitizenReports;
