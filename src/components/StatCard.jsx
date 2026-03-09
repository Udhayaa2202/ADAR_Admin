import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color, trend }) => {
    const colorMap = {
        blue: 'text-cyber-dark-accent bg-cyber-dark-accent/10 border-cyber-dark-accent/20',
        amber: 'text-cyber-dark-amber bg-cyber-dark-amber/10 border-cyber-dark-amber/20',
        red: 'text-cyber-dark-red bg-cyber-dark-red/10 border-cyber-dark-red/20',
        green: 'text-cyber-dark-green bg-cyber-dark-green/10 border-cyber-dark-green/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="glass-card p-4 md:p-6 flex flex-col gap-3 md:gap-4 border-white/5 hover:border-white/10 transition-all cursor-default group"
        >
            <div className="flex justify-between items-start">
                <div className={`p-2.5 md:p-3 rounded-xl ${colorMap[color] || colorMap.blue}`}>
                    <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                {trend && (
                    <span className={`text-[10px] md:text-sm font-medium px-2 py-0.5 md:py-1 rounded-lg ${trend > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                        }`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-white/70 text-[11px] md:text-sm font-medium mb-0.5 md:mb-1 font-sans truncate" title={label}>{label}</p>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight group-hover:text-cyber-dark-accent transition-colors font-sans tabular-nums">
                    {value}
                </h3>
            </div>
        </motion.div>
    );
};

export default StatCard;
