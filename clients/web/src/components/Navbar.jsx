// clients/web/src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { session, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                Posko Bantuan Lapangan
              </span>
            </Link>

            {/* Role-based Navigation Links */}
            {session && (
              <nav className="hidden md:flex items-center gap-1">
                {session.role === 'pemohon' && (
                  <>
                    <Link
                      to="/requests"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive('/requests')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Riwayat Permohonan
                    </Link>
                    <Link
                      to="/requests/new"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive('/requests/new')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      + Ajukan Bantuan
                    </Link>
                  </>
                )}

                {session.role === 'petugas-lapangan' && (
                  <Link
                    to="/distributions"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                      isActive('/distributions')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Daftar Distribusi Lapangan
                  </Link>
                )}

                {session.role === 'koordinator' && (
                  <>
                    <Link
                      to="/coordinator/requests"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive('/coordinator/requests')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Monitoring Seluruh Permohonan
                    </Link>
                    <Link
                      to="/coordinator/packages"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive('/coordinator/packages')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Inventaris Paket Gudang
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* User Session & Logout */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">
                    {session.username}
                  </div>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Role: {session.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-md transition"
                  title="Keluar dari sesi memori"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Masuk / Pilih Akun Demo
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
