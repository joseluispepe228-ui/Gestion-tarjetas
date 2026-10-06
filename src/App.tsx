import React, { useState, useEffect } from 'react';
import { AppState, loadAppState, saveAppState, resetAppStateToSeed, exportBackupJSON } from './lib/storage';
import { Purchase, MonthlyStatement, AdminFeeAllocation, Responsible, CreditCard, NewPurchase } from './types';
import { Navbar, ActiveTab } from './components/Navbar';
import { IngresoCompras } from './components/IngresoCompras';
import { IngresoEstadoCuenta } from './components/IngresoEstadoCuenta';
import { GastosAdministrativos } from './components/GastosAdministrativos';
import { GestionResponsables } from './components/GestionResponsables';
import { Reportes } from './components/Reportes';
import { NuevasCompras } from './components/NuevasCompras';
import {
  isFirebaseConfigured,
  subscribeToFirestoreData,
  syncPurchaseToFirestore,
  deletePurchaseFromFirestore,
  syncStatementToFirestore,
  syncAdminFeeToFirestore,
  syncResponsibleToFirestore,
  deleteResponsibleFromFirestore,
  syncNewPurchaseToFirestore,
  deleteNewPurchaseFromFirestore,
  syncAllDataToFirestore,
  syncCardToFirestore,
} from './lib/firebase';
import { DEFAULT_CARDS } from './data/initialData';
import { CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('compras');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-persist state changes to localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Firebase Firestore Realtime Subscription (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToFirestoreData((data) => {
      setAppState((prev) => {
        // Smart merge for purchases: prevents losing any purchase entered locally that hasn't reached Firestore
        let mergedPurchases = prev.purchases;
        if (data.purchases !== undefined) {
          const firestoreIds = new Set(data.purchases.map((p) => p.id));
          // Find any purchase present locally that is not in Firestore (excluding dummy p-1.. seeds)
          const unsyncedLocals = prev.purchases.filter(
            (localP) => !firestoreIds.has(localP.id) && !localP.id.startsWith('p-')
          );

          // If there are unsynced local purchases (e.g. from previous failed writes), push them to Firestore!
          if (unsyncedLocals.length > 0) {
            console.log(`[Sync] Rescatando y subiendo ${unsyncedLocals.length} compras locales a Firestore...`);
            unsyncedLocals.forEach((lp) => {
              syncPurchaseToFirestore(lp);
            });
          }

          // Combined: local unsynced purchases + all firestore purchases
          mergedPurchases = [...unsyncedLocals, ...data.purchases];
        }

        // Smart merge for new purchases (Module 6)
        let mergedNewPurchases = prev.newPurchases || [];
        if (data.newPurchases !== undefined) {
          const firestoreIds = new Set(data.newPurchases.map((p) => p.id));
          const unsyncedNew = (prev.newPurchases || []).filter((np) => !firestoreIds.has(np.id));
          if (unsyncedNew.length > 0) {
            unsyncedNew.forEach((np) => syncNewPurchaseToFirestore(np));
          }
          mergedNewPurchases = [...unsyncedNew, ...data.newPurchases];
        }

        // Smart merge for cards: ALWAYS guarantee DEFAULT_CARDS (Ripley, Falabella, Cencosud) exist
        const cardMap = new Map<string, CreditCard>();
        DEFAULT_CARDS.forEach((c) => cardMap.set(c.id, c));
        prev.cards.forEach((c) => cardMap.set(c.id, { ...(cardMap.get(c.id) || {}), ...c }));
        if (data.cards && data.cards.length > 0) {
          data.cards.forEach((c) => cardMap.set(c.id, { ...(cardMap.get(c.id) || {}), ...c }));
        }
        const mergedCards = Array.from(cardMap.values());

        // Rescate: If any default card is missing from Firestore, sync it up now
        if (data.cards !== undefined) {
          const firestoreCardIds = new Set(data.cards.map((c) => c.id));
          mergedCards.forEach((c) => {
            if (!firestoreCardIds.has(c.id)) {
              syncCardToFirestore(c);
            }
          });
        }

        return {
          cards: mergedCards,
          responsibles: data.responsibles && data.responsibles.length > 0 ? data.responsibles : prev.responsibles,
          purchases: mergedPurchases,
          statements: data.statements !== undefined ? data.statements : prev.statements,
          adminFees: data.adminFees !== undefined ? data.adminFees : prev.adminFees,
          newPurchases: mergedNewPurchases,
        };
      });
    });

    return () => unsubscribe();
  }, []);

  // Handlers for Purchases
  const handleAddPurchase = (purchase: Purchase) => {
    setAppState((prev) => ({
      ...prev,
      purchases: [purchase, ...prev.purchases.filter((p) => p.id !== purchase.id)],
    }));
    syncPurchaseToFirestore(purchase);
  };

  const handleUpdatePurchase = (updated: Purchase) => {
    setAppState((prev) => ({
      ...prev,
      purchases: prev.purchases.map((p) => (p.id === updated.id ? updated : p)),
    }));
    syncPurchaseToFirestore(updated);
  };

  const handleDeletePurchase = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta compra registrada?')) {
      setAppState((prev) => ({
        ...prev,
        purchases: prev.purchases.filter((p) => p.id !== id),
      }));
      deletePurchaseFromFirestore(id);
    }
  };

  const handleDeleteMultiplePurchases = (ids: string[]) => {
    setAppState((prev) => ({
      ...prev,
      purchases: prev.purchases.filter((p) => !ids.includes(p.id)),
    }));
    ids.forEach((id) => deletePurchaseFromFirestore(id));
  };

  // Handlers for Statements
  const handleSaveStatement = (statement: MonthlyStatement) => {
    setAppState((prev) => {
      const filtered = prev.statements.filter(
        (s) => !(s.cardId === statement.cardId && s.month === statement.month)
      );
      return {
        ...prev,
        statements: [...filtered, statement],
      };
    });
    syncStatementToFirestore(statement);
  };

  // Handlers for Admin Fees
  const handleSaveAdminFee = (allocation: AdminFeeAllocation) => {
    setAppState((prev) => {
      const filtered = prev.adminFees.filter(
        (a) =>
          !(
            a.cardId === allocation.cardId &&
            a.month === allocation.month &&
            a.responsibleId === allocation.responsibleId
          )
      );
      return {
        ...prev,
        adminFees: [...filtered, allocation],
      };
    });
    syncAdminFeeToFirestore(allocation);
  };

  const handleSaveMultipleAdminFees = (allocations: AdminFeeAllocation[]) => {
    if (allocations.length === 0) return;
    const cardId = allocations[0].cardId;
    const month = allocations[0].month;

    setAppState((prev) => {
      const filtered = prev.adminFees.filter(
        (a) => !(a.cardId === cardId && a.month === month)
      );
      return {
        ...prev,
        adminFees: [...filtered, ...allocations],
      };
    });

    allocations.forEach((alloc) => syncAdminFeeToFirestore(alloc));
  };

  // Handlers for Responsibles
  const handleAddResponsible = (resp: Responsible) => {
    setAppState((prev) => ({
      ...prev,
      responsibles: [...prev.responsibles, resp],
    }));
    syncResponsibleToFirestore(resp);
  };

  const handleUpdateResponsible = (updated: Responsible) => {
    setAppState((prev) => ({
      ...prev,
      responsibles: prev.responsibles.map((r) => (r.id === updated.id ? updated : r)),
    }));
    syncResponsibleToFirestore(updated);
  };

  const handleDeleteResponsible = (id: string) => {
    const hasPurchases = appState.purchases.some((p) => p.responsibleId === id);
    if (hasPurchases) {
      alert('No se puede eliminar este responsable porque tiene compras asociadas. Primero edita o elimina las compras asociadas.');
      return;
    }
    if (window.confirm('¿Deseas eliminar a este familiar responsable?')) {
      setAppState((prev) => ({
        ...prev,
        responsibles: prev.responsibles.filter((r) => r.id !== id),
      }));
      deleteResponsibleFromFirestore(id);
    }
  };

  const handleResetSeedData = () => {
    if (window.confirm('¿Restablecer los datos iniciales de prueba? Se reemplazarán las compras actuales.')) {
      const seedState = resetAppStateToSeed();
      setAppState(seedState);
    }
  };

  // Handlers for Module 6 (Nuevas Compras / Bitácora)
  const handleAddNewPurchase = (p: NewPurchase) => {
    setAppState((prev) => ({
      ...prev,
      newPurchases: [p, ...(prev.newPurchases || [])],
    }));
    syncNewPurchaseToFirestore(p);
  };

  const handleUpdateNewPurchase = (updated: NewPurchase) => {
    setAppState((prev) => ({
      ...prev,
      newPurchases: (prev.newPurchases || []).map((p) => (p.id === updated.id ? updated : p)),
    }));
    syncNewPurchaseToFirestore(updated);
  };

  const handleDeleteNewPurchase = (id: string) => {
    if (window.confirm('¿Deseas eliminar este registro de compra de la bitácora?')) {
      setAppState((prev) => ({
        ...prev,
        newPurchases: (prev.newPurchases || []).filter((p) => p.id !== id),
      }));
      deleteNewPurchaseFromFirestore(id);
    }
  };

  const handleConvertToModule1 = (p: Purchase) => {
    handleAddPurchase(p);
  };

  const handleExportBackup = () => {
    exportBackupJSON(appState);
  };

  // Force Cloud Sync of all data
  const handleSyncCloud = async () => {
    if (!isFirebaseConfigured) {
      setSyncFeedback({ message: 'Firebase no está configurado en esta instancia.', type: 'error' });
      setTimeout(() => setSyncFeedback(null), 4000);
      return;
    }
    setIsSyncing(true);
    setSyncFeedback({ message: 'Sincronizando todas las compras y datos con Firestore...', type: 'info' });
    try {
      const result = await syncAllDataToFirestore(appState);
      if (result.success) {
        setSyncFeedback({
          message: `¡Sincronización exitosa! ${result.successCount} registros sincronizados con la nube. Ahora son visibles en todos tus dispositivos.`,
          type: 'success',
        });
      } else {
        setSyncFeedback({
          message: 'Hubo un problema al sincronizar. Comprueba tu conexión a Internet.',
          type: 'error',
        });
      }
    } catch (e: any) {
      setSyncFeedback({
        message: 'Error al contactar con la nube: ' + (e?.message || 'error desconocido'),
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportBackup={handleExportBackup}
        onResetSeed={handleResetSeedData}
        onSyncCloud={handleSyncCloud}
        isSyncing={isSyncing}
      />

      {/* Cloud Sync Notification Banner */}
      {syncFeedback && (
        <div
          className={`px-4 py-2.5 text-xs font-medium border-b flex items-center justify-between transition-all ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : syncFeedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              {syncFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {syncFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {syncFeedback.type === 'info' && <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer ml-4"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'compras' && (
          <IngresoCompras
            cards={appState.cards}
            responsibles={appState.responsibles}
            purchases={appState.purchases}
            onAddPurchase={handleAddPurchase}
            onUpdatePurchase={handleUpdatePurchase}
            onDeletePurchase={handleDeletePurchase}
            onDeleteMultiplePurchases={handleDeleteMultiplePurchases}
            onSyncCloud={handleSyncCloud}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'estado-cuenta' && (
          <IngresoEstadoCuenta
            cards={appState.cards}
            statements={appState.statements}
            purchases={appState.purchases}
            onSaveStatement={handleSaveStatement}
          />
        )}

        {activeTab === 'gastos-admin' && (
          <GastosAdministrativos
            cards={appState.cards}
            responsibles={appState.responsibles}
            statements={appState.statements}
            adminFees={appState.adminFees}
            purchases={appState.purchases}
            onSaveAdminFee={handleSaveAdminFee}
            onSaveMultipleAdminFees={handleSaveMultipleAdminFees}
          />
        )}

        {activeTab === 'responsables' && (
          <GestionResponsables
            responsibles={appState.responsibles}
            purchases={appState.purchases}
            onAddResponsible={handleAddResponsible}
            onUpdateResponsible={handleUpdateResponsible}
            onDeleteResponsible={handleDeleteResponsible}
          />
        )}

        {activeTab === 'reportes' && (
          <Reportes
            cards={appState.cards}
            responsibles={appState.responsibles}
            purchases={appState.purchases}
            statements={appState.statements}
            adminFees={appState.adminFees}
          />
        )}

        {activeTab === 'nuevas-compras' && (
          <NuevasCompras
            cards={appState.cards}
            responsibles={appState.responsibles}
            newPurchases={appState.newPurchases || []}
            onAddNewPurchase={handleAddNewPurchase}
            onUpdateNewPurchase={handleUpdateNewPurchase}
            onDeleteNewPurchase={handleDeleteNewPurchase}
            onConvertToModule1={handleConvertToModule1}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Control y Conciliación de Tarjetas de Crédito Familiares</span>
          <span>Estructura optimizada según requerimientos</span>
        </div>
      </footer>
    </div>
  );
}
