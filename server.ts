import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { and, eq, ilike, ne } from 'drizzle-orm';
import type { RecordStatus, Student } from './src/types/index.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import {
  auditLogs,
  institutionSettings,
  profiles,
  serviceRecords,
  students,
} from './src/db/schema.ts';
import {
  ALLOWED_GRADES,
  MAX_SOCIAL_SERVICE_HOURS,
  bootstrapFirstAdminInDb,
  createAuditEntry,
  findAndSyncProfileByAuth,
  getDashboardDataForProfile,
  getEffectiveTargetHours,
  getOrCreateSettings,
  getStudentByProfileId,
  getStudentHoursUsage,
  hasAnyAdminProfile,
  normalizeGrade,
  registerStudentAccountInDb,
  serializeProfile,
  serializeRecord,
  serializeSettings,
  serializeStudent,
  validateTarjetaIdentidad,
} from './src/db/repository.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Helper to resolve and authorize current profile
async function resolveActiveProfile(req: AuthRequest, res: express.Response) {
  if (!req.user?.uid) {
    res.status(401).json({ error: 'Sesión no válida.' });
    return null;
  }

  const profile = await findAndSyncProfileByAuth(req.user.uid, req.user.email);
  if (!profile) {
    res.status(403).json({
      error: 'Cuenta autenticada pero sin perfil institucional registrado.',
      needsRegistration: true,
    });
    return null;
  }

  if (!profile.active) {
    res.status(403).json({
      error: 'Esta cuenta institucional se encuentra inactiva. Comuníquese con coordinación.',
    });
    return null;
  }

  return profile;
}

// 1. Public institutional info (safe metadata only, no user/student data)
app.get('/api/public/settings', async (_req, res) => {
  try {
    const [settings, hasAnyAdmin] = await Promise.all([
      getOrCreateSettings(),
      hasAnyAdminProfile(),
    ]);
    res.json({
      settings,
      hasAnyAdmin,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error cargando información institucional.' });
  }
});

// 2. Auth Bootstrap (resolves profile & student 1:1 link)
app.get('/api/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  try {
    const [settings, hasAnyAdmin] = await Promise.all([
      getOrCreateSettings(),
      hasAnyAdminProfile(),
    ]);
    const profile = await findAndSyncProfileByAuth(req.user!.uid, req.user!.email);

    if (!profile) {
      return res.json({
        needsRegistration: true,
        profile: null,
        student: null,
        settings,
        hasAnyAdmin,
      });
    }

    if (!profile.active) {
      return res.status(403).json({
        error: 'Esta cuenta institucional se encuentra inactiva. Comuníquese con la coordinación.',
      });
    }

    const student =
      profile.role === 'student' ? await getStudentByProfileId(profile.id) : null;

    res.json({
      needsRegistration: false,
      profile: serializeProfile(profile),
      student: student ? serializeStudent(student) : null,
      settings,
      hasAnyAdmin,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al inicializar sesión.' });
  }
});

// 3. Student Self-Registration ("Crear cuenta")
app.post('/api/auth/register-student', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      first_names,
      last_names,
      student_code,
      email,
      grade,
      group_name,
      phone,
    } = req.body ?? {};

    if (!first_names?.trim() || !last_names?.trim()) {
      return res.status(400).json({ error: 'Debe ingresar sus nombres y apellidos completos.' });
    }
    const tiCheck = validateTarjetaIdentidad(student_code);
    if (!tiCheck.valid) {
      return res.status(400).json({ error: tiCheck.error });
    }
    if (!group_name?.trim()) {
      return res.status(400).json({ error: 'Debe indicar el grupo asignado (ej: 9A, 10B, 11A).' });
    }

    const tokenEmail = req.user!.email;
    const effectiveEmail = (tokenEmail || email || '').trim().toLowerCase();
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      return res.status(400).json({ error: 'Ingrese un correo electrónico válido.' });
    }

    if (tokenEmail && email && tokenEmail.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(400).json({
        error: 'El correo electrónico debe coincidir con la sesión autenticada.',
      });
    }

    const result = await registerStudentAccountInDb({
      uid: req.user!.uid,
      email: effectiveEmail,
      firstNames: first_names,
      lastNames: last_names,
      studentCode: tiCheck.value,
      grade: grade || '',
      groupName: group_name,
      phone,
    });

    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(201).json({
      profile: result.profile,
      student: result.student,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al registrar estudiante.' });
  }
});

