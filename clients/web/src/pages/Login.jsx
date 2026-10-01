// clients/web/src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const DEMO_ACCOUNTS = [
  {
    username: 'pemohon-a',
    name: 'Warga Pemohon A',
    role: 'pemohon',
    scopes: ['requests:read', 'requests:write'],
    purpose: 'Workflow 1 (Pengajuan & Pemantauan) + Uji Serangan Konsol (A.9)',
    color: 'border-blue-200 hover:border-blue-400 bg-blue-50/50'
  },
  {
    username: 'petugas-a',
    name: 'Petugas Lapangan A',
    role: 'petugas-lapangan',
    scopes: ['requests:read', 'distributions:read', 'handovers:write'],
    purpose: 'Workflow 2 (Handover Paket) + Uji Konflik Tulis 412 di Dua Jendela',
    color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/50'
  },
  {
    username: 'koordinator-a',
    name: 'Koordinator Posko A',
    role: 'koordinator',
    scopes: ['requests:read', 'requests:review', 'packages:read', 'distributions:read'],
    purpose: 'Workflow 3 (Monitoring Seluruh Permohonan & Inventaris Gudang)',
    color: 'border-purple-200 hover:purple-400 bg-purple-50/50'
  }
];

export function Login() {
  const { loginAs } = useAuth();
  const [selectedUser, setSelectedUser] = useState(DEMO_ACCOUNTS[0].username);
  const [password, setPassword] = useState('LabOnly2026!');
  const [manualToken, setManualToken] = useState('');
  const [showManualToken, setShowManualToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);

  const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'https://bantuan-auth.up.railway.app';

  const handleLogin = async (account) => {
    setLoading(true);
    setErrorNotice(null);

    const targetAccount = account || DEMO_ACCOUNTS.find(a => a.username === selectedUser);

    try {
      // 1. Coba request token nyata ke Keycloak IdP (Direct Access Grants via client test-cli)
      const tokenEndpoint = `${keycloakUrl}/realms/bantuan-lapangan/protocol/openid-connect/token`;
      const bodyParams = new URLSearchParams({
        grant_type: 'password',
        client_id: 'test-cli',
        username: targetAccount.username,
        password: password,
        scope: targetAccount.scopes.join(' ')
      });

      let token = null;

      try {
        const res = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        });

        if (res.ok) {
          const data = await res.json();
          token = data.access_token;
        }
      } catch (kcErr) {
        // Keycloak unreachable / offline fallback
      }

      // Jika ada manual token diisi
      if (manualToken.trim()) {
        token = manualToken.trim();
      }

      // Simpan session ke memori (A.3: in-memory state, tidak ada di localStorage)
      loginAs({
        username: targetAccount.username,
        name: targetAccount.name,
        role: targetAccount.role,
        scopes: targetAccount.scopes,
        token: token || 'demo-in-memory-token'
      });
    } catch (err) {
      setErrorNotice('Gagal melakukan autentikasi: ' + (err.message || 'Periksa server auth'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center">
          <span className="text-4xl">🏛️</span>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            Masuk ke Sistem Bantuan Lapangan
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Pilih salah satu akun uji demonstrasi Session 7 di bawah ini untuk memulai.
          </p>
        </div>

        {/* Info Banner: In-Memory Session Storage (A.3) */}
        <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-blue-800">
            <span>🛡️</span> Keputusan Keamanan Sesi (ADR 0004 / A.3 item 5)
          </div>
          <p>
            Access token disimpan secara eksklusif di dalam <strong>in-memory React state</strong> dan tidak pernah disimpan di <code>localStorage</code> atau <code>sessionStorage</code> guna mencegah eksfiltrasi token melalui serangan XSS.
          </p>
        </div>

        {errorNotice && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {errorNotice}
          </div>
        )}

        {/* Demo Account Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pilih Akun Demonstrasi (Satu-Klik):
          </label>
          <div className="grid grid-cols-1 gap-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => {
                  setSelectedUser(acc.username);
                  handleLogin(acc);
                }}
                disabled={loading}
                className={`w-full p-4 text-left border rounded-xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${acc.color}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{acc.username}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white font-medium text-slate-700 border border-slate-200">
                      {acc.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {acc.purpose}
                  </div>
                </div>
                <div className="text-xs font-semibold text-blue-600 self-end sm:self-center">
                  Masuk Sebagai Ini →
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form detail & token manual collapsible */}
        <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span>Password akun uji default: <code>LabOnly2026!</code></span>
            <button
              type="button"
              onClick={() => setShowManualToken(!showManualToken)}
              className="text-blue-600 hover:underline"
            >
              {showManualToken ? 'Sembunyikan Opsi Token Manual' : 'Opsi Lanjutan (Manual JWT)'}
            </button>
          </div>

          {showManualToken && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Tempel Bearer JWT Token Secara Manual (Opsional):
              </label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                rows={3}
                placeholder="eyJh..."
                className="w-full p-2 border border-slate-300 rounded-md font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => handleLogin()}
                disabled={loading}
                className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-medium hover:bg-slate-900"
              >
                Masuk dengan Token Manual
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
