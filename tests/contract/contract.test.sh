#!/bin/bash
# =============================================================
# Contract Conformance Test — Field Aid Package Distribution
# =============================================================
# Usage:
#   BASE_URL=http://localhost:3000 bash tests/contract/contract.test.sh
#
# The test checks that the running service behaves as documented
# in openapi.yaml. A failure here means the implementation has
# drifted from the spec — fix the implementation, not the spec.

BASE=${BASE_URL:-http://localhost:3000}
PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"
  if [ "$actual" -eq "$expected" ]; then
    echo "  ✓ $desc (HTTP $actual)"
    PASS=$((PASS+1))
  else
    echo "  ✗ $desc — expected HTTP $expected, got HTTP $actual"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "=== Contract Conformance Tests ==="
echo "Base URL: $BASE"
echo ""

# --- Health ---
echo "[ Health ]"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
check "GET /health → 200" 200 "$STATUS"

# --- GET /v1/assistance-requests (collection) ---
echo ""
echo "[ GET /v1/assistance-requests ]"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests")
check "GET collection → 200" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests?status=approved")
check "GET collection with valid status filter → 200" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests?urgency=high")
check "GET collection with valid urgency filter → 200" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests?status=INVALID_STATUS")
check "GET collection with invalid status → 400" 400 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests?limit=0")
check "GET collection with limit=0 (below minimum) → 400" 400 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests?limit=101")
check "GET collection with limit=101 (above maximum) → 400" 400 "$STATUS"

# --- GET /v1/assistance-requests/:id ---
echo ""
echo "[ GET /v1/assistance-requests/:requestId ]"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests/req_7Kq91Ab")
check "GET single entity (seed data) → 200" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests/req_ZZZZZZZ")
check "GET single entity (not found) → 404" 404 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/assistance-requests/invalid-format")
check "GET single entity (malformed ID) → 400" 400 "$STATUS"

# --- GET /v1/packages ---
echo ""
echo "[ GET /v1/packages ]"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/packages")
check "GET packages collection → 200" 200 "$STATUS"

# --- GET /v1/distributions ---
echo ""
echo "[ GET /v1/distributions ]"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/distributions")
check "GET distributions collection → 200" 200 "$STATUS"

# --- POST /v1/assistance-requests ---
echo ""
echo "[ POST /v1/assistance-requests ]"
KEY=$(node -e "console.log(require('crypto').randomUUID())" 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())" 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null || echo "00000000-0000-4000-8000-000000000001")

STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/assistance-requests" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"applicantNationalId":"1234567890000001","applicantName":"Contract Test User","familyMemberCount":2,"targetLocation":"Test Location","requiredPackageType":"family_food_pack"}')
check "POST valid body + valid Idempotency-Key → 201" 201 "$STATUS"

# Same request twice — must return 201 with same body
STATUS2=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/assistance-requests" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{"applicantNationalId":"1234567890000001","applicantName":"Contract Test User","familyMemberCount":2,"targetLocation":"Test Location","requiredPackageType":"family_food_pack"}')
check "POST same key + same body (idempotent retry) → 201" 201 "$STATUS2"

# Missing Idempotency-Key
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/assistance-requests" \
  -H "Content-Type: application/json" \
  -d '{"applicantNationalId":"1234567890000002","applicantName":"No Key User","familyMemberCount":1,"targetLocation":"Loc","requiredPackageType":"family_food_pack"}')
check "POST missing Idempotency-Key → 400" 400 "$STATUS"

# Malformed Idempotency-Key
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/assistance-requests" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: not-a-uuid" \
  -d '{"applicantNationalId":"1234567890000003","applicantName":"Bad Key User","familyMemberCount":1,"targetLocation":"Loc","requiredPackageType":"family_food_pack"}')
check "POST malformed Idempotency-Key → 400" 400 "$STATUS"

# Missing required field
KEY2=$(node -e "console.log(require('crypto').randomUUID())" 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/assistance-requests" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY2" \
  -d '{"applicantNationalId":"1234567890000004"}')
check "POST missing required fields → 400" 400 "$STATUS"

# Invalid enum value
KEY3=$(node -e "console.log(require('crypto').randomUUID())" 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/assistance-requests" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY3" \
  -d '{"applicantNationalId":"1234567890000005","applicantName":"Enum Test","familyMemberCount":1,"targetLocation":"Loc","requiredPackageType":"INVALID_TYPE"}')
check "POST invalid enum value → 400" 400 "$STATUS"

# --- POST /v1/handovers ---
echo ""
echo "[ POST /v1/handovers ]"
HKEY=$(node -e "console.log(require('crypto').randomUUID())" 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/handovers" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $HKEY" \
  -d '{"distributionId":"dst_NOTEXIST","recipientNationalId":"9999999999999999","handedOverAt":"2026-09-10T10:00:00+07:00","fieldOfficerId":"ofc_TEST001"}')
check "POST handover with non-existent distributionId → 404" 404 "$STATUS"

HKEY2=$(node -e "console.log(require('crypto').randomUUID())" 2>/dev/null || python3 -c "import uuid; print(uuid.uuid4())")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE/v1/handovers" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $HKEY2" \
  -d '{"distributionId":"dst_88bAa99","recipientNationalId":"3578021203920003","handedOverAt":"2026-09-10T10:00:00+07:00","fieldOfficerId":"ofc_55xYz12"}')
# dst_88bAa99 from seed data should be in_transit → 201
check "POST handover with valid seed distribution → 201" 201 "$STATUS"

# --- Summary ---
echo ""
echo "=============================="
echo "Results: $PASS passed, $FAIL failed"
echo "=============================="
if [ "$FAIL" -gt 0 ]; then
  echo "FAIL — fix the implementation, not the spec."
  exit 1
else
  echo "PASS — all contract checks passed."
  exit 0
fi
