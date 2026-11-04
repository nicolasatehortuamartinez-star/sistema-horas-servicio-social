import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { downloadCSV, formatDate, formatHours } from '../utils/helpers';
import { StatusBadge } from '../components/common/Badge';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  GraduationCap,
  BarChart3,
  Building2,
  Calendar
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { 
    students, 
    records, 
    settings, 
    getStudentProgress, 
    activeStudentsProgress 
  } = useApp();

  const [reportType, setReportType] = useState<'by_student' | 'by_group' | 'by_record'>('by_student');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Groups list
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.group_name && set.add(s.group_name));
    return Array.from(set).sort();
  }, [students]);

  // Progress list filtered
  const filteredProgress = useMemo(() => {
    return activeStudentsProgress.filter((prog) => {
      const matchSearch =
        prog.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.student.student_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGrade = gradeFilter === 'all' || prog.student.grade === gradeFilter;
      const matchGroup = groupFilter === 'all' || prog.student.group_name === groupFilter;
      const matchCompleted =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && prog.isCompleted) ||
        (statusFilter === 'in_progress' && !prog.isCompleted);

      return matchSearch && matchGrade && matchGroup && matchCompleted;
    });
  }, [activeStudentsProgress, searchTerm, gradeFilter, groupFilter, statusFilter]);

  // Group aggregated statistics
  const groupStats = useMemo(() => {
    const stats: Record<
      string,
      {
        group_name: string;
        grade: string;
        totalStudents: number;
        completedStudents: number;
        totalApprovedHours: number;
        totalPendingHours: number;
        totalTargetHours: number;
      }
    > = {};

    activeStudentsProgress.forEach((prog) => {
      const key = `${prog.student.grade}-${prog.student.group_name}`;
      if (!stats[key]) {
        stats[key] = {
          group_name: prog.student.group_name,
          grade: prog.student.grade,
          totalStudents: 0,
          completedStudents: 0,
          totalApprovedHours: 0,
          totalPendingHours: 0,
          totalTargetHours: 0,
        };
      }
      stats[key].totalStudents += 1;
      if (prog.isCompleted) stats[key].completedStudents += 1;
      stats[key].totalApprovedHours += prog.approvedHours;
      stats[key].totalPendingHours += prog.pendingHours;
      stats[key].totalTargetHours += prog.targetHours;
    });

    return Object.values(stats);
  }, [activeStudentsProgress]);

  // Export to CSV
  const handleExportCSV = () => {
    if (reportType === 'by_student') {
      const headers = [
        'Codigo',
        'Estudiante',
        'Grado',
        'Grupo',
        'Meta_Horas',
        'Horas_Aprobadas',
        'Horas_Pendientes',
        'Horas_Rechazadas',
        'Horas_Faltantes',
        'Porcentaje_Avance',
        'Estado_Cumplimiento',
      ];

      const rows = [
        headers,
        ...filteredProgress.map((p) => [
          p.student.student_code,
          p.student.full_name,
          p.student.grade,
          p.student.group_name,
          String(p.targetHours),
          String(p.approvedHours),
          String(p.pendingHours),
          String(p.rejectedHours),
          String(p.remainingHours),
          `${p.progressPercentage}%`,
          p.isCompleted ? 'COMPLETADO' : 'EN_PROGRESO',
        ]),
      ];

      downloadCSV(`reporte_servicio_social_estudiantes_${new Date().toISOString().slice(0, 10)}`, rows);
    } else if (reportType === 'by_group') {
      const headers = [
        'Grado',
        'Grupo',
        'Total_Estudiantes',
        'Estudiantes_Completados',
        'Total_Horas_Aprobadas',
        'Total_Horas_Pendientes',
        'Meta_Total_Horas',
        'Porcentaje_Grupo',
      ];

      const rows = [
        headers,
        ...groupStats.map((g) => {
          const pct = g.totalTargetHours > 0 ? Math.round((g.totalApprovedHours / g.totalTargetHours) * 100) : 0;
          return [
            g.grade,
            g.group_name,
            String(g.totalStudents),
            String(g.completedStudents),
            String(g.totalApprovedHours),
            String(g.totalPendingHours),
            String(g.totalTargetHours),
            `${pct}%`,
          ];
        }),
      ];

      downloadCSV(`reporte_servicio_social_por_grupos_${new Date().toISOString().slice(0, 10)}`, rows);
    } else {
      // by_record
      const headers = [
        'ID_Jornada',
        'Codigo_Estudiante',
        'Estudiante',
        'Grado',
        'Grupo',
        'Fecha',
        'Actividad',
        'Horas',
        'Estado',
        'Supervisor',
        'Observacion_Revision',
      ];

      const rows = [
        headers,
        ...records.map((r) => {
          const s = students.find((std) => std.id === r.student_id);
          return [
            r.id,
            s?.student_code || '',
            s?.full_name || '',
            s?.grade || '',
            s?.group_name || '',
            r.service_date,
            r.activity_name,
            String(r.hours),
            r.status,
            r.supervisor_name,
            r.reviewer_notes || '',
          ];
        }),
      ];

      downloadCSV(`reporte_detallado_jornadas_${new Date().toISOString().slice(0, 10)}`, rows);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Generador de Reportes Institucionales (RF-12)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reportes oficiales de horas por estudiante y por grupo con totales exactos por estado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Descargar archivo estructurado compatible con Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
            title="Vista de impresión o guardar como PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs for report type */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 gap-1 text-xs font-semibold print:hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setReportType('by_student')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            reportType === 'by_student'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Consolidado por Estudiante
        </button>
        <button
          type="button"
          onClick={() => setReportType('by_group')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            reportType === 'by_group'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Resumen Estadístico por Grupo
        </button>
        <button
          type="button"
          onClick={() => setReportType('by_record')}
          className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
            reportType === 'by_record'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Listado de Todas las Jornadas
        </button>
      </div>

      {/* Filters (Hidden in print) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por estudiante o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los grados (9°, 10°, 11°)</option>
            <option value="9°">Grado 9°</option>
            <option value="10°">Grado 10°</option>
            <option value="11°">Grado 11°</option>
          </select>
        </div>

        <div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los grupos</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                Grupo {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="completed">Solo Con Meta Cumplida (100%)</option>
            <option value="in_progress">En Progreso / Faltantes</option>
          </select>
        </div>
      </div>

      {/* Official Print Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-xl font-bold uppercase">{settings.institution_name}</h1>
        <p className="text-xs text-slate-600">
          Informe Oficial de Seguimiento de Servicio Social Estudiantil · Periodo {settings.academic_year}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          Fecha de generación: {new Date().toLocaleDateString('es-CO')}
        </p>
      </div>

      {/* REPORT CONTENT: BY STUDENT */}
      {reportType === 'by_student' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              Consolidado Individual por Estudiante ({filteredProgress.length} registros)
            </span>
            <span className="text-slate-500 text-[11px]">
              Regla RNF-07: Horas aprobadas son las únicas que acreditan la meta institucional.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Estudiante</th>
                  <th className="py-2.5 px-3">Grupo</th>
                  <th className="py-2.5 px-3 text-center">Meta</th>
                  <th className="py-2.5 px-3 text-center text-emerald-700 bg-emerald-50/50">Aprobadas</th>
                  <th className="py-2.5 px-3 text-center text-amber-700 bg-amber-50/50">Pendientes</th>
                  <th className="py-2.5 px-3 text-center text-rose-700 bg-rose-50/50">Rechazadas</th>
                  <th className="py-2.5 px-3 text-center text-slate-700">Faltantes</th>
                  <th className="py-2.5 px-3 text-center">% Avance</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProgress.map((p) => (
                  <tr key={p.student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">{p.student.student_code}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.student.full_name}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {p.student.grade} - {p.student.group_name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{p.targetHours}h</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      {p.approvedHours}h
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-700 bg-amber-50/30">
                      {p.pendingHours}h
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-rose-700 bg-rose-50/30">
                      {p.rejectedHours}h
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {p.remainingHours}h
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold">
                      <span className={p.isCompleted ? 'text-emerald-700' : 'text-slate-600'}>
                        {p.progressPercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {p.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          <Award className="w-3 h-3 text-emerald-600" />
                          Cumplido
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium text-[10px]">
                          En Proceso
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: BY GROUP */}
      {reportType === 'by_group' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Resumen Estadístico Agrupado por Curso/Grupo</span>
            <span className="text-slate-500 text-[11px]">Total Grupos: {groupStats.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Grado y Grupo</th>
                  <th className="py-2.5 px-4 text-center">Total Estudiantes</th>
                  <th className="py-2.5 px-4 text-center">Completados (100%)</th>
                  <th className="py-2.5 px-4 text-center text-emerald-700">Total Horas Aprobadas</th>
                  <th className="py-2.5 px-4 text-center text-amber-700">Total Horas Pendientes</th>
                  <th className="py-2.5 px-4 text-center">Meta Acumulada</th>
                  <th className="py-2.5 px-4 text-center">% Cumplimiento Global</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupStats.map((g, idx) => {
                  const pct = g.totalTargetHours > 0 ? Math.round((g.totalApprovedHours / g.totalTargetHours) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Grado {g.grade} - Grupo {g.group_name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {g.totalStudents} estudiantes
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold font-mono">
                          {g.completedStudents} de {g.totalStudents}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                        {g.totalApprovedHours} h
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-700">
                        {g.totalPendingHours} h
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {g.totalTargetHours} h
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{pct}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: BY RECORD */}
      {reportType === 'by_record' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Listado General de Registros ({records.length} jornadas)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Estudiante</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Actividad</th>
                  <th className="py-2.5 px-3">Supervisor</th>
                  <th className="py-2.5 px-3 text-center">Horas</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                  <th className="py-2.5 px-3">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => {
                  const s = students.find((std) => std.id === r.student_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {s?.full_name || 'Desconocido'} ({s?.group_name})
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {formatDate(r.service_date)}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-800">{r.activity_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.supervisor_name}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">{r.hours} h</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <StatusBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                        {r.reviewer_notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
