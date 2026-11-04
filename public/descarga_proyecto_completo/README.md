# Sistema Web para el Registro y Control de Horas de Servicio Social

Plataforma web centralizada para digitalizar el registro, validación, seguimiento y emisión de reportes de las horas de servicio social escolar obligatorio, reemplazando el registro manual en hojas de papel.

---

## 1. Arquitectura y Tecnologías
- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Base de Datos & Auth:** PostgreSQL con Supabase (Esquema DDL completo y políticas RLS en `/supabase/schema.sql`).
- **Control de Estado & Almacenamiento:** Context API desacoplado con persistencia automática en `localStorage`, cálculo estricto de horas (RF-08, RNF-07) y pista de auditoría inmutable (`audit_logs`).
- **Diseño UX/UI:** Adaptabilidad responsiva para computador, tableta y teléfono móvil.

---

## 2. Trazabilidad de Requerimientos

| Requerimiento | Descripción | Implementación en Código |
|---|---|---|
| **RF-01** | Inicio y cierre de sesión | `src/pages/LoginView.tsx` |
| **RF-02** | Control de acceso por rol | `src/components/layout/Navbar.tsx` y políticas SQL RLS |
| **RF-03** | Gestión de estudiantes | `src/pages/StudentsManagement.tsx` |
| **RF-04** | Gestión de usuarios y roles | `src/pages/UsersManagement.tsx` |
| **RF-05** | Registro de jornada | `src/pages/RecordFormModal.tsx` |
| **RF-06** | Validación y rechazo obligatorio | `src/pages/ReviewRecordModal.tsx` |
| **RF-07** | Estados (Borrador, Pendiente, Aprobada, Rechazada) | `src/components/common/Badge.tsx` |
| **RF-08** | Cálculo automático de horas aprobadas | `src/context/AppContext.tsx` (`getStudentProgress`) |
| **RF-09** | Panel del estudiante | `src/pages/StudentDashboard.tsx` |
| **RF-10** | Panel administrativo y coordinación | `src/pages/CoordinatorDashboard.tsx` |
| **RF-11** | Búsqueda y filtros avanzados | Filtros por fecha, estado, grupo y estudiante |
| **RF-12** | Reportes (Consolidado, Grupo, Jornadas) | `src/pages/ReportsView.tsx` (Exportación CSV e impresión PDF) |
| **RF-13** | Trazabilidad e historial de auditoría | `src/pages/AuditLogView.tsx` |
| **RF-14** | Evidencias documentales opcionales | Carga de archivos y enlaces en `RecordFormModal.tsx` |
| **RF-15** | Configuración institucional | `src/pages/SettingsView.tsx` |
| **RF-16** | Importación masiva de estudiantes CSV | `src/pages/CsvImportModal.tsx` |

---

## 3. Instalación y Ejecución Local

### Prerrequisitos
- Node.js versión 18 o superior.
- Gestor de paquetes npm o bun.

### Pasos
1. Clonar el repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd react-example
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor de desarrollo en el puerto 3000:
   ```bash
   npm run dev
   ```
4. Abrir en el navegador: `http://localhost:3000`

---

## 4. Despliegue en GitHub, Supabase y Vercel

### Paso 1: Supabase (Base de datos y RLS)
1. Inicie sesión en [supabase.com](https://supabase.com) y cree un nuevo proyecto.
2. Ingrese a **SQL Editor**, abra el archivo `/supabase/schema.sql` del proyecto y ejecute todo el contenido.
3. Copie las credenciales públicas en **Project Settings → API**:
   - `URL` de la API
   - `anon public` key (clave anónima pública; **nunca** utilice `service_role` en el cliente).

### Paso 2: Subir a GitHub
```bash
git init
git add .
git commit -m "feat: Sistema de horas de servicio social escolar completo"
git branch -M main
git remote add origin <URL_DE_TU_REPOSITORIO_GITHUB>
git push -u origin main
```

### Paso 3: Despliegue en Vercel
1. Inicie sesión en [vercel.com](https://vercel.com) y vincule el repositorio de GitHub.
2. Configure las variables de entorno en el panel de configuración de Vercel:
   - `VITE_SUPABASE_URL = "https://tu-proyecto.supabase.co"`
   - `VITE_SUPABASE_ANON_KEY = "tu_clave_anonima_publica"`
3. Haga clic en **Deploy**.

---

## 5. Decisiones Institucionales Resueltas
- **Quién registra:** Parámetro configurable en `institution_settings` (Estudiante + Coordinador o Solo Coordinador).
- **Meta de horas:** Parámetro editable general (por defecto 80h) con desglose por grado (10°: 40h, 11°: 40h).
- **Límite por jornada:** Máximo 8 horas diarias para prevenir inconsistencias de digitación.
- **Evidencias:** Booleano opcional/obligatorio para adjuntar constancias digitales o enlaces compartidos.
