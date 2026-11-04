import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { ServiceRecord, Student } from '../types';
import { Calendar, Clock, User, FileText, Link as LinkIcon, AlertTriangle, UploadCloud, CheckCircle } from 'lucide-react';

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: ServiceRecord | null;
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
}) => {
  const { 
    currentUser, 
    currentStudent, 
    students, 
    settings, 
    addRecord, 
    updateRecord 
  } = useApp();

  const isStudent = currentUser.role === 'student';
  const activeStudents = students.filter((s) => s.active);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [serviceDate, setServiceDate] = useState<string>('');
  const [activityName, setActivityName] = useState<string>('');
  const [hours, setHours] = useState<string>('4');
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [evidenceUrl, setEvidenceUrl] = useState<string>('');
  const [evidenceName, setEvidenceName] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form
  useEffect(() => {
    if (isOpen) {
      setValidationError('');
      if (recordToEdit) {
        setSelectedStudentId(recordToEdit.student_id);
        setServiceDate(recordToEdit.service_date);
        setActivityName(recordToEdit.activity_name);
        setHours(String(recordToEdit.hours));
        setSupervisorName(recordToEdit.supervisor_name);
        setDescription(recordToEdit.description);
        setStudentNotes(recordToEdit.student_notes || '');
        setEvidenceUrl(recordToEdit.evidence_url || '');
        setEvidenceName(recordToEdit.evidence_name || '');
      } else {
        // New record
        const defaultStudentId = currentStudent ? currentStudent.id : (activeStudents[0]?.id || '');
        setSelectedStudentId(defaultStudentId);
        // Default today's date in YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        setServiceDate(today);
        setActivityName('');
        setHours('4');
        setSupervisorName('');
        setDescription('');
        setStudentNotes('');
        setEvidenceUrl('');
        setEvidenceName('');
      }
    }
  }, [isOpen, recordToEdit, currentStudent]);

  const validateForm = (): boolean => {
    setValidationError('');

    if (!selectedStudentId) {
      setValidationError('Debe seleccionar un estudiante.');
      return false;
    }

    if (!serviceDate) {
      setValidationError('La fecha de la jornada es obligatoria.');
      return false;
    }

    // Future date check
    const selectedDateObj = new Date(serviceDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selectedDateObj > today) {
      setValidationError('La fecha no puede ser futura a la fecha actual.');
      return false;
    }

    if (!activityName.trim()) {
      setValidationError('El nombre o título de la actividad es obligatorio.');
      return false;
    }

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      setValidationError('Las horas realizadas deben ser un valor numérico mayor a cero (RNF-06).');
      return false;
    }

    const maxLimit = settings.max_hours_per_day || 8;
    if (hoursNum > maxLimit) {
      setValidationError(`Las horas ingresadas (${hoursNum}h) superan el límite diario institucional permitido (${maxLimit}h).`);
      return false;
    }

    if (!supervisorName.trim()) {
      setValidationError('El nombre del supervisor o responsable de la actividad es obligatorio.');
      return false;
    }

    if (!description.trim() || description.trim().length < 15) {
      setValidationError('Por favor describa detalladamente las actividades realizadas (mínimo 15 caracteres).');
      return false;
    }

    if (settings.require_evidence && !evidenceUrl.trim() && !evidenceName.trim()) {
      setValidationError('La institución exige adjuntar un enlace o soporte de evidencia para esta jornada.');
      return false;
    }

    return true;
  };

  const handleSave = (status: 'draft' | 'pending') => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const hoursNum = parseFloat(hours);

      const targetStudentId = (isStudent && currentStudent) ? currentStudent.id : selectedStudentId;

      if (recordToEdit) {
        // Editing existing record
        updateRecord(recordToEdit.id, {
          student_id: targetStudentId,
          service_date: serviceDate,
          activity_name: activityName.trim(),
          hours: hoursNum,
          supervisor_name: supervisorName.trim(),
          description: description.trim(),
          student_notes: studentNotes.trim() || undefined,
          evidence_url: evidenceUrl.trim() || undefined,
          evidence_name: evidenceName.trim() || undefined,
          status,
          submitted_at: status === 'pending' ? new Date().toISOString() : recordToEdit.submitted_at,
        });
      } else {
        // Adding new record
        addRecord({
          student_id: targetStudentId,
          service_date: serviceDate,
          activity_name: activityName.trim(),
          hours: hoursNum,
          supervisor_name: supervisorName.trim(),
          description: description.trim(),
          student_notes: studentNotes.trim() || undefined,
          evidence_url: evidenceUrl.trim() || undefined,
          evidence_name: evidenceName.trim() || undefined,
          status,
        });
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mock file attachment handler
  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEvidenceName(file.name);
      if (!evidenceUrl) {
        setEvidenceUrl(`https://ejemplo.edu.co/evidencias/${Date.now()}-${file.name}`);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recordToEdit ? 'Editar Jornada de Servicio' : 'Registrar Jornada de Servicio Social'}
      subtitle="Complete los campos requeridos para la validación y suma de horas comunitarias."
      maxWidth="2xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave('pending');
        }}
        className="space-y-4"
      >
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Student Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estudiante <span className="text-rose-500">*</span>
          </label>
          {isStudent && currentStudent ? (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{currentStudent.full_name}</span>
                <span className="text-slate-600 font-medium text-[11px]">
                  Código: <strong className="font-mono text-emerald-800">{currentStudent.student_code}</strong> · Grado {currentStudent.grade} ({currentStudent.group_name})
                </span>
              </div>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                ✓ Identificado automáticamente
              </span>
            </div>
          ) : (
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} — {s.student_code} ({s.grade} - {s.group_name})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Date and Hours in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de la jornada <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Horas realizadas (decimal positivo) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                step="0.5"
                min="0.5"
                max={settings.max_hours_per_day || 8}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ej. 4"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-mono font-bold"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Máximo {settings.max_hours_per_day || 8} h por jornada institucional.
            </p>
          </div>
        </div>

        {/* Activity Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Actividad o Proyecto <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="Ej. Apoyo en Biblioteca Escolar y Catalogación"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>

        {/* Supervisor Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Responsable / Supervisor de la jornada <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="Ej. Lic. Martha Delgado (Bibliotecaria) o Sr. Carlos Ruiz (Presidente JAC)"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Descripción de tareas realizadas <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describa puntualmente las actividades, beneficiarios y objetivos cumplidos durante las horas reportadas..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Student Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observaciones adicionales del estudiante (opcional)
          </label>
          <input
            type="text"
            value={studentNotes}
            onChange={(e) => setStudentNotes(e.target.value)}
            placeholder="Ej. Se anexó constancia firmada en la carpeta física de secretaría..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Evidence attachment / Link */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>Evidencia Documental (Opcional configurable)</span>
            </div>
            {settings.require_evidence && (
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Obligatorio
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Subir soporte (PDF / Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={handleSimulatedFileUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              {evidenceName && (
                <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">
                  Archivo cargado: {evidenceName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                O ingresar enlace web / Google Drive
              </label>
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {settings.allow_draft_status && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('draft')}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Guardar como Borrador
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Enviar a Revisión</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
