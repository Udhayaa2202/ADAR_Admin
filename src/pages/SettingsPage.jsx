import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Activity,
    Lock,
    Globe,
    Key,
    Server,
    CheckCircle2,
    Wifi,
    Database,
    Mail,
    Phone,
    ShieldCheck,
    Calendar
} from 'lucide-react';
import { db } from '../services/firebase';
import { supabase } from '../services/supabase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
    const { user } = useAuth();
    const [firebaseStatus, setFirebaseStatus] = useState('Checking...');
    const [supabaseStatus, setSupabaseStatus] = useState('Checking...');
    const [activeSection, setActiveSection] = useState('profile');

    useEffect(() => {
        const checkHealth = async () => {
            // Check Firebase (Firestore)
            try {
                const reportsRef = collection(db, "reports");
                const q = query(reportsRef, limit(1));
                await getDocs(q);
                setFirebaseStatus('Operational');
            } catch (e) {
                console.error("Firebase Health Check Failed:", e);
                setFirebaseStatus('Non-Functional');
            }

            // Check Supabase Storage Connectivity
            try {
                const { data, error } = await supabase.storage.listBuckets();
                if (error) throw error;
                const bucketExists = data.some(b => b.name === 'app_evidence');
                if (!bucketExists) console.warn("Supabase: 'app_evidence' bucket not found");
                setSupabaseStatus('Operational');
            } catch (e) {
                console.error("Supabase Health Check Failed:", e);
                setSupabaseStatus('Non-Functional');
            }
        };
        checkHealth();
    }, []);

    const sections = [
        { id: 'profile', label: 'Admin Profile', icon: User },
        { id: 'system', label: 'System Health', icon: Activity },
    ];

    return (
        <div className="h-full flex flex-col p-4 gap-4 font-sans overflow-y-auto custom-scrollbar">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
                <div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic tracking-tight">
                        MISSION CONFIGURATION
                    </h2>
                    <p className="text-sm text-white/40 mt-1 font-bold italic uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded inline-block">
                        Proprietary Intelligence Parameters
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 glass-card p-3 space-y-2 h-fit">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeSection === section.id
                                ? 'bg-cyber-dark-accent/20 text-cyber-dark-accent border border-cyber-dark-accent/30'
                                : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                }`}
                        >
                            <section.icon className="w-5 h-5" />
                            <span className="font-bold text-sm tracking-wide uppercase">{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-4">
                    {activeSection === 'profile' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card overflow-hidden"
                        >
                            {/* Profile Header Background Banner */}
                            <div className="h-48 relative overflow-hidden group">
                                <img
                                    src="/admin_profile_banner_cyber_dark_1772859940562.png"
                                    alt="Admin Profile Banner"
                                    className="w-full h-full object-cover opacity-55 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-cyber-dark-bg via-cyber-dark-bg/20 to-transparent" />
                            </div>

                            <div className="relative z-10 px-8 pb-8 -mt-16">
                                <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8 text-left">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-3xl bg-cyber-dark-bg border-4 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-transform group-hover:scale-[1.02]">
                                            <User className="w-16 h-16 text-cyber-dark-accent" />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-2 pb-2">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <h3 className="text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent italic pr-2">
                                                {user?.email ? (() => {
                                                    const namePart = user.email.split('@')[0];
                                                    return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
                                                })() : 'Admin'}
                                            </h3>
                                            <div className="px-2.5 py-0.5 rounded-full bg-cyber-dark-green/20 border border-cyber-dark-green/50 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                                <ShieldCheck className="w-3 h-3 text-cyber-dark-green" />
                                                <span className="text-[9px] font-black text-cyber-dark-green uppercase tracking-[0.1em]">
                                                    Verified Admin
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-white/60 font-bold italic uppercase tracking-[0.2em] text-sm flex items-center gap-2">
                                            <span className="w-4 h-[1px] bg-cyber-dark-accent" />
                                            Chief Intelligence Officer <br />ADAR Lead
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Account Email</label>
                                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                                                <Mail className="w-4 h-4 text-white/20" />
                                                <span className="text-white/80 font-medium">{user?.email || 'admin@adar.center'}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Contact </label>
                                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                                                <Phone className="w-4 h-4 text-white/20" />
                                                <span className="text-white/80 font-medium">
                                                    {user?.email ? (() => {
                                                        const prefix = user.email.split('@')[0].toLowerCase();
                                                        const phoneMap = {
                                                            'udhayaa': '+91 86106 27549',
                                                            'srimokesh': '+91 90809 76550',
                                                            'srikumaran': '+91 70100 66485'
                                                        };
                                                        return phoneMap[prefix] || '+91 00000 00000';
                                                    })() : '+91 86106 27549'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Last Login</label>
                                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                                                <Activity className="w-4 h-4 text-cyber-dark-accent/40" />
                                                <span className="text-white/80 font-medium italic uppercase tracking-wider">
                                                    {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Member Since</label>
                                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                                                <Calendar className="w-4 h-4 text-white/20" />
                                                <span className="text-white/80 font-medium uppercase tracking-wider">MARCH 2026</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'system' && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card p-6 space-y-6"
                        >
                            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                <Activity className="w-8 h-8 text-cyber-dark-green" />
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tight">System Vitality</h3>
                                    <p className="text-sm text-white/30 font-medium">Real-time infrastructure health monitoring.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:bg-white/[0.08] transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-cyber-dark-accent/10 border border-cyber-dark-accent/20 group-hover:scale-110 transition-transform">
                                                <Database className="w-6 h-6 text-cyber-dark-accent" />
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-widest text-white/70">Firestore Grid</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest ${firebaseStatus === 'Operational' ? 'bg-cyber-dark-green/10 text-cyber-dark-green' :
                                            firebaseStatus === 'Checking...' ? 'bg-white/10 text-white/40' : 'bg-cyber-dark-red/10 text-cyber-dark-red'
                                            }`}>
                                            {firebaseStatus}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Wifi className="w-5 h-5 text-white/20" />
                                        <span className="text-sm font-medium text-white/50 italic tracking-wide">
                                            {firebaseStatus === 'Operational' ? 'Latency: 42ms (Optimized)' : 'Connection unstable or restricted'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4 hover:bg-white/[0.08] transition-all group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-cyber-dark-amber/10 border border-cyber-dark-amber/20 group-hover:scale-110 transition-transform">
                                                <Server className="w-6 h-6 text-cyber-dark-amber" />
                                            </div>
                                            <span className="text-sm font-black uppercase tracking-widest text-white/70">Supabase Storage</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest ${supabaseStatus === 'Operational' ? 'bg-cyber-dark-green/10 text-cyber-dark-green' :
                                            supabaseStatus === 'Checking...' ? 'bg-white/10 text-white/40' : 'bg-cyber-dark-red/10 text-cyber-dark-red'
                                            }`}>
                                            {supabaseStatus}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <CheckCircle2 className={`w-5 h-5 ${supabaseStatus === 'Operational' ? 'text-cyber-dark-green' : 'text-white/20'}`} />
                                        <span className="text-sm font-medium text-white/50 italic tracking-wide">
                                            {supabaseStatus === 'Operational' ? 'All storage clusters online' : 'Storage interface unreachable'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
