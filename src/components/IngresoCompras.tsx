import React, { useState } from 'react';
import { CreditCard, Responsible, Purchase } from '../types';
import { formatCurrency, formatMonthYear, getCurrentMonthStr, generateId, getPurchaseStatus } from '../lib/utils';
import { Plus, Search, Trash2, Edit2, ShoppingCart, Percent, Camera, Image as ImageIcon, Eye, X, Download, AlertCircle, CheckCircle2, Sparkles, Filter } from 'lucide-react';

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
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');

  // Image Modal State
  const [viewingReceipt, setViewingReceipt] = useState<{ title: string; url: string } | null>(null);

  // Filters
  const [filterCard, setFilterCard] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'last' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Auto calculate installment amount when total amount or installments count changes
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

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 900;
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setReceiptUrl(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
    setReceiptUrl(undefined);
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
    setReceiptUrl(p.receiptUrl);
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
      receiptUrl: receiptUrl || undefined,
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

  // Analysis of Purchases
  const purchasesWithStatus = purchases.map((p) => ({
    purchase: p,
    statusInfo: getPurchaseStatus(p, currentMonth),
  }));

  const completedPurchases = purchasesWithStatus.filter((item) => item.statusInfo.isCompleted);
  const lastInstallmentPurchases = purchasesWithStatus.filter((item) => item.statusInfo.isLastInstallment);

  const handleDeleteAllCompleted = () => {
    if (completedPurchases.length === 0) return;
    if (
      window.confirm(
        `¿Deseas eliminar las ${completedPurchases.length} compras que ya han sido pagadas totalmente? Esta acción liberará espacio de tu lista de cuotas.`
      )
    ) {
      completedPurchases.forEach((item) => onDeletePurchase(item.purchase.id));
    }
  };

  // Filtered Purchases
  const filteredPurchases = purchases.filter((p) => {
    if (filterCard !== 'all' && p.cardId !== filterCard) return false;
    if (filterResponsible !== 'all' && p.responsibleId !== filterResponsible) return false;

    const st = getPurchaseStatus(p, currentMonth);
    if (filterStatus === 'active' && (st.isCompleted || st.status === 'future')) return false;
    if (filterStatus === 'last' && !st.isLastInstallment) return false;
    if (filterStatus === 'completed' && !st.isCompleted) return false;

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
          <h2 className="text-xl font-bold text-slate-800">Ingreso y Registro de Compras (Cuotas)</h2>
          <p className="text-sm text-slate-500">
            Registra las compras realizadas con tarjeta de crédito, indica la cantidad de cuotas y el familiar responsable para el cálculo mensual.
          </p>
        </div>
        <button
          id="btn-nueva-compra"
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Nueva Compra</span>
        </button>
      </div>

      {/* Alert Banner for Completed Purchases */}
      {completedPurchases.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5 sm:mt-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                ¡Tienes {completedPurchases.length} {completedPurchases.length === 1 ? 'compra' : 'compras'} pagadas en su totalidad!
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Ya se cancelaron todas sus cuotas. Puedes filtrarlas o eliminarlas de tu lista para mantener limpio tu registro.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('completed')}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver pagadas
            </button>
            <button
              onClick={handleDeleteAllCompleted}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar compras pagadas ({completedPurchases.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Alert Banner for Last Installment Purchases */}
      {lastInstallmentPurchases.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {lastInstallmentPurchases.length} {lastInstallmentPurchases.length === 1 ? 'compra paga' : 'compras pagan'} su ÚLTIMA cuota este mes
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Ejemplo: {lastInstallmentPurchases.map((i) => `"${i.purchase.description}"`).join(', ')}. El próximo mes figurará como pagada totalmente.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('last')}
            className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Ver últimas cuotas
          </button>
        </div>
      )}

      {/* Form Drawer / Modal */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md animate-fadeIn">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-600" />
              {editingId ? 'Editar Compra' : 'Registrar Nueva Compra'}
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
                  Tarjeta Usada <span className="text-rose-500">*</span>
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
                  placeholder="Ej: Supermercado, Televisor, Ropa, etc."
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

            {/* Fotografiar / Adjuntar Boleta */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Fotografiar o Adjuntar Boleta / Comprobante</span>
              </label>

              {receiptUrl ? (
                <div className="flex items-center gap-4">
                  <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-300 bg-black">
                    <img src={receiptUrl} alt="Boleta" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setViewingReceipt({ title: description || 'Boleta', url: receiptUrl })}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      ✓ Boleta adjuntada correctamente
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingReceipt({ title: description || 'Boleta', url: receiptUrl })}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer underline"
                      >
                        Ver boleta
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptUrl(undefined)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                      >
                        Eliminar foto
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Tomar Foto / Subir Boleta</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleReceiptFile}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    Opcional. Puedes usar la cámara de tu teléfono o subir una imagen.
                  </span>
                </div>
              )}
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

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Estado:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 outline-none font-semibold text-indigo-700"
            >
              <option value="all">Todas ({purchases.length})</option>
              <option value="active">En curso / Activas</option>
              <option value="last">Última cuota ({lastInstallmentPurchases.length})</option>
              <option value="completed">Pagadas totalmente ({completedPurchases.length})</option>
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
                <th className="py-3.5 px-4 text-center">Boleta</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-center">Estado / Cuotas</th>
                <th className="py-3.5 px-4 text-right">Valor Cuota</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4 text-center">% Pagar</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    No hay compras registradas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const cardObj = cards.find((c) => c.id === p.cardId);
                  const respObj = responsibles.find((r) => r.id === p.responsibleId);
                  const statusInfo = getPurchaseStatus(p, currentMonth);

                  let rowBg = 'hover:bg-slate-50/80 transition-colors';
                  if (statusInfo.isCompleted) {
                    rowBg = 'bg-emerald-50/40 hover:bg-emerald-50/80 transition-colors border-l-4 border-l-emerald-500';
                  } else if (statusInfo.isLastInstallment) {
                    rowBg = 'bg-amber-50/40 hover:bg-amber-50/80 transition-colors border-l-4 border-l-amber-500';
                  }

                  return (
                    <tr key={p.id} className={rowBg}>
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
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                          <span>{p.description}</span>
                          {statusInfo.isCompleted && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              COMPRA PAGADA
                            </span>
                          )}
                          {statusInfo.isLastInstallment && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-amber-300">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              ÚLTIMA CUOTA
                            </span>
                          )}
                        </div>
                        {p.notes && <div className="text-xs text-slate-400 italic">{p.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.receiptUrl ? (
                          <button
                            onClick={() => setViewingReceipt({ title: p.description, url: p.receiptUrl! })}
                            title="Ver boleta adjunta"
                            className="p-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Ver</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {statusInfo.isCompleted ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-lg text-xs font-extrabold shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pagada (Fin {formatMonthYear(statusInfo.lastMonth)})</span>
                          </span>
                        ) : statusInfo.isLastInstallment ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded-lg text-xs font-extrabold shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Cuota {statusInfo.totalInstallments} de {statusInfo.totalInstallments} (Última)</span>
                          </span>
                        ) : (
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-xs font-semibold">
                            Cuota {statusInfo.currentInstallment} de {statusInfo.totalInstallments}
                          </span>
                        )}
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

      {/* View Receipt Image Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                <span>Boleta: {viewingReceipt.title}</span>
              </h3>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 overflow-auto flex-1 flex justify-center items-center bg-slate-900/5 rounded-xl my-2">
              <img
                src={viewingReceipt.url}
                alt={viewingReceipt.title}
                className="max-h-[65vh] object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <a
                href={viewingReceipt.url}
                download={`Boleta_${viewingReceipt.title.replace(/\s+/g, '_')}.jpg`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Download className="w-4 h-4" /> Descargar imagen
              </a>
              <button
                onClick={() => setViewingReceipt(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

