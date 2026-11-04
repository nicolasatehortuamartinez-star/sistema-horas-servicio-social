import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings, Save, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, Sliders } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetAllData, currentUser } = useApp();

  const [institutionName, setInstitutionName] = useState(settings.institution_name);
  const [academicYear, setAcademicYear] = useState(settings.academic_year);
  const [requiredHours, setRequiredHours] = useState(String(settings.required_hours));
  const [target9, setTarget9] = useState(String(settings.grade_targets?.['9°'] || 20));
  const [target10, setTarget10] = useState(String(settings.grade_targets?.['10°'] || 30));
  const [target11, setTarget11] = useState(String(settings.grade_targets?.['11°'] || 30));
  const [maxHoursDay, setMaxHoursDay] = useState(String(settings.max_hours_per_day || 8));
  const [whoCanRegister, setWhoCanRegister] = useState(settings.who_can_register);
  const [enableSupervisor, setEnableSupervisor] = useState(settings.enable_supervisor_role);
  const [allowDraft, setAllowDraft] = useState(settings.allow_draft_status);
  const [requireEvidence, setRequireEvidence] = useState(settings.require_evidence);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSavedSuccess(false);

    const reqHoursNum = parseFloat(requiredHours);
    if (isNaN(reqHoursNum) || reqHoursNum <= 0) {
      setErrorMsg('La meta obligatoria de horas debe ser un número mayor a cero.');
      return;
    }

    const maxDayNum = parseFloat(maxHoursDay);
    if (isNaN(maxDayNum) || maxDayNum <= 0 || maxDayNum > 24) {
      setErrorMsg('El límite máximo de horas por día debe estar entre 1 y 24 horas.');
      return;
    }

    updateSettings({
      institution_name: institutionName.trim(),
      academic_year: academicYear.trim(),
      required_hours: reqHoursNum,
      grade_targets: {
        '9°': parseFloat(target9) || 20,
        '10°': parseFloat(target10) || 30,
        '11°': parseFloat(target11) || 30,
      },
      max_hours_per_day: maxDayNum,
      who_can_register: whoCanRegister,
      enable_supervisor_role: enableSupervisor,
      allow_draft_status: allowDraft,
      require_evidence: requireEvidence,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = () => {
    resetAllData();
    setResetConfirmOpen(false);
    setInstitutionName('I. U. C. (Instituto Universitario de Caldas)');
    setAcademicYear('2026');
    setRequiredHours('80');
    setTarget9('20');
    setTarget10('30');
    setTarget11('30');
    setMaxHoursDay('8');
    setWhoCanRegister('student_and_coordinator');
    setEnableSupervisor(true);
    setAllowDraft(true);
    setRequireEvidence(false);
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
            Defina metas de horas, políticas de registro y reglas aprobadas por el colegio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Datos Demo</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">¡Parámetros institucionales actualizados correctamente en el sistema!</span>
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
            Metas y Límites de Horas (RF-08, RNF-06)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Global Exigida (Horas)
              </label>
              <input
                type="number"
                min="1"
                value={requiredHours}
                onChange={(e) => setRequiredHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Requisito ministerial para graduación (usualmente 80h en Colombia).
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Grado 9° (Horas)
              </label>
              <input
                type="number"
                min="0"
                value={target9}
                onChange={(e) => setTarget9(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Grado 10° (Horas)
              </label>
              <input
                type="number"
                min="0"
                value={target10}
                onChange={(e) => setTarget10(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meta Grado 11° (Horas)
              </label>
              <input
                type="number"
                min="0"
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
              <p className="text-[10px] text-slate-400 mt-1">
                Previene registros excesivos en una sola fecha.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Business rules & permissions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Políticas de Registro y Aprobación
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
                    <strong>Tanto estudiantes como coordinadores</strong> (Recomendado: el estudiante envía la solicitud y el coordinador valida)
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

              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={enableSupervisor}
                  onChange={(e) => setEnableSupervisor(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Habilitar rol de Docente Supervisor</span>
                  <span className="text-slate-500 text-[11px]">
                    Permite a profesores confirmar o visar actividades de los estudiantes antes del visto bueno de coordinación.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Parámetros Institucionales</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">¿Restablecer datos de demostración?</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Esta acción borrará los cambios locales en el navegador y volverá a cargar los estudiantes, registros de jornada de prueba y configuración por defecto del I. U. C. (Instituto Universitario de Caldas).
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md cursor-pointer"
              >
                Sí, Restablecer Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
