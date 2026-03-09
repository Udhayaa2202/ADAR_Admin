import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MapPin, AlertCircle, CheckCircle2, XCircle, ArrowLeft, ArrowRight, ShieldAlert, Image as ImageIcon, Navigation, History, RefreshCcw, Search, FileText } from 'lucide-react';
import { fetchAllReports } from '../services/dataService';

// --- SHARED VERIFICATION ENGINE ---
const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const runVerificationLogic = (report) => {
    if (!report) return null;

    const reportedLocation = report?.location || "Unknown Location";
    const reportedLat = report?.incidentLat || report?.latitude || 12.9716;
    const reportedLon = report?.incidentLon || report?.longitude || 77.5946;
    const reportedCoords = `${parseFloat(reportedLat).toFixed(4)}° N, ${parseFloat(reportedLon).toFixed(4)}° E`;

    const isLive = report?.capturedLive === true ||
        report?.captureSource === 'Live' ||
        report?.captureSource === 'Camera' ||
        report?.metadata?.source === 'live';

    const captureMethod = isLive ? 'LIVE_SECURE' : (report?.captureSource || 'GALLERY_UPLOAD');

    let evidenceCity = "Unknown";
    let evidenceLocation = "No Metadata Found";
    let evidenceCoords = "0.0000° N, 0.0000° E";
    let isDataSimulated = false;
    let dataLabel = "MISSING_DATA";
    let evLat = null;
    let evLon = null;

    if (report?.photoLocation && typeof report.photoLocation === 'string') {
        const parts = report.photoLocation.split(',');
        if (parts.length === 2 && !isNaN(parseFloat(parts[0]))) {
            evLat = parseFloat(parts[0]);
            evLon = parseFloat(parts[1]);
            evidenceCoords = `${evLat.toFixed(4)}° N, ${evLon.toFixed(4)}° E`;
            dataLabel = report.photoLocationSource === 'device_signature' ? 'DEVICE_SIGNATURE' : 'VERIFIED_EXIF';
            evidenceCity = "Extracted Location";
            evidenceLocation = `Coord-Stamped (${dataLabel === 'DEVICE_SIGNATURE' ? 'Hardware' : 'Metadata'})`;
        } else {
            evidenceCity = report.photoLocation.split(',')[0];
            evidenceLocation = report.photoLocation;
            dataLabel = 'LEGACY_METADATA';
        }
    } else if (isLive) {
        dataLabel = "LIVE_SECURE";
        evidenceCity = reportedLocation.split(/[\s,]+/)[0];
        evidenceLocation = `${evidenceCity}, Tamil Nadu (Live Stream)`;
        evidenceCoords = reportedCoords;
        evLat = report?.latitude;
        evLon = report?.longitude;
    } else {
        isDataSimulated = true;
        evidenceCity = "Unknown";
        evidenceLocation = "No forensic metadata attached";
        evidenceCoords = "Data Unavailable";
    }

    const reportedCityName = reportedLocation.split(/[\s,]+/)[0].trim().toLowerCase();
    const evidenceCityName = evidenceCity.trim().toLowerCase();

    let locationsMatch = false;
    let distance = null;

    if (!isDataSimulated) {
        if (isLive) {
            locationsMatch = true;
        } else if (evLat && evLon && reportedLat && reportedLon) {
            distance = getDistance(evLat, evLon, reportedLat, reportedLon);
            locationsMatch = distance !== null && distance < 5;
        } else if (evidenceCity !== "Unknown") {
            locationsMatch = reportedCityName === evidenceCityName;
        }
    }

    return {
        reportedLocation,
        reportedCoords,
        evidenceLocation,
        evidenceCoords,
        isMatch: report?.forceFake ? false : locationsMatch,
        isLive,
        captureMethod,
        isDataSimulated,
        dataLabel,
        distance: distance ? distance.toFixed(2) : null
    };
};

