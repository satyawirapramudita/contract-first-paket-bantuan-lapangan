// service/src/auth/ownership.js
// Layer 3: answers "may this principal access this object?".
// Rules are readable here without reading the handlers.

const distributionsStore = require('../store/distributions');

// GET /v1/assistance-requests/{requestId}
async function mayReadRequest(principal, request) {
  if (request.applicant_subject === principal.subject) return true;
  if (principal.scopes.includes('requests:review')) return true;
  if (
    principal.scopes.includes('handovers:write') ||
    principal.scopes.includes('distributions:read')
  ) {
    return distributionsStore.existsForRequestAndOfficer(request.id, principal.subject);
  }
  return false;
}

// GET /v1/distributions/{distributionId}
function mayReadDistribution(principal, distribution) {
  if (distribution.field_officer_subject === principal.subject) return true;
  if (principal.scopes.includes('requests:review')) return true;
  if (principal.kind === 'service') return true; // job rekonsiliasi membaca semua
  return false;
}

// POST /v1/handovers
function mayHandover(principal, distribution) {
  return distribution.field_officer_subject === principal.subject;
}

module.exports = { mayReadRequest, mayReadDistribution, mayHandover };
