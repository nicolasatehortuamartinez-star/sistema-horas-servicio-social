import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Profile, 
  Student, 
  ServiceRecord, 
  InstitutionSettings, 
  AuditLog, 
  UserRole, 
  RecordStatus,
  StudentProgress 
} from '../types';
import { 
  initialProfiles, 
  initialStudents, 
  initialRecords, 
  initialSettings, 
  initialAuditLogs 
} from '../data/mockData';

interface AppContextType {
  currentUser: Profile;
  currentStudent: Student | null;
  profiles: Profile[];
  students: Student[];
  records: ServiceRecord[];
  settings: InstitutionSettings;
  auditLogs: AuditLog[];
  
  // Auth & user switching
  setCurrentUser: (user: Profile) => void;
  switchUserById: (userId: string) => void;
  loginWithCredentials: (email: string, password?: string) => { success: boolean; error?: string };
  registerStudentAccount: (data: {
    first_names: string;
    last_names: string;
    student_code: string;
    email: string;
    password: string;
    grade: string;
    group_name: string;
    phone?: string;
  }) => { success: boolean; error?: string; student?: Student; profile?: Profile };
  
  // Records operations
  addRecord: (recordData: Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>) => ServiceRecord;
  updateRecord: (id: string, updates: Partial<ServiceRecord>) => void;
  submitDraftRecord: (id: string) => void;
  approveRecord: (id: string, notes?: string) => void;
  rejectRecord: (id: string, reason: string) => void;
  deleteRecord: (id: string, reason?: string) => void;
  
