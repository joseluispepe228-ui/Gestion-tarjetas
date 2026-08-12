import React, { useState } from 'react';
import { CreditCard, MonthlyStatement, Purchase } from '../types';
import { formatCurrency, formatMonthYear, getCurrentMonthStr, getInstallmentForMonth, generateId } from '../lib/utils';
import { FileText, Calendar, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

interface IngresoEstadoCuentaProps {
  cards: CreditCard[];
  statements: MonthlyStatement[];
  purchases: Purchase[];
  onSaveStatement: (statement: MonthlyStatement) => void;
}

export const IngresoEstadoCuenta: React.FC<IngresoEstadoCuentaProps> = ({
  cards,
  statements,
  purchases,
  onSaveStatement,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [statementAmounts, setStatementAmounts] = useState<{ [cardId: string]: string }>({});
  const [savedSuccessCard, setSavedSuccessCard] = useState<string | null>(null);

  // Initialize input amounts when selectedMonth changes
  React.useEffect(() => {
    const initialAmounts: { [cardId: string]: string } = {};
    cards.forEach((c) => {
      const existing = statements.find((s) => s.cardId === c.id && s.month === selectedMonth);
      initialAmounts[c.id] = existing ? existing.statementTotal.toString() : '';
    });
    setStatementAmounts(initialAmounts);
  }, [selectedMonth, cards, statements]);

  const handleAmountChange = (cardId: string, value: string) => {
    setStatementAmounts((prev) => ({ ...prev, [cardId]: value }));
  };

  const handleSaveCardStatement = (cardId: string) => {
    const rawVal = statementAmounts[cardId];
    const parsedTotal = parseFloat(rawVal) || 0;

    const existing = statements.find((s) => s.cardId === cardId && s.month === selectedMonth);
    const statementObj: MonthlyStatement = {
      id: existing ? existing.id : generateId(),
      cardId,
      month: selectedMonth,
      statementTotal: parsedTotal,
      updatedAt: new Date().toISOString(),
    };

    onSaveStatement(statementObj);
    setSavedSuccessCard(cardId);
    setTimeout(() => setSavedSuccessCard(null), 2500);
  };

  // Compute calculated installments sum for each card in selectedMonth (using effectiveAmountToPay per responsible)
  const getCardInstallmentsSum = (cardId: string) => {
    let sum = 0;
    purchases.forEach((p) => {
      if (p.cardId === cardId) {
        const inst = getInstallmentForMonth(p, selectedMonth);
        if (inst) {
          sum += inst.effectiveAmountToPay;
        }
      }
    });
    return sum;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <FileText className="w-4 h-4" />
            <span>Módulo 2</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Ingreso de Total a Pagar del Mes</h2>
          <p className="text-sm text-slate-500">
            Ingresa el valor total a pagar indicado en el estado de cuenta oficial emitido por cada banco o tarjeta.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Mes de cobro:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Cards List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const sumInstallments = getCardInstallmentsSum(card.id);
          const rawInput = statementAmounts[card.id] ?? '';
          const statementVal = parseFloat(rawInput) || 0;
          const diff = statementVal - sumInstallments;
          const isSaved = statements.some((s) => s.cardId === card.id && s.month === selectedMonth);

          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md"
            >
              {/* Card top stripe accent */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: card.color || '#6366F1' }}
              />

              <div>
                <div className="flex justify-between items-start mb-4 pt-1">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${card.badgeBg} ${card.badgeText}`}>
                      {card.name}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">{card.bank || card.name}</h3>
                  </div>
                  {isSaved && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Registrado
                    </span>
                  )}
                </div>

                {/* Input field */}
                <div className="space-y-1.5 mb-5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Total a Pagar según Estado de Cuenta ($)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ej: 185000"
                      value={rawInput}
                      onChange={(e) => handleAmountChange(card.id, e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-base font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Calculation Preview Box */}
                <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 border border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Suma de Cuotas ({formatMonthYear(selectedMonth)}):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(sumInstallments)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Estado de Cuenta Ingresado:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(statementVal)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                    <span className="text-slate-700">Diferencia (Gastos Admin):</span>
                    <span className={`text-sm ${diff >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {formatCurrency(diff)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {savedSuccessCard === card.id ? '¡Guardado con éxito!' : 'Presiona guardar al actualizar'}
                </span>
                <button
                  onClick={() => handleSaveCardStatement(card.id)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructional Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">¿Para qué sirve este valor?</p>
          <p>
            El banco suele cobrar cargos fijos de mantención, comisiones, impuestos de timbres o intereses que no corresponden a ninguna compra en cuota. La diferencia entre este total y la suma de las cuotas registradas se clasificará como **Gastos Administrativos** en el Módulo 3.
          </p>
        </div>
      </div>
    </div>
  );
};
