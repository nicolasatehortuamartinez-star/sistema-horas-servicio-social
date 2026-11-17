import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, AlertTriangle, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [institutionName, setInstitutionName] = useState(settings.institution_name);
  const [academicYear, setAcademicYear] = useState(settings.academic_year);
  const [requiredHours, setRequiredHours] = useState(String(settings.required_hours));
  const [target9, setTarget9] = useState(String(settings.grade_targets?.['9°'] ?? 80));
  const [target10, setTarget10] = useState(String(settings.grade_targets?.['10°'] ?? 80));
  const [target11, setTarget11] = useState(String(settings.grade_targets?.['11°'] ?? 80));
  const [maxHoursDay, setMaxHoursDay] = useState(String(settings.max_hours_per_day || 8));
  const [whoCanRegister, setWhoCanRegister] = useState(settings.who_can_register);
  const [enableSupervisor, setEnableSupervisor] = useState(settings.enable_supervisor_role);
  const [allowDraft, setAllowDraft] = useState(settings.allow_draft_status);
  const [requireEvidence, setRequireEvidence] = useState(settings.require_evidence);
  const [requirePreRegisteredCode, setRequirePreRegisteredCode] = useState(
    Boolean(settings.require_pre_registered_code)
  );
  const [allowedEmailDomain, setAllowedEmailDomain] = useState(
    settings.allowed_email_domain || ''
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setInstitutionName(settings.institution_name);
    setAcademicYear(settings.academic_year);
    setRequiredHours(String(settings.required_hours));
    setTarget9(String(settings.grade_targets?.['9°'] ?? 80));
    setTarget10(String(settings.grade_targets?.['10°'] ?? 80));
    setTarget11(String(settings.grade_targets?.['11°'] ?? 80));
    setMaxHoursDay(String(settings.max_hours_per_day || 8));
    setWhoCanRegister(settings.who_can_register);
    setEnableSupervisor(settings.enable_supervisor_role);
    setAllowDraft(settings.allow_draft_status);
    setRequireEvidence(settings.require_evidence);
    setRequirePreRegisteredCode(Boolean(settings.require_pre_registered_code));
    setAllowedEmailDomain(settings.allowed_email_domain || '');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    const reqHoursNum = parseFloat(requiredHours);
    if (isNaN(reqHoursNum) || reqHoursNum <= 0 || reqHoursNum > 80) {
      setErrorMsg('La meta obligatoria de horas debe estar entre 1 y 80 horas máximas de servicio social.');
      return;
    }

    const t9 = parseFloat(target9);
    const t10 = parseFloat(target10);
    const t11 = parseFloat(target11);
    if ([t9, t10, t11].some((v) => isNaN(v) || v <= 0 || v > 80)) {
      setErrorMsg('Las metas por grado (9°, 10° y 11°) deben estar entre 1 y 80 horas máximas.');
      return;
    }

    const maxDayNum = parseFloat(maxHoursDay);
    if (isNaN(maxDayNum) || maxDayNum <= 0 || maxDayNum > 24) {
      setErrorMsg('El límite máximo de horas por día debe estar entre 1 y 24 horas.');
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        institution_name: institutionName.trim(),
        academic_year: academicYear.trim(),
        required_hours: reqHoursNum,
        grade_targets: {
          '9°': t9,
          '10°': t10,
          '11°': t11,
        },
        max_hours_per_day: maxDayNum,
        who_can_register: whoCanRegister,
        enable_supervisor_role: enableSupervisor,
        allow_draft_status: allowDraft,
        require_evidence: requireEvidence,
        require_pre_registered_code: requirePreRegisteredCode,
        allowed_email_domain: allowedEmailDomain.trim().toLowerCase().replace(/^@/, ''),
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar los parámetros en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Configuración y Parámetros Institucionales (RF-15)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina metas de horas, políticas de registro y validación estudiantil guardadas en PostgreSQL.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">¡Parámetros institucionales guardados correctamente en la base de datos!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Institutional Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Identidad Institucional y Vigencia</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre Oficial de la Institución Educativa
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Periodo o Año Lectivo</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Hour Requirements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Metas y Límites de Horas (Máximo reglamentario: 80 horas · RF-08, RNF-06)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Global Exigida (Máx. 80h)
              </label>
              <input
                type="number"
                min="1"
                max="80"
                value={requiredHours}
                onChange={(e) => setRequiredHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Meta Grado 9° (Máx. 80h)</label>
              <input
                type="number"
                min="1"
                max="80"
                value={target9}
                onChange={(e) => setTarget9(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Meta Grado 10° (Máx. 80h)</label>
              <input
                type="number"
                min="1"
                max="80"
                value={target10}
                onChange={(e) => setTarget10(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Meta Grado 11° (Máx. 80h)</label>
              <input
                type="number"
                min="1"
                max="80"
                value={target11}
                onChange={(e) => setTarget11(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Límite Máximo Diario (Horas / Jornada)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={maxHoursDay}
                onChange={(e) => setMaxHoursDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Business rules & institutional validation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Políticas de Registro, Validación Institucional y Aprobación</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                ¿Quién tiene autorización para crear registros de jornada?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="who_can_register"
                    value="student_and_coordinator"
                    checked={whoCanRegister === 'student_and_coordinator'}
                    onChange={() => setWhoCanRegister('student_and_coordinator')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Tanto estudiantes como coordinadores</strong> (El estudiante envía la solicitud y el coordinador valida)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="who_can_register"
                    value="coordinator_only"
                    checked={whoCanRegister === 'coordinator_only'}
                    onChange={() => setWhoCanRegister('coordinator_only')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Exclusivamente coordinadores</strong> (El estudiante solo tiene permisos de consulta)
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDraft}
                  onChange={(e) => setAllowDraft(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Permitir estado Borrador</span>
                  <span className="text-slate-500 text-[11px]">
                    El estudiante puede guardar sus avances antes de enviarlos a revisión final.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireEvidence}
                  onChange={(e) => setRequireEvidence(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Exigir evidencia documental obligatoria</span>
                  <span className="text-slate-500 text-[11px]">
                    No se permite enviar solicitudes sin adjuntar archivo o enlace de soporte (RF-14).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSupervisor}
                  onChange={(e) => setEnableSupervisor(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Habilitar rol de Docente Supervisor</span>
                  <span className="text-slate-500 text-[11px]">
                    Permite a docentes confirmar o visar actividades antes de la aprobación final.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePreRegisteredCode}
                  onChange={(e) => setRequirePreRegisteredCode(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Exigir Tarjeta de Identidad pre-cargada en matrícula
                  </span>
                  <span className="text-emerald-800 text-[11px]">
                    Si se activa, solo podrán crear cuenta los estudiantes cuya Tarjeta de Identidad haya sido importada o registrada previamente por coordinación.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">
                Dominio de correo institucional permitido para auto-registro (Opcional)
              </label>
              <input
                type="text"
                value={allowedEmailDomain}
                onChange={(e) => setAllowedEmailDomain(e.target.value)}
                placeholder="Ej: iuc.edu.co (dejar vacío para permitir cualquier correo válido)"
                className="w-full sm:w-96 px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Parámetros Institucionales'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
