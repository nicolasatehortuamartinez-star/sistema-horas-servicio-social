import { and, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  auditLogs,
  institutionSettings,
  profiles,
  serviceRecords,
  students,
} from './schema.ts';
import type {
  AuditLog,
  InstitutionSettings,
  Profile,
  RecordStatus,
  ServiceRecord,
  Student,
  UserRole,
} from '../types/index.ts';

export const ALLOWED_GRADES = ['9°', '10°', '11°'] as const;
export const MAX_SOCIAL_SERVICE_HOURS = 80;

export function normalizeGrade(raw: string): string {
  const cleaned = raw.trim().replace(/º/g, '°');
  return cleaned.includes('°') ? cleaned : `${cleaned}°`;
}

export function validateTarjetaIdentidad(raw: unknown): {
  valid: boolean;
  value: string;
  error?: string;
} {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/[\s.]/g, '');
  if (!cleaned) {
    return {
      valid: false,
      value: '',
      error: 'La Tarjeta de Identidad (código estudiantil) es obligatoria.',
    };
  }
  if (!/^\d{6,12}$/.test(cleaned)) {
    return {
      valid: false,
      value: cleaned,
      error:
        'La Tarjeta de Identidad debe contener únicamente entre 6 y 12 dígitos numéricos (sin letras, guiones ni símbolos).',
    };
  }
  return { valid: true, value: cleaned };
}

export function getEffectiveTargetHours(
  grade: string,
  settings: Pick<InstitutionSettings, 'grade_targets' | 'required_hours'>
): number {
  const rawTarget = Number(settings.grade_targets?.[grade] ?? settings.required_hours ?? MAX_SOCIAL_SERVICE_HOURS);
  if (isNaN(rawTarget) || rawTarget <= 0) return MAX_SOCIAL_SERVICE_HOURS;
  return Math.min(MAX_SOCIAL_SERVICE_HOURS, rawTarget);
}

export async function getStudentHoursUsage(studentId: number, excludeRecordId?: number) {
  const rows = await db
    .select({
      id: serviceRecords.id,
      hours: serviceRecords.hours,
      status: serviceRecords.status,
    })
    .from(serviceRecords)
    .where(eq(serviceRecords.studentId, studentId));

  let approvedHours = 0;
  let pendingHours = 0;

  for (const r of rows) {
    if (excludeRecordId !== undefined && r.id === excludeRecordId) continue;
    const h = Number(r.hours) || 0;
    if (r.status === 'approved') approvedHours += h;
    else if (r.status === 'pending') pendingHours += h;
  }

  return {
    approvedHours: Number(approvedHours.toFixed(1)),
    pendingHours: Number(pendingHours.toFixed(1)),
  };
}

// Serializers to keep frontend string IDs & snake_case DTOs consistent
export function serializeProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: String(row.id),
    full_name: row.fullName,
    email: row.email,
    role: row.role as UserRole,
    active: row.active,
    avatar_url: row.avatarUrl ?? undefined,
    phone: row.phone ?? undefined,
    created_at: row.createdAt.toISOString(),
  };
}

export function serializeStudent(row: typeof students.$inferSelect): Student {
  return {
    id: String(row.id),
    profile_id: row.profileId != null ? String(row.profileId) : undefined,
    student_code: row.studentCode,
    first_names: row.firstNames || undefined,
    last_names: row.lastNames || undefined,
    full_name: row.fullName,
    email: row.email,
    grade: row.grade,
    group_name: row.groupName,
    active: row.active,
    phone: row.phone ?? undefined,
    created_at: row.createdAt.toISOString(),
  };
}

