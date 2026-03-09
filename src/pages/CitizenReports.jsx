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

    return (
        <div className="flex-1 p-4 md:p-8 space-y-4 md:space-y-8 max-w-7xl mx-auto font-sans h-full flex flex-col overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic tracking-tighter uppercase">
                        Citizen Reports
                    </h2>
                    <p className="text-[11px] md:text-sm text-white/70 mt-1 font-medium italic">Approved community signals and active incident reports.</p>
                </div>
                <div className="flex items-center gap-3 text-right">
                    <button
                        onClick={loadReports}
                        className="flex items-center gap-3 bg-white/5 p-2 px-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                        <Activity className={`w-4 h-4 text-cyber-dark-accent ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-black uppercase tracking-widest text-white/70">Sync Feed</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="py-20 h-full flex flex-col items-center justify-center text-white/20">
                        <Loader2 className="w-12 h-12 mb-4 animate-spin text-cyber-dark-accent" />
                        <p className="text-lg font-medium">Fetching secure signal data...</p>
                    </div>
                ) : (
                    <ReportTable reports={reports} onSelectReport={onViewReport} />
                )}
            </div>
        </div>
    );
};

export default CitizenReports;
