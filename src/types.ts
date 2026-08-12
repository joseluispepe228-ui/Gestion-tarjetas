export interface CreditCard {
  id: string;
  name: string;
  bank?: string;
  color: string; // Tailwind color class or hex
  bgColor: string;
  badgeBg: string;
  badgeText: string;
  isDefault?: boolean;
}

export interface Responsible {
  id: string;
  name: string;
  relationship?: string;
  email?: string;
  phone?: string;
  color: string;
  avatarBg: string;
}

export interface Purchase {
  id: string;
  cardId: string;
  purchaseDate: string; // YYYY-MM-DD
  firstPaymentMonth: string; // YYYY-MM (Month when cuota 1 is billed)
  totalAmount: number;
  description: string;
  installmentsCount: number; // e.g. 1 to 36
  installmentAmount: number; // Calculated or manual
  responsibleId: string;
  percentageToPay: number; // 100 by default, or fraction (e.g., 50 for 50%)
  receiptUrl?: string; // Base64 data URL or photo URL of the purchase receipt/boleta
  notes?: string;
  createdAt: string;
}

export interface MonthlyStatement {
  id: string;
  cardId: string;
  month: string; // YYYY-MM e.g. "2026-08"
  statementTotal: number; // Total a pagar que figura en la tarjeta
  updatedAt: string;
}

export interface AdminFeeAllocation {
  id: string;
  cardId: string;
  month: string; // YYYY-MM
  responsibleId: string;
  allocatedAmount: number; // Gasto administrativo asignado manualmente o prorrateado
}

export interface InstallmentDetail {
  purchase: Purchase;
  installmentNumber: number; // e.g. 4 (of 10)
  installmentString: string; // e.g. "4-10"
  month: string; // YYYY-MM
  installmentAmount: number;
  effectiveAmountToPay: number; // installmentAmount * (percentageToPay / 100)
}

export interface ReconciliationSummary {
  cardId: string;
  cardName: string;
  month: string; // YYYY-MM
  statementTotal: number; // Ingreso estado de cuentas
  sumOfInstallments: number; // Suma según tarjeta de todas las cuotas del mes
  difference: number; // Diferencia (Gastos administrativos / comisiones / mantención)
  allocatedAdminFeesTotal: number;
  unallocatedAdminFees: number;
}

export interface NewPurchase {
  id: string;
  purchaseDate: string; // YYYY-MM-DD
  cardId: string;
  totalAmount: number;
  responsibleId: string;
  installmentsCount: number;
  receiptUrl?: string; // Photo or Base64 of receipt/boleta
  description: string;
  notes?: string;
  createdAt: string;
}