export function serializeRecord(row: typeof serviceRecords.$inferSelect): ServiceRecord {
  return {
    id: String(row.id),
    student_id: String(row.studentId),
    activity_name: row.activityName,
    description: row.description,
    service_date: row.serviceDate,
    hours: Number(row.hours),
    supervisor_id: row.supervisorId != null ? String(row.supervisorId) : undefined,
    supervisor_name: row.supervisorName,
    status: row.status as RecordStatus,
    student_notes: row.studentNotes ?? undefined,
    reviewer_notes: row.reviewerNotes ?? undefined,
    evidence_url: row.evidenceUrl ?? undefined,
    evidence_name: row.evidenceName ?? undefined,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    submitted_at: row.submittedAt ? row.submittedAt.toISOString() : undefined,
    reviewed_at: row.reviewedAt ? row.reviewedAt.toISOString() : undefined,
    reviewed_by: row.reviewedBy != null ? String(row.reviewedBy) : undefined,
  };
}

export function serializeSettings(row: typeof institutionSettings.$inferSelect): InstitutionSettings {
  return {
    id: row.id,
    institution_name: row.institutionName,
    academic_year: row.academicYear,
    required_hours: Math.min(MAX_SOCIAL_SERVICE_HOURS, Number(row.requiredHours) || MAX_SOCIAL_SERVICE_HOURS),
    grade_targets: row.gradeTargets || { '9°': 80, '10°': 80, '11°': 80 },
    max_hours_per_day: Number(row.maxHoursPerDay),
    who_can_register: row.whoCanRegister as InstitutionSettings['who_can_register'],
    enable_supervisor_role: row.enableSupervisorRole,
    allow_draft_status: row.allowDraftStatus,
    require_evidence: row.requireEvidence,
    allow_edit_after_approval: row.allowEditAfterApproval,
    require_pre_registered_code: row.requirePreRegisteredCode,
    allowed_email_domain: row.allowedEmailDomain,
    updated_at: row.updatedAt.toISOString(),
    updated_by: row.updatedBy ?? undefined,
  };
}

export function serializeAuditLog(row: typeof auditLogs.$inferSelect): AuditLog {
  return {
    id: String(row.id),
    actor_id: row.actorId,
    actor_name: row.actorName,
    actor_role: row.actorRole as UserRole,
    entity_type: row.entityType as AuditLog['entity_type'],
    entity_id: row.entityId,
    action: row.action as AuditLog['action'],
    details: row.details,
    previous_value: (row.previousValue as Record<string, any>) ?? undefined,
    new_value: (row.newValue as Record<string, any>) ?? undefined,
    created_at: row.createdAt.toISOString(),
  };
}

export async function getOrCreateSettings(): Promise<InstitutionSettings> {
  try {
    const existing = await db
      .select()
      .from(institutionSettings)
      .where(eq(institutionSettings.id, 'default'))
      .limit(1);

    if (existing.length > 0) {
      return serializeSettings(existing[0]);
    }

    const inserted = await db
      .insert(institutionSettings)
      .values({
        id: 'default',
        institutionName: 'I. U. C. (Instituto Universitario de Caldas)',
        academicYear: '2026',
        requiredHours: 80,
        gradeTargets: { '9°': 80, '10°': 80, '11°': 80 },
        maxHoursPerDay: 8,
        whoCanRegister: 'student_and_coordinator',
        enableSupervisorRole: true,
        allowDraftStatus: true,
        requireEvidence: false,
        allowEditAfterApproval: false,
        requirePreRegisteredCode: false,
        allowedEmailDomain: '',
      })
      .onConflictDoNothing()
      .returning();

    if (inserted.length > 0) {
      return serializeSettings(inserted[0]);
    }

    const retry = await db
      .select()
      .from(institutionSettings)
      .where(eq(institutionSettings.id, 'default'))
      .limit(1);

    return serializeSettings(retry[0]);
  } catch (error) {
    console.error('Database error in getOrCreateSettings:', error);
    throw new Error('No se pudieron cargar los parámetros institucionales.', { cause: error });
  }
}

