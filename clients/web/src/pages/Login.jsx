// clients/web/src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const ACCOUNTS = {
  'pemohon-a': {
    username: 'pemohon-a',
    name: 'Warga Pemohon A',
    role: 'pemohon',
    scopes: ['requests:read', 'requests:write'],
    label: 'Pemohon / Warga'
  },
  'petugas-a': {
    username: 'petugas-a',
    name: 'Petugas Lapangan A',
    role: 'petugas-lapangan',
    scopes: ['requests:read', 'distributions:read', 'handovers:write'],
    label: 'Petugas Lapangan'
  },
  'koordinator-a': {
    username: 'koordinator-a',
    name: 'Koordinator Posko A',
    role: 'koordinator',
    scopes: ['requests:read', 'requests:review', 'packages:read', 'distributions:read'],
    label: 'Koordinator Posko'
  }
};

const DEFAULT_PASSWORD = 'LabOnly2026!';

export function Login() {
  const { loginAs } = useAuth();
  const [username, setUsername] = useState('pemohon-a');
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorNotice(null);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Verifikasi kredensial
    const matchedAccount = ACCOUNTS[cleanUsername];

    if (!matchedAccount) {
      setErrorNotice('Username tidak ditemukan. Gunakan: pemohon-a, petugas-a, atau koordinator-a.');
      setLoading(false);
      return;
    }

    if (cleanPassword !== DEFAULT_PASSWORD) {
      setErrorNotice(`Password salah. Password untuk seluruh akun demo adalah: ${DEFAULT_PASSWORD}`);
      setLoading(false);
      return;
    }

    // Login sukses: simpan ke in-memory session (ADR 0004 / A.3)
    loginAs({
      username: matchedAccount.username,
      name: matchedAccount.name,
      role: matchedAccount.role,
      scopes: matchedAccount.scopes,
      token: 'demo-in-memory-token'
    });

    setLoading(false);
  };

  const handleQuickFill = (accKey) => {
    setUsername(accKey);
    setPassword(DEFAULT_PASSWORD);
    setErrorNotice(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        
        {/* Header Logo & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-3 text-3xl">
            📦
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Masuk ke Sistem Posko
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            Sistem Penyaluran Paket Bantuan Lapangan Darurat
          </p>
        </div>

        {/* Security Notice: In-Memory Storage (A.3) */}
        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
          <span className="text-sm mt-0.5">🛡️</span>
          <p className="text-[11px] leading-relaxed">
            <strong>In-Memory Session (ADR 0004):</strong> Token disimpan secara eksklusif di memori RAM dan tidak pernah di <code>localStorage</code> untuk memitigasi serangan XSS.
          </p>
        </div>

        {/* Error Alert */}
        {errorNotice && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Username Pengguna
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="pemohon-a / petugas-a / koordinator-a"
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Kata Sandi (Password)
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Default: {DEFAULT_PASSWORD}
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-sm transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Sistem →'}
          </button>
        </form>

        {/* Quick Fill Demo Helper */}
        <div className="pt-5 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center mb-3">
            Pilih Cepat Akun Demonstrasi (Satu-Klik Isi Form):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('pemohon-a')}
              className={`p-2 text-center rounded-lg border text-xs transition ${
                username === 'pemohon-a'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block font-medium">Pemohon</span>
              <span className="text-[10px] text-slate-400 font-mono">pemohon-a</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('petugas-a')}
              className={`p-2 text-center rounded-lg border text-xs transition ${
                username === 'petugas-a'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block font-medium">Petugas</span>
              <span className="text-[10px] text-slate-400 font-mono">petugas-a</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('koordinator-a')}
              className={`p-2 text-center rounded-lg border text-xs transition ${
                username === 'koordinator-a'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block font-medium">Koordinator</span>
              <span className="text-[10px] text-slate-400 font-mono">koordinator-a</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
