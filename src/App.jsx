import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportDetailsPage from './pages/ReportDetailsPage';
import CitizenReports from './pages/CitizenReports';
import PhotoVerificationPage from './pages/PhotoVerificationPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { fetchAllReports } from './services/dataService';

function AppContent() {
    const [activeTab, setActiveTab] = useState(() => {
        return sessionStorage.getItem('activeTab') || 'dashboard';
    });
    const [viewedReport, setViewedReport] = useState(null);
    const [verifyingReport, setVerifyingReport] = useState(null);
    const [verifyingResults, setVerifyingResults] = useState(null);
    const isRestoringRef = React.useRef(true);

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
        if (activeTab !== 'photo-verification') {
            setVerifyingReport(null);
            setVerifyingResults(null);
        }
    }, [activeTab]);

    React.useEffect(() => {
        const handleTabChange = (e) => {
            setActiveTab(e.detail);
            setViewedReport(null);
        };
        window.addEventListener('changeTab', handleTabChange);
        return () => window.removeEventListener('changeTab', handleTabChange);
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
        <div className="flex min-h-screen bg-cyber-dark text-white selection:bg-cyber-dark-accent/30">
            {!viewedReport && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

            <main className="flex-1 overflow-hidden h-screen">
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
