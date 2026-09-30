// clients/web/src/api/client.js
// Single module owning the base URL, auth token injection, Problem Details parsing,
// ETag bookkeeping across polls, and 401/403/404/412 handling.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ETag storage across re-renders & poll cycles (A.7)
const etagStore = new Map();

let getAccessToken = () => null;
let onUnauthorized = () => {};

export function configureApiAuth(tokenGetter, unauthorizedHandler) {
  getAccessToken = tokenGetter;
  onUnauthorized = unauthorizedHandler;
}

/**
 * Universal API Request Handler
 */
export async function apiRequest(endpoint, {
  method = 'GET',
  body = null,
  headers = {},
  idempotencyKey = null,
  isPoll = false,
  ifMatch = null
} = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const requestHeaders = new Headers(headers);

  // 1. Attach credentials in one place (A.3)
  const token = getAccessToken();
  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  // 2. Attach Idempotency-Key on writes (A.6)
  if (idempotencyKey) {
    requestHeaders.set('Idempotency-Key', idempotencyKey);
  }

  // 3. Attach If-None-Match on polls (A.7)
  if (isPoll && etagStore.has(url)) {
    requestHeaders.set('If-None-Match', etagStore.get(url));
  }

  // 4. Attach If-Match on conditional writes (A.8)
  if (ifMatch) {
    requestHeaders.set('If-Match', ifMatch);
  }

  if (body && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : null
    });

    // Handle 304 Not Modified (A.7)
    if (response.status === 304) {
      return { status: 304, notModified: true };
    }

    // Save ETag if returned
    const returnedETag = response.headers.get('ETag');
    if (returnedETag) {
      etagStore.set(url, returnedETag);
    }

    // Handle 401 Unauthorized (A.3)
    if (response.status === 401) {
      onUnauthorized(); // Clears session & redirects with return URL
      throw { status: 401, type: 'unauthorized', message: 'Sesi telah kedaluwarsa. Silakan masuk kembali.' };
    }

    // Parse Response (JSON / Problem Details)
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      // Return normalized Problem Details object (A.6)
      throw {
        status: response.status,
        type: data?.type || 'unknown-error',
        title: data?.title || 'Terjadi Kesalahan',
        detail: data?.detail || `Permintaan gagal dengan status ${response.status}`,
        invalidFields: data?.invalidFields || [], // Array of validation errors
        raw: data,
        etag: returnedETag
      };
    }

    return { status: response.status, data, etag: returnedETag };
  } catch (err) {
    if (err.status) throw err;
    // Network dropped / CORS error
    throw {
      status: 0,
      type: 'network-error',
      title: 'Koneksi Gagal',
      detail: 'Gagal terhubung ke posko server. Periksa jaringan Anda.',
      isNetworkError: true
    };
  }
}

// Domain-specific helper operations
export const api = {
  // Assistance Requests
  listRequests: (params = '') => apiRequest(`/v1/assistance-requests${params}`),
  getRequest: (id) => apiRequest(`/v1/assistance-requests/${id}`),
  createRequest: (data, idempotencyKey) => apiRequest('/v1/assistance-requests', {
    method: 'POST',
    body: data,
    idempotencyKey
  }),

  // Distributions
  listDistributions: (isPoll = false) => apiRequest('/v1/distributions', { isPoll }),
  getDistribution: (id) => apiRequest(`/v1/distributions/${id}`),

  // Handovers (A.8 Conditional Write)
  confirmHandover: (data, idempotencyKey, ifMatch) => apiRequest('/v1/handovers', {
    method: 'POST',
    body: data,
    idempotencyKey,
    ifMatch
  }),

  // Packages
  listPackages: () => apiRequest('/v1/packages')
};
