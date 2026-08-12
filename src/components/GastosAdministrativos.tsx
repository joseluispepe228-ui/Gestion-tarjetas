import React, { useState } from 'react';
import { CreditCard, Responsible, MonthlyStatement, AdminFeeAllocation, Purchase } from '../types';
import { formatCurrency, formatMonthYear, getCurrentMonthStr, getInstallmentForMonth, generateId } from '../lib/utils';
import { Calculator, Calendar, Save, Percent, Users, CheckCircle, RefreshCw } from 'lucide-react';

interface GastosAdministrativosProps {
  cards: CreditCard[];
  responsibles: Responsible[];
  statements: MonthlyStatement[];
  adminFees: AdminFeeAllocation[];
  purchases: Purchase[];
  onSaveAdminFee: (allocation: AdminFeeAllocation) => void;
  onSaveMultipleAdminFees: (allocations: AdminFeeAllocation[]) => void;
}

export const GastosAdministrativos: React.FC<GastosAdministrativosProps> = ({
  cards,
  responsibles,
  statements,
  adminFees,
  purchases,
  onSaveAdminFee,
  onSaveMultipleAdminFees,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || 'ripley');
  const [manualFees, setManualFees] = useState<{ [respId: string]: string }>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Active Card & Active Statement
  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];
  const activeStatement = statements.find((s) => s.cardId === selectedCardId && s.month === selectedMonth);

  // Calculate sum of active installments for this card & month
  const activeInstallmentsSum = purchases.reduce((sum, p) => {
    if (p.cardId === selectedCardId) {
      const inst = getInstallmentForMonth(p, selectedMonth);
      if (inst) {
        return sum + inst.installmentAmount;
      }
    }
    return sum;
  }, 0);

  const statementTotal = activeStatement ? activeStatement.statementTotal : 0;
  const differenceAmount = Math.max(0, statementTotal - activeInstallmentsSum);

  // Load existing allocations into local state when card or month changes
  React.useEffect(() => {
    const existingForCard = adminFees.filter((a) => a.cardId === selectedCardId && a.month === selectedMonth);
    const initialMap: { [respId: string]: string } = {};

    responsibles.forEach((r) => {
      const found = existingForCard.find((a) => a.responsibleId === r.id);
      initialMap[r.id] = found ? found.allocatedAmount.toString() : '0';
    });

    setManualFees(initialMap);
  }, [selectedCardId, selectedMonth, adminFees, responsibles]);

  // Active responsibles who actually have purchases on this card in this month
  const responsiblesWithPurchases = responsibles.filter((r) => {
    return purchases.some((p) => p.cardId === selectedCardId && p.responsibleId === r.id && getInstallmentForMonth(p, selectedMonth));
  });

  const handleInputChange = (respId: string, val: string) => {
    setManualFees((prev) => ({ ...prev, [respId]: val }));
  };

  // Helper: Prorate Equally among active responsibles
  const handleProrateEqually = () => {
    if (differenceAmount <= 0) return;
    const targetList = responsiblesWithPurchases.length > 0 ? responsiblesWithPurchases : responsibles;
    const count = targetList.length;
    if (count === 0) return;

    const share = Math.round(differenceAmount / count);
    const updatedMap: { [respId: string]: string } = { ...manualFees };

    responsibles.forEach((r) => {
      if (targetList.some((t) => t.id === r.id)) {
        updatedMap[r.id] = share.toString();
      } else {
        updatedMap[r.id] = '0';
      }
    });

    setManualFees(updatedMap);
  };

  // Helper: Prorate Proportionally to Cuotas
  const handleProrateProportionally = () => {
    if (differenceAmount <= 0 || activeInstallmentsSum <= 0) return;

    // Calculate sum per responsible
    const respSumMap: { [respId: string]: number } = {};
    responsibles.forEach((r) => {
      respSumMap[r.id] = 0;
    });

    purchases.forEach((p) => {
      if (p.cardId === selectedCardId) {
        const inst = getInstallmentForMonth(p, selectedMonth);
        if (inst) {
          respSumMap[p.responsibleId] = (respSumMap[p.responsibleId] || 0) + inst.installmentAmount;
        }
      }
    });

    const updatedMap: { [respId: string]: string } = { ...manualFees };
    responsibles.forEach((r) => {
      const rSum = respSumMap[r.id] || 0;
      if (rSum > 0) {
        const propShare = Math.round((rSum / activeInstallmentsSum) * differenceAmount);
        updatedMap[r.id] = propShare.toString();
      } else {
        updatedMap[r.id] = '0';
      }
    });

    setManualFees(updatedMap);
  };

  // Save All Allocations for this card & month
  const handleSaveAll = () => {
    const allocationsToSave: AdminFeeAllocation[] = responsibles.map((r) => {
      const existing = adminFees.find(
        (a) => a.cardId === selectedCardId && a.month === selectedMonth && a.responsibleId === r.id
      );
      const val = parseFloat(manualFees[r.id]) || 0;

      return {
        id: existing ? existing.id : generateId(),
        cardId: selectedCardId,
        month: selectedMonth,
        responsibleId: r.id,
        allocatedAmount: val,
      };
    });

    onSaveMultipleAdminFees(allocationsToSave);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // Sum of allocated fees in form
  const totalAllocatedInForm = Object.values(manualFees).reduce<number>((s, v) => s + (parseFloat(v as string) || 0), 0);
  const remainingToAllocate = differenceAmount - totalAllocatedInForm;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <Calculator className="w-4 h-4" />
            <span>Módulo 3</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Conciliación y Gastos Administrativos</h2>
          <p className="text-sm text-slate-500">
            Calcula la diferencia entre el estado de cuenta y las cuotas del mes, y asígnala a los responsables.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Card selector tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {cards.map((card) => {
          const isActive = card.id === selectedCardId;
          return (
            <button
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`px-4 py-2.5 rounded-t-xl font-semibold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: card.color || '#6366F1' }}
              />
              <span>{card.name}</span>
            </button>
          );
        })}
      </div>

      {/* Reconciliation Summary Dashboard for active card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: Estado de Cuenta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              1. Estado de Cuentas
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{formatCurrency(statementTotal)}</div>
            <p className="text-xs text-slate-500 mt-1">
              {activeStatement ? 'Monto ingresado en Módulo 2' : 'Pendiente ingresar en Módulo 2'}
            </p>
          </div>
        </div>

        {/* Step 2: Suma de Cuotas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              2. Suma de Cuotas ({formatMonthYear(selectedMonth)})
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{formatCurrency(activeInstallmentsSum)}</div>
            <p className="text-xs text-slate-500 mt-1">Suma de compras en cuota para este mes</p>
          </div>
        </div>

        {/* Step 3: Diferencia a Repartir */}
        <div className="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
              Diferencia (Gasto Administrativo)
            </div>
            <div className="text-2xl font-extrabold text-indigo-900">{formatCurrency(differenceAmount)}</div>
            <p className="text-xs text-indigo-600 mt-1 font-medium">
              Valor a asignar entre los responsables
            </p>
          </div>
        </div>
      </div>

      {/* Manual & Assisted Allocation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Asignación de Gastos Administrativos por Familiar
            </h3>
            <p className="text-xs text-slate-500">
              Ingresa de forma manual el valor a pagar por cada responsable o utiliza la distribución automática.
            </p>
          </div>

          {/* Assisted distribution buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleProrateEqually}
              disabled={differenceAmount <= 0}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Repartir por Igual</span>
            </button>
            <button
              onClick={handleProrateProportionally}
              disabled={differenceAmount <= 0}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Proporcional al Gasto</span>
            </button>
          </div>
        </div>

        {/* Responsibles Allocation List */}
        <div className="space-y-4">
          {responsibles.map((resp) => {
            const hasPurchasesThisMonth = responsiblesWithPurchases.some((r) => r.id === resp.id);
            const currentVal = manualFees[resp.id] || '0';

            return (
              <div
                key={resp.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${resp.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
                    {resp.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{resp.name}</h4>
                    <span className="text-xs text-slate-400">
                      {hasPurchasesThisMonth ? 'Posee cuotas activas este mes' : 'Sin compras activas este mes'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Gasto Admin ($):</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={currentVal}
                    onChange={(e) => handleInputChange(resp.id, e.target.value)}
                    className="w-full sm:w-40 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer & Save */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs font-medium">
            <span className="text-slate-500">Asignado: </span>
            <span className="font-bold text-slate-800">{formatCurrency(totalAllocatedInForm)}</span>
            <span className="text-slate-400"> de {formatCurrency(differenceAmount)}</span>
            {Math.abs(remainingToAllocate) > 1 && (
              <span className={`ml-2 font-bold ${remainingToAllocate > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                ({remainingToAllocate > 0 ? `Falta ${formatCurrency(remainingToAllocate)}` : `Excedido ${formatCurrency(Math.abs(remainingToAllocate))}`})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {saveSuccessMsg && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fadeIn">
                <CheckCircle className="w-4 h-4" />
                ¡Asignación guardada!
              </span>
            )}
            <button
              onClick={handleSaveAll}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Asignaciones</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
