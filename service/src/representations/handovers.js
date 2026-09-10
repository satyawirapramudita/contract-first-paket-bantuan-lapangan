function toHandover(row) {
  return {
    id: row.id,
    distributionId: row.distribution_id,
    recipientNationalId: row.recipient_national_id,
    fieldOfficerId: row.field_officer_id ?? undefined,
    handedOverAt: row.handed_over_at,
    status: row.status,
    recipientNotes: row.recipient_notes ?? null,
  };
}
module.exports = { toHandover };
