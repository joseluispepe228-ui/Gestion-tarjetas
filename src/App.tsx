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
} from './lib/firebase';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('compras');

  // Auto-persist state changes to localStorage
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Firebase Firestore Realtime Subscription (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = subscribeToFirestoreData((data) => {
      setAppState((prev) => ({
        cards: data.cards || prev.cards,
        responsibles: data.responsibles || prev.responsibles,
        purchases: data.purchases || prev.purchases,
        statements: data.statements || prev.statements,
        adminFees: data.adminFees || prev.adminFees,
        newPurchases: data.newPurchases || prev.newPurchases,
      }));
    });

    return () => unsubscribe();
  }, []);

  // Handlers for Purchases
  const handleAddPurchase = (purchase: Purchase) => {
    setAppState((prev) => ({
      ...prev,
      purchases: [purchase, ...prev.purchases],
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportBackup={handleExportBackup}
        onResetSeed={handleResetSeedData}
      />

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
