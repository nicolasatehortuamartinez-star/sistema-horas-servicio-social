export type UserRole = 'admin' | 'coordinator' | 'supervisor' | 'student';

export type RecordStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatar_url?: string;
  phone?: string;
  created_at: string;
}

export type AllowedStudentGrade = '9°' | '10°' | '11°';

export interface Student {
  id: string;
  profile_id?: string;
  student_code: string;
  first_names?: string;
  last_names?: string;
  full_name: string;
  email: string;
  grade: AllowedStudentGrade | string; // e.g. "9°", "10°", "11°"
  group_name: string; // e.g. "9A", "9B", "10A", "10B", "11A", "11B"
  active: boolean;
  phone?: string;
  created_at: string;
}

export interface ServiceRecord {
  id: string;
  student_id: string;
  activity_name: string;
  description: string;
  service_date: string; // YYYY-MM-DD
  hours: number;
  supervisor_id?: string;
  supervisor_name: string;
  status: RecordStatus;
  student_notes?: string;
  reviewer_notes?: string;
  evidence_url?: string;
  evidence_name?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface InstitutionSettings {
  id: string;
  institution_name: string;
  academic_year: string;
  required_hours: number; // Meta general obligatoria (ej: 80)
  grade_targets: {
    [grade: string]: number; // ej: {"10°": 40, "11°": 40}
  };
  max_hours_per_day: number; // ej: 8
  who_can_register: 'student_and_coordinator' | 'coordinator_only' | 'student_only';
  enable_supervisor_role: boolean;
  allow_draft_status: boolean;
  require_evidence: boolean;
  allow_edit_after_approval: boolean;
  updated_at: string;
  updated_by?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  entity_type: 'service_record' | 'student' | 'user' | 'institution_settings';
  entity_id: string;
  action: 'CREAR' | 'ACTUALIZAR' | 'APROBAR' | 'RECHAZAR' | 'ANULAR' | 'DESACTIVAR' | 'ACTIVAR' | 'IMPORTAR_CSV';
  details: string;
  previous_value?: Record<string, any>;
  new_value?: Record<string, any>;
  created_at: string;
}

export interface StudentProgress {
  student: Student;
  approvedHours: number;
  pendingHours: number;
  rejectedHours: number;
  draftHours: number;
  targetHours: number;
  remainingHours: number;
  progressPercentage: number;
  isCompleted: boolean;
  totalRecordsCount: number;
}