// 4. First-time Institutional Admin Bootstrap (only allowed when 0 admins exist in DB)
app.post('/api/auth/bootstrap-admin', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { full_name, phone } = req.body ?? {};
    const email = req.user!.email;

    if (!email) {
      return res.status(400).json({ error: 'La cuenta autenticada no tiene un correo válido.' });
    }
    if (!full_name?.trim() || full_name.trim().length < 3) {
      return res.status(400).json({ error: 'Ingrese el nombre completo del administrador.' });
    }

    const result = await bootstrapFirstAdminInDb({
      uid: req.user!.uid,
      email,
      fullName: full_name,
      phone,
    });

    if ('error' in result) {
      return res.status(result.status).json({ error: result.error });
    }

    res.status(201).json({ profile: result.profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al configurar administrador inicial.' });
  }
});

// 5. Role-scoped Dashboard Data
app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    const data = await getDashboardDataForProfile(profile);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al cargar datos del sistema.' });
  }
});

// 6. Service Records CRUD & Workflow
app.post('/api/records', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    const settings = await getOrCreateSettings();

    if (profile.role === 'student' && settings.who_can_register === 'coordinator_only') {
      return res.status(403).json({
        error: 'La institución ha configurado que únicamente los coordinadores pueden registrar jornadas.',
      });
    }

    if (profile.role === 'supervisor') {
      return res.status(403).json({
        error: 'Su rol de docente supervisor solo tiene permisos de consulta y revisión.',
      });
    }

    const {
      student_id,
      activity_name,
      description,
      service_date,
      hours,
      supervisor_name,
      status,
      student_notes,
      evidence_url,
      evidence_name,
    } = req.body ?? {};

    let targetStudentId: number;
    if (profile.role === 'student') {
      const ownStudent = await getStudentByProfileId(profile.id);
      if (!ownStudent || !ownStudent.active) {
        return res.status(403).json({ error: 'No tiene un perfil de estudiante activo vinculado.' });
      }
      targetStudentId = ownStudent.id;
    } else {
      const parsed = Number(student_id);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return res.status(400).json({ error: 'Debe seleccionar un estudiante válido.' });
      }
      targetStudentId = parsed;
    }

    const [studentRow] = await db
      .select()
      .from(students)
      .where(eq(students.id, targetStudentId))
      .limit(1);
    if (!studentRow) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }

    if (!activity_name?.trim()) {
      return res.status(400).json({ error: 'El nombre de la actividad es obligatorio.' });
    }
    if (!description?.trim() || description.trim().length < 15) {
      return res.status(400).json({
        error: 'La descripción debe tener al menos 15 caracteres.',
      });
    }
    if (!supervisor_name?.trim()) {
      return res.status(400).json({ error: 'El nombre del supervisor es obligatorio.' });
    }
    if (!service_date) {
      return res.status(400).json({ error: 'La fecha de la jornada es obligatoria.' });
    }
    const parsedDate = new Date(service_date);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (isNaN(parsedDate.getTime()) || parsedDate > endOfToday) {
      return res.status(400).json({ error: 'La fecha de la jornada no puede ser futura.' });
    }

    const hoursNum = Number(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      return res.status(400).json({ error: 'Las horas deben ser un número mayor a cero.' });
    }
    if (hoursNum > settings.max_hours_per_day) {
      return res.status(400).json({
        error: `Las horas ingresadas superan el límite diario permitido (${settings.max_hours_per_day}h).`,
      });
    }

    if (settings.require_evidence && !evidence_url?.trim() && !evidence_name?.trim()) {
      return res.status(400).json({
        error: 'La institución exige adjuntar soporte o enlace de evidencia.',
      });
    }

    // Enforce initial status (never 'approved' on creation by student)
    const desiredStatus: RecordStatus =
      status === 'draft' && settings.allow_draft_status ? 'draft' : 'pending';

    if (desiredStatus === 'pending') {
      const targetHours = getEffectiveTargetHours(studentRow.grade, settings);
      const { approvedHours, pendingHours } = await getStudentHoursUsage(targetStudentId);
      const remainingQuota = Number(Math.max(0, targetHours - (approvedHours + pendingHours)).toFixed(1));
      if (approvedHours + pendingHours + hoursNum > targetHours) {
        return res.status(400).json({
          error: `Las horas ingresadas (${hoursNum}h) superan el máximo permitido de ${targetHours} horas de servicio social. Tienes ${approvedHours}h aprobadas y ${pendingHours}h pendientes (disponibles para registrar: ${remainingQuota}h).`,
        });
      }
    }

    const now = new Date();
    const [created] = await db
      .insert(serviceRecords)
      .values({
        studentId: targetStudentId,
        activityName: activity_name.trim(),
        description: description.trim(),
        serviceDate: service_date,
        hours: hoursNum,
        supervisorName: supervisor_name.trim(),
        status: desiredStatus,
        studentNotes: student_notes?.trim() || null,
        evidenceUrl: evidence_url?.trim() || null,
        evidenceName: evidence_name?.trim() || null,
        createdAt: now,
        updatedAt: now,
        submittedAt: desiredStatus === 'pending' ? now : null,
      })
      .returning();

    const serialized = serializeRecord(created);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'service_record',
      entityId: serialized.id,
      action: 'CREAR',
      details: `Registro creado: ${serialized.activity_name} (${serialized.hours}h) para ${studentRow.fullName} [Estado: ${serialized.status}]`,
      newValue: serialized as unknown as Record<string, unknown>,
    });

    res.status(201).json(serialized);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al registrar la jornada.' });
  }
});

