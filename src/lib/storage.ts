import { CreditCard, Responsible, Purchase, MonthlyStatement, AdminFeeAllocation } from '../types';
import { DEFAULT_CARDS, DEFAULT_RESPONSIBLES, getSeedPurchases, getSeedStatements, getSeedAdminFees } from '../data/initialData';

const STORAGE_KEYS = {
  CARDS: 'cc_control_cards_v1',
  RESPONSIBLES: 'cc_control_responsibles_v1',
  PURCHASES: 'cc_control_purchases_v1',
  STATEMENTS: 'cc_control_statements_v1',
  ADMIN_FEES: 'cc_control_admin_fees_v1',
};

export interface AppState {
  cards: CreditCard[];
  responsibles: Responsible[];
  purchases: Purchase[];
  statements: MonthlyStatement[];
  adminFees: AdminFeeAllocation[];
}

export function loadAppState(): AppState {
  try {
    const rawCards = localStorage.getItem(STORAGE_KEYS.CARDS);
    const rawResp = localStorage.getItem(STORAGE_KEYS.RESPONSIBLES);
    const rawPur = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    const rawStat = localStorage.getItem(STORAGE_KEYS.STATEMENTS);
    const rawFees = localStorage.getItem(STORAGE_KEYS.ADMIN_FEES);

    const cards = rawCards ? JSON.parse(rawCards) : DEFAULT_CARDS;
    const responsibles = rawResp ? JSON.parse(rawResp) : DEFAULT_RESPONSIBLES;
    const purchases = rawPur ? JSON.parse(rawPur) : getSeedPurchases();
    const statements = rawStat ? JSON.parse(rawStat) : getSeedStatements();
    const adminFees = rawFees ? JSON.parse(rawFees) : getSeedAdminFees();

    return {
      cards,
      responsibles,
      purchases,
      statements,
      adminFees,
    };
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return {
      cards: DEFAULT_CARDS,
      responsibles: DEFAULT_RESPONSIBLES,
      purchases: getSeedPurchases(),
      statements: getSeedStatements(),
      adminFees: getSeedAdminFees(),
    };
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(state.cards));
    localStorage.setItem(STORAGE_KEYS.RESPONSIBLES, JSON.stringify(state.responsibles));
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(state.purchases));
    localStorage.setItem(STORAGE_KEYS.STATEMENTS, JSON.stringify(state.statements));
    localStorage.setItem(STORAGE_KEYS.ADMIN_FEES, JSON.stringify(state.adminFees));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
}

export function resetAppStateToSeed(): AppState {
  const seedState: AppState = {
    cards: DEFAULT_CARDS,
    responsibles: DEFAULT_RESPONSIBLES,
    purchases: getSeedPurchases(),
    statements: getSeedStatements(),
    adminFees: getSeedAdminFees(),
  };
  saveAppState(seedState);
  return seedState;
}

export function exportBackupJSON(state: AppState): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `respaldos_tarjetas_credito_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
