import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ShieldCheck } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportDetailsPage from './pages/ReportDetailsPage';
import CitizenReports from './pages/CitizenReports';
import PhotoVerificationPage from './pages/PhotoVerificationPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { subscribeToReports, fetchAllReports } from './services/dataService';

function AppContent() {
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('activeTab') || 'dashboard';
    });
    const [viewedReport, setViewedReport] = useState(null);
    const [verifyingReport, setVerifyingReport] = useState(null);
    const [verifyingResults, setVerifyingResults] = useState(null);
    const [newReportsCount, setNewReportsCount] = useState(0);
    const [lastSeenReportCount, setLastSeenReportCount] = useState(() => {
        return parseInt(localStorage.getItem('lastSeenReportCount') || '0');
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isRestoringRef = React.useRef(true);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setViewedReport(null);
        setVerifyingReport(null);
        setVerifyingResults(null);
        if (window.innerWidth < 1024) setIsOpen(false);
    };

    const handleViewReport = (report) => {
        setViewedReport(report);
    };

    const handleVerifyReport = (report) => {
        setVerifyingResults(null); 
        setVerifyingReport(report);
        setViewedReport(null);
        setActiveTab('photo-verification');
    };

    const handleBackToDashboard = () => {
        setViewedReport(null);
    };

    React.useEffect(() => {
        sessionStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    React.useEffect(() => {
        const handleExternalTabChange = (e) => {
            handleTabChange(e.detail);
        };
        window.addEventListener('changeTab', handleExternalTabChange);
        return () => {
            window.removeEventListener('changeTab', handleExternalTabChange);
        };
    }, []);

    // Persist verifyingReport ID (skip on initial mount to avoid race condition)
    useEffect(() => {
        if (isRestoringRef.current) return;
        if (verifyingReport) {
            sessionStorage.setItem('verifyingReportId', verifyingReport.id);
        } else {
            sessionStorage.removeItem('verifyingReportId');
        }
    }, [verifyingReport]);

    // Persist viewedReport ID (skip on initial mount)
    useEffect(() => {
        if (isRestoringRef.current) return;
        if (viewedReport) {
            sessionStorage.setItem('viewedReportId', viewedReport.id);
        } else {
            sessionStorage.removeItem('viewedReportId');
        }
    }, [viewedReport]);

    // Restore saved report state on reload
    useEffect(() => {
        const unsubscribe = subscribeToReports((reports) => {
            const currentCount = reports.length;
            if (activeTab === 'citizen-reports') {
                setLastSeenReportCount(currentCount);
                localStorage.setItem('lastSeenReportCount', currentCount);
                setNewReportsCount(0);
            } else {
                const diff = currentCount - lastSeenReportCount;
                setNewReportsCount(diff > 0 ? diff : 0);
            }
        });

        return () => unsubscribe();
    }, [activeTab, lastSeenReportCount]);

    useEffect(() => {
        if (activeTab === 'citizen-reports') {
            setNewReportsCount(0);
        }
    }, [activeTab]);

    useEffect(() => {
        const savedVerifyId = sessionStorage.getItem('verifyingReportId');
        const savedViewedId = sessionStorage.getItem('viewedReportId');

        if (!savedVerifyId && !savedViewedId) {
            isRestoringRef.current = false;
            return;
        }

        fetchAllReports()
            .then(reports => {
                if (savedVerifyId) {
                    const found = reports.find(r => r.id === savedVerifyId);
                    if (found) setVerifyingReport(found);
                }
                if (savedViewedId) {
                    const found = reports.find(r => r.id === savedViewedId);
                    if (found) setViewedReport(found);
                }
            })
            .catch(console.error)
            .finally(() => {
                isRestoringRef.current = false;
            });
    }, []);

    return (
        <motion.div
            className="flex min-h-screen bg-cyber-dark text-white selection:bg-cyber-dark-accent/30"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <Sidebar 
                activeTab={activeTab} 
                setActiveTab={handleTabChange} 
                notificationCount={newReportsCount}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Mobile Header */}
                {!viewedReport && (
                    <header className="lg:hidden flex items-center justify-between p-4 glass-card rounded-none border-x-0 border-t-0 border-b-white/10 sticky top-0 z-30">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-cyber-dark-accent/20 rounded-md">
                                <ShieldCheck className="w-6 h-6 text-cyber-dark-accent" />
                            </div>
                            <span className="font-bold tracking-tight text-white/90">ADAR ADMIN</span>
                        </div>
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-white/70 hover:text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    </header>
                )}

                <main className="flex-1 overflow-y-auto">
                {viewedReport ? (
                    <ReportDetailsPage
                        report={viewedReport}
                        onBack={handleBackToDashboard}
                        onVerifyPhoto={handleVerifyReport}
                        onRefresh={() => {}}
                    />
                ) : (
                    <>
                        {activeTab === 'dashboard' && <Dashboard onViewReport={handleViewReport} />}
                        {activeTab === 'citizen-reports' && <CitizenReports onViewReport={handleViewReport} />}
                        {activeTab === 'photo-verification' && (
                            <PhotoVerificationPage
                                report={verifyingReport}
                                results={verifyingResults}
                                onScanComplete={setVerifyingResults}
                                onNavigate={setActiveTab}
                                onSelectReport={(r) => {
                                    setVerifyingResults(null);
                                    setVerifyingReport(r);
                                }}
                                onViewReport={handleViewReport}
                            />
                        )}
                        {activeTab === 'settings' && <SettingsPage />}
                        {activeTab !== 'dashboard' && activeTab !== 'citizen-reports' && activeTab !== 'photo-verification' && activeTab !== 'settings' && (
                            <div className="flex-1 flex items-center justify-center h-full">
                                <div className="text-center p-12 glass-card border-none bg-white/[0.02]">
                                    <h2 className="text-4xl font-black mb-4 tracking-tighter opacity-20 uppercase italic">
                                        {activeTab.replace('-', ' ')}
                                    </h2>
                                    <p className="text-white/30 font-medium tracking-widest uppercase text-xs">
                                        Module Under Construction
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
                </main>
            </div>
        </motion.div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route 
                        path="/*" 
                        element={
                            <ProtectedRoute>
                                <AppContent />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
