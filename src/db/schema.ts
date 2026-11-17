import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Perfiles de usuarios (autenticados con Firebase Auth)
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID (null solo si fue pre-creado por admin antes del primer login)
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('student'), // 'admin' | 'coordinator' | 'supervisor' | 'student'
  active: boolean('active').notNull().default(true),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Estudiantes matriculados (relación 1:1 con profiles cuando tiene cuenta)
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id')
    .unique()
    .references(() => profiles.id, { onDelete: 'set null' }),
  studentCode: text('student_code').notNull().unique(),
  firstNames: text('first_names').notNull().default(''),
  lastNames: text('last_names').notNull().default(''),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  grade: text('grade').notNull(), // '9°' | '10°' | '11°'
  groupName: text('group_name').notNull(),
  active: boolean('active').notNull().default(true),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Registros de jornadas de servicio social
export const serviceRecords = pgTable('service_records', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  activityName: text('activity_name').notNull(),
  description: text('description').notNull(),
  serviceDate: text('service_date').notNull(), // YYYY-MM-DD
  hours: doublePrecision('hours').notNull(),
  supervisorId: integer('supervisor_id').references(() => profiles.id, { onDelete: 'set null' }),
  supervisorName: text('supervisor_name').notNull(),
  status: text('status').notNull().default('pending'), // 'draft' | 'pending' | 'approved' | 'rejected'
  studentNotes: text('student_notes'),
  reviewerNotes: text('reviewer_notes'),
  evidenceUrl: text('evidence_url'),
  evidenceName: text('evidence_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: integer('reviewed_by').references(() => profiles.id, { onDelete: 'set null' }),
});

// 4. Parámetros institucionales configurables
export const institutionSettings = pgTable('institution_settings', {
  id: text('id').primaryKey(), // 'default'
  institutionName: text('institution_name')
    .notNull()
    .default('I. U. C. (Instituto Universitario de Caldas)'),
  academicYear: text('academic_year').notNull().default('2026'),
  requiredHours: doublePrecision('required_hours').notNull().default(80),
  gradeTargets: jsonb('grade_targets')
    .$type<Record<string, number>>()
    .notNull()
    .default({ '9°': 80, '10°': 80, '11°': 80 }),
  maxHoursPerDay: doublePrecision('max_hours_per_day').notNull().default(8),
  whoCanRegister: text('who_can_register').notNull().default('student_and_coordinator'),
  enableSupervisorRole: boolean('enable_supervisor_role').notNull().default(true),
  allowDraftStatus: boolean('allow_draft_status').notNull().default(true),
  requireEvidence: boolean('require_evidence').notNull().default(false),
  allowEditAfterApproval: boolean('allow_edit_after_approval').notNull().default(false),
  requirePreRegisteredCode: boolean('require_pre_registered_code').notNull().default(false),
  allowedEmailDomain: text('allowed_email_domain').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  updatedBy: text('updated_by'),
});

// 5. Pista de auditoría
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  previousValue: jsonb('previous_value').$type<Record<string, unknown> | null>(),
  newValue: jsonb('new_value').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relaciones Drizzle
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  studentProfile: one(students, {
    fields: [profiles.id],
    references: [students.profileId],
  }),
  reviewedRecords: many(serviceRecords, { relationName: 'reviewer' }),
  supervisedRecords: many(serviceRecords, { relationName: 'supervisor' }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [students.profileId],
    references: [profiles.id],
  }),
  records: many(serviceRecords),
}));

export const serviceRecordsRelations = relations(serviceRecords, ({ one }) => ({
  student: one(students, {
    fields: [serviceRecords.studentId],
    references: [students.id],
  }),
  reviewer: one(profiles, {
    fields: [serviceRecords.reviewedBy],
    references: [profiles.id],
    relationName: 'reviewer',
  }),
  supervisor: one(profiles, {
    fields: [serviceRecords.supervisorId],
    references: [profiles.id],
    relationName: 'supervisor',
  }),
}));
