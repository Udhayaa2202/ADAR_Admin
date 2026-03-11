import React, { useState, useEffect, useRef } from 'react';
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
    Loader2,
    Maximize2,
    X
}

    from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTrustBreakdown, updateReportStatus, fetchAllReports } from '../services/dataService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const parseReportCoords = (r) => {
    let lat = r.incidentLat || r.latitude || r.lat || null;
    let lng = r.incidentLon || r.longitude || r.lng || null;

    lat = lat ? parseFloat(lat) : null;
    lng = lng ? parseFloat(lng) : null;

    if (!lat || !lng) {
        const m = (r.location || '').match(/\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?/);
        if (m) { lat = parseFloat(m[1]); lng = parseFloat(m[2]); }
    }
    return (lat && lng && !isNaN(lat) && !isNaN(lng)) ? { lat, lng } : null;
};

// Cluster reports using DBSCAN-style connected-component clustering
// Each report has a 2km influence zone. If report B is within 2km of ANY
// report already in a cluster, B joins that cluster (chaining effect).
// Clusters with 3+ reports = RED ZONES

const ZONE_RADIUS_KM = 2;

const computeRedZones = (reports) => {
    const coords = reports.map(r => parseReportCoords(r)).filter(Boolean);
    const n = coords.length;
    if (n === 0) return [];

    // Build adjacency: which points are within 2km of each other
    const neighbors = Array.from({ length: n }, () => []);
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (getDistanceKm(coords[i].lat, coords[i].lng, coords[j].lat, coords[j].lng) <= ZONE_RADIUS_KM) {
                neighbors[i].push(j);
                neighbors[j].push(i);
            }
        }
    }

    // BFS to find connected components
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < n; i++) {
        if (visited.has(i)) continue;
        const cluster = [];
        const queue = [i];
        visited.add(i);
        while (queue.length > 0) {
            const curr = queue.shift();
            cluster.push(coords[curr]);
            for (const nb of neighbors[curr]) {
                if (!visited.has(nb)) {
                    visited.add(nb);
                    queue.push(nb);
                }
            }
        }

        if (cluster.length >= 2) {
            const avgLat = cluster.reduce((s, c) => s + c.lat, 0) / cluster.length;
            const avgLng = cluster.reduce((s, c) => s + c.lng, 0) / cluster.length;
            clusters.push({ lat: avgLat, lng: avgLng, count: cluster.length });
        }
    }
    return clusters;
};

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
    "Stale incident (>3 days old)",
    "Others"
];

