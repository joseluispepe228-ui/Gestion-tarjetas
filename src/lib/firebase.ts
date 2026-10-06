import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { CreditCard, Responsible, Purchase, MonthlyStatement, AdminFeeAllocation, NewPurchase } from '../types';
import { AppState } from './storage';

// Safely load applet config if present in the environment (e.g. AI Studio container)
let appletConfig: Record<string, string> = {};
try {
  // @ts-ignore
  const appletModules = import.meta.glob('../../firebase-applet-config.json', { eager: true });
  const key = Object.keys(appletModules)[0];
  if (key && (appletModules[key] as any)?.default) {
    appletConfig = (appletModules[key] as any).default;
  }
} catch {
  // Fallback gracefully when building on Vercel or local without applet config file
}

// Read Firebase config from VITE_ environment variables or AI Studio applet config
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

const databaseId = appletConfig.firestoreDatabaseId || undefined;

// Check if Firebase keys are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'your_api_key_here'
);

const app = isFirebaseConfigured
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

/**
 * Initialize Firestore with ignoreUndefinedProperties enabled so missing optional
 * fields (like receiptUrl, notes, relationship) never fail document writes.
 */
let firestoreInstance: Firestore | null = null;
if (app) {
  try {
    firestoreInstance = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    }, databaseId);
  } catch {
    firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  }
}

export const db = firestoreInstance;

/**
 * Sanitizes any data object before sending to Firestore:
 * Strips keys with undefined values recursively to avoid Firestore invalid-argument errors.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue; // Skip undefined completely
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = cleanForFirestore(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// Realtime listeners for Firestore collections
export function subscribeToFirestoreData(onUpdate: (data: {
  cards?: CreditCard[];
  responsibles?: Responsible[];
  purchases?: Purchase[];
  statements?: MonthlyStatement[];
  adminFees?: AdminFeeAllocation[];
  newPurchases?: NewPurchase[];
}) => void) {
  if (!db) return () => {};

  const unsubCards = onSnapshot(collection(db, 'cards'), (snapshot) => {
    const cards = snapshot.docs.map((doc) => doc.data() as CreditCard);
    onUpdate({ cards });
  }, (err) => console.warn('Firestore cards listener warning:', err));

  const unsubResp = onSnapshot(collection(db, 'responsibles'), (snapshot) => {
    const responsibles = snapshot.docs.map((doc) => doc.data() as Responsible);
    onUpdate({ responsibles });
  }, (err) => console.warn('Firestore responsibles listener warning:', err));

  const unsubPurchases = onSnapshot(collection(db, 'purchases'), (snapshot) => {
    const purchases = snapshot.docs.map((doc) => doc.data() as Purchase);
    onUpdate({ purchases });
  }, (err) => console.warn('Firestore purchases listener warning:', err));

  const unsubStatements = onSnapshot(collection(db, 'statements'), (snapshot) => {
    const statements = snapshot.docs.map((doc) => doc.data() as MonthlyStatement);
    onUpdate({ statements });
  }, (err) => console.warn('Firestore statements listener warning:', err));

  const unsubFees = onSnapshot(collection(db, 'adminFees'), (snapshot) => {
    const adminFees = snapshot.docs.map((doc) => doc.data() as AdminFeeAllocation);
    onUpdate({ adminFees });
  }, (err) => console.warn('Firestore adminFees listener warning:', err));

  const unsubNewPurchases = onSnapshot(collection(db, 'newPurchases'), (snapshot) => {
    const newPurchases = snapshot.docs.map((doc) => doc.data() as NewPurchase);
    onUpdate({ newPurchases });
  }, (err) => console.warn('Firestore newPurchases listener warning:', err));

  return () => {
    unsubCards();
    unsubResp();
    unsubPurchases();
    unsubStatements();
    unsubFees();
    unsubNewPurchases();
  };
}

// Helpers to save individual items to Firestore
export async function syncPurchaseToFirestore(purchase: Purchase): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore(purchase);
    await setDoc(doc(db, 'purchases', purchase.id), cleaned);
    console.log(`[Firestore] Compra sincronizada exitosamente: ${purchase.id} (${purchase.description})`);
    return true;
  } catch (error) {
    console.error('Error syncing purchase to Firestore:', error);
    return false;
  }
}

export async function deletePurchaseFromFirestore(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'purchases', id));
    console.log(`[Firestore] Compra eliminada de Firestore: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting purchase from Firestore:', error);
    return false;
  }
}

export async function syncStatementToFirestore(statement: MonthlyStatement): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore(statement);
    await setDoc(doc(db, 'statements', statement.id), cleaned);
    return true;
  } catch (error) {
    console.error('Error syncing statement to Firestore:', error);
    return false;
  }
}

export async function syncAdminFeeToFirestore(fee: AdminFeeAllocation): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore(fee);
    await setDoc(doc(db, 'adminFees', fee.id), cleaned);
    return true;
  } catch (error) {
    console.error('Error syncing admin fee to Firestore:', error);
    return false;
  }
}

export async function syncResponsibleToFirestore(resp: Responsible): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore(resp);
    await setDoc(doc(db, 'responsibles', resp.id), cleaned);
    return true;
  } catch (error) {
    console.error('Error syncing responsible to Firestore:', error);
    return false;
  }
}

export async function deleteResponsibleFromFirestore(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'responsibles', id));
    return true;
  } catch (error) {
    console.error('Error deleting responsible from Firestore:', error);
    return false;
  }
}

export async function syncCardToFirestore(card: CreditCard): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore(card);
    await setDoc(doc(db, 'cards', card.id), cleaned);
    return true;
  } catch (error) {
    console.error('Error syncing card to Firestore:', error);
    return false;
  }
}

export async function syncNewPurchaseToFirestore(p: NewPurchase): Promise<boolean> {
  if (!db) return false;
  try {
    const cleaned = cleanForFirestore(p);
    await setDoc(doc(db, 'newPurchases', p.id), cleaned);
    return true;
  } catch (error) {
    console.error('Error syncing new purchase to Firestore:', error);
    return false;
  }
}

export async function deleteNewPurchaseFromFirestore(id: string): Promise<boolean> {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'newPurchases', id));
    return true;
  } catch (error) {
    console.error('Error deleting new purchase from Firestore:', error);
    return false;
  }
}

/**
 * Bulk sync all data from local AppState to Firestore:
 * Uploads all cards, responsibles, purchases, statements, fees, and new purchases
 */
