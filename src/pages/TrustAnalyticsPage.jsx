import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustAnalyticsPage = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-cyber-dark text-white p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 text-center max-w-md"
            >
                <div className="p-6 rounded-3xl bg-cyber-dark-accent/10 border border-cyber-dark-accent/20 shadow-[0_0_50px_rgba(58,134,255,0.1)]">
                    <ShieldCheck className="w-16 h-16 text-cyber-dark-accent animate-pulse" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase tracking-tighter bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                        Trust Analytics
                    </h2>
                    <p className="text-sm text-white/40 font-medium tracking-widest uppercase italic">
                        Module contents have been removed per request.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-cyber-dark-accent/60 uppercase tracking-[0.3em] mt-4">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    System Awaiting Configuration
                </div>
            </motion.div>
        </div>
    );
};

export default TrustAnalyticsPage;
