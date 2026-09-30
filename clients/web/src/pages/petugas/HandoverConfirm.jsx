// clients/web/src/pages/petugas/HandoverConfirm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
      } else if (err.status === 400 && err.invalidFields) {
        setFieldErrors(err.invalidFields); // A.6: Letakkan error pada field form
      } else {
        alert(err.detail || 'Gagal menyimpan serah terima');
      }
    } finally {
      setInFlight(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold mb-4">Konfirmasi Serah Terima Paket</h2>

      {conflictNotice && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-sm">
          <strong>Perhatian:</strong> {conflictNotice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">NIK Penerima</label>
          <input
            type="text"
            value={recipientNik}
            onChange={(e) => setRecipientNik(e.target.value)}
            disabled={inFlight}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="16 digit NIK penerima di lokasi"
          />
          <FieldError errors={fieldErrors} fieldName="recipientNationalId" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Catatan Tambahan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={inFlight}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={inFlight} // A.6: Disable saat in-flight
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:bg-slate-300"
        >
          {inFlight ? 'Menyimpan ke Server...' : 'Konfirmasi Serah Terima'}
        </button>
      </form>
    </div>
  );
}
