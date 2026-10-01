// clients/web/src/pages/pemohon/RequestList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ViewStateWrapper } from '../../components/ViewStateWrapper';

export function RequestList() {
  const [viewState, setViewState] = useState({ kind: 'loading' });

  const loadRequests = async () => {
    setViewState({ kind: 'loading' });
    try {
      const res = await api.listRequests();
      const items = res.data?.data || [];
      if (items.length === 0) {
        setViewState({
          kind: 'empty',
          emptyMessage: 'Belum ada permohonan bantuan yang diajukan oleh akun Anda.'
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
    loadRequests();
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      submitted: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      allocated: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200',
      cancelled: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || colors.submitted}`}>
        {status}
      </span>
    );
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      critical: 'text-rose-600 font-bold',
      high: 'text-orange-600 font-semibold',
      medium: 'text-amber-600',
      low: 'text-slate-600'
    };
    return <span className={`text-xs uppercase tracking-wider ${colors[urgency] || ''}`}>{urgency || 'medium'}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Permohonan Bantuan Saya</h1>
          <p className="text-sm text-slate-600 mt-1">
            Workflow 1: Pantau status alokasi dan distribusi bantuan yang telah diajukan.
          </p>
        </div>
        <Link
          to="/requests/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          + Ajukan Bantuan Baru
        </Link>
      </div>

      <ViewStateWrapper
        state={viewState}
        onRetry={loadRequests}
        emptyMessage="Anda belum pernah mengajukan permohonan bantuan. Tekan tombol di atas untuk membuat permohonan baru."
      >
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200">
            {viewState.items?.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/requests/${item.id}`}
                      className="font-mono text-sm font-bold text-blue-600 hover:underline"
                    >
                      {item.id}
                    </Link>
                    {getStatusBadge(item.status)}
                    <span className="text-xs text-slate-400">|</span>
                    <span className="text-xs text-slate-500">Urgensi: {getUrgencyBadge(item.urgency)}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Paket: <span className="font-mono text-xs">{item.requiredPackageType}</span> ({item.familyMemberCount} Anggota Keluarga)
                  </div>
                  <div className="text-xs text-slate-500">
                    Lokasi Target: <span className="text-slate-700">{item.targetLocation}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-400">
                    Diajukan: {item.requestedAt ? new Date(item.requestedAt).toLocaleString() : '-'}
                  </div>
                  <Link
                    to={`/requests/${item.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                  >
                    Lihat Detail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ViewStateWrapper>
    </div>
  );
}
