// clients/web/src/components/ViewStateWrapper.jsx
import React from 'react';

/**
 * State:
 * - loading: skeleton placeholder
 * - empty: explicit domain explanation
 * - error: Problem details + retry control
 * - content: data display + stale marker if background sync fails
 */
export function ViewStateWrapper({
  state, // { kind: 'loading' | 'empty' | 'error' | 'content', problem?, items?, stale?, fetchedAt? }
  onRetry,
  emptyMessage = 'Tidak ada data yang tersedia.',
  skeletonCount = 3,
  children
}) {
  if (state.kind === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-lg border border-slate-200 p-4"></div>
        ))}
      </div>
    );
  }

  if (state.kind === 'empty') {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  if (state.kind === 'error') {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <span className="text-xl">⚠️</span>
          <h4>{state.problem?.title || 'Gagal Memuat Data'}</h4>
        </div>
        <p className="text-sm text-rose-700">{state.problem?.detail}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-medium transition"
          >
            Coba Muat Ulang
          </button>
        )}
      </div>
    );
  }

  if (state.kind === 'content') {
    return (
      <div>
        {state.stale && (
          <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex justify-between items-center">
            <span>
              Menampilkan data per {state.fetchedAt?.toLocaleTimeString()}. Menghubungkan kembali ke server posko...
            </span>
            <span className="animate-spin">🔄</span>
          </div>
        )}
        {children}
      </div>
    );
  }

  return null;
}
