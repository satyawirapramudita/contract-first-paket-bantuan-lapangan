// clients/web/src/pages/koordinator/PackageInventory.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ViewStateWrapper } from '../../components/ViewStateWrapper';

export function PackageInventory() {
  const [viewState, setViewState] = useState({ kind: 'loading' });

  const loadPackages = async () => {
    setViewState({ kind: 'loading' });
    try {
      const res = await api.listPackages();
      const items = res.data?.data || [];

      if (items.length === 0) {
        setViewState({
          kind: 'empty',
          emptyMessage: 'Gudang logistik belum memiliki stok paket bantuan terdaftar.'
        });
      } else {
        setViewState({
          kind: 'content',
          items,
          fetchedAt: new Date()
        });
      }
    } catch (err) {
      setViewState({
        kind: 'error',
        problem: err
      });
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dasbor Monitoring Inventaris Paket Gudang</h1>
          <p className="text-sm text-slate-600 mt-1">
            Workflow 3 (A.1): Pantau kesiapan dan ketersediaan stok paket logistik di posko.
          </p>
        </div>
        <button
          onClick={loadPackages}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          Muat Ulang Stok 🔄
        </button>
      </div>

      <ViewStateWrapper
        state={viewState}
        onRetry={loadPackages}
        emptyMessage="Tidak ada inventaris paket di gudang saat ini."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {viewState.items?.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold text-slate-400">{pkg.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  pkg.preparationStatus === 'in_stock'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {pkg.preparationStatus}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-sm">
                  {pkg.packageType}
                </h4>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  Kode: {pkg.packageCode}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <div>Lokasi: <span className="font-medium text-slate-700">{pkg.warehouseLocation || 'Gudang Pusat'}</span></div>
                <div>Siap Sejak: <span className="text-slate-600">{pkg.readyAt ? new Date(pkg.readyAt).toLocaleString() : '-'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </ViewStateWrapper>
    </div>
  );
}
