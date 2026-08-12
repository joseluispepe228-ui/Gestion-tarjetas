import React from 'react';
import { ShoppingCart, FileText, Calculator, Users, BarChart3, CreditCard as CardIcon, Download, RotateCcw, Database, Cloud } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

export type ActiveTab = 'compras' | 'estado-cuenta' | 'gastos-admin' | 'responsables' | 'reportes';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExportBackup: () => void;
  onResetSeed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onExportBackup,
  onResetSeed,
}) => {
  const tabs = [
    {
      id: 'compras' as ActiveTab,
      label: 'Ingreso de Compras',
      icon: ShoppingCart,
      badge: '1',
    },
    {
      id: 'estado-cuenta' as ActiveTab,
      label: 'Ingreso a Pagar Mes',
      icon: FileText,
      badge: '2',
    },
    {
      id: 'gastos-admin' as ActiveTab,
      label: 'Gastos Administrativos',
      icon: Calculator,
      badge: '3',
    },
    {
      id: 'responsables' as ActiveTab,
      label: 'Gestión de Responsables',
      icon: Users,
      badge: '4',
    },
    {
      id: 'reportes' as ActiveTab,
      label: 'Reporte y Conciliación',
      icon: BarChart3,
      badge: '5',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Brand & Actions Bar */}
        <div className="flex justify-between items-center py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800 leading-tight">
                  Control de Tarjetas de Crédito
                </h1>
                {isFirebaseConfigured ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full" title="Conectado a Firebase Firestore en tiempo real">
                    <Cloud className="w-3 h-3 text-emerald-600" /> Firebase
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full" title="Usando almacenamiento local de navegador (Configura Firebase en .env o Vercel)">
                    <Database className="w-3 h-3 text-amber-600" /> Local Storage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Conciliación Familiar de Gastos y Cuotas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportBackup}
              title="Descargar copia de seguridad en JSON"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Respaldar Datos</span>
            </button>
            <button
              onClick={onResetSeed}
              title="Restablecer datos de prueba"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Modules Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                    isActive ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
