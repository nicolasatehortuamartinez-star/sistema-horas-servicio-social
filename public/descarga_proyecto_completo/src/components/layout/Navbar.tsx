import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RoleBadge } from '../common/Badge';
import { 
  GraduationCap, 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  UserCog, 
  FileSpreadsheet, 
  Settings, 
  History, 
  FileCode, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X, 
  UserCheck, 
  Sparkles,
  Award
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewRecord: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewRecord,
  onLogout,
}) => {
  const { currentUser, profiles, switchUserById, pendingRecordsCount, settings, currentStudent, getStudentProgress } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isStudent = currentUser.role === 'student';
  const isAdmin = currentUser.role === 'admin';
  const isCoordinator = currentUser.role === 'coordinator' || isAdmin;
  const isSupervisor = currentUser.role === 'supervisor';

  const studentProgress = currentStudent ? getStudentProgress(currentStudent.id) : null;

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top institution bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-emerald-400">Plataforma Institucional:</span>
            <span className="truncate">{settings.institution_name}</span>
            <span className="hidden md:inline-block bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
              Año Lectivo {settings.academic_year}
            </span>
          </div>

          {/* Quick Demo Switcher */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-slate-400 text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Modo Demo:
            </span>
            <select
              value={currentUser.id}
              onChange={(e) => switchUserById(e.target.value)}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-md px-2 py-1 border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-400 cursor-pointer font-medium"
              title="Cambiar rápidamente entre usuarios ficticios para probar diferentes roles"
            >
              <optgroup label="Personal Institucional">
                {profiles
                  .filter((p) => p.role !== 'student')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.role === 'admin' ? '🛡️ Admin' : p.role === 'coordinator' ? '📋 Coordinador' : '🧑‍🏫 Supervisor'} - {p.full_name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Estudiantes con Diferentes Avances">
                {profiles
                  .filter((p) => p.role === 'student')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      🎓 Estudiante - {p.full_name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => handleTabClick(isStudent ? 'student_dashboard' : 'coordinator_dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg block leading-tight">
                  Servicio Social
                </span>
                <span className="text-[11px] font-medium text-slate-500 block">
                  Control y Registro Digital
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {isStudent ? (
              <>
                <button
                  type="button"
                  onClick={() => handleTabClick('student_dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'student_dashboard'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Mi Resumen
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('student_records')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'student_records'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Mis Jornadas
                </button>
                {studentProgress?.isCompleted && (
                  <button
                    type="button"
                    onClick={() => handleTabClick('student_certificate')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'student_certificate'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    <Award className="w-4 h-4 text-amber-500" />
                    Mi Constancia
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleTabClick('coordinator_dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'coordinator_dashboard'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Panel General
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('review_records')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    activeTab === 'review_records'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Revisión
                  {pendingRecordsCount > 0 && (
                    <span className="ml-1 bg-amber-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                      {pendingRecordsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('students')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'students'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Estudiantes
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleTabClick('users')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'users'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <UserCog className="w-4 h-4" />
                    Usuarios
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleTabClick('reports')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'reports'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Reportes
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('settings')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Configuración
                </button>
                <button
                  type="button"
                  onClick={() => handleTabClick('audit')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'audit'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  Auditoría
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleTabClick('architecture')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'architecture'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/70'
              }`}
              title="Especificación técnica, trazabilidad RF/RNF y guía Supabase"
            >
              <FileCode className="w-4 h-4 text-indigo-600" />
              Arquitectura
            </button>
          </nav>

          {/* Action Button & User Badge */}
          <div className="flex items-center gap-3">
            {(isStudent || isCoordinator) && (
              <button
                type="button"
                onClick={onOpenNewRecord}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs shadow-emerald-700/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar Jornada</span>
                <span className="sm:hidden">Registrar</span>
              </button>
            )}

            {/* Profile pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase border border-slate-300">
                  {currentUser.full_name.slice(0, 2)}
                </div>
                <div className="hidden xl:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <RoleBadge role={currentUser.role} size="sm" />
                  </div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{currentUser.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1.5">
                      <RoleBadge role={currentUser.role} />
                    </div>
                  </div>

                  {currentStudent && (
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs">
                      <span className="text-slate-500">Código:</span>{' '}
                      <span className="font-semibold text-slate-800">{currentStudent.student_code}</span>
                      <div className="text-slate-500 mt-0.5">
                        Grado {currentStudent.grade} ({currentStudent.group_name})
                      </div>
                    </div>
                  )}

                  <div className="px-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión / Salir
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
          {isStudent ? (
            <>
              <button
                type="button"
                onClick={() => handleTabClick('student_dashboard')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'student_dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Mi Resumen
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('student_records')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'student_records' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Mis Jornadas
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleTabClick('coordinator_dashboard')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'coordinator_dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Panel General
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('review_records')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'review_records' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Revisión de Horas
                </span>
                {pendingRecordsCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingRecordsCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('students')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'students' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Estudiantes
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleTabClick('users')}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                    activeTab === 'users' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  Usuarios
                </button>
              )}
              <button
                type="button"
                onClick={() => handleTabClick('reports')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'reports' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Reportes
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('settings')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'settings' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                Configuración
              </button>
              <button
                type="button"
                onClick={() => handleTabClick('audit')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
                  activeTab === 'audit' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'
                }`}
              >
                <History className="w-4 h-4" />
                Auditoría
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => handleTabClick('architecture')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'architecture' ? 'bg-indigo-50 text-indigo-700' : 'text-indigo-600'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Arquitectura y Guía Supabase
          </button>
        </div>
      )}
    </header>
  );
};
