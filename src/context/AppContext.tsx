import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  Profile,
  Student,
  ServiceRecord,
  InstitutionSettings,
  AuditLog,
  StudentProgress,
} from '../types';

export interface RegisterStudentPayload {
  first_names: string;
  last_names: string;
  student_code: string;
  email: string;
  password: string;
  grade: string;
  group_name: string;
  phone?: string;
}

export interface CompleteGoogleStudentPayload {
  first_names: string;
  last_names: string;
  student_code: string;
  grade: string;
  group_name: string;
  phone?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

interface AppContextType {
  firebaseUser: User | null;
  authLoading: boolean;
  needsRegistration: boolean;
  hasAnyAdmin: boolean;
  authError: string | null;
  currentUser: Profile | null;
  currentStudent: Student | null;
  profiles: Profile[];
  students: Student[];
  records: ServiceRecord[];
  settings: InstitutionSettings;
  auditLogs: AuditLog[];

  // Auth operations
  loginWithCredentials: (email: string, password: string) => Promise<ActionResult>;
  loginWithGoogle: () => Promise<ActionResult>;
  registerStudentAccount: (
    data: RegisterStudentPayload
  ) => Promise<ActionResult & { student?: Student; profile?: Profile }>;
  completeStudentRegistration: (data: CompleteGoogleStudentPayload) => Promise<ActionResult>;
  bootstrapFirstAdmin: (fullName: string, phone?: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  refreshDashboard: () => Promise<void>;

  // Records operations
  addRecord: (
    recordData: Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<ServiceRecord>;
  updateRecord: (id: string, updates: Partial<ServiceRecord>) => Promise<void>;
  submitDraftRecord: (id: string) => Promise<void>;
  approveRecord: (id: string, notes?: string) => Promise<void>;
  rejectRecord: (id: string, reason: string) => Promise<void>;
  deleteRecord: (id: string, reason?: string) => Promise<void>;

  // Students operations
  createStudent: (student: Omit<Student, 'id' | 'created_at'>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  toggleStudentStatus: (id: string) => Promise<void>;
  importStudentsCSV: (
    newStudents: Omit<Student, 'id' | 'created_at'>[]
  ) => Promise<{ successCount: number; errors: string[] }>;

  // Users operations
  createUser: (userData: Omit<Profile, 'id' | 'created_at'>) => Promise<Profile>;
  updateUser: (id: string, updates: Partial<Profile>) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;

  // Settings operations
  updateSettings: (newSettings: Partial<InstitutionSettings>) => Promise<void>;

  // Computations
  getStudentProgress: (studentId: string) => StudentProgress;
  activeStudentsProgress: StudentProgress[];
  pendingRecordsCount: number;
  totalApprovedHoursCount: number;
}

const DEFAULT_SETTINGS: InstitutionSettings = {
  id: 'default',
  institution_name: 'I. U. C. (Instituto Universitario de Caldas)',
  academic_year: '2026',
  required_hours: 80,
  grade_targets: {
    '9°': 80,
    '10°': 80,
    '11°': 80,
  },
  max_hours_per_day: 8,
  who_can_register: 'student_and_coordinator',
  enable_supervisor_role: true,
  allow_draft_status: true,
  require_evidence: false,
  allow_edit_after_approval: false,
  require_pre_registered_code: false,
  allowed_email_domain: '',
  updated_at: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con correo y contraseña aún no está habilitado en Firebase Authentication. Puede activarlo en Firebase Console → Authentication → Sign-in method, o ingresar de inmediato usando «Continuar con Google».';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya tiene una cuenta creada. Inicie sesión directamente.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifique sus credenciales o cree su cuenta si es estudiante nuevo.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil. Use mínimo 6 caracteres.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico no es válido.';
    case 'auth/popup-closed-by-user':
      return 'Se cerró la ventana de autenticación con Google antes de completar el ingreso.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana emergente de Google. Permita ventanas emergentes e intente de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espere unos minutos antes de volver a intentarlo.';
    default:
      return error?.message || 'Ocurrió un error al autenticar la cuenta.';
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [needsRegistration, setNeedsRegistration] = useState<boolean>(false);
  const [hasAnyAdmin, setHasAnyAdmin] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [settings, setSettings] = useState<InstitutionSettings>(DEFAULT_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No hay una sesión autenticada activa.');
    }
    const token = await user.getIdToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Error en la solicitud (${res.status})`);
    }
    return data;
  }, []);

  const loadPublicSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/public/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (typeof data.hasAnyAdmin === 'boolean') setHasAnyAdmin(data.hasAnyAdmin);
      }
    } catch (err) {
      console.error('Error fetching public settings:', err);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (!auth.currentUser) return;
    const data = await authFetch('/api/dashboard');
    if (data.settings) setSettings(data.settings);
    setStudents(data.students || []);
    setRecords(data.records || []);
    setProfiles(data.profiles || []);
    setAuditLogs(data.auditLogs || []);
  }, [authFetch]);

  const syncAuthenticatedSession = useCallback(
    async (fbUser: User) => {
      setAuthError(null);
      try {
        const token = await fbUser.getIdToken();
        const res = await fetch('/api/bootstrap', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setAuthError(data.error || 'No se pudo cargar el perfil institucional.');
          setCurrentUser(null);
          setCurrentStudent(null);
          setNeedsRegistration(false);
          return;
        }

        if (data.settings) setSettings(data.settings);
        if (typeof data.hasAnyAdmin === 'boolean') setHasAnyAdmin(data.hasAnyAdmin);

        if (data.needsRegistration || !data.profile) {
          setCurrentUser(null);
          setCurrentStudent(null);
          setNeedsRegistration(true);
          setProfiles([]);
          setStudents([]);
          setRecords([]);
          setAuditLogs([]);
          return;
        }

        setCurrentUser(data.profile);
        setCurrentStudent(data.student || null);
        setNeedsRegistration(false);

        await refreshDashboard();
      } catch (err: any) {
        console.error('Error bootstrapping session:', err);
        setAuthError(err?.message || 'Error de conexión con el servidor.');
      }
    },
    [refreshDashboard]
  );

  useEffect(() => {
    loadPublicSettings();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setCurrentUser(null);
        setCurrentStudent(null);
        setNeedsRegistration(false);
        setProfiles([]);
        setStudents([]);
        setRecords([]);
        setAuditLogs([]);
        setAuthLoading(false);
        loadPublicSettings();
        return;
      }

      setAuthLoading(true);
      await syncAuthenticatedSession(fbUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [loadPublicSettings, syncAuthenticatedSession]);

  // Auth actions
  const loginWithCredentials = async (email: string, password: string): Promise<ActionResult> => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (error: any) {
      const msg = mapFirebaseAuthError(error);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const loginWithGoogle = async (): Promise<ActionResult> => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      return { success: true };
    } catch (error: any) {
      const msg = mapFirebaseAuthError(error);
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const registerStudentAccount = async (
    data: RegisterStudentPayload
  ): Promise<ActionResult & { student?: Student; profile?: Profile }> => {
    setAuthError(null);
    let createdFirebaseUser: User | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        data.email.trim(),
        data.password
      );
      createdFirebaseUser = cred.user;
      const token = await cred.user.getIdToken();

      const res = await fetch('/api/auth/register-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_names: data.first_names,
          last_names: data.last_names,
          student_code: data.student_code,
          email: data.email.trim().toLowerCase(),
          grade: data.grade,
          group_name: data.group_name,
          phone: data.phone,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Rollback Firebase Auth user if PostgreSQL validation failed
        try {
          await cred.user.delete();
        } catch {
          await signOut(auth);
        }
        return {
          success: false,
          error: body.error || 'No se pudo completar el registro en la base de datos.',
        };
      }

      await syncAuthenticatedSession(cred.user);
      return {
        success: true,
        profile: body.profile,
        student: body.student,
      };
    } catch (error: any) {
      if (createdFirebaseUser) {
        try {
          await createdFirebaseUser.delete();
        } catch {
          await signOut(auth);
        }
      }
      return {
        success: false,
        error: mapFirebaseAuthError(error),
      };
    }
  };

  const completeStudentRegistration = async (
    data: CompleteGoogleStudentPayload
  ): Promise<ActionResult> => {
    if (!auth.currentUser) {
      return { success: false, error: 'Debe iniciar sesión primero.' };
    }
    try {
      await authFetch('/api/auth/register-student', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          email: auth.currentUser.email,
        }),
      });
      await syncAuthenticatedSession(auth.currentUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const bootstrapFirstAdmin = async (fullName: string, phone?: string): Promise<ActionResult> => {
    if (!auth.currentUser) {
      return { success: false, error: 'Debe iniciar sesión primero.' };
    }
    try {
      await authFetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        body: JSON.stringify({ full_name: fullName, phone }),
      });
      await syncAuthenticatedSession(auth.currentUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentStudent(null);
    setNeedsRegistration(false);
    setAuthError(null);
  };

  // Student progress calculation (RF-08, RNF-07: Never sum pending or rejected)
  const getStudentProgress = useCallback(
    (studentId: string): StudentProgress => {
      const student = students.find((s) => s.id === studentId) || {
        id: studentId,
        student_code: 'N/A',
        full_name: 'Estudiante',
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

      const rawTarget =
        (settings.grade_targets && settings.grade_targets[student.grade]) || settings.required_hours || 80;
      const targetHours = Math.min(80, rawTarget);

      const remainingHours = Math.max(0, targetHours - approvedHours);
      const progressPercentage =
        targetHours > 0 ? Math.min(100, Math.round((approvedHours / targetHours) * 100)) : 0;
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
    },
    [students, records, settings]
  );

  const activeStudentsProgress = useMemo(() => {
    return students.filter((s) => s.active).map((s) => getStudentProgress(s.id));
  }, [students, getStudentProgress]);

  const pendingRecordsCount = useMemo(() => {
    return records.filter((r) => r.status === 'pending').length;
  }, [records]);

  const totalApprovedHoursCount = useMemo(() => {
    return Number(
      records
        .filter((r) => r.status === 'approved')
        .reduce((acc, r) => acc + (Number(r.hours) || 0), 0)
        .toFixed(1)
    );
  }, [records]);

  // Record CRUD
  const addRecord = async (
    recordData: Omit<ServiceRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceRecord> => {
    const created: ServiceRecord = await authFetch('/api/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
    await refreshDashboard();
    return created;
  };

  const updateRecord = async (id: string, updates: Partial<ServiceRecord>) => {
    await authFetch(`/api/records/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await refreshDashboard();
  };

  const submitDraftRecord = async (id: string) => {
    await authFetch(`/api/records/${id}/submit`, {
      method: 'POST',
    });
    await refreshDashboard();
  };

  const approveRecord = async (id: string, notes?: string) => {
    await authFetch(`/api/records/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshDashboard();
  };

  const rejectRecord = async (id: string, reason: string) => {
    await authFetch(`/api/records/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    await refreshDashboard();
  };

  const deleteRecord = async (id: string, reason?: string) => {
    await authFetch(`/api/records/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
    await refreshDashboard();
  };

  // Student CRUD
  const createStudent = async (
    studentData: Omit<Student, 'id' | 'created_at'>
  ): Promise<Student> => {
    const created: Student = await authFetch('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
    await refreshDashboard();
    return created;
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    await authFetch(`/api/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await refreshDashboard();
  };

  const toggleStudentStatus = async (id: string) => {
    await authFetch(`/api/students/${id}/toggle`, {
      method: 'POST',
    });
    await refreshDashboard();
  };

  const importStudentsCSV = async (
    newStudentsList: Omit<Student, 'id' | 'created_at'>[]
  ): Promise<{ successCount: number; errors: string[] }> => {
    const result = await authFetch('/api/students/import-csv', {
      method: 'POST',
      body: JSON.stringify({ students: newStudentsList }),
    });
    await refreshDashboard();
    return {
      successCount: result.successCount || 0,
      errors: result.errors || [],
    };
  };

  // User CRUD
  const createUser = async (userData: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> => {
    const created: Profile = await authFetch('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    await refreshDashboard();
    return created;
  };

  const updateUser = async (id: string, updates: Partial<Profile>) => {
    await authFetch(`/api/profiles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    await refreshDashboard();
  };

  const toggleUserStatus = async (id: string) => {
    await authFetch(`/api/profiles/${id}/toggle`, {
      method: 'POST',
    });
    await refreshDashboard();
  };

  // Settings
  const updateSettings = async (newSettingsData: Partial<InstitutionSettings>) => {
    const updated: InstitutionSettings = await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettingsData),
    });
    setSettings(updated);
    await refreshDashboard();
  };

  return (
    <AppContext.Provider
      value={{
        firebaseUser,
        authLoading,
        needsRegistration,
        hasAnyAdmin,
        authError,
        currentUser,
        currentStudent,
        profiles,
        students,
        records,
        settings,
        auditLogs,
        loginWithCredentials,
        loginWithGoogle,
        registerStudentAccount,
        completeStudentRegistration,
        bootstrapFirstAdmin,
        logout,
        refreshDashboard,
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
