import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/Badge';
import { formatDate, formatHours } from '../utils/helpers';
import { ServiceRecord } from '../types';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Target, 
  AlertCircle, 
  FileEdit, 
  Search, 
  Filter, 
  Eye, 
  Award, 
  ExternalLink,
  ChevronRight,
  Send
} from 'lucide-react';

interface StudentDashboardProps {
  onOpenNewRecord: () => void;
  onViewRecordDetail: (record: ServiceRecord) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onOpenNewRecord,
  onViewRecordDetail,
}) => {
  const { currentStudent, getStudentProgress, records, settings, submitDraftRecord } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!currentStudent) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Perfil de estudiante no vinculado</h3>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          El usuario activo actual no tiene un registro de estudiante asociado en la base de datos de estudiantes.
          Por favor seleccione un perfil de estudiante desde el selector superior o desde la gestión de estudiantes.
        </p>
      </div>
    );
  }

  const progress = getStudentProgress(currentStudent.id);
  const studentRecords = useMemo(() => {
    return records
      .filter((r) => r.student_id === currentStudent.id)
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());
  }, [records, currentStudent.id]);

  const filteredRecords = useMemo(() => {
    return studentRecords.filter((rec) => {
      const matchSearch =
        rec.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.supervisor_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || rec.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [studentRecords, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/20 px-3 py-1 rounded-full text-xs font-medium mb-3">
            <span>Estudiante Activo · Grado {currentStudent.grade} ({currentStudent.group_name})</span>
            <span>·</span>
            <span>Cód: {currentStudent.student_code}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hola, {currentStudent.full_name}
          </h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Bienvenido a tu portal de horas de servicio social. Revisa tu progreso, consulta las observaciones de los coordinadores y registra tus jornadas comunitarias.
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onOpenNewRecord}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:bg-slate-100 font-bold text-sm shadow-lg shadow-black/10 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span>Registrar Nueva Jornada</span>
          </button>
        </div>
      </div>

      {/* Completion Banner if completed! */}
      {progress.isCompleted && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">
                ¡Felicitaciones! Has completado el 100% de tus horas de servicio social
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Cumpliste con las {progress.targetHours} horas exigidas por {settings.institution_name}. Puedes solicitar tu certificado en coordinación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Cards - Layout aligned with Mockup 6.2 and requirement 5 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Meta configurada */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Meta Total</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">{progress.targetHours}</span>
            <span className="text-xs text-slate-500 font-medium">horas</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            Fijada para Grado {currentStudent.grade}
          </div>
        </div>

        {/* Horas Aprobadas */}
        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Aprobadas</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-700">{progress.approvedHours}</span>
            <span className="text-xs text-emerald-600 font-medium">horas</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-700 font-medium">
            Suma oficial a tu saldo
          </div>
        </div>

        {/* Horas Pendientes */}
        <div className="bg-white p-4.5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Pendientes</span>
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-amber-700">{progress.pendingHours}</span>
            <span className="text-xs text-amber-600 font-medium">horas</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-700">
            En revisión por coordinación
          </div>
        </div>

        {/* Horas Rechazadas */}
        <div className="bg-white p-4.5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">Rechazadas</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-rose-700">{progress.rejectedHours}</span>
            <span className="text-xs text-rose-600 font-medium">horas</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-700">
            No suman al total oficial
          </div>
        </div>

        {/* Horas Faltantes */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Faltantes</span>
            <div className={`p-1.5 rounded-lg ${progress.remainingHours === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-2xl font-extrabold ${progress.remainingHours === 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
              {progress.remainingHours}
            </span>
            <span className="text-xs text-slate-500 font-medium">horas</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500">
            {progress.remainingHours === 0 ? '¡Meta alcanzada!' : `Resta para graduarte`}
          </div>
        </div>
      </div>

      {/* Progress Bar Component */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Porcentaje de Avance Oficial</span>
            <span className="text-xs text-slate-500">
              ({progress.approvedHours} de {progress.targetHours} horas aprobadas)
            </span>
          </div>
          <span className="text-base font-extrabold text-emerald-600 font-mono">
            {progress.progressPercentage}%
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>0 h</span>
          <span className="font-medium text-slate-600">
            Regla RNF-07: Solo las horas con estado «Aprobada» aumentan el avance oficial.
          </span>
          <span>{progress.targetHours} h</span>
        </div>
      </div>

      {/* Rejected Alert Notice if student has rejected records */}
      {progress.rejectedHours > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-800">
              Tienes {progress.rejectedHours} horas en estado Rechazada
            </h4>
            <p className="text-rose-700 mt-0.5">
              Revisa la columna de observaciones de la coordinación en la tabla de abajo para conocer la razón del rechazo y corregir la información o adjuntar las evidencias requeridas.
            </p>
          </div>
        </div>
      )}

      {/* Records Table - Layout aligned with Mockup 6.2 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Historial de Jornadas Registradas</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta el estado de cada reporte, el supervisor asignado y los comentarios de revisión.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por actividad o supervisor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Todos los estados ({studentRecords.length})</option>
                <option value="approved">Aprobadas</option>
                <option value="pending">Pendientes</option>
                <option value="rejected">Rechazadas</option>
                <option value="draft">Borradores</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron jornadas registradas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'Intenta cambiar los filtros de búsqueda.'
                  : 'Aún no has registrado jornadas de servicio social. Haz clic en "Registrar Nueva Jornada" para comenzar.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Actividad y Descripción</th>
                  <th className="py-3 px-4">Supervisor / Responsable</th>
                  <th className="py-3 px-4 text-center">Horas</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Detalle / Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {formatDate(rec.service_date)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">{rec.activity_name}</div>
                      <p className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">{rec.description}</p>
                      {rec.status === 'rejected' && rec.reviewer_notes && (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                          <span className="font-bold">Observación de rechazo:</span> {rec.reviewer_notes}
                        </div>
                      )}
                      {rec.status === 'approved' && rec.reviewer_notes && (
                        <div className="mt-1 text-[11px] text-emerald-700 italic">
                          "{rec.reviewer_notes}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{rec.supervisor_name}</div>
                      {rec.evidence_name && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                          📎 {rec.evidence_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-800">
                        {formatHours(rec.hours)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => submitDraftRecord(rec.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Enviar borrador a revisión por el coordinador"
                          >
                            <Send className="w-3 h-3" />
                            Enviar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewRecordDetail(rec)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ver</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