export async function hasAnyAdminProfile(): Promise<boolean> {
  try {
    const res = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.role, 'admin'));
    return (res[0]?.count ?? 0) > 0;
  } catch (error) {
    console.error('Database error in hasAnyAdminProfile:', error);
    throw new Error('Error al verificar la configuración inicial.', { cause: error });
  }
}

export async function findAndSyncProfileByAuth(uid: string, email?: string) {
  try {
    const byUid = await db.select().from(profiles).where(eq(profiles.uid, uid)).limit(1);
    if (byUid.length > 0) {
      return byUid[0];
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const byEmailUnlinked = await db
        .select()
        .from(profiles)
        .where(and(ilike(profiles.email, normalizedEmail), isNull(profiles.uid)))
        .limit(1);

      if (byEmailUnlinked.length > 0) {
        const updated = await db
          .update(profiles)
          .set({ uid })
          .where(and(eq(profiles.id, byEmailUnlinked[0].id), isNull(profiles.uid)))
          .returning();
        return updated[0] ?? byEmailUnlinked[0];
      }
    }

    return null;
  } catch (error) {
    console.error('Database error in findAndSyncProfileByAuth:', error);
    throw new Error('Error al consultar la cuenta del usuario.', { cause: error });
  }
}

export async function getStudentByProfileId(profileId: number) {
  try {
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.profileId, profileId))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database error in getStudentByProfileId:', error);
    throw new Error('Error al consultar el perfil estudiantil.', { cause: error });
  }
}

export async function createAuditEntry(entry: {
  actorId: string;
  actorName: string;
  actorRole: string;
  entityType: string;
  entityId: string;
  action: string;
  details: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}) {
  try {
    await db.insert(auditLogs).values({
      actorId: entry.actorId,
      actorName: entry.actorName,
      actorRole: entry.actorRole,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      details: entry.details,
      previousValue: entry.previousValue ?? null,
      newValue: entry.newValue ?? null,
    });
  } catch (error) {
    console.error('Database error in createAuditEntry:', error);
    throw new Error('No se pudo registrar la traza de auditoría.', { cause: error });
  }
}

