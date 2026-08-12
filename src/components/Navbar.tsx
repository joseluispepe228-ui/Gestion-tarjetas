import React, { useState, useEffect } from 'react';
import { ShoppingCart, FileText, Calculator, Users, BarChart3, CreditCard as CardIcon, Download, RotateCcw, Database, Cloud, Smartphone, X, CheckCircle2, Share, ShoppingBag } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

export type ActiveTab = 'compras' | 'estado-cuenta' | 'gastos-admin' | 'responsables' | 'reportes' | 'nuevas-compras';

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    } else {
      setIsInstallModalOpen(true);
    }
  };

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
      label: 'Reporte de Gastos',
      icon: BarChart3,
      badge: '5',
    },
    {
      id: 'nuevas-compras' as ActiveTab,
      label: 'Compras (Nuevas)',
      icon: ShoppingBag,
      badge: '6',
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
                  Gestion Tarjetas De Credito
                </h1>
                {isFirebaseConfigured ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full" title="Conectado a Firebase Firestore en tiempo real">
                    <Cloud className="w-3 h-3 text-emerald-600" /> Firebase
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full" title="Usando almacenamiento local de navegador">
                    <Database className="w-3 h-3 text-amber-600" /> Local Storage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Gestión de Gastos y Cuotas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Install App Button */}
            <button
              onClick={handleInstallClick}
              title="Descargar e instalar la aplicación en tu teléfono"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Smartphone className="w-4 h-4" />
              <span>Descargar App</span>
            </button>

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

      {/* PWA Download Modal Instructions */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Instalar en tu Teléfono</h3>
                  <p className="text-xs text-slate-500">Gestion Tarjetas De Credito</p>
                </div>
              </div>
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-800">
                Para descargar la app en tu teléfono y tener acceso directo en tu pantalla de inicio:
              </p>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-indigo-700 flex items-center gap-1.5">
                  <Share className="w-4 h-4" /> En iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Toca el botón <strong className="text-slate-800">Compartir</strong> (icono de cuadrado con flecha arriba).</li>
                  <li>Selecciona <strong className="text-slate-800">"Agregar al inicio"</strong> o <strong className="text-slate-800">"Añadir a pantalla de inicio"</strong>.</li>
                  <li>Confirma con <strong className="text-slate-800">Añadir</strong>.</li>
                </ol>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="font-bold text-indigo-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> En Android (Chrome / Edge):
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                  <li>Toca el menú de 3 puntos (<strong className="text-slate-800">⋮</strong>) arriba a la derecha.</li>
                  <li>Selecciona <strong className="text-slate-800">"Instalar aplicación"</strong> o <strong className="text-slate-800">"Agregar a la pantalla principal"</strong>.</li>
                  <li>Sigue las instrucciones en pantalla.</li>
                </ol>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

