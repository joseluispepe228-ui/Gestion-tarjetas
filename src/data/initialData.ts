import { CreditCard, Responsible, Purchase, MonthlyStatement, AdminFeeAllocation } from '../types';
import { getCurrentMonthStr, addMonthsToMonthStr } from '../lib/utils';

export const DEFAULT_CARDS: CreditCard[] = [
  {
    id: 'ripley',
    name: 'Ripley',
    bank: 'Banco Ripley',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    isDefault: true,
  },
  {
    id: 'falabella',
    name: 'Falabella',
    bank: 'CMR Falabella',
    color: '#10B981',
    bgColor: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    isDefault: true,
  },
  {
    id: 'cencosud',
    name: 'Cencosud',
    bank: 'Tarjeta Cencosud Scotiabank',
    color: '#3B82F6',
    bgColor: 'bg-blue-50',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    isDefault: true,
  },
];

export const DEFAULT_RESPONSIBLES: Responsible[] = [
  {
    id: 'resp-1',
    name: 'Papá (Jorge)',
    relationship: 'Padre',
    phone: '+56 9 1234 5678',
    email: 'jorge.papa@familia.cl',
    color: '#3B82F6',
    avatarBg: 'bg-blue-500',
  },
  {
    id: 'resp-2',
    name: 'Mamá (Elena)',
    relationship: 'Madre',
    phone: '+56 9 8765 4321',
    email: 'elena.mama@familia.cl',
    color: '#EC4899',
    avatarBg: 'bg-pink-500',
  },
  {
    id: 'resp-3',
    name: 'Carlos (Hermano)',
    relationship: 'Hermano',
    phone: '+56 9 5555 1234',
    email: 'carlos.h@familia.cl',
    color: '#10B981',
    avatarBg: 'bg-emerald-500',
  },
  {
    id: 'resp-4',
    name: 'Sofía (Prima)',
    relationship: 'Prima',
    phone: '+56 9 4444 9876',
    email: 'sofia.prima@gmail.com',
    color: '#F59E0B',
    avatarBg: 'bg-amber-500',
  },
];

export function getSeedPurchases(): Purchase[] {
  const currentMonth = getCurrentMonthStr();
  const prevMonth = addMonthsToMonthStr(currentMonth, -3);
  const prevMonth2 = addMonthsToMonthStr(currentMonth, -1);

  return [
    {
      id: 'p-1',
      cardId: 'ripley',
      purchaseDate: `${prevMonth}-15`,
      firstPaymentMonth: prevMonth,
      totalAmount: 450000,
      description: 'Televisor Smart 55" Tienda Ripley',
      installmentsCount: 10,
      installmentAmount: 45000,
      responsibleId: 'resp-1',
      percentageToPay: 100,
      notes: 'Compra de electrodoméstico',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-2',
      cardId: 'falabella',
      purchaseDate: `${prevMonth2}-10`,
      firstPaymentMonth: prevMonth2,
      totalAmount: 180000,
      description: 'Zapatillas deportivas y ropa deportiva Falabella',
      installmentsCount: 6,
      installmentAmount: 30000,
      responsibleId: 'resp-3',
      percentageToPay: 100,
      notes: 'Equipamiento de gimnasio',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-3',
      cardId: 'cencosud',
      purchaseDate: `${currentMonth}-02`,
      firstPaymentMonth: currentMonth,
      totalAmount: 120000,
      description: 'Mercadería Supermercado Jumbo (Cencosud)',
      installmentsCount: 3,
      installmentAmount: 40000,
      responsibleId: 'resp-2',
      percentageToPay: 50, // Mamá paga el 50%
      notes: 'Compra compartida supermercado',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-4',
      cardId: 'ripley',
      purchaseDate: `${currentMonth}-05`,
      firstPaymentMonth: currentMonth,
      totalAmount: 90000,
      description: ' Perfumes y Cosmetología',
      installmentsCount: 4,
      installmentAmount: 22500,
      responsibleId: 'resp-4',
      percentageToPay: 100,
      notes: 'Regalo de cumpleaños',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'p-5',
      cardId: 'falabella',
      purchaseDate: `${currentMonth}-08`,
      firstPaymentMonth: currentMonth,
      totalAmount: 240000,
      description: 'Celular Samsung Galaxy',
      installmentsCount: 12,
      installmentAmount: 20000,
      responsibleId: 'resp-3',
      percentageToPay: 100,
      notes: 'Renovación de smartphone',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getSeedStatements(): MonthlyStatement[] {
  const currentMonth = getCurrentMonthStr();
  return [
    {
      id: 'st-1',
      cardId: 'ripley',
      month: currentMonth,
      statementTotal: 73500, // Total según estado de cuenta (45000 + 22500 = 67500 cuotas; diff = 6000 mantención/gastos)
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-2',
      cardId: 'falabella',
      month: currentMonth,
      statementTotal: 54500, // Total estado de cuenta (30000 + 20000 = 50000 cuotas; diff = 4500)
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'st-3',
      cardId: 'cencosud',
      month: currentMonth,
      statementTotal: 43200, // Total estado de cuenta (40000 cuotas; diff = 3200)
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getSeedAdminFees(): AdminFeeAllocation[] {
  const currentMonth = getCurrentMonthStr();
  return [
    {
      id: 'af-1',
      cardId: 'ripley',
      month: currentMonth,
      responsibleId: 'resp-1',
      allocatedAmount: 4000,
    },
    {
      id: 'af-2',
      cardId: 'ripley',
      month: currentMonth,
      responsibleId: 'resp-4',
      allocatedAmount: 2000,
    },
    {
      id: 'af-3',
      cardId: 'falabella',
      month: currentMonth,
      responsibleId: 'resp-3',
      allocatedAmount: 4500,
    },
    {
      id: 'af-4',
      cardId: 'cencosud',
      month: currentMonth,
      responsibleId: 'resp-2',
      allocatedAmount: 3200,
    },
  ];
}
