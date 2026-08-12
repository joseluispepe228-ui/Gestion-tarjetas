import { Purchase, InstallmentDetail } from '../types';

/**
 * Formats a number to CLP / standard currency format without decimals (e.g. "$ 120.500")
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Formats YYYY-MM to human readable Spanish string e.g. "2026-08" -> "Agosto 2026"
 */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthNumStr, 10) - 1;

  const monthsSpanish = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (monthIndex >= 0 && monthIndex < 12) {
    return `${monthsSpanish[monthIndex]} ${year}`;
  }
  return monthStr;
}

/**
 * Gets current month in YYYY-MM format
 */
export function getCurrentMonthStr(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Adds offset months to YYYY-MM
 */
export function addMonthsToMonthStr(monthStr: string, offset: number): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [yearStr, monthNumStr] = monthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthNumStr, 10) + offset;

  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calculates month difference (targetMonth - startMonth) in months
 */
export function getMonthDifference(startMonthStr: string, targetMonthStr: string): number {
  if (!startMonthStr || !targetMonthStr) return -1;
  const [startYear, startMonth] = startMonthStr.split('-').map(Number);
  const [targetYear, targetMonth] = targetMonthStr.split('-').map(Number);

  return (targetYear - startYear) * 12 + (targetMonth - startMonth);
}

/**
 * Get installment detail for a purchase in a given month YYYY-MM, if applicable.
 */
export function getInstallmentForMonth(purchase: Purchase, targetMonthStr: string): InstallmentDetail | null {
  const startMonth = purchase.firstPaymentMonth || purchase.purchaseDate.substring(0, 7);
  const diff = getMonthDifference(startMonth, targetMonthStr);

  if (diff >= 0 && diff < purchase.installmentsCount) {
    const installmentNumber = diff + 1;
    const effectivePercentage = (purchase.percentageToPay ?? 100) / 100;
    const effectiveAmountToPay = Math.round(purchase.installmentAmount * effectivePercentage);

    return {
      purchase,
      installmentNumber,
      installmentString: `${installmentNumber}-${purchase.installmentsCount}`,
      month: targetMonthStr,
      installmentAmount: purchase.installmentAmount,
      effectiveAmountToPay,
    };
  }

  return null;
}

export interface PurchaseStatus {
  status: 'future' | 'active' | 'last_installment' | 'completed';
  currentInstallment: number;
  totalInstallments: number;
  startMonth: string;
  lastMonth: string;
  badgeLabel: string;
  isCompleted: boolean;
  isLastInstallment: boolean;
}

/**
 * Calculates the current payment status of a purchase for a given reference month YYYY-MM
 */
export function getPurchaseStatus(purchase: Purchase, referenceMonthStr: string = getCurrentMonthStr()): PurchaseStatus {
  const startMonth = purchase.firstPaymentMonth || purchase.purchaseDate.substring(0, 7);
  const totalInstallments = Math.max(1, purchase.installmentsCount || 1);
  const lastMonth = addMonthsToMonthStr(startMonth, totalInstallments - 1);
  const diff = getMonthDifference(startMonth, referenceMonthStr);

  if (diff < 0) {
    return {
      status: 'future',
      currentInstallment: 0,
      totalInstallments,
      startMonth,
      lastMonth,
      badgeLabel: `Inicia en ${formatMonthYear(startMonth)}`,
      isCompleted: false,
      isLastInstallment: false,
    };
  }

  if (diff < totalInstallments - 1) {
    const currentInstallment = diff + 1;
    return {
      status: 'active',
      currentInstallment,
      totalInstallments,
      startMonth,
      lastMonth,
      badgeLabel: `Cuota ${currentInstallment} de ${totalInstallments}`,
      isCompleted: false,
      isLastInstallment: false,
    };
  }

  if (diff === totalInstallments - 1) {
    return {
      status: 'last_installment',
      currentInstallment: totalInstallments,
      totalInstallments,
      startMonth,
      lastMonth,
      badgeLabel: `¡Última cuota! (${totalInstallments} de ${totalInstallments})`,
      isCompleted: false,
      isLastInstallment: true,
    };
  }

  // diff >= totalInstallments
  return {
    status: 'completed',
    currentInstallment: totalInstallments,
    totalInstallments,
    startMonth,
    lastMonth,
    badgeLabel: `PAGADA TOTALMENTE (Fin: ${formatMonthYear(lastMonth)})`,
    isCompleted: true,
    isLastInstallment: false,
  };
}

/**
 * Generate quick unique IDs
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}
