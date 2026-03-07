import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LucideShieldCheck, LucideShieldAlert, LucideMail, LucideLock, LucideArrowRight, LucideLoader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            console.error(err);
            setError(err.message.includes('auth/invalid-credential')
                ? 'Invalid email or password'
                : 'Failed to sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyber-dark-accent rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyber-dark-accent/30 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-cyber-dark-accent/10 border border-cyber-dark-accent/20 rounded-2xl mb-4">
                        <LucideShieldCheck className="w-10 h-10 text-cyber-dark-accent" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">ADAR ADMIN</h1>
                    <p className="text-white/40 text-sm font-medium tracking-widest uppercase mt-1">Authorized Personnel Only</p>
                </div>

                <div className="glass-card p-8 bg-white/[0.02] border-white/5 relative">
                    {/* Decorative line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-dark-accent/50 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm"
                                >
                                    <LucideShieldAlert className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <LucideMail className="w-3 h-3" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@adar.center"
                                    className="w-full bg-cyber-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:border-cyber-dark-accent/50 transition-colors"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <LucideLock className="w-3 h-3" /> Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-cyber-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/10 focus:outline-none focus:border-cyber-dark-accent/50 transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="group relative w-full bg-cyber-dark-accent text-cyber-dark font-black uppercase tracking-tighter py-4 rounded-xl overflow-hidden active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <>
                                        <LucideLoader2 className="w-5 h-5 animate-spin" />
                                        <span>Securing Link...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Initialize Access</span>
                                        <LucideArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </div>

                            {/* Shiny effect */}
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
                    System Build v2.4.0 • Secured by ADAR Core
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
