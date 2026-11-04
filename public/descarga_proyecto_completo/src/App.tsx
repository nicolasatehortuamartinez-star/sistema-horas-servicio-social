import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './pages/LoginView';
import { StudentDashboard } from './pages/StudentDashboard';
import { CoordinatorDashboard } from './pages/CoordinatorDashboard';
import { ReviewRecordModal } from './pages/ReviewRecordModal';
import { RecordFormModal } from './pages/RecordFormModal';
import { StudentsManagement } from './pages/StudentsManagement';
import { UsersManagement } from './pages/UsersManagement';
import { ReportsView } from './pages/ReportsView';
import { SettingsView } from './pages/SettingsView';
import { AuditLogView } from './pages/AuditLogView';
import { SystemArchitectureView } from './pages/SystemArchitectureView';
import { StudentCertificateView } from './pages/StudentCertificateView';
import { ServiceRecord } from './types';

const MainApp: React.FC = () => {
  const { currentUser, currentStudent } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Tab management
  const [activeTab, setActiveTab] = useState<string>(() => {
    return currentUser.role === 'student' ? 'student_dashboard' : 'coordinator_dashboard';
  });

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<ServiceRecord | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [recordToReview, setRecordToReview] = useState<ServiceRecord | null>(null);

  // When switching role in Navbar, sync activeTab smoothly
  React.useEffect(() => {
    if (currentUser.role === 'student') {
      if (!['student_dashboard', 'student_records', 'student_certificate', 'architecture'].includes(activeTab)) {
        setActiveTab('student_dashboard');
      }
    } else {
      if (['student_dashboard', 'student_records', 'student_certificate'].includes(activeTab)) {
        setActiveTab('coordinator_dashboard');
      }
    }
  }, [currentUser.role]);

  const handleOpenNewRecord = () => {
    setRecordToEdit(null);
    setIsRecordModalOpen(true);
  };

  const handleReviewRecord = (record: ServiceRecord) => {
    setRecordToReview(record);
    setIsReviewModalOpen(true);
  };

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewRecord={handleOpenNewRecord}
        onLogout={() => setIsLoggedIn(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Student Views */}
        {activeTab === 'student_dashboard' && (
          <StudentDashboard
            onOpenNewRecord={handleOpenNewRecord}
            onViewRecordDetail={handleReviewRecord}
          />
        )}

        {activeTab === 'student_records' && (
          <StudentDashboard
            onOpenNewRecord={handleOpenNewRecord}
            onViewRecordDetail={handleReviewRecord}
          />
        )}

        {activeTab === 'student_certificate' && (
          <StudentCertificateView
            onBack={() => setActiveTab('student_dashboard')}
          />
        )}

        {/* Coordinator / Admin Views */}
        {activeTab === 'coordinator_dashboard' && (
          <CoordinatorDashboard
            onReviewRecord={handleReviewRecord}
            onNavigateToStudents={() => setActiveTab('students')}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'review_records' && (
          <CoordinatorDashboard
            onReviewRecord={handleReviewRecord}
            onNavigateToStudents={() => setActiveTab('students')}
            onNavigateToReports={() => setActiveTab('reports')}
          />
        )}

        {activeTab === 'students' && <StudentsManagement />}

        {activeTab === 'users' && <UsersManagement />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'settings' && <SettingsView />}

        {activeTab === 'audit' && <AuditLogView />}

        {activeTab === 'architecture' && <SystemArchitectureView />}
      </main>

      {/* Global Modals */}
      <RecordFormModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        recordToEdit={recordToEdit}
      />

      <ReviewRecordModal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setRecordToReview(null);
        }}
        record={recordToReview}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Sistema Web de Gestión y Control de Horas de Servicio Social · Reemplazo Oficial de Formatos Físicos
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Versión 1.0 · Conforme a Requerimientos RF-01 al RF-16 y RNF-01 al RNF-12
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
