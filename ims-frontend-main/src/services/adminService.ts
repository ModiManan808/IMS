import api from '../config/api';

export interface AdminDecisionRequest {
  id: number;
  decision: 'Approved' | 'Rejected' | 'Special Approval Required';
  rejectionReason?: string;
  specialApprovalNotes?: string;
}

export interface AdminOnboardRequest {
  id: number;
  applicationNo: string;
  dateOfJoining: string;
  dateOfLeaving: string;
}

export interface LOIVerificationRequest {
  id: number;
  loiVerified: 'Pending' | 'Verified' | 'Rejected';
  loiVerificationNotes?: string;
}

export const adminService = {
  getFreshApplications: async (q?: string) => {
    return api.get('/admin/dashboard/fresh', {
      params: q?.trim() ? { q: q.trim() } : undefined,
    });
  },

  getPendingApplications: async (q?: string) => {
    return api.get('/admin/dashboard/pending', {
      params: q?.trim() ? { q: q.trim() } : undefined,
    });
  },

  getOngoingInterns: async (q?: string) => {
    return api.get('/admin/dashboard/ongoing', {
      params: q?.trim() ? { q: q.trim() } : undefined,
    });
  },

  getRejectedApplications: async (q?: string) => {
    return api.get('/admin/dashboard/rejected', {
      params: q?.trim() ? { q: q.trim() } : undefined,
    });
  },

  getCompletedInterns: async (q?: string) => {
    return api.get('/admin/dashboard/completed', {
      params: q?.trim() ? { q: q.trim() } : undefined,
    });
  },

  decideOnFresh: async (data: AdminDecisionRequest) => {
    return api.post('/admin/decision', data);
  },

  finalizeOnboarding: async (data: AdminOnboardRequest) => {
    return api.post('/admin/onboard', data);
  },

  verifyLOI: async (data: LOIVerificationRequest) => {
    return api.post('/admin/verify-loi', data);
  },

  getInternDetails: async (id: number) => {
    return api.get(`/admin/intern/${id}`);
  },

  getReportStatistics: async () => {
    return api.get('/admin/reports/statistics');
  },
  updateInternDates: async (data: { id: number; dateOfLeaving: string }) => {
    return api.put('/admin/update-dates', data);
  },
};
