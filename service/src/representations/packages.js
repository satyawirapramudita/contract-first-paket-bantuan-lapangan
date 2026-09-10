function toPackage(row) {
  return {
    id: row.id,
    packageCode: row.package_code,
    packageType: row.package_type,
    preparationStatus: row.preparation_status,
    warehouseLocation: row.warehouse_location ?? undefined,
    readyAt: row.ready_at,
  };
}
module.exports = { toPackage };
