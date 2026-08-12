import React, { useState } from 'react';
import { Responsible, Purchase } from '../types';
import { generateId } from '../lib/utils';
import { Users, Plus, Trash2, Edit2, User, Phone, Mail, Tag, AlertTriangle } from 'lucide-react';

interface GestionResponsablesProps {
  responsibles: Responsible[];
  purchases: Purchase[];
  onAddResponsible: (responsible: Responsible) => void;
  onUpdateResponsible: (responsible: Responsible) => void;
  onDeleteResponsible: (id: string) => void;
}

const COLOR_OPTIONS = [
  { color: '#3B82F6', avatarBg: 'bg-blue-500', name: 'Azul' },
  { color: '#EC4899', avatarBg: 'bg-pink-500', name: 'Rosa' },
  { color: '#10B981', avatarBg: 'bg-emerald-500', name: 'Verde' },
  { color: '#F59E0B', avatarBg: 'bg-amber-500', name: 'Naranja' },
  { color: '#8B5CF6', avatarBg: 'bg-purple-500', name: 'Púrpura' },
  { color: '#6366F1', avatarBg: 'bg-indigo-500', name: 'Índigo' },
  { color: '#EF4444', avatarBg: 'bg-rose-500', name: 'Rojo' },
  { color: '#14B8A6', avatarBg: 'bg-teal-500', name: 'Turquesa' },
];

export const GestionResponsables: React.FC<GestionResponsablesProps> = ({
  responsibles,
  purchases,
  onAddResponsible,
  onUpdateResponsible,
  onDeleteResponsible,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRelationship('');
    setPhone('');
    setEmail('');
    setSelectedColorIdx(0);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (r: Responsible) => {
    setEditingId(r.id);
    setName(r.name);
    setRelationship(r.relationship || '');
    setPhone(r.phone || '');
    setEmail(r.email || '');
    const colorMatch = COLOR_OPTIONS.findIndex((c) => c.color === r.color);
    setSelectedColorIdx(colorMatch >= 0 ? colorMatch : 0);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const colorObj = COLOR_OPTIONS[selectedColorIdx] || COLOR_OPTIONS[0];

    const respData: Responsible = {
      id: editingId || generateId(),
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      email: email.trim(),
      color: colorObj.color,
      avatarBg: colorObj.avatarBg,
    };

    if (editingId) {
      onUpdateResponsible(respData);
    } else {
      onAddResponsible(respData);
    }

    setIsFormOpen(false);
    resetForm();
  };

  // Check if responsible has registered purchases
  const getPurchasesCount = (respId: string) => {
    return purchases.filter((p) => p.responsibleId === respId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <Users className="w-4 h-4" />
            <span>Módulo 4</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Gestión de Responsables de Compras</h2>
          <p className="text-sm text-slate-500">
            Añade, edita o elimina los miembros de la familia que realizan compras con las tarjetas.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Responsable</span>
        </button>
      </div>

      {/* Form Drawer / Modal */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md animate-fadeIn">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              {editingId ? 'Editar Responsable' : 'Nuevo Responsable de Compra'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre Completo / Apodo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Papá (Jorge), Hermana (Ana)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Parenteza / Relación (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Padre, Hija, Primo, Tío"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teléfono (para enviar cobros por WhatsApp)
                </label>
                <input
                  type="text"
                  placeholder="Ej: +56 9 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="Ej: familiar@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Color Tag Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Color Identificador
              </label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c, idx) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setSelectedColorIdx(idx)}
                    className={`w-8 h-8 rounded-full ${c.avatarBg} transition-transform cursor-pointer ${
                      selectedColorIdx === idx ? 'ring-4 ring-indigo-200 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Añadir Responsable'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Responsibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {responsibles.map((resp) => {
          const purchasesCount = getPurchasesCount(resp.id);

          return (
            <div
              key={resp.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-10 h-10 rounded-2xl ${resp.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-xs`}>
                    {resp.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(resp)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteResponsible(resp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 text-base">{resp.name}</h3>
                {resp.relationship && (
                  <span className="inline-block text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                    {resp.relationship}
                  </span>
                )}

                <div className="space-y-1.5 mt-4 text-xs text-slate-500">
                  {resp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{resp.phone}</span>
                    </div>
                  )}
                  {resp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{resp.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">Compras asociadas:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {purchasesCount} {purchasesCount === 1 ? 'compra' : 'compras'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
