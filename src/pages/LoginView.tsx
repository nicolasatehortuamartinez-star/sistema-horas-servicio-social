import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { normalizeAndValidateTI } from '../utils/helpers';
import {
  GraduationCap,
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  UserPlus,
  KeyRound,
  CheckCircle2,
  Phone,
  Info,
  ShieldCheck,
  LogOut,
  Loader2,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    firebaseUser,
    needsRegistration,
    hasAnyAdmin,
    authError,
    loginWithCredentials,
    loginWithGoogle,
    registerStudentAccount,
    completeStudentRegistration,
    bootstrapFirstAdmin,
    logout,
    settings,
  } = useApp();

  // Mode: 'login' | 'register'
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  const [isBusy, setIsBusy] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state (students)
  const [regData, setRegData] = useState({
    first_names: '',
    last_names: '',
    student_code: '',
    email: '',
    password: '',
    confirm_password: '',
    grade: '10°',
    group_name: '',
    phone: '',
  });
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Onboarding mode for newly Google-authenticated user without DB profile
  const [onboardingType, setOnboardingType] = useState<'student' | 'admin'>('student');
  const [adminFullName, setAdminFullName] = useState(firebaseUser?.displayName || '');
  const [adminPhone, setAdminPhone] = useState('');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Ingrese su correo electrónico y contraseña.');
      return;
    }

    setIsBusy(true);
    const result = await loginWithCredentials(loginEmail, loginPassword);
    setIsBusy(false);

    if (!result.success) {
      setLoginError(result.error || 'No se pudo iniciar sesión.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    setRegError('');
    setIsBusy(true);
    const result = await loginWithGoogle();
    setIsBusy(false);
    if (!result.success && result.error) {
      setLoginError(result.error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    if (!regData.first_names.trim() || !regData.last_names.trim()) {
      setRegError('Ingrese sus nombres y apellidos completos tal como figuran en su matrícula.');
      return;
    }

    const tiCheck = normalizeAndValidateTI(regData.student_code);
    if (!tiCheck.valid) {
      setRegError(tiCheck.error!);
      return;
    }

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
      setRegError('Ingrese una dirección de correo electrónico válida.');
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

    setIsBusy(true);
    const res = await registerStudentAccount({
      first_names: regData.first_names,
      last_names: regData.last_names,
      student_code: tiCheck.value,
      email: regData.email,
      password: regData.password,
      grade: regData.grade,
      group_name: regData.group_name,
      phone: regData.phone,
    });
    setIsBusy(false);

    if (res.success) {
      setRegSuccessMsg('¡Cuenta estudiantil creada y guardada en la base de datos! Ingresando...');
    } else {
      setRegError(res.error || 'Ocurrió un error al procesar el registro.');
    }
  };

  const handleCompleteGoogleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regData.first_names.trim() || !regData.last_names.trim()) {
      setRegError('Debe ingresar sus nombres y apellidos completos.');
      return;
    }
    const tiCheck = normalizeAndValidateTI(regData.student_code);
    if (!tiCheck.valid) {
      setRegError(tiCheck.error!);
      return;
    }
    if (!['9°', '10°', '11°'].includes(regData.grade)) {
      setRegError('Solo se permiten los grados 9°, 10° y 11°.');
      return;
    }
    if (!regData.group_name.trim()) {
      setRegError('Ingrese su grupo o salón.');
      return;
    }

    setIsBusy(true);
    const res = await completeStudentRegistration({
      first_names: regData.first_names,
      last_names: regData.last_names,
      student_code: tiCheck.value,
      grade: regData.grade,
      group_name: regData.group_name,
      phone: regData.phone,
    });
    setIsBusy(false);

    if (!res.success) {
      setRegError(res.error || 'Error al guardar el perfil estudiantil.');
    }
  };

  const handleBootstrapAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!adminFullName.trim() || adminFullName.trim().length < 3) {
      setRegError('Ingrese el nombre completo del administrador.');
      return;
    }

    setIsBusy(true);
    const res = await bootstrapFirstAdmin(adminFullName, adminPhone);
    setIsBusy(false);

    if (!res.success) {
      setRegError(res.error || 'No se pudo inicializar la cuenta de administrador.');
    }
  };

  // CASE: User authenticated via Firebase (e.g. Google Sign-In) and needs institutional DB registration
  if (firebaseUser && needsRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {settings.institution_name}
          </h2>
          <p className="mt-1 text-sm text-emerald-300 font-medium">
            Completar Registro Institucional en Base de Datos
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Cuenta verificada</h3>
                <p className="text-xs text-slate-500">{firebaseUser.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cambiar cuenta
              </button>
            </div>

            {!hasAnyAdmin && (
              <div className="flex rounded-2xl bg-slate-100 p-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingType('student');
                    setRegError('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    onboardingType === 'student'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Soy Estudiante
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOnboardingType('admin');
                    setRegError('');
                  }}
                  className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                    onboardingType === 'admin'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Primer Administrador del Colegio
                </button>
              </div>
            )}

            {regError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}

            {onboardingType === 'admin' && !hasAnyAdmin ? (
              <form onSubmit={handleBootstrapAdmin} className="space-y-4 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Configuración Inicial de la Institución:</strong> Aún no existe un administrador registrado en la base de datos. Esta cuenta quedará guardada como Administrador General para habilitar coordinadores y gestionar parámetros.
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre Completo del Administrador <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminFullName}
                    onChange={(e) => setAdminFullName(e.target.value)}
                    placeholder="Nombre y apellidos completos"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono de contacto (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>Guardar como Administrador Institucional</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompleteGoogleStudent} className="space-y-3.5 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-800">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    Complete sus datos escolares reales (grados autorizados <strong>9°, 10° y 11°</strong>) para asociar esta cuenta a su historial de servicio social.
                  </div>
                </div>

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
                      placeholder="Sus nombres"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
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
                      placeholder="Sus apellidos"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tarjeta de Identidad (Código Estudiantil) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={15}
                      value={regData.student_code}
                      onChange={(e) => setRegData({ ...regData, student_code: e.target.value })}
                      placeholder="Ej: 1053841290 (solo números)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-800 font-semibold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Obligatorio · Número de Tarjeta de Identidad (6 a 12 dígitos).
                    </p>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={regData.phone}
                      onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                      placeholder="+57 300 000 0000"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Grado Autorizado <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regData.grade}
                      onChange={(e) => setRegData({ ...regData, grade: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold"
                    >
                      <option value="9°">Grado 9°</option>
                      <option value="10°">Grado 10°</option>
                      <option value="11°">Grado 11°</option>
                    </select>
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
                      placeholder="Ej: 10A, 11B"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 uppercase font-mono text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Guardar Perfil de Estudiante</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

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
              <span>Crear cuenta</span>
            </button>
          </div>

          {authError && !loginError && !regError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {activeMode === 'login' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">Ingreso a la Plataforma</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inicie sesión con su cuenta de Google o correo registrado. Si es estudiante nuevo, utilice el botón «Crear cuenta».
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isBusy}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  o con correo y contraseña
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleManualLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="correo@ejemplo.edu.co"
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
                  disabled={isBusy}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* MODE 2: STUDENT SELF-REGISTRATION ("Crear cuenta") */}
          {activeMode === 'register' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  <span>Registro Oficial de Estudiante</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete sus datos reales. Su cuenta quedará guardada directamente en la base de datos de {settings.institution_name}.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-800">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Validación Institucional:</strong> Solo se permite el registro en los grados habilitados para servicio social (<strong>9°, 10° y 11°</strong>, meta máxima de <strong>80 horas</strong>).{' '}
                  {settings.require_pre_registered_code
                    ? 'Su Tarjeta de Identidad (código estudiantil) debe estar previamente cargada por la institución.'
                    : 'Es obligatorio ingresar su Tarjeta de Identidad y no se permiten documentos ni correos duplicados.'}
                </div>
              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Registrarse rápido con Google (y completar datos)</span>
              </button>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  o crear cuenta con correo y contraseña
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{regSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
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
                      placeholder="Sus nombres"
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
                      placeholder="Sus apellidos"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tarjeta de Identidad (Código Estudiantil) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={15}
                      value={regData.student_code}
                      onChange={(e) => setRegData({ ...regData, student_code: e.target.value })}
                      placeholder="Ej: 1053841290 (solo números)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800 font-semibold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Obligatoria · Ingrese el número de su Tarjeta de Identidad sin letras ni puntos.
                    </p>
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
                        placeholder="+57 300 000 0000"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Correo Electrónico <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                      placeholder="correo@ejemplo.edu.co"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                    />
                  </div>
                </div>

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

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
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
          Identificación automática de estudiantes y registro persistente en base de datos
        </div>
      </div>
    </div>
  );
};