const ReportDetailsPage = ({ report, onBack, onVerifyPhoto, onRefresh }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showRejectReasons, setShowRejectReasons] = useState(false);
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [otherReason, setOtherReason] = useState("");
    const [notification, setNotification] = useState({ message: '', type: '', visible: false });
    const [localStatus, setLocalStatus] = useState(report?.status);
    const [allReports, setAllReports] = useState([]);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    let mapLat = report?.incidentLat || report?.latitude || report?.lat || null;
    let mapLng = report?.incidentLon || report?.longitude || report?.lng || null;

    if (mapLat !== null) mapLat = parseFloat(mapLat);
    if (mapLng !== null) mapLng = parseFloat(mapLng);

    if (!mapLat || !mapLng) {
        const coordMatch = (report?.location || '').match(/\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?/);
        if (coordMatch) {
            mapLat = parseFloat(coordMatch[1]);
            mapLng = parseFloat(coordMatch[2]);
        }
    }
    const hasCoordinates = mapLat !== null && mapLng !== null && !isNaN(mapLat) && !isNaN(mapLng);

    useEffect(() => {
        setSelectedReasons([]);
        setOtherReason("");
        setShowRejectReasons(false);
        setLocalStatus(report?.status);
    }, [report?.id]);

    // Fetch all reports for red zone computation
    useEffect(() => {
        fetchAllReports().then(setAllReports).catch(console.error);
    }, []);

    // Initialize Leaflet map
    useEffect(() => {
        if (!hasCoordinates || !mapRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const map = L.map(mapRef.current).setView([mapLat, mapLng], 15);
        L.tileLayer('https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}', {
            attribution: '&copy; Google Maps',
        }).addTo(map);

        const markerIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
        });

        L.marker([mapLat, mapLng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`<b>${report?.id || 'Report'}</b><br/>${report?.location || 'Incident Location'}`);

        mapInstanceRef.current = map;

        const zones = computeRedZones(allReports);
        zones.forEach(zone => {
            const isRed = zone.count >= 3;
            const zoneColor = isRed ? '#EF233C' : '#FFBE0B';
            const zoneLabel = isRed ? '⚠ RED ZONE' : '⚠ WATCH ZONE';
            const zoneFill = isRed ? 0.15 : 0.10;

            L.circle([zone.lat, zone.lng], {
                radius: 2000,
                color: zoneColor,
                fillColor: zoneColor,
                fillOpacity: zoneFill,
                weight: 2,
                dashArray: '6 4',
            }).addTo(map)
                .bindPopup(`<b style="color:${zoneColor}">${zoneLabel}</b><br/>${zone.count} reports within 2km`);
        });

        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [hasCoordinates, mapLat, mapLng, report?.id, allReports]);

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
        setSelectedReasons(prev => {
            if (reason === 'Others') {
                return prev.includes('Others') ? [] : ['Others'];
            }
            const filtered = prev.filter(r => r !== 'Others');
            return filtered.includes(reason)
                ? filtered.filter(r => r !== reason)
                : [...filtered, reason];
        });
    };

    const handleStatusUpdate = async (newStatus, reasons = []) => {
        setIsUpdating(true);
        try {
            let finalReasons = [...reasons];
            if (reasons.includes('Others') && otherReason.trim()) {
                finalReasons = finalReasons.filter(r => r !== 'Others');
                finalReasons.push(`Other: ${otherReason.trim()}`);
            }
            const reasonString = finalReasons.join(', ');
            await updateReportStatus(report.id, newStatus, reasonString);

            setLocalStatus(newStatus);

            setNotification({
                message: `Report ${newStatus === 'Verified' ? 'Approved' : newStatus} Successfully`,
                type: newStatus,
                visible: true
            });

            if (onRefresh) await onRefresh();

            setTimeout(() => {
                setNotification(prev => ({ ...prev, visible: false }));
            }, 3000);

        } catch (error) {
            console.error("Failed to update status:", error);
            alert("Failed to update report status.");
        } finally {
            setIsUpdating(false);
            setShowRejectReasons(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                        >
                            <X className="w-6 h-6" />
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/5"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {notification.visible && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className={`fixed top-8 right-8 z-[110] px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 font-bold uppercase tracking-wider text-xs ${notification.type === 'Verified' ? 'bg-[#06D6A0]/20 border-[#06D6A0]/50 text-[#06D6A0]' :
                            notification.type === 'Rejected' ? 'bg-[#EF233C]/20 border-[#EF233C]/50 text-[#EF233C]' :
                                'bg-[#FFBE0B]/20 border-[#FFBE0B]/50 text-[#FFBE0B]'
                            }`}
                    >
                        {notification.type === 'Verified' ? <CheckCircle className="w-4 h-4" /> :
                            notification.type === 'Rejected' ? <ShieldAlert className="w-4 h-4" /> :
                                <AlertTriangle className="w-4 h-4" />}
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 p-8 space-y-4 max-w-7xl mx-auto font-sans relative h-full overflow-y-auto custom-scrollbar"
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
                                        <span className={`text-[10px] font-black px-2 py-1 rounded border ${selectedReasons.includes('Others') ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : selectedReasons.length >= 3 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/5 text-white/30'}`}>
                                            {selectedReasons.includes('Others') ? 'CUSTOM REASON ACTIVE' : `${selectedReasons.length}/3 SELECTED`}
                                        </span>
                                    </div>
                                    <p className="text-white/70 text-sm italic border-l-2 border-red-500/20 pl-3">
                                        {selectedReasons.includes('Others')
                                            ? "Please specify the custom reason for rejection below."
                                            : "Admins must select a minimum of 3 reasons to justify rejection."}
                                    </p>
                                </div>

                                <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {REJECTION_REASONS.map((reason) => (
                                        <button
                                            key={reason}
                                            disabled={selectedReasons.includes('Others') && reason !== 'Others'}
                                            onClick={() => toggleReason(reason)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium relative group ${selectedReasons.includes(reason)
                                                ? 'bg-red-500/20 border-red-500/50 text-white shadow-lg shadow-red-500/5'
                                                : (selectedReasons.includes('Others') && reason !== 'Others')
                                                    ? 'opacity-20 bg-white/5 border-white/5 text-white/50 cursor-not-allowed'
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

                                <AnimatePresence>
                                    {selectedReasons.includes('Others') && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <textarea
                                                value={otherReason}
                                                onChange={(e) => setOtherReason(e.target.value)}
                                                placeholder="Describe the rejection reason..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 min-h-[100px] transition-all"
                                                autoFocus
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex gap-3 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => {
                                            setShowRejectReasons(false);
                                            setSelectedReasons([]);
                                            setOtherReason("");
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 font-bold transition-all text-xs uppercase"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        disabled={
                                            isUpdating ||
                                            (!selectedReasons.includes('Others') && selectedReasons.length < 3) ||
                                            (selectedReasons.includes('Others') && !otherReason.trim())
                                        }
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
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${(localStatus === 'Verified' || localStatus === 'Approved') ? 'bg-[#06D6A0]/10 text-[#06D6A0] border-[#06D6A0]/20' :
                                    localStatus === 'Rejected' ? 'bg-[#EF233C]/10 text-[#EF233C] border-[#EF233C]/20' :
                                        localStatus === 'Flagged' ? 'bg-[#FFBE0B]/10 text-[#FFBE0B] border-[#FFBE0B]/20' :
                                            'bg-[#FFBE0B]/10 text-[#FFBE0B] border-[#FFBE0B]/20'
                                    }`}>
                                    {localStatus === 'Verified' ? 'Approved' : localStatus}
                                </span>
                            </div>

                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
                        <div className="px-5 py-3 flex flex-col items-end gap-1.5 min-w-[160px]">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-cyber-dark-accent" />
                                <span className="text-[15px] font-mono font-bold text-cyber-dark-accent uppercase tracking-wider">
                                    {report.userId || 'Anonymous'}
                                </span>
                            </div>
                            <div className="h-px w-full bg-white/5" />
                            <div className="flex items-center gap-3 w-full justify-between">
                                <span className="text-[9px] text-white/60 uppercase font-black tracking-widest whitespace-nowrap">Trust Score</span>
                                <span className={`text-lg font-black leading-none ${report.trustScore >= 80 ? 'text-cyber-dark-green' : report.trustScore >= 50 ? 'text-cyber-dark-amber' : 'text-cyber-dark-red'}`}>
                                    {report.trustScore}<span className="text-[9px] opacity-30 ml-0.5">%</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Media Section */}
                        <section className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-2 text-cyber-dark-accent">
                                <ImageIcon className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Visual Evidence</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {imageUrl ? (
                                    <div
                                        className="aspect-square bg-black/40 rounded-2xl border border-white/5 overflow-hidden group relative cursor-zoom-in"
                                        onClick={() => setPreviewImage(imageUrl)}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt="Evidence"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/800?text=Image+Load+Failed'; }}
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onVerifyPhoto(report); }}
                                            className="absolute top-4 left-4 px-3 py-1.5 bg-cyber-dark-accent hover:bg-cyber-dark-accent/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-white shadow-lg transition-all z-10"
                                        >
                                            SEND FOR VERIFICATION
                                        </button>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="w-8 h-8 text-white/50" />
                                        </div>
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
                        <section className="glass-card p-6 space-y-4">
                            <div className="flex items-center gap-2 text-cyber-dark-accent">
                                <User className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">User Description</h3>
                            </div>
                            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                <p className="text-white/80 leading-relaxed text-sm">
                                    {report.description || "No description provided by user."}
                                </p>
                            </div>
                        </section>

                        {/* Location Data Section */}
                        <section className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-2 text-blue-400">
                                <MapPin className="w-5 h-5" />
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white/70">Geospatial Intelligence</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    {hasCoordinates ? (
                                        <div className="w-full h-[450px] rounded-xl border border-white/10 overflow-hidden bg-white/5">
                                            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
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
                                        <p className="text-[10px] text-white/60 uppercase font-bold">Physical Address</p>
                                        <p className="text-xs text-white/70 leading-relaxed">
                                            {report.location || "No address data attached."}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] px-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-3 h-3 text-white/20" />
                                            <span className="text-white/70 uppercase font-bold">Coordinates</span>
                                        </div>
                                        <span className="font-mono text-white/70">
                                            {hasCoordinates ? `${mapLat}, ${mapLng}` : 'N/A'}
                                        </span>
                                    </div>
                                    {/* Zone Legend */}
                                    <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-3">
                                        <p className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Zone Indicators</p>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full border-2 border-dashed border-[#EF233C] bg-[#EF233C]/20 shrink-0" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-[#EF233C]">Red Zone</p>
                                                    <p className="text-[9px] text-white/70">3+ reports within 2km</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full border-2 border-dashed border-[#FFBE0B] bg-[#FFBE0B]/20 shrink-0" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-[#FFBE0B]">Watch Zone</p>
                                                    <p className="text-[9px] text-white/70">2 reports within 2km</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full border-2 border-[#3A86FF] bg-[#3A86FF]/20 shrink-0" />
                                                <div>
                                                    <p className="text-[11px] font-bold text-[#3A86FF]">Single Report</p>
                                                    <p className="text-[9px] text-white/70">No zone — marker only</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Intelligence & Actions */}
                    <div className="space-y-4">
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
                                            <p className="text-[10px] text-white/50 uppercase font-bold">{chat.label}</p>
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
                                    <span className="text-[10px] text-white/50 uppercase font-bold">In-Event</span>
                                    <span className="font-mono text-xs text-white/90">{report.incidentDate || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                    <span className="text-[10px] text-white/50 uppercase font-bold">Sync Time</span>
                                    <span className="font-mono text-xs text-white/90">{report.incidentTime || 'N/A'}</span>
                                </div>

                            </div>
                        </section>

                        {/* Action Hub */}
                        <section className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    disabled={isUpdating || localStatus === 'Verified' || localStatus === 'Approved'}
                                    onClick={() => handleStatusUpdate('Verified')}
                                    className={`flex items-center justify-center gap-2 flex-1 font-black py-4 rounded-2xl transition-all shadow-xl uppercase text-xs tracking-widest ${(localStatus === 'Verified' || localStatus === 'Approved')
                                        ? 'bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/20 cursor-default'
                                        : 'bg-[#06D6A0] hover:bg-[#06D6A0]/90 text-[#0D1B2A] shadow-[#06D6A0]/10'
                                        }`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {(localStatus === 'Verified' || localStatus === 'Approved') ? 'Approved' : 'Approve'}
                                </button>
                                <button
                                    disabled={isUpdating || localStatus === 'Rejected'}
                                    onClick={() => setShowRejectReasons(true)}
                                    className={`flex items-center justify-center gap-2 flex-1 font-black py-4 rounded-2xl transition-all shadow-xl uppercase text-xs tracking-widest ${localStatus === 'Rejected'
                                        ? 'bg-[#EF233C]/20 text-[#EF233C] border border-[#EF233C]/20 cursor-default'
                                        : 'bg-[#EF233C] hover:bg-[#EF233C]/90 text-white shadow-[#EF233C]/10'
                                        }`}
                                >
                                    <Trash2 className="w-5 h-5" />
                                    {localStatus === 'Rejected' ? 'Rejected' : 'Reject'}
                                </button>
                            </div>
                            <button
                                disabled={isUpdating || localStatus === 'Flagged'}
                                onClick={() => handleStatusUpdate('Flagged')}
                                className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all border uppercase text-xs tracking-widest ${localStatus === 'Flagged'
                                    ? 'bg-[#FFBE0B]/10 text-[#FFBE0B] border-[#FFBE0B]/20 cursor-default'
                                    : 'bg-white/5 hover:bg-white/10 text-white border-white/5'
                                    }`}
                            >
                                <AlertTriangle className={`w-5 h-5 ${localStatus === 'Flagged' ? 'text-[#FFBE0B]' : 'text-[#FFBE0B]'}`} />
                                {localStatus === 'Flagged' ? 'Flagged' : 'Flag Incident'}
                            </button>
                        </section>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default ReportDetailsPage;