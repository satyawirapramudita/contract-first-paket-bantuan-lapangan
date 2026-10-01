// clients/web/src/pages/pemohon/RequestCreate.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { FieldError } from '../../components/FieldError';

export function RequestCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    applicantNationalId: '3578021203920001',
    applicantName: 'Budi Santoso',
    familyMemberCount: 4,
    targetLocation: 'Posko Pengungsian Balai Desa Sukamaju RT 02/04',
    requiredPackageType: 'family_food_pack',
    urgency: 'high'
  });

  const [inFlight, setInFlight] = useState(false);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [generalError, setGeneralError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInFlight(true);
    setFieldErrors([]);
    setGeneralError(null);

    const idempotencyKey = crypto.randomUUID(); // A.6 Idempotency Key pada mutasi

    try {
      const res = await api.createRequest(form, idempotencyKey);
      const newId = res.data?.id;
      navigate(`/requests/${newId}`, {
        state: { flashMessage: 'Permohonan bantuan baru berhasil diajukan!' }
      });
    } catch (err) {
      if (err.status === 400 && err.invalidFields) {
        // A.6 poin 1: Error diletakkan tepat di bawah field masing-masing
        setFieldErrors(err.invalidFields);
      } else {
        setGeneralError(err.detail || err.message || 'Gagal mengajukan permohonan');
      }
    } finally {
      setInFlight(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link to="/requests" className="text-xs font-semibold text-blue-600 hover:underline">
          ← Kembali ke Riwayat Permohonan
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Formulir Pengajuan Bantuan Baru</h1>
        <p className="text-sm text-slate-600">
          Workflow 1 (A.1): Kirim data permohonan logistik bantuan untuk keluarga terdampak.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
        {generalError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NIK */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nomor Induk Kependudukan (NIK Pemohon) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="applicantNationalId"
              value={form.applicantNationalId}
              onChange={handleChange}
              disabled={inFlight}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="16 digit NIK"
            />
            <FieldError errors={fieldErrors} fieldName="applicantNationalId" />
          </div>

          {/* Nama Pemohon */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap Pemohon <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="applicantName"
              value={form.applicantName}
              onChange={handleChange}
              disabled={inFlight}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nama kepala keluarga / perwakilan"
            />
            <FieldError errors={fieldErrors} fieldName="applicantName" />
          </div>

          {/* Jumlah Anggota Keluarga */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jumlah Anggota Keluarga Yang Ditanggung <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="familyMemberCount"
              value={form.familyMemberCount}
              onChange={handleChange}
              disabled={inFlight}
              min="1"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FieldError errors={fieldErrors} fieldName="familyMemberCount" />
          </div>

          {/* Lokasi Target */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lokasi Pengungsian / Alamat Pengiriman <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="targetLocation"
              value={form.targetLocation}
              onChange={handleChange}
              disabled={inFlight}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Tenda Darurat Lapangan Merdeka RT 03"
            />
            <FieldError errors={fieldErrors} fieldName="targetLocation" />
          </div>

          {/* Jenis Paket */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kebutuhan Paket Bantuan <span className="text-rose-500">*</span>
              </label>
              <select
                name="requiredPackageType"
                value={form.requiredPackageType}
                onChange={handleChange}
                disabled={inFlight}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="family_food_pack">Paket Sembako Keluarga (family_food_pack)</option>
                <option value="medical_emergency_kit">Kit Medis Darurat (medical_emergency_kit)</option>
                <option value="baby_essentials">Kebutuhan Bayi & Balita (baby_essentials)</option>
              </select>
              <FieldError errors={fieldErrors} fieldName="requiredPackageType" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tingkat Urgensi
              </label>
              <select
                name="urgency"
                value={form.urgency}
                onChange={handleChange}
                disabled={inFlight}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="low">Rendah (low)</option>
                <option value="medium">Sedang (medium)</option>
                <option value="high">Tinggi (high)</option>
                <option value="critical">Kritis (critical)</option>
              </select>
              <FieldError errors={fieldErrors} fieldName="urgency" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={inFlight}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm transition disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
            >
              {inFlight ? 'Mengirimkan Permohonan ke Posko...' : 'Kirim Permohonan Bantuan (Submit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