export async function registerStudentAccountInDb(params: {
  uid: string;
  email: string;
  firstNames: string;
  lastNames: string;
  studentCode: string;
  grade: string;
  groupName: string;
  phone?: string;
}) {
  try {
    const normalizedEmail = params.email.trim().toLowerCase();
    const tiCheck = validateTarjetaIdentidad(params.studentCode);
    if (!tiCheck.valid) {
      return {
        error: tiCheck.error!,
        status: 400 as const,
      };
    }
    const normalizedCode = tiCheck.value;
    const standardGrade = normalizeGrade(params.grade);
    const normalizedGroup = params.groupName.trim().toUpperCase();
    const fullName = `${params.firstNames.trim()} ${params.lastNames.trim()}`.trim();

    if (!ALLOWED_GRADES.includes(standardGrade as (typeof ALLOWED_GRADES)[number])) {
      return {
        error: 'El servicio social estudiantil únicamente aplica y está autorizado para grados 9°, 10° y 11°.',
        status: 400 as const,
      };
    }

    const currentSettings = await getOrCreateSettings();

    if (currentSettings.allowed_email_domain?.trim()) {
      const domain = currentSettings.allowed_email_domain.trim().toLowerCase().replace(/^@/, '');
      if (!normalizedEmail.endsWith(`@${domain}`)) {
        return {
          error: `El correo electrónico debe pertenecer al dominio institucional autorizado (@${domain}).`,
          status: 403 as const,
        };
      }
    }

    return await db.transaction(async (tx) => {
      // Check if Firebase UID or email already exists in profiles
      const existingProfileByUid = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.uid, params.uid))
        .limit(1);
      if (existingProfileByUid.length > 0) {
        return {
          error: 'Esta cuenta de autenticación ya tiene un perfil registrado en el sistema.',
          status: 409 as const,
        };
      }

      const existingProfileByEmail = await tx
        .select()
        .from(profiles)
        .where(ilike(profiles.email, normalizedEmail))
        .limit(1);
      if (existingProfileByEmail.length > 0) {
        return {
          error: `El correo "${normalizedEmail}" ya está registrado en el sistema. Inicie sesión directamente.`,
          status: 409 as const,
        };
      }

      // Check student_code
      const existingStudentByCode = await tx
        .select()
        .from(students)
        .where(ilike(students.studentCode, normalizedCode))
        .limit(1);

      if (existingStudentByCode.length > 0) {
        const existingStudent = existingStudentByCode[0];
        if (existingStudent.profileId != null) {
          return {
            error: `La Tarjeta de Identidad "${normalizedCode}" ya se encuentra vinculada a otra cuenta activa.`,
            status: 409 as const,
          };
        }

        // Pre-registered student row exists without an account: verify & link 1:1
        if (
          existingStudent.email &&
          existingStudent.email.toLowerCase() !== normalizedEmail
        ) {
          return {
            error:
              'La Tarjeta de Identidad está pre-registrada con un correo distinto. Contacte a coordinación para verificar su identidad.',
            status: 403 as const,
          };
        }

        const [createdProfile] = await tx
          .insert(profiles)
          .values({
            uid: params.uid,
            fullName,
            email: normalizedEmail,
            role: 'student',
            active: true,
            phone: params.phone?.trim() || existingStudent.phone || null,
          })
          .returning();

        const [updatedStudent] = await tx
          .update(students)
          .set({
            profileId: createdProfile.id,
            firstNames: params.firstNames.trim(),
            lastNames: params.lastNames.trim(),
            fullName,
            email: normalizedEmail,
            grade: standardGrade,
            groupName: normalizedGroup,
            phone: params.phone?.trim() || existingStudent.phone || null,
          })
          .where(eq(students.id, existingStudent.id))
          .returning();

        await tx.insert(auditLogs).values({
          actorId: String(createdProfile.id),
          actorName: createdProfile.fullName,
          actorRole: 'student',
          entityType: 'student',
          entityId: String(updatedStudent.id),
          action: 'CREAR',
          details: `Auto-registro y vinculación de estudiante pre-matriculado: ${fullName} (T.I.: ${normalizedCode}, Grado: ${standardGrade} - ${normalizedGroup})`,
          newValue: { studentCode: normalizedCode, grade: standardGrade, groupName: normalizedGroup },
        });

        return {
          status: 201 as const,
          profile: serializeProfile(createdProfile),
          student: serializeStudent(updatedStudent),
        };
      }

      // Code not found in pre-registered students
      if (currentSettings.require_pre_registered_code) {
        return {
          error: `La Tarjeta de Identidad "${normalizedCode}" no se encuentra en el padrón oficial pre-cargado por la institución. Solicite a coordinación su habilitación.`,
          status: 403 as const,
        };
      }

      // Check duplicate email in students
      const existingStudentByEmail = await tx
        .select()
        .from(students)
        .where(ilike(students.email, normalizedEmail))
        .limit(1);
      if (existingStudentByEmail.length > 0) {
        return {
          error: `El correo "${normalizedEmail}" ya está asociado a un estudiante en el sistema.`,
          status: 409 as const,
        };
      }

      const [createdProfile] = await tx
        .insert(profiles)
        .values({
          uid: params.uid,
          fullName,
          email: normalizedEmail,
          role: 'student',
          active: true,
          phone: params.phone?.trim() || null,
        })
        .returning();

      const [createdStudent] = await tx
        .insert(students)
        .values({
          profileId: createdProfile.id,
          studentCode: normalizedCode,
          firstNames: params.firstNames.trim(),
          lastNames: params.lastNames.trim(),
          fullName,
          email: normalizedEmail,
          grade: standardGrade,
          groupName: normalizedGroup,
          active: true,
          phone: params.phone?.trim() || null,
        })
        .returning();

      await tx.insert(auditLogs).values({
        actorId: String(createdProfile.id),
        actorName: createdProfile.fullName,
        actorRole: 'student',
        entityType: 'student',
        entityId: String(createdStudent.id),
        action: 'CREAR',
        details: `Auto-registro de estudiante: ${fullName} (T.I.: ${normalizedCode}, Grado: ${standardGrade} - ${normalizedGroup})`,
        newValue: { studentCode: normalizedCode, grade: standardGrade, groupName: normalizedGroup },
      });

      return {
        status: 201 as const,
        profile: serializeProfile(createdProfile),
        student: serializeStudent(createdStudent),
      };
    });
  } catch (error) {
    console.error('Database error in registerStudentAccountInDb:', error);
    throw new Error('No se pudo completar el registro estudiantil en la base de datos.', { cause: error });
  }
}