  // Students operations
  createStudent: (student: Omit<Student, 'id' | 'created_at'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  toggleStudentStatus: (id: string) => void;
  importStudentsCSV: (newStudents: Omit<Student, 'id' | 'created_at'>[]) => { successCount: number; errors: string[] };
  
  // Users operations
  createUser: (userData: Omit<Profile, 'id' | 'created_at'>) => Profile;
  updateUser: (id: string, updates: Partial<Profile>) => void;
  toggleUserStatus: (id: string) => void;
  
  // Settings operations
  updateSettings: (newSettings: Partial<InstitutionSettings>) => void;
  resetAllData: () => void;
  
  // Computations
  getStudentProgress: (studentId: string) => StudentProgress;
  activeStudentsProgress: StudentProgress[];
  pendingRecordsCount: number;
  totalApprovedHoursCount: number;
}

const STORAGE_KEY_PROFILES = 'ss_profiles_v1';
const STORAGE_KEY_STUDENTS = 'ss_students_v1';
const STORAGE_KEY_RECORDS = 'ss_records_v1';
const STORAGE_KEY_SETTINGS = 'ss_settings_v1';
const STORAGE_KEY_LOGS = 'ss_audit_logs_v1';
const STORAGE_KEY_USER_ID = 'ss_current_user_id_v1';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Profiles
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
      return saved ? JSON.parse(saved) : initialProfiles;
    } catch {
      return initialProfiles;
    }
  });

  // Students
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      return saved ? JSON.parse(saved) : initialStudents;
    } catch {
      return initialStudents;
    }
  });

  // Records
  const [records, setRecords] = useState<ServiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      return saved ? JSON.parse(saved) : initialRecords;
    } catch {
      return initialRecords;
    }
  });

  // Settings
  const [settings, setSettings] = useState<InstitutionSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically migrate previous default name if it had the old name
        if (parsed.institution_name === 'Institución Educativa Los Libertadores') {
          parsed.institution_name = 'I. U. C. (Instituto Universitario de Caldas)';
        }
        return parsed;
      }
      return initialSettings;
    } catch {
      return initialSettings;
    }
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : initialAuditLogs;
    } catch {
      return initialAuditLogs;
    }
  });

  // Current User (defaults to Coordinator or saved)
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_ID);
      return saved || 'usr-coord-1';
    } catch {
      return 'usr-coord-1';
    }
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER_ID, currentUserId);
  }, [currentUserId]);

  const currentUser = useMemo(() => {
    const found = profiles.find((p) => p.id === currentUserId);
    return found || profiles[0] || initialProfiles[0];
  }, [profiles, currentUserId]);

  const currentStudent = useMemo(() => {
    if (currentUser.role === 'student') {
      return students.find((s) => s.profile_id === currentUser.id || s.email === currentUser.email) || null;
    }
    return null;
  }, [currentUser, students]);

  // Helper to add audit log
  const logAction = (
    action: AuditLog['action'],
    entity_type: AuditLog['entity_type'],
    entity_id: string,
    details: string,
    previous_value?: Record<string, any>,
    new_value?: Record<string, any>
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor_id: currentUser.id,
      actor_name: currentUser.full_name,
      actor_role: currentUser.role,
      entity_type,
      entity_id,
      action,
      details,
      previous_value,
      new_value,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUserById = (userId: string) => {
    const target = profiles.find((p) => p.id === userId);
    if (target) {
      setCurrentUserId(userId);
    }
  };

  const setCurrentUser = (user: Profile) => {
    setCurrentUserId(user.id);
  };

  // Safe SHA-256 password hashing for client-side storage demo
  const hashPassword = async (rawPassword: string): Promise<string> => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(rawPassword);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {
        return btoa(`salt_${rawPassword}`);
      }
    }
    return btoa(`salt_${rawPassword}`);
  };

  const loginWithCredentials = (email: string, password?: string): { success: boolean; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    const foundProfile = profiles.find(p => p.email.toLowerCase() === normalizedEmail);

    if (!foundProfile) {
      return {
        success: false,
        error: 'No se encontró ninguna cuenta registrada con este correo electrónico.'
      };
    }

    if (!foundProfile.active) {
      return {
        success: false,
        error: 'Esta cuenta institucional se encuentra inactiva. Comuníquese con la coordinación.'
      };
    }

    // Set as active session
    setCurrentUserId(foundProfile.id);

    logAction(
      'ACTUALIZAR',
      'user',
      foundProfile.id,
      `Inicio de sesión exitoso de ${foundProfile.full_name} (${foundProfile.role})`
    );

    return { success: true };
  };

  const registerStudentAccount = (data: {
    first_names: string;
    last_names: string;
    student_code: string;
    email: string;
    password: string;
    grade: string;
    group_name: string;
    phone?: string;
  }): { success: boolean; error?: string; student?: Student; profile?: Profile } => {
    const trimmedFirst = data.first_names.trim();
    const trimmedLast = data.last_names.trim();
    const full_name = `${trimmedFirst} ${trimmedLast}`.trim();
    const normalizedCode = data.student_code.trim().toUpperCase();
    const normalizedEmail = data.email.trim().toLowerCase();
    const rawGrade = data.grade.trim();
    const rawGroup = data.group_name.trim().toUpperCase();

    // 1. Validations: names and names
    if (!trimmedFirst || !trimmedLast) {
      return { success: false, error: 'Debe ingresar sus nombres y apellidos completos.' };
    }

    // 2. Validate Code format and existence
    if (!normalizedCode || normalizedCode.length < 4) {
      return {
        success: false,
        error: 'El código estudiantil es obligatorio y debe tener al menos 4 caracteres (ej: EST-2026-015 o matrícula escolar).'
      };
    }

    // Validation against allowed grades: 9°, 10°, 11°
    const allowedGrades = ['9°', '10°', '11°'];
    const standardGrade = rawGrade.includes('°') ? rawGrade : `${rawGrade}°`;
    if (!allowedGrades.includes(standardGrade)) {
      return {
        success: false,
        error: 'El servicio social estudiantil únicamente aplica y está autorizado para grados 9°, 10° y 11°.'
      };
    }

    // Validate group
    if (!rawGroup) {
      return { success: false, error: 'Debe especificar el grupo asignado (ej: 9A, 10B, 11A).' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Ingrese un correo electrónico válido.' };
    }

    // Validate password security
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener mínimo 6 caracteres para garantizar la seguridad.' };
    }

    // 3. Prevent duplicates: check email in profiles and students
    const emailExistsInProfile = profiles.some(p => p.email.toLowerCase() === normalizedEmail);
    const emailExistsInStudents = students.some(s => s.email.toLowerCase() === normalizedEmail);
    if (emailExistsInProfile || emailExistsInStudents) {
      return {
        success: false,
        error: `El correo "${normalizedEmail}" ya está registrado en el sistema. Inicie sesión directamente.`
      };
    }

    // Check code in students
    const codeExists = students.some(s => s.student_code.toUpperCase() === normalizedCode);
    if (codeExists) {
      return {
        success: false,
        error: `El código estudiantil "${normalizedCode}" ya se encuentra registrado. Verifique con coordinación.`
      };
    }

    const now = new Date().toISOString();
    const newProfileId = `usr-stud-${Date.now()}`;
    const newStudentId = `std-${Date.now()}`;

    // Create Profile entity
    const newProfile: Profile = {
      id: newProfileId,
      full_name,
      email: normalizedEmail,
      role: 'student',
      active: true,
      phone: data.phone?.trim() || undefined,
      created_at: now,
    };

    // Create Student entity related 1:1 to Profile
    const newStudent: Student = {
      id: newStudentId,
      profile_id: newProfileId,
      student_code: normalizedCode,
      first_names: trimmedFirst,
      last_names: trimmedLast,
      full_name,
      email: normalizedEmail,
      grade: standardGrade,
      group_name: rawGroup,
      active: true,
      phone: data.phone?.trim() || undefined,
      created_at: now,
    };

    // Persist to state
    setProfiles(prev => [...prev, newProfile]);
    setStudents(prev => [...prev, newStudent]);
    setCurrentUserId(newProfile.id);

    // Secure audit log
    logAction(
      'CREAR',
      'student',
      newStudent.id,
      `Auto-registro de estudiante: ${full_name} (Cód: ${normalizedCode}, Grado: ${standardGrade} - ${rawGroup})`,
      undefined,
      { student: newStudent, profile: newProfile }
    );

    return {
      success: true,
      student: newStudent,
      profile: newProfile,
    };
  };

  // Student progress calculation (Never sum pending or rejected, RF-08, RNF-07)
  const getStudentProgress = (studentId: string): StudentProgress => {
    const student = students.find((s) => s.id === studentId) || {
      id: studentId,
      student_code: 'N/A',
      full_name: 'Estudiante no encontrado',
      email: '',
      grade: '10°',
      group_name: 'N/A',
      active: true,
      created_at: '',
    };

    const studentRecords = records.filter((r) => r.student_id === studentId);

    const approvedHours = studentRecords
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

    const pendingHours = studentRecords
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

    const rejectedHours = studentRecords
      .filter((r) => r.status === 'rejected')
      .reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

    const draftHours = studentRecords
      .filter((r) => r.status === 'draft')
      .reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

    // Target hours per grade if specified, otherwise general target
    const targetHours =
      (settings.grade_targets && settings.grade_targets[student.grade]) || settings.required_hours;

    const remainingHours = Math.max(0, targetHours - approvedHours);
    const progressPercentage = targetHours > 0 ? Math.min(100, Math.round((approvedHours / targetHours) * 100)) : 0;
    const isCompleted = approvedHours >= targetHours;

    return {
      student,
      approvedHours: Number(approvedHours.toFixed(1)),
      pendingHours: Number(pendingHours.toFixed(1)),
      rejectedHours: Number(rejectedHours.toFixed(1)),
      draftHours: Number(draftHours.toFixed(1)),
      targetHours,
      remainingHours: Number(remainingHours.toFixed(1)),
      progressPercentage,
      isCompleted,
      totalRecordsCount: studentRecords.length,
    };
  };

  const activeStudentsProgress = useMemo(() => {
    return students.filter((s) => s.active).map((s) => getStudentProgress(s.id));
  }, [students, records, settings]);

  const pendingRecordsCount = useMemo(() => {
    return records.filter((r) => r.status === 'pending').length;
  }, [records]);

  const totalApprovedHoursCount = useMemo(() => {
    return records
      .filter((r) => r.status === 'approved')
      .reduce((acc, r) => acc + (Number(r.hours) || 0), 0);
  }, [records]);

  // Record CRUD
  const addRecord = (
    recordData: Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>
  ): ServiceRecord => {
    const now = new Date().toISOString();
    const newRecord: ServiceRecord = {
      ...recordData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: now,
      updated_at: now,
      submitted_at: recordData.status === 'pending' ? now : undefined,
    };

    setRecords((prev) => [newRecord, ...prev]);

    const student = students.find((s) => s.id === newRecord.student_id);
    logAction(
      'CREAR',
      'service_record',
      newRecord.id,
      `Registro creado: ${newRecord.activity_name} (${newRecord.hours}h) para ${student?.full_name || 'estudiante'} [Estado: ${newRecord.status}]`,
      undefined,
      newRecord
    );

    return newRecord;
  };

  const updateRecord = (id: string, updates: Partial<ServiceRecord>) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updatedRecord = { ...existing, ...updates, updated_at: now };

    setRecords((prev) => prev.map((r) => (r.id === id ? updatedRecord : r)));

    logAction(
      'ACTUALIZAR',
      'service_record',
      id,
      `Actualización de jornada: ${existing.activity_name}`,
      existing,
      updatedRecord
    );
  };

  const submitDraftRecord = (id: string) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      status: 'pending' as RecordStatus,
      submitted_at: now,
      updated_at: now,
    };

    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));

    logAction(
      'ACTUALIZAR',
      'service_record',
      id,
      `Borrador enviado a revisión: ${existing.activity_name}`,
      { status: existing.status },
      { status: 'pending' }
    );
  };

  const approveRecord = (id: string, notes?: string) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: ServiceRecord = {
      ...existing,
      status: 'approved',
      reviewer_notes: notes || existing.reviewer_notes || 'Jornada aprobada satisfactoriamente.',
      reviewed_at: now,
      reviewed_by: currentUser.id,
      updated_at: now,
    };

    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));

    const student = students.find((s) => s.id === existing.student_id);
    logAction(
      'APROBAR',
      'service_record',
      id,
      `Jornada aprobada (${existing.hours}h) para ${student?.full_name || 'estudiante'}. Observación: ${updated.reviewer_notes}`,
      { status: existing.status },
      { status: 'approved', reviewer_notes: updated.reviewer_notes }
    );
  };

  const rejectRecord = (id: string, reason: string) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    const now = new Date().toISOString();
    const updated: ServiceRecord = {
      ...existing,
      status: 'rejected',
      reviewer_notes: reason,
      reviewed_at: now,
      reviewed_by: currentUser.id,
      updated_at: now,
    };

    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));

    const student = students.find((s) => s.id === existing.student_id);
    logAction(
      'RECHAZAR',
      'service_record',
      id,
      `Jornada rechazada para ${student?.full_name || 'estudiante'}. Motivo obligatorio: ${reason}`,
      { status: existing.status },
      { status: 'rejected', reviewer_notes: reason }
    );
  };

  const deleteRecord = (id: string, reason?: string) => {
    const existing = records.find((r) => r.id === id);
    if (!existing) return;

    setRecords((prev) => prev.filter((r) => r.id !== id));

    logAction(
      'ANULAR',
      'service_record',
      id,
      `Registro eliminado/anulado: ${existing.activity_name}. Motivo: ${reason || 'Acción administrativa'}`,
      existing,
      undefined
    );
  };

  // Student CRUD
  const createStudent = (studentData: Omit<Student, 'id' | 'created_at'>): Student => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    setStudents((prev) => [...prev, newStudent]);

    logAction(
      'CREAR',
      'student',
      newStudent.id,
      `Nuevo estudiante registrado: ${newStudent.full_name} (${newStudent.student_code})`,
      undefined,
      newStudent
    );

    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    const existing = students.find((s) => s.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));

    logAction(
      'ACTUALIZAR',
      'student',
      id,
      `Datos del estudiante actualizados: ${existing.full_name}`,
      existing,
      updated
    );
  };

  const toggleStudentStatus = (id: string) => {
    const existing = students.find((s) => s.id === id);
    if (!existing) return;

    const newActive = !existing.active;
    const updated = { ...existing, active: newActive };
    setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));

    logAction(
      newActive ? 'ACTIVAR' : 'DESACTIVAR',
      'student',
      id,
      `Estado del estudiante ${existing.full_name} modificado a ${newActive ? 'Activo' : 'Inactivo'}`,
      { active: existing.active },
      { active: newActive }
    );
  };

  const importStudentsCSV = (newStudentsList: Omit<Student, 'id' | 'created_at'>[]) => {
    const errors: string[] = [];
    const validToAdd: Student[] = [];
    const existingCodes = new Set(students.map((s) => s.student_code.toLowerCase().trim()));

    for (const item of newStudentsList) {
      const codeTrimmed = item.student_code.trim();
      if (!codeTrimmed) {
        errors.push(`Fila con nombre "${item.full_name}": El código del estudiante es obligatorio.`);
        continue;
      }
      if (existingCodes.has(codeTrimmed.toLowerCase())) {
        errors.push(`Código duplicado: "${codeTrimmed}" ya existe en el sistema.`);
        continue;
      }
      if (!item.full_name.trim()) {
        errors.push(`El estudiante con código "${codeTrimmed}" no tiene nombre completo.`);
        continue;
      }

      existingCodes.add(codeTrimmed.toLowerCase());
      validToAdd.push({
        ...item,
        id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString(),
      });
    }

    if (validToAdd.length > 0) {
      setStudents((prev) => [...prev, ...validToAdd]);
      logAction(
        'IMPORTAR_CSV',
        'student',
        'batch-import',
        `Importación por CSV exitosa: ${validToAdd.length} estudiantes agregados. ${errors.length} descartados por errores.`
      );
    }

    return {
      successCount: validToAdd.length,
      errors,
    };
  };

  // User CRUD
  const createUser = (userData: Omit<Profile, 'id' | 'created_at'>): Profile => {
    const newUser: Profile = {
      ...userData,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    setProfiles((prev) => [...prev, newUser]);

    logAction(
      'CREAR',
      'user',
      newUser.id,
      `Usuario creado: ${newUser.full_name} (${newUser.role})`,
      undefined,
      newUser
    );

    return newUser;
  };

  const updateUser = (id: string, updates: Partial<Profile>) => {
    const existing = profiles.find((p) => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates };
    setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));

    logAction('ACTUALIZAR', 'user', id, `Usuario modificado: ${existing.full_name}`, existing, updated);
  };

  const toggleUserStatus = (id: string) => {
    const existing = profiles.find((p) => p.id === id);
    if (!existing) return;

    const newActive = !existing.active;
    const updated = { ...existing, active: newActive };
    setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));

    logAction(
      newActive ? 'ACTIVAR' : 'DESACTIVAR',
      'user',
      id,
      `Cuenta de usuario ${existing.full_name} ${newActive ? 'activada' : 'desactivada'}`
    );
  };

  // Settings
  const updateSettings = (newSettingsData: Partial<InstitutionSettings>) => {
    const updated = {
      ...settings,
      ...newSettingsData,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.full_name,
    };
    const prev = settings;
    setSettings(updated);

    logAction(
      'ACTUALIZAR',
      'institution_settings',
      updated.id,
      `Parámetros institucionales actualizados por ${currentUser.full_name}`,
      prev,
      updated
    );
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY_PROFILES);
    localStorage.removeItem(STORAGE_KEY_STUDENTS);
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_SETTINGS);
    localStorage.removeItem(STORAGE_KEY_LOGS);
    localStorage.removeItem(STORAGE_KEY_USER_ID);

    setProfiles(initialProfiles);
    setStudents(initialStudents);
    setRecords(initialRecords);
    setSettings(initialSettings);
    setAuditLogs(initialAuditLogs);
    setCurrentUserId('usr-coord-1');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentStudent,
        profiles,
        students,
        records,
        settings,
        auditLogs,
        setCurrentUser,
        switchUserById,
        loginWithCredentials,
        registerStudentAccount,
        addRecord,
        updateRecord,
        submitDraftRecord,
        approveRecord,
        rejectRecord,
        deleteRecord,
        createStudent,
        updateStudent,
        toggleStudentStatus,
        importStudentsCSV,
        createUser,
        updateUser,
        toggleUserStatus,
        updateSettings,
        resetAllData,
        getStudentProgress,
        activeStudentsProgress,
        pendingRecordsCount,
        totalApprovedHoursCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