const PhotoVerificationPage = ({ report, results, onScanComplete, onNavigate, onSelectReport, onViewReport }) => {
    const [verificationStep, setVerificationStep] = useState(results ? 3 : 0);
    const [localResults, setLocalResults] = useState(results);
    const [historyReports, setHistoryReports] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const currentVerification = runVerificationLogic(report);

    const startVerification = () => {
        setVerificationStep(0);
        setLocalResults(null);
        onScanComplete?.(null);

        const timer1 = setTimeout(() => setVerificationStep(1), 800);
        const timer2 = setTimeout(() => setVerificationStep(2), 1600);
        const timer3 = setTimeout(() => {
            setVerificationStep(3);
            const res = runVerificationLogic(report);
            setLocalResults(res);
            onScanComplete?.(res);
        }, 2400);

        return [timer1, timer2, timer3];
    };

    useEffect(() => {
        if (!report) {
            setIsLoadingHistory(true);
            fetchAllReports()
                .then(reports => setHistoryReports(Array.isArray(reports) ? reports : []))
                .catch(console.error)
                .finally(() => setIsLoadingHistory(false));
            return;
        }

        if (results) {
            setVerificationStep(3);
            setLocalResults(results);
            return;
        }

        const timers = startVerification();

        return () => timers.forEach(clearTimeout);
    }, [report]);

    if (!report) {
        const filteredHistory = (historyReports || []).filter(r =>
            (r?.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r?.userId && typeof r.userId === 'string' && r.userId.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return (
            <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 bg-cyber-dark flex flex-col">
                <div className="max-w-7xl mx-auto w-full space-y-4 md:space-y-8 flex-1 flex flex-col min-h-0">
                    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 shrink-0">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-cyber-dark-accent mb-1 md:mb-2">
                                <History className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em]">Forensic Audit Log</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Verification History</h1>
                            <p className="text-white/70 font-mono text-[9px] md:text-xs uppercase tracking-widest leading-relaxed">
                                Review forensic data for all submitted citizen reports
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                            <button
                                onClick={() => onNavigate('citizen-reports')}
                                className="px-4 py-2.5 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                            >
                                <FileText className="w-4 h-4 text-cyber-dark-accent group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] md:text-[10px] text-white/70 uppercase font-black tracking-widest whitespace-nowrap">Go to Reports</span>
                            </button>
                            <div className="relative group flex-1 md:flex-none">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-cyber-dark-accent transition-colors" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search By ID..."
                                    className="pl-12 pr-6 py-2.5 md:py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-cyber-dark-accent/50 w-full md:w-[250px] transition-all"
                                />
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 min-h-0 glass-card border-white/5 flex flex-col overflow-hidden">
                        {isLoadingHistory ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 gap-4 opacity-50">
                                <RefreshCcw className="w-8 h-8 animate-spin text-cyber-dark-accent" />
                                <p className="text-xs font-black uppercase tracking-widest">Compiling Forensic Database...</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto custom-scrollbar scrollbar-hide">
                                <div className="min-w-[600px]">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-[#16213E] sticky top-0 z-10 border-b border-white/5">
                                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Report ID</th>
                                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Forensic Status</th>
                                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Trust Score</th>
                                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em]">Activity / Location</th>
                                                <th className="px-4 md:px-6 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-white/80 uppercase tracking-wider md:tracking-[0.2em] text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                        {filteredHistory.map((r) => {
                                            const v = runVerificationLogic(r);
                                            return (
                                                <motion.tr
                                                    key={r.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="hover:bg-white/2 transition-colors cursor-pointer group"
                                                    onClick={() => onSelectReport(r)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-sm font-bold text-cyber-dark-accent">{r.id}</span>
                                                            <span className="text-[9px] text-white/60 font-black uppercase">{r.userId || 'Anonymous'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border tracking-tighter ${v.isMatch ? 'bg-[#06D6A0]/10 text-[#06D6A0] border-[#06D6A0]/20' : 'bg-[#EF233C]/10 text-[#EF233C] border-[#EF233C]/20'}`}>
                                                            {v.isMatch ? 'MATCH' : 'MISMATCH'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${r.trustScore >= 80 ? 'bg-cyber-dark-green' : r.trustScore >= 50 ? 'bg-cyber-dark-amber' : 'bg-cyber-dark-red'} transition-all`}
                                                                    style={{ width: `${r.trustScore}%` }}
                                                                />
                                                            </div>
                                                            <span className={`text-xs font-black ${r.trustScore >= 80 ? 'text-cyber-dark-green' : r.trustScore >= 50 ? 'text-cyber-dark-amber' : 'text-cyber-dark-red'}`}>
                                                                {r.trustScore}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col max-w-[200px]">
                                                            <span className="text-white font-bold text-[11px] truncate uppercase">{r.activity_type || 'INCIDENT'}</span>
                                                            <span className="text-white/70 text-[10px] truncate">{r.location || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectReport(r);
                                                            }}
                                                            className="px-4 py-2 bg-white/5 hover:bg-cyber-dark-accent rounded-xl text-[10px] font-black text-white/70 hover:text-white border border-white/5 hover:border-cyber-dark-accent transition-all flex items-center gap-2 ml-auto uppercase italic tracking-widest group/btn"
                                                        >
                                                            <RefreshCcw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                                                            Re-Scan
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>

                                {filteredHistory.length === 0 && (
                                    <div className="py-20 flex flex-col items-center justify-center text-white/20">
                                        <Search className="w-12 h-12 mb-4 opacity-10" />
                                        <p className="text-sm font-black uppercase tracking-[0.2em]">No forensic records match your search</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-4 md:p-8 bg-cyber-dark">
            <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex gap-4">
                        <button
                            onClick={() => onSelectReport(null)}
                            className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/50 hover:text-white border border-white/5 h-fit mt-auto md:mb-1"
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-cyber-dark-accent mb-1 md:mb-2">
                                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                                <span className="text-[9px] md:text-xs font-black uppercase tracking-[0.2em]">Forensic Analysis</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Verification</h1>
                            <p className="text-white/70 font-mono text-[9px] md:text-xs uppercase tracking-widest leading-relaxed">Report ID: {report.id}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 md:gap-4">
                        <button
                            onClick={startVerification}
                            className="flex-1 md:flex-none px-4 py-2.5 md:px-6 md:py-3 bg-cyber-dark-accent/10 hover:bg-cyber-dark-accent/20 border border-cyber-dark-accent/30 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                        >
                            <RefreshCcw className="w-4 h-4 text-cyber-dark-accent group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[9px] md:text-[10px] text-white/70 uppercase font-black tracking-widest">Rescan</span>
                        </button>
                        <button
                            onClick={() => onViewReport(report)}
                            className="flex-1 md:flex-none px-4 py-2.5 md:px-6 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                        >
                            <FileText className="w-4 h-4 text-cyber-dark-accent group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] md:text-[10px] text-white/70 uppercase font-black tracking-widest">Details</span>
                        </button>
                        <div className="w-full md:w-auto px-4 py-2.5 md:px-6 md:py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center md:flex-col justify-between md:justify-center gap-1 min-w-0 md:min-w-[150px]">
                            <span className="text-[9px] md:text-[10px] text-white/70 uppercase font-black">Meta Integrity</span>
                            <span className={`text-xs md:text-sm font-bold ${localResults ? (localResults.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red') : 'text-white/20'}`}>
                                {localResults ? (localResults.isMatch ? 'MATCH' : 'MISMATCH') : 'ANALYZING...'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Visual Asset & Source Detection */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card overflow-hidden p-2 group"
                        >
                            <div className="aspect-square rounded-xl overflow-hidden relative border border-white/5 bg-black/40">
                                <img
                                    src={report.evidenceUrls?.image}
                                    alt="Verification Target"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="px-2 py-0.5 bg-cyber-dark-accent rounded text-[8px] font-black text-white uppercase">Source Asset</span>
                                        <p className="text-white font-mono text-xs">{report.id}.jpg</p>
                                    </div>
                                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
                                        <ImageIcon className="w-5 h-5 text-white/50" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Capture Source Detection */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="glass-card p-6 flex items-center justify-between border-l-4 border-l-cyber-dark-accent mb-auto"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${localResults ? (localResults.isLive ? 'bg-cyber-dark-green/20' : 'bg-cyber-dark-amber/20') : 'bg-white/5'}`}>
                                    <ShieldCheck className={`w-6 h-6 ${localResults ? (localResults.isLive ? 'text-cyber-dark-green' : 'text-cyber-dark-amber') : 'text-white/20'}`} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/70 uppercase font-black tracking-widest">Capture Source</p>
                                    <h4 className="text-white font-bold text-lg">
                                        {localResults ? (localResults.isLive ? 'LIVE CAMERA' : 'GALLERY UPLOAD') : 'DETECTING SOURCE...'}
                                    </h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${localResults ? (localResults.isLive ? 'bg-cyber-dark-green/10 border-cyber-dark-green/20 text-cyber-dark-green' : 'bg-cyber-dark-amber/10 border-cyber-dark-amber/20 text-cyber-dark-amber') : 'bg-white/5 border-white/5 text-white/20'}`}>
                                    {localResults ? (localResults.isLive ? 'SECURE_STREAM' : 'UNVERIFIED_DATA') : 'SCANNING'}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Metadata Logic */}
                    <div className="flex flex-col h-full min-h-0">
                        <div className="glass-card p-6 space-y-6 relative overflow-hidden h-full flex flex-col justify-between">
                            {/* Scanning Animation */}
                            {verificationStep < 3 && (
                                <motion.div
                                    animate={{ y: [0, 280, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-0.5 bg-cyber-dark-accent/50 shadow-[0_0_15px_rgba(76,201,240,0.5)] z-10"
                                />
                            )}

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-white items-center gap-2 flex">
                                    <Navigation className="w-5 h-5 text-cyber-dark-accent" />
                                    GPS CO-ORDINATE MAPPING
                                </h3>

                                <div className="space-y-4">
                                    {/* Reported Location */}
                                    <div className={`p-4 rounded-2xl border transition-all duration-500 ${verificationStep >= 1 ? 'bg-white/5 border-white/10' : 'opacity-20 border-white/5'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-white/70 uppercase font-black tracking-widest">Reported Location</p>
                                                <h4 className="text-white font-mono text-lg truncate max-w-[300px]">
                                                    {verificationStep >= 1 ? currentVerification.reportedLocation : 'INITIALIZING...'}
                                                </h4>
                                                <p className="text-[10px] text-cyber-dark-accent font-mono tracking-tighter">
                                                    {verificationStep >= 1 ? currentVerification.reportedCoords : '...'}
                                                </p>
                                                <p className="text-[9px] text-cyber-dark-accent/60 font-bold uppercase italic mt-1">
                                                    {verificationStep >= 1 ? '(Coordinates manually selected by user)' : 'FETCHING DB RECORD'}
                                                </p>
                                            </div>
                                            <div className={`p-2 rounded-lg ${verificationStep >= 1 ? 'bg-cyber-dark-accent/20 text-cyber-dark-accent' : 'bg-white/5 text-white/10'}`}>
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center -my-2 relative z-10">
                                        <div className={`p-2 rounded-full border bg-cyber-dark transition-all duration-500 ${verificationStep >= 2 ? 'border-cyber-dark-accent text-cyber-dark-accent rotate-0' : 'border-white/5 text-white/10 rotate-180'}`}>
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>

                                    {/* Photo Location (EXIF) */}
                                    <div className={`p-4 rounded-2xl border transition-all duration-500 ${verificationStep >= 2 ? 'bg-white/5 border-white/10' : 'opacity-20 border-white/5'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-white/70 uppercase font-black tracking-widest">Forensic Location Source</p>
                                                    {verificationStep >= 2 && (
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${currentVerification.dataLabel === 'DEVICE_SIGNATURE'
                                                            ? 'bg-cyber-dark-accent/20 text-cyber-dark-accent border-cyber-dark-accent/30'
                                                            : currentVerification.isDataSimulated
                                                                ? 'bg-cyber-dark-amber/20 text-cyber-dark-amber border-cyber-dark-amber/30'
                                                                : 'bg-cyber-dark-green/20 text-cyber-dark-green border-cyber-dark-green/30'
                                                            }`}>
                                                            {currentVerification.dataLabel === 'DEVICE_SIGNATURE'
                                                                ? 'Hardware Signature'
                                                                : currentVerification.isDataSimulated
                                                                    ? 'Simulated Data'
                                                                    : 'Verified Metadata'}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-white font-mono text-lg truncate max-w-[300px]">
                                                    {verificationStep >= 2 ? currentVerification.evidenceLocation : 'EXTRACTING...'}
                                                </h4>
                                                <p className="text-[10px] text-white/60 font-mono tracking-tighter">
                                                    {verificationStep >= 2 ? currentVerification.evidenceCoords : '...'}
                                                </p>
                                                {verificationStep >= 2 && currentVerification.distance && (
                                                    <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border ${currentVerification.isMatch ? 'bg-cyber-dark-green/5 border-cyber-dark-green/20' : 'bg-cyber-dark-red/5 border-cyber-dark-red/20'}`}>
                                                        <AlertCircle className={`w-3 h-3 ${currentVerification.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red'}`} />
                                                        <span className={`text-[10px] font-black uppercase ${currentVerification.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red'}`}>
                                                            {currentVerification.isMatch ? 'Proximity Verified' : 'Location Mismatch'}: {currentVerification.distance}km
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-[9px] text-white/60 font-bold uppercase italic mt-1">
                                                    {verificationStep >= 2 ? (currentVerification.isLive ? '(Hardware-stamped live GPS)' : `(Metadata Analysis: Source ${currentVerification.dataLabel})`) : 'ANALYZING FILE HEADERS'}
                                                </p>
                                            </div>
                                            <div className={`p-2 rounded-lg ${verificationStep >= 2 ? (currentVerification.isMatch ? 'bg-cyber-dark-green/20 text-cyber-dark-green' : 'bg-cyber-dark-red/20 text-cyber-dark-red') : 'bg-white/5 text-white/10'}`}>
                                                {currentVerification.isMatch ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Result */}
                            {localResults && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-4 rounded-3xl border text-center space-y-2 shadow-2xl relative overflow-hidden ${localResults.isMatch ? 'bg-[#06D6A0]/10 border-[#06D6A0]/30' : 'bg-[#EF233C]/10 border-[#EF233C]/30'}`}
                                >
                                    {!localResults.isMatch && (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                                    )}
                                    <div className="flex flex-col items-center gap-1">
                                        {localResults.isMatch ? (
                                            <CheckCircle2 className="w-8 h-8 text-cyber-dark-green" />
                                        ) : (
                                            <ShieldAlert className="w-8 h-8 text-cyber-dark-red" />
                                        )}
                                        <h2 className={`text-2xl font-black tracking-tighter uppercase italic ${localResults.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red'}`}>
                                            RESULT: {localResults.isMatch ? 'MATCH' : 'MISMATCH'}
                                        </h2>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest leading-tight">
                                            {localResults.isMatch
                                                ? 'High-accuracy forensic match. Metadata alignment verified.'
                                                : localResults.isLive
                                                    ? 'Live stream coordinates show minor deviation.'
                                                    : 'CRITICAL: Metadata mismatch detected.'
                                            }
                                        </p>
                                        {!localResults.isMatch && !localResults.isLive && (
                                            <p className="text-red-400 font-black text-[9px] uppercase tracking-tighter">
                                                POTENTIAL EVIDENCE FABRICATION
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhotoVerificationPage;
