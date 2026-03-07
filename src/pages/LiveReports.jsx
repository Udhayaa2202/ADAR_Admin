import React from 'react';
import { Construction } from 'lucide-react';

const LiveReports = () => {
    return (
        <div className="flex-1 flex items-center justify-center h-full min-h-[600px]">
            <div className="text-center p-12 glass-card border-none bg-white/[0.02] flex flex-col items-center">
                <Construction className="w-16 h-16 text-cyber-dark-accent/20 mb-6" />
                <h2 className="text-4xl font-black mb-4 tracking-tighter opacity-20 uppercase italic font-sans">
                    Live Feed Restricted
                </h2>
                <p className="text-white/70 font-medium tracking-widest uppercase text-xs font-sans">
                    Media access redirected to Dashboard Details view.
                </p>
            </div>
        </div>
    );
};

export default LiveReports;
