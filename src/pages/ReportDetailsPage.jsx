import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    MapPin,
    Cpu,
    AlertTriangle,
    CheckCircle,
    Trash2,
    ShieldAlert,
    Image as ImageIcon,
    Play,
    Calendar,
    User,
    Clock,
    Shield,
    Activity,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTrustBreakdown, updateReportStatus } from '../services/dataService';

const DeductionItem = ({ label, value, type }) => (
    <div className="flex justify-between items-center py-3 text-sm border-b border-white/5 last:border-0">
        <span className="text-white/50">{label}</span>
        <span className={`font-mono font-bold ${type === 'negative' ? 'text-[#EF233C]' : 'text-[#06D6A0]'}`}>
            {type === 'negative' ? '-' : '+'}{value}%
        </span>
    </div>
);

const REJECTION_REASONS = [
    "Fake GPS / Mock Location",
    "Gallery uploads (Non-live)",
    "Evidence fabrication suspected",
    "Duplicate / Repetitive Report",
    "Irrelevant / Non-incident Content",
    "Inaccurate Location Data",
    "Privacy Violation / Sensitive Personal Info",
    "Poor Evidence Quality (Unreadable)",
    "Stale incident (>3 days old)"
];

const ReportDetailsPage = ({ report, onBack, onRefresh }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showRejectReasons, setShowRejectReasons] = useState(false);
    const [selectedReasons, setSelectedReasons] = useState([]);

    if (!report) return null;

    const breakdown = formatTrustBreakdown(report.trustBreakdown);
    const imageUrl = report.evidenceUrls?.image;
    const videoUrl = report.evidenceUrls?.video;

    const chatBriefing = [
        { label: 'Incident Frequency', value: report.frequency },
        { label: 'Sensitive Area', value: report.sensitive_area },
        { label: 'Activity Type', value: report.activity_type },
        { label: 'Vehicles Involved', value: report.vehicles },
        { label: 'People Count', value: report.people_count },
    ].filter(item => item.value);

    const toggleReason = (reason) => {
        setSelectedReasons(prev =>
            prev.includes(reason)
                ? prev.filter(r => r !== reason)
                : [...prev, reason]
        );
    };

    const handleStatusUpdate = async (newStatus, reasons = []) => {
        setIsUpdating(true);
        try {
            const reasonString = reasons.join(', ');
            await updateReportStatus(report.id, newStatus, reasonString);
            if (onRefresh) await onRefresh();
            onBack();
        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update report status.");
        } finally {
            setIsUpdating(false);
            setShowRejectReasons(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-8 space-y-8 max-w-7xl mx-auto font-sans relative"
        >
            {/* Rejection Reasons Overlay */}
            <AnimatePresence>
                {showRejectReasons && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card max-w-lg w-full p-8 space-y-6"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Trash2 className="w-5 h-5 text-red-500" />
                                        Reject Report
                                    </h3>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded border ${selectedReasons.length >= 3 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/5 text-white/30'}`}>
                                        {selectedReasons.length}/3 SELECTED
                                    </span>
                                </div>
                                <p className="text-white/40 text-sm italic border-l-2 border-red-500/20 pl-3">
                                    Admins must select a minimum of 3 reasons to justify rejection.
                                </p>
                            </div>

                            <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {REJECTION_REASONS.map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => toggleReason(reason)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium relative group ${selectedReasons.includes(reason)
                                            ? 'bg-red-500/20 border-red-500/50 text-white shadow-lg shadow-red-500/5'
                                            : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{reason}</span>
                                            {selectedReasons.includes(reason) && (
                                                <CheckCircle className="w-4 h-4 text-red-400" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        setShowRejectReasons(false);
                                        setSelectedReasons([]);
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 font-bold transition-all text-xs uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={selectedReasons.length < 3 || isUpdating}
                                    onClick={() => handleStatusUpdate('Rejected', selectedReasons)}
                                    className="flex-[2] bg-red-500 hover:bg-red-600 disabled:opacity-20 text-white px-4 py-3 rounded-xl font-bold shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                >
                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                                    Finalize Rejection
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/50 hover:text-white border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-white">{report.id}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${report.status === 'Verified' ? 'bg-[#06D6A0]/10 text-[#06D6A0] border-[#06D6A0]/20' :
                                report.status === 'Flagged' ? 'bg-[#EF233C]/10 text-[#EF233C] border-[#EF233C]/20' :
                                    'bg-[#FFBE0B]/10 text-[#FFBE0B] border-[#FFBE0B]/20'
                                }`}>
                                {report.status}
                            </span>
                        </div>
                        <p className="text-white/40 mt-1 font-mono text-sm">Security Service Identification • Latency: 24ms</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    <div className="px-4 py-2 flex flex-col items-center">
                        <span className="text-[10px] text-white/30 uppercase font-black">Trust Score</span>
                        <span className={`text-xl font-black ${report.trustScore >= 80 ? 'text-cyber-dark-green' : report.trustScore >= 50 ? 'text-cyber-dark-amber' : 'text-cyber-dark-red'}`}>
                            {report.trustScore}%
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    {/* Media Section */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 text-cyber-dark-accent">
                            <ImageIcon className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Visual Evidence</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {imageUrl ? (
                                <div className="aspect-square bg-black/40 rounded-2xl border border-white/5 overflow-hidden group relative">
                                    <img
                                        src={imageUrl}
                                        alt="Evidence"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/800?text=Image+Load+Failed'; }}
                                    />
                                    <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white/70">STILL_FRAME</div>
                                </div>
                            ) : (
                                <div className="aspect-square bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col items-center justify-center opacity-20">
                                    <ImageIcon className="w-12 h-12 mb-2" />
                                    <span className="text-xs">No Static Image</span>
                                </div>
                            )}

                            {videoUrl ? (
                                <div className="aspect-square bg-black/40 rounded-2xl border border-white/5 overflow-hidden relative">
                                    <video src={videoUrl} controls className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white/70 flex items-center gap-1">
                                        <Play className="w-2 h-2 fill-current" /> MOTION_ASSET
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-square bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col items-center justify-center opacity-20">
                                    <Play className="w-12 h-12 mb-2" />
                                    <span className="text-xs">No Motion Asset</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Descriptions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        <section className="glass-card p-6 space-y-4 flex flex-col h-full">
                            <div className="flex items-center gap-2 text-cyber-dark-accent">
                                <User className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">User Description</h3>
                            </div>
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 flex-1">
                                <p className="text-white/80 leading-relaxed text-sm">
                                    {report.description || "No description provided by user."}
                                </p>
                            </div>
                        </section>

                        <section className="glass-card p-6 space-y-4 flex flex-col h-full">
                            <div className="flex items-center gap-2 text-cyber-dark-accent">
                                <Cpu className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Neural Analysis</h3>
                            </div>
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 flex-1">
                                <p className="text-white/80 leading-relaxed text-sm italic">
                                    "{report.aiDescription || "Automated intelligence analysis pending."}"
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Location Data Section */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 text-blue-400">
                            <MapPin className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Geospatial Intelligence</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                {report.lat && report.lng ? (
                                    <div className="w-full aspect-video rounded-xl border border-white/10 overflow-hidden bg-white/5">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            scrolling="no"
                                            marginHeight="0"
                                            marginWidth="0"
                                            src={`https://maps.google.com/maps?q=${report.lat},${report.lng}&z=15&output=embed`}
                                            className="grayscale opacity-70 contrast-125"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-video rounded-xl border border-white/5 border-dashed flex flex-col items-center justify-center bg-white/[0.02] opacity-20">
                                        <MapPin className="w-8 h-8 mb-2" />
                                        <span className="text-xs">No Geospatial Data</span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4 flex flex-col justify-center">
                                <div className="bg-white/2 p-4 rounded-xl border border-white/5 space-y-2 text-center md:text-left">
                                    <p className="text-[10px] text-white/30 uppercase font-bold">Physical Address</p>
                                    <p className="text-xs text-white/70 leading-relaxed">
                                        {report.location || "No address data attached."}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-[10px] px-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-white/20" />
                                        <span className="text-white/40 uppercase font-bold">Coordinates</span>
                                    </div>
                                    <span className="font-mono text-white/70">
                                        {report.lat ? `${report.lat}, ${report.lng}` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Intelligence & Actions */}
                <div className="lg:sticky lg:top-8 space-y-8">
                    {/* Trust Breakdown */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 text-cyber-dark-amber">
                            <ShieldAlert className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Trust Integrity</h3>
                        </div>
                        <div className="space-y-1">
                            {breakdown.length > 0 ? (
                                breakdown.map((item, idx) => (
                                    <DeductionItem key={idx} label={item.label} value={item.value} type={item.type} />
                                ))
                            ) : (
                                <div className="py-6 text-center opacity-20 italic text-sm">No verification signals.</div>
                            )}
                        </div>
                    </section>

                    {/* Intelligence Briefing Section */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 text-[#4CC9F0]">
                            <Shield className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Live Briefing</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {chatBriefing.length > 0 ? (
                                chatBriefing.map((chat, idx) => (
                                    <div key={idx} className="bg-white/[0.02] p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                        <p className="text-[10px] text-white/30 uppercase font-bold">{chat.label}</p>
                                        <p className="text-xs font-semibold text-white/90">{chat.value}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-2 text-center opacity-20 italic text-xs">No chat intelligence.</div>
                            )}
                        </div>
                    </section>

                    {/* Incident Timeline */}
                    <section className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-2 text-cyber-dark-accent">
                            <Calendar className="w-5 h-5" />
                            <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Timeline</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <span className="text-[10px] text-white/20 uppercase font-bold">In-Event</span>
                                <span className="font-mono text-xs text-white/90">{report.incidentDate || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <span className="text-[10px] text-white/20 uppercase font-bold">Sync Time</span>
                                <span className="font-mono text-xs text-white/90">{report.incidentTime || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <span className="text-[10px] text-white/20 uppercase font-bold">Entry ID</span>
                                <span className="font-mono text-[9px] text-white/40">{report.timestamp?.split(',')[0]}</span>
                            </div>
                        </div>
                    </section>

                    {/* Action Hub */}
                    <section className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                disabled={isUpdating}
                                onClick={() => handleStatusUpdate('Verified')}
                                className="flex items-center justify-center gap-2 bg-[#06D6A0] hover:bg-[#06D6A0]/90 disabled:opacity-50 text-[#0D1B2A] font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#06D6A0]/10 uppercase text-xs tracking-widest"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Approve
                            </button>
                            <button
                                disabled={isUpdating}
                                onClick={() => setShowRejectReasons(true)}
                                className="flex items-center justify-center gap-2 bg-[#EF233C] hover:bg-[#EF233C]/90 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#EF233C]/10 uppercase text-xs tracking-widest"
                            >
                                <Trash2 className="w-5 h-5" />
                                Reject
                            </button>
                        </div>
                        <button
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate('Flagged')}
                            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all border border-white/5 uppercase text-xs tracking-widest"
                        >
                            <AlertTriangle className="w-5 h-5 text-[#FFBE0B]" />
                            Flag Incident
                        </button>
                    </section>
                </div>
            </div>
        </motion.div>
    );
};

export default ReportDetailsPage;
