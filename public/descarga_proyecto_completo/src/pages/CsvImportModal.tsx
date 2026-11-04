import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { parseStudentCSV, downloadCSV } from '../utils/helpers';
import { UploadCloud, Download, AlertTriangle, CheckCircle2, FileSpreadsheet, Trash2 } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { importStudentsCSV, students } = useApp();
  const [csvText, setCsvText] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<{ success: number; errors: string[] } | null>(null);

  const sampleTemplate = () => {
    const headers = ['codigo', 'nombre', 'email', 'grado', 'grupo', 'telefono'];
    const sampleRows = [
      headers,
      ['EST-2026-020', 'Laura Mariana Morales', 'laura.morales@estudiante.edu.co', '10°', '10A', '+57 311 222 3344'],
      ['EST-2026-021', 'Samuel David Gómez', 'samuel.gomez@estudiante.edu.co', '11°', '11B', '+57 312 444 5566'],
      ['EST-2026-022', 'Mariana Pérez Silva', 'mariana.perez@estudiante.edu.co', '11°', '11A', '+57 315 777 8899'],
    ];
    downloadCSV('plantilla_importacion_estudiantes.csv', sampleRows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      processCsvText(text);
    };
    reader.readAsText(file);
  };

  const processCsvText = (text: string) => {
    setImportSummary(null);
    const { data, errors } = parseStudentCSV(text);
    setParseErrors(errors);
    setParsedData(data);
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;

    const result = importStudentsCSV(
      parsedData.map((d) => ({
        student_code: d.student_code,
        full_name: d.full_name,
        email: d.email,
        grade: d.grade,
        group_name: d.group_name,
        active: true,
        phone: d.phone,
      }))
    );

    setImportSummary({
      success: result.successCount,
      errors: result.errors,
    });

    if (result.successCount > 0 && result.errors.length === 0) {
      setTimeout(() => {
        onClose();
        setCsvText('');
        setParsedData([]);
        setImportSummary(null);
      }, 1500);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar Estudiantes desde Archivo CSV (RF-16)"
      subtitle="Cargue de forma masiva la lista de estudiantes para evitar registros manuales uno por uno."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Template download and instructions */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-slate-800 block">¿No tiene el formato adecuado?</span>
            <span className="text-slate-500">
              Descargue una plantilla preconfigurada con columnas: codigo, nombre, email, grado, grupo, telefono.
            </span>
          </div>
          <button
            type="button"
            onClick={sampleTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Descargar Plantilla CSV</span>
          </button>
        </div>

        {/* Upload or paste area */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Seleccionar archivo CSV desde su dispositivo:
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            O pegar contenido CSV directamente aquí:
          </label>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              processCsvText(e.target.value);
            }}
            placeholder={`codigo,nombre,email,grado,grupo,telefono\nEST-2026-030,Camilo Serna,camilo@estudiante.edu.co,10°,10B,3001234567`}
            className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Errors list */}
        {parseErrors.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Advertencias del archivo:</span>
            </div>
            {parseErrors.map((err, i) => (
              <p key={i} className="text-[11px]">• {err}</p>
            ))}
          </div>
        )}

        {/* Import summary status */}
        {importSummary && (
          <div className={`p-4 rounded-xl border text-xs ${
            importSummary.errors.length > 0 ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300'
          }`}>
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Resultado: {importSummary.success} estudiante(s) importados con éxito.
            </h5>
            {importSummary.errors.map((err, idx) => (
              <p key={idx} className="text-rose-700 text-[11px] mt-1">• {err}</p>
            ))}
          </div>
        )}

        {/* Data preview table */}
        {parsedData.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 flex justify-between items-center">
              <span>Vista previa de importación ({parsedData.length} registros listos)</span>
              <button
                type="button"
                onClick={() => {
                  setParsedData([]);
                  setCsvText('');
                }}
                className="text-slate-400 hover:text-rose-600"
                title="Limpiar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 text-[11px]">
                  <tr>
                    <th className="p-2">Código</th>
                    <th className="p-2">Nombre Completo</th>
                    <th className="p-2">Grado / Grupo</th>
                    <th className="p-2">Correo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedData.map((d, index) => {
                    const isDuplicate = students.some((s) => s.student_code.toLowerCase() === d.student_code.toLowerCase());
                    return (
                      <tr key={index} className={isDuplicate ? 'bg-rose-50/70' : 'hover:bg-slate-50'}>
                        <td className="p-2 font-mono font-medium">
                          {d.student_code}
                          {isDuplicate && <span className="ml-1 text-[10px] text-rose-600 font-bold">(Ya existe)</span>}
                        </td>
                        <td className="p-2 font-semibold text-slate-800">{d.full_name}</td>
                        <td className="p-2">{d.grade} - {d.group_name}</td>
                        <td className="p-2 text-slate-500 truncate max-w-xs">{d.email}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={parsedData.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Importar {parsedData.length} Estudiante(s)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
