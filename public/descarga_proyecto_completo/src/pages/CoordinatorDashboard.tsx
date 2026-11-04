import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/Badge';
import { formatDate, formatHours } from '../utils/helpers';
import { ServiceRecord } from '../types';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  Calendar,
  Layers,
  ArrowUpDown,
  FileCheck
} from 'lucide-react';

interface CoordinatorDashboardProps {
  onReviewRecord: (record: ServiceRecord) => void;
  onNavigateToStudents: () => void;
  onNavigateToReports: () => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  onReviewRecord,
  onNavigateToStudents,
  onNavigateToReports,
}) => {
  const { 
    students, 
    records, 
    settings, 
    approveRecord, 
    pendingRecordsCount, 
    totalApprovedHoursCount 
  } = useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending'); // default to pending for urgent action!
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Extract unique groups and grades
  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    students.forEach((s) => s.group_name && groups.add(s.group_name));
    return Array.from(groups).sort();
  }, [students]);

  const activeStudentsCount = students.filter((s) => s.active).length;

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        const student = students.find((s) => s.id === rec.student_id);
        const studentName = student?.full_name || '';
        const studentCode = student?.student_code || '';
        const studentGroup = student?.group_name || '';
        const studentGrade = student?.grade || '';

        // Text search
        const matchSearch =
          searchTerm === '' ||
          studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.activity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.supervisor_name.toLowerCase().includes(searchTerm.toLowerCase());

        // Status
        const matchStatus = statusFilter === 'all' || rec.status === statusFilter;

        // Group
        const matchGroup = groupFilter === 'all' || studentGroup === groupFilter;

        // Grade
        const matchGrade = gradeFilter === 'all' || studentGrade === gradeFilter;

        // Date range
        const recDate = new Date(rec.service_date).getTime();
        const matchFrom = !dateFrom || recDate >= new Date(dateFrom).getTime();
        const matchTo = !dateTo || recDate <= new Date(dateTo).getTime();

        return matchSearch && matchStatus && matchGroup && matchGrade && matchFrom && matchTo;
      })
      .sort((a, b) => {
        // Pending first, then newest
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.service_date).getTime() - new Date(a.service_date).getTime();
      });
  }, [records, students, searchTerm, statusFilter, groupFilter, gradeFilter, dateFrom, dateTo]);

  // Quick single-click approve
  const handleQuickApprove = (e: React.MouseEvent, record: ServiceRecord) => {
    e.stopPropagation();
    approveRecord(record.id, 'Aprobado rápidamente desde la bandeja de coordinación.');
  };

  return (
    <div className="space-y-6">
      {/* KPI Counters Banner (Mockup 6.4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active students */}
        <div 
          onClick={onNavigateToStudents}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estudiantes Activos</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{activeStudentsCount}</span>
            <span className="text-xs text-slate-500 font-medium">matriculados</span>
          </div>
          <div className="mt-3 text-[11px] text-blue-600 font-medium">
            Ver directorio estudiantil →
          </div>
        </div>

        {/* Total approved hours */}
        <div 
          onClick={onNavigateToReports}
          className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Horas Aprobadas</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{totalApprovedHoursCount}</span>
            <span className="text-xs text-emerald-600 font-medium">h oficiales</span>
          </div>
          <div className="mt-3 text-[11px] text-emerald-700 font-medium">
            Calculado con regla RNF-07 →
          </div>
        </div>

        {/* Pending records alert */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border shadow-xs transition-all cursor-pointer group ${
            pendingRecordsCount > 0
              ? 'bg-amber-500/10 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Pendientes de Revisión
            </span>
            <div className={`p-2.5 rounded-xl ${pendingRecordsCount > 0 ? 'bg-amber-500 text-white animate-bounce' : 'bg-slate-100 text-slate-600'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">{pendingRecordsCount}</span>
            <span className="text-xs text-amber-800 font-medium">jornadas</span>
          </div>
          <div className="mt-3 text-[11px] text-amber-800 font-medium">
            {pendingRecordsCount > 0 ? 'Requieren acción inmediata' : 'Bandeja al día'}
          </div>
        </div>

        {/* Institutional Goal status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meta Institucional</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{settings.required_hours}</span>
            <span className="text-xs text-slate-500 font-medium">h / estudiante</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 truncate">
            {settings.institution_name}
          </div>
        </div>
      </div>

      {/* Main Records Section (Mockup 6.4) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Bandeja de Jornadas y Solicitudes de Horas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revise las evidencias, apruebe o rechace con justificación obligatoria.
              </p>
            </div>

            <div className="text-xs text-slate-500">
              Mostrando <span className="font-bold text-slate-800">{filteredRecords.length}</span> registros
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar estudiante, código o actividad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">⏳ Solo Pendientes ({pendingRecordsCount})</option>
                <option value="approved">✅ Aprobadas</option>
                <option value="rejected">❌ Rechazadas</option>
                <option value="draft">📝 Borradores</option>
              </select>
            </div>

            {/* Group Filter */}
            <div>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Todos los grupos</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    Grupo {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Date from/to */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Fecha desde"
                className="w-1/2 py-2 px-2 text-[11px] rounded-xl border border-slate-300 text-slate-700"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Fecha hasta"
                className="w-1/2 py-2 px-2 text-[11px] rounded-xl border border-slate-300 text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Records Table (Mockup 6.4: Estudiante | Fecha | Actividad | Horas | Acción [Ver] [Aprobar] [Rechazar]) */}
        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron registros con los filtros seleccionados</p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setGroupFilter('all');
                  setSearchTerm('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="mt-2 text-xs font-semibold text-emerald-600 hover:underline"
              >
                Limpiar todos los filtros
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Estudiante / Código</th>
                  <th className="py-3 px-4">Grupo</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Actividad y Supervisor</th>
                  <th className="py-3 px-4 text-center">Horas</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const student = students.find((s) => s.id === rec.student_id);
                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => onReviewRecord(rec)}
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{student?.full_name || 'Desconocido'}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {student?.student_code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {student?.grade} ({student?.group_name})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {formatDate(rec.service_date)}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 truncate">{rec.activity_name}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          Supervisor: {rec.supervisor_name}
                        </div>
                        {rec.reviewer_notes && rec.status === 'rejected' && (
                          <div className="text-[10px] text-rose-600 truncate mt-0.5 font-medium">
                            Motivo: {rec.reviewer_notes}
                          </div>
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
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onReviewRecord(rec)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ver detalles completos de la jornada"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Ver</span>
                          </button>

                          {rec.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleQuickApprove(e, rec)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Aprobar inmediatamente"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Aprobar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onReviewRecord(rec)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Rechazar con motivo"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600" />
                                <span className="hidden sm:inline">Rechazar</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
