import React from 'react';
import { useApp } from '../context/AppContext';
import { Award, Printer, CheckCircle, GraduationCap, ArrowLeft, Calendar, FileCheck } from 'lucide-react';
import { formatDate } from '../utils/helpers';

interface StudentCertificateViewProps {
  onBack: () => void;
}

export const StudentCertificateView: React.FC<StudentCertificateViewProps> = ({ onBack }) => {
  const { currentStudent, getStudentProgress, settings, records } = useApp();

  if (!currentStudent) return null;

  const progress = getStudentProgress(currentStudent.id);
  const studentApprovedRecords = records.filter(
    (r) => r.student_id === currentStudent.id && r.status === 'approved'
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mi resumen
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Imprimir Certificado Oficial (PDF)
        </button>
      </div>

      {/* Certificate Frame */}
      <div className="bg-white rounded-3xl border-4 border-double border-slate-300 p-8 sm:p-14 shadow-2xl max-w-4xl mx-auto relative overflow-hidden print:shadow-none print:border-2 print:p-8">
        {/* Subtle Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none">
          <GraduationCap className="w-96 h-96 text-slate-900" />
        </div>

        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <Award className="w-10 h-10" />
          </div>

          <p className="text-xs font-bold tracking-widest uppercase text-emerald-800">
            República de Colombia · Secretaría de Educación
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {settings.institution_name}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Registro Oficial de Servicio Social Estudiantil Obligatorio
          </p>

          <div className="my-8 py-2 border-y border-slate-200">
            <h1 className="text-xl sm:text-2xl font-serif italic text-slate-800">
              Certificado de Cumplimiento de Horas
            </h1>
          </div>

          <div className="max-w-2xl mx-auto text-slate-700 text-sm sm:text-base leading-relaxed text-justify sm:text-center space-y-4">
            <p>
              La Coordinación de Servicio Social y la Rectoría de la institución certifican que el(la) estudiante:
            </p>

            <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight my-3">
              {currentStudent.full_name}
            </p>

            <p className="text-xs sm:text-sm text-slate-600">
              Identificado(a) con código estudiantil <span className="font-bold text-slate-800 font-mono">{currentStudent.student_code}</span>, 
              del grado <span className="font-bold text-slate-800">{currentStudent.grade}</span> ({currentStudent.group_name}), 
              ha cumplido satisfactoriamente con la totalidad de:
            </p>

            <div className="inline-block bg-emerald-50 border border-emerald-300 rounded-2xl px-6 py-3 my-2 text-center">
              <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                {progress.approvedHours} Horas Aprobadas
              </span>
              <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                Sobre una meta requerida de {progress.targetHours} horas institucionales.
              </p>
            </div>

            <p className="text-xs text-slate-600">
              En constancia de lo anterior, se expide el presente documento para los fines de graduación y promoción académica en el periodo lectivo {settings.academic_year}.
            </p>
          </div>

          {/* Activities Summary */}
          <div className="mt-8 pt-6 border-t border-slate-100 max-w-2xl mx-auto text-left">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Resumen de Jornadas Validadas ({studentApprovedRecords.length})
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600">
              {studentApprovedRecords.map((r) => (
                <div key={r.id} className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="truncate pr-4">• {r.activity_name} ({formatDate(r.service_date)})</span>
                  <span className="font-mono font-bold text-slate-800 shrink-0">{r.hours} h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 max-w-xl mx-auto text-center">
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2" />
              <p className="text-xs font-bold text-slate-800">Prof. Marcela Gómez</p>
              <p className="text-[11px] text-slate-500">Coordinadora de Servicio Social</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2" />
              <p className="text-xs font-bold text-slate-800">Lic. Carlos Restrepo</p>
              <p className="text-[11px] text-slate-500">Rector / Dirección General</p>
            </div>
          </div>

          <div className="mt-8 text-[10px] text-slate-400 font-mono">
            Código de Verificación Digital: SS-{currentStudent.student_code}-{Date.now().toString(36).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
