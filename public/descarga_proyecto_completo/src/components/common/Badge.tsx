import React from 'react';
import { RecordStatus, UserRole } from '../../types';
import { CheckCircle2, Clock, XCircle, FileEdit, Shield, UserCheck, GraduationCap, Users } from 'lucide-react';

interface StatusBadgeProps {
  status: RecordStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  switch (status) {
    case 'approved':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${sizeClasses[size]}`}
          title="Horas aprobadas oficialmente"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          Aprobada
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${sizeClasses[size]}`}
          title="En espera de revisión por el coordinador"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
          Pendiente
        </span>
      );
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 ${sizeClasses[size]}`}
          title="Jornada rechazada. Requiere corrección o no válida"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          Rechazada
        </span>
      );
    case 'draft':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${sizeClasses[size]}`}
          title="Borrador no enviado a revisión todavía"
        >
          <FileEdit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          Borrador
        </span>
      );
    default:
      return null;
  }
};

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  switch (role) {
    case 'admin':
      return (
        <span className={`inline-flex items-center rounded-md bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses[size]}`}>
          <Shield className="w-3 h-3 text-purple-600" />
          Administrador
        </span>
      );
    case 'coordinator':
      return (
        <span className={`inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}>
          <UserCheck className="w-3 h-3 text-blue-600" />
          Coordinador
        </span>
      );
    case 'supervisor':
      return (
        <span className={`inline-flex items-center rounded-md bg-teal-50 text-teal-700 border border-teal-200 ${sizeClasses[size]}`}>
          <Users className="w-3 h-3 text-teal-600" />
          Docente Supervisor
        </span>
      );
    case 'student':
      return (
        <span className={`inline-flex items-center rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses[size]}`}>
          <GraduationCap className="w-3 h-3 text-indigo-600" />
          Estudiante
        </span>
      );
    default:
      return null;
  }
};
