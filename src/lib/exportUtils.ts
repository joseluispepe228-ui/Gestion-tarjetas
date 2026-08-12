import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CreditCard, Responsible, Purchase, InstallmentDetail, MonthlyStatement, AdminFeeAllocation } from '../types';
import { formatCurrency, formatMonthYear } from './utils';

export interface ReportItem {
  id: string;
  purchaseDescription: string;
  cardName: string;
  installmentString: string; // e.g. "4-10"
  purchaseDate: string;
  installmentBaseAmount: number;
  percentageToPay: number;
  installmentEffectiveAmount: number;
  adminFeeAllocated: number;
  totalToPay: number;
  responsibleName: string;
}

export function generateExcelReport({
  month,
  responsible,
  card,
  items,
  cards,
  responsibles,
  purchases,
  statements,
  adminFees,
}: {
  month: string;
  responsible?: Responsible;
  card?: CreditCard;
  items: ReportItem[];
  cards: CreditCard[];
  responsibles: Responsible[];
  purchases: Purchase[];
  statements: MonthlyStatement[];
  adminFees: AdminFeeAllocation[];
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Reporte de Cobro
  const reportRows = items.map((item, index) => ({
    'N°': index + 1,
    'Responsable': item.responsibleName,
    'Tarjeta': item.cardName,
    'Detalle de Compra': item.purchaseDescription,
    'Fecha Compra': item.purchaseDate,
    'Cuotas (ej. 4-10)': item.installmentString,
    'Valor Cuota Base ($)': item.installmentBaseAmount,
    '% a Pagar': `${item.percentageToPay}%`,
    'Valor Cuota ($)': item.installmentEffectiveAmount,
    'Gasto Admin ($)': item.adminFeeAllocated,
    'Total A Pagar ($)': item.totalToPay,
  }));

  const totalSum = items.reduce((sum, item) => sum + item.totalToPay, 0);
  reportRows.push({
    'N°': 0,
    'Responsable': 'TOTAL GENERAL',
    'Tarjeta': '',
    'Detalle de Compra': '',
    'Fecha Compra': '',
    'Cuotas (ej. 4-10)': '',
    'Valor Cuota Base ($)': 0,
    '% a Pagar': '',
    'Valor Cuota ($)': items.reduce((s, i) => s + i.installmentEffectiveAmount, 0),
    'Gasto Admin ($)': items.reduce((s, i) => s + i.adminFeeAllocated, 0),
    'Total A Pagar ($)': totalSum,
  });

  const ws1 = XLSX.utils.json_to_sheet(reportRows);
  XLSX.utils.book_append_sheet(wb, ws1, 'Cobros del Mes');

  // Sheet 2: Base de Datos de Compras
  const dbRows = purchases.map((p) => {
    const cardObj = cards.find((c) => c.id === p.cardId);
    const respObj = responsibles.find((r) => r.id === p.responsibleId);
    return {
      'ID Compra': p.id,
      'Tarjeta': cardObj ? cardObj.name : p.cardId,
      'Responsable': respObj ? respObj.name : p.responsibleId,
      'Fecha Compra': p.purchaseDate,
      'Primer Mes Cobro': p.firstPaymentMonth,
      'Detalle': p.description,
      'Monto Total ($)': p.totalAmount,
      'N° Cuotas': p.installmentsCount,
      'Valor Cuota ($)': p.installmentAmount,
      '% Responsable': `${p.percentageToPay}%`,
      'Notas': p.notes || '',
    };
  });
  const ws2 = XLSX.utils.json_to_sheet(dbRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Base Datos Compras');

  // Generate file name
  const respName = responsible ? responsible.name.replace(/\s+/g, '_') : 'Todos';
  const fileName = `Detalle_Cobro_${formatMonthYear(month)}_${respName}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export function generatePDFReport({
  month,
  responsible,
  card,
  items,
}: {
  month: string;
  responsible?: Responsible;
  card?: CreditCard;
  items: ReportItem[];
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const formattedMonth = formatMonthYear(month);

  // Header background bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, 210, 42, 'F');

  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(0, 42, 210, 42);

  // Title - Reduced font size and removed 'CONCILIACIÓN' as requested
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('DETALLE DE COBRO', 14, 18);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Gestion Tarjetas De Credito', 14, 25);
  doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}`, 14, 31);

  // Filter Details Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  doc.text('PERÍODO:', 130, 18);
  doc.setFont('helvetica', 'normal');
  doc.text(formattedMonth, 155, 18);

  doc.setFont('helvetica', 'bold');
  doc.text('RESPONSABLE:', 130, 25);
  doc.setFont('helvetica', 'normal');
  doc.text(responsible ? responsible.name : 'Todos los miembros', 162, 25);

  doc.setFont('helvetica', 'bold');
  doc.text('TARJETA:', 130, 32);
  doc.setFont('helvetica', 'normal');
  doc.text(card ? card.name : 'Todas las tarjetas', 152, 32);

  // Table Columns
  const tableColumn = [
    'Tarjeta',
    'Detalle de Compra',
    'Cuotas',
    'Valor Cuota',
    '% Pagar',
    'Gasto Admin',
    'Total A Pagar',
  ];

  const tableRows = items.map((item) => [
    item.cardName,
    item.purchaseDescription,
    item.installmentString,
    formatCurrency(item.installmentEffectiveAmount),
    `${item.percentageToPay}%`,
    formatCurrency(item.adminFeeAllocated),
    formatCurrency(item.totalToPay),
  ]);

  // Totals
  const totalInstallments = items.reduce((s, i) => s + i.installmentEffectiveAmount, 0);
  const totalAdminFees = items.reduce((s, i) => s + i.adminFeeAllocated, 0);
  const grandTotal = items.reduce((s, i) => s + i.totalToPay, 0);

  autoTable(doc, {
    startY: 48,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 55 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary Card Box
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(110, finalY, 86, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(110, finalY, 86, 32, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal Cuotas:', 115, finalY + 8);
  doc.text(formatCurrency(totalInstallments), 188, finalY + 8, { align: 'right' });

  doc.text('Gastos Administrativos:', 115, finalY + 15);
  doc.text(formatCurrency(totalAdminFees), 188, finalY + 15, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(115, finalY + 19, 188, finalY + 19);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL A COBRAR:', 115, finalY + 26);
  doc.setTextColor(37, 99, 235); // Blue primary
  doc.text(formatCurrency(grandTotal), 188, finalY + 26, { align: 'right' });

  // Payment note / Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Por favor realizar la transferencia correspondiente indicando en el asunto el mes y nombre del responsable.',
    14,
    finalY + 38
  );

  const respName = responsible ? responsible.name.replace(/\s+/g, '_') : 'Todos';
  const fileName = `Cobro_${formatMonthYear(month)}_${respName}.pdf`;

  doc.save(fileName);
}
