// clients/web/src/pages/petugas/DistributionList.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { ViewStateWrapper } from '../../components/ViewStateWrapper';

export function DistributionList() {
  const location = useLocation();
  const [viewState, setViewState] = useState({ kind: 'loading' });
  const [pollCount, setPollCount] = useState(0);
  const [successNotice, setSuccessNotice] = useState(location.state?.message || null);

  const fetchDistributions = async (isPoll = false) => {
    if (!isPoll) setViewState({ kind: 'loading' });

    try {
      const res = await api.listDistributions(isPoll);

      if (res.status === 304) {
        // A.7: 304 Not Modified — data lokal tetap mutakhir, hemat bandwidth
        setViewState(prev => ({
          ...prev,
          stale: false,
          fetchedAt: new Date()
        }));
        setPollCount(c => c + 1);
        return;
      }

      const items = res.data?.data || [];
      if (items.length === 0) {
        setViewState({
          kind: 'empty',
          emptyMessage: 'Tidak ada tugas alokasi distribusi paket aktif untuk Anda.'
        });
      } else {
        setViewState({
          kind: 'content',
          items,
          fetchedAt: new Date()
        });
      }
    } catch (err) {
      if (err.status === 403) {
        // Skenario 2: Refusal path domain error explanation (bukan redirect loop)
        setViewState({
          kind: 'error',
          problem: {
            title: 'Akses Ditolak (403 Forbidden)',
            detail: 'Halaman ini khusus untuk Petugas Lapangan. Akun Anda tidak memiliki scope "distributions:read" yang disyaratkan oleh backend.'
          }
        });
      } else {
        setViewState({
          kind: 'error',
          problem: err
        });
      }
    }
  };

  useEffect(() => {
    fetchDistributions(false);

    // Polling setiap 15 detik dengan If-None-Match (A.7)
    const interval = setInterval(() => {
      fetchDistributions(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Daftar Alokasi Distribusi Lapangan</h1>
          <p className="text-sm text-slate-600 mt-1">
            Workflow 2 (A.1): Verifikasi tugas penyaluran paket dan selesaikan konfirmasi serah terima.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            ETag Polling: {pollCount > 0 ? `${pollCount}x 304 Handled` : 'Aktif'} ⚡
          </span>
          <button
            onClick={() => fetchDistributions(false)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            Muat Ulang
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex justify-between items-center">
          <span>✅ {successNotice}</span>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      <ViewStateWrapper
        state={viewState}
        onRetry={() => fetchDistributions(false)}
        emptyMessage="Tidak ada paket distribusi yang ditugaskan kepada Anda saat ini."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {viewState.items?.map((item) => {
            const isCompleted = item.distributionStatus === 'handed_over';
            return (
              <div
                key={item.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 transition space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">ID DISTRIBUSI</span>
                    <h3 className="font-mono text-lg font-bold text-slate-900">{item.id}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {item.distributionStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                  <div>
                    <span className="block text-slate-400">ID Permohonan:</span>
                    <span className="font-mono font-medium text-slate-800">{item.requestId}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">ID Paket:</span>
                    <span className="font-mono font-medium text-slate-800">{item.packageId}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Petugas Bertugas:</span>
                    <span className="font-mono font-medium text-slate-800">{item.fieldOfficerId}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400">Dialokasikan:</span>
                    <span>{item.allocatedAt ? new Date(item.allocatedAt).toLocaleDateString() : '-'}</span>
                  </div>
                </div>

                <div>
                  {!isCompleted ? (
                    <Link
                      to={`/distributions/${item.id}/handover`}
                      className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm transition"
                    >
                      Konfirmasi Serah Terima (Handover) →
                    </Link>
                  ) : (
                    <div className="text-center py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                      ✓ Paket Telah Diserahkan di Lapangan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ViewStateWrapper>
    </div>
  );
}
