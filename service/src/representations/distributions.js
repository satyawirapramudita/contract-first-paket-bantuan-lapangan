function toDistribution(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    packageId: row.package_id,
    fieldOfficerId: row.field_officer_id,
    distributionStatus: row.distribution_status,
    allocatedAt: row.allocated_at,
  };
}
module.exports = { toDistribution };
