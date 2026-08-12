import React, { useState } from 'react';
import { CreditCard, Responsible, Purchase, MonthlyStatement, AdminFeeAllocation } from '../types';
import { formatCurrency, formatMonthYear, getCurrentMonthStr, getInstallmentForMonth } from '../lib/utils';
import { generateExcelReport, generatePDFReport, ReportItem } from '../lib/exportUtils';
import { BarChart3, Calendar, FileSpreadsheet, FileText, Filter, User, CreditCard as CardIcon, CheckCircle2, Download } from 'lucide-react';

interface ReportesProps {
  cards: CreditCard[];
  responsibles: Responsible[];
  purchases: Purchase[];
  statements: MonthlyStatement[];
  adminFees: AdminFeeAllocation[];
}

export const Reportes: React.FC<ReportesProps> = ({
  cards,
  responsibles,
  purchases,
  statements,
  adminFees,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [selectedRespId, setSelectedRespId] = useState<string>('all');
  const [selectedCardId, setSelectedCardId] = useState<string>('all');

  // Build report items list based on current active month
  const reportItems: ReportItem[] = [];

  purchases.forEach((p) => {
    // Check if card or responsible filter matches
    if (selectedCardId !== 'all' && p.cardId !== selectedCardId) return;
    if (selectedRespId !== 'all' && p.responsibleId !== selectedRespId) return;

    // Check if purchase has an installment active in selectedMonth
    const inst = getInstallmentForMonth(p, selectedMonth);
    if (inst) {
      const cardObj = cards.find((c) => c.id === p.cardId);
      const respObj = responsibles.find((r) => r.id === p.responsibleId);

      // Find allocated admin fee for this card, month, responsible
      const adminFeeObj = adminFees.find(
        (a) => a.cardId === p.cardId && a.month === selectedMonth && a.responsibleId === p.responsibleId
      );

      // Count how many purchases this responsible has on this card this month to distribute admin fee per item cleanly
      const respPurchasesCount = purchases.filter(
        (otherP) =>
          otherP.cardId === p.cardId &&
          otherP.responsibleId === p.responsibleId &&
          getInstallmentForMonth(otherP, selectedMonth)
      ).length;

      const totalFeeForResp = adminFeeObj ? adminFeeObj.allocatedAmount : 0;
      const feePerItem = respPurchasesCount > 0 ? Math.round(totalFeeForResp / respPurchasesCount) : 0;

      const totalToPay = inst.effectiveAmountToPay + feePerItem;

      reportItems.push({
        id: `${p.id}_${selectedMonth}`,
        purchaseDescription: p.description,
        cardName: cardObj ? cardObj.name : p.cardId,
        installmentString: inst.installmentString,
        purchaseDate: p.purchaseDate,
        installmentBaseAmount: inst.installmentAmount,
        percentageToPay: p.percentageToPay ?? 100,
        installmentEffectiveAmount: inst.effectiveAmountToPay,
        adminFeeAllocated: feePerItem,
        totalToPay,
        responsibleName: respObj ? respObj.name : 'Desconocido',
      });
    }
  });

  // Calculate totals
  const totalInstallmentsSum = reportItems.reduce((s, i) => s + i.installmentEffectiveAmount, 0);
  const totalAdminFeesSum = reportItems.reduce((s, i) => s + i.adminFeeAllocated, 0);
  const grandTotalSum = reportItems.reduce((s, i) => s + i.totalToPay, 0);

  const selectedRespObj = responsibles.find((r) => r.id === selectedRespId);
  const selectedCardObj = cards.find((c) => c.id === selectedCardId);

  const handleExportPDF = () => {
    generatePDFReport({
      month: selectedMonth,
      responsible: selectedRespObj,
      card: selectedCardObj,
      items: reportItems,
    });
  };

  const handleExportExcel = () => {
    generateExcelReport({
      month: selectedMonth,
      responsible: selectedRespObj,
      card: selectedCardObj,
      items: reportItems,
      cards,
      responsibles,
      purchases,
      statements,
      adminFees,
    });
  };

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Módulo 5</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Reporte y Conciliación Final</h2>
          <p className="text-sm text-slate-500">
            Filtra por mes y familiar responsable para obtener el desglose detallado de cuotas y generar PDF o Excel.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={reportItems.length === 0}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Descargar PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            disabled={reportItems.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filter Month */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Mes que Corresponde Pagar
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Filter Responsible */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            Responsable de la Compra
          </label>
          <select
            value={selectedRespId}
            onChange={(e) => setSelectedRespId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">-- Todos los Responsables --</option>
            {responsibles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Card */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CardIcon className="w-3.5 h-3.5 text-indigo-600" />
            Tarjeta
          </label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">-- Todas las Tarjetas --</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase">Subtotal Cuotas</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalInstallmentsSum)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Suma de cuotas del período</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-400 uppercase">Gastos Administrativos</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalAdminFeesSum)}</div>
          <div className="text-xs text-slate-400 mt-0.5">Comisiones / Mantención asignadas</div>
        </div>

        <div className="bg-indigo-600 text-white p-5 rounded-2xl shadow-sm">
          <div className="text-xs font-medium text-indigo-200 uppercase">TOTAL A COBRAR EN {formatMonthYear(selectedMonth).toUpperCase()}</div>
          <div className="text-2xl font-extrabold mt-1">{formatCurrency(grandTotalSum)}</div>
          <div className="text-xs text-indigo-200 mt-0.5">
            {selectedRespObj ? `Monto total a transferir por ${selectedRespObj.name}` : 'Monto total general a cobrar'}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">
            Detalle de Compras a Pagar ({formatMonthYear(selectedMonth)})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {reportItems.length} {reportItems.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Tarjeta</th>
                <th className="py-3.5 px-4">Detalle de Compra</th>
                <th className="py-3.5 px-4 text-center">N° Cuota</th>
                <th className="py-3.5 px-4 text-right">Valor Cuota</th>
                <th className="py-3.5 px-4 text-center">% Pagar</th>
                <th className="py-3.5 px-4 text-right">Gasto Admin</th>
                <th className="py-3.5 px-4 text-right">Total a Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {reportItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No hay cuotas a cobrar con los filtros seleccionados para este mes.
                  </td>
                </tr>
              ) : (
                reportItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.responsibleName}</td>
                    <td className="py-3.5 px-4 font-medium text-xs text-slate-600">{item.cardName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.purchaseDescription}</div>
                      <div className="text-[11px] text-slate-400">Fecha: {item.purchaseDate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-xs">
                        {item.installmentString}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                      {formatCurrency(item.installmentEffectiveAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-indigo-600">
                      {item.percentageToPay}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-amber-700 font-medium">
                      {formatCurrency(item.adminFeeAllocated)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-900 text-sm">
                      {formatCurrency(item.totalToPay)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {reportItems.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800 text-sm">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 text-right uppercase text-xs text-slate-500">
                    Totales:
                  </td>
                  <td className="py-3.5 px-4 text-right">{formatCurrency(totalInstallmentsSum)}</td>
                  <td></td>
                  <td className="py-3.5 px-4 text-right text-amber-700">{formatCurrency(totalAdminFeesSum)}</td>
                  <td className="py-3.5 px-4 text-right text-indigo-700 text-base">{formatCurrency(grandTotalSum)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
