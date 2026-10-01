// clients/web/src/api/demoStore.js
// Sinkronisasi status alokasi dinamis antara Koordinator, Petugas Lapangan, dan Pemohon

const STATUS_KEY = 'bantuan_demo_status_overrides';
const ALLOCATIONS_KEY = 'bantuan_demo_allocations';

export const demoStore = {
  getStatusOverrides() {
    try {
      const raw = localStorage.getItem(STATUS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  setStatusOverride(requestId, status) {
    try {
      const current = this.getStatusOverrides();
      current[requestId] = status;
      localStorage.setItem(STATUS_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Failed to set status override', e);
    }
  },

  getAllocations() {
    try {
      const raw = localStorage.getItem(ALLOCATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addAllocation(reqItem, officerSubject = 'petugas-a', packageCode = 'LOG-SEMBAKO-001') {
    try {
      const list = this.getAllocations();
      // Periksa apakah permohonan ini sudah punya alokasi sebelumnya
      const existing = list.find((d) => d.requestId === reqItem.id);
      if (existing) {
        existing.fieldOfficerSubject = officerSubject;
        existing.distributionStatus = 'assigned';
        localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(list));
        this.setStatusOverride(reqItem.id, 'allocated');
        return existing;
      }

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const newDistribution = {
        id: `dst_${randomSuffix}`,
        requestId: reqItem.id,
        packageId: packageCode === 'LOG-MEDIS-001' ? 'pkg_55Mk91b' : 'pkg_44Lk90a',
        packageCode: packageCode,
        fieldOfficerId: officerSubject === 'petugas-a' ? 'ofc_55xYz12' : 'ofc_66zZa34',
        fieldOfficerSubject: officerSubject,
        distributionStatus: 'assigned',
        allocatedAt: new Date().toISOString(),
        applicantName: reqItem.applicantName || 'Warga Penerima',
        applicantNationalId: reqItem.applicantNationalId || '',
        targetLocation: reqItem.targetLocation || 'Posko Pengungsian',
        requiredPackageType: reqItem.requiredPackageType || 'family_food_pack'
      };

      list.unshift(newDistribution);
      localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(list));
      this.setStatusOverride(reqItem.id, 'allocated');
      return newDistribution;
    } catch (e) {
      console.error('Failed to add allocation', e);
      return null;
    }
  },

  updateAllocationStatus(distId, newStatus) {
    try {
      const list = this.getAllocations();
      const match = list.find((d) => d.id === distId);
      if (match) {
        match.distributionStatus = newStatus;
        localStorage.setItem(ALLOCATIONS_KEY, JSON.stringify(list));
        if (newStatus === 'handed_over' && match.requestId) {
          this.setStatusOverride(match.requestId, 'completed');
        }
      }
    } catch (e) {
      console.error('Failed to update allocation status', e);
    }
  }
};
