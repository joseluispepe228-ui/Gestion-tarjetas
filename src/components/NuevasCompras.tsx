import React, { useState } from 'react';
import { CreditCard, Responsible, NewPurchase, Purchase } from '../types';
import { formatCurrency, generateId, formatMonthYear } from '../lib/utils';
import { Plus, Search, Trash2, Edit2, ShoppingBag, Camera, Image as ImageIcon, Eye, X, Download, ArrowRight, CheckCircle } from 'lucide-react';

interface NuevasComprasProps {
  cards: CreditCard[];
  responsibles: Responsible[];
  newPurchases: NewPurchase[];
  onAddNewPurchase: (p: NewPurchase) => void;
  onUpdateNewPurchase: (p: NewPurchase) => void;
  onDeleteNewPurchase: (id: string) => void;
  onConvertToModule1?: (p: Purchase) => void;
}

export const NuevasCompras: React.FC<NuevasComprasProps> = ({
  cards,
  responsibles,
  newPurchases,
  onAddNewPurchase,
  onUpdateNewPurchase,
  onDeleteNewPurchase,
  onConvertToModule1,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [purchaseDate, setPurchaseDate] = useState<string>(todayStr);
  const [cardId, setCardId] = useState<string>(cards[0]?.id || 'ripley');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [responsibleId, setResponsibleId] = useState<string>(responsibles[0]?.id || '');
  const [installmentsCount, setInstallmentsCount] = useState<number>(1);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Modals & Feedback
  const [viewingReceipt, setViewingReceipt] = useState<{ title: string; url: string } | null>(null);
  const [transferredMessage, setTransferredMessage] = useState<string | null>(null);

  // Filters
  const [filterCard, setFilterCard] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

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
    setPurchaseDate(todayStr);
    setCardId(cards[0]?.id || 'ripley');
    setTotalAmount('');
    setResponsibleId(responsibles[0]?.id || '');
    setInstallmentsCount(1);
    setReceiptUrl(undefined);
    setDescription('');
    setNotes('');
  };

  const handleOpenNew = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (p: NewPurchase) => {
    setEditingId(p.id);
    setPurchaseDate(p.purchaseDate);
    setCardId(p.cardId);
    setTotalAmount(p.totalAmount.toString());
    setResponsibleId(p.responsibleId);
    setInstallmentsCount(p.installmentsCount);
    setReceiptUrl(p.receiptUrl);
    setDescription(p.description);
    setNotes(p.notes || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const parsedTotal = parseFloat(totalAmount) || 0;

    const item: NewPurchase = {
      id: editingId || generateId(),
      purchaseDate,
      cardId,
      totalAmount: parsedTotal,
      responsibleId,
      installmentsCount: Math.max(1, installmentsCount),
      receiptUrl: receiptUrl || undefined,
      description: description.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      onUpdateNewPurchase(item);
    } else {
      onAddNewPurchase(item);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleTransferToModule1 = (p: NewPurchase) => {
    if (!onConvertToModule1) return;
    const firstMonth = p.purchaseDate ? p.purchaseDate.substring(0, 7) : new Date().toISOString().slice(0, 7);
    const parsedTotal = p.totalAmount;
    const installments = p.installmentsCount || 1;
    const calculatedInstallment = Math.round(parsedTotal / installments);

    const m1Purchase: Purchase = {
      id: generateId(),
      cardId: p.cardId,
      purchaseDate: p.purchaseDate,
      firstPaymentMonth: firstMonth,
      totalAmount: parsedTotal,
      description: p.description,
      installmentsCount: installments,
      installmentAmount: calculatedInstallment,
      responsibleId: p.responsibleId,
      percentageToPay: 100,
      receiptUrl: p.receiptUrl,
      notes: p.notes,
      createdAt: new Date().toISOString(),
    };

    onConvertToModule1(m1Purchase);
    setTransferredMessage(`Compra "${p.description}" agregada exitosamente al Módulo 1 (Cálculo de Cuotas).`);
    setTimeout(() => setTransferredMessage(null), 3500);
  };

  // Filtered
  const filteredPurchases = newPurchases.filter((p) => {
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
      {/* Module 6 Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Módulo 6</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Bitácora y Registro de Compras Nuevas</h2>
          <p className="text-sm text-slate-500">
            Registra tus compras inmediatamente al realizarlas, antes de que figuren en tus estados de cuenta. Fotografías tu boleta y guarda los detalles.
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra Nueva</span>
        </button>
      </div>

      {transferredMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{transferredMessage}</span>
        </div>
      )}

      {/* Form Modal / Drawer */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md animate-fadeIn">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              {editingId ? 'Editar Registro de Compra' : 'Registrar Nueva Compra en la Bitácora'}
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
              {/* Fecha Compra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fecha de Compra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Tarjeta Usada */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tarjeta Usada <span className="text-rose-500">*</span>
                </label>
                <select
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

              {/* Responsable */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Responsable de la Compra <span className="text-rose-500">*</span>
                </label>
                <select
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Detalle Compra */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Detalle / Descripción de la Compra <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Supermercado, Almuerzo, Zapatillas, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Valor Compra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Valor Compra ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej: 45000"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                  required
                />
              </div>

              {/* Notas Adicionales */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Lugar de compra, garantía, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            {/* Fotografiar / Adjuntar Boleta */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Fotografiar Boleta / Comprobante de Pago</span>
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
                      ✓ Boleta fotografiada correctamente
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
                  <label className="flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Tomar Foto con Cámara / Cargar Imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleReceiptFile}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">
                    Opcional. Puedes usar la cámara de tu teléfono móvil.
                  </span>
                </div>
              )}
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
              >
                {editingId ? 'Guardar Cambios' : 'Registrar en Bitácora'}
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
            placeholder="Buscar en compras registradas..."
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

      {/* List / Table of New Purchases */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Tarjeta Usada</th>
                <th className="py-3.5 px-4">Detalle Compra</th>
                <th className="py-3.5 px-4 text-center">Boleta</th>
                <th className="py-3.5 px-4 text-right">Valor Compra</th>
                <th className="py-3.5 px-4 text-center">Cuotas</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No hay compras registradas en este módulo. Haz clic en "Registrar Compra Nueva" para agregar una.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const cardObj = cards.find((c) => c.id === p.cardId);
                  const respObj = responsibles.find((r) => r.id === p.responsibleId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-xs whitespace-nowrap text-slate-800">
                        {p.purchaseDate}
                      </td>
                      <td className="py-3.5 px-4 font-medium">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            cardObj?.badgeBg || 'bg-slate-100'
                          } ${cardObj?.badgeText || 'text-slate-800'}`}
                        >
                          {cardObj?.name || p.cardId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{p.description}</div>
                        {p.notes && <div className="text-xs text-slate-400 italic">{p.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.receiptUrl ? (
                          <button
                            onClick={() => setViewingReceipt({ title: p.description, url: p.receiptUrl! })}
                            title="Ver boleta fotografiada"
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>Ver Foto</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">Sin foto</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800">
                        {formatCurrency(p.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                          {p.installmentsCount} {p.installmentsCount === 1 ? 'cuota' : 'cuotas'}
                        </span>
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
                        <div className="flex justify-center items-center gap-1">
                          {onConvertToModule1 && (
                            <button
                              onClick={() => handleTransferToModule1(p)}
                              title="Pasar esta compra al Módulo 1 (Cálculo de cuotas)"
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                            >
                              <span>A Módulo 1</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(p)}
                            title="Editar compra"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteNewPurchase(p.id)}
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

      {/* Image Modal */}
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
                <Download className="w-4 h-4" /> Descargar foto boleta
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