export async function syncAllDataToFirestore(state: AppState): Promise<{
  successCount: number;
  totalCount: number;
  success: boolean;
}> {
  if (!db) return { successCount: 0, totalCount: 0, success: false };

  let successCount = 0;
  const totalCount =
    state.cards.length +
    state.responsibles.length +
    state.purchases.length +
    state.statements.length +
    state.adminFees.length +
    (state.newPurchases?.length || 0);

  try {
    for (const c of state.cards) {
      await setDoc(doc(db, 'cards', c.id), cleanForFirestore(c));
      successCount++;
    }
    for (const r of state.responsibles) {
      await setDoc(doc(db, 'responsibles', r.id), cleanForFirestore(r));
      successCount++;
    }
    for (const p of state.purchases) {
      await setDoc(doc(db, 'purchases', p.id), cleanForFirestore(p));
      successCount++;
    }
    for (const s of state.statements) {
      await setDoc(doc(db, 'statements', s.id), cleanForFirestore(s));
      successCount++;
    }
    for (const f of state.adminFees) {
      await setDoc(doc(db, 'adminFees', f.id), cleanForFirestore(f));
      successCount++;
    }
    for (const np of (state.newPurchases || [])) {
      await setDoc(doc(db, 'newPurchases', np.id), cleanForFirestore(np));
      successCount++;
    }

    console.log(`[Firestore] Sincronización total exitosa: ${successCount} registros subidos.`);
    return { successCount, totalCount, success: true };
  } catch (error) {
    console.error('Error in syncAllDataToFirestore:', error);
    return { successCount, totalCount, success: false };
  }
}


