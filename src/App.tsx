import React, { useState, useEffect } from 'react';
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
import { Loader2, GraduationCap } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, authLoading, needsRegistration, logout } = useApp();

  const [activeTab, setActiveTab] = useState<string>('student_dashboard');

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<ServiceRecord | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [recordToReview, setRecordToReview] = useState<ServiceRecord | null>(null);

  // Sync activeTab when user role changes
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'student') {
      if (
        !['student_dashboard', 'student_records', 'student_certificate', 'architecture'].includes(
          activeTab
        )
      ) {
        setActiveTab('student_dashboard');
      }
    } else {
      if (['student_dashboard', 'student_records', 'student_certificate'].includes(activeTab)) {
        setActiveTab('coordinator_dashboard');
      }
    }
  }, [currentUser?.role, currentUser?.id]);

  const handleOpenNewRecord = () => {
    setRecordToEdit(null);
    setIsRecordModalOpen(true);
  };

  const handleReviewRecord = (record: ServiceRecord) => {
    setRecordToReview(record);
    setIsReviewModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-xl">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-300 font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Cargando plataforma institucional...</span>
        </div>
      </div>
    );
  }

  if (!currentUser || needsRegistration) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewRecord={handleOpenNewRecord}
        onLogout={logout}
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
          <StudentCertificateView onBack={() => setActiveTab('student_dashboard')} />
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
            Versión 2.0 · Base de Datos PostgreSQL & Autenticación Segura
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
