import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/helpers';
import { RoleBadge } from '../components/common/Badge';
import { History, ShieldCheck, Search, Filter, ArrowRight, Eye, FileCode2 } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchSearch =
      log.actor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'APROBAR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'RECHAZAR':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CREAR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACTUALIZAR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ANULAR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IMPORTAR_CSV':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Pista de Auditoría y Trazabilidad (RF-13, RNF-11)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro cronológico inmutable de aprobaciones, rechazos, modificaciones y accesos relevantes.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Total Eventos Registrados: {auditLogs.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por usuario actor, descripción o ID de registro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="all">Todas las acciones ({auditLogs.length})</option>
            <option value="APROBAR">Aprobaciones</option>
            <option value="RECHAZAR">Rechazos</option>
            <option value="CREAR">Creaciones</option>
            <option value="ACTUALIZAR">Actualizaciones</option>
            <option value="ANULAR">Anulaciones</option>
            <option value="IMPORTAR_CSV">Importaciones CSV</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No se encontraron registros de auditoría que coincidan con la búsqueda.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario Responsable</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                  <th className="py-3 px-4">Entidad / Detalle</th>
                  <th className="py-3 px-4 text-right">Datos Técnicos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                          {formatDateTime(log.created_at)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{log.actor_name}</div>
                          <div className="mt-0.5">
                            <RoleBadge role={log.actor_role} size="sm" />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-md">
                          <div className="text-slate-800 font-medium leading-relaxed">{log.details}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {log.entity_type} · ID: {log.entity_id}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {(log.previous_value || log.new_value) && (
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>{isExpanded ? 'Ocultar' : 'Ver payload'}</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-900 text-slate-200">
                          <td colSpan={5} className="p-4 font-mono text-[11px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {log.previous_value && (
                                <div>
                                  <span className="text-rose-400 font-bold block mb-1">
                                    Valor Anterior (Previous State):
                                  </span>
                                  <pre className="p-2 bg-slate-950 rounded-lg overflow-x-auto text-slate-300">
                                    {JSON.stringify(log.previous_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div>
                                  <span className="text-emerald-400 font-bold block mb-1">
                                    Nuevo Valor (New State):
                                  </span>
                                  <pre className="p-2 bg-slate-950 rounded-lg overflow-x-auto text-slate-300">
                                    {JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
