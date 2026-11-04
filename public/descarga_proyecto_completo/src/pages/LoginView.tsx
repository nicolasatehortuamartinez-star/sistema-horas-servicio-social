import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ShieldAlert, 
  ArrowRight, 
  UserCheck, 
  UserPlus, 
  KeyRound, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Sparkles,
  Phone,
  Info
} from 'lucide-react';
import { RoleBadge } from '../components/common/Badge';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { profiles, switchUserById, loginWithCredentials, registerStudentAccount, settings } = useApp();

  // Mode: 'login' | 'register'
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regData, setRegData] = useState({
    first_names: '',
    last_names: '',
    student_code: '',
    email: '',
    password: '',
    confirm_password: '',
    grade: '10°',
    group_name: '10A',
    phone: '',
  });
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Por favor ingrese su correo institucional.');
      return;
    }

    const result = loginWithCredentials(loginEmail, loginPassword);
    if (result.success) {
      onLoginSuccess();
    } else {
      setLoginError(result.error || 'Credenciales no encontradas en el sistema escolar.');
    }
  };

  const handleQuickLogin = (userId: string) => {
    switchUserById(userId);
    onLoginSuccess();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    // Pre-validations
    if (!regData.first_names.trim() || !regData.last_names.trim()) {
      setRegError('Ingrese sus nombres y apellidos completos tal como figuran en su matrícula.');
      return;
    }

    if (!regData.student_code.trim()) {
      setRegError('El código estudiantil es obligatorio para validar su pertenencia a la institución.');
      return;
    }

    // Only allow 9°, 10°, 11°
    const allowed = ['9°', '10°', '11°'];
    if (!allowed.includes(regData.grade)) {
      setRegError('El servicio social únicamente está autorizado y reglamentado para grados 9°, 10° y 11°.');
      return;
    }

    if (!regData.group_name.trim()) {
      setRegError('Indique su grupo asignado (ej: 9A, 10B, 11A).');
      return;
    }

    if (!regData.email.trim() || !regData.email.includes('@')) {
      setRegError('Ingrese una dirección de correo electrónico institucional válida.');
      return;
    }

    if (!regData.password || regData.password.length < 6) {
      setRegError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (regData.password !== regData.confirm_password) {
      setRegError('Las contraseñas no coinciden. Verifique ambas casillas.');
      return;
    }

    const res = registerStudentAccount({
      first_names: regData.first_names,
      last_names: regData.last_names,
      student_code: regData.student_code,
      email: regData.email,
      password: regData.password,
      grade: regData.grade,
      group_name: regData.group_name,
      phone: regData.phone,
    });

    if (res.success) {
      setRegSuccessMsg('¡Cuenta estudiantil creada exitosamente! Redirigiendo a tu panel...');
      setTimeout(() => {
        onLoginSuccess();
      }, 900);
    } else {
      setRegError(res.error || 'Ocurrió un error al procesar el registro.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Header institution banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/25 mb-3">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {settings.institution_name}
        </h2>
        <p className="mt-1 text-sm text-emerald-300 font-medium">
          Sistema Digital de Registro y Control de Horas de Servicio Social
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Periodo Académico {settings.academic_year} · Acceso y Registro Estudiantil
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 overflow-hidden">
          {/* Tabs: Iniciar Sesión vs Crear Cuenta */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setRegError('');
                setRegSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeMode === 'register'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>Crear Cuenta (Estudiantes)</span>
            </button>
          </div>

          {/* MODE 1: LOGIN */}
          {activeMode === 'login' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Ingreso a la Plataforma</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingrese con su correo institucional registrado o use el botón de "Crear cuenta" si es un estudiante nuevo.
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Correo institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="estudiante@colegio.edu.co"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Contraseña
                    </label>
                    <span className="text-[11px] text-slate-400">Mínimo 6 caracteres</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800 placeholder-slate-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    RNF-01: Protección de contraseñas con mecanismo de cifrado seguro.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveMode('register')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    ¿Eres estudiante nuevo? Crear cuenta aquí →
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Access Roles for demo */}
              <div className="pt-5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Acceso rápido de prueba
                  </span>
                  <span className="text-[10px] text-slate-400">Cambio directo de rol</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profiles.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickLogin(p.id)}
                      className="p-2 text-left rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="truncate mr-2">
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 truncate">
                          {p.full_name}
                        </p>
                        <div className="mt-0.5">
                          <RoleBadge role={p.role} size="sm" />
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: REGISTRATION (1. REGISTRO DE ESTUDIANTES) */}
          {activeMode === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span>Registro Oficial de Estudiante</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete sus datos escolares reales. El sistema validará su código estudiantil y pertenencia institucional.
                </p>
              </div>

              {/* Institution verification info notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-800">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Validación Institucional Obligatoria:</strong> Solo se permite el registro en los grados habilitados para servicio social (<strong>9°, 10° y 11°</strong>). Su código estudiantil debe corresponder a su carné o ficha de matrícula del colegio.
                </div>
              </div>

              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in shake">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{regSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nombres <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.first_names}
                      onChange={(e) => setRegData({ ...regData, first_names: e.target.value })}
                      placeholder="Ej: Laura Sofía"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Apellidos <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.last_names}
                      onChange={(e) => setRegData({ ...regData, last_names: e.target.value })}
                      placeholder="Ej: Gómez Montoya"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                {/* Código estudiantil y Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Código Estudiantil Institucional <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.student_code}
                      onChange={(e) => setRegData({ ...regData, student_code: e.target.value })}
                      placeholder="Ej: EST-2026-045"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 uppercase font-semibold"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Número o código único de matrícula escolar
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Teléfono o Celular (Opcional)
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={regData.phone}
                        onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                        placeholder="+57 300 123 4567"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Grado y Grupo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Grado Autorizado <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regData.grade}
                      onChange={(e) => setRegData({ ...regData, grade: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    >
                      <option value="9°">Grado 9°</option>
                      <option value="10°">Grado 10°</option>
                      <option value="11°">Grado 11°</option>
                    </select>
                    <span className="text-[10px] text-emerald-700 mt-0.5 block font-medium">
                      ✓ Restringido a 9°, 10° y 11° según reglamento
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Grupo / Salón <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.group_name}
                      onChange={(e) => setRegData({ ...regData, group_name: e.target.value })}
                      placeholder="Ej: 9A, 10B, 11A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico Institucional / Personal <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="estudiante@colegio.edu.co"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                    />
                  </div>
                </div>

                {/* Contraseña y Confirmación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contraseña <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Confirmar Contraseña <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={regData.confirm_password}
                        onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })}
                        placeholder="Repita su contraseña"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Register Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Crear mi Cuenta de Estudiante</span>
                  </button>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveMode('login')}
                    className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    ¿Ya tienes cuenta? Inicia sesión aquí
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="mt-5 text-center text-xs text-slate-400">
          Identificación automática de estudiantes y registro validado · Sistema institucional oficial
        </div>
      </div>
    </div>
  );
};