app.patch('/api/records/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    const recordId = Number(req.params.id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({ error: 'Identificador de jornada inválido.' });
    }

    const [existing] = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.id, recordId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Jornada no encontrada.' });
    }

    const settings = await getOrCreateSettings();

    if (profile.role === 'student') {
      const ownStudent = await getStudentByProfileId(profile.id);
      if (!ownStudent || existing.studentId !== ownStudent.id) {
        return res.status(403).json({ error: 'No tiene permiso para modificar registros de otro estudiante.' });
      }
      if (existing.status === 'approved') {
        return res.status(403).json({ error: 'No puede editar una jornada ya aprobada.' });
      }
    } else if (existing.status === 'approved' && !settings.allow_edit_after_approval) {
      return res.status(403).json({
        error: 'Las políticas institucionales no permiten editar jornadas ya aprobadas.',
      });
    }

    const body = req.body ?? {};
    const nextHours = body.hours !== undefined ? Number(body.hours) : existing.hours;
    if (isNaN(nextHours) || nextHours <= 0 || nextHours > settings.max_hours_per_day) {
      return res.status(400).json({
        error: `Horas inválidas. Deben estar entre 0.5 y ${settings.max_hours_per_day}h.`,
      });
    }

    // Students cannot force status to approved
    let nextStatus = existing.status;
    if (body.status === 'draft' && settings.allow_draft_status) {
      nextStatus = 'draft';
    } else if (body.status === 'pending') {
      nextStatus = 'pending';
    }

    if (nextStatus === 'pending') {
      const [studentRow] = await db
        .select()
        .from(students)
        .where(eq(students.id, existing.studentId))
        .limit(1);
      const targetHours = getEffectiveTargetHours(studentRow?.grade || '10°', settings);
      const { approvedHours, pendingHours } = await getStudentHoursUsage(existing.studentId, recordId);
      const remainingQuota = Number(Math.max(0, targetHours - (approvedHours + pendingHours)).toFixed(1));
      if (approvedHours + pendingHours + nextHours > targetHours) {
        return res.status(400).json({
          error: `No puede enviar ${nextHours}h porque superaría el máximo de ${targetHours} horas de servicio social (aprobadas: ${approvedHours}h, otras pendientes: ${pendingHours}h, disponibles: ${remainingQuota}h).`,
        });
      }
    }

    const now = new Date();
    const [updated] = await db
      .update(serviceRecords)
      .set({
        activityName: body.activity_name?.trim() || existing.activityName,
        description: body.description?.trim() || existing.description,
        serviceDate: body.service_date || existing.serviceDate,
        hours: nextHours,
        supervisorName: body.supervisor_name?.trim() || existing.supervisorName,
        studentNotes:
          body.student_notes !== undefined ? body.student_notes?.trim() || null : existing.studentNotes,
        evidenceUrl:
          body.evidence_url !== undefined ? body.evidence_url?.trim() || null : existing.evidenceUrl,
        evidenceName:
          body.evidence_name !== undefined ? body.evidence_name?.trim() || null : existing.evidenceName,
        status: nextStatus,
        submittedAt:
          nextStatus === 'pending' && !existing.submittedAt ? now : existing.submittedAt,
        updatedAt: now,
      })
      .where(eq(serviceRecords.id, recordId))
      .returning();

    const prevDto = serializeRecord(existing);
    const nextDto = serializeRecord(updated);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'service_record',
      entityId: nextDto.id,
      action: 'ACTUALIZAR',
      details: `Actualización de jornada: ${nextDto.activity_name}`,
      previousValue: prevDto as unknown as Record<string, unknown>,
      newValue: nextDto as unknown as Record<string, unknown>,
    });

    res.json(nextDto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar la jornada.' });
  }
});

