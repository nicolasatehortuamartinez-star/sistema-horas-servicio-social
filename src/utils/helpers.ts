/**
 * Utility functions for formatting, CSV export/import, and calculations
 */

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatHours = (hours: number): string => {
  if (Number.isInteger(hours)) {
    return `${hours} h`;
  }
  return `${hours.toFixed(1)} h`;
};

/**
 * Downloads a structured CSV file with UTF-8 BOM to prevent accent/encoding issues in Excel
 */
export const downloadCSV = (filename: string, rows: string[][]) => {
  const processRow = (row: string[]) => {
    return row
      .map((val) => {
        const stringVal = val === null || val === undefined ? '' : String(val);
        // Escape quotes
        const result = stringVal.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0) {
          return `"${result}"`;
        }
        return `"${result}"`;
      })
      .join(';'); // Semicolon is widely compatible with Spanish Excel
  };

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Normalizes and validates Tarjeta de Identidad (student_code)
 */
export const normalizeAndValidateTI = (
  raw: string
): { valid: boolean; value: string; error?: string } => {
  const cleaned = String(raw || '')
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
        'La Tarjeta de Identidad debe contener únicamente entre 6 y 12 dígitos numéricos (sin letras ni símbolos).',
    };
  }
  return { valid: true, value: cleaned };
};

/**
 * Parses simple CSV content for student import
 */
export const parseStudentCSV = (
  text: string
): {
  data: Array<{
    student_code: string;
    full_name: string;
    email: string;
    grade: string;
    group_name: string;
    phone?: string;
  }>;
  errors: string[];
} => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { data: [], errors: ['El archivo no contiene suficientes filas de datos (mínimo cabecera y un registro).'] };
  }

  // Detect delimiter (comma or semicolon)
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  // Map header positions
  const codeIdx = headers.findIndex(
    (h) =>
      h.includes('tarjeta') ||
      h.includes('identidad') ||
      h.includes('documento') ||
      h === 'ti' ||
      h.includes('codigo') ||
      h.includes('código') ||
      h === 'code'
  );
  const nameIdx = headers.findIndex((h) => h.includes('nombre') || h.includes('name'));
  const emailIdx = headers.findIndex((h) => h.includes('correo') || h.includes('email'));
  const gradeIdx = headers.findIndex((h) => h.includes('grado') || h.includes('grade'));
  const groupIdx = headers.findIndex((h) => h.includes('grupo') || h.includes('curso') || h === 'group');
  const phoneIdx = headers.findIndex((h) => h.includes('telefono') || h.includes('teléfono') || h.includes('phone'));

  if (codeIdx === -1 || nameIdx === -1 || emailIdx === -1) {
    return {
      data: [],
      errors: [
        'Cabecera inválida. Se requieren las columnas "tarjeta_identidad", "nombre" y "email". Formato esperado: tarjeta_identidad,nombre,email,grado,grupo,telefono',
      ],
    };
  }

  const results: Array<{
    student_code: string;
    full_name: string;
    email: string;
    grade: string;
    group_name: string;
    phone?: string;
  }> = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Basic splitter handling quotes
    const cols = line
      .split(delimiter)
      .map((c) => c.trim().replace(/^"|"$/g, '').trim());

    const rawCode = cols[codeIdx] || '';
    const full_name = cols[nameIdx] || '';
    const email = (cols[emailIdx] || '').trim().toLowerCase();
    const grade = gradeIdx !== -1 ? cols[gradeIdx] || '10°' : '10°';
    const group_name = groupIdx !== -1 ? cols[groupIdx] || '' : '';
    const phone = phoneIdx !== -1 ? cols[phoneIdx] : undefined;

    const tiCheck = normalizeAndValidateTI(rawCode);
    if (!tiCheck.valid) {
      errors.push(`Fila ${i + 1}: ${tiCheck.error}`);
      continue;
    }
    if (!full_name) {
      errors.push(`Fila ${i + 1}: Nombre de estudiante vacío.`);
      continue;
    }
    if (!email || !email.includes('@')) {
      errors.push(`Fila ${i + 1} (T.I. ${tiCheck.value}): Correo electrónico inválido o vacío.`);
      continue;
    }
    if (!group_name) {
      errors.push(`Fila ${i + 1} (T.I. ${tiCheck.value}): Grupo vacío.`);
      continue;
    }

    results.push({
      student_code: tiCheck.value,
      full_name,
      email,
      grade: grade.includes('°') ? grade : `${grade}°`,
      group_name: group_name.toUpperCase(),
      phone,
    });
  }

  return { data: results, errors };
};
