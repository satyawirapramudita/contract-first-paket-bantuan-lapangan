// service/src/representations/assistanceRequests.js
// Maps a database row to the AssistanceRequest schema from openapi.yaml.
// Internal columns (e.g. required_package_type internal name) never leak here.

function toAssistanceRequest(row) {
  return {
    id: row.id,
    applicantNationalId: row.applicant_national_id,
    applicantName: row.applicant_name,
    familyMemberCount: row.family_member_count ?? undefined,
    status: row.status,
    urgency: row.urgency,
    targetLocation: row.target_location ?? undefined,
    requestedAt: row.requested_at,
    requiredPackageType: row.required_package_type ?? undefined,
  };
}

module.exports = { toAssistanceRequest };