app.post('/api/records/:id/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    const recordId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.id, recordId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Jornada no encontrada.' });
    }

    if (profile.role === 'student') {
      const ownStudent = await getStudentByProfileId(profile.id);
      if (!ownStudent || existing.studentId !== ownStudent.id) {
        return res.status(403).json({ error: 'Acceso denegado a este registro.' });
      }
    }

    const settings = await getOrCreateSettings();
    const [studentRow] = await db
      .select()
      .from(students)
      .where(eq(students.id, existing.studentId))
      .limit(1);
    const targetHours = getEffectiveTargetHours(studentRow?.grade || '10°', settings);
    const { approvedHours, pendingHours } = await getStudentHoursUsage(existing.studentId, recordId);
    const remainingQuota = Number(Math.max(0, targetHours - (approvedHours + pendingHours)).toFixed(1));
    if (approvedHours + pendingHours + existing.hours > targetHours) {
      return res.status(400).json({
        error: `No se puede enviar esta jornada (${existing.hours}h) porque excedería el límite máximo de ${targetHours} horas de servicio social (disponibles: ${remainingQuota}h).`,
      });
    }

    const now = new Date();
    const [updated] = await db
      .update(serviceRecords)
      .set({
        status: 'pending',
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(serviceRecords.id, recordId))
      .returning();

    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'service_record',
      entityId: String(recordId),
      action: 'ACTUALIZAR',
      details: `Borrador enviado a revisión: ${existing.activityName}`,
      previousValue: { status: existing.status },
      newValue: { status: 'pending' },
    });

    res.json(serializeRecord(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al enviar el borrador a revisión.' });
  }
});

app.post('/api/records/:id/approve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator', 'supervisor'].includes(profile.role)) {
      return res.status(403).json({
        error: 'Los estudiantes no tienen permiso para aprobar horas de servicio social.',
      });
    }

    const recordId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.id, recordId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Jornada no encontrada.' });
    }

    const [studentRow] = await db
      .select()
      .from(students)
      .where(eq(students.id, existing.studentId))
      .limit(1);

    const settings = await getOrCreateSettings();
    const targetHours = getEffectiveTargetHours(studentRow?.grade || '10°', settings);
    const { approvedHours } = await getStudentHoursUsage(existing.studentId, recordId);
    if (approvedHours + existing.hours > targetHours) {
      const remainingToApprove = Number(Math.max(0, targetHours - approvedHours).toFixed(1));
      return res.status(400).json({
        error: `No se puede aprobar esta jornada (${existing.hours}h): el estudiante ya tiene ${approvedHours}h aprobadas y aprobarla superaría el máximo reglamentario de ${targetHours} horas (solo restan ${remainingToApprove}h por aprobar).`,
      });
    }

    const notes =
      req.body?.notes?.trim() || existing.reviewerNotes || 'Jornada aprobada satisfactoriamente.';
    const now = new Date();

    const [updated] = await db
      .update(serviceRecords)
      .set({
        status: 'approved',
        reviewerNotes: notes,
        reviewedAt: now,
        reviewedBy: profile.id,
        updatedAt: now,
      })
      .where(eq(serviceRecords.id, recordId))
      .returning();

    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'service_record',
      entityId: String(recordId),
      action: 'APROBAR',
      details: `Jornada aprobada (${existing.hours}h) para ${studentRow?.fullName || 'estudiante'}. Observación: ${notes}`,
      previousValue: { status: existing.status },
      newValue: { status: 'approved', reviewer_notes: notes },
    });

    res.json(serializeRecord(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al aprobar la jornada.' });
  }
});

