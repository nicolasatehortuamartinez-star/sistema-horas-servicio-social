import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { Student } from '../types';
import { CsvImportModal } from './CsvImportModal';
import { 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Award, 
  GraduationCap, 
  Clock, 
  Phone, 
  Mail,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const { 
    students, 
    createStudent, 
    updateStudent, 
    toggleStudentStatus, 
    getStudentProgress, 
    settings 
  } = useApp();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // active, inactive, all

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Student Form fields
  const [formData, setFormData] = useState({
    student_code: '',
    full_name: '',
    email: '',
    grade: '11°',
    group_name: '11A',
    phone: '',
  });
  const [formError, setFormError] = useState('');

  // Groups list
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => s.group_name && set.add(s.group_name));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrade = gradeFilter === 'all' || s.grade === gradeFilter;
      const matchGroup = groupFilter === 'all' || s.group_name === groupFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.active) ||
        (statusFilter === 'inactive' && !s.active);

      return matchSearch && matchGrade && matchGroup && matchStatus;
    });
  }, [students, searchTerm, gradeFilter, groupFilter, statusFilter]);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormData({
      student_code: `EST-2026-0${students.length + 1}`,
      full_name: '',
      email: '',
      grade: '11°',
      group_name: '11A',
      phone: '',
    });
    setFormError('');
    setIsStudentModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      student_code: student.student_code,
      full_name: student.full_name,
      email: student.email,
      grade: student.grade,
      group_name: student.group_name,
      phone: student.phone || '',
    });
    setFormError('');
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.student_code.trim()) {
      setFormError('El código del estudiante es obligatorio.');
      return;
    }

    if (!formData.full_name.trim()) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }

    // Check code duplication if new or changed
    const duplicate = students.find(
      (s) =>
        s.student_code.toLowerCase() === formData.student_code.trim().toLowerCase() &&
        (!editingStudent || s.id !== editingStudent.id)
    );

    if (duplicate) {
      setFormError(`El código "${formData.student_code}" ya está registrado a nombre de ${duplicate.full_name}.`);
      return;
    }

    const emailToUse = formData.email.trim() || `${formData.student_code.toLowerCase()}@estudiante.edu.co`;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        student_code: formData.student_code.trim(),
        full_name: formData.full_name.trim(),
        email: emailToUse,
        grade: formData.grade,
        group_name: formData.group_name,
        phone: formData.phone.trim() || undefined,
      });
    } else {
      createStudent({
        student_code: formData.student_code.trim(),
        full_name: formData.full_name.trim(),
        email: emailToUse,
        grade: formData.grade,
        group_name: formData.group_name,
        phone: formData.phone.trim() || undefined,
        active: true,
      });
    }

    setIsStudentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Gestión de Estudiantes (RF-03)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administre la matrícula de estudiantes, verifique el avance de horas obligatorias y cargue listas masivas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar CSV (RF-16)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Estudiante</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, código o correo..."
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
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Inactivos</option>
          </select>
        </div>
      </div>

      {/* Students List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron estudiantes con los filtros</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Código / Nombre</th>
                  <th className="py-3 px-4">Grado y Grupo</th>
                  <th className="py-3 px-4">Avance de Horas Aprobadas (RF-08)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const progress = getStudentProgress(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                            {student.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{student.full_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {student.student_code} · {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-xs">
                          {student.grade} - {student.group_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-slate-800">
                            {progress.approvedHours} de {progress.targetHours} h
                          </span>
                          <span className={`font-mono font-bold ${progress.isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {progress.progressPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progress.isCompleted ? 'bg-emerald-600' : 'bg-teal-600'
                            }`}
                            style={{ width: `${progress.progressPercentage}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                          {progress.pendingHours > 0 && (
                            <span className="text-amber-600 font-medium">
                              ⏳ {progress.pendingHours}h pendientes
                            </span>
                          )}
                          {progress.isCompleted && (
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <Award className="w-3 h-3" /> Meta cumplida
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleStudentStatus(student.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            student.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                          title="Haga clic para cambiar estado activo/inactivo"
                        >
                          {student.active ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar estudiante"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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

      {/* Create / Edit Student Modal */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title={editingStudent ? 'Editar Datos del Estudiante' : 'Nuevo Registro de Estudiante'}
        subtitle="Los datos de estudiantes son privados y de uso institucional exclusivo (RNF-02)."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Código Estudiantil Único <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.student_code}
              onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
              placeholder="EST-2026-001"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Ej. Valentina Mejía Castro"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grado</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
              >
                <option value="9°">Grado 9°</option>
                <option value="10°">Grado 10°</option>
                <option value="11°">Grado 11°</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Grupo</label>
              <input
                type="text"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="10A, 10B, 11A..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Correo Institucional</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="nombre@estudiante.edu.co"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Teléfono / Celular</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+57 300 000 0000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsStudentModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer"
            >
              {editingStudent ? 'Actualizar Estudiante' : 'Guardar Estudiante'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />
    </div>
  );
};
