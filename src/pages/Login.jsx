import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LucideShieldCheck, LucideShieldAlert, LucideMail, LucideLock, LucideArrowRight, LucideLoader2, LucideEye, LucideEyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CyberGrid from '../components/CyberGrid';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/', { replace: true });
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
            <CyberGrid />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg relative z-10"
            >
                <div className="mb-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                        animate={{ 
                            opacity: 1, 
                            scale: 1.1,
                            rotate: 0,
                        }}
                        transition={{ 
                            duration: 1,
                            ease: "backOut",
                        }}
                        className="inline-flex items-center justify-center p-5 bg-cyber-dark-accent/10 border border-cyber-dark-accent/20 rounded-2xl mb-6 relative group"
                    >
                        {/* Glow effect - Synchronized with border fade */}
                        <motion.div 
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                            className="absolute inset-0 bg-cyber-dark-accent/40 blur-2xl rounded-full" 
                        />
                        
                        <LucideShieldCheck className="w-12 h-12 text-cyber-dark-accent relative z-10" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic mb-2">ADAR ADMIN</h1>
                    <p className="text-white/40 text-sm font-bold tracking-[0.3em] uppercase">Authorized Personnel Only</p>
                </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg relative p-[2px] rounded-[2rem] overflow-hidden group"
            >
            
                <motion.div 
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                    className="absolute inset-0 animate-border-flow" 
                />
                
                <div className="glass-card p-10 bg-cyber-dark/95 backdrop-blur-2xl border border-white/10 relative z-10 rounded-[1.9rem]">
                
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-dark-accent/50 to-transparent" />

                    <form onSubmit={handleSubmit} className="space-y-7">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-medium"
                                >
                                    <LucideShieldAlert className="w-4 h-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <LucideMail className="w-3.5 h-3.5" /> Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@adar.com"
                                    className="w-full bg-cyber-dark/50 border border-white/10 rounded-2xl px-5 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyber-dark-accent/50 transition-all focus:ring-1 focus:ring-cyber-dark-accent/20"
                                />
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <LucideLock className="w-3.5 h-3.5" /> Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="********"
                                        className="w-full bg-cyber-dark/50 border border-white/10 rounded-2xl px-5 py-3.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-cyber-dark-accent/50 transition-all focus:ring-1 focus:ring-cyber-dark-accent/20 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
                                    >
                                        {showPassword ? (
                                            <LucideEyeOff className="w-5 h-5" />
                                        ) : (
                                            <LucideEye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="group relative w-full bg-cyber-dark-accent text-cyber-dark font-black uppercase tracking-tighter py-4 rounded-2xl overflow-hidden active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-2 text-lg"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <LucideLoader2 className="w-5 h-5 animate-spin" />
                                        <span>Secure Login...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <LucideArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </div>

                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </button>
                    </form>
                </div>
            </motion.div>

                <div className="mt-8 text-center text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] relative z-10">
                    System Build v2.4.0 • Secured by ADAR<br/>&copy;2026 ADAR
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