app.post('/api/records/:id/reject', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator', 'supervisor'].includes(profile.role)) {
      return res.status(403).json({
        error: 'No tiene permisos para rechazar jornadas.',
      });
    }

    const reason = req.body?.reason?.trim() || '';
    if (reason.length < 8) {
      return res.status(400).json({
        error: 'El rechazo exige una observación clara de al menos 8 caracteres (RF-06).',
      });
    }

    const recordId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.id, recordId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Jornada no encontrada.' });
    }

    const [studentRow] = await db
      .select()
      .from(students)
      .where(eq(students.id, existing.studentId))
      .limit(1);

    const now = new Date();
    const [updated] = await db
      .update(serviceRecords)
      .set({
        status: 'rejected',
        reviewerNotes: reason,
        reviewedAt: now,
        reviewedBy: profile.id,
        updatedAt: now,
      })
      .where(eq(serviceRecords.id, recordId))
      .returning();

    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'service_record',
      entityId: String(recordId),
      action: 'RECHAZAR',
      details: `Jornada rechazada para ${studentRow?.fullName || 'estudiante'}. Motivo obligatorio: ${reason}`,
      previousValue: { status: existing.status },
      newValue: { status: 'rejected', reviewer_notes: reason },
    });

    res.json(serializeRecord(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al rechazar la jornada.' });
  }
});

app.delete('/api/records/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    const recordId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(serviceRecords)
      .where(eq(serviceRecords.id, recordId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Jornada no encontrada.' });
    }

    if (profile.role === 'student') {
      const ownStudent = await getStudentByProfileId(profile.id);
      if (!ownStudent || existing.studentId !== ownStudent.id || existing.status !== 'draft') {
        return res.status(403).json({
          error: 'Solo puede eliminar sus propios registros en estado borrador.',
        });
      }
    } else if (!['admin', 'coordinator'].includes(profile.role)) {
      return res.status(403).json({ error: 'No tiene permiso para anular registros.' });
    }

    await db.delete(serviceRecords).where(eq(serviceRecords.id, recordId));

    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'service_record',
      entityId: String(recordId),
      action: 'ANULAR',
      details: `Registro eliminado/anulado: ${existing.activityName}. Motivo: ${req.body?.reason || 'Acción administrativa'}`,
      previousValue: serializeRecord(existing) as unknown as Record<string, unknown>,
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar la jornada.' });
  }
});

// 7. Students Management (Coordinator / Admin)
app.post('/api/students', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator'].includes(profile.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes para crear estudiantes.' });
    }

    const { student_code, full_name, first_names, last_names, email, grade, group_name, phone } =
      req.body ?? {};
    const tiCheck = validateTarjetaIdentidad(student_code);
    if (!tiCheck.valid) {
      return res.status(400).json({ error: tiCheck.error });
    }
    const code = tiCheck.value;
    const name = full_name?.trim();
    const mail = email?.trim().toLowerCase();
    const stdGrade = normalizeGrade(grade || '');
    const grp = group_name?.trim().toUpperCase();

    if (!name || !mail || !grp) {
      return res.status(400).json({ error: 'Tarjeta de Identidad, nombre completo, correo y grupo son obligatorios.' });
    }
    if (!ALLOWED_GRADES.includes(stdGrade as (typeof ALLOWED_GRADES)[number])) {
      return res.status(400).json({ error: 'El grado debe ser únicamente 9°, 10° u 11°.' });
    }

    const dupCode = await db
      .select()
      .from(students)
      .where(ilike(students.studentCode, code))
      .limit(1);
    if (dupCode.length > 0) {
      return res.status(409).json({ error: `La Tarjeta de Identidad "${code}" ya existe.` });
    }

    const dupEmail = await db
      .select()
      .from(students)
      .where(ilike(students.email, mail))
      .limit(1);
    if (dupEmail.length > 0) {
      return res.status(409).json({ error: `El correo "${mail}" ya está registrado en otro estudiante.` });
    }

    const [created] = await db
      .insert(students)
      .values({
        studentCode: code,
        firstNames: first_names?.trim() || name.split(' ').slice(0, 1).join(' '),
        lastNames: last_names?.trim() || name.split(' ').slice(1).join(' '),
        fullName: name,
        email: mail,
        grade: stdGrade,
        groupName: grp,
        active: true,
        phone: phone?.trim() || null,
      })
      .returning();

    const dto = serializeStudent(created);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'student',
      entityId: dto.id,
      action: 'CREAR',
      details: `Nuevo estudiante registrado: ${dto.full_name} (${dto.student_code})`,
      newValue: dto as unknown as Record<string, unknown>,
    });

    res.status(201).json(dto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al registrar estudiante.' });
  }
});