export async function bootstrapFirstAdminInDb(params: {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
}) {
  try {
    return await db.transaction(async (tx) => {
      const adminCountRes = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(eq(profiles.role, 'admin'));

      if ((adminCountRes[0]?.count ?? 0) > 0) {
        return {
          error: 'Ya existe un administrador institucional configurado en la plataforma.',
          status: 403 as const,
        };
      }

      const normalizedEmail = params.email.trim().toLowerCase();
      const [createdAdmin] = await tx
        .insert(profiles)
        .values({
          uid: params.uid,
          fullName: params.fullName.trim(),
          email: normalizedEmail,
          role: 'admin',
          active: true,
          phone: params.phone?.trim() || null,
        })
        .returning();

      await tx.insert(auditLogs).values({
        actorId: String(createdAdmin.id),
        actorName: createdAdmin.fullName,
        actorRole: 'admin',
        entityType: 'user',
        entityId: String(createdAdmin.id),
        action: 'CREAR',
        details: `Configuración inicial del primer Administrador Institucional: ${createdAdmin.fullName}`,
        newValue: { email: normalizedEmail, role: 'admin' },
      });

      return {
        status: 201 as const,
        profile: serializeProfile(createdAdmin),
      };
    });
  } catch (error) {
    console.error('Database error in bootstrapFirstAdminInDb:', error);
    throw new Error('No se pudo inicializar el administrador.', { cause: error });
  }
}

export async function getDashboardDataForProfile(profile: typeof profiles.$inferSelect) {
  try {
    const settings = await getOrCreateSettings();

    if (profile.role === 'student') {
      const student = await getStudentByProfileId(profile.id);
      if (!student) {
        return {
          settings,
          students: [],
          records: [],
          profiles: [serializeProfile(profile)],
          auditLogs: [],
        };
      }

      const ownRecords = await db
        .select()
        .from(serviceRecords)
        .where(eq(serviceRecords.studentId, student.id))
        .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.createdAt));

      return {
        settings,
        students: [serializeStudent(student)],
        records: ownRecords.map(serializeRecord),
        profiles: [serializeProfile(profile)],
        auditLogs: [],
      };
    }

    // Staff roles: coordinator, admin, supervisor
    const allStudents = await db.select().from(students).orderBy(students.fullName);
    const allRecords = await db
      .select()
      .from(serviceRecords)
      .orderBy(desc(serviceRecords.serviceDate), desc(serviceRecords.createdAt));

    const allProfiles =
      profile.role === 'admin'
        ? await db.select().from(profiles).orderBy(profiles.createdAt)
        : [profile];

    const allLogs =
      profile.role === 'admin' || profile.role === 'coordinator'
        ? await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(500)
        : [];

    return {
      settings,
      students: allStudents.map(serializeStudent),
      records: allRecords.map(serializeRecord),
      profiles: allProfiles.map(serializeProfile),
      auditLogs: allLogs.map(serializeAuditLog),
    };
  } catch (error) {
    console.error('Database error in getDashboardDataForProfile:', error);
    throw new Error('Error al cargar los datos del panel desde la base de datos.', { cause: error });
  }
}
