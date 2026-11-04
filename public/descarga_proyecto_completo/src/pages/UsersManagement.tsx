import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Profile, UserRole } from '../types';
import { formatDate } from '../utils/helpers';
import { 
  UserCog, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone, 
  Search, 
  Edit3,
  AlertCircle
} from 'lucide-react';

export const UsersManagement: React.FC = () => {
  const { profiles, createUser, updateUser, toggleUserStatus, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'coordinator' as UserRole,
    phone: '',
  });
  const [errorMsg, setErrorMsg] = useState('');

  const filteredProfiles = profiles.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleOpenCreate = () => {
    setEditingProfile(null);
    setFormData({
      full_name: '',
      email: '',
      role: 'coordinator',
      phone: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      phone: profile.phone || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.full_name.trim()) {
      setErrorMsg('El nombre completo es requerido.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMsg('Ingrese un correo electrónico válido.');
      return;
    }

    // Check duplicate email
    const duplicate = profiles.find(
      (p) =>
        p.email.toLowerCase() === formData.email.trim().toLowerCase() &&
        (!editingProfile || p.id !== editingProfile.id)
    );
    if (duplicate) {
      setErrorMsg(`El correo "${formData.email}" ya está registrado en otra cuenta.`);
      return;
    }

    if (editingProfile) {
      updateUser(editingProfile.id, {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        phone: formData.phone.trim() || undefined,
      });
    } else {
      createUser({
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        active: true,
        phone: formData.phone.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-purple-600" />
            <span>Gestión de Cuentas y Roles de Usuario (RF-04)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administre accesos para administradores, coordinadores, docentes supervisores y estudiantes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-700/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo institucional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-purple-500 font-medium"
          >
            <option value="all">Todos los roles ({profiles.length})</option>
            <option value="admin">Administradores</option>
            <option value="coordinator">Coordinadores</option>
            <option value="supervisor">Docentes Supervisores</option>
            <option value="student">Estudiantes</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Rol Asignado</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Fecha Creación</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {profile.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{profile.full_name}</div>
                        <div className="text-[11px] text-slate-500">{profile.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RoleBadge role={profile.role} />
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    {profile.phone ? (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {profile.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No registrado</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                    {formatDate(profile.created_at)}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      disabled={profile.id === currentUser.id}
                      onClick={() => toggleUserStatus(profile.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                        profile.id === currentUser.id
                          ? 'opacity-60 cursor-not-allowed bg-emerald-50 text-emerald-700'
                          : profile.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 cursor-pointer'
                      }`}
                      title={
                        profile.id === currentUser.id
                          ? 'No puede desactivar su propia cuenta'
                          : 'Haga clic para cambiar estado'
                      }
                    >
                      {profile.active ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Activo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          Inactivo
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(profile)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Modificar rol o datos"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for User Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProfile ? 'Editar Usuario' : 'Nuevo Usuario Institucional'}
        subtitle="Asigne roles con base en las atribuciones del reglamento escolar."
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Ej. Prof. Julián Restrepo"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Correo Institucional <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="usuario@colegio.edu.co"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Rol en el Sistema <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium"
            >
              <option value="coordinator">Coordinador de Servicio Social</option>
              <option value="admin">Administrador General</option>
              <option value="supervisor">Docente Supervisor</option>
              <option value="student">Estudiante</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+57 300 000 0000"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md cursor-pointer"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
