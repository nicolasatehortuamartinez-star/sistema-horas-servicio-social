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
  const codeIdx = headers.findIndex((h) => h.includes('codigo') || h.includes('código') || h === 'code');
  const nameIdx = headers.findIndex((h) => h.includes('nombre') || h.includes('name'));
  const emailIdx = headers.findIndex((h) => h.includes('correo') || h.includes('email'));
  const gradeIdx = headers.findIndex((h) => h.includes('grado') || h.includes('grade'));
  const groupIdx = headers.findIndex((h) => h.includes('grupo') || h.includes('curso') || h === 'group');
  const phoneIdx = headers.findIndex((h) => h.includes('telefono') || h.includes('teléfono') || h.includes('phone'));

  if (codeIdx === -1 || nameIdx === -1) {
    return {
      data: [],
      errors: [
        'Cabecera inválida. Se requieren al menos las columnas "codigo" y "nombre". Formato esperado: codigo,nombre,email,grado,grupo',
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

    const student_code = cols[codeIdx] || '';
    const full_name = cols[nameIdx] || '';
    const email = emailIdx !== -1 ? cols[emailIdx] || '' : '';
    const grade = gradeIdx !== -1 ? cols[gradeIdx] || '10°' : '10°';
    const group_name = groupIdx !== -1 ? cols[groupIdx] || '10A' : '10A';
    const phone = phoneIdx !== -1 ? cols[phoneIdx] : undefined;

    if (!student_code) {
      errors.push(`Fila ${i + 1}: Código de estudiante vacío.`);
      continue;
    }
    if (!full_name) {
      errors.push(`Fila ${i + 1}: Nombre de estudiante vacío.`);
      continue;
    }

    results.push({
      student_code,
      full_name,
      email: email || `${student_code.toLowerCase()}@estudiante.edu.co`,
      grade: grade.includes('°') ? grade : `${grade}°`,
      group_name,
      phone,
    });
  }

  return { data: results, errors };
};
