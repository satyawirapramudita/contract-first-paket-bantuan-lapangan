// clients/web/src/pages/petugas/HandoverConfirm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { FieldError } from '../../components/FieldError';

export function HandoverConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [distribution, setDistribution] = useState(null);
  const [currentEtag, setCurrentEtag] = useState(null);
  const [recipientNik, setRecipientNik] = useState('');
  const [notes, setNotes] = useState('');

  const [inFlight, setInFlight] = useState(false);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [conflictNotice, setConflictNotice] = useState(null);

  const loadData = async () => {
    try {
      const res = await api.getDistribution(id);
      setDistribution(res.data);
      setCurrentEtag(res.etag);
      // Auto-prefill NIK penerima jika ada data di permohonan
      if (res.data?.applicantNationalId && !recipientNik) {
        setRecipientNik(res.data.applicantNationalId);
      }
    } catch (err) {
      // 404 / 403 handling
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInFlight(true);
    setFieldErrors([]);
    setConflictNotice(null);

    const idempotencyKey = crypto.randomUUID(); // A.6: Idempotency Key pada setiap write

    try {
      await api.confirmHandover({
        distributionId: id,
        recipientNationalId: recipientNik,
        handedOverAt: new Date().toISOString(),
        fieldOfficerId: 'ofc_55xYz12',
        recipientNotes: notes
      }, idempotencyKey, currentEtag); // A.8: Mengirim If-Match ETag

      navigate('/distributions', { state: { message: 'Serah terima paket berhasil dikonfirmasi!' } });
    } catch (err) {
      if (err.status === 412) {
        // A.8 PENTING: Tangani 412 sebagai kondisi normal, bukan generic error
        setConflictNotice('Paket ini baru saja diserahterimakan oleh petugas lain atau status telah berubah di posko.');
        await loadData(); // Segarkan data lokal ke versi terbaru
      } else if (err.status === 409) {
        setConflictNotice(err.detail || 'Paket distribusi ini telah diserahkan di lapangan dan tidak dapat diserahkan kembali.');
        await loadData();
      } else if (err.status === 400 && err.invalidFields) {
        setFieldErrors(err.invalidFields); // A.6: Letakkan error pada field form
      } else {
        setConflictNotice(err.detail || err.message || 'Gagal menyimpan serah terima.');
      }
    } finally {
      setInFlight(false);
    }
  };

  const isAlreadyHandedOver = distribution?.distributionStatus === 'handed_over';

  // Jika paket sudah selesai diserahkan, kunci form dan tampilkan konfirmasi selesai
  if (isAlreadyHandedOver) {
    return (
      <div className="max-w-xl mx-auto py-10 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl mx-auto">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Paket Telah Selesai Diserahterimakan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tiket distribusi <span className="font-mono font-bold text-slate-800">{id}</span> berstatus <strong>handed_over</strong> (Selesai).
            </p>
          </div>

          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 text-left space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
              <span>🛡️</span> Aturan Penyaluran Bantuan (409 Conflict)
            </div>
            <p>
              Penyerahan paket logistik ini telah resmi tercatat di sistem posko darurat. Sesuai prinsip anti-duplikasi, transaksi serah terima telah ditutup dan tidak dapat diserahkan kembali.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/distributions"
              className="inline-flex items-center justify-center py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs shadow-sm transition"
            >
              ← Kembali ke Daftar Distribusi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-4">
        <Link to="/distributions" className="text-xs font-semibold text-blue-600 hover:underline">
          ← Kembali ke Daftar Distribusi
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Formulir Serah Terima Lapangan
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Konfirmasi Serah Terima Paket
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Distribusi ID: <span className="font-mono font-bold text-slate-700">{id}</span>
          </p>
        </div>

        {conflictNotice && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800">
              <span>⚠️</span> Penolakan Konflik Serah Terima:
            </div>
            <p>{conflictNotice}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor Induk Kependudukan (NIK Penerima) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={recipientNik}
              onChange={(e) => setRecipientNik(e.target.value)}
              disabled={inFlight}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="16 digit NIK penerima di lokasi"
              required
            />
            <FieldError errors={fieldErrors} fieldName="recipientNationalId" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Penyerahan / Kondisi Lapangan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={inFlight}
              rows={3}
              placeholder="Contoh: Paket sembako diserahkan langsung kepada perwakilan keluarga di Tenda Darurat 3."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={inFlight}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {inFlight ? 'Menyimpan Bukti ke Posko...' : 'Selesaikan Serah Terima Paket (Submit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
