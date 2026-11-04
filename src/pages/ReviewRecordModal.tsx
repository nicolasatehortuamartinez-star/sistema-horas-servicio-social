import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { ServiceRecord } from '../types';
import { StatusBadge } from '../components/common/Badge';
import { formatDate, formatHours } from '../utils/helpers';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  ExternalLink, 
  AlertCircle, 
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

interface ReviewRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ServiceRecord | null;
}

export const ReviewRecordModal: React.FC<ReviewRecordModalProps> = ({
  isOpen,
  onClose,
  record,
}) => {
  const { students, approveRecord, rejectRecord, currentUser } = useApp();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);

  if (!record) return null;

  const student = students.find((s) => s.id === record.student_id);
  const isPending = record.status === 'pending';

  const handleApprove = () => {
    approveRecord(record.id, 'Jornada verificada y aprobada por coordinación.');
    setConfirmApprove(false);
    onClose();
  };

  const handleReject = () => {
    setErrorMsg('');
    if (!rejectReason.trim() || rejectReason.trim().length < 8) {
      setErrorMsg('Requerimiento RF-06: Es obligatorio escribir una observación clara (mínimo 8 caracteres) que explique qué debe corregir el estudiante.');
      return;
    }

    rejectRecord(record.id, rejectReason.trim());
    setShowRejectInput(false);
    setRejectReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowRejectInput(false);
        setConfirmApprove(false);
        setErrorMsg('');
        onClose();
      }}
      title="Revisión y Validación de Jornada"
      subtitle={`Registro #${record.id.slice(-6).toUpperCase()} · Creado el ${formatDate(record.created_at)}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Student card header */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{student?.full_name || 'Estudiante'}</h4>
              <p className="text-xs text-slate-500">
                Código: <span className="font-mono font-semibold text-slate-700">{student?.student_code}</span> · Grado {student?.grade} ({student?.group_name})
              </p>
            </div>
          </div>
          <div>
            <StatusBadge status={record.status} size="lg" />
          </div>
        </div>

        {/* Activity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
            <span className="text-slate-400 font-medium block mb-1">Fecha de Ejecución</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{formatDate(record.service_date)}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
            <span className="text-slate-400 font-medium block mb-1">Horas Solicitadas</span>
            <div className="flex items-center gap-1.5 font-bold text-emerald-700 font-mono text-sm">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{formatHours(record.hours)}</span>
            </div>
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
            <span className="text-slate-400 font-medium block mb-1">Actividad / Proyecto</span>
            <p className="font-bold text-slate-800 text-sm">{record.activity_name}</p>
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
            <span className="text-slate-400 font-medium block mb-1">Supervisor o Responsable en la Comunidad</span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <User className="w-4 h-4 text-slate-500" />
              <span>{record.supervisor_name}</span>
            </div>
          </div>

          <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
            <span className="text-slate-400 font-medium block mb-1">Descripción de Labores</span>
            <p className="text-slate-700 leading-relaxed text-xs">{record.description}</p>
          </div>

          {record.student_notes && (
            <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
              <span className="text-slate-400 font-medium block mb-1">Notas del Estudiante</span>
              <p className="text-slate-600 italic text-xs">"{record.student_notes}"</p>
            </div>
          )}
        </div>

        {/* Evidence preview / links */}
        {(record.evidence_url || record.evidence_name) && (
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Evidencia o Soporte Adjunto</span>
              </div>
              {record.evidence_url && (
                <a
                  href={record.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 underline"
                >
                  <span>Abrir enlace externo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {record.evidence_name && (
              <p className="text-xs text-blue-700 mt-1 font-mono">
                Archivo: {record.evidence_name}
              </p>
            )}
          </div>
        )}

        {/* Existing review notes if already reviewed */}
        {record.reviewer_notes && (
          <div className={`p-4 rounded-xl border text-xs ${
            record.status === 'rejected'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <span className="font-bold block mb-1">
              Observaciones de Revisión ({record.reviewed_at ? formatDate(record.reviewed_at) : ''}):
            </span>
            <p className="leading-relaxed">{record.reviewer_notes}</p>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Rejection Form Box (RF-06: Obligatorio explicar qué corregir) */}
        {showRejectInput && (
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-300 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Motivo Obligatorio del Rechazo (RF-06)</span>
            </div>
            <p className="text-[11px] text-rose-700">
              Especifique con claridad el motivo por el cual no se aprueban estas horas (por ejemplo: falta firma del supervisor, número de horas no concordante, evidencia ilegible o fuera de plazo).
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Escriba aquí la observación para el estudiante..."
              className="w-full p-2.5 text-xs rounded-xl border border-rose-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 text-slate-800"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectInput(false);
                  setRejectReason('');
                  setErrorMsg('');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        )}

        {/* Approve confirmation alert */}
        {confirmApprove && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2 animate-in fade-in">
            <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ¿Confirmar aprobación de {record.hours} horas para {student?.full_name}?
            </h5>
            <p className="text-[11px] text-emerald-700">
              Esta acción actualizará el saldo oficial de horas aprobadas del estudiante.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmApprove(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
              >
                Sí, Aprobar Horas
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Volver a la lista
          </button>

          {/* If the current user has permission to review (coordinator, admin, supervisor) */}
          {(currentUser.role === 'coordinator' || currentUser.role === 'admin' || currentUser.role === 'supervisor') && !showRejectInput && !confirmApprove && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectInput(true);
                  setConfirmApprove(false);
                }}
                className="px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Rechazar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfirmApprove(true);
                  setShowRejectInput(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobar Horas</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