app.patch('/api/students/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator'].includes(profile.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes para editar estudiantes.' });
    }

    const studentId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }

    const body = req.body ?? {};
    let nextCode = existing.studentCode;
    if (body.student_code !== undefined) {
      const tiCheck = validateTarjetaIdentidad(body.student_code);
      if (!tiCheck.valid) {
        return res.status(400).json({ error: tiCheck.error });
      }
      nextCode = tiCheck.value;
    }
    const nextGrade = body.grade ? normalizeGrade(body.grade) : existing.grade;
    const nextEmail = body.email ? body.email.trim().toLowerCase() : existing.email;

    if (!ALLOWED_GRADES.includes(nextGrade as (typeof ALLOWED_GRADES)[number])) {
      return res.status(400).json({ error: 'El grado debe ser únicamente 9°, 10° u 11°.' });
    }

    const dupCode = await db
      .select()
      .from(students)
      .where(and(ilike(students.studentCode, nextCode), ne(students.id, studentId)))
      .limit(1);
    if (dupCode.length > 0) {
      return res.status(409).json({ error: `La Tarjeta de Identidad "${nextCode}" ya pertenece a otro estudiante.` });
    }

    const [updated] = await db
      .update(students)
      .set({
        studentCode: nextCode,
        fullName: body.full_name?.trim() || existing.fullName,
        email: nextEmail,
        grade: nextGrade,
        groupName: body.group_name?.trim().toUpperCase() || existing.groupName,
        phone: body.phone !== undefined ? body.phone?.trim() || null : existing.phone,
      })
      .where(eq(students.id, studentId))
      .returning();

    const prevDto = serializeStudent(existing);
    const nextDto = serializeStudent(updated);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'student',
      entityId: nextDto.id,
      action: 'ACTUALIZAR',
      details: `Datos del estudiante actualizados: ${nextDto.full_name}`,
      previousValue: prevDto as unknown as Record<string, unknown>,
      newValue: nextDto as unknown as Record<string, unknown>,
    });

    res.json(nextDto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar estudiante.' });
  }
});

app.post('/api/students/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator'].includes(profile.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes.' });
    }

    const studentId = Number(req.params.id);
    const [existing] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }

    const newActive = !existing.active;
    const [updated] = await db
      .update(students)
      .set({ active: newActive })
      .where(eq(students.id, studentId))
      .returning();

    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'student',
      entityId: String(studentId),
      action: newActive ? 'ACTIVAR' : 'DESACTIVAR',
      details: `Estado del estudiante ${existing.fullName} modificado a ${newActive ? 'Activo' : 'Inactivo'}`,
      previousValue: { active: existing.active },
      newValue: { active: newActive },
    });

    res.json(serializeStudent(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al cambiar el estado del estudiante.' });
  }
});

app.post('/api/students/import-csv', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator'].includes(profile.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes para importar estudiantes.' });
    }

    const items = Array.isArray(req.body?.students) ? req.body.students : [];
    const errors: string[] = [];
    const added: Student[] = [];

    const existingRows = await db.select().from(students);
    const existingCodes = new Set(existingRows.map((s) => s.studentCode.trim().toUpperCase()));
    const existingEmails = new Set(existingRows.map((s) => s.email.trim().toLowerCase()));

    for (const item of items) {
      const tiCheck = validateTarjetaIdentidad(item.student_code);
      const fullName = String(item.full_name || '').trim();
      const email = String(item.email || '').trim().toLowerCase();
      const grade = normalizeGrade(String(item.grade || '10°'));
      const groupName = String(item.group_name || '').trim().toUpperCase();

      if (!tiCheck.valid) {
        errors.push(`Fila "${fullName || 'sin nombre'}": ${tiCheck.error}`);
        continue;
      }
      const code = tiCheck.value;
      if (!fullName) {
        errors.push(`T.I. "${code}": El nombre completo es obligatorio.`);
        continue;
      }
      if (!email || !email.includes('@')) {
        errors.push(`T.I. "${code}": El correo electrónico válido es obligatorio.`);
        continue;
      }
      if (!ALLOWED_GRADES.includes(grade as (typeof ALLOWED_GRADES)[number])) {
        errors.push(`T.I. "${code}": Grado "${grade}" inválido (solo se permite 9°, 10° u 11°).`);
        continue;
      }
      if (!groupName) {
        errors.push(`T.I. "${code}": El grupo es obligatorio.`);
        continue;
      }
      if (existingCodes.has(code)) {
        errors.push(`Tarjeta de Identidad duplicada: "${code}" ya existe en el sistema.`);
        continue;
      }
      if (existingEmails.has(email)) {
        errors.push(`Correo duplicado: "${email}" ya existe en el sistema.`);
        continue;
      }

      existingCodes.add(code);
      existingEmails.add(email);

      const [inserted] = await db
        .insert(students)
        .values({
          studentCode: code,
          firstNames: fullName.split(' ').slice(0, 1).join(' '),
          lastNames: fullName.split(' ').slice(1).join(' '),
          fullName,
          email,
          grade,
          groupName,
          active: true,
          phone: item.phone ? String(item.phone).trim() : null,
        })
        .returning();

      added.push(serializeStudent(inserted));
    }

    if (added.length > 0) {
      await createAuditEntry({
        actorId: String(profile.id),
        actorName: profile.fullName,
        actorRole: profile.role,
        entityType: 'student',
        entityId: 'batch-import',
        action: 'IMPORTAR_CSV',
        details: `Importación por CSV exitosa: ${added.length} estudiantes agregados. ${errors.length} descartados por errores.`,
      });
    }

    res.json({
      successCount: added.length,
      errors,
      added,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al importar estudiantes desde CSV.' });
  }
});

