import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { CreditCard, Responsible, Purchase, MonthlyStatement, AdminFeeAllocation, NewPurchase } from '../types';

// ... (keep rest)

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

export const db = app ? (databaseId ? getFirestore(app, databaseId) : getFirestore(app)) : null;

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
    if (!snapshot.empty) {
      const cards = snapshot.docs.map((doc) => doc.data() as CreditCard);
      onUpdate({ cards });
    }
  }, (err) => console.warn('Firestore cards listener warning:', err));

  const unsubResp = onSnapshot(collection(db, 'responsibles'), (snapshot) => {
    if (!snapshot.empty) {
      const responsibles = snapshot.docs.map((doc) => doc.data() as Responsible);
      onUpdate({ responsibles });
    }
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
export async function syncPurchaseToFirestore(purchase: Purchase) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'purchases', purchase.id), purchase);
  } catch (error) {
    console.error('Error syncing purchase to Firestore:', error);
  }
}

export async function deletePurchaseFromFirestore(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'purchases', id));
  } catch (error) {
    console.error('Error deleting purchase from Firestore:', error);
  }
}

export async function syncStatementToFirestore(statement: MonthlyStatement) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'statements', statement.id), statement);
  } catch (error) {
    console.error('Error syncing statement to Firestore:', error);
  }
}

export async function syncAdminFeeToFirestore(fee: AdminFeeAllocation) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'adminFees', fee.id), fee);
  } catch (error) {
    console.error('Error syncing admin fee to Firestore:', error);
  }
}

export async function syncResponsibleToFirestore(resp: Responsible) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'responsibles', resp.id), resp);
  } catch (error) {
    console.error('Error syncing responsible to Firestore:', error);
  }
}

export async function deleteResponsibleFromFirestore(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'responsibles', id));
  } catch (error) {
    console.error('Error deleting responsible from Firestore:', error);
  }
}

export async function syncCardToFirestore(card: CreditCard) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'cards', card.id), card);
  } catch (error) {
    console.error('Error syncing card to Firestore:', error);
  }
}

export async function syncNewPurchaseToFirestore(p: NewPurchase) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'newPurchases', p.id), p);
  } catch (error) {
    console.error('Error syncing new purchase to Firestore:', error);
  }
}

export async function deleteNewPurchaseFromFirestore(id: string) {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'newPurchases', id));
  } catch (error) {
    console.error('Error deleting new purchase from Firestore:', error);
  }
}

