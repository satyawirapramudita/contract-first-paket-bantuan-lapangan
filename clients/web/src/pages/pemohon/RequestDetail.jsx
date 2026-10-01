// clients/web/src/pages/pemohon/RequestDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { ViewStateWrapper } from '../../components/ViewStateWrapper';

export function RequestDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [viewState, setViewState] = useState({ kind: 'loading' });
  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || null);

  const loadDetail = async () => {
    setViewState({ kind: 'loading' });
    try {
      const res = await api.getRequest(id);
      setViewState({
        kind: 'content',
        item: res.data,
        fetchedAt: new Date()
      });
    } catch (err) {
      setViewState({
        kind: 'error',
        problem: err
      });
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const req = viewState.item;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/requests" className="text-xs font-semibold text-blue-600 hover:underline">
          ← Kembali ke Riwayat Permohonan
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          URL Bookmarkable: /requests/{id}
        </span>
      </div>

      {flashMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-sm flex justify-between items-center">
          <span>✅ {flashMessage}</span>
          <button onClick={() => setFlashMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      <ViewStateWrapper
        state={viewState}
        onRetry={loadDetail}
        emptyMessage="Data permohonan tidak ditemukan."
      >
        {req && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Detail Permohonan Bantuan
                </span>
                <h1 className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {req.id}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  Status: {req.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  Urgensi: {req.urgency || 'medium'}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nama Pemohon
                </span>
                <span className="font-semibold text-slate-800 text-base">{req.applicantName}</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Nomor Induk Kependudukan (NIK)
                </span>
                <span className="font-mono text-slate-800">{req.applicantNationalId}</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Kebutuhan Paket
                </span>
                <span className="font-mono font-medium text-slate-800">{req.requiredPackageType}</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Jumlah Anggota Keluarga
                </span>
                <span className="font-semibold text-slate-800">{req.familyMemberCount} Orang</span>
              </div>

              <div className="md:col-span-2">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Lokasi Target Pengantaran
                </span>
                <span className="text-slate-800">{req.targetLocation}</span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Waktu Diajukan
                </span>
                <span className="text-slate-600">
                  {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : '-'}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pemilik Sesi (Owner Subject)
                </span>
                <span className="font-mono text-xs text-slate-600">{req.applicantSubject || '-'}</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Halaman ini dapat di-reload (F5) untuk membuktikan persistensi data & URL bookmarkable.</span>
              <button
                onClick={loadDetail}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium transition"
              >
                Segarkan Data 🔄
              </button>
            </div>
          </div>
        )}
      </ViewStateWrapper>
    </div>
  );
}