// 8. Users & Roles Management (Admin only)
app.post('/api/profiles', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden crear cuentas de personal.' });
    }

    const { full_name, email, role, phone } = req.body ?? {};
    const name = full_name?.trim();
    const mail = email?.trim().toLowerCase();

    if (!name || !mail || !mail.includes('@')) {
      return res.status(400).json({ error: 'Nombre completo y correo electrónico válidos son obligatorios.' });
    }
    if (!['admin', 'coordinator', 'supervisor', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Rol de usuario inválido.' });
    }

    const dup = await db.select().from(profiles).where(ilike(profiles.email, mail)).limit(1);
    if (dup.length > 0) {
      return res.status(409).json({ error: `El correo "${mail}" ya se encuentra registrado.` });
    }

    const [created] = await db
      .insert(profiles)
      .values({
        fullName: name,
        email: mail,
        role,
        active: true,
        phone: phone?.trim() || null,
      })
      .returning();

    const dto = serializeProfile(created);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'user',
      entityId: dto.id,
      action: 'CREAR',
      details: `Usuario institucional pre-habilitado: ${dto.full_name} (${dto.role})`,
      newValue: dto as unknown as Record<string, unknown>,
    });

    res.status(201).json(dto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al crear usuario.' });
  }
});

app.patch('/api/profiles/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden editar usuarios y roles.' });
    }

    const targetId = Number(req.params.id);
    const [existing] = await db.select().from(profiles).where(eq(profiles.id, targetId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const { full_name, email, role, phone } = req.body ?? {};
    const nextEmail = email ? email.trim().toLowerCase() : existing.email;

    if (role && !['admin', 'coordinator', 'supervisor', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido.' });
    }

    const dup = await db
      .select()
      .from(profiles)
      .where(and(ilike(profiles.email, nextEmail), ne(profiles.id, targetId)))
      .limit(1);
    if (dup.length > 0) {
      return res.status(409).json({ error: `El correo "${nextEmail}" ya pertenece a otra cuenta.` });
    }

    const [updated] = await db
      .update(profiles)
      .set({
        fullName: full_name?.trim() || existing.fullName,
        email: nextEmail,
        role: role || existing.role,
        phone: phone !== undefined ? phone?.trim() || null : existing.phone,
      })
      .where(eq(profiles.id, targetId))
      .returning();

    const prevDto = serializeProfile(existing);
    const nextDto = serializeProfile(updated);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'user',
      entityId: nextDto.id,
      action: 'ACTUALIZAR',
      details: `Usuario modificado: ${nextDto.full_name} (rol: ${nextDto.role})`,
      previousValue: prevDto as unknown as Record<string, unknown>,
      newValue: nextDto as unknown as Record<string, unknown>,
    });

    res.json(nextDto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar usuario.' });
  }
});

