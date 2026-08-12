import React, { useState } from 'react';
import { CreditCard, Responsible, Purchase } from '../types';
import { formatCurrency, formatMonthYear, getCurrentMonthStr, generateId } from '../lib/utils';
import { Plus, Search, Trash2, Edit2, CreditCard as CardIcon, Calendar, User, ShoppingCart, Percent } from 'lucide-react';

interface IngresoComprasProps {
  cards: CreditCard[];
  responsibles: Responsible[];
  purchases: Purchase[];
  onAddPurchase: (purchase: Purchase) => void;
  onUpdatePurchase: (purchase: Purchase) => void;
  onDeletePurchase: (id: string) => void;
}

export const IngresoCompras: React.FC<IngresoComprasProps> = ({
  cards,
  responsibles,
  purchases,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
}) => {
  const currentMonth = getCurrentMonthStr();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [cardId, setCardId] = useState<string>(cards[0]?.id || 'ripley');
  const [purchaseDate, setPurchaseDate] = useState<string>(todayStr);
  const [firstPaymentMonth, setFirstPaymentMonth] = useState<string>(currentMonth);
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [isCustomInstallmentAmount, setIsCustomInstallmentAmount] = useState<boolean>(false);
  const [responsibleId, setResponsibleId] = useState<string>(responsibles[0]?.id || '');
  const [percentageToPay, setPercentageToPay] = useState<number>(100);
  const [notes, setNotes] = useState<string>('');

  // Filters
  const [filterCard, setFilterCard] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auto calculate installment amount when total amount or installments count changes (unless manually overridden)
  const handleTotalAmountChange = (val: string) => {
    setTotalAmount(val);
    const num = parseFloat(val) || 0;
    if (!isCustomInstallmentAmount && installmentsCount > 0) {
      setInstallmentAmount(Math.round(num / installmentsCount).toString());
    }
  };

  const handleInstallmentsCountChange = (count: number) => {
    const validCount = Math.max(1, count);
    setInstallmentsCount(validCount);
    const num = parseFloat(totalAmount) || 0;
    if (!isCustomInstallmentAmount && validCount > 0) {
      setInstallmentAmount(Math.round(num / validCount).toString());
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setCardId(cards[0]?.id || 'ripley');
    setPurchaseDate(todayStr);
    setFirstPaymentMonth(currentMonth);
    setTotalAmount('');
    setDescription('');
    setInstallmentsCount(1);
    setInstallmentAmount('');
    setIsCustomInstallmentAmount(false);
    setResponsibleId(responsibles[0]?.id || '');
    setPercentageToPay(100);
    setNotes('');
  };

  const handleOpenNew = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (p: Purchase) => {
    setEditingId(p.id);
    setCardId(p.cardId);
    setPurchaseDate(p.purchaseDate);
    setFirstPaymentMonth(p.firstPaymentMonth);
    setTotalAmount(p.totalAmount.toString());
    setDescription(p.description);
    setInstallmentsCount(p.installmentsCount);
    setInstallmentAmount(p.installmentAmount.toString());
    setIsCustomInstallmentAmount(true);
    setResponsibleId(p.responsibleId);
    setPercentageToPay(p.percentageToPay);
    setNotes(p.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const parsedTotal = parseFloat(totalAmount) || 0;
    const parsedInstallment = parseFloat(installmentAmount) || (installmentsCount > 0 ? Math.round(parsedTotal / installmentsCount) : parsedTotal);

    const purchaseData: Purchase = {
      id: editingId || generateId(),
      cardId,
      purchaseDate,
      firstPaymentMonth: firstPaymentMonth || purchaseDate.substring(0, 7),
      totalAmount: parsedTotal,
      description: description.trim(),
      installmentsCount: Math.max(1, installmentsCount),
      installmentAmount: parsedInstallment,
      responsibleId,
      percentageToPay: percentageToPay > 0 ? percentageToPay : 100,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      onUpdatePurchase(purchaseData);
    } else {
      onAddPurchase(purchaseData);
    }

    setIsFormOpen(false);
    resetForm();
  };

  // Filtered Purchases
  const filteredPurchases = purchases.filter((p) => {
    if (filterCard !== 'all' && p.cardId !== filterCard) return false;
    if (filterResponsible !== 'all' && p.responsibleId !== filterResponsible) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchDesc = p.description.toLowerCase().includes(term);
      const respObj = responsibles.find((r) => r.id === p.responsibleId);
      const matchResp = respObj?.name.toLowerCase().includes(term);
      if (!matchDesc && !matchResp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>Módulo 1</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Ingreso y Registro de Compras</h2>
          <p className="text-sm text-slate-500">
            Registra las compras realizadas con tarjeta de crédito, indica la cantidad de cuotas y el familiar responsable.
          </p>
        </div>
        <button
          id="btn-nueva-compra"
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra</span>
        </button>
      </div>

      {/* Form Drawer / Modal */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md animate-fadeIn">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              {editingId ? 'Editar Compra' : 'Nueva Compra con Tarjeta'}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tarjeta */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tarjeta de Crédito <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="select-tarjeta-compra"
                    value={cardId}
                    onChange={(e) => setCardId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    required
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.bank ? `(${c.bank})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha Compra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fecha de Compra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    setPurchaseDate(e.target.value);
                    if (e.target.value) {
                      setFirstPaymentMonth(e.target.value.substring(0, 7));
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Primer Mes de Cobro */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primer Mes de Cobro <span className="text-rose-500">*</span>
                </label>
                <input
                  type="month"
                  value={firstPaymentMonth}
                  onChange={(e) => setFirstPaymentMonth(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Detalle Compra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detalle / Descripción de la Compra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Televisor 55, Zapatillas Ripley, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Responsable de la Compra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Responsable de la Compra <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-responsable-compra"
                  value={responsibleId}
                  onChange={(e) => setResponsibleId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                >
                  <option value="">-- Seleccionar Familiar --</option>
                  {responsibles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.relationship ? `(${r.relationship})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Valor Compra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Valor Total Compra ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej: 150000"
                  value={totalAmount}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Cantidad de Cuotas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cantidad de Cuotas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={installmentsCount}
                  onChange={(e) => handleInstallmentsCountChange(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Valor Cuota */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Valor Cuota ($)</label>
                  <span className="text-[10px] text-slate-400">
                    {isCustomInstallmentAmount ? 'Editado' : 'Auto'}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej: 15000"
                  value={installmentAmount}
                  onChange={(e) => {
                    setIsCustomInstallmentAmount(true);
                    setInstallmentAmount(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* % a pagar de la cuota */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  % a Pagar de la Cuota
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percentageToPay}
                    onChange={(e) => setPercentageToPay(Math.min(100, Math.max(1, parseInt(e.target.value) || 100)))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3 pr-8 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notas adicionales (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Garantía extendida de 2 años, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="btn-guardar-compra"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar Compra'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por detalle o familiar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-sm text-slate-700 outline-none w-full md:w-64"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Card Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Tarjeta:</span>
            <select
              value={filterCard}
              onChange={(e) => setFilterCard(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Todas las tarjetas</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Responsible Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Responsable:</span>
            <select
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="all">Todos los miembros</option>
              {responsibles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table of Purchases */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tarjeta</th>
                <th className="py-3.5 px-4">Fecha / Mes Cobro</th>
                <th className="py-3.5 px-4">Detalle Compra</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-center">Cuotas</th>
                <th className="py-3.5 px-4 text-right">Valor Cuota</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4 text-center">% Pagar</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    No hay compras registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const cardObj = cards.find((c) => c.id === p.cardId);
                  const respObj = responsibles.find((r) => r.id === p.responsibleId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            cardObj?.badgeBg || 'bg-slate-100'
                          } ${cardObj?.badgeText || 'text-slate-800'}`}
                        >
                          {cardObj?.name || p.cardId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{p.purchaseDate}</div>
                        <div className="text-slate-400">1a cuota: {formatMonthYear(p.firstPaymentMonth)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{p.description}</div>
                        {p.notes && <div className="text-xs text-slate-400 italic">{p.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {p.installmentsCount} {p.installmentsCount === 1 ? 'cuota' : 'cuotas'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {formatCurrency(p.installmentAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {respObj ? (
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${respObj.avatarBg}`} />
                            <span className="font-medium text-xs text-slate-800">{respObj.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {p.percentageToPay}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            title="Editar compra"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeletePurchase(p.id)}
                            title="Eliminar compra"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
