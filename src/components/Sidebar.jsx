import React from 'react';
import {
    LayoutDashboard,
    Users,
    AlertTriangle,
    Settings,
    LogOut,
    ShieldCheck,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: FileText, label: 'Citizen Reports', id: 'citizen-reports' },
    { icon: ImageIcon, label: 'Photo Verification', id: 'photo-verification' },
    { icon: Settings, label: 'Settings', id: 'settings' },
];

const Sidebar = ({ activeTab, setActiveTab }) => {
    const { logout } = useAuth();

    const handleSignOut = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <aside className="w-72 h-screen glass-card rounded-none border-y-0 border-l-0 border-r-white/10 flex flex-col p-6 sticky top-0">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="p-2 bg-cyber-dark-accent/20 rounded-lg">
                    <ShieldCheck className="w-8 h-8 text-cyber-dark-accent" />
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    ADAR ADMIN
                </h1>
            </div>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id
                            ? 'bg-cyber-dark-accent text-white shadow-lg shadow-cyber-dark-accent/25'
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'
                            }`} />
                        <span className="font-medium">{item.label}</span>
                        {activeTab === item.id && (
                            <motion.div
                                layoutId="active-indicator"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors group"
                >
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
