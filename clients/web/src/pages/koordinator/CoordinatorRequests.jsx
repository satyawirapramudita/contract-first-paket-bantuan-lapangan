// clients/web/src/pages/koordinator/CoordinatorRequests.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ViewStateWrapper } from '../../components/ViewStateWrapper';

export function CoordinatorRequests() {
  const [viewState, setViewState] = useState({ kind: 'loading' });
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [actionNotice, setActionNotice] = useState(null);

  const loadAllRequests = async () => {
    setViewState({ kind: 'loading' });
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (urgencyFilter) params.append('urgency', urgencyFilter);
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const res = await api.listRequests(queryStr);
      const items = res.data?.data || [];

      if (items.length === 0) {
        setViewState({
          kind: 'empty',
          emptyMessage: 'Tidak ada permohonan yang sesuai dengan filter yang dipilih.'
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
        setViewState({
          kind: 'error',
          problem: {
            title: 'Akses Ditolak (403 Forbidden)',
            detail: 'Halaman monitoring seluruh permohonan memerlukan wewenang Koordinator Posko (scope "requests:review").'
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
    loadAllRequests();
  }, [statusFilter, urgencyFilter]);

  // Alokasikan permohonan ke Petugas Lapangan (petugas-a)
  const handleAllocate = (item) => {
    const pkgCode = item.requiredPackageType === 'medical_emergency_kit' ? 'LOG-MEDIS-001' : 'LOG-SEMBAKO-001';
    const dist = api.allocateToOfficer(item, 'petugas-a', pkgCode);

    // Update state tampilan langsung
    setViewState(prev => ({
      ...prev,
      items: prev.items?.map(it => it.id === item.id ? { ...it, status: 'allocated' } : it)
    }));

    setActionNotice({
      type: 'success',
      message: `Permohonan ${item.id} (${item.applicantName}) berhasil disetujui & dialokasikan ke Petugas Lapangan (petugas-a)! Tiket distribusi ${dist?.id} sekarang langsung aktif di akun Petugas.`
    });
  };

  // Ubah status permohonan secara manual
  const handleStatusChange = (item, newStatus) => {
    if (newStatus === 'allocated') {
      handleAllocate(item);
      return;
    }

    api.updateRequestStatus(item.id, newStatus);

    setViewState(prev => ({
      ...prev,
      items: prev.items?.map(it => it.id === item.id ? { ...it, status: newStatus } : it)
    }));

    setActionNotice({
      type: 'info',
      message: `Status permohonan ${item.id} berhasil diubah menjadi "${newStatus}".`
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      allocated: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dasbor Pengawasan Seluruh Permohonan</h1>
          <p className="text-sm text-slate-600 mt-1">
            Workflow 3 (A.1): Koordinator posko memantau seluruh antrean, menyetujui permohonan, dan menugaskan alokasi paket ke petugas lapangan.
          </p>
        </div>
        <button
          onClick={loadAllRequests}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          Perbarui Data 🔄
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 border ${
          actionNotice.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md p-1.5 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="allocated">Allocated</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Urgensi:</label>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-md p-1.5 bg-white"
          >
            <option value="">Semua Urgensi</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <ViewStateWrapper
        state={viewState}
        onRetry={loadAllRequests}
        emptyMessage="Tidak ada data permohonan yang ditemukan."
      >
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="p-3.5">ID Permohonan</th>
                <th className="p-3.5">Nama & NIK</th>
                <th className="p-3.5">Paket</th>
                <th className="p-3.5">Anggota</th>
                <th className="p-3.5">Lokasi Pengungsian</th>
                <th className="p-3.5">Urgensi</th>
                <th className="p-3.5">Status Saat Ini</th>
                <th className="p-3.5">Aksi Koordinator (Ubah Status / Alokasikan)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {viewState.items?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5 font-mono font-bold text-blue-600">{item.id}</td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{item.applicantName}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{item.applicantNationalId}</div>
                  </td>
                  <td className="p-3.5 font-mono">{item.requiredPackageType}</td>
                  <td className="p-3.5">{item.familyMemberCount} Org</td>
                  <td className="p-3.5 max-w-xs truncate text-slate-700" title={item.targetLocation}>
                    {item.targetLocation}
                  </td>
                  <td className="p-3.5 uppercase font-semibold">
                    <span className={item.urgency === 'critical' ? 'text-rose-600 font-bold' : item.urgency === 'high' ? 'text-orange-600' : 'text-slate-600'}>
                      {item.urgency || 'medium'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {/* Tombol Cepat Tugaskan ke Petugas jika belum dialokasikan */}
                      {item.status !== 'allocated' && item.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleAllocate(item)}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-[11px] shadow-sm transition whitespace-nowrap flex items-center gap-1"
                        >
                          <span>🚚</span> Tugaskan ke Petugas
                        </button>
                      )}

                      {/* Dropdown Ubah Status */}
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value)}
                        className="text-[11px] border border-slate-300 rounded-md p-1 bg-white font-medium text-slate-700"
                        title="Ubah status permohonan"
                      >
                        <option value="submitted">Status: submitted</option>
                        <option value="approved">Status: approved</option>
                        <option value="allocated">Status: allocated (Tugaskan)</option>
                        <option value="completed">Status: completed</option>
                        <option value="rejected">Status: rejected</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ViewStateWrapper>
    </div>
  );
}