app.post('/api/profiles/:id/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden cambiar el estado de usuarios.' });
    }

    const targetId = Number(req.params.id);
    if (targetId === profile.id) {
      return res.status(400).json({ error: 'No puede desactivar su propia cuenta de administrador.' });
    }

    const [existing] = await db.select().from(profiles).where(eq(profiles.id, targetId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const newActive = !existing.active;
    const [updated] = await db
      .update(profiles)
      .set({ active: newActive })
      .where(eq(profiles.id, targetId))
      .returning();

    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'user',
      entityId: String(targetId),
      action: newActive ? 'ACTIVAR' : 'DESACTIVAR',
      details: `Cuenta de usuario ${existing.fullName} ${newActive ? 'activada' : 'desactivada'}`,
      previousValue: { active: existing.active },
      newValue: { active: newActive },
    });

    res.json(serializeProfile(updated));
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al cambiar estado del usuario.' });
  }
});

// 9. Institution Settings (Admin / Coordinator)
app.put('/api/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const profile = await resolveActiveProfile(req, res);
    if (!profile) return;

    if (!['admin', 'coordinator'].includes(profile.role)) {
      return res.status(403).json({ error: 'No tiene permisos para modificar parámetros institucionales.' });
    }

    const prev = await getOrCreateSettings();
    const b = req.body ?? {};

    const requiredHours = b.required_hours !== undefined ? Number(b.required_hours) : prev.required_hours;
    const maxHoursPerDay = b.max_hours_per_day !== undefined ? Number(b.max_hours_per_day) : prev.max_hours_per_day;

    if (isNaN(requiredHours) || requiredHours <= 0 || requiredHours > MAX_SOCIAL_SERVICE_HOURS) {
      return res.status(400).json({
        error: `La meta global de horas debe estar entre 1 y ${MAX_SOCIAL_SERVICE_HOURS} horas máximas de servicio social.`,
      });
    }
    if (isNaN(maxHoursPerDay) || maxHoursPerDay <= 0 || maxHoursPerDay > 24) {
      return res.status(400).json({ error: 'El límite máximo diario debe estar entre 1 y 24 horas.' });
    }

    const rawTargets = b.grade_targets || prev.grade_targets || { '9°': 80, '10°': 80, '11°': 80 };
    const sanitizedTargets: Record<string, number> = {};
    for (const g of ALLOWED_GRADES) {
      const val = Number(rawTargets[g] ?? requiredHours);
      if (isNaN(val) || val <= 0 || val > MAX_SOCIAL_SERVICE_HOURS) {
        return res.status(400).json({
          error: `La meta de horas para grado ${g} debe estar entre 1 y ${MAX_SOCIAL_SERVICE_HOURS} horas máximas.`,
        });
      }
      sanitizedTargets[g] = val;
    }

    const [updated] = await db
      .update(institutionSettings)
      .set({
        institutionName: b.institution_name?.trim() || prev.institution_name,
        academicYear: b.academic_year?.trim() || prev.academic_year,
        requiredHours,
        gradeTargets: sanitizedTargets,
        maxHoursPerDay,
        whoCanRegister: b.who_can_register || prev.who_can_register,
        enableSupervisorRole:
          b.enable_supervisor_role !== undefined ? Boolean(b.enable_supervisor_role) : prev.enable_supervisor_role,
        allowDraftStatus:
          b.allow_draft_status !== undefined ? Boolean(b.allow_draft_status) : prev.allow_draft_status,
        requireEvidence:
          b.require_evidence !== undefined ? Boolean(b.require_evidence) : prev.require_evidence,
        allowEditAfterApproval:
          b.allow_edit_after_approval !== undefined
            ? Boolean(b.allow_edit_after_approval)
            : prev.allow_edit_after_approval,
        requirePreRegisteredCode:
          b.require_pre_registered_code !== undefined
            ? Boolean(b.require_pre_registered_code)
            : Boolean(prev.require_pre_registered_code),
        allowedEmailDomain:
          b.allowed_email_domain !== undefined
            ? String(b.allowed_email_domain).trim().toLowerCase()
            : prev.allowed_email_domain || '',
        updatedAt: new Date(),
        updatedBy: profile.fullName,
      })
      .where(eq(institutionSettings.id, 'default'))
      .returning();

    const nextDto = serializeSettings(updated);
    await createAuditEntry({
      actorId: String(profile.id),
      actorName: profile.fullName,
      actorRole: profile.role,
      entityType: 'institution_settings',
      entityId: 'default',
      action: 'ACTUALIZAR',
      details: `Parámetros institucionales actualizados por ${profile.fullName}`,
      previousValue: prev as unknown as Record<string, unknown>,
      newValue: nextDto as unknown as Record<string, unknown>,
    });

    res.json(nextDto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al guardar los parámetros institucionales.' });
  }
});

// Vite / Static Serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
