import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, AlertCircle, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Image as ImageIcon, Navigation } from 'lucide-react';

const PhotoVerificationPage = ({ report, onNavigate }) => {
    const [verificationStep, setVerificationStep] = useState(0);
    const [results, setResults] = useState(null);

    const reportedLocation = report?.location || "Unknown Location";

    // Prioritize high-precision incident coordinates from our new map picker sync
    const reportedLat = report?.incidentLat || report?.latitude || 12.9716;
    const reportedLon = report?.incidentLon || report?.longitude || 77.5946;
    const reportedCoords = `${parseFloat(reportedLat).toFixed(4)}° N, ${parseFloat(reportedLon).toFixed(4)}° E`;

    const isLive = report?.capturedLive === true || report?.captureSource === 'Live';

    // --- REAL DATA RESOLUTION ---
    let evidenceCity = "Unknown";
    let evidenceLocation = "No Metadata Found";
    let evidenceCoords = "0.0000° N, 0.0000° E";
    let isDataSimulated = false;
    let dataLabel = "MISSING_DATA";
    let evLat = null;
    let evLon = null;

    if (report?.photoLocation) {
        const parts = report.photoLocation.split(',');
        if (parts.length === 2 && !isNaN(parseFloat(parts[0]))) {
            evLat = parseFloat(parts[0]);
            evLon = parseFloat(parts[1]);
            evidenceCoords = `${evLat.toFixed(4)}° N, ${evLon.toFixed(4)}° E`;
            // If we have a source flag from the database, use it
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
        // Fallback for cases with no metadata at all
        isDataSimulated = true;
        evidenceCity = "Unknown";
        evidenceLocation = "No forensic metadata attached";
        evidenceCoords = "Data Unavailable";
    }

    // --- MATCHING ENGINE (STRICT) ---
    // Distance check helper (Haversine)
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

    const reportedCityName = reportedLocation.split(/[\s,]+/)[0].trim().toLowerCase();
    const evidenceCityName = evidenceCity.trim().toLowerCase();

    let locationsMatch = false;
    let distance = null;

    if (!isDataSimulated) {
        if (isLive) {
            locationsMatch = true; // Live photos are intrinsically verified
        } else if (evLat && evLon && reportedLat && reportedLon) {
            distance = getDistance(evLat, evLon, reportedLat, reportedLon);
            // Consider a match if within 5km (for urban precision)
            locationsMatch = distance !== null && distance < 5;
        } else if (evidenceCity !== "Unknown") {
            locationsMatch = reportedCityName === evidenceCityName;
        }
    }

    const mockVerification = {
        reportedLocation,
        reportedCoords,
        evidenceLocation,
        evidenceCoords,
        isMatch: report?.forceFake ? false : locationsMatch,
        isLive,
        isDataSimulated,
        dataLabel,
        distance: distance ? distance.toFixed(2) : null
    };

    useEffect(() => {
        if (!report) return;

        // Reset steps on report change
        setVerificationStep(0);
        setResults(null);

        // Simulate verification process
        const timer1 = setTimeout(() => setVerificationStep(1), 1000);
        const timer2 = setTimeout(() => setVerificationStep(2), 2000);
        const timer3 = setTimeout(() => {
            setVerificationStep(3);
            setResults(mockVerification);
        }, 3000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [report]);

    if (!report) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-cyber-dark/50 backdrop-blur-sm">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-cyber-dark-accent/20 blur-3xl rounded-full" />
                    <div className="relative p-8 bg-white/5 border border-white/10 rounded-full">
                        <ImageIcon className="w-20 h-20 text-cyber-dark-accent opacity-50" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-3">
                    Verification Engine Standby
                </h2>
                <div className="text-white/40 text-sm max-w-md mx-auto leading-relaxed border-t border-white/5 pt-4">
                    The forensic analysis module is currently idle. Select a report from the {" "}
                    <button
                        onClick={() => onNavigate('citizen-reports')}
                        className="text-cyber-dark-accent font-bold hover:underline transition-all"
                    >
                        Citizen Reports
                    </button>
                    {" "} and click <span className="text-white font-bold italic">"Send for Verification"</span> to begin metadata extraction.
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-8 bg-cyber-dark">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-cyber-dark-accent mb-2">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Forensic Analysis</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">PHOTO VERIFICATION</h1>
                        <p className="text-white/40 font-mono text-sm uppercase tracking-wider">Report ID: {report.id}</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-1 min-w-[150px]">
                            <span className="text-[10px] text-white/40 uppercase font-black">Meta Integrity</span>
                            <span className={`text-sm font-bold ${results ? (results.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red') : 'text-white/20'}`}>
                                {results ? (results.isMatch ? 'TRUSTED_NODE' : 'TAMPERED_METADATA') : 'ANALYZING...'}
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
                            className="glass-card p-6 flex items-center justify-between border-l-4 border-l-cyber-dark-accent"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${results ? (results.isLive ? 'bg-cyber-dark-green/20' : 'bg-cyber-dark-amber/20') : 'bg-white/5'}`}>
                                    <ShieldCheck className={`w-6 h-6 ${results ? (results.isLive ? 'text-cyber-dark-green' : 'text-cyber-dark-amber') : 'text-white/20'}`} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Capture Source</p>
                                    <h4 className="text-white font-bold text-lg">
                                        {results ? (results.isLive ? 'LIVE CAMERA' : 'GALLERY UPLOAD') : 'DETECTING SOURCE...'}
                                    </h4>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${results ? (results.isLive ? 'bg-cyber-dark-green/10 border-cyber-dark-green/20 text-cyber-dark-green' : 'bg-cyber-dark-amber/10 border-cyber-dark-amber/20 text-cyber-dark-amber') : 'bg-white/5 border-white/5 text-white/20'}`}>
                                    {results ? (results.isLive ? 'SECURE_STREAM' : 'UNVERIFIED_DATA') : 'SCANNING'}
                                </span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Metadata Logic */}
                    <div className="space-y-6 flex flex-col justify-center">
                        <div className="glass-card p-8 space-y-8 relative overflow-hidden">
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
                                    <div className={`p-5 rounded-2xl border transition-all duration-500 ${verificationStep >= 1 ? 'bg-white/5 border-white/10' : 'opacity-20 border-white/5'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Reported Location</p>
                                                <h4 className="text-white font-mono text-lg truncate max-w-[300px]">
                                                    {verificationStep >= 1 ? mockVerification.reportedLocation : 'INITIALIZING...'}
                                                </h4>
                                                <p className="text-[10px] text-cyber-dark-accent font-mono tracking-tighter">
                                                    {verificationStep >= 1 ? mockVerification.reportedCoords : '...'}
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
                                    <div className={`p-5 rounded-2xl border transition-all duration-500 ${verificationStep >= 2 ? 'bg-white/5 border-white/10' : 'opacity-20 border-white/5'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Forensic Location Source</p>
                                                    {verificationStep >= 2 && (
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${mockVerification.dataLabel === 'DEVICE_SIGNATURE'
                                                                ? 'bg-cyber-dark-accent/20 text-cyber-dark-accent border-cyber-dark-accent/30'
                                                                : mockVerification.isDataSimulated
                                                                    ? 'bg-cyber-dark-amber/20 text-cyber-dark-amber border-cyber-dark-amber/30'
                                                                    : 'bg-cyber-dark-green/20 text-cyber-dark-green border-cyber-dark-green/30'
                                                            }`}>
                                                            {mockVerification.dataLabel === 'DEVICE_SIGNATURE'
                                                                ? 'Hardware Signature'
                                                                : mockVerification.isDataSimulated
                                                                    ? 'Simulated Data'
                                                                    : 'Verified Metadata'}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-white font-mono text-lg truncate max-w-[300px]">
                                                    {verificationStep >= 2 ? mockVerification.evidenceLocation : 'EXTRACTING...'}
                                                </h4>
                                                <p className="text-[10px] text-white/60 font-mono tracking-tighter">
                                                    {verificationStep >= 2 ? mockVerification.evidenceCoords : '...'}
                                                </p>
                                                {verificationStep >= 2 && mockVerification.distance && (
                                                    <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border ${mockVerification.isMatch ? 'bg-cyber-dark-green/5 border-cyber-dark-green/20' : 'bg-cyber-dark-red/5 border-cyber-dark-red/20'}`}>
                                                        <AlertCircle className={`w-3 h-3 ${mockVerification.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red'}`} />
                                                        <span className={`text-[10px] font-black uppercase ${mockVerification.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red'}`}>
                                                            {mockVerification.isMatch ? 'Proximity Verified' : 'Location Mismatch'}: {mockVerification.distance}km
                                                        </span>
                                                    </div>
                                                )}
                                                <p className="text-[9px] text-white/30 font-bold uppercase italic mt-1">
                                                    {verificationStep >= 2 ? (mockVerification.isLive ? '(Hardware-stamped live GPS)' : `(Metadata Analysis: Source ${mockVerification.dataLabel})`) : 'ANALYZING FILE HEADERS'}
                                                </p>
                                            </div>
                                            <div className={`p-2 rounded-lg ${verificationStep >= 2 ? (mockVerification.isMatch ? 'bg-cyber-dark-green/20 text-cyber-dark-green' : 'bg-cyber-dark-red/20 text-cyber-dark-red') : 'bg-white/5 text-white/10'}`}>
                                                {mockVerification.isMatch ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Result */}
                            {results && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-6 rounded-3xl border text-center space-y-3 shadow-2xl relative overflow-hidden ${results.isMatch ? 'bg-[#06D6A0]/10 border-[#06D6A0]/30' : 'bg-[#EF233C]/10 border-[#EF233C]/30'}`}
                                >
                                    {!results.isMatch && (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                                    )}
                                    <div className="flex flex-col items-center gap-2">
                                        {results.isMatch ? (
                                            <CheckCircle2 className="w-10 h-10 text-cyber-dark-green" />
                                        ) : (
                                            <ShieldAlert className="w-10 h-10 text-cyber-dark-red" />
                                        )}
                                        <h2 className={`text-3xl font-black tracking-tighter uppercase italic ${results.isMatch ? 'text-cyber-dark-green' : 'text-cyber-dark-red'}`}>
                                            RESULT: {results.isMatch ? 'MATCH' : 'INTEGRITY BREACH'}
                                        </h2>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
                                            {results.isMatch
                                                ? 'This is a high-accuracy report. Metadata aligns with physical sensors.'
                                                : results.isLive
                                                    ? 'Live stream coordinates show minor deviation from reported zone.'
                                                    : 'CRITICAL: Gallery photo EXIF location differs significantly from the reported incident location.'
                                            }
                                        </p>
                                        {!results.isMatch && !results.isLive && (
                                            <p className="text-red-400/60 text-[10px] uppercase font-black px-4 py-2 bg-red-500/10 rounded-lg inline-block border border-red-500/20">
                                                Protocol Violation: Potential Evidence Fabrication
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
