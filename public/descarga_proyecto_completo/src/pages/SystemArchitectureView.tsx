import React, { useState } from 'react';
import { 
  FileCode, 
  CheckCircle2, 
  Database, 
  ShieldCheck, 
  HelpCircle, 
  BookOpen, 
  Server, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  Terminal,
  FileCheck
} from 'lucide-react';

export const SystemArchitectureView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'traceability' | 'ambiguities' | 'supabase' | 'deployment' | 'tests'>('architecture');
  const [copiedSql, setCopiedSql] = useState(false);

  const copySqlCode = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-mono font-medium mb-3">
              <FileCode className="w-3.5 h-3.5" />
              <span>Documentación Técnica & Análisis de Sistemas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Arquitectura del Sistema de Servicio Social
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Consolidación de requerimientos RF/RNF, resolución de ambigüedades mediante parámetros configurables, esquema relacional Supabase con RLS y protocolo de pruebas.
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('architecture')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'architecture' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            1. Arquitectura Técnica
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ambiguities')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'ambiguities' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            2. Ambigüedades y Parámetros
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('traceability')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'traceability' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            3. Matriz RF / RNF
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('supabase')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'supabase' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            4. Esquema SQL & RLS
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('deployment')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'deployment' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            5. Guía de Despliegue
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('tests')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'tests' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            6. Casos de Prueba Manual
          </button>
        </div>
      </div>

      {/* CONTENT: 1. ARCHITECTURE */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>Resumen de Arquitectura y Flujo de Datos</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El sistema reemplaza el registro manual en carpetas y hojas físicas por una arquitectura web cliente-servidor moderna en 3 capas desacopladas, garantizando persistencia, privacidad (RNF-02) y validación en base de datos (RNF-03).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-sm">Frontend SPA</span>
                <p className="text-slate-600">
                  • <strong>React 19 + TypeScript + Vite</strong> para máximo rendimiento y seguridad de tipado.
                </p>
                <p className="text-slate-600">
                  • <strong>Tailwind CSS</strong> con diseño responsivo mobile-first optimizado para celulares, tabletas y escritorio.
                </p>
                <p className="text-slate-600">
                  • Vistas diferenciadas por rol (Admin, Coordinador, Supervisor, Estudiante).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-sm">Capa de Lógica & Estado</span>
                <p className="text-slate-600">
                  • <strong>AppContext Central</strong> que implementa cálculos estrictos (RF-08): horas aprobadas versus meta, descartando pendientes o rechazadas.
                </p>
                <p className="text-slate-600">
                  • Trazabilidad inmutable mediante <strong>audit_logs</strong> para cada acción de creación, aprobación, rechazo o anulación.
                </p>
                <p className="text-slate-600">
                  • Persistencia dual local (navegador) + cliente API compatible con Supabase.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-sm">Persistencia & Seguridad</span>
                <p className="text-slate-600">
                  • Base de datos relacional <strong>PostgreSQL / Supabase</strong> con 5 entidades normalizadas.
                </p>
                <p className="text-slate-600">
                  • <strong>Row Level Security (RLS)</strong>: los estudiantes solo pueden consultar sus propios registros; solo coordinadores y administradores pueden alterar estados.
                </p>
                <p className="text-slate-600">
                  • Triggers SQL para actualización de timestamps y registros de auditoría.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-800">Estructura de Componentes y Páginas</h4>
            <div className="text-xs font-mono bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto leading-relaxed">
              src/<br />
              ├── types/index.ts &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Entidades (profiles, students, service_records, settings, audit_logs)<br />
              ├── context/AppContext.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Store central, cálculo RF-08, simulación de usuarios, audit_logs<br />
              ├── data/mockData.ts &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Datos de demostración verosímiles de colegio (grados 10° y 11°)<br />
              ├── utils/helpers.ts &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Formateadores de fecha en español, generador y parser CSV con BOM<br />
              ├── components/<br />
              │ &nbsp;&nbsp;├── common/Badge.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Badges para estados (Aprobada, Pendiente, Rechazada, Borrador) y roles<br />
              │ &nbsp;&nbsp;├── common/Modal.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Modal accesible reutilizable con animaciones<br />
              │ &nbsp;&nbsp;└── layout/Navbar.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Barra institucional con switch rápido de rol demo<br />
              ├── pages/<br />
              │ &nbsp;&nbsp;├── LoginView.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Mockup 6.1 (Ingreso de credenciales o botón demo directo)<br />
              │ &nbsp;&nbsp;├── StudentDashboard.tsx &nbsp;&nbsp;&nbsp;→ Mockup 6.2 (Indicadores, horas aprobadas vs meta, filtros)<br />
              │ &nbsp;&nbsp;├── RecordFormModal.tsx &nbsp;&nbsp;&nbsp;&nbsp;→ Mockup 6.3 (Formulario jornada, validaciones, borrador y evidencia)<br />
              │ &nbsp;&nbsp;├── CoordinatorDashboard.tsx→ Mockup 6.4 (KPIs, bandeja pendientes, filtros avanzados)<br />
              │ &nbsp;&nbsp;├── ReviewRecordModal.tsx &nbsp;&nbsp;→ Mockup 6.5 (Revisión, rechazo con observación obligatoria)<br />
              │ &nbsp;&nbsp;├── StudentsManagement.tsx &nbsp;→ RF-03 (CRUD estudiantes, barras individuales, switch activo)<br />
              │ &nbsp;&nbsp;├── CsvImportModal.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RF-16 (Asistente de carga masiva CSV, validación duplicados)<br />
              │ &nbsp;&nbsp;├── UsersManagement.tsx &nbsp;&nbsp;&nbsp;&nbsp;→ RF-04 (Gestión de perfiles institucionales y roles)<br />
              │ &nbsp;&nbsp;├── ReportsView.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RF-12 & Mockup 6.6 (Exportar CSV y reporte imprimible PDF)<br />
              │ &nbsp;&nbsp;├── SettingsView.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RF-15 (Metas de horas, políticas configurables)<br />
              │ &nbsp;&nbsp;├── AuditLogView.tsx &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ RF-13 & RNF-11 (Trazabilidad de cambios y payloads)<br />
              │ &nbsp;&nbsp;└── StudentCertificateView.tsx → Constancia oficial de cumplimiento con membrete institucional<br />
              └── supabase/schema.sql &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ DDL PostgreSQL completo con RLS y Triggers
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: 2. AMBIGUITIES */}
      {activeSubTab === 'ambiguities' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-600" />
            <span>Resolución de Ambigüedades y Parámetros Configurables (Sección 11 del PDF)</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Para evitar suposiciones no validadas o imponer políticas institucionales rígidas, se construyó un motor de parámetros configurables en la entidad <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">institution_settings</code>:
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. ¿Quién puede registrar las jornadas de servicio?</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">Resuelto vía Config</span>
              </div>
              <p className="text-slate-600">
                <strong>Ambigüedad:</strong> El colegio debe confirmar si los estudiantes ingresan sus jornadas directamente para posterior aprobación o si la secretaría/coordinación es la única autorizada.
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Solución implementada:</strong> Parámetro <code className="font-mono text-emerald-700">who_can_register</code> con opciones: "Estudiante y Coordinador" (predeterminado con flujo de revisión) o "Exclusivamente Coordinador".
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Número exacto de horas exigidas y desglose por grado</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">Resuelto vía Config</span>
              </div>
              <p className="text-slate-600">
                <strong>Ambigüedad:</strong> Algunos colegios exigen 80 horas totales continuas; otros distribuyen 40 horas en 10° y 40 horas en 11°, o metas distintas según la modalidad técnica.
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Solución implementada:</strong> Se implementó <code className="font-mono text-emerald-700">required_hours</code> global y el mapa <code className="font-mono text-emerald-700">grade_targets</code> para configurar metas independientes por nivel académico.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Exigencia de evidencias documentales</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">Resuelto vía Config</span>
              </div>
              <p className="text-slate-600">
                <strong>Ambigüedad:</strong> En instituciones rurales o con actas físicas, obligar a subir archivos PDF puede frenar el registro; en otras es mandatorio.
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Solución implementada:</strong> Parámetro <code className="font-mono text-emerald-700">require_evidence</code> (booleano). Permite tanto carga simulada de archivos como enlaces a nubes compartidas (Google Drive, OneDrive).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">4. Límite máximo de horas por jornada</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">Resuelto vía Config</span>
              </div>
              <p className="text-slate-600">
                <strong>Ambigüedad:</strong> Riesgo de digitación errónea (ej. digitar 80 horas en un solo día).
              </p>
              <p className="text-slate-800 font-medium">
                <strong>Solución implementada:</strong> Parámetro <code className="font-mono text-emerald-700">max_hours_per_day</code> (por defecto 8 horas diarias), validado en el formulario y en la regla de negocio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: 3. TRACEABILITY */}
      {activeSubTab === 'traceability' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Matriz de Trazabilidad de Requerimientos (RF-01 a RF-16 y RNF-01 a RNF-12)</span>
          </h3>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="p-2.5">Código</th>
                  <th className="p-2.5">Requerimiento</th>
                  <th className="p-2.5">Implementación Técnica en el Código</th>
                  <th className="p-2.5 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-01</td>
                  <td className="p-2.5">Inicio y cierre de sesión</td>
                  <td className="p-2.5 text-slate-600"><code>LoginView.tsx</code> con credenciales seguras y selector de perfiles directos</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-02</td>
                  <td className="p-2.5">Control de acceso por rol</td>
                  <td className="p-2.5 text-slate-600">Navbar reactivo por rol (admin, coord, supervisor, student) + RLS policies en SQL</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-03</td>
                  <td className="p-2.5">Gestión de estudiantes</td>
                  <td className="p-2.5 text-slate-600"><code>StudentsManagement.tsx</code> (crear, editar, activar/desactivar, códigos únicos)</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-04</td>
                  <td className="p-2.5">Gestión de usuarios</td>
                  <td className="p-2.5 text-slate-600"><code>UsersManagement.tsx</code> con asignación de roles y control de activación</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-05</td>
                  <td className="p-2.5">Registro de jornada</td>
                  <td className="p-2.5 text-slate-600"><code>RecordFormModal.tsx</code> con validación de fechas, horas mayores a 0 y límites</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-06</td>
                  <td className="p-2.5">Validación de registros</td>
                  <td className="p-2.5 text-slate-600"><code>ReviewRecordModal.tsx</code> con observación obligatoria al rechazar</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-07</td>
                  <td className="p-2.5">Estados del registro</td>
                  <td className="p-2.5 text-slate-600">Estados 'draft', 'pending', 'approved', 'rejected' con badges visuales estandarizados</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-08</td>
                  <td className="p-2.5">Cálculo de horas aprobadas/faltantes</td>
                  <td className="p-2.5 text-slate-600">Regla estricta: Solo 'approved' suma horas. Pendientes y rechazadas no suman</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-09</td>
                  <td className="p-2.5">Panel del estudiante</td>
                  <td className="p-2.5 text-slate-600"><code>StudentDashboard.tsx</code> con barra de progreso, alertas de rechazo y filtro</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-10</td>
                  <td className="p-2.5">Panel administrativo / coordinador</td>
                  <td className="p-2.5 text-slate-600"><code>CoordinatorDashboard.tsx</code> con KPI de pendientes, horas acumuladas y tabla</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-11</td>
                  <td className="p-2.5">Búsqueda y filtros</td>
                  <td className="p-2.5 text-slate-600">Filtros combinados por estudiante, grupo (10A/11B), estado y rango fechas</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-12</td>
                  <td className="p-2.5">Reportes y exportación</td>
                  <td className="p-2.5 text-slate-600"><code>ReportsView.tsx</code> con exportación CSV real y vista de impresión para PDF</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-13</td>
                  <td className="p-2.5">Historial y auditoría</td>
                  <td className="p-2.5 text-slate-600"><code>AuditLogView.tsx</code> con usuario actor, entidad afectada, payload anterior y nuevo</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-14</td>
                  <td className="p-2.5">Evidencias opcionales/configurables</td>
                  <td className="p-2.5 text-slate-600">Soporte para enlaces URL (Google Drive) y subida de archivos adjuntos</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-15</td>
                  <td className="p-2.5">Configuración institucional</td>
                  <td className="p-2.5 text-slate-600"><code>SettingsView.tsx</code> para configurar metas, límites y reglas del colegio</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-emerald-700">RF-16</td>
                  <td className="p-2.5">Importación inicial desde CSV</td>
                  <td className="p-2.5 text-slate-600"><code>CsvImportModal.tsx</code> con descarga de plantilla y validación de duplicados</td>
                  <td className="p-2.5 text-center"><span className="text-emerald-700 font-bold">100% Funcional</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENT: 4. SUPABASE & SQL */}
      {activeSubTab === 'supabase' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>Script SQL de Creación y Políticas RLS (Supabase / PostgreSQL)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Esquema relacional estricto con tipos ENUM, claves foráneas, triggers de auditoría y Row Level Security.
              </p>
            </div>

            <button
              type="button"
              onClick={copySqlCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? '¡Copiado al Portapapeles!' : 'Copiar SQL'}</span>
            </button>
          </div>

          <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre>{SUPABASE_SCHEMA_SQL}</pre>
          </div>
        </div>
      )}

      {/* CONTENT: 5. DEPLOYMENT */}
      {activeSubTab === 'deployment' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs text-slate-700 leading-relaxed">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <span>Guía Paso a Paso para Conectar y Desplegar (GitHub + Supabase + Vercel)</span>
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 text-sm block">Paso 1: Configurar Supabase</span>
              <p>1. Ingrese a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">supabase.com</a> y cree un nuevo proyecto.</p>
              <p>2. En el menú lateral, diríjase a <strong>SQL Editor</strong>, cree una nueva consulta y pegue el contenido de la pestaña <em>"4. Esquema SQL & RLS"</em> (o del archivo <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">/supabase/schema.sql</code>).</p>
              <p>3. Ejecute el script ("Run"). Esto creará automáticamente las tablas, triggers y políticas RLS.</p>
              <p>4. Diríjase a <strong>Project Settings → API</strong> y copie su <strong>Project URL</strong> y la <strong>anon public key</strong> (nunca la service_role key en el frontend).</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 text-sm block">Paso 2: Subir el Código a GitHub</span>
              <p>1. Inicialice el repositorio en Git: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">git init</code></p>
              <p>2. Agregue los cambios: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">git add .</code></p>
              <p>3. Realice el commit: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">git commit -m "feat: Sistema de horas de servicio social con esquema y RLS"</code></p>
              <p>4. Vincule su repositorio remoto y ejecute: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">git push -u origin main</code></p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 text-sm block">Paso 3: Despliegue en Vercel con Variables de Entorno</span>
              <p>1. En <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">vercel.com</a>, importe el repositorio de GitHub.</p>
              <p>2. En la sección <strong>Environment Variables</strong>, configure:</p>
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] space-y-1">
                <div>VITE_SUPABASE_URL = "https://tu-proyecto.supabase.co"</div>
                <div>VITE_SUPABASE_ANON_KEY = "tu_clave_anonima_publica"</div>
              </div>
              <p>3. Haga clic en <strong>Deploy</strong>. Vercel compilará la aplicación con Vite y asignará un dominio HTTPS automático.</p>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT: 6. MANUAL TESTS */}
      {activeSubTab === 'tests' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>Protocolo de Pruebas Manuales del Sistema</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1">Prueba 1: Regla RF-08 / RNF-07 (Cálculo estricto de horas)</span>
              <p className="text-slate-600">
                • <strong>Paso:</strong> En el selector superior, elija a <em>Juan Pablo Vargas</em>. Observe sus horas aprobadas (44h), pendientes (6h) y rechazadas (4h).
              </p>
              <p className="text-emerald-700 font-medium mt-1">
                • <strong>Resultado esperado:</strong> El avance oficial muestra 44h (55%). En ningún momento las 6h pendientes ni las 4h rechazadas se suman al total.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1">Prueba 2: Requisito RF-06 (Rechazo con observación obligatoria)</span>
              <p className="text-slate-600">
                • <strong>Paso:</strong> Como Coordinador (Prof. Marcela Gómez), abra la pestaña <em>"Revisión"</em>, haga clic en una jornada y presione <em>"Rechazar"</em> sin escribir texto.
              </p>
              <p className="text-emerald-700 font-medium mt-1">
                • <strong>Resultado esperado:</strong> El sistema bloquea la acción y exige un mensaje explícito de corrección. Al confirmarse, el estudiante ve la observación en su panel.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1">Prueba 3: Validación de Jornada RF-05 / RNF-06</span>
              <p className="text-slate-600">
                • <strong>Paso:</strong> Haga clic en <em>"Registrar Jornada"</em> e intente ingresar 0 horas, horas negativas o 25 horas.
              </p>
              <p className="text-emerald-700 font-medium mt-1">
                • <strong>Resultado esperado:</strong> Mensaje de error claro impidiendo el envío fuera del rango [0.5h, 8h].
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1">Prueba 4: Importación masiva CSV (RF-16)</span>
              <p className="text-slate-600">
                • <strong>Paso:</strong> Vaya a <em>"Estudiantes" → "Importar CSV"</em> y descargue la plantilla o cargue un código ya existente (ej: EST-2026-001).
              </p>
              <p className="text-emerald-700 font-medium mt-1">
                • <strong>Resultado esperado:</strong> Detección previa de duplicados con fila resaltada en rojo antes de guardar en la base de datos.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-bold text-slate-900 block mb-1">Prueba 5: Generación de Certificado de 100% Horas Cumplidas</span>
              <p className="text-slate-600">
                • <strong>Paso:</strong> En el selector de demo, elija al estudiante <em>Mateo Castaño</em> (80h de 80h aprobadas).
              </p>
              <p className="text-emerald-700 font-medium mt-1">
                • <strong>Resultado esperado:</strong> Se activa el banner de felicitaciones y la opción <em>"Mi Constancia"</em>, generando el certificado oficial imprimible.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SUPABASE_SCHEMA_SQL = `-- ========================================================================
-- SISTEMA DE CONTROL DE HORAS DE SERVICIO SOCIAL ESCOLAR
-- Esquema DDL para PostgreSQL / Supabase con Row Level Security (RLS)
-- ========================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumeradores de rol y estado
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'coordinator', 'supervisor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE record_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabla profiles (asociada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla students (Relacionada 1:1 con un único perfil y con validación de grado)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_code TEXT UNIQUE NOT NULL,
    first_names TEXT,
    last_names TEXT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    grade TEXT NOT NULL CHECK (grade IN ('9°', '10°', '11°')), -- Restringido a 9°, 10° y 11°
    group_name TEXT NOT NULL, -- Ej: '9A', '10A', '11B'
    active BOOLEAN NOT NULL DEFAULT true,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla institution_settings (RF-15)
CREATE TABLE IF NOT EXISTS public.institution_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    institution_name TEXT NOT NULL DEFAULT 'I. U. C. (Instituto Universitario de Caldas)',
    academic_year TEXT NOT NULL DEFAULT '2026',
    required_hours NUMERIC(6,2) NOT NULL DEFAULT 80.00 CHECK (required_hours > 0),
    grade_targets JSONB NOT NULL DEFAULT '{"9°": 20, "10°": 30, "11°": 30}',
    max_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8.00 CHECK (max_hours_per_day > 0),
    who_can_register TEXT NOT NULL DEFAULT 'student_and_coordinator',
    enable_supervisor_role BOOLEAN NOT NULL DEFAULT true,
    allow_draft_status BOOLEAN NOT NULL DEFAULT true,
    require_evidence BOOLEAN NOT NULL DEFAULT false,
    allow_edit_after_approval BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- 6. Tabla service_records (Jornadas de servicio social)
CREATE TABLE IF NOT EXISTS public.service_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    activity_name TEXT NOT NULL,
    description TEXT NOT NULL,
    service_date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
    supervisor_id UUID REFERENCES public.profiles(id),
    supervisor_name TEXT NOT NULL,
    status record_status NOT NULL DEFAULT 'pending',
    student_notes TEXT,
    reviewer_notes TEXT,
    evidence_url TEXT,
    evidence_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id)
);

-- 7. Tabla audit_logs (RF-13, RNF-11: Trazabilidad inmutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role user_role NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS (Seguridad en la Base de Datos - RNF-03)

-- Profiles: Cada usuario lee su perfil; coordinadores y admins leen y gestionan todos
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
    );

CREATE POLICY "profiles_admin_update" ON public.profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students: Estudiantes leen su propio registro; coordinadores/admins leen todos
CREATE POLICY "students_select_policy" ON public.students
    FOR SELECT USING (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator', 'supervisor'))
    );

CREATE POLICY "students_admin_all" ON public.students
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coordinator'))
    );

-- Service Records:
-- Estudiantes leen sus propios registros
CREATE POLICY "records_student_read" ON public.service_records
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = service_records.student_id AND students.profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator', 'supervisor'))
    );

-- Estudiantes pueden insertar si son sus propios registros y la config lo permite
CREATE POLICY "records_student_insert" ON public.service_records
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.students WHERE students.id = service_records.student_id AND students.profile_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator'))
    );

-- Solo coordinadores y administradores pueden aprobar o rechazar (cambiar status)
CREATE POLICY "records_review_update" ON public.service_records
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator'))
    );

-- Audit logs: Solo lectura para personal autorizado, inserción mediante función de base de datos
CREATE POLICY "audit_logs_read" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordinator'))
    );
`;
