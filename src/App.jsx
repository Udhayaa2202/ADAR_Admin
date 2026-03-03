import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReportDetailsPage from './pages/ReportDetailsPage';
import CitizenReports from './pages/CitizenReports';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [viewedReport, setViewedReport] = useState(null);

    const handleViewReport = (report) => {
        setViewedReport(report);
    };

    const handleBackToDashboard = () => {
        setViewedReport(null);
    };

    return (
        <div className="flex min-h-screen bg-cyber-dark text-white selection:bg-cyber-dark-accent/30">
            {!viewedReport && <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />}

            <main className="flex-1 overflow-hidden h-screen">
                {viewedReport ? (
                    <ReportDetailsPage
                        report={viewedReport}
                        onBack={handleBackToDashboard}
                        onRefresh={() => {
                            // This will be handled by the Dashboard's own reload logic
                            // but we can pass a dummy or trigger a global state if needed.
                        }}
                    />
                ) : (
                    <>
                        {activeTab === 'dashboard' && <Dashboard onViewReport={handleViewReport} />}
                        {activeTab === 'citizen-reports' && <CitizenReports onViewReport={handleViewReport} />}
                        {activeTab !== 'dashboard' && activeTab !== 'citizen-reports' && (
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

export default App;
