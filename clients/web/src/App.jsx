// clients/web/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';

// Pemohon Pages (Workflow 1)
import { RequestList } from './pages/pemohon/RequestList';
import { RequestCreate } from './pages/pemohon/RequestCreate';
import { RequestDetail } from './pages/pemohon/RequestDetail';

// Petugas Lapangan Pages (Workflow 2)
import { DistributionList } from './pages/petugas/DistributionList';
import { HandoverConfirm } from './pages/petugas/HandoverConfirm';

// Koordinator Pages (Workflow 3)
import { CoordinatorRequests } from './pages/koordinator/CoordinatorRequests';
import { PackageInventory } from './pages/koordinator/PackageInventory';

function ProtectedRoute({ children }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    // A.1 / Checklist 1: Belum login diarahkan ke login dengan state asal
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

function HomeRedirect() {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;

  if (session.role === 'petugas-lapangan') return <Navigate to="/distributions" replace />;
  if (session.role === 'koordinator') return <Navigate to="/coordinator/requests" replace />;
  return <Navigate to="/requests" replace />;
}

export function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Workflow 1: Pemohon */}
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/new"
            element={
              <ProtectedRoute>
                <RequestCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/:id"
            element={
              <ProtectedRoute>
                <RequestDetail />
              </ProtectedRoute>
            }
          />

          {/* Workflow 2: Petugas Lapangan */}
          <Route
            path="/distributions"
            element={
              <ProtectedRoute>
                <DistributionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributions/:id"
            element={
              <ProtectedRoute>
                <DistributionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributions/:id/handover"
            element={
              <ProtectedRoute>
                <HandoverConfirm />
              </ProtectedRoute>
            }
          />

          {/* Workflow 3: Koordinator Posko */}
          <Route
            path="/coordinator/requests"
            element={
              <ProtectedRoute>
                <CoordinatorRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coordinator/packages"
            element={
              <ProtectedRoute>
                <PackageInventory />
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="p-12 text-center">
                <h2 className="text-xl font-bold text-slate-800">404 - Halaman Tidak Ditemukan</h2>
                <p className="text-sm text-slate-500 mt-2">Alamat URL yang Anda tuju tidak tersedia.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white">
        Sistem Penyaluran Paket Bantuan Lapangan &copy; 2026 Course Platform-Based Software Engineering
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
