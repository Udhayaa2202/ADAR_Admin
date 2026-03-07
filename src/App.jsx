import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportDetailsPage from './pages/ReportDetailsPage';
import CitizenReports from './pages/CitizenReports';
import PhotoVerificationPage from './pages/PhotoVerificationPage';
import SettingsPage from './pages/SettingsPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [viewedReport, setViewedReport] = useState(null);
    const [verifyingReport, setVerifyingReport] = useState(null);
    const [verifyingResults, setVerifyingResults] = useState(null);

    const handleViewReport = (report) => {
        setViewedReport(report);
    };

    const handleVerifyReport = (report) => {
        setVerifyingResults(null); // Reset results for a fresh scan
        setVerifyingReport(report);
        setViewedReport(null);
        setActiveTab('photo-verification');
    };

    const handleBackToDashboard = () => {
        setViewedReport(null);
    };

    // Automatically clear verification state when navigating away
    React.useEffect(() => {
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

    return (
        <div className="flex min-h-screen bg-cyber-dark text-white selection:bg-cyber-dark-accent/30">
            {!viewedReport && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

            <main className="flex-1 overflow-hidden h-screen">
                {viewedReport ? (
                    <ReportDetailsPage
                        report={viewedReport}
                        onBack={handleBackToDashboard}
                        onVerifyPhoto={handleVerifyReport}
                        onRefresh={() => {
                            // This will be handled by the Dashboard's own reload logic
                            // but we can pass a global state if needed.
                        }}
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
            <ProtectedRoute>
                <AppContent />
            </ProtectedRoute>
        </AuthProvider>
    );
}

export default App;
