import React from 'react';
import { Users, ShieldCheck, ShieldAlert, Award } from 'lucide-react';

const TopReporters = ({ reports }) => {
    const processTopReporters = () => {
        const userStats = {};

        reports.forEach(report => {
            if (!report.userId) return;
            if (!userStats[report.userId]) {
                userStats[report.userId] = {
                    userId: report.userId,
                    totalReports: 0,
                    totalTrust: 0,
                    approvedCount: 0,
                    rejectedCount: 0
                };
            }
            userStats[report.userId].totalReports++;
            userStats[report.userId].totalTrust += (report.trustScore || 0);
            if (report.status === 'Verified' || report.status === 'Approved') {
                userStats[report.userId].approvedCount++;
            } else if (report.status === 'Rejected') {
                userStats[report.userId].rejectedCount++;
            }
        });

        return Object.values(userStats)
            .map(user => ({
                ...user,
                avgTrust: (user.totalTrust / user.totalReports).toFixed(1)
            }))
            .sort((a, b) => b.totalReports - a.totalReports || b.avgTrust - a.avgTrust)
            .slice(0, 5); // Top 5
    };

    const data = processTopReporters();

    return (
        <div className="glass-card p-5 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyber-dark-accent" />
                    <h3 className="font-bold text-base">Top Reporters</h3>
                </div>
                <Award className="w-4 h-4 text-[#FFBE0B]" />
            </div>
            <div className="flex flex-col gap-3">
                {data.map((user, index) => (
                    <div key={user.userId} className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${index === 0 ? 'bg-cyber-dark-amber text-[#0D1B2A]' : 'bg-white/10 text-white/40'}`}>
                                    #{index + 1}
                                </span>
                                <span className="text-xs font-mono font-bold text-cyber-dark-accent truncate">{user.userId}</span>
                            </div>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{user.totalReports} Reports</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                <div
                                    className={`h-full ${user.avgTrust >= 80 ? 'bg-cyber-dark-green' : user.avgTrust >= 50 ? 'bg-cyber-dark-amber' : 'bg-cyber-dark-red'}`}
                                    style={{ width: `${user.avgTrust}%` }}
                                />
                            </div>
                            <div className="flex items-center gap-1 min-w-[40px] justify-end">
                                <span className={`text-xs font-bold ${user.avgTrust >= 80 ? 'text-cyber-dark-green' : user.avgTrust >= 50 ? 'text-cyber-dark-amber' : 'text-cyber-dark-red'}`}>
                                    {user.avgTrust}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-tighter text-white/30">
                            <div className="flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5 text-cyber-dark-green" />
                                <span>{user.approvedCount} Appr</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <ShieldAlert className="w-2.5 h-2.5 text-cyber-dark-red" />
                                <span>{user.rejectedCount} Rej</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopReporters;
